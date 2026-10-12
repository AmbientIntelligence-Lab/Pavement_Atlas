/* Verify the public scoring engine against saved workbook values and retained evidence.
   Uses only Node built-ins. Run: node scripts/verify-data.mjs */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=relative=>readFile(new URL(relative,new URL('../',import.meta.url)),'utf8');
const json=async relative=>JSON.parse(await read(relative));
const [catalog,rubric,provenance,pointsFile,vehicles,core]=await Promise.all([
 json('data/catalog.json'),json('data/rubric.json'),json('data/provenance.json'),
 json('data/country-points.json'),json('data/vehicle-datasets.json'),read('src/scoring-core.js')
]);
const context=vm.createContext({window:{ATLAS_RUBRIC:rubric}});
vm.runInContext(core,context,{filename:'src/scoring-core.js'});
const score=context.window.AtlasScore;
const near=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-8,`${label}: ${actual} != ${expected}`);

assert.equal(catalog.length,233,'retained inventory count');
assert.deepEqual(catalog.map(d=>d.id).sort(),Array.from({length:233},(_,i)=>`DS-${String(i+1).padStart(3,'0')}`).sort(),'stable IDs');
assert.equal(catalog.filter(d=>d.cohort==='Labeled-16').length,229,'labeled cohort');
assert.equal(catalog.filter(d=>d.cohort==='Unlabeled-13').length,4,'unlabeled cohort');
assert.equal(rubric.allChecks.length,40,'all historical check IDs retained');
assert.equal(rubric.criteria.flatMap(d=>d.checks).length,16,'active core definitions');
let comparisons=0,ledgerCount=0,legacyCount=0,avCount=0;
const avIds=new Set(),allCheckIds=rubric.criteria.flatMap(d=>d.checks.map(c=>c[0]));
for(const d of catalog){
 const actual=score.score(d),meta=d.metadata;
 // These fields are the original workbook's cached values, preserved separately
 // from the importer's derived r2 scores.
 for(const [key,expected] of [['conf',meta['Lower /100']],['upper',meta['Upper /100']],['res',100*meta['Resolved share']]]){
  near(actual[key],expected,`${d.id} ${key} versus All_Datasets row ${d.sourceRow}`);comparisons++;
 }
 assert.equal(d.sourceRow,Number(d.id.slice(3))+5,`${d.id} source row`);
 assert.equal(d.sourceRow,meta._row,`${d.id} source row preserved`);
 assert.ok(/^https?:\/\//.test(d.url),`${d.id} usable public source link`);
 assert.ok(actual.conf<=actual.upper+1e-8&&actual.conf>=0&&actual.upper<=100+1e-8,`${d.id} bounds`);
 const detail=await json(d.detailPath);
 assert.deepEqual(detail.dataset,d,`${d.id} detail is current`);
 assert.equal(detail.checks.length,16,`${d.id} complete evidence ledger`);
 assert.deepEqual(detail.checks.map(c=>c['Check ID']).sort(),allCheckIds.slice().sort(),`${d.id} exact check keys`);
 for(let i=0;i<rubric.criteria.length;i++){
  const domain=rubric.criteria[i];
  const active=detail.checks.filter(c=>c.Domain===domain.key&&c['Applicable (1/0)']===1);
  assert.equal(d.r2.st[i],active.map(c=>c['Effective state']).join(''),`${d.id} ${domain.key} source states`);
  assert.equal(d.r2.m[i],active.length,`${d.id} ${domain.key} fixed denominator`);
  assert.ok(active.every(c=>['Y','N','U','X'].includes(c['Effective state'])),`${d.id} source state vocabulary`);
 }
 ledgerCount+=detail.checks.length;
 if(detail.sourceV3){legacyCount++;assert.ok(Object.keys(detail.sourceV3).length>=158,`${d.id} full legacy source fields`);}
 for(const av of detail.sourceAV){avCount++;assert.ok(!avIds.has(av.ID),`${av.ID} single retained association`);avIds.add(av.ID);assert.ok(Object.keys(av).length>=23,`${av.ID} complete AV source fields`);}
 assert.ok(detail.mergeHistory.length>=1,`${d.id} merge lineage retained`);
}
assert.equal(comparisons,699);
assert.equal(ledgerCount,3728);
assert.equal(legacyCount,177);
assert.equal(avCount,71);

const countryCounts=new Map();
for(const d of catalog){
 assert.equal(new Set(d.ctrys).size,d.ctrys.length,`${d.id} no duplicate country contribution`);
 for(const c of d.ctrys)countryCounts.set(c,(countryCounts.get(c)||0)+1);
}
assert.deepEqual([...countryCounts.keys()].sort(),pointsFile.points.map(p=>p.name).sort(),'every named country has one map anchor');
for(const p of pointsFile.points){
 assert.equal(p.n,countryCounts.get(p.name),`${p.name} record count`);
 assert.ok(p.lat>=-90&&p.lat<=90&&p.lon>=-180&&p.lon<=180,`${p.name} coordinate bounds`);
}
for(const source of provenance.sources){
 const bytes=await readFile(new URL('data/'+source.file,new URL('../',import.meta.url)));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256,source.file+' unchanged source snapshot');
}
for(const vehicle of vehicles.vehicles)for(const entry of vehicle.datasets){
 const d=catalog.find(d=>d.id===entry.id);assert.ok(d,`${vehicle.id}: dataset exists`);
 assert.equal(entry.catalogUrl,'dataset.html?id='+d.id,`${vehicle.id}: working detail route`);
 assert.equal(entry.url,d.url,`${vehicle.id}: current source URL`);
 assert.ok(entry.relationship&&entry.limitations,`${vehicle.id}: association scope disclosed`);
}

// Important evidence boundaries: missing evidence is not failure, and an
// excluded annotation dimension must never receive a per-record bonus.
const allUnknown={cohort:'Labeled-16',r2:{st:rubric.criteria.map(c=>'U'.repeat(c.checks.length))}};
near(score.score(allUnknown).conf,0,'all unknown lower');near(score.score(allUnknown).upper,100,'all unknown upper');near(score.score(allUnknown).res,0,'all unknown resolved');
const allFailed={cohort:'Labeled-16',r2:{st:rubric.criteria.map(c=>'N'.repeat(c.checks.length))}};
near(score.score(allFailed).conf,0,'all failed lower');near(score.score(allFailed).upper,0,'all failed upper');near(score.score(allFailed).res,100,'all failed resolved');
const unlab=catalog.find(d=>d.id==='DS-210');
near(score.score(unlab,[20,0,20,20,20,20]).conf,score.score(unlab,[20,1000,20,20,20,20]).conf,'excluded L cannot change unlabeled score');
assert.equal(score.score(unlab,[0,0,0,0,0,0]).valid,false,'zero total weights rejected');

console.log(JSON.stringify({status:'PASS',sourceBaselineComparisons:comparisons,records:catalog.length,
 evidenceRows:ledgerCount,originalLegacyRecords:legacyCount,originalAVRecords:avCount,
 mappedCountries:countryCounts.size,vehicleGroups:vehicles.vehicles.length,root},null,2));
