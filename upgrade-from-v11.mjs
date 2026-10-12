// One-time migration from the supplied original. Normal builds use build.mjs only.
import {readFile,writeFile} from 'node:fs/promises';
let html=(await readFile(new URL('../Pavement_Atlas_website/index.html',import.meta.url),'utf8')).replaceAll('\r\n','\n');
const sectionMatches=[...html.matchAll(/<section class="section" id="([^"]+)">[\s\S]*?<\/section>/g)];
const sections=Object.fromEntries(sectionMatches.map(m=>[m[1],m[0]]));
sections['av-models']=`<section class="section" id="av-models">
 <div class="sec-head"><div class="kicker">AV model and sensor interactions</div><h2>Explore the vehicles. Meet their sensors.</h2><p>Switch between Waymo I-PACE, Cybercab, Aurora truck and Rivian EDV. Rotate each model, inspect its sensors and explore illustrative sensing directions in one shared workspace.</p></div>
 <p class="av-open"><a href="av-model-simulation.html" target="_blank" rel="noopener">Open the standalone AV model simulation ↗</a></p>
 <iframe id="avFrame" class="av-frame" src="av-model-simulation.html?embed=1" loading="lazy" title="Interactive AV models and sensor explorer"></iframe>
</section>`;
const aside=html.match(/<aside class="gf-side" id="gfSide"[\s\S]*?<\/aside>/)[0];
html=html.replace(aside,'');
sections.filters=`<section class="section" id="filters" aria-label="Global dataset filters"><div class="sec-head"><h2>Choose the datasets to screen.</h2><p>Global filters narrow the map, dataset views, register, gallery and screening together. Your vehicle and driving settings stay independent.</p></div><div class="gf-chips"></div>${aside.replace('Dataset filters<button','Global filters<button').replace('Applies to every section at once','Applies to all dataset sections').replace('>Done</button>','>Continue to screening</button>')}</section>`;
const order=['geo','modal','ann','acq','viewpoint','tasks','distress','av-models','drive','register','gallery','filters','readiness','submit'];
sections.geo=sections.geo.replace('Geographic coverage','World Map');
sections.drive=sections.drive.replace('Interactive simulation','Driving and simulation distress on the road').replace("<b>driver's seat</b>",'<b>cabin</b>');
sections.drive=sections.drive.replace(' <div class="sim-legend"',` <div class="sim-touch" aria-label="Driving controls"><button data-drive-action="left" aria-label="Steer left">← Left</button><button data-drive-action="slower">Slower</button><button data-drive-action="faster">Faster</button><button data-drive-action="right" aria-label="Steer right">Right →</button><span>Steering switches to manual control.</span></div>\n <div class="sim-legend"`);
sections.drive=sections.drive.replace(/ <div class="hint">Vehicle response[\s\S]*?<\/div>/,` <div class="hint">Vehicle response, speed, roughness and wear are illustrative, not calibrated dynamics. All four vehicle geometries come from the supplied model projects, including their sensor hardware. Rivian EDV is a driver-operated assistance-equipped van; Auto-drive here is a game control for every model. Cybercab uses a passenger cabin view. Reference-photo credits remain on each card.</div>`);
html=html.replace(/<main>[\s\S]*?<\/main>/,`<main>\n${order.map(k=>sections[k]).join('\n\n')}\n</main>`);
html=html.replace(/<div class="nav-links">[\s\S]*?<\/div>/,`<div class="nav-links">${[['geo','World Map'],['modal','Modalities'],['ann','Annotations'],['acq','Acquisition'],['viewpoint','Viewpoint'],['tasks','AI tasks'],['distress','Distress types'],['av-models','AV models'],['drive','Drive it'],['register','Register'],['gallery','Gallery'],['filters','Filters'],['readiness','Screening'],['submit','Submit']].map(([id,label])=>`<a href="#${id}"${id==='filters'?' id="navFilters"':''}>${label}</a>`).join('')}</div>`);
html=html.replaceAll('PaveData Atlas 1.1','PaveData Atlas 1.2').replace('font-weight:500">1.1</span>','font-weight:500">1.2</span>');
html=html.replace('pavedata_atlas_v1.1_filtered.csv','pavedata_atlas_v1.2_filtered.csv');
html=html.replace('</head>','<link rel="stylesheet" href="src/atlas-v12.css">\n</head>');
html=html.replace('<script src="assets/three.r128.min.js"></script>','<script src="assets/fleet-runtime.js"></script>').replace('<!-- three.js r128, MIT license (see CREDITS.md) -->','<!-- Shared fleet geometry and Three.js r180, MIT -->');
html=html.replace(/const VEHICLES=\{[\s\S]*?\n\};/,`const VEHICLES={
 waymo:{name:'Waymo I-PACE',mass:1,stiff:38,damp:7,camH:3,camD:10,sway:.03,eye:[.35,1.22,-.4]},
 cybercab:{name:'Cybercab',mass:1.05,stiff:36,damp:7,camH:2.6,camD:9.5,sway:.03,eye:[.34,1.12,.2]},
 aurora:{name:'Aurora truck',mass:.6,stiff:24,damp:6,camH:5.2,camD:16,sway:.055,eye:[.65,2.55,-.6]},
 rivian:{name:'Rivian EDV',mass:.75,stiff:28,damp:6.5,camH:4.2,camD:13,sway:.045,eye:[.65,2,-2.3]}
};`);
html=html.replace("veh:'sedan'","veh:'waymo'").replace("segControl('optVeh',VEHICLES,'sedan',setVehicle)","segControl('optVeh',VEHICLES,'waymo',setVehicle)").replace('name:"Driver\'s seat"',"name:'Cabin view'");
html=html.replace(/function buildVehicle\(kind\)\{[\s\S]*?\n\}\n\/\* driver's-seat/,`function buildVehicle(kind){
 const V=VEHICLES[kind],model=AtlasFleet.createFleetModel(kind),spec=model.spec;
 const car=new THREE.Group();model.vehicle.rotation.y=Math.PI/2;car.add(model.vehicle);
 const len=spec.length,wid=spec.width,front=-len/2,rear=len/2,lights=[],tails=[];
 [-1,1].forEach(side=>{
  lights.push(headlightUnit(side*(wid/2-.3),kind==='aurora'?1: .78,front,car,kind==='aurora'?1.25:1));
  const tail=new THREE.Mesh(new THREE.BoxGeometry(.18,.09,.035),MAT.tail());tail.position.set(side*(wid/2-.25),.85,rear);car.add(tail);tails.push(tail);
 });
 const ground=new THREE.Group(),pool=lightPool(ground,front,wid);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(wid+.8,len+.6),new THREE.MeshBasicMaterial({map:radialTex('rgba(0,0,0,.55)','rgba(0,0,0,0)'),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;ground.add(shadow);
 return {group:car,ground,body:model.body,model,wheels:model.wheels,lights,tails,pool,V,len};
}
/* driver's-seat`);
html=html.replace(/function applyViewToCar\(\)\{[\s\S]*?\n\}/,`function applyViewToCar(){
 if(!S3)return;const first=SIM.view==='first';S3.car.model.setGhost(first);S3.car.model.sensorRoot.visible=!first;
}`);
html=html.replace('function setVehicle(k){ SIM.veh=k;',"function setVehicle(k){ if(!VEHICLES[k])return; SIM.veh=k; syncViewerVehicle(k);");
html=html.replace(/car\.wheels\.forEach\(w=>\{w\.rotation\.x-=sp\/[\s\S]*?\}\);/,"car.wheels.forEach(w=>{w.rotation.z-=sp/car.model.spec.radius; if(/front/i.test(w.name)) w.rotation.y=-SIM.steer;});");
html=html.replaceAll('.encoding=THREE.sRGBEncoding','.colorSpace=THREE.SRGBColorSpace').replace('renderer.outputEncoding=THREE.sRGBEncoding','renderer.outputColorSpace=THREE.SRGBColorSpace');
html=html.replace('S3.sun.intensity=sunI;','S3.sun.intensity=sunI*Math.PI;').replace('S3.amb.intensity=ambI;','S3.amb.intensity=ambI*Math.PI;').replace('S3.hemi.intensity=night?.12:.45;','S3.hemi.intensity=(night?.12:.45)*Math.PI;').replace('on?(night?7:4):0','on?(night?85:60):0');
html=html.replace(/function openSidebar\(focusDim\)\{[\s\S]*?\nfunction closeSidebar\(\)[^\n]*/,`function openSidebar(focusDim){
 renderSidebar();const target=focusDim?document.querySelector('.gf-group[data-dim="'+focusDim+'"]'):document.getElementById('filters');
 if(target){if(focusDim)target.open=true;target.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});}
}
function closeSidebar(){document.getElementById('readiness').scrollIntoView({behavior:RM?'auto':'smooth'});}`);
// Escape closes overlays without jumping away from the section being read.
html=html.replace("if(e.key==='Escape'){closeSidebar();closeMS();}","if(e.key==='Escape'){closeMS();}");
// Synchronous initialization can access this function; stateful wiring runs after the page script.
html=html.replace('function setVehicle(k)',"function syncViewerVehicle(key){const frame=document.getElementById('avFrame');if(frame?.contentWindow)frame.contentWindow.postMessage({type:'atlas-vehicle',vehicle:key},location.origin==='null'?'*':location.origin);}\nfunction setVehicle(k)");
html=html.replace(/document\.getElementById\('sbStart'\)\.addEventListener\('click',\(\)=>\{[\s\S]*?\n\}\);/,`document.getElementById('sbStart').addEventListener('click',()=>{
 try{if(!SIM.started){simInit();SIM.started=true;SIM.raf=requestAnimationFrame(simStep);}document.getElementById('simStart').style.display='none';SIM.running=true;SIM.last=performance.now();document.getElementById('sbPause').textContent='Pause';}
 catch(error){document.getElementById('sbStart').textContent=/WebGL|context/i.test(error.message)?'3D needs WebGL 2. Enable hardware acceleration, then retry.':'The driving scene could not start. Reload the page to retry.';console.error(error);}
});`);
html=html.replace('</body>','<script src="src/atlas-integration.js"></script>\n</body>');
if(!html.includes('model=AtlasFleet.createFleetModel(kind)')||html.includes("if(kind==='sedan')"))throw new Error('Driving model migration did not apply.');
await writeFile(new URL('index.html',import.meta.url),html);
console.log('Created v1.2 index: 13 content modules plus global filters before screening.');
