import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
const root=import.meta.dirname;
const read=file=>readFile(path.join(root,file),'utf8');
const pages=['index.html','dataset.html','av-model-simulation.html','driving-simulation.html','submit.html','schema.html','guide.html'];
const html=await read('index.html');
assert.deepEqual([...html.matchAll(/<section class="section" id="([^"]+)"/g)].map(m=>m[1]),['geo','modal','ann','acq','viewpoint','tasks','distress','av-models','drive','register','gallery','filters','readiness','submit'],'Preserved Atlas section order');
let links=0,scripts=0;
for(const page of pages){
 const source=await read(page),markup=source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,`${page}: unique HTML IDs`);
 assert(!source.includes('/*APP*/')&&!source.includes('/*STYLE*/'),`${page}: built placeholders`);
 for(const m of markup.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  const target=m[1];if(/^(?:https?:|mailto:|data:|blob:)/.test(target))continue;
  if(target.startsWith('#')){assert(ids.includes(target.slice(1)),`${page}: missing anchor ${target}`);continue;}
  const file=decodeURIComponent(target.split(/[?#]/)[0]);if(!file)continue;
  await access(path.resolve(root,path.dirname(page),file));links++;
 }
 for(const m of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/type="application\/ld\+json"/.test(m[1])){JSON.parse(m[2]);continue;}
  if(m[2].trim()){new vm.Script(m[2],{filename:page});scripts++;}
 }
}
async function checkJs(dir){for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){
 const file=path.join(dir,entry.name);if(entry.isDirectory())await checkJs(file);
 else if(/\.(?:js|mjs)$/.test(file)){execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});scripts++;}
}}
await checkJs('src');
for(const file of ['data/catalog.js','data/reference.js'])new vm.Script(await read(file),{filename:file});
for(const file of ['docs/screenshots/catalog.jpg','docs/screenshots/vehicle-lab.jpg','docs/screenshots/driving.jpg','docs/screenshots/submissions.jpg'])await access(path.join(root,file));
await import('./scripts/verify-data.mjs');
await import('./scripts/verify-filters.mjs');
await import('./integrations/test-submissions.mjs');
console.log(`PASS: ${pages.length} pages, section order, unique IDs, anchors, ${links} local links/assets, ${scripts} scripts and documentation screenshots.`);
