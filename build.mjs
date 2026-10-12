import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
let require=createRequire(import.meta.url),esbuild;
try{esbuild=require('esbuild');}catch{require=createRequire(path.resolve(root,'../waymo-ipace/package.json'));esbuild=require('esbuild');}
const threeDir=path.resolve(path.dirname(require.resolve('three')),'..');
const plugin={name:'three-resolver',setup(build){build.onResolve({filter:/^three(?:\/|$)/},a=>({path:a.path==='three'?path.join(threeDir,'build/three.module.js'):require.resolve(a.path)}));}};
async function bundle(entry){const result=await esbuild.build({entryPoints:[path.join(root,entry)],bundle:true,minify:true,format:'iife',target:['es2020'],write:false,legalComments:'inline',plugins:[plugin]});return result.outputFiles[0].text;}
await mkdir(path.join(root,'assets'),{recursive:true});
await writeFile(path.join(root,'assets/fleet-runtime.js'),await bundle('src/runtime.js'));
for(const [name,target] of [['av','av-model-simulation.html'],['driving','driving-simulation.html']]){
 let html=await readFile(path.join(root,`src/${name}-template.html`),'utf8');
 const app=await bundle(`src/${name}-app.js`);
 html=html.replace('/*STYLE*/',()=>require('fs').readFileSync(path.join(root,`src/${name}-style.css`),'utf8')).replace('/*APP*/',()=>app.replace(/<\/script/gi,'<\\/script'));
 await writeFile(path.join(root,target),html);
}
console.log('Built shared fleet runtime, AV sensor explorer and urban driving simulation.');
