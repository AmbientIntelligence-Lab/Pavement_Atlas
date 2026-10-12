/* Scientific-fidelity regressions against the generated website's real facet helpers. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const base=new URL('../',import.meta.url);
const app=await readFile(new URL('src/atlas-app.js',base),'utf8');
const catalog=JSON.parse(await readFile(new URL('data/catalog.json',base),'utf8'));
const functionText=name=>{
 const match=app.match(new RegExp('function '+name+'\\([^)]*\\)\\{[\\s\\S]*?\\n\\}'));
 assert.ok(match,`generated function ${name}`);return match[0];
};
const keyLine=app.match(/const DISTKEYS = ([^\n]+);/);
const facets=app.match(/const GF_DIMS = \{[\s\S]*?\n\};/);
assert.ok(keyLine&&facets,'generated filter definitions');
const context=vm.createContext({DATA:catalog});
vm.runInContext(`const DISTKEYS=${keyLine[1]};
 const distRe={};DISTKEYS.forEach(([label,pattern])=>distRe[label]=new RegExp(pattern,'i'));
 ${functionText('positiveDistressText')}
 ${app.match(/function matchesDistress[^\n]+/)[0]}
 ${functionText('licFam')}
 ${facets[0]}
 globalThis.distFacet=GF_DIMS.dist.get;
 globalThis.licenseFacet=GF_DIMS.lic.get;
 globalThis.licenseValues=GF_DIMS.lic.vals();`,context);
for(const id of ['DS-183','DS-189','DS-192','DS-209','DS-231']){
 const d=catalog.find(d=>d.id===id);
 assert.ok(!context.distFacet(d).includes('Pothole'),`${id}: negative pothole statement is not a positive label`);
}
for(const id of ['DS-035','DS-147']){
 const d=catalog.find(d=>d.id===id);
 assert.ok(context.distFacet(d).includes('Pothole'),`${id}: documented pothole class remains discoverable`);
}
assert.ok(context.distFacet({dst:'Pothole;No pothole'}).includes('Pothole'),'positive and negative classes coexist');
assert.ok(!context.distFacet({dst:'Non-pothole examples only'}).includes('Pothole'),'negative-only class is excluded');
assert.ok(context.distFacet(catalog.find(d=>d.id==='DS-231')).includes('Manhole / road furniture'),'Waymo mapped speed bumps remain discoverable');
const licenseCases=[
 ['CC BY 4.0','CC BY'],['CC BY-SA 4.0','CC BY-SA'],['CC BY-ND 4.0','CC BY-ND'],
 ['CC BY-NC 4.0','CC BY-NC'],['CC BY-NC-SA 4.0','CC BY-NC-SA'],['CC BY-NC-ND 4.0','CC BY-NC-ND'],
 ['Creative Commons Attribution NonCommercial NoDerivatives 4.0','CC BY-NC-ND'],
 ['CC0 1.0','CC0 / Public domain'],['MIT','MIT'],
 ['NATIX Data RAIL-NC; noncommercial; no redistribution; limited term','Custom restricted terms'],
 ['Reuse permitted under provider terms','Other'],['CC BY 4.0 | unresolved source license','Mixed / review required']
];
for(const [lic,expected] of licenseCases){
 assert.equal(context.licenseFacet({lic})[0],expected,lic);
 assert.ok(context.licenseValues.includes(expected),`${expected}: selectable category`);
}
assert.equal(context.licenseFacet(catalog.find(d=>d.id==='DS-197'))[0],'CC BY-ND','Audi A2D2 preserves NoDerivatives condition');
for(const d of catalog)assert.ok(context.licenseValues.includes(context.licenseFacet(d)[0]),`${d.id}: current license can be filtered`);
vm.runInContext(`${app.match(/const GF = \{[\s\S]*?\};/)[0]}
 ${app.match(/const GF_ORDER = [^\n]+/)[0]}
 ${functionText('imgNum')}
 ${functionText('gfMatch')}
 globalThis.imageFilter=(img,min,max,unknown)=>{GF.imgMin=min;GF.imgMax=max;GF.imgNR=unknown;return gfMatch({img,yr:2026});};`,context);
assert.equal(context.imageFilter('2000000',0,6,true),true,'default count maximum is unbounded');
assert.equal(context.imageFilter('2000000',3,6,true),true,'unbounded maximum remains unbounded after minimum changes');
assert.equal(context.imageFilter('2000000',3,5,true),false,'finite maximum excludes larger releases');
assert.equal(context.imageFilter('9 acquisition runs',0,6,true),true,'non-image count remains explicitly unknown');
assert.equal(context.imageFilter('9 acquisition runs',0,6,false),false,'unknown count toggle works without changing range');
const calls=[];
const renderContext=vm.createContext({GSTATE:{sort:'yr_d'},calls,
 ...Object.fromEntries(['updateWeightLabels','renderRank','renderStates','renderScatter','renderTable','applyColVis','renderGallery',
 'renderMap','renderMods','renderAnns','renderAcq','renderView','renderTasks','renderDist','renderChips'].map(name=>[name,()=>calls.push(name)])),
 filtered:()=>[],sortRows:rows=>rows});
vm.runInContext(app.match(/function updateAir[^\n]+/)[0]+'\n'+functionText('renderAll'),renderContext);
renderContext.updateAir();assert.ok(calls.includes('renderGallery'),'weight changes refresh year-sorted gallery scores');
calls.length=0;renderContext.renderAll();assert.ok(calls.includes('updateWeightLabels'),'filter changes refresh screening cohort count');
console.log(JSON.stringify({status:'PASS',negatedDistressRecords:5,licenseCases:licenseCases.length,catalogLicenseRecords:catalog.length},null,2));
