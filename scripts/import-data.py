#!/usr/bin/env python3
"""Import the supplied v4 workbook and method into the static Pavement Atlas.

Read-only input processing. Requires openpyxl and python-docx. Run from any folder:
  python scripts/import-data.py --source-dir ..
No historical AIR/v3/v5 scores or website metadata are imported as current scores.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import date, datetime
import hashlib
import json
from pathlib import Path
import re
import shutil

from docx import Document
from openpyxl import load_workbook

VERSION = "4.0"
WORKBOOK = "Compared_All_Platforms_TH_v4.0.xlsx"
DOCUMENT = "Compared_All_Platforms_TH_v4.0.docx"
DOMAINS = ["A", "L", "D", "C", "R", "M"]
COLORS = ["#2f6680", "#746896", "#557d77", "#8b773e", "#956146", "#5b7c95"]
CORE = ["A1", "A2", "A3", "L1", "L2", "L4", "D1", "D2", "D4", "C1", "C2", "R1", "R2", "M1", "M2", "M5"]
EMPTY = {"", "NR", "NA", "N/A", "UNK", "None", "Not reported"}
COUNTRY_POINTS = {"China": (35,103), "United States": (38,-97), "India": (21,78), "Bangladesh": (23.7,90.4),
    "Indonesia": (-2.5,118), "Brazil": (-14,-52), "Japan": (36.2,138.2), "Poland": (52,19), "Canada": (58,-103),
    "Czech Republic": (49.8,15.5), "South Africa": (-29,24), "Iran": (32.4,53.7), "Norway": (61,8),
    "United Kingdom": (54,-2), "Pakistan": (30.4,69.3), "Iraq": (33.2,43.7), "Morocco": (31.8,-7),
    "Germany": (51,10), "Malaysia": (4.2,102), "Nigeria": (9.1,8.7), "Colombia": (4.5,-73), "Spain": (40,-3.7),
    "Romania": (45.9,25), "Ecuador": (-1.5,-78.5), "Austria": (47.5,14.5), "Hong Kong SAR": (22.3,114.2),
    "Finland": (64,26), "Italy": (42.8,12.5), "Turkey": (39,35), "Australia": (-25,134), "Mexico": (23.6,-102.5),
    "Switzerland": (46.8,8.2), "Singapore": (1.35,103.8)}


def serial(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def clean(value):
    value = str(value or "").strip()
    return "" if value in EMPTY else value


def split(value):
    return list(dict.fromkeys(clean(s) for s in re.split(r";|\s\|\s", clean(value)) if clean(s)))


def safe_url(value):
    match = re.search(r"https?://[^\s<>\"\[\]]+", clean(value))
    return match.group().rstrip(";,.|") if match else ""


def countries_for(row, v3):
    text = clean(v3.get("Country")) if v3 else clean(row.get("Geography"))
    if text.startswith("NR") or "not verified" in text.lower(): return []
    result = [country for country in COUNTRY_POINTS if re.search(r"\b"+re.escape(country)+r"\b", text, re.I)]
    for country, pattern in [("United States", r"\bUS\b|\bUSA\b"), ("United Kingdom", r"\bUK\b"),
                             ("Turkey", r"\bTurkiye\b|\bTürkiye\b"), ("Germany", r"\bGerman\b")]:
        if re.search(pattern, text) and country not in result: result.append(country)
    return result


def rows(workbook, sheet):
    ws = workbook[sheet]
    values = list(ws.iter_rows(values_only=True))
    headers = values[4]
    return [{**{str(k): serial(v) for k, v in zip(headers, row) if k is not None}, "_row": i}
            for i, row in enumerate(values[5:], 6) if row[0] is not None]


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def tasks_for(row, v3, av):
    text = " ; ".join([clean(row.get("Task / target scope")), clean(v3.get("Reported_AI_Tasks")),
                     clean(v3.get("Annotation_Task_Type")), clean(row.get("Labels / targets")),
                     clean(row.get("Annotation format")), clean(av.get("AV / ADAS relationship"))]).lower().replace("_", " ")
    # Negated target descriptions are limitations, not positive task evidence.
    text = re.sub(r"\b(?:no|not|without)\b[^;|.]*", " ", text)
    rules = [("Object detection", r"object detection|crack detection|damage detection|distress detection|bounding|\bbbox\b|\bcuboids\b|\byolo\b"), ("Semantic segmentation", r"semantic|pixel|(?<!instance )segmentation|\bmasks\b"),
             ("Instance segmentation", r"instance segmentation"), ("Severity assessment", r"severity"),
             ("Multimodal / fusion", r"multimodal|fusion"),
             ("Classification", r"classification|class-folder"), ("Condition prediction", r"regression|condition prediction|roughness"),
             ("Localization / mapping", r"locali[sz]ation|mapping|slam|pose estimation"), ("Driving / planning", r"planning|end.to.end|trajectory"),
             ("Anomaly detection", r"anomaly detection")]
    result = [label for label, pattern in rules if re.search(pattern, text)]
    if not result and re.fullmatch(r"detection", clean(row.get("Task / target scope")), re.I): result = ["Object detection"]
    return result


def modalities_for(row, v3, av):
    # Only explicit source descriptions are used; unknown imagery is not assumed RGB.
    text = " ".join(str(v or "") for v in [row.get("Media"), row.get("Capture context"), av.get("Camera / footage details"),
        v3.get("Dataset_Scale_Type"), v3.get("Other_Sensors"), v3.get("Camera_Type")]).lower()
    result = []
    for label, pattern in [("Images (color unspecified)", r"imag|camera|photo|jpg|rgb"), ("Video / frames", r"video|sequence|footage|mp4"),
                           ("LiDAR / point cloud", r"lidar|point cloud"), ("Radar", r"radar"),
                           ("GPS / IMU telemetry", r"gnss|gps|imu|inertial|accelerom"),
                           ("Stereo / depth", r"depth|stereo|disparity"), ("Infrared / thermal", r"infrared|thermal"),
                           ("GPR / subsurface", r"gpr|ground.penetrating"), ("Engineering records", r"engineering|iri|pci")]:
        if re.search(pattern, text): result.append(label)
    if "Images (color unspecified)" in result and re.search(r"\brgb\b|colou?r camera|colou?r imag", text):
        result[result.index("Images (color unspecified)")] = "RGB imagery"
    if "Images (color unspecified)" in result and re.search(r"grayscale|greyscale|monochrome", text):
        result[result.index("Images (color unspecified)")] = "Grayscale imagery"
    if v3.get("LiDAR_Availability") == "Y" and "LiDAR / point cloud" not in result: result.append("LiDAR / point cloud")
    if v3.get("GPS_or_Geolocation") == "Y" and "GPS / IMU telemetry" not in result: result.append("GPS / IMU telemetry")
    return result


def sources_for(row, v3):
    text = " ".join(clean(v) for v in [row.get("Capture context"), v3.get("Acquisition_Platform"), v3.get("Vehicle_Type")]).lower()
    out = []
    for label, pattern in [("Vehicle camera", r"vehicle|dash|truck|car\b|driving|onboard|on-board|tesla|fleet|survey|line.scan|pavement imaging"),
                           ("Smartphone", r"smartphone|mobile.phone|cellphone"), ("UAV / drone", r"uav|drone|aerial"),
                           ("Handheld / fixed", r"handheld|hand.held|fixed.height|fixed camera"), ("Street view", r"street.view"),
                           ("Depth / LiDAR / IR", r"depth|stereo|laser|lidar|thermal|infrared"),
                           ("Web-compiled", r"aggregat|compiled|composite|scraped"), ("Research platform", r"robot"),
                           ("Synthetic", r"synthetic|simulat")]:
        if re.search(pattern, text): out.append(label)
    return out


def summary_states(checks):
    return " · ".join(f"{k} {v}" for k, v in Counter(c["Effective state"] for c in checks if c["Applicable (1/0)"]).items())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "data")
    args = parser.parse_args()
    source, out = args.source_dir.resolve(), args.output_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    if not (source / WORKBOOK).is_file() and (out / WORKBOOK).is_file(): source = out
    workbook = load_workbook(source / WORKBOOK, read_only=False, data_only=True)
    inventory = rows(workbook, "All_Datasets")
    grades = {r["Dataset ID"]: r for r in rows(workbook, "MCDM_Grades")}
    checks = defaultdict(list)
    for r in rows(workbook, "MCDM_Checks"): checks[r["Dataset ID"]].append(r)
    legacy = {r["Reconciled_Dataset_ID"]: r for r in rows(workbook, "Source_v3")}
    av_sources = {r["ID"]: r for r in rows(workbook, "Source_AV")}
    merges = rows(workbook, "Merge_Log")
    source_ids = defaultdict(list)
    for r in merges:
        if r["Source ID"] in av_sources: source_ids[r["Retained ID"]].append(r["Source ID"])
    rubric_rows = rows(workbook, "MCDM_Rubric")
    method = {r["Topic"]: r["Protocol"] for r in rows(workbook, "MCDM_Method")}
    settings = rows(workbook, "MCDM_Settings")[:6]
    rubric = {
        "version": VERSION, "date": "2026-10-12", "workbook": WORKBOOK, "document": DOCUMENT,
        "title": "Core documentation review", "coreCheckIds": CORE,
        "criteria": [{"key": key, "n": next(r["Domain name"] for r in rubric_rows if r["Domain"] == key),
                      "q": next(r["Definition"] for r in settings if r["Domain"] == key), "c": COLORS[i],
                      "checks": [[r["Check ID"], r["Criterion"], r["Definition"]]
                                 for r in rubric_rows if r["Domain"] == key and r["Role"] == "Core"]}
                     for i, key in enumerate(DOMAINS)],
        "profiles": {"labeled": {"n": "Labeled-16", "w": [100/6]*6, "m": [3,3,3,2,2,3], "activeChecks": 16},
                     "unlabeled": {"n": "Unlabeled-13", "w": [20,0,20,20,20,20], "m": [3,0,3,2,2,3], "activeChecks": 13}},
        "states": {"Y": "Cited evidence meets the check", "N": "Affirmative evidence of failure", "U": "Missing or insufficient evidence", "X": "Unresolved conflict"},
        "gates": [["G1", "Confirm the dataset and assessed release"], ["G2", "Assess fit for a declared task"],
                  ["G3", "Confirm intended-use rights and verified retrieval"], ["G4", "Audit leakage when benchmarking"]],
        "gate_note": method["Stage gates"], "method": method, "allChecks": rubric_rows,
        "formula": {"domainLower": "5*Y/m", "domainUpper": "5*(Y+U+X)/m", "resolved": "(Y+N)/m",
                    "indexLower": "100*sum(weight*Y/m)", "indexUpper": "100*sum(weight*(Y+U+X)/m)"},
        "interpretation": "Provisional documentation bounds, not quality ratings or confidence intervals. Compare within the same declared profile only.",
    }
    top = {r["Dataset ID"]: r for r in rows(workbook, "Top10_Review")}
    catalog = []
    mismatches = []
    for row in inventory:
        dataset_id = row["Dataset ID"]
        v3 = legacy.get(dataset_id, {})
        avs = [av_sources[key] for key in source_ids[dataset_id]]
        av = avs[0] if avs else {}
        grade = grades[dataset_id]
        ledger = checks[dataset_id]
        assert len(ledger) == 16 and {c["Check ID"] for c in ledger} == set(CORE), dataset_id
        profile_key = "unlabeled" if row["Profile"] == "Unlabeled-13" else "labeled"
        profile = rubric["profiles"][profile_key]
        state_strings, reasons, domain_scores = [], [], []
        for i, key in enumerate(DOMAINS):
            active = [c for c in ledger if c["Domain"] == key and c["Applicable (1/0)"] == 1]
            state = "".join(c["Effective state"] for c in active)
            assert all(s in "YNUX" for s in state), dataset_id
            m = len(state)
            assert m == profile["m"][i], dataset_id
            count = Counter(state)
            state_strings.append(state)
            reasons.append("\n\n".join(c["Check ID"] + " [" + c["Effective state"] + "]: " + str(c["AI rationale"] or "") for c in active))
            domain_scores.append({"key": key, "m": m, "Y": count["Y"], "N": count["N"], "U": count["U"], "X": count["X"],
                "lower": 5*count["Y"]/m if m else None, "upper": 5*(count["Y"]+count["U"]+count["X"])/m if m else None,
                "resolved": (count["Y"]+count["N"])/m if m else None})
        lower = sum(profile["w"][i]*d["lower"]/5 for i,d in enumerate(domain_scores) if d["m"])
        upper = sum(profile["w"][i]*d["upper"]/5 for i,d in enumerate(domain_scores) if d["m"])
        resolved = sum(profile["w"][i]*d["resolved"] for i,d in enumerate(domain_scores) if d["m"])
        for actual, expected in [(lower, grade["Lower /100"]), (upper, grade["Upper /100"]), (resolved, 100*grade["Resolved share"])]:
            if abs(actual-expected) > 1e-8: mismatches.append((dataset_id, actual, expected))
        urls = {}
        for label, field in [("GitHub", "GitHub_URL"), ("Data.gov", "DataGov_URL"), ("Mendeley Data", "Mendeley_Data_URL"),
                             ("Hugging Face", "HuggingFace_URL"), ("Zenodo", "Zenodo_URL"), ("Kaggle", "Kaggle_URL")]:
            if safe_url(v3.get(field)): urls[label] = safe_url(v3[field])
        platforms = split(row["Platforms"])
        if len(platforms) == 1: urls[platforms[0]] = safe_url(row["Primary URL"])
        urls["Assessed release"] = safe_url(row["Primary URL"])
        year = clean(av.get("Release / paper year")) or clean(v3.get("Publication_Year"))
        year_basis = "Source_AV release / paper year" if clean(av.get("Release / paper year")) else "Source_v3 publication year"
        if not year:
            year = clean(row["Assessed release"])
            year_basis = "Year explicitly present in assessed-release description"
        year_match = re.search(r"\b(19|20)\d{2}\b", year)
        viewpoint_evidence = " ".join(clean(v) for v in [v3.get("Camera_Position"), row.get("Capture context"), av.get("Camera / footage details")])
        viewpoint = "Not reported"
        if re.search(r"top.down|nadir|downward.facing", viewpoint_evidence, re.I): viewpoint = "Nadir / top-down"
        if re.search(r"forward.facing|front.facing|oblique|forward camera|front perspective|front/windshield|forward/perspective", viewpoint_evidence, re.I): viewpoint = "Forward-facing / oblique"
        annotations = {"bb": v3.get("Bounding_Boxes") == "Y", "sm": v3.get("Segmentation_Masks") == "Y",
                       "cl": v3.get("Classification_Labels") == "Y", "sv": v3.get("Severity_Labels") == "Y", "pg": v3.get("Polygons") == "Y"}
        annotation_text = clean(row["Annotation format"]).lower()
        annotations["bb"] |= bool(re.search(r"bounding|boxes|bbox|yolo|pascal", annotation_text))
        annotations["sm"] |= bool(re.search(r"mask|semantic|pixel", annotation_text))
        annotations["cl"] |= bool(re.search(r"class.folder|classification", annotation_text))
        screening = clean(v3.get("Screening_Decision")).replace("Include-", "").replace("Include", "Included")
        record = {
            "id": dataset_id, "n": row["Dataset / release"], "alt": clean(v3.get("Alternate_Dataset_Names")),
            "plats": platforms, "url": safe_url(row["Primary URL"]), "urls": urls, "doi": clean(v3.get("DOI_or_Persistent_ID")),
            "yr": int(year_match.group()) if year_match else None, "yearBasis": year_basis if year_match else "Not reported", "ctrys": countries_for(row, v3),
            "img": clean(row["Reported size and unit"]), "res": clean(v3.get("Image_Resolution")) or clean(v3.get("Video_Resolution")),
            "odc": clean(v3.get("Original_Derived_or_Compiled")), "mir": v3.get("Repository_Mirror") == "Y",
            "tasks": tasks_for(row, v3, av), "srcs": sources_for(row, v3), "mods": modalities_for(row, v3, av),
            "dst": clean(v3.get("Distress_Types")) or clean(row["Labels / targets"]),
            "annT": clean(v3.get("Annotation_Task_Type")) or clean(row["Task / target scope"]), "annF": clean(row["Annotation format"]),
            "acq": clean(row["Capture context"]), "acc": {"Direct_Download": "Direct download", "Registration_Required": "Registration required", "Request_Required": "Request required"}.get(clean(row["Access route"]), clean(row["Access route"]).replace("_", " ")), "lic": clean(row["Stated terms"]),
            "scr": screening or "Reference candidate", "vp": clean(v3.get("Verification_Priority")),
            "confl": split(row["Conflicts / release issues"]), "pub": clean(v3.get("Publication_Citation")) or clean(row["Evidence URL"]),
            "notes": clean(row["Evidence basis"]), "lim": clean(row["Limitations"]), "parent": clean(v3.get("Parent_Dataset")),
            "rel": clean(row["Related-release flags"]), "ann": annotations,
            "view": viewpoint, "viewEvidence": viewpoint_evidence, "vtd": "Yes" if viewpoint == "Nadir / top-down" else "Unknown", "vff": "Yes" if viewpoint == "Forward-facing / oblique" else "Unknown",
            "vother": "", "vmount": clean(row["Capture context"]), "vq": "", "vsrc": "v4 workbook evidence ledger",
            "vurl": safe_url(row["Evidence URL"]), "vconf": "Not independently verified", "vver": "AI provisional", "vnotes": clean(row["Limitations"]),
            "profile": row["Profile"], "cohort": row["Profile"], "profileKey": profile_key, "release": row["Assessed release"],
            "media": row["Media"], "labels": row["Labels / targets"], "geography": row["Geography"], "publisher": row["Publisher"],
            "evidenceUrl": safe_url(row["Evidence URL"]), "conditionType": av.get("Condition label type"),
            "sourceRow": row["_row"], "reviewPriority": row["Review priority"], "manualReview": grade["Human review status"],
            "r2": {"version": VERSION, "st": state_strings, "why": reasons, "g": "UUUU", "task": row["Task / target scope"],
                   "pin": row["Assessed release"], "ev": row["Evidence basis"], "src": row["Evidence URL"], "date": "2026-10-12",
                   "profile": row["Profile"], "m": profile["m"], "domains": domain_scores,
                   "lower": lower, "upper": upper, "resolved": resolved,
                   "gates": {"G1": grade["G1 inventory"], "G2": grade["G2 task"], "G3": grade["G3 reuse"], "G4": grade["G4 benchmark"]}},
            "detailPath": f"data/records/{dataset_id}.json",
            "metadata": row,
            "reviewGuide": top.get(dataset_id),
        }
        catalog.append(record)
        detail = {"dataset": record, "checks": ledger, "sourceV3": v3 or None, "sourceAV": avs,
                  "sourceMetadataNotice": "Source_v3 historical AIR/V3 fields are preserved only as provenance. Current scores use v4 MCDM_Checks effective states.",
                  "mergeHistory": [r for r in merges if r["Retained ID"] == dataset_id]}
        (out / "records").mkdir(exist_ok=True)
        write_json(out / "records" / f"{dataset_id}.json", detail)
    assert not mismatches, f"Calculated scores differ from saved workbook grades: {mismatches[:10]}"
    assert len(catalog) == 233 and len({r["id"] for r in catalog}) == 233
    assert Counter(r["profile"] for r in catalog) == {"Labeled-16": 229, "Unlabeled-13": 4}
    country_counts = Counter(country for record in catalog for country in record["ctrys"])
    points = [{"name": country, "lat": COUNTRY_POINTS[country][0], "lon": COUNTRY_POINTS[country][1], "n": count}
              for country,count in country_counts.most_common()]
    coverage = rows(workbook, "Vehicle_Coverage")
    for row in coverage:
        row["Source URL"] = workbook["Vehicle_Coverage"].cell(row["_row"], 7).hyperlink.target if workbook["Vehicle_Coverage"].cell(row["_row"], 7).hyperlink else None
    provenance = {
        "schemaVersion": "1.3", "rubricVersion": VERSION, "reviewDate": "2026-10-12",
        "sources": [{"file": file, "sha256": hashlib.sha256((source/file).read_bytes()).hexdigest(), "bytes": (source/file).stat().st_size}
                    for file in [WORKBOOK, DOCUMENT]],
        "counts": {"catalogRecords": len(catalog), "rawSourceRecords": len(merges), "legacySourceRecords": len(legacy),
                   "avSourceRecords": len(av_sources), "newRetainedRecords": 56, "aliasesMerged": 15,
                   "coreLedgerRows": sum(len(v) for v in checks.values()), "labeledProfile": 229, "unlabeledProfile": 4},
        "validation": {"uniqueIds": True, "coreKeysPerRecord": 16, "cachedScoreMismatches": len(mismatches),
                       "scoreValidation": "All 233 lower/upper/resolved outputs independently recalculated from effective core states and match workbook caches within 1e-8."},
        "scope": method["Scope"], "limitations": method["Source confidence"], "vehicleCoverage": coverage,
        "relationships": rows(workbook, "Relationships"), "top10Review": list(top.values()),
        "platformSummary": rows(workbook, "Platform_Summary"), "discoverySummary": rows(workbook, "AI_Tool_Summary"),
        "methodDocumentScopeNote": "The Word file contains retained historical v2/v3 descriptions and future-work prose. Its revised v4 rules govern; the supplied v4 workbook contains the later inventory/scoring implementation. Historical examples were not reused as current scores.",
    }
    write_json(out / "catalog.json", catalog)
    write_json(out / "rubric.json", rubric)
    write_json(out / "provenance.json", provenance)
    write_json(out / "country-points.json", {"note": "Approximate national map anchors for explicitly named source countries; these are not dataset capture coordinates. Worldwide and unspecified multi-country records remain unmapped.", "points": points})
    compact = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    (out/"catalog.js").write_text("/* Generated by scripts/import-data.py; authoritative input: v4.0 workbook. */\nwindow.ATLAS_DATA = " + compact(catalog) + ";\nwindow.ATLAS_RUBRIC = " + compact(rubric) + ";\nwindow.ATLAS_PROVENANCE = " + compact(provenance) + ";\nwindow.ATLAS_POINTS = " + compact(points) + ";\nwindow.PAVEMENT_DATA = window.ATLAS_DATA;\nwindow.PAVEMENT_RUBRIC = window.ATLAS_RUBRIC;\nwindow.PAVEMENT_PROVENANCE = window.ATLAS_PROVENANCE;\n", encoding="utf-8")
    document = Document(source / DOCUMENT)
    write_json(out/"method-document-extract.json", {"source": DOCUMENT, "paragraphs": [p.text for p in document.paragraphs],
        "tables": [[[c.text for c in r.cells] for r in t.rows] for t in document.tables]})
    for file in [WORKBOOK, DOCUMENT]:
        if (source/file).resolve() != (out/file).resolve(): shutil.copy2(source/file, out/file)
    associations = out / "vehicle-associations.json"
    if associations.exists():
        vehicles = json.loads(associations.read_text(encoding="utf-8"))
        by_id = {d["id"]: d for d in catalog}
        for vehicle in vehicles["vehicles"]:
            for entry in vehicle["datasets"]:
                d = by_id[entry["id"]]
                entry.update({"name": d["n"], "url": d["url"], "catalogUrl": "dataset.html?id="+d["id"],
                              "modalities": d["mods"], "labels": d["labels"], "access": d["acc"], "terms": d["lic"],
                              "profile": d["profile"], "sourceRow": d["sourceRow"]})
        write_json(out/"vehicle-datasets.json", vehicles)
        (out/"vehicle-datasets.js").write_text("window.PAVEMENT_VEHICLE_DATASETS = "+compact(vehicles["vehicles"])+";\n", encoding="utf-8")
    print(json.dumps({"records": len(catalog), "coreChecks": sum(map(len, checks.values())), "scoreMismatches": len(mismatches),
                      "catalogBytes": (out/"catalog.js").stat().st_size, "output": str(out)}, indent=2))


if __name__ == "__main__":
    main()
