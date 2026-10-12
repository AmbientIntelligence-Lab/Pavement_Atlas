# Pavement Atlas v1.3 data provenance

The website catalog uses the user-supplied `Compared_All_Platforms_TH_v4.0.xlsx` and the revised v4.0 rules in `Compared_All_Platforms_TH_v4.0.docx`. Original copies are included in this folder. Their SHA-256 hashes and import validation results are recorded in `provenance.json`.

## Inventory and identity

- 233 retained dataset/release records: 177 previous records and 56 retained AV additions.
- 248 source rows: 177 from the older inventory and 71 from the AV inventory.
- 15 AV aliases merged into retained records: 14 catalog matches and one probable RSCD mirror match. This is catalog reconciliation, not a byte-level duplicate audit.
- IDs `DS-001` through `DS-177` are preserved. New records are `DS-178` through `DS-233`.
- 25 relationship groups are retained in `provenance.json`; related or derived releases are not assumed to be independent observations.
- The ten manual-review priorities are a purposive review sequence, not a dataset-quality leaderboard.

The Word document retains historical v2/v3 examples and some instructions for a later workbook phase. The supplied Excel file already contains the v4 implementation. The import therefore applies the revised Word rules and the current workbook's effective states. It does not reuse historical scores or the old website's v5.0 references as current evidence.

## Revised selection and scoring

The core contains 16 checks in six dimensions:

| Dimension | Active IDs | Denominator |
| --- | --- | --- |
| Access | A1, A2, A3 | 3 |
| Annotation Evidence | L1, L2, L4 | 3 |
| Documentation | D1, D2, D4 | 3 |
| Sample Accounting | C1, C2 | 2 |
| Collection Context | R1, R2 | 2 |
| Acquisition Details | M1, M2, M5 | 3 |

The 229 `Labeled-16` records use equal weights of 1/6 across the six dimensions. The four `Unlabeled-13` records exclude L for the entire cohort and use equal weights of 1/5 across A/D/C/R/M. Those four are DS-112 CUPAC, DS-210 comma2k19, DS-212 Ford Multi-AV, and DS-217 NATIX Multi-Camera. Profile scores must not be compared directly.

Y means cited evidence meets the check. N requires affirmative evidence of failure. U means missing, inaccessible, untested or insufficient evidence. X means unresolved conflict. For a dimension with m active checks, lower = 5Y/m, upper = 5(Y+U+X)/m, and resolved = (Y+N)/m. Weighted totals use the unrounded fractions. These are documentation completion bounds, not confidence intervals, universal quality ratings, or evidence that payloads have been inspected.

All 40 original check IDs remain in `rubric.json`. Only the 16 core checks enter the index. Benchmark Readiness (V) and Engineering Linkage (E) have no common core weight. They remain conditional task and validation modules. The strict >95% confirmed-N rule is applied within a deduplicated applicable cohort; no current core check crosses that threshold. U and X never become N.

G1 identity, G2 declared-task fit, G3 rights plus verified retrieval, and G4 benchmarking leakage are separate stage gates. Source records remain pending/not assessed where the workbook has not established those decisions. A high documentation index does not pass a gate.

## Files and integration

- `catalog.json`: 233 records with compact website fields, complete current `All_Datasets` metadata, source row, current core states, domain counts and baseline scores.
- `catalog.js`: the same catalog plus rubric, provenance and country points, available as `window.ATLAS_DATA`, `window.ATLAS_RUBRIC`, `window.ATLAS_PROVENANCE`, and `window.ATLAS_POINTS`. `PAVEMENT_*` aliases are retained for integration.
- `records/DS-xxx.json`: complete record, all 16 keyed evidence rows, full untruncated `Source_v3` and `Source_AV` metadata, and merge decisions. Historical AIR/v3 fields are preserved only inside clearly identified source provenance.
- `rubric.json`: all 40 criteria with role, source definition, applicability and prevalence, six active dimensions, two fixed profiles, formulas, and method notes.
- `provenance.json`: source hashes, counts, workbook validation, relationships, review priorities, coverage findings, and method-scope notes.
- `country-points.json`: approximate national map anchors and counts for explicitly named countries. These are not recording coordinates. Unspecified multi-country or worldwide coverage remains unmapped.
- `vehicle-associations.json`: curated association statements and their sources; edit this source file to maintain vehicle cross-references.
- `vehicle-datasets.json` and `.js`: vehicle references joined to current catalog metadata, with explicit association and limitation statements.
- `method-document-extract.json`: read-only extraction of source document paragraphs and tables for traceability; no Word formatting or comment review is implied.

Compact display fields normalize equivalent spellings and obvious source descriptions for filters. They do not replace the original metadata. Missing image color is kept as `Images (color unspecified)`; generic image records are not silently labeled RGB. Collection viewpoint remains unreported unless the source states it. License, target, count-unit and limitation wording remains untruncated.

## Vehicle references

Waymo has official dataset releases. The illustrated vehicle/sensor generation is not claimed to match every recording. NATIX Tesla-owner recordings are third-party data and are not a Cybercab or Tesla Inc. release. Pit30M / Aurora Multi-Sensor is historical Uber ATG collection and must not be labeled Aurora truck footage. MAN TruckScenes and Torc TruckDrive are separate truck alternatives. The supplied October 11, 2026 search did not identify a qualifying Rivian EDV public footage release; this absence is not proof that none exists.

The laboratory and ADAS models are educational, generic vehicles. Linked independent datasets illustrate relevant collection tasks and do not originate from these models. Object, lane, weather or road-condition labels do not automatically establish pavement distress/severity targets.

Selected source pages were checked on October 12, 2026: [Waymo Open Dataset](https://waymo.com/open/), [NATIX Edge Case](https://huggingface.co/datasets/natix-network-org/natix-edge-case-driving-dataset), [Pit30M devkit](https://github.com/pit30m/pit30m), [A2D2](https://a2d2-dataset.github.io/), [ZOD Frames](https://zod.zenseact.com/frames/), [Oxford RobotCar](https://robotcar-dataset.robots.ox.ac.uk/), [comma2k19](https://github.com/commaai/comma2k19), and [TruckDrive](https://torc-ai.github.io/TruckDrive/). No payload was downloaded or operating mode independently verified. The MAN page resolved to its brand portal without readable text. The KITTI official pages could not be freshly fetched; those entries preserve the workbook snapshot.

New review issue: the [TruckDrive release license](https://huggingface.co/datasets/Torc-Robotics/TruckDrive) states raw sensor streams are outside the licensed material while the project describes multimodal sensing. The vehicle panel flags the release-scope issue for verification. This later website observation does not silently change the authoritative workbook score or its recorded metadata.

## Rebuild and checks

Install `openpyxl` and `python-docx` in a Python environment, then run from the website folder:

```powershell
python scripts/import-data.py --source-dir ..
```

If the source files are no longer in the parent directory, the script falls back to the copies in `data`. The script never writes to a source workbook or document. Rebuilding produces deterministic JSON from those files and `vehicle-associations.json`.

The importer verifies all 233 unique IDs, the exact 16 ledger keys per record, the cohort-specific denominators, valid effective states, and the 229/4 cohort split. All 233 lower/upper/resolved triplets are independently calculated and match saved workbook values within 1e-8. It stops if any check fails. An import is not native Excel recalculation, independent human review, legal clearance, or payload validation.

## Data maintenance to do

1. Complete the ten prescribed manual reviews, with reviewer, date, confirmed release, per-check URL, locator and evidence.
2. Resolve release-specific issues recorded in the workbook, including CrackSeg9k V4 versus original-paper counts and LTPP SDR39 versus portal SDR40.
3. Verify current TruckDrive distribution and license scope before describing downloadable camera streams.
4. Revisit dated vehicle-availability findings as publishers release new data; preserve search dates and distinguish company-origin data from related alternatives.
5. Add any missing collection-country information only from primary documentation; do not infer it from publisher affiliation.
6. Rebuild all derived catalog files after source changes and review profile changes as a cohort-wide method revision.
