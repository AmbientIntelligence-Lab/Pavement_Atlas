// One-time, reproducible migration of the supplied v1.2 Atlas shell.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
let html=fs.readFileSync(path.resolve(root,'../Pavement_Atlas_website_v1.2/index.html'),'utf8');
let app=html.match(/<script>\s*"use strict";([\s\S]*?)<\/script>/)[1];
app=app.replace(/const DATA = [^\n]+;/,'const DATA = window.ATLAS_DATA;');
app=app.replace(/const M3 = [^\n]+;/,'const M3 = window.ATLAS_RUBRIC;');
// Move map and retained preview metadata to a small, separately reusable bundle.
let reference='';
for(const key of ['POINTS','WORLD','SAMPLES','DISTIMG']){
 const re=new RegExp('const '+key+' = ([^\\n]+);');
 const m=app.match(re); if(m){reference+='window.ATLAS_'+key+' ||= '+m[1]+';\n';app=app.replace(re,'const '+key+' = window.ATLAS_'+key+';');}
}
fs.writeFileSync(path.join(root,'data/reference.js'),reference);
const scoring=fs.readFileSync(path.join(root,'src/screening.js'),'utf8');
app=app.replace(/\/\* ---------- Readiness screening[\s\S]*?(?=function viewFlag)/,()=>scoring+'\n');
app=app.replace(/\/\* ================= DRIVE-IT SIMULATION[\s\S]*?(?=initGalleryFilters\(\);)/,'');
app=app.replace(/document.getElementById\('wReset'\).addEventListener[\s\S]*?\n\}\);/,"document.getElementById('wReset').addEventListener('click',()=>{W=defaultWeights(PROFILE);renderWeights();updateAir();});");
app=app.replace('renderRank();renderScatter();','renderRank();renderStates();renderScatter();');
app=app.replace('Hidden columns are also dropped from CSV export','CSV includes the full metadata field set');
app=app.replace("const PLATS = [\"GitHub\",\"Data.gov\",\"Mendeley Data\",\"Hugging Face\",\"Zenodo\",\"Kaggle\"];","const PLATS = [...new Set(DATA.flatMap(d=>d.plats))].sort();");
app=app.replace("vals:()=>POINTS.map(p=>p.name)","vals:()=>[...new Set(DATA.flatMap(d=>d.ctrys))].sort()");
app=app.replace("vals:()=>TASKS.map(t=>t[0])","vals:()=>[...new Set(DATA.flatMap(d=>d.tasks))].sort()");
app=app.replace("vals:()=>MODS.map(m=>m[0])","vals:()=>[...new Set(DATA.flatMap(d=>d.mods))].sort()");
app=app.replace("vals:()=>SRCS.map(s=>s[0])","vals:()=>[...new Set(DATA.flatMap(d=>d.srcs))].sort()");
app=app.replace("vals:()=>VIEW_VALS","vals:()=>[...new Set(DATA.map(d=>d.view||'Not reported'))].sort()");
app=app.replace("vals:()=>['Direct download','Registration','Request required','Restricted','Metadata only','Unclear','Not reported']","vals:()=>[...new Set(DATA.map(d=>d.acc||'Not reported'))].sort()");
app=app.replace("vals:()=>['Original','Derived','Compiled']","vals:()=>[...new Set(DATA.map(d=>d.odc||'Not reported'))].sort()");
app=app.replace('get:d=>[d.acc]','get:d=>[d.acc||\'Not reported\']').replace('get:d=>[d.odc]','get:d=>[d.odc||\'Not reported\']');
app=app.replace('function gfMatch(d,skip){','function gfMatch(d,skip){\n if(!GF.imgNR&&imgNum(d)===null)return false;if(!GF.yrNR&&!d.yr)return false;');
app=app.replace('lg>GF.imgMax+1e-9','(GF.imgMax<6&&lg>GF.imgMax+1e-9)');
app=app.replace('if(GF.imgMin>0||GF.imgMax<6) items.push','if(GF.imgMin>0||GF.imgMax<6||!GF.imgNR) items.push').replace('if(GF.yrMin>2012||GF.yrMax<2026) items.push','if(GF.yrMin>2012||GF.yrMax<2026||!GF.yrNR) items.push');
app=app.replace("'Images: '+fmtImg(GF.imgMin)+' – '+fmtImg(GF.imgMax)","'Image/frame count: '+fmtImg(GF.imgMin)+' – '+(GF.imgMax===6?'No upper limit':fmtImg(GF.imgMax))");
app=app.replace('const fmt=v=>isImg?fmtImg(v):String(v);',"const fmt=v=>isImg?fmtImg(v):String(v);const fmtUpper=v=>isImg&&v===6?'No upper limit':fmt(v);");
app=app.replace("'<span class=\"dr-hv\">'+fmt(hi)","'<span class=\"dr-hv\">'+fmtUpper(hi)");
app=app.replace("<span class=\"dr-hv\">'+fmt(hi)","<span class=\"dr-hv\">'+fmtUpper(hi)");
app=app.replace("host.querySelector('.dr-hv').textContent=fmt(h)","host.querySelector('.dr-hv').textContent=fmtUpper(h)");
app=app.replace("> include not-reported</label>","> '+(isImg?'include unknown counts':'include not-reported')+'</label>");
app=app.replace("fmtUpper(hi)+'</span></div>';", "fmtUpper(hi)+'</span></div>'+(isImg?'<p class=\"hint\">Unknown counts include unreported values, ambiguous totals and non-image sample units.</p>':'');");
app=app.replace('<summary>Number of images<span','<summary>Image/frame count (log scale)<span');
app=app.replace(/if\(k==='img'\)\{const m=[^\n]+\}/,"if(k==='img')return imgNum(d)??-1;");
app=app.replace(/img_d:d=>\{const m=[^\n]+\},/,"img_d:d=>-(imgNum(d)??-1),");
app=app.replace("IC[SRC_IC[s]]+esc","(IC[SRC_IC[s]]||IC.cam)+esc");
app=app.replace("' '+d.id+' '+d.lic","' '+d.id+' '+d.lic+' '+d.tasks.join(' ')+' '+d.mods.join(' ')");
app=app.replace("'deduplicated across 6 platforms'","'retained in source workbook v4.0'");
app=app.replace("'no registration needed'","'access route reported by source'");
app=app.replace(/function licFam\(d\)\{[\s\S]*?\n\}/,`function licFam(d){
 const l=(d.lic||'').toLowerCase();if(!l||/^(nr|na|unk|not reported)$/.test(l.trim()))return 'Not reported';
 if(l.includes('|'))return 'Mixed / review required';
 if(/\\bcc0\\b|public domain/.test(l))return 'CC0 / Public domain';
 const cc=/\\bcc[- ]?by\\b|creative commons attribution/.test(l);
 if(cc){
  const nc=/by[- ]?nc|non[- ]?commercial/.test(l),nd=/(?:by|nc)[- ]?nd|no[- ]?derivatives/.test(l),sa=/(?:by|nc)[- ]?sa|share[- ]?alike/.test(l);
  if(nd&&sa)return 'Mixed / review required';
  if(nc&&nd)return 'CC BY-NC-ND';if(nc&&sa)return 'CC BY-NC-SA';
  if(nc)return 'CC BY-NC';if(nd)return 'CC BY-ND';if(sa)return 'CC BY-SA';return 'CC BY';
 }
 if(/\\bmit\\b/.test(l))return 'MIT';if(/\\bapache\\b/.test(l))return 'Apache';
 if(/noncommercial|non-commercial|educational|research only/.test(l))return 'Custom restricted terms';return 'Other';
}`);
app=app.replace("'CC BY','CC BY-SA','CC BY-NC'","'CC BY','CC BY-SA','CC BY-ND','CC BY-NC','CC BY-NC-SA','CC BY-NC-ND'");
app=app.replace("'MIT','Apache','Other','Not reported'","'MIT','Apache','Custom restricted terms','Mixed / review required','Other','Not reported'");
app=app.replace("const distRe = {}; DISTKEYS.forEach(([lab,pat])=>distRe[lab]=new RegExp(pat,'i'));",`const distRe = {}; DISTKEYS.forEach(([lab,pat])=>distRe[lab]=new RegExp(pat,'i'));
function positiveDistressText(d){
 // A limitation such as "no crack/pothole labels" must not become a label.
 // Keep independently stated positive clauses, including "Pothole; No pothole".
 return String(d.dst||d.labels||'').replace(/\\b(?:no|not|without)\\b[^;|.]*/gi,' ').replace(/\\bnon[- ](?:cracks?|potholes?|distress)\\b[^;|.]*/gi,' ');
}
function matchesDistress(d,label){return distRe[label].test(positiveDistressText(d));}`);
app=app.replaceAll('distRe[lab].test(d.dst)','matchesDistress(d,lab)').replaceAll('distRe[l].test(d.dst)','matchesDistress(d,l)');
app=app.replace("return rows.slice().sort((a,b)=>{const x=key(a),y=key(b);return", "return rows.slice().sort((a,b)=>{const cohortOrder=k==='air'?AtlasScore.cohort(a).localeCompare(AtlasScore.cohort(b)):0;if(cohortOrder)return cohortOrder;const x=key(a),y=key(b);return");
app=app.replace("rows.sort((a,b)=>{const x=key(a),y=key(b);return", "rows.sort((a,b)=>{const cohortOrder=GSTATE.sort==='air_d'?AtlasScore.cohort(a).localeCompare(AtlasScore.cohort(b)):0;if(cohortOrder)return cohortOrder;const x=key(a),y=key(b);return");
app=app.replace("d.img?esc(d.img.split('|')[0].trim())+' images':null", "d.img?esc(d.img):null");
app=app.replace("'readiness_confirmed','readiness_upper'", "'cohort','screening_weights','readiness_confirmed','readiness_upper'");
app=app.replace("let x=d[c]; if(c===", "let x=d[c];if(c==='screening_weights')x=CRITERIA.map((cr,i)=>cr.key+':'+(r2Score(d).weights[i]/r2Score(d).weights.reduce((a,b)=>a+b,0)*100).toFixed(4)+'%').join('; '); if(c===");
{const start=app.indexOf('function renderMap(){'),end=app.indexOf('\nfunction toggleCtry',start);const old=app.slice(start,end);let fresh=old.replace('const W=960,H=395;','const W=960,H=395; const mapBase=gfBaseExcept("ctrys"), mapPoints=POINTS.map(p=>({...p,n:mapBase.filter(d=>d.ctrys.includes(p.name)).length})).filter(p=>p.n>0);').replaceAll('POINTS.forEach','mapPoints.forEach').replaceAll('POINTS.map','mapPoints.map').replace('mapPoints=mapPoints.map','mapPoints=POINTS.map').replace('DATA.filter(d=>!d.ctrys.length)','mapBase.filter(d=>!d.ctrys.length)');app=app.slice(0,start)+fresh+app.slice(end);}
app=app.replace("const n=DATA.filter(d=>matchesDistress(d,lab)).length;","const n=gfBase().filter(d=>matchesDistress(d,lab)).length;");
app=app.replace("'<div class=\"visual\">'+TILE[DIST_TILE[lab]]+'<span class=\"badge-il\">Illustration</span></div>'+", "'<div class=\"visual\"><img loading=\"lazy\" src=\"'+DISTIMG[DIST_TILE[lab]].data+'\" alt=\"'+esc(lab)+' reference photograph\"></div>'+" );
app=app.replace("'<div class=\"body\"><h3>'+esc(lab)+'</h3><div class=\"count\">'+n+' dataset'+(n===1?'':'s')+' label this →</div></div></div>';", "'<div class=\"body\"><h3>'+esc(lab)+'</h3><div class=\"count\">'+n+' dataset'+(n===1?'':'s')+' label this →</div><small class=\"photo-credit\">'+esc(DISTIMG[DIST_TILE[lab]].author)+' · '+esc(DISTIMG[DIST_TILE[lab]].license)+'</small></div></div>';" );
app=app.replace("'<span class=\"ds-name\" data-o=\"'+esc(d.id)+'\">'", "'<span class=\"ds-name\" data-o=\"'+esc(d.id)+'\">'");
app=app.replace("return '\"'+String(x).replace(/\"/g,'\"\"')+'\"';", ()=>"return '\"'+String(x).replace(/^[=+@\\-]/,\"'$&\").replace(/\"/g,'\"\"')+'\"';");
app=app.replace('pavedata_atlas_v1.2_filtered.csv','pavedata_atlas_v1.3_filtered.csv');
app=app.replaceAll("Readiness '+airScore(d).toFixed(0)","Evidence '+airScore(d).toFixed(0)+' '+(AtlasScore.cohort(d)==='labeled'?'L16':'U13')");
app=app.replace('function renderMods(){',`MODT.generic=asphalt('<path d="M125 56h50v38h-50z" stroke="#dce4eb" fill="none" stroke-width="2"/><circle cx="150" cy="75" r="10" stroke="#dce4eb" fill="none" stroke-width="2"/>');
for(const value of [...new Set(DATA.flatMap(d=>d.mods))])if(!MODS.some(m=>m[0]===value))MODS.push([value,'generic','cam','As recorded in the source workbook. Open a dataset for collection and file details.']);
function renderMods(){`);
app=app.replace('function renderTasks(){',`for(const value of [...new Set(DATA.flatMap(d=>d.tasks))])if(!TASKS.some(t=>t[0]===value))TASKS.push([value,'scan']);
function renderTasks(){`);
app=app.replace('function renderAcq(){',`for(const value of [...new Set(DATA.flatMap(d=>d.srcs))])if(!SRCS.some(t=>t[0]===value))SRCS.push([value,'car','Collection platform recorded in the source.']);
function renderAcq(){`);
for(const begin of ['function renderView(){','function renderMods(){','function renderAnns(){','function renderAcq(){','function renderTasks(){']){
 const start=app.indexOf(begin),end=app.indexOf('\n}',start)+2;
 const old=app.slice(start,end);app=app.slice(0,start)+old.replaceAll('DATA.filter(', 'gfBase().filter(')+app.slice(end);
}
app=app.replace(/function imgNum\(d\)\{[\s\S]*?\n\}/,`function imgNum(d){
 const text=String(d.img||'').trim();if(!text||text.includes('|'))return null;
 let m=/^([\\d,]+)$/.exec(text);if(m)return Number(m[1].replaceAll(',',''))||null;
 m=/([\\d,.]+)\\s*(k|million|m)?\\s+(?:camera images|visual images|images|frames|photographs)\\b/i.exec(text);
 if(!m)return null;const mult=/million|m/i.test(m[2]||'')?1e6:(/k/i.test(m[2]||'')?1e3:1);return Number(m[1].replaceAll(',',''))*mult||null;
}`);
app=app.replace('Labels rest on the acquisition metadata, the dataset page or the publication; well-known benchmarks use their published acquisition description.','Viewpoint categories use explicit source statements only; unspecified directions remain unreported.');
// Use dedicated, linkable dataset pages everywhere a detail record is requested.
app=app.replace(/function openSheet\(id\)\{[\s\S]*?\n\}\nfunction closeSheet/,"function openSheet(id){location.href='dataset.html?id='+encodeURIComponent(id);}\nfunction closeSheet");
app=app.replace('function renderAll(){\n', 'function renderAll(){\n updateWeightLabels();\n');
{const start=app.indexOf('function renderTable(rows){'),end=app.indexOf('\nfunction renderChips',start);let table=app.slice(start,end);table=table.replace("}).join('');","}).join('')||'<tr><td colspan=\"13\" class=\"empty-results\">No datasets match this search. Clear the search or reset filters.</td></tr>';");app=app.slice(0,start)+table+app.slice(end);}
app+='\ndocument.getElementById("heroN").textContent=DATA.length;\n';
app+='const initial=new URLSearchParams(location.search);if(initial.has("q")){state.q=initial.get("q");document.getElementById("fQ").value=state.q;renderTable(sortRows(filtered()));}\n';
app=app.replace(/behavior:\s*(?:RM\?'auto':'smooth'|'smooth'|"smooth")/g,"behavior:'auto'");
fs.writeFileSync(path.join(root,'src/atlas-app.js'),'"use strict";\n'+app);
html=html.replace(/<script src="assets\/fleet-runtime.js"[\s\S]*?<\/body>/,'<script src="data/catalog.js"></script>\n<script src="data/reference.js"></script>\n<script src="src/scoring-core.js"></script>\n<script src="src/atlas-app.js"></script>\n<script src="src/atlas-v13.js"></script>\n</body>');
html=html.replaceAll('1.2','1.3').replaceAll('Compared_All_Platforms_TH_v5.0.xlsx','Compared_All_Platforms_TH_v4.0.xlsx');
const recordCount=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')).length;
html=html.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="PaveData Atlas: '+recordCount+' dataset and release records for pavement and autonomous-driving research, with source links, evidence-based screening, filters and interactive simulations.">');
html=html.replace(/<meta property="og:description" content="[^"]*">/,'<meta property="og:description" content="Explore '+recordCount+' pavement and autonomous-driving dataset references, their collection methods, source evidence and reuse terms.">');
html=html.replace('src/atlas-v12.css','src/atlas-v12.css"><link rel="stylesheet" href="src/atlas-v13.css');
html=html.replace(/<div class="eyebrow">[^<]*<\/div>/,'');
html=html.replace(/<h1>[\s\S]*?<\/h1>/,'<h1>Find the right data<br>for the road ahead.</h1>');
html=html.replace(/<p><b id="heroN">[\s\S]*?<\/p>/,'<p><b id="heroN">233</b> pavement and autonomous-driving datasets. Explore the evidence, compare collection methods, and follow the source links to the data you need.</p><p class="release-note">Atlas 1.3 · source workbook v4.0 · documentation-based screening</p>');
html=html.replace('<a href="#submit">Submit</a>','<a href="submit.html">Contribute</a><a href="guide.html">Guide</a>');
html=html.replaceAll('<div class="kicker">World Map</div>','');
html=html.replace('Eight distress families with stylized example images','Eight distress families with credited reference photographs');
html=html.replace('The inventory spans seven sensing modalities.','The inventory records visual, geometric and telemetry modalities.');
html=html.replace('Every label carries a verbatim evidence quote and its source — open a dataset to read it.','Viewpoint is only classified when stated in the source. A vehicle mount alone does not establish camera direction. Open a record to inspect the evidence.');
html=html.replace('A high score cannot override a gate. All four must pass before a dataset is eligible for a final comparison.','Gates are separate from documentation scoring. Their applicability depends on the intended use; benchmarking requires a leakage audit.');
html=html.replace('solid = confirmed, hatched = upper bound','solid = confirmed, translucent = unresolved');
html=html.replace('Column filters are the same global filters — they also narrow the map, ranking and gallery.','Column filters are global. Evidence sorting groups records by cohort; compare scores within L16 or U13.');
html=html.replaceAll('⚲','<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4-2v-4Z"/></svg>');
html=html.replace('Example tiles are illustrative renderings, not photographs from the datasets.','Reference photographs illustrate each distress family; they are not samples from the listed datasets. Credits and original links are in CREDITS.md.');
html=html.replace('Switch between Waymo I-PACE, Cybercab, Aurora truck and Rivian EDV. Rotate each model, inspect its sensors and explore illustrative sensing directions in one shared workspace.','Explore autonomous passenger and freight models, a driver-assisted van, an ADAS car, and a lab survey vehicle. Inspect hardware, animate sensing directions, and find related public datasets for each collection setup.');
html=html.replace(/<section class="section" id="drive">[\s\S]*?<\/section>/,`<section class="section" id="drive">
 <div class="sec-head"><h2>Driving and road-distress simulation.</h2><p>Explore an urban road network with crossroads, signal phases, surrounding traffic, and pavement defects. Compare six vehicle types, change the conditions, and switch camera views.</p></div>
 <p class="av-open"><a href="driving-simulation.html" target="_blank" rel="noopener">Open the driving simulation in a full workspace ↗</a></p>
 <iframe id="driveFrame" class="drive-frame" src="driving-simulation.html?embed=1" loading="lazy" title="Urban driving and road-distress simulation"></iframe>
 <p class="hint">Educational simulation. Geometry, sensor coverage and ride response are illustrative; they do not validate an autonomous-driving system or provide measured pavement condition.</p>
</section>`);
html=html.replace(/<section class="section" id="submit">[\s\S]*?<\/section>/,`<section class="section" id="submit"><div class="contribute-band"><div><h2>Help the Atlas grow.</h2><p>Contribute a dataset or correct a record. Share its source, collection details and reuse terms so the review team can verify it.</p></div><div><a class="btn btn-fill" href="submit.html">Contribute a dataset</a><a class="text-link" href="schema.html">Read the metadata schema →</a></div></div></section>`);
html=html.replace(/<h2>Readiness screening, on your own weights.<\/h2>[\s\S]*?<\/p>/,`<h2>Compare the evidence behind the data.</h2><p>The v4.0 rubric uses 16 checks across six dimensions. Select the labeled or unlabeled cohort, then adjust dimension weights. Confirmed evidence forms the lower bound; unknown and conflicting evidence widen the interval. Compare datasets within the same cohort. Scores describe documented evidence, not measured model performance.</p>`);
html=html.replace(/Eight criteria, each worth[\s\S]*?custom profile\./,'Each dimension is scaled by its own check count. Labeled-16 uses all six dimensions; Unlabeled-13 excludes label quality for the entire cohort. Custom weights are exploratory.');
html=html.replace('Weight profile','Comparison cohort and weights').replace('Provisional screening ranking','Evidence screening').replace('top 20 by confirmed points','top 20 within the selected cohort');
html=html.replace(/<div class="hint">Screening describes[\s\S]*?<\/div>/,'<div class="hint">See <a href="guide.html#criteria">selection and scoring rules</a>, <a href="data/Compared_All_Platforms_TH_v4.0.xlsx">the source workbook</a>, and <a href="data/Compared_All_Platforms_TH_v4.0.docx">the source methodology</a>. Not-assessed gates remain pending; a score does not establish reuse eligibility.</div>');
html=html.replace(/<div class="footer"><div class="footer-inner">[\s\S]*?<\/div><\/div>/,`<footer class="footer"><div class="footer-inner"><div><b>PaveData Atlas 1.3</b><p>A reference catalog for pavement and road-scene research. Source: <a href="data/Compared_All_Platforms_TH_v4.0.xlsx">comparison workbook v4.0</a> and <a href="data/Compared_All_Platforms_TH_v4.0.docx">selection methodology</a>. Missing, conflicting, and unverified evidence remain visible.</p></div><div class="footer-links"><a href="guide.html">User guide and citation</a><a href="schema.html">Metadata schema</a><a href="submit.html">Community submissions</a><a href="CHANGELOG.md">Update history</a><a href="CREDITS.md">Image and model credits</a><a href="https://github.com/AmbientIntelligence-Lab/Pavement_Atlas">GitHub repository</a></div></div></footer>`);
html=html.replace('<body>','<body>\n<a class="skip-link" href="#register">Skip to dataset register</a>');
html=html.replace('<label>Search</label><input id="fQ"','<label for="fQ">Search this register</label><input id="fQ" type="search"');
html=html.replace('<th data-k="img">Images<button','<th data-k="img">Sample accounting<button');
html=html.replace('<label>Number of images (log scale)</label>','<label>Image/frame count (log scale)</label>');
html=html.replace('Deduplicated across all six platforms. Click a dataset for full metadata, links and quality notes.','Retained records from the v4.0 workbook, including the AV expansion. Open a dataset for source links, evidence, reuse terms and downloadable metadata.');
html=html.replace(/behavior:\s*(?:RM\?'auto':'smooth'|'smooth'|"smooth")/g,"behavior:'auto'");
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Migrated Atlas shell and separated catalog, reference assets, and application source.');
