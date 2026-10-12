import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {FLEET,createFleetModel,disposeModel} from './fleet.js';

const $=id=>document.getElementById(id), esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search), embedded=params.has('embed'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(embedded)document.body.classList.add('embedded');
let model,selected,renderer,controls,visible=true,boxSize=6,center=new THREE.Vector3(),last=0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#f0f2f5');
const camera=new THREE.PerspectiveCamera(36,1,.05,160);
const coverage=new THREE.Group(),connectors=new THREE.Group();scene.add(coverage,connectors);
try{
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 $('viewport').prepend(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.autoRotateSpeed=.7;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.4;controls.maxDistance=70;
 const environment=new RoomEnvironment();const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(environment,.04).texture;environment.dispose();pm.dispose();
 scene.add(new THREE.HemisphereLight(0xffffff,0x9aa4b0,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(5,10,6);scene.add(light);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(40,64),new THREE.MeshStandardMaterial({color:0xe8ecf0,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;scene.add(floor);
 $('loading').hidden=true;
}catch(error){$('loading').textContent='3D needs WebGL 2 and browser hardware acceleration. You can still browse every sensor in the index below.';['focus','ghost','coverage','labels','rotate','separate','doors','optional'].forEach(id=>$(id).disabled=true);document.querySelectorAll('[data-view]').forEach(b=>b.disabled=true);}

function clearGraphics(group){while(group.children.length){const obj=group.children[0];group.remove(obj);obj.geometry?.dispose();obj.material?.dispose();}}
function activeSensors(){return model.sensors.filter(s=>!s.optional||$('optional').checked);}
function filtered(){const q=$('search').value.trim().toLowerCase(),f=$('family').value;return activeSensors().filter(s=>(f==='all'||s.type===f)&&(!q||`${s.id} ${s.name} ${s.location} ${s.type}`.toLowerCase().includes(q)));}
function home(view='home'){
 if(!controls)return;
 const optional=$('optional').checked&&model.trailer;
 center.set(optional?-6:0,model.spec.height*.43,0);boxSize=optional?22:model.spec.length;
 const distance=Math.max(boxSize*1.55,boxSize/(2*Math.tan(camera.fov*Math.PI/360)*Math.min(camera.aspect,1))*1.15);
 const dirs={home:[1,.6,1.25],front:[1,.18,0],rear:[-1,.18,0],left:[0,.16,1],right:[0,.16,-1],top:[0,1,.001]};
 const direction=new THREE.Vector3(...(dirs[view]||dirs.home)).normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);
 if(view==='cabin'){camera.position.set(.15,model.spec.height*.66,model.spec.width*.12);controls.target.set(model.spec.length*.6,model.spec.height*.53,0);$('ghost').checked=true;model.setGhost(true);}
 controls.autoRotate=false;$('rotate').checked=false;controls.update();
}
function select(id){
 selected=filtered().find(s=>s.id===id)||filtered()[0]||null;
 if(!selected){$('detail').innerHTML='<p>No matching sensor. Clear your search or choose another family.</p>';$('focus').disabled=true;$('next').disabled=true;renderList();updateGraphics();return;}
 const s=selected,t=model.types[s.type]||{},source=model.sources[s.source];
 $('detail').innerHTML=`<div class="detail-type">${esc(t.label||s.type)} · ${esc(s.id)} · model annotation</div><h4>${esc(s.name)}</h4><p>${esc(s.description||s.subtype)}</p><dl><dt>Location</dt><dd>${esc(s.location)}</dd><dt>Role / output</dt><dd>${esc(s.output||s.role||t.output||s.subtype||'Supporting hardware')}</dd></dl><p class="detail-note">${esc(s.note)}${s.evidence?' Evidence: '+esc(s.evidence)+'.':''}</p>${source?`<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title||source.name)} ↗</a>`:''}`;
 $('focus').disabled=!renderer;$('next').disabled=false;
 if(s.interior||/cabin|compute|concealed/i.test(`${s.location} ${s.name}`)){$('ghost').checked=true;model.setGhost(true);}
 renderList();updateGraphics();
}
function renderList(){
 const list=filtered(),host=$('sensor-list');
 const focusedId=host.contains(document.activeElement)?document.activeElement.dataset.sensor:null;
 const scrollTop=host.scrollTop;
 $('sensor-count').textContent=`${list.length} of ${activeSensors().length} annotations`;
 host.innerHTML=list.length?list.map(s=>`<button class="sensor-row" data-sensor="${s.id}" aria-pressed="${selected===s}" style="--type:${model.types[s.type]?.color||'#556677'}"><strong>${s.id}</strong><span>${esc(s.name)}</span></button>`).join(''):'<p class="empty">No matching sensors. Try another name or reset the sensor family.</p>';
 if(focusedId){host.querySelector(`[data-sensor="${focusedId}"]`)?.focus({preventScroll:true});host.scrollTop=scrollTop;}
}
function updateGraphics(){
 clearGraphics(coverage);clearGraphics(connectors);if(!model)return;
 const explode=+$('separate').value/100;
 const shown=new Set(filtered());
 for(const s of model.sensors){
  const outward=s.base.clone().sub(new THREE.Vector3(0,model.spec.height*.4,0)).normalize();outward.y+=.3;
  s.group.position.copy(s.base).addScaledVector(outward,explode*model.spec.width*.7);s.group.visible=shown.has(s);
  if(explode&&shown.has(s)){const g=new THREE.BufferGeometry().setFromPoints([s.base,s.group.position]);connectors.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:model.types[s.type]?.color,transparent:true,opacity:.45})));}
 }
 if(!$('coverage').checked||!selected||!renderer)return;
 const s=selected,type=s.type,color=model.types[type]?.color||'#0071e3',origin=s.group.position.clone();
 if(['support','fleet','sensing'].includes(type))return;
 if(type==='audio'||(type==='lidar'&&model.key==='waymo'&&s.id==='L01')){
  for(const radius of [.6,1.1,1.6]){const points=Array.from({length:65},(_,i)=>new THREE.Vector3(origin.x+Math.cos(i*Math.PI/32)*radius,origin.y-.2*radius,origin.z+Math.sin(i*Math.PI/32)*radius));coverage.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity:.6})));}
 }else{
  const length=model.spec.length*.43,dir=s.dir.clone().normalize(),end=origin.clone().addScaledVector(dir,length);const right=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0)).normalize();if(right.length()<.1)right.set(1,0,0);const up=new THREE.Vector3().crossVectors(right,dir).normalize();
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>end.clone().addScaledVector(right,x*length*.38).addScaledVector(up,y*length*.23));const vertices=[];
  for(let i=0;i<4;i++){vertices.push(...origin.toArray(),...corners[i].toArray(),...corners[(i+1)%4].toArray());coverage.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin,corners[i],corners[(i+1)%4]]),new THREE.LineBasicMaterial({color,transparent:true,opacity:.55})));}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();coverage.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false})));
 }
}
function loadModel(key,notify=true){
 if(!FLEET[key])return;
 if(model){scene.remove(model.vehicle);disposeModel(model);}
 model=createFleetModel(key);scene.add(model.vehicle);selected=null;
 $('model-name').textContent=model.spec.name;$('model-role').textContent=model.spec.role;$('model-note').textContent=model.spec.note+' All models are educational reconstructions with approximate geometry.';
 $('source-notes').href=`src/models/${{waymo:'waymo-ipace',cybercab:'cybercab',aurora:'aurora-truck',rivian:'rivian-edv'}[key]}/SOURCE-README.md`;
 $('drive-link').href=`index.html?vehicle=${key}#drive`;
 for(const id of ['ghost','optional','doors','rotate'])$(id).checked=false;$('separate').value=0;$('separate-value').textContent='0%';$('search').value='';
 $('optional-label').hidden=!['aurora','rivian'].includes(key);$('optional-name').textContent=key==='aurora'?'Trailer':'Fleet additions';$('doors-label').hidden=key!=='cybercab';
 $('family').innerHTML='<option value="all">All families</option>'+Object.entries(model.types).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('');
 document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.model===key));
 $('markers').innerHTML=model.sensors.map(s=>`<button class="marker" data-sensor="${s.id}" title="${esc(s.name)}" aria-label="Select ${esc(s.name)}" style="--type:${model.types[s.type]?.color||'#556677'}">${s.id}</button>`).join('');
 for(const s of model.sensors)s.marker=$('markers').querySelector(`[data-sensor="${s.id}"]`);
 select(activeSensors()[0]?.id);home();
 if(notify&&embedded)parent.postMessage({type:'atlas-vehicle',vehicle:key},location.origin==='null'?'*':location.origin);
}
$('fleet-tabs').innerHTML=Object.entries(FLEET).map(([key,v])=>`<button data-model="${key}" aria-pressed="false">${v.name}</button>`).join('');
$('fleet-tabs').onclick=e=>{const b=e.target.closest('[data-model]');if(b)loadModel(b.dataset.model);};
for(const id of ['sensor-list','markers'])$(id).onclick=e=>{const b=e.target.closest('[data-sensor]');if(b)select(b.dataset.sensor);};
$('family').onchange=()=>select(selected?.id);$('search').oninput=()=>select(selected?.id);
$('ghost').onchange=()=>model.setGhost($('ghost').checked);
$('coverage').onchange=updateGraphics;$('labels').onchange=()=>{$('markers').hidden=!$('labels').checked;};
$('rotate').onchange=()=>{if(controls)controls.autoRotate=$('rotate').checked;};
$('separate').oninput=()=>{$('separate-value').textContent=$('separate').value+'%';updateGraphics();};
$('optional').onchange=()=>{model.setOptional($('optional').checked);select(selected?.id);home();};
$('doors').onchange=()=>model.setDoors?.($('doors').checked?1:0);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>home(b.dataset.view));
$('focus').onclick=()=>{if(!selected||!controls)return;const p=selected.group.position.clone(),d=selected.dir.clone();d.y=Math.max(d.y,.45);camera.position.copy(p).addScaledVector(d.normalize(),model.spec.width*1.2);controls.target.copy(p);controls.autoRotate=false;$('rotate').checked=false;controls.update();};
$('next').onclick=()=>{const list=filtered();select(list[(list.indexOf(selected)+1)%list.length]?.id);};
$('export-model').onclick=async()=>{
 const button=$('export-model');button.disabled=true;$('export-status').textContent='Preparing assembled model…';let clean;
 try{clean=createFleetModel(model.key);clean.setOptional($('optional').checked);const buffer=await new GLTFExporter().parseAsync(clean.vehicle,{binary:true,onlyVisible:true});const url=URL.createObjectURL(new Blob([buffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=`${model.key}-atlas-model.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('export-status').textContent='Model exported.';}catch(error){$('export-status').textContent='Export failed. Please try again.';console.error(error);}finally{if(clean)disposeModel(clean);button.disabled=false;}
};
if(renderer){
 const resize=()=>{const w=$('viewport').clientWidth,h=$('viewport').clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe($('viewport'));resize();
 let down;renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(filtered().map(s=>s.group),true)[0];if(hit?.object.userData.sensorId)select(hit.object.userData.sensorId);});
 $('viewport').onkeydown=e=>{if(e.target!==$('viewport')&&e.target!==renderer.domElement)return;const key=e.key.toLowerCase();if(!['arrowleft','arrowright','arrowup','arrowdown','+','=','-','r','escape'].includes(key))return;e.preventDefault();if(key==='r'){home();return;}if(key==='escape'){controls.autoRotate=false;$('rotate').checked=false;return;}const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);if(key==='arrowleft')spherical.theta-=.12;if(key==='arrowright')spherical.theta+=.12;if(key==='arrowup')spherical.phi=Math.max(.05,spherical.phi-.1);if(key==='arrowdown')spherical.phi=Math.min(Math.PI*.49,spherical.phi+.1);if(key==='+'||key==='=')spherical.radius=Math.max(.4,spherical.radius*.9);if(key==='-')spherical.radius=Math.min(70,spherical.radius*1.1);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();};
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe($('viewport'));
}
window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='atlas-vehicle')return;if(e.origin!==location.origin&&e.origin!=='null')return;if(e.data.vehicle!==model?.key)loadModel(e.data.vehicle,false);});
loadModel(FLEET[params.get('vehicle')]?params.get('vehicle'):'waymo',false);
if(embedded)new ResizeObserver(()=>parent.postMessage({type:'atlas-viewer-height',height:Math.ceil(document.documentElement.getBoundingClientRect().height)},location.origin==='null'?'*':location.origin)).observe(document.body);
function frame(time){requestAnimationFrame(frame);if(!renderer||!visible||document.hidden)return;const dt=Math.min((time-last)/1000||.016,.1);last=time;if(reduced)controls.autoRotate=false;controls.update(dt);scene.updateMatrixWorld();const rect=$('viewport').getBoundingClientRect(),occupied=[];const shown=new Set(filtered());for(const s of [selected,...model.sensors.filter(s=>s!==selected)].filter(Boolean)){const p=s.group.getWorldPosition(new THREE.Vector3()).project(camera),x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;const show=shown.has(s)&&p.z>-1&&p.z<1&&x>14&&x<rect.width-14&&y>12&&y<rect.height-12&&!occupied.some(([a,b])=>Math.abs(x-a)<32&&Math.abs(y-b)<23);s.marker.hidden=!show;s.marker.setAttribute('aria-pressed',s===selected);if(show){occupied.push([x,y]);s.marker.style.transform=`translate(${x-13}px,${y-10}px)`;}}renderer.render(scene,camera);}
requestAnimationFrame(frame);
