import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {FLEET,createFleetModel,disposeModel} from './fleet.js';
import {asphaltTexture,setSceneLighting,surfaceMaterial,meshBox,makeTree} from './scene-environment.js';
import {showVehicleDatasets} from './vehicle-datasets.js';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),embedded=params.has('embed');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(embedded)document.body.classList.add('embedded');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(52,1,.09,320),clock=new THREE.Clock();
const distressGroup=new THREE.Group(),sketchGroup=new THREE.Group();scene.add(distressGroup,sketchGroup);
const headlightGroup=new THREE.Group(),headlights=[];scene.add(headlightGroup);
const streetLampMaterial=new THREE.MeshStandardMaterial({color:'#e8e4d2',emissive:'#ffdba1',emissiveIntensity:.1});
let rain,rainPositions;const rainCount=900;
const lane=-3.2,intersections=[0,140],signals=[],traffic=[],pedestrians=[],keys=new Set();
const scenario={time:0,x:-62,z:lane,speed:0,distance:0,running:false,camera:'chase',body:0,bodyVelocity:0,accel:0,lap:0};
let renderer,sun,model,visible=true,dirty=true,lastUI=0,lastTrace=0,trace=[],traceWindow=[],chartContext=$('response-chart').getContext('2d');
const materials={road:surfaceMaterial('#a5afb5'),line:surfaceMaterial('#efefdd'),yellow:surfaceMaterial('#e0b942'),curb:surfaceMaterial('#a1a49e'),sidewalk:surfaceMaterial('#babeb5'),dark:surfaceMaterial('#263139'),metal:surfaceMaterial('#73818b',.45,.55),glass:surfaceMaterial('#274451',.26,.25)};
materials.road.map=asphaltTexture();materials.road.map.repeat.set(100,10);
function box(parent,size,pos,mat){return meshBox(parent,size,pos,mat);}
function cylinder(parent,r,h,pos,mat,segments=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat);m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function addLine(points,color,width=.015,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*4),width,5,false),surfaceMaterial(color));parent.add(mesh);return mesh;}
function textSign(text,color='#f5f6ef',background='#334e68',w=2,h=.65){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,160);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(8,8,496,144);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 54px sans-serif';ctx.fillText(text,256,84,460);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide}));}
function roadMark(x,z,length=3,width=.09,color=materials.line){return box(scene,[length,.012,width],[x,.006,z],color);}
function isCrossing(x,margin=10){return intersections.some(cx=>Math.abs(x-cx)<margin);}

function buildStreet(){
 const lawn=new THREE.Mesh(new THREE.PlaneGeometry(900,650),surfaceMaterial('#8d9d7b'));lawn.rotation.x=-Math.PI/2;lawn.position.y=-.085;lawn.receiveShadow=true;scene.add(lawn);
 box(scene,[580,.1,14],[35,-.055,0],materials.road);
 for(const side of [-1,1]){
  for(let x=-240;x<315;x+=4){if(isCrossing(x,10))continue;box(scene,[3.98,.17,4],[x,.025,side*9.1],materials.sidewalk);box(scene,[3.98,.24,.22],[x,.012,side*7.18],materials.curb);}
  for(let x=-230;x<305;x+=6){if(isCrossing(x,13))continue;roadMark(x,side*.16,5,.11,materials.yellow);}
  for(let x=-230;x<305;x+=6){if(isCrossing(x,13))continue;roadMark(x,side*6.15,4,.12);}
 }
 for(const cx of intersections){
  box(scene,[14,.09,280],[cx,-.042,0],materials.road);
  for(const s of [-1,1]){
   for(let z=-120;z<=120;z+=4){if(Math.abs(z)<10)continue;box(scene,[4,.18,3.98],[cx+s*9.1,.025,z],materials.sidewalk);box(scene,[.22,.24,3.98],[cx+s*7.18,.012,z],materials.curb);}
   for(let z=-120;z<125;z+=6)if(Math.abs(z)>13)for(const dz of [-.16,.16])box(scene,[.11,.012,5],[cx+dz,.01,z],materials.yellow);
   // Crosswalks and stop lines leave a clear conflict area.
   for(let i=0;i<12;i++){box(scene,[2.4,.014,.42],[cx+s*9.2,.015,-5.6+i*1.0],materials.line);box(scene,[.42,.014,2.4],[cx-5.6+i,.015,s*9.2],materials.line);}
   box(scene,[.24,.015,5.8],[cx+s*11.1,.017,-s*3.2],materials.line);box(scene,[5.8,.015,.24],[cx+s*3.2,.017,s*11.1],materials.line);
   for(const z of [-8.3,8.3])buildSignal(cx+s*8.3,z,Math.sign(z)===s?'main':'cross',s);
   const street=textSign(cx===0?'ATLAS AVENUE':'RESEARCH WAY');street.position.set(cx+s*8.6,3.2,s*8.9);scene.add(street);
  }
 }
 // Buildings use repeated window geometry, overhangs and planted footways.
 const facadeColors=['#a5a092','#89999b','#95785e','#b8b4a4','#758e97','#b09575'];
 for(let i=0;i<26;i++){
  const x=-195+i*20;if(isCrossing(x,23))continue;
  for(const side of [-1,1]){
   const z=side*(23+(i%3)*3),height=5+(i%5)*2.4,w=12+(i%3),depth=13,facade=surfaceMaterial(facadeColors[(i+(side>0?1:0))%6]);
   box(scene,[w,height,depth],[x,height/2,z],facade);box(scene,[w+.5,.3,depth+.5],[x,height+.08,z],materials.curb);
   box(scene,[w*.85,.45,1.0],[x,3.15,z-side*(depth/2+.25)],materials.dark);
   const floors=Math.floor(height/2.7);for(let floor=0;floor<floors;floor++){box(scene,[w,.065,.16],[x,.95+floor*2.7,z-side*(depth/2+.07)],materials.curb);for(let col=0;col<4;col++){const wx=x-w/2+2+col*(w-2.4)/4;box(scene,[1.80,1.58,.05],[wx,1.85+floor*2.7,z-side*(depth/2+.04)],materials.dark);box(scene,[1.59,1.35,.04],[wx,1.85+floor*2.7,z-side*(depth/2+.085)],materials.glass);box(scene,[1.86,.10,.21],[wx,1.08+floor*2.7,z-side*(depth/2+.16)],materials.curb);box(scene,[.04,1.38,.05],[wx,1.85+floor*2.7,z-side*(depth/2+.13)],materials.metal);}}
   box(scene,[1.7,2.5,.09],[x,1.27,z-side*(depth/2+.08)],materials.dark);box(scene,[.04,1.0,.02],[x+.47,1.4,z-side*(depth/2+.15)],materials.metal);
   if(i%3===0){const sign=textSign(i%2?'MOBILITY LAB':'ATLAS MARKET','#f3f5f2',i%2?'#435d70':'#587362',w*.7,.7);sign.position.set(x,3.55,z-side*(depth/2+.1));if(side>0)sign.rotation.y=Math.PI;scene.add(sign);}
   makeTree(scene,x+6.6,side*10.8,.95+(i%3)*.13);
  }
 }
 for(let x=-185;x<300;x+=24){if(isCrossing(x,15))continue;for(const s of [-1,1]){
  cylinder(scene,.07,5.1,[x,2.55,s*7.8],materials.metal);box(scene,[.08,.08,1.5],[x,5.05,s*7.1],materials.metal);box(scene,[.65,.13,.37],[x,5.06,s*6.5],materials.dark);box(scene,[.55,.025,.29],[x,4.98,s*6.5],streetLampMaterial);
  if(x%3===0){box(scene,[1.6,.13,.5],[x+3,.63,s*9],surfaceMaterial('#756857'));box(scene,[1.6,.55,.10],[x+3,.91,s*9.2],surfaceMaterial('#756857'));for(const dx of [-.62,.62])box(scene,[.08,.6,.43],[x+3+dx,.30,s*9],materials.metal);}
 }}
 const speed=textSign('30','#26313a','#f4f4eb',.62,.75);speed.position.set(-60,2.05,-7.8);speed.rotation.y=Math.PI/2;scene.add(speed);cylinder(scene,.034,2.3,[-60,1.15,-7.8],materials.metal);
 const works=textSign('SURFACE STUDY','#353d42','#e8c15e',2.3,.65);works.position.set(-49,2.05,-8.0);works.rotation.y=Math.PI/2;scene.add(works);cylinder(scene,.035,2.1,[-49,1.05,-8],materials.metal);
 // Sidewalk pedestrians remain outside vehicle paths and pause with the scene.
 for(let i=0;i<10;i++){const person=new THREE.Group(),shirt=surfaceMaterial(['#516c8a','#aa7860','#667957','#865e64'][i%4]);cylinder(person,.12,.57,[0,1.12,0],shirt,10);const head=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),surfaceMaterial('#b88f72'));head.position.y=1.55;person.add(head);const legs=[];for(const s of [-1,1]){const leg=box(person,[.105,.61,.12],[s*.075,.55,0],materials.dark);legs.push(leg);box(person,[.08,.52,.10],[s*.18,1.11,0],shirt);}person.position.set(-80+i*22,0,i%2?-9.5:9.5);scene.add(person);pedestrians.push({group:person,legs,start:person.position.x,phase:i,speed:i%2?.58:-.62});}
}
function buildSignal(x,z,axis,side){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);cylinder(group,.075,4.1,[0,2.05,0],materials.metal);
 const head=new THREE.Group();head.position.set(0,3.35,0);head.rotation.y=axis==='main'?Math.PI/2*(side<0?-1:1):(z>0?0:Math.PI);group.add(head);
 box(head,[.36,1.03,.29],[0,0,0],materials.dark);
 const bulbs=[];for(let i=0;i<3;i++){const color=['#d5493f','#e7b142','#59a279'][i],mat=new THREE.MeshStandardMaterial({color:'#263536',emissive:color,emissiveIntensity:0,roughness:.3});const light=new THREE.Mesh(new THREE.CircleGeometry(.112,24),mat);light.position.set(0,.30-i*.30,.152);head.add(light);bulbs.push(mat);const visor=new THREE.Mesh(new THREE.CylinderGeometry(.125,.125,.13,20,1,true,0,Math.PI),materials.dark);visor.rotation.x=Math.PI/2;visor.rotation.z=Math.PI/2;visor.position.set(0,.30-i*.30,.17);head.add(visor);}
 signals.push({bulbs,axis});
}
function signalPhase(time){const t=time%38;if(t<15)return{main:'green',cross:'red',remaining:15-t};if(t<18)return{main:'amber',cross:'red',remaining:18-t};if(t<20)return{main:'red',cross:'red',remaining:20-t};if(t<33)return{main:'red',cross:'green',remaining:33-t};if(t<36)return{main:'red',cross:'amber',remaining:36-t};return{main:'red',cross:'red',remaining:38-t};}
function paintSignals(phase){for(const signal of signals){const active={red:0,amber:1,green:2}[phase[signal.axis]];signal.bulbs.forEach((m,i)=>{m.emissiveIntensity=i===active?2.7:0;m.color.set(i===active?['#ab3f34','#d39c32','#387d57'][i]:'#243035');});}}
function makeTrafficVehicle(color){
 const group=new THREE.Group(),paint=new THREE.MeshPhysicalMaterial({color,roughness:.38,metalness:.35,clearcoat:.5}),glass=materials.glass,wheels=[];
 const hull=new THREE.Mesh(new RoundedBoxGeometry(4.4,.66,1.84,2,.14),paint);hull.position.y=.78;hull.castShadow=true;group.add(hull);
 const cab=new THREE.Mesh(new RoundedBoxGeometry(2.4,.60,1.57,2,.16),glass);cab.position.set(-.3,1.36,0);cab.castShadow=true;group.add(cab);box(group,[2.18,.08,1.50],[-.34,1.66,0],paint);
 for(const s of [-1,1]){box(group,[.075,.13,.50],[2.20,.83,s*.61],new THREE.MeshStandardMaterial({color:'#e6e9d7',emissive:'#dae6ed',emissiveIntensity:.5}));box(group,[.06,.15,.45],[-2.21,.83,s*.6],new THREE.MeshStandardMaterial({color:'#993b3a',emissive:'#af302c',emissiveIntensity:.4}));for(const x of [-1.40,1.39]){const wheel=cylinder(group,.34,.22,[x,.38,s*.88],materials.dark,20);wheel.rotation.x=Math.PI/2;wheels.push(wheel);const rim=cylinder(group,.21,.235,[x,.38,s*.9],materials.metal,16);rim.rotation.x=Math.PI/2;}}
 scene.add(group);return{group,wheels};
}
function buildTraffic(){
 const colors=['#8798a3','#8f564b','#d8dbd4','#516579','#858972','#b7b9b5','#ab956d','#54766f'];
 for(let i=0;i<8;i++){const car=makeTrafficVehicle(colors[i]),cross=i>=4,dir=i%2?1:-1;traffic.push({...car,axis:cross?'cross':'main',dir,p:cross?-65+(i-4)*37:[-110,-18,45,110][i],speed:0,max:cross?6:8,intersection:i>=6?140:0});}
}
function stopDistance(position,dir,axis,phase,halfLength){
 if(phase[axis]==='green')return Infinity;let nearest=Infinity;
 const crosses=axis==='main'?intersections:[0];
 for(const cross of crosses){const signed=(cross-position)*dir;const stop=signed-11.7-halfLength;if(signed>11.7+halfLength-.5)nearest=Math.min(nearest,Math.max(0,stop));}
 return nearest;
}
function moveTraffic(dt,phase){
 for(const car of traffic){
  const stop=stopDistance(car.p,car.dir,car.axis,phase,2.2);let desired=Math.min(car.max,Math.sqrt(Math.max(0,2*2.8*stop))),available=stop;
  for(const other of traffic){if(other===car||other.axis!==car.axis||other.dir!==car.dir||other.intersection!==car.intersection)continue;const separation=(other.p-car.p)*car.dir,gap=separation-6.4;if(separation>0){available=Math.min(available,Math.max(0,gap));desired=Math.min(desired,Math.sqrt(Math.max(0,2*2.4*gap)));}}
  if(car.axis==='main'&&car.dir===1){const separation=scenario.x-car.p,gap=separation-model.spec.length*.5-4.2;if(separation>0){available=Math.min(available,Math.max(0,gap));desired=Math.min(desired,Math.sqrt(Math.max(0,2*2.8*gap)));}}
  car.speed=THREE.MathUtils.damp(car.speed,desired,2.7,dt);if(available<.15&&car.speed<.5)car.speed=0;car.p+=Math.min(car.speed*dt,available)*car.dir;
  if(car.axis==='main'){if(car.p>275)car.p=-190;if(car.p< -190)car.p=275;car.group.position.set(car.p,.035,car.dir>0?lane:-lane);car.group.rotation.y=car.dir>0?0:Math.PI;}
  else{if(car.p>105)car.p=-105;if(car.p< -105)car.p=105;car.group.position.set(car.intersection+(car.dir>0?3.2:-3.2),.035,car.p);car.group.rotation.y=car.dir>0?-Math.PI/2:Math.PI/2;}
  car.wheels.forEach(w=>w.rotation.y+=car.speed*dt/.34);
 }
}
const descriptions={smooth:'A smooth reference surface. Select a distress to compare the animated vehicle response.',pothole:'A localized depression in the study lane. Displacement sets the example depth; appearance and spring response are illustrative.',cracks:'Three transverse openings create short inputs at the wheel paths. The setting controls example displacement, not crack width or a condition rating.',longitudinal:'An opening parallel to travel in the left wheel path. Steering within the lane changes whether the wheel crosses it; displacement is illustrative.',alligator:'A connected fatigue-crack pattern in the wheel paths. The example rough profile is synthetic, not an observed condition rating.',rutting:'Two long wheel-path depressions. The example profile eases into and out of the rutted section.',patch:'A raised repair patch with an example edge transition. Displacement sets its illustrative height.',raveling:'An example loss of surface aggregate with irregular local roughness. The displacement parameter does not classify real raveling severity.',manhole:'A circular utility cover with an example level difference. Move within the lane to compare crossing and avoiding it.'};
function disposeGroup(group){while(group.children.length){const child=group.children[0];group.remove(child);child.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat().filter(Boolean))m.dispose();});}}
function buildDistress(){
 disposeGroup(distressGroup);const type=$('distress').value,depth=+$('severity').value/1000;const dark=surfaceMaterial('#30383c'),edge=surfaceMaterial('#4b5051'),patch=surfaceMaterial('#595c5b');
 $('distress-description').textContent=descriptions[type];$('surface-tag').textContent=$('distress').selectedOptions[0].textContent;$('severity').disabled=type==='smooth';$('severity-label').textContent=type==='smooth'?'Reference':`${Math.round(depth*1000)} mm`;
 if(type==='pothole'){
  const shape=new THREE.Shape();for(let i=0;i<=48;i++){const angle=i*Math.PI/24,r=1+.10*Math.sin(i*2.7)+.045*Math.cos(i*1.2);const x=Math.cos(angle)*1.34*r,y=Math.sin(angle)*1.05*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}const hole=new THREE.Mesh(new THREE.ShapeGeometry(shape),dark);hole.rotation.x=-Math.PI/2;hole.position.set(-31,.021,lane);distressGroup.add(hole);
  const points=[];for(let i=0;i<=48;i++){const a=i*Math.PI/24,r=1+.10*Math.sin(i*2.7)+.045*Math.cos(i*1.2);points.push([-31+Math.cos(a)*1.34*r,.027,lane+Math.sin(a)*1.05*r]);}addLine(points,'#777670',.055,distressGroup);
  for(let i=0;i<16;i++){const a=i*2.399;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.08+(i%3)*.015),edge);rock.scale.y=.3;rock.position.set(-31+Math.cos(a)*1.3,.026,lane+Math.sin(a));distressGroup.add(rock);}
 }else if(type==='cracks'){
  for(const x of [-40,-32,-24]){const points=[];for(let i=0;i<20;i++)points.push([x+Math.sin(i*1.7)*.10,.023,lane-1.7+i*.18]);addLine(points,'#282f32',.027+depth*.18,distressGroup);addLine([[x+.02,.022,lane-.2],[x+.7,.022,lane-.6],[x+1.15,.022,lane-.4]],'#383e3e',.012,distressGroup);}
 }else if(type==='longitudinal'){
  const points=[];for(let i=0;i<=50;i++)points.push([-43+i*.48,.026,lane+.78+Math.sin(i*.89)*.08]);addLine(points,'#272e31',.03+depth*.25,distressGroup);for(let i=0;i<7;i++){const x=-42+i*3.1;addLine([[x,.027,lane+.8],[x+.5,.027,lane+1.1],[x+1.1,.027,lane+1.28]],'#3c4243',.018,distressGroup);}
 }else if(type==='alligator'){
  for(const side of [-1,1]){const z=lane+side*.75;box(distressGroup,[17,.012,1.05],[-32,.017,z],surfaceMaterial('#737574'));for(let i=0;i<17;i++)for(let j=0;j<3;j++){const x=-40+i+.15*Math.sin(j+i),y=z-.5+j*.42;addLine([[x,.028,y],[x+.46,.028,y+.17],[x+.75,.028,y+.04],[x+1.01,.028,y+.23]],'#303637',.018,distressGroup);if(j<2)addLine([[x+.46,.029,y+.17],[x+.31,.029,y+.42],[x+.63,.029,y+.63]],'#303637',.015,distressGroup);}}
 }else if(type==='raveling'){
  box(distressGroup,[18,.015,3.25],[-32,.018,lane],surfaceMaterial('#6b6d69'));const aggregateMaterial=surfaceMaterial('#909087'),aggregateGeometry=new THREE.DodecahedronGeometry(.038,0),aggregate=new THREE.InstancedMesh(aggregateGeometry,aggregateMaterial,550),matrix=new THREE.Matrix4();for(let i=0;i<550;i++){const x=-41+((i*1.618033)%1)*18,z=lane-1.57+((i*.754877)%1)*3.14,s=.5+(i%8)/6;matrix.compose(new THREE.Vector3(x,.026,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(i,i*.3,i*.7)),new THREE.Vector3(s,.25,s));aggregate.setMatrixAt(i,matrix);}aggregate.receiveShadow=true;distressGroup.add(aggregate);
 }else if(type==='manhole'){
  const cover=cylinder(distressGroup,.68,.035,[-31,.028+depth,lane+.78],surfaceMaterial('#565e60',.75,.5),48);const ring=new THREE.Mesh(new THREE.TorusGeometry(.70,.07,8,48),surfaceMaterial('#82857d'));ring.rotation.x=Math.PI/2;ring.position.set(-31,.03,lane+.78);distressGroup.add(ring);for(let i=-4;i<=4;i++){const len=2*Math.sqrt(.59**2-(i*.12)**2);box(distressGroup,[len,.007,.018],[-31,depth+.05,lane+.78+i*.12],dark);}for(const x of [-31.35,-30.65])box(distressGroup,[.10,.007,.04],[x,depth+.055,lane+.78],dark);
 }else if(type==='rutting'){
  for(const s of [-1,1]){box(distressGroup,[23,.018,.57],[-31,.018,lane+s*.83],dark);for(const side of [-1,1])box(distressGroup,[23,.025,.10],[-31,.026,lane+s*.83+side*.34],edge);}
 }else if(type==='patch'){box(distressGroup,[16,depth,3.4],[-32,depth/2+.012,lane],patch);for(const z of [-1.76,1.76])box(distressGroup,[16.3,.02,.09],[-32,.026,lane+z],dark);for(const x of [-40.15,-23.85])box(distressGroup,[.12,.02,3.55],[x,.026,lane],dark);}
 for(const x of [-45,-18]){const cone=new THREE.Mesh(new THREE.ConeGeometry(.15,.5,14),surfaceMaterial('#d8873d'));cone.position.set(x,.28,-6.5);cone.castShadow=true;distressGroup.add(cone);box(distressGroup,[.38,.035,.38],[x,.023,-6.5],surfaceMaterial('#333d43'));}
 dirty=true;
}
function roadHeight(x,z){const type=$('distress').value,d=+$('severity').value/1000;if(type==='smooth'||Math.abs(z-lane)>1.75)return 0;
 if(type==='pothole'){const r=Math.sqrt(((x+31)/1.4)**2+((z-lane)/1.15)**2);return r<1?-d*Math.pow(Math.cos(r*Math.PI/2),2):0;}
 if(type==='cracks'){let result=0;for(const at of [-40,-32,-24]){const t=Math.abs(x-at);if(t<.17)result-=d*(1-t/.17);}return result;}
 if(type==='longitudinal'){const envelope=THREE.MathUtils.smoothstep(x,-44,-42)*(1-THREE.MathUtils.smoothstep(x,-21,-18)),offset=Math.abs(z-(lane+.78+Math.sin((x+43)/.48*.89)*.08));return offset<.16?-d*envelope*(1-offset/.16):0;}
 if(type==='alligator'){const envelope=THREE.MathUtils.smoothstep(x,-42,-40)*(1-THREE.MathUtils.smoothstep(x,-25,-23));return -d*.30*envelope*(.5+.5*Math.sin(x*6.8+z*3.7))*(.5+.5*Math.cos(x*2.7-z*4.3));}
 if(type==='raveling'){const envelope=THREE.MathUtils.smoothstep(x,-42,-40)*(1-THREE.MathUtils.smoothstep(x,-25,-23));return d*.30*envelope*(Math.sin(x*12+z*8)+Math.sin(x*7.2-z*5))*.5;}
 if(type==='manhole'){const r=Math.hypot(x+31,z-lane-.78);return r<.77?d*(1-THREE.MathUtils.smoothstep(r,.6,.77)):0;}
 if(type==='rutting'){const envelope=THREE.MathUtils.smoothstep(x,-43,-39)*(1-THREE.MathUtils.smoothstep(x,-23,-19));const wheel=Math.min(Math.abs(z-(lane-.83)),Math.abs(z-(lane+.83)));return wheel<.5?-d*envelope*Math.max(0,1-wheel/.5):0;}
 if(type==='patch')return d*THREE.MathUtils.smoothstep(x,-40.5,-39.5)*(1-THREE.MathUtils.smoothstep(x,-24.5,-23.5));return 0;}
function makeSketch(){disposeGroup(sketchGroup);if(!model)return;const color='#3a94ba';for(let i=0;i<9;i++){const angle=-.55+i*.1375;addLine([[0,1.5,0],[Math.cos(angle)*16,.08,Math.sin(angle)*16]],color,.012,sketchGroup);}const ring=[];for(let i=0;i<=64;i++){const a=i*Math.PI/32;ring.push([Math.cos(a)*9,.035,Math.sin(a)*9]);}addLine(ring,color,.022,sketchGroup);sketchGroup.visible=$('sensing').checked;}
function buildWeather(){
 for(const side of [-1,1]){const light=new THREE.SpotLight('#e0efff',0,48,.32,.65,1.4);light.position.set(2.4,.85,side*.64);light.target.position.set(28,.12,side*2.0);headlightGroup.add(light,light.target);headlights.push(light);}
 rainPositions=new Float32Array(rainCount*6);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));rain=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#b9cedd',transparent:true,opacity:.5,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);updateWeather();
}
function updateWeather(){
 const lighting=$('time-of-day').value,weather=$('weather').value,night=lighting==='night',dusk=lighting==='dusk';
 const sky=night?'#182737':dusk?'#858d9c':weather==='rain'?'#a2b5c3':weather==='fog'?'#c4ced1':'#bdcedb';scene.background.set(sky);scene.fog.color.set(sky);scene.fog.near=weather==='fog'?12:weather==='rain'?55:95;scene.fog.far=weather==='fog'?90:weather==='rain'?150:240;
 scene.children.filter(o=>o.isHemisphereLight).forEach(light=>light.intensity=night?.45:dusk?.85:1.3);scene.environmentIntensity=night?.12:dusk?.35:.6;if(sun){sun.intensity=night?.28:dusk?1.4:weather==='rain'?.9:weather==='fog'?1.3:2.6;sun.color.set(night?'#9fbbdb':dusk?'#f8c69d':'#fff2df');}
 materials.road.roughness=weather==='rain'?.27:.85;materials.road.metalness=weather==='rain'?.12:0;materials.road.color.set(weather==='rain'?'#73808c':'#a5afb5');streetLampMaterial.emissiveIntensity=night?2.8:dusk?1.5:.1;
 headlights.forEach(light=>light.intensity=night?70:dusk?35:weather!=='dry'?22:0);if(rain)rain.visible=weather==='rain';
 if(renderer)renderer.toneMappingExposure=night?1.16:1.05;dirty=true;animateWeather();
}
function animateWeather(){
 if(model){headlightGroup.position.set(scenario.x,.025+scenario.body,scenario.z);headlights.forEach((light,i)=>{light.position.set(model.spec.length*.5,Math.max(.72,model.spec.height*.28),(i?1:-1)*model.spec.width*.32);});}
 if(!rain?.visible)return;rain.position.set(scenario.x,0,scenario.z);for(let i=0;i<rainCount;i++){const x=((i*.618033)%1)*80-28,z=((i*.754877)%1)*52-26,y=((i*.56984)*32-scenario.time*15)%32;const at=i*6;rainPositions[at]=x;rainPositions[at+1]=(y+32)%32;rainPositions[at+2]=z;rainPositions[at+3]=x-.09;rainPositions[at+4]=(y+32)%32-.65;rainPositions[at+5]=z+.035;}rain.geometry.attributes.position.needsUpdate=true;
}
function loadVehicle(key,notify=true){
 if(!FLEET[key])return;if(model){scene.remove(model.vehicle);disposeModel(model);}model=createFleetModel(key);model.setOptional(false);model.vehicle.position.set(scenario.x,.025,scenario.z);scene.add(model.vehicle);model.setGhost(scenario.camera==='cabin');
 $('vehicle').value=key;$('vehicle-title').textContent=model.spec.name;$('vehicle-role').textContent=model.spec.role;$('vehicle-note').textContent=model.spec.note;$('sensor-link').href=`av-model-simulation.html?vehicle=${key}`;showVehicleDatasets($('related-datasets'),key);makeSketch();scenario.body=scenario.bodyVelocity=0;for(const car of traffic){if(car.axis!=='main'||car.dir!==1)continue;const clearance=model.spec.length*.5+5.2,delta=car.p-scenario.x;if(Math.abs(delta)<clearance)car.p=scenario.x+(delta>=0?1:-1)*clearance;}animateWeather();dirty=true;
 if(notify&&embedded)parent.postMessage({type:'atlas-vehicle',vehicle:key},location.origin==='null'?'*':location.origin);
}
function reset(approach=false){Object.assign(scenario,{time:0,x:approach?-55:-62,z:lane,speed:0,distance:0,body:0,bodyVelocity:0,accel:0,lap:0});trace=[];traceWindow=[];lastTrace=0;lastUI=0;traffic.forEach((car,i)=>{car.p=car.axis==='cross'?-65+(i-4)*37:[-110,-18,45,110][i];car.speed=0;});model.vehicle.position.set(scenario.x,.025,lane);model.vehicle.rotation.set(0,0,0);if(approach&&$('distress').value==='smooth'){$('distress').value='pothole';buildDistress();}updateCamera(1,true);moveTraffic(0,signalPhase(0));paintSignals(signalPhase(0));animateWeather();updateUI();drawChart();$('trace-status').textContent='Generated with a simplified damped spring response. This is not IRI, a condition rating, or sensor output.';dirty=true;}
function setRunning(value){scenario.running=value;keys.clear();$('play').textContent=value?'Pause driving':scenario.distance?'Resume driving':'Start driving';$('run-status').textContent=value?'Driving · generated scenario':scenario.distance?'Paused':'Ready to drive';dirty=true;}
function updatePhysics(dt){
 scenario.time+=dt;const phase=signalPhase(scenario.time),stop=stopDistance(scenario.x,1,'main',phase,model.spec.length*.5);let available=stop,desired=$('cruise').checked?+$('target-speed').value/3.6:scenario.speed;
 if(!$('cruise').checked){desired=Math.max(0,scenario.speed+(keys.has('w')||keys.has('arrowup')?2.6:keys.has('s')||keys.has('arrowdown')?-6:-.7)*dt);desired=Math.min(desired,16);}
 if(keys.has('s')||keys.has('arrowdown'))desired=Math.max(0,scenario.speed-6*dt);
 desired=Math.min(desired,Math.sqrt(Math.max(0,2*3.8*stop)));
 let following=false;for(const car of traffic){if(car.axis!=='main'||car.dir!==1)continue;const separation=car.p-scenario.x,gap=separation-model.spec.length*.5-4.2;if(separation>0){available=Math.min(available,Math.max(0,gap));if(gap<35){desired=Math.min(desired,Math.sqrt(Math.max(0,2*3*gap)));following=true;}}}
 if($('cruise').checked){const change=THREE.MathUtils.clamp(desired-scenario.speed,-3.8*dt,2.1*dt);scenario.speed+=change;}else scenario.speed=desired;
 if(stop<.1&&scenario.speed<.7)scenario.speed=0;scenario.speed=Math.max(0,scenario.speed);
 const traveled=Math.min(scenario.speed*dt,available);if(available<.05)scenario.speed=0;scenario.x+=traveled;scenario.distance+=traveled;
 if(scenario.x>220){scenario.x=-150;scenario.lap++;traffic.filter(c=>c.axis==='main'&&c.dir===1&&Math.abs(c.p-scenario.x)<20).forEach(c=>c.p=-100);}
 const steer=(keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0);
 if(steer)scenario.z=THREE.MathUtils.clamp(scenario.z+steer*dt*Math.min(scenario.speed*.25,1.2),lane-.9,lane+.9);else if($('cruise').checked)scenario.z=THREE.MathUtils.damp(scenario.z,lane,1.5,dt);
 const axle=model.spec.length*.30,halfTrack=model.spec.width*.40,front=(roadHeight(scenario.x+axle,scenario.z-halfTrack)+roadHeight(scenario.x+axle,scenario.z+halfTrack))*.5,rear=(roadHeight(scenario.x-axle,scenario.z-halfTrack)+roadHeight(scenario.x-axle,scenario.z+halfTrack))*.5,target=(front+rear)*.5;
 const omega=model.key==='aurora'?7.5:10.5;scenario.accel=omega**2*(target-scenario.body)-2*.72*omega*scenario.bodyVelocity;scenario.bodyVelocity+=scenario.accel*dt;scenario.body+=scenario.bodyVelocity*dt;
 model.vehicle.position.set(scenario.x,.028+scenario.body,scenario.z);model.vehicle.rotation.z=THREE.MathUtils.damp(model.vehicle.rotation.z,(front-rear)/(axle*2),6,dt);model.vehicle.rotation.y=THREE.MathUtils.damp(model.vehicle.rotation.y,-steer*.045,5,dt);
 for(const wheel of model.wheels){if(model.key==='cybercab')wheel.rotation.z-=traveled/model.spec.radius;else wheel.rotation.z-=traveled/model.spec.radius;}
 sketchGroup.position.set(scenario.x,.015,scenario.z);sketchGroup.rotation.y=Math.sin(scenario.time*.45)*.06;
 moveTraffic(dt,phase);paintSignals(phase);
 for(const p of pedestrians){p.group.position.x=p.start+Math.sin(scenario.time*.055+p.phase)*12;p.group.rotation.y=p.speed>0?Math.PI/2:-Math.PI/2;p.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(scenario.time*4+p.phase+i*Math.PI)*.25);}
 if(scenario.time-lastTrace>.05){lastTrace=scenario.time;const row={t:scenario.time,x:scenario.x,speed:scenario.speed,body:scenario.body,accel:scenario.accel,surface:$('distress').value,severity:+$('severity').value,vehicle:model.key,lighting:$('time-of-day').value,weather:$('weather').value};trace.push(row);if(trace.length>18000)trace.shift();traceWindow.push(row);while(traceWindow.length&&traceWindow[0].t<scenario.time-12)traceWindow.shift();}
 scenario.trafficMessage=stop<35&&phase.main!=='green'?(scenario.speed<.3?'Waiting at the signal':'Approaching a red / amber signal'):following?'Following traffic':Math.abs(scenario.x+31)<16?'Crossing the surface study zone':'Cruising the urban route';
}
const desiredCamera=new THREE.Vector3(),lookAt=new THREE.Vector3();
function updateCamera(dt,snap=false){
 const x=scenario.x,z=scenario.z,h=model.spec.height;
 if(scenario.camera==='cabin'){desiredCamera.set(x+model.spec.length*.16,h*.69+scenario.body,z+.32);lookAt.set(x+28,h*.62,z);}
 else if(scenario.camera==='aerial'){desiredCamera.set(x-13,48,z+20);lookAt.set(x+9,0,0);}
 else if(scenario.camera==='roadside'){desiredCamera.set(x+8,2.7+Math.min(h,2)*.3,-13);lookAt.set(x+2,h*.4,z);}
 else{desiredCamera.set(x-model.spec.length*.8-8,5+h*.35,z+6.7);lookAt.set(x+8,h*.36,z);}
 if(snap)camera.position.copy(desiredCamera);else camera.position.lerp(desiredCamera,1-Math.exp(-dt*5));camera.lookAt(lookAt);if(sun){sun.position.set(x-25,45,30);sun.target.position.set(x,0,0);sun.target.updateMatrixWorld();}
}
function updateUI(){
 $('hud-speed').textContent=Math.round(scenario.speed*3.6);$('hud-state').textContent=scenario.running?scenario.trafficMessage||'Driving the urban route':'Paused · controls remain available';
 $('body-response').textContent=(scenario.body*1000).toFixed(1);$('vertical-response').textContent=scenario.accel.toFixed(2);$('distance-response').textContent=Math.round(scenario.distance);
 const phase=signalPhase(scenario.time);$('signal-label').textContent=`Main road: ${phase.main}`;$('signal-countdown').textContent=`${Math.ceil(phase.remaining)} s`;$('signal-dot').style.background={green:'#248056',amber:'#986710',red:'#b33c35'}[phase.main];
 $('export-run').disabled=trace.length<2;
}
function drawChart(){
 const canvas=$('response-chart'),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const ctx=chartContext;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const left=44,right=w-8,top=12,bottom=h-27,range=Math.max(20,...traceWindow.map(p=>Math.abs(p.body*1000)*1.3));const y=v=>(top+bottom)/2-v/range*(bottom-top)/2;
 ctx.font='11px -apple-system, Segoe UI, sans-serif';ctx.fillStyle='#65717c';ctx.strokeStyle='#e4e8eb';ctx.lineWidth=1;for(const value of [-range,0,range]){const at=y(value);ctx.beginPath();ctx.moveTo(left,at);ctx.lineTo(right,at);ctx.stroke();ctx.fillText(`${Math.round(value)}`,3,at+4);}ctx.fillText('mm',3,top-2);ctx.fillText('−12 s',left,bottom+21);ctx.fillText('now',Math.max(left,right-24),bottom+21);ctx.strokeStyle='#167bac';ctx.lineWidth=2;ctx.beginPath();traceWindow.forEach((p,i)=>{const x=left+(p.t-(scenario.time-12))/12*(right-left);i?ctx.lineTo(x,y(p.body*1000)):ctx.moveTo(x,y(p.body*1000));});ctx.stroke();if(!traceWindow.length){ctx.fillStyle='#65717c';ctx.fillText('Start driving to record a generated response.',left+10,(top+bottom)/2-12);}
}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));$('drive-viewport').prepend(renderer.domElement);sun=setSceneLighting(scene,renderer,{urban:true});const environment=new RoomEnvironment(),pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(environment,.05).texture;environment.dispose();pm.dispose();buildStreet();buildTraffic();buildWeather();$('drive-loading').hidden=true;
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();setRunning(false);$('drive-loading').hidden=false;$('drive-loading').textContent='The 3D view was interrupted. Reload this page to restore the scene. Your dataset links remain available.';});
}catch(error){$('drive-loading').textContent='This scene needs WebGL 2 and browser hardware acceleration. You can still select vehicles and browse their datasets below.';$('play').disabled=true;$('approach').disabled=true;$('sensing').disabled=true;document.querySelectorAll('[data-camera],[data-key]').forEach(b=>b.disabled=true);}
$('vehicle').innerHTML=Object.entries(FLEET).map(([key,spec])=>`<option value="${key}">${spec.name}</option>`).join('');
$('vehicle').onchange=()=>{loadVehicle($('vehicle').value);updateCamera(1,true);};
$('target-speed').oninput=()=>{$('speed-label').textContent=`${$('target-speed').value} km/h`;};
$('distress').onchange=buildDistress;$('severity').oninput=buildDistress;
$('weather').onchange=updateWeather;$('time-of-day').onchange=updateWeather;
$('play').onclick=()=>setRunning(!scenario.running);$('reset').onclick=()=>{setRunning(false);reset();};$('approach').onclick=()=>{reset(true);$('cruise').checked=true;setRunning(true);};
$('sensing').onchange=()=>{sketchGroup.visible=$('sensing').checked;dirty=true;};
document.querySelectorAll('[data-camera]').forEach(button=>button.onclick=()=>{scenario.camera=button.dataset.camera;document.querySelectorAll('[data-camera]').forEach(b=>b.setAttribute('aria-pressed',b===button));model.setGhost(scenario.camera==='cabin');updateCamera(1,true);dirty=true;});
function keyDown(event){const k=event.key.toLowerCase();if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','r'].includes(k))return;event.preventDefault();if(k===' '){if(!event.repeat)setRunning(!scenario.running);return;}if(k==='r'){reset();return;}if(k==='w'||k==='arrowup'){$('cruise').checked=false;if(!scenario.running)setRunning(true);}keys.add(k);}
$('drive-viewport').addEventListener('keydown',keyDown);window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-key]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(button.dataset.key==='w'){$('cruise').checked=false;if(!scenario.running)setRunning(true);}keys.add(button.dataset.key);button.setAttribute('aria-pressed','true');});const release=()=>{keys.delete(button.dataset.key);button.setAttribute('aria-pressed','false');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(button.dataset.key==='w'){$('cruise').checked=false;if(!scenario.running)setRunning(true);}keys.add(button.dataset.key);}});button.addEventListener('keyup',release);});
$('export-run').onclick=()=>{const header='Generated illustrative simulation; not measured pavement or sensor data\nvehicle,surface,lighting,weather,example_displacement_mm,time_s,route_x_m,speed_m_s,body_displacement_m,vertical_acceleration_m_s2\n';const csv=header+trace.map(p=>[p.vehicle,p.surface,p.lighting,p.weather,p.surface==='smooth'?0:p.severity,p.t.toFixed(3),p.x.toFixed(3),p.speed.toFixed(3),p.body.toFixed(6),p.accel.toFixed(6)].join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`pavedata-generated-${model.key}-trace.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('trace-status').textContent=`Exported ${trace.length} generated samples. The CSV is illustrative and must not be treated as field measurements.`;};
window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='atlas-vehicle'||e.origin!==location.origin&&e.origin!=='null')return;if(e.data.vehicle!==model?.key)loadVehicle(e.data.vehicle,false);});
document.addEventListener('visibilitychange',()=>{keys.clear();clock.getDelta();});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;clock.getDelta();}).observe($('drive-viewport'));
const resize=()=>{const w=$('drive-viewport').clientWidth,h=$('drive-viewport').clientHeight;if(renderer){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}drawChart();dirty=true;};new ResizeObserver(resize).observe($('drive-viewport'));
if(embedded)new ResizeObserver(()=>parent.postMessage({type:'atlas-driving-height',height:Math.ceil(document.documentElement.getBoundingClientRect().height)},location.origin==='null'?'*':location.origin)).observe(document.body);
loadVehicle(FLEET[params.get('vehicle')]?params.get('vehicle'):'waymo',false);buildDistress();reset();resize();paintSignals(signalPhase(0));
if(reduced)$('run-status').textContent='Ready · motion starts only when requested';
function frame(){requestAnimationFrame(frame);const delta=Math.min(clock.getDelta(),.05);if(!renderer||!visible||document.hidden)return;if(scenario.running){let remaining=delta;while(remaining>0){const step=Math.min(remaining,1/120);updatePhysics(step);remaining-=step;}updateCamera(delta);animateWeather();dirty=true;}if(scenario.time-lastUI>.1||dirty&&!scenario.running){lastUI=scenario.time;updateUI();drawChart();}if(dirty){renderer.render(scene,camera);dirty=false;}}
requestAnimationFrame(frame);
