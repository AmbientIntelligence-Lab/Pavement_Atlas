import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SENSORS, TYPES } from './sensors.js';
export { TYPES };

// Original procedural reconstruction. Metres are convenient modeling units,
// not a claim of measured CAD dimensions. +X is forward, +Z is driver side.
export function createVehicle(){
 const vehicle=new THREE.Group();vehicle.name='Aurora_Peterbilt_579_reference_reconstruction';
 vehicle.userData={units:'metres',front:'+X',up:'+Y',driverSide:'+Z',notice:'Original educational reconstruction. All dimensions and sensor transforms approximate. Not factory CAD or a complete production sensor inventory.',reference:'https://aurora.tech/'};
 const body=new THREE.Group(),sensorRoot=new THREE.Group(),trailer=new THREE.Group();body.name='Peterbilt_tractor';sensorRoot.name='Illustrative_Aurora_sensor_layout';trailer.name='Optional_freight_trailer';vehicle.add(body,sensorRoot,trailer);
 const sensors=[],bodyMaterials=new Set();
 const mat=(color,r=.4,m=.2)=>new THREE.MeshStandardMaterial({color,roughness:r,metalness:m});
 const paint=new THREE.MeshPhysicalMaterial({color:'#102b51',roughness:.27,metalness:.5,clearcoat:1,clearcoatRoughness:.22});
 const trim=mat('#192632',.38,.35),black=mat('#101820',.52,.2),rubber=mat('#20272e',.91,.0),chrome=mat('#b8c6d2',.22,.9),steel=mat('#4a5968',.5,.7),glass=new THREE.MeshPhysicalMaterial({color:'#233a4b',metalness:.65,roughness:.17,clearcoat:1}),lens=mat('#0c263e',.1,.65),silver=mat('#d4dce2',.43,.65),white=mat('#e8edf0',.7,.1);
 const led=new THREE.MeshStandardMaterial({color:'#e2f6ff',emissive:'#ccecff',emissiveIntensity:1.4}),amber=new THREE.MeshStandardMaterial({color:'#f6b64e',emissive:'#ff9500',emissiveIntensity:.6}),red=new THREE.MeshStandardMaterial({color:'#941527',emissive:'#be1227',emissiveIntensity:.4});
 function add(g,m,parent=body,p=[0,0,0],name=''){const mesh=new THREE.Mesh(g,m);mesh.position.fromArray(p);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const box=(size,p,m=paint,parent=body,r=.04,name='')=>add(new RoundedBoxGeometry(...size,3,Math.min(r,...size.map(n=>n*.46))),m,parent,p,name);
 const cyl=(rt,rb,h,p,m=black,parent=body,n=48)=>add(new THREE.CylinderGeometry(rt,rb,h,n),m,parent,p);
 function tube(points,m=trim,r=.01,parent=body){return add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(12,points.length*8),r,6,false),m,parent);}
 function poly(points,m,parent=body){const vertices=points.flat(),indices=[];for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const material=m.clone();material.side=THREE.DoubleSide;return add(g,material,parent);}
 function loft(rings,m,parent=body,name=''){const points=rings.flat(2),idx=[],n=rings[0].length;for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=(i+1)*n+j,an=i*n+(j+1)%n,bn=(i+1)*n+(j+1)%n;idx.push(a,an,b,an,bn,b);}for(let j=1;j<n-1;j++){idx.push(0,j+1,j);let o=(rings.length-1)*n;idx.push(o,o+j,o+j+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(idx);g.computeVertexNormals();return add(g,m,parent,[0,0,0],name);}
 function textPanel(text,p,width,height,parent=body,side=1,color='#eff6ff',size=64){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font=`600 ${size}px Segoe UI, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.6,depthWrite:false});const mesh=add(new THREE.PlaneGeometry(width,height),material,parent,p,text);mesh.rotation.y=side>0?0:Math.PI;return mesh;
 }
 // Ladder frame, rear axles, tanks and fifth wheel.
 for(const s of [-1,1])box([7.45,.24,.15],[-.47,.85,s*.47],black,body,.02,'Chassis_rail');
 for(const x of [-3.95,-3.25,-2.25,-1,.3,1.8])box([.12,.15,1.1],[x,.9,0],steel);
 box([2.4,.07,1.1],[-2.45,1.09,0],steel,body,.02,'Catwalk');
 for(let i=0;i<20;i++)box([.022,.012,1.04],[-3.55+i*.12,1.136,0],chrome,body,.003);
 const fifth=cyl(.64,.64,.08,[-2.95,1.24,0],black);fifth.scale.z=.83;box([.75,.09,.12],[-3.22,1.29,0],steel);
 for(const x of [-2.48,-3.75,2.35]){const axle=cyl(.09,.09,2.23,[x,.57,0],steel);axle.rotation.x=Math.PI/2;const diff=cyl(.21,.21,.35,[x,.57,0],black);diff.rotation.x=Math.PI/2;}
 for(const s of [-1,1]){
  const tank=cyl(.37,.37,1.0,[-.5,.75,s*.96],chrome);tank.rotation.z=Math.PI/2;
  for(const x of [-.89,-.15]){const strap=cyl(.381,.381,.07,[x,.75,s*.96],steel);strap.rotation.z=Math.PI/2;}
  box([1.83,.60,.21],[-.58,.82,s*1.19],paint,body,.09,'Lower_aerodynamic_skirt');
  for(let j=0;j<2;j++){box([.79,.11,.36],[.61,.60+j*.27,s*1.15],chrome,body,.025,'Entry_step');for(let n=0;n<7;n++)box([.05,.007,.28],[.31+n*.09,.66+j*.27,s*1.18],black,body,.002);}
  for(const x of [-2.48,-3.75]){box([.6,.16,.32],[x,.88,s*.65],steel);box([1.15,.06,.68],[x,1.20,s*.94],trim,body,.02,'Rear_wheel_guard');}
  box([.05,.64,.55],[-4.37,.48,s*.97],rubber,body,.01,'Mudflap');
 }
 box([.15,.22,2.16],[-4.32,.76,0],chrome);
 for(const s of [-1,1])for(let i=0;i<2;i++)box([.027,.09,.17],[-4.407,.8,s*(.76+i*.22)],red,body,.012);
 // Cabin shell with raked windshield and subtly rounded corners.
 const cabinProfile=[[-1.90,3.32,1.10],[-1.7,3.39,1.14],[-.7,3.36,1.16],[.35,3.28,1.16],[.87,3.18,1.10],[1.12,2.83,1.085],[1.42,2.16,1.13]];
 loft(cabinProfile.map(([x,y,w])=>[[x,y-.07,-w],[x,y,-w*.87],[x,y,w*.87],[x,y-.07,w],[x,1.13,w],[x,1.04,w*.85],[x,1.04,-w*.85],[x,1.13,-w]]),paint,body,'Sleeper_and_cab_shell');
 // Tall aerodynamic sleeper fairing, the distinguishing Aurora silhouette.
 const fairing=[[-1.94,3.92,1.04],[-1.75,4.06,1.13],[-1.10,4.08,1.13],[-.25,4.04,1.09],[.36,3.92,1.04],[.82,3.61,.99],[.93,3.27,.94]];
 loft(fairing.map(([x,y,w])=>[[x,3.21,-1.07],[x,y-.15,-w],[x,y,-w*.70],[x,y+.018,0],[x,y,w*.70],[x,y-.15,w],[x,3.21,1.07]]),paint,body,'High_roof_fairing');
 for(const s of [-1,1])tube([[-1.8,4.025,s*.68],[-.7,4.07,s*.63],[.2,3.94,s*.56],[.73,3.63,s*.51]],paint,.011);
 // Black windscreen, rubber perimeter, central divider and wipers.
 const windshield=[[1.439,2.20,-1.035],[.916,3.12,-1.025],[.916,3.12,1.025],[1.439,2.20,1.035]];
 poly(windshield,glass);tube([...windshield,windshield[0]],black,.027);tube([[1.45,2.21,0],[.925,3.12,0]],black,.017);
 for(const s of [-1,1]){tube([[1.46,2.23,s*.88],[1.36,2.36,s*.30],[1.30,2.49,s*.16]],black,.014);tube([[1.30,2.48,s*.16],[1.34,2.43,s*.73]],trim,.022);}
 box([.31,.09,2.45],[.96,3.20,0],paint,body,.04,'Sun_visor');
 for(const z of [-.8,-.4,0,.4,.8])box([.05,.05,.095],[1.10,3.205,z],amber,body,.012);
 // Side glazing and precisely drawn door seams.
 for(const s of [-1,1]){
  const p=(x,y,z)=>[x,y,z*s];
  const window=[p(1.28,2.24,1.145),p(.82,3.105,1.121),p(-.18,3.14,1.171),p(-.20,2.24,1.178)];poly(window,glass);tube([...window,window[0]],black,.027);
  tube([p(.94,3.20,1.175),p(1.35,2.1,1.178),p(1.19,1.15,1.178),p(-.32,1.13,1.178),p(-.34,3.23,1.173),p(.94,3.20,1.175)],trim,.008);
  tube([p(-1.3,1.18,1.162),p(-1.3,3.28,1.162)],trim,.007);
  box([.24,.065,.04],[-.11,2.07,s*1.20],chrome,body,.019,'Door_handle');
  box([.60,.32,.018],[-1.27,2.7,s*1.164],glass,body,.06,'Sleeper_window');
  textPanel('A U R O R A',[-.55,1.80,s*1.186],1.46,.35,body,s,'#e6eef7',78);
  textPanel('AURORA DRIVER',[-1.18,1.41,s*1.181],.86,.19,body,s,'#b5c9df',49);
  tube([p(.90,2.04,1.15),p(.98,2.14,1.61),p(.58,2.43,1.67)],black,.045);
  tube([p(.72,2.70,1.15),p(.53,2.72,1.64)],black,.039);
  box([.28,.70,.21],[.53,2.58,s*1.70],paint,body,.08,'Main_mirror');box([.04,.58,.15],[.38,2.58,s*1.70],chrome,body,.02);
  box([.21,.18,.19],[.57,2.15,s*1.70],black,body,.045,'Convex_mirror');
  tube([p(2.6,1.89,.91),p(2.50,2.18,1.30)],black,.026);box([.23,.22,.13],[2.49,2.21,s*1.32],black,body,.065,'Hood_mirror');
 }
 // Sloping hood, with rolled shoulders and integral curved wheel arches.
 const hoodProfile=[[1.23,2.12,.89],[1.58,2.06,.89],[2.20,1.98,.82],[2.85,1.85,.72],[3.34,1.74,.65],[3.47,1.67,.63]];
 loft(hoodProfile.map(([x,h,w])=>[[x,.80,-w],[x,h-.13,-w],[x,h,-w*.75],[x,h+.03,0],[x,h,w*.75],[x,h-.13,w],[x,.80,w]]),paint,body,'Sloping_hood');
 tube([[1.30,2.145,0],[2.2,2.015,0],[3.43,1.72,0]],paint,.018);
 for(const s of [-1,1]){
  const rings=[];for(let i=0;i<=80;i++){const x=1.18+i*2.33/80,dx=x-2.35;const lower=Math.abs(dx)<.675?.59+Math.sqrt(.675*.675-dx*dx):.55;const upper=Math.max(lower+.095,1.29+.22*Math.sin((x-1.18)*Math.PI/2.33));rings.push([[x,lower,s*.83],[x,upper-.035,s*.85],[x,upper,s*1.16],[x,upper-.09,s*1.255],[x,lower,s*1.26]]);}loft(rings,paint,body,'Sculpted_front_fender');
  const arch=[];for(let i=0;i<=40;i++){const a=Math.PI*i/40;arch.push([2.35+Math.cos(a)*.684,.585+Math.sin(a)*.684,s*1.267]);}tube(arch,trim,.017);
  box([.11,.25,.50],[3.345,1.28,s*.96],black,body,.065,'Headlight_housing');box([.027,.13,.39],[3.407,1.305,s*.96],led,body,.045);box([.027,.036,.40],[3.414,1.211,s*.96],amber,body,.006);
  box([.19,.32,.48],[3.33,.71,s*.98],chrome,body,.075);box([.025,.09,.25],[3.434,.69,s*1.005],led,body,.012);
 }
 // Tall Peterbilt-style grille with chrome surround, inset mesh and bars.
 box([.15,1.08,1.35],[3.43,1.22,0],chrome,body,.095,'Chrome_grille_surround');box([.018,.95,1.19],[3.514,1.22,0],black,body,.072,'Grille_inset');
 for(let i=0;i<26;i++)box([.025,.85,.018],[3.531,1.22,-.55+i*.044],steel,body,.003,'Grille_fine_bar');
 for(const z of [-.53,0,.53])box([.031,.92,.049],[3.55,1.22,z],chrome,body,.009,'Grille_vertical_rib');
 for(let i=0;i<15;i++)box([.016,.012,1.10],[3.528,.82+i*.057,0],steel,body,.002);
 const badge=cyl(.055,.055,.018,[3.558,1.73,0],chrome);badge.rotation.z=Math.PI/2;badge.scale.z=1.4;
 box([.26,.20,2.28],[3.40,.48,0],chrome,body,.055,'Front_bumper');box([.028,.12,.42],[3.548,.48,0],white,body,.005,'License_plate');
 // Wheel details: rounded sidewall, tread grooves, polished hubs, holes and lugs.
 function wheel(x,z,front=false,parent=body){
  const s=Math.sign(z),group=new THREE.Group();group.position.set(x,.565,z);parent.add(group);group.name='Wheel';
  const tire=add(new THREE.TorusGeometry(.426,.14,12,64),rubber,group);tire.scale.z=1.12;
  const tread=cyl(.557,.557,.25,[0,0,0],rubber,group,64);tread.rotation.x=Math.PI/2;
  for(const offset of [-.085,0,.085]){const groove=add(new THREE.TorusGeometry(.558,.006,5,64),black,group,[0,0,offset]);}
  for(let i=0;i<40;i++){const a=i*Math.PI/20;const block=box([.015,.012,.24],[Math.sin(a)*.558,Math.cos(a)*.558,0],trim,group,.002);block.rotation.z=-a;}
  const rim=cyl(.322,.322,.30,[0,0,0],chrome,group,64);rim.rotation.x=Math.PI/2;
  const face=cyl(.265,.29,.025,[0,0,s*.164],steel,group);face.rotation.x=Math.PI/2;
  const edge=add(new THREE.TorusGeometry(.302,.02,8,64),chrome,group,[0,0,s*.173]);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;const hole=cyl(.041,.041,.012,[Math.sin(a)*.227,Math.cos(a)*.227,s*.181],black,group,16);hole.rotation.x=Math.PI/2;const lug=cyl(.019,.019,.042,[Math.sin(a)*.143,Math.cos(a)*.143,s*.202],chrome,group,6);lug.rotation.x=Math.PI/2;}
  const hub=cyl(front?.106:.14,front?.126:.14,front?.14:.22,[0,0,s*.18],chrome,group);hub.rotation.x=Math.PI/2;
 }
 for(const s of [-1,1]){wheel(2.35,s*1.05,true);for(const x of [-2.48,-3.75]){wheel(x,s*1.03);wheel(x,s*.69);}}
 // Air lines and vertical rear details are exposed with the trailer hidden.
 for(let j=0;j<3;j++){const points=[];for(let i=0;i<100;i++){const a=i*.55;points.push([-2.015-.07*Math.sin(a),2.4-i*.010,.22*(j-1)+Math.cos(a)*.065]);}tube(points,[black,mat('#9b282a'),mat('#2f5375')][j],.015);}
 box([.12,1.12,.42],[-1.98,2.57,.75],trim,body,.035,'Rear_service_enclosure');
 // Sensor pod bodywork remains in place when instruments are separated.
 box([.39,.39,.97],[.84,3.83,0],paint,body,.12,'Center_sensor_pod');box([.03,.29,.84],[1.045,3.83,0],black,body,.07);
 for(const s of [-1,1]){
  box([.47,.12,.75],[.47,3.235,s*1.19],steel,body,.04,'Side_pod_mount');
  box([1.34,.31,.52],[.50,3.30,s*1.49],paint,body,.095,'Side_sensor_pod');box([.07,.20,.40],[1.14,3.30,s*1.49],black,body,.045);
  box([1.14,.026,.45],[.49,3.13,s*1.49],steel,body,.007);
 }
 // Every represented sensing element is named, selectable, and exports metadata.
 for(const data of SENSORS){
  const group=new THREE.Group();group.position.fromArray(data.position);group.name=`${data.id}_${data.name.replaceAll(' ','_')}`;group.userData={...data,notice:data.note};sensorRoot.add(group);
  const local=new THREE.Group();group.add(local);const direction=new THREE.Vector3(...data.dir).normalize();local.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),direction);
  const accent=mat(TYPES[data.type].color,.34,.45);
  if(data.type==='camera'){
   box([.10,.15,.17],[0,0,0],trim,local,.035);const ring=cyl(.062,.062,.037,[.055,0,0],chrome,local,32);ring.rotation.z=Math.PI/2;const optic=cyl(.049,.049,.041,[.075,0,0],lens,local,32);optic.rotation.z=Math.PI/2;const inner=cyl(.024,.024,.043,[.078,0,0],accent,local,32);inner.rotation.z=Math.PI/2;const pupil=cyl(.013,.013,.046,[.082,0,0],black,local,24);pupil.rotation.z=Math.PI/2;
  }else if(data.id==='L01'){
   box([.13,.23,.39],[.02,0,0],trim,local,.035);box([.025,.17,.33],[.092,0,0],lens,local,.018);
   for(let i=0;i<6;i++)box([.005,.136,.018],[.108,0,-.122+i*.049],steel,local,.003);
  }else if(data.type==='lidar'){
   local.quaternion.identity();cyl(.128,.145,.09,[0,-.05,0],chrome,local);cyl(.112,.12,.16,[0,.065,0],lens,local);cyl(.12,.12,.033,[0,.161,0],black,local);cyl(.124,.124,.017,[0,.127,0],accent,local);
  }else if(data.type==='radar'){
   box([.055,.15,.25],[0,0,0],trim,local,.025);box([.014,.125,.217],[.035,0,0],steel,local,.019);box([.012,.023,.05],[.044,-.027,.053],accent,local,.005);
  }else if(data.id==='S03'){
   box([.33,.58,1.11],[0,0,0],steel,local,.035);for(let i=0;i<11;i++)box([.024,.44,.022],[.18,0,-.45+i*.09],black,local,.004);for(const y of [-.13,0,.13])box([.02,.03,.12],[.195,y,.48],accent,local,.003);
  }else{
   box([.12,.07,.10],[0,0,0],steel,local,.02);const nozzle=cyl(.018,.028,.09,[.07,0,0],black,local,16);nozzle.rotation.z=Math.PI/2;
  }
  group.traverse(o=>{if(o.isMesh)o.userData.sensorId=data.id;});
  sensors.push({...data,base:new THREE.Vector3(...data.position),dir:direction,group});
 }
 // Optional 53-foot style freight trailer. It carries no invented autonomy sensors.
 box([16.16,2.62,2.56],[-10.50,2.91,0],white,trailer,.065,'Freight_box');
 box([16.24,.11,2.61],[-10.50,4.26,0],silver,trailer,.015,'Roof_edge');box([16.24,.14,2.62],[-10.50,1.56,0],chrome,trailer,.012,'Lower_rail');
 for(const s of [-1,1]){
  for(let i=0;i<64;i++){const x=-2.5-i*.249;box([.016,2.53,.018],[x,2.91,s*1.285],silver,trailer,.003);}
  for(let i=0;i<33;i++){box([.26,.055,.008],[-2.6-i*.49,1.58,s*1.319],i%2===0?red:white,trailer,.001);}
  textPanel('A U R O R A',[-9,3.15,s*1.302],6.3,1.22,trailer,s,'#173e70',94);
  textPanel('SELF-DRIVING FREIGHT',[-9,2.58,s*1.303],5.8,.45,trailer,s,'#3d526b',58);
  box([9.5,.64,.06],[-9.70,1.13,s*1.22],white,trailer,.04,'Trailer_skirt');
  for(const x of [-15.9,-17.15]){wheel(x,s*1.05,false,trailer);wheel(x,s*.70,false,trailer);}
  box([.16,.86,.16],[-5.5,.96,s*.89],steel,trailer,.012,'Landing_leg');box([.44,.08,.40],[-5.5,.51,s*.89],steel,trailer,.01);
 }
 box([.06,2.48,2.40],[-18.62,2.91,0],silver,trailer,.02,'Rear_doors');
 for(const z of [-.95,-.15,.15,.95])box([.05,2.32,.028],[-18.66,2.91,z],chrome,trailer,.005,'Door_lock_bar');box([.30,.15,2.4],[-18.72,.70,0],chrome,trailer,.02,'Underride_guard');
 for(const s of [-1,1])box([.025,.09,.29],[-18.67,1.54,s*.95],red,trailer,.01);
 trailer.visible=false;
 body.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])bodyMaterials.add(m);}});
 for(const material of bodyMaterials)material.userData={...material.userData,originalOpacity:material.opacity,originalTransparent:material.transparent,originalDepthWrite:material.depthWrite};
 return{vehicle,body,sensorRoot,sensors,bodyMaterials,trailer};
}
