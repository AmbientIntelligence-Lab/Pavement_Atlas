import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Model coordinate convention: +X front, +Y up, +Z vehicle left. Units: metres.
// This is authored geometry. Sensor transforms are illustrative, not calibration data.
export const TYPES = {
  lidar: { label: 'Lidar', color: '#287fa9', description: 'Laser pulses measure distance to surrounding surfaces. Their returns form a 3D picture of nearby objects and road geometry.', output: '3D geometry & distance' },
  camera: { label: 'Camera', color: '#b76425', description: 'Images supply visual context such as traffic-light colors, signs and road-user appearance. Camera views complement depth and motion sensing.', output: 'Visual scene information' },
  radar: { label: 'Imaging radar', color: '#328354', description: 'Radio returns measure distance and relative motion. Radar complements the optical sensors, including when visibility is reduced.', output: 'Distance & radial velocity' },
  audio: { label: 'External audio', color: '#8461ac', description: 'External audio receivers add sound to the perception system, helping it recognize cues such as emergency-vehicle sirens.', output: 'Environmental audio' },
  support: { label: 'Supporting system', color: '#687785', description: '', output: '' }
};
export function createVehicle() {
 const vehicle = new THREE.Group(); vehicle.name = 'Waymo_Jaguar_IPACE_educational_reconstruction';
 vehicle.userData = { units: 'metres', front: '+X', up: '+Y', left: '+Z', notice: 'Approximate educational reconstruction; sensor IDs and transforms are illustrative.' };
 const body = new THREE.Group(); body.name = 'Jaguar_IPACE_body'; vehicle.add(body);
 const sensorRoot = new THREE.Group(); sensorRoot.name = 'Waymo_sensor_systems'; vehicle.add(sensorRoot);
 const sensors = [], bodyMaterials = new Set();
 const mat = (color, roughness=.35, metalness=.1) => new THREE.MeshStandardMaterial({color,roughness,metalness});
 const white = new THREE.MeshPhysicalMaterial({color:'#f7f9fa',roughness:.24,metalness:.22,clearcoat:1,clearcoatRoughness:.14});
 const black = mat('#131c23',.32,.22), rubber = mat('#181d20',.84,.02), rim = mat('#7d8b94',.26,.85), darkRim=mat('#242e35',.3,.65), glass=new THREE.MeshPhysicalMaterial({color:'#182e3a',roughness:.16,metalness:.4,clearcoat:1}), seam=mat('#6d7b81',.7,.1);
 const lens=mat('#102d40',.09,.55), led=new THREE.MeshStandardMaterial({color:'#e7f7ff',emissive:'#acdeff',emissiveIntensity:1.0}), red=new THREE.MeshStandardMaterial({color:'#9d1523',emissive:'#e81c35',emissiveIntensity:.5});
 const add=(geometry,material,parent=body,pos=[0,0,0],name='')=>{const o=new THREE.Mesh(geometry,material);o.position.fromArray(pos);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(size,pos,material=white,parent=body,r=.04,name='')=>add(new RoundedBoxGeometry(...size,3,Math.min(r,...size.map(v=>v*.45))),material,parent,pos,name);
 const cylinder=(rt,rb,h,pos,material=black,parent=body,n=48)=>add(new THREE.CylinderGeometry(rt,rb,h,n),material,parent,pos);
 function path(points,material=seam,r=.006,parent=body,closed=false){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');return add(new THREE.TubeGeometry(c,Math.max(16,points.length*10),r,6,false),material,parent);}
 function polygon(points,material,parent=body){const g=new THREE.BufferGeometry();const p=[],idx=[];points.forEach(v=>p.push(...v));for(let i=1;i<points.length-1;i++)idx.push(0,i,i+1);g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();const m=material.clone();m.side=THREE.DoubleSide;return add(g,m,parent);}
 function loft(rings,material,parent=body,name=''){const pos=[],index=[],n=rings[0].length;for(const ring of rings)for(const v of ring)pos.push(...v);for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=(i+1)*n+j,an=i*n+(j+1)%n,bn=(i+1)*n+(j+1)%n;index.push(a,an,b,an,bn,b);}for(let j=1;j<n-1;j++){index.push(0,j+1,j);const o=(rings.length-1)*n;index.push(o,o+j,o+j+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();return add(g,material,parent,[0,0,0],name);}
 const profile=[[-2.341,.78,1.00],[-2.2,.89,1.09],[-1.8,.95,1.1],[-1.1,.94,1.075],[0,.91,1.025],[.8,.945,1.04],[1.48,.95,1.075],[1.95,.92,1.025],[2.23,.86,.96],[2.341,.74,.87]];
 function sample(x){for(let i=1;i<profile.length;i++)if(x<=profile[i][0]){let t=(x-profile[i-1][0])/(profile[i][0]-profile[i-1][0]);t=THREE.MathUtils.smoothstep(t,0,1);return[THREE.MathUtils.lerp(profile[i-1][1],profile[i][1],t),THREE.MathUtils.lerp(profile[i-1][2],profile[i][2],t)];}return profile.at(-1).slice(1);}
 const bodyRings=[];
 for(let i=0;i<=180;i++){const x=-2.341+i*4.682/180,[w,h]=sample(x);let b=.32;for(const wx of [-1.495,1.495]){const dx=x-wx;if(Math.abs(dx)<.444)b=Math.max(b,.405+Math.sqrt(.444**2-dx**2));}const half=[[h+.025,0],[h+.022,w*.57],[h-.015,w*.86],[h-.075,w*.985],[Math.max(b+.035,h-.2),w],[b,w*.975],[b-.014,w*.895],[.29,w*.70],[.275,0]];const ring=half.concat(half.slice(1,-1).reverse().map(([y,z])=>[y,-z])).map(([y,z])=>[x,y,z]);bodyRings.push(ring);}
 loft(bodyRings,white,body,'Sculpted_body_shell_with_wheel_arches');
 box([3.36,.14,1.69],[0,.31,0],black,body,.05,'Lower_sill');
 // Cab-forward roofline and steeply raked windscreen.
 const cabinProfile=[[-1.91,1.04,.79],[-1.52,1.28,.77],[-.96,1.52,.74],[-.56,1.567,.71],[.38,1.55,.71],[.70,1.43,.735],[1.10,1.055,.84]];
 const cabinRings=cabinProfile.map(([x,y,w])=>[[x,y,0],[x,y-.005,w*.8],[x,y-.046,w],[x,1.035,.88],[x,1.025,0],[x,1.035,-.88],[x,y-.046,-w],[x,y-.005,-w*.8]]);
 loft(cabinRings,white,body,'Cab_forward_roof');
 // Side windows, pillars, door seams, handles, mirrors and sculpted sill lines.
 for(const s of [-1,1]){
  const pt=(x,y,z)=>[x,y,z*s];
  polygon([pt(1.014,1.097,.852),pt(.575,1.488,.740),pt(-.035,1.504,.748),pt(-.055,1.078,.886)],glass);
  polygon([pt(-.115,1.078,.886),pt(-.098,1.506,.751),pt(-.71,1.507,.768),pt(-1.32,1.252,.836),pt(-1.37,1.112,.868)],glass);
  polygon([pt(-1.43,1.12,.861),pt(-1.38,1.23,.84),pt(-1.02,1.427,.794),pt(-1.70,1.125,.853)],glass);
  path([pt(1.04,1.09,.856),pt(.60,1.50,.753),pt(-.67,1.528,.765),pt(-1.74,1.12,.856)],black,.014);
  path([pt(1.027,1.073,.877),pt(.40,1.062,.911),pt(-.62,1.081,.927),pt(-1.74,1.113,.882)],rim,.008);
  path([pt(.95,1.045,.928),pt(.89,.87,.938),pt(.78,.42,.933),pt(-.01,.405,.92),pt(-.065,.88,.926),pt(-.055,1.067,.916)],seam,.003);
  path([pt(-.08,1.074,.922),pt(-.03,.40,.93),pt(-.90,.405,.94),pt(-1.03,.71,.954),pt(-1.36,1.081,.936)],seam,.003);
  path([pt(1.01,.39,.95),pt(.08,.38,.947),pt(-.87,.41,.95)],black,.016);
  for(const x of [.13,-1.02])box([.165,.027,.024],[x,.943,.948*s],rim,body,.01,'Flush_door_handle');
  box([.09,.06,.22],[.79,1.06,.94*s],black);
  const mirror=box([.26,.125,.18],[.77,1.115,1.048*s],white,body,.045,'Door_mirror');mirror.rotation.y=s*.13;
  box([.17,.074,.012],[.71,1.115,1.142*s],glass,body,.015);
  box([.18,.012,.01],[.77,1.095,1.14*s],led,body,.004);
  for(const x of [-1.495,1.495]){
   const pts=[];for(let i=0;i<=40;i++){const a=-.13+Math.PI*1.08*i/40;pts.push([x+Math.cos(a)*.449,.405+Math.sin(a)*.449,s*.963]);}path(pts,black,.012);
  }
  // Front fender charge-port outline, shoulder and hood seams.
  path([pt(1.21,1.023,.936),pt(1.06,1.02,.943),pt(1.04,.89,.944),pt(1.22,.89,.956)],seam,.003,body,true);
  path([pt(2.13,.964,.63),pt(1.68,1.093,.62),pt(1.20,1.074,.66),pt(.95,1.066,.75)],seam,.004);
 }
 polygon([[1.107,1.104,-.811],[.626,1.514,-.694],[.626,1.514,.694],[1.107,1.104,.811]],glass);
 path([[1.064,1.082,-.71],[1.058,1.09,-.2],[1.01,1.12,.15]],black,.009);
 path([[1.045,1.089,.70],[1.018,1.11,.2],[.986,1.132,-.10]],black,.009);
 polygon([[-1.82,1.085,-.755],[-1.05,1.456,-.719],[-1.05,1.456,.719],[-1.82,1.085,.755]],glass);
 box([.24,.043,1.53],[-1.15,1.455,0],black,body,.02,'Rear_spoiler');
 // Front fascia: inset grille, diamond mesh, slim J-blade headlights.
 box([.047,.31,1.21],[2.353,.630,0],black,body,.10,'Front_grille');
 for(let j=-8;j<=8;j++)for(let k=0;k<4;k++){const z=j*.065,y=.53+k*.059;const d=box([.012,.024,.024],[2.382,y,z],darkRim,body,.001);d.rotation.x=Math.PI/4;}
 box([.07,.10,1.42],[2.329,.342,0],black,body,.035,'Front_splitter');
 for(const s of [-1,1]){
  const lamp=box([.15,.074,.43],[2.303,.827,s*.566],black,body,.028,'Slim_headlight');lamp.rotation.y=s*-.23;
  path([[2.388,.85,s*.365],[2.383,.858,s*.55],[2.322,.849,s*.75],[2.301,.829,s*.781]],led,.010);
  for(let k=0;k<3;k++)box([.018,.022,.061],[2.381,.825,s*(.40+k*.087)],led,body,.008);
  box([.055,.20,.12],[2.295,.59,s*.744],black,body,.036,'Front_air_inlet');
  path([[-2.273,.997,s*.31],[-2.27,1.007,s*.62],[-2.15,1.03,s*.866]],red,.025);
  path([[-2.289,.955,s*.39],[-2.274,.957,s*.63]],red,.008);
 }
 box([.044,.27,1.36],[-2.322,.489,0],black,body,.05,'Rear_diffuser');
 for(let z=-.54;z<=.6;z+=.18)box([.19,.09,.014],[-2.29,.348,z],black,body,.004);
 box([.025,.125,.33],[-2.348,.74,0],white,body,.012,'Rear_plate');
 box([.016,.052,.12],[2.387,.704,0],rim,body,.008,'Jaguar_grille_badge');
 // Wheels: proper wheelbase, tire shoulders, machined split spokes, rotors and calipers.
 for(const x of [-1.495,1.495])for(const s of [-1,1]){
  const wheel=new THREE.Group();wheel.position.set(x,.393,s*.875);wheel.name=`Wheel_${x>0?'front':'rear'}_${s>0?'left':'right'}`;body.add(wheel);
  const tire=cylinder(.387,.387,.255,[0,0,0],rubber,wheel,64);tire.rotation.x=Math.PI/2;
  for(const off of [-.106,.106]){const edge=add(new THREE.TorusGeometry(.335,.053,12,64),rubber,wheel,[0,0,off]);}
  for(let k=0;k<48;k++){const a=k*Math.PI/24;const tread=box([.013,.014,.20],[Math.sin(a)*.386,Math.cos(a)*.386,0],black,wheel,.004);tread.rotation.z=-a;}
  const outer=s*.138;const rotor=cylinder(.262,.262,.018,[0,0,s*.084],rim,wheel);rotor.rotation.x=Math.PI/2;
  const barrel=cylinder(.30,.30,.046,[0,0,s*.114],darkRim,wheel);barrel.rotation.x=Math.PI/2;
  const face=add(new THREE.TorusGeometry(.291,.012,8,64),rim,wheel,[0,0,outer]);
  for(let k=0;k<10;k++)for(const split of [-1,1]){const a=k*Math.PI/5+split*.04;const spoke=box([.026,.229,.021],[Math.sin(a)*.17,Math.cos(a)*.17,outer],rim,wheel,.006);spoke.rotation.z=-a+split*.13;}
  const hub=cylinder(.075,.075,.04,[0,0,outer+s*.016],darkRim,wheel);hub.rotation.x=Math.PI/2;
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const bolt=cylinder(.008,.008,.02,[Math.sin(a)*.045,Math.cos(a)*.045,outer+s*.04],rim,wheel,10);bolt.rotation.x=Math.PI/2;}
  box([.064,.135,.045],[.20,.018,s*.099],mat('#5b6b73',.5,.5),wheel,.014,'Brake_caliper');
 }
 // Side graphics are generated locally, so the HTML needs no texture files.
 function textTexture(text,color='#327c51',width=1024,height=256){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.clearRect(0,0,width,height);ctx.font=`600 ${height*.66}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,width/2,height*.53);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 const wordmark=new THREE.MeshStandardMaterial({map:textTexture('waymo'),transparent:true,roughness:.6,depthWrite:false,side:THREE.DoubleSide});
 for(const s of [-1,1]){const brand=add(new THREE.PlaneGeometry(.77,.192),wordmark,body,[.13,.76,s*.944],'Waymo_wordmark');if(s<0)brand.rotation.y=Math.PI;}
 // Roof rack: gently rounded shell on four feet, with central optical tower.
 for(const x of [-.55,.51])for(const s of [-1,1])box([.13,.13,.14],[x,1.575,.59*s],black,body,.035,'Roof_rack_foot');
 box([1.64,.115,1.37],[-.06,1.697,0],white,body,.07,'Waymo_roof_sensor_platform');
 box([1.57,.036,1.30],[-.06,1.65,0],black,body,.018);
 const towerBase=cylinder(.363,.40,.105,[-.12,1.79,0],white,body);
 cylinder(.345,.36,.20,[-.12,1.924,0],black,body);
 cylinder(.362,.362,.035,[-.12,1.826,0],white,body);
 cylinder(.352,.355,.035,[-.12,2.024,0],white,body);
 const addSensor=(id,type,name,position,direction,location,subtype,note,shape='lens')=>{
  const group=new THREE.Group();group.name=`${id}_${name.replaceAll(' ','_')}`;group.position.fromArray(position);sensorRoot.add(group);
  const meta={id,type,name,position:[...position],direction:[...direction],location,subtype,note,approximate:true};group.userData={...meta};
  const color=TYPES[type].color, accent=mat(color,.35,.25), front=new THREE.Vector3(...direction).normalize();
  const orient=o=>{o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),front);return o;};
  if(shape==='roofLidar'){
   cylinder(.285,.306,.07,[0,-.145,0],white,group);cylinder(.276,.285,.245,[0,.006,0],black,group);cylinder(.28,.276,.04,[0,.148,0],white,group);cylinder(.24,.27,.057,[0,.193,0],white,group);
   for(let i=0;i<32;i++){let a=i*Math.PI/16;const o=box([.016,.15,.008],[Math.cos(a)*.278,.003,Math.sin(a)*.278],darkRim,group,.002);o.rotation.y=Math.PI/2-a;}
   cylinder(.29,.29,.017,[0,-.103,0],accent,group);
  }else if(shape==='lidar'){
   const housing=box([.19,.25,.20],[0,0,0],white,group,.06);housing.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),front);
   orient(cylinder(.081,.081,.11,front.clone().multiplyScalar(.09).toArray(),black,group));
   orient(cylinder(.057,.057,.013,front.clone().multiplyScalar(.151).toArray(),lens,group));
   orient(cylinder(.085,.085,.015,front.clone().multiplyScalar(.136).toArray(),accent,group));
  }else if(shape==='radar'){
   const shell=box([.245,.15,.14],[0,0,0],white,group,.048);shell.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),front);
   const face=box([.193,.105,.019],front.clone().multiplyScalar(.078).toArray(),black,group,.025);face.quaternion.copy(shell.quaternion);
   const strip=box([.117,.012,.024],front.clone().multiplyScalar(.086).add(new THREE.Vector3(0,-.039,0)).toArray(),accent,group,.004);strip.quaternion.copy(shell.quaternion);
  }else if(shape==='audio'){
   orient(cylinder(.052,.061,.054,[0,0,0],white,group));orient(cylinder(.039,.039,.009,front.clone().multiplyScalar(.03).toArray(),black,group));
   for(let i=-1;i<=1;i++){const grille=box([.045,.004,.005],[0,i*.012,.037],accent,group,.001);grille.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),front);}
  }else if(shape==='support'){
   box(id==='S03'?[.57,.23,.46]:[.16,.08,.15],[0,0,0],black,group,.02);
   box(id==='S03'?[.53,.018,.42]:[.14,.012,.13],[0,id==='S03'?.123:.047,0],accent,group,.005);
   if(id==='S03')for(let k=-3;k<=3;k++)box([.50,.016,.014],[0,.149,k*.045],rim,group,.003);
  }else{
   orient(cylinder(.053,.063,.060,[0,0,0],white,group,24));orient(cylinder(.040,.047,.028,front.clone().multiplyScalar(.039).toArray(),black,group,24));orient(cylinder(.030,.030,.007,front.clone().multiplyScalar(.057).toArray(),lens,group,24));orient(cylinder(.012,.012,.008,front.clone().multiplyScalar(.062).toArray(),accent,group,16));
  }
  const sensor={...meta,group,base:new THREE.Vector3(...position),dir:front,accent};
  group.traverse(o=>{if(o.isMesh)o.userData.sensorId=id;});sensors.push(sensor);return sensor;
 };
 const layoutNote='Assembly location follows public imagery; housing dimensions and pose are approximate.';
 addSensor('L01','lidar','Roof 360° lidar',[-.12,2.22,0],[0,1,0],'Above the roof camera ring','Long-range / 360°',layoutNote,'roofLidar');
 for(const [id,name,p,d,loc]of[
 ['L02','Front perimeter lidar',[2.37,.91,0],[1,0,0],'Center of the front fascia'],
 ['L03','Left perimeter lidar',[1.36,1.16,1.005],[0,0,1],'Above the front-left wheel'],
 ['L04','Right perimeter lidar',[1.36,1.16,-1.005],[0,0,-1],'Above the front-right wheel'],
 ['L05','Rear perimeter lidar',[-2.36,1.03,0],[-1,0,0],'Center of the rear fascia']])addSensor(id,'lidar',name,p,d,loc,'Near-field depth',layoutNote,'lidar');
 // The camera total is published; this 12+3+2+2+3+3+2+2 allocation is deliberately schematic.
 const camNote='Illustrative lens within a representative assembly. Waymo confirms 29 cameras overall; this individual ID, allocation and pose are not published.';
 let ci=0;
 const camera=(name,p,d,loc,subtype)=>addSensor('C'+String(++ci).padStart(2,'0'),'camera',name,p,d,loc,subtype,camNote);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;camera(`Roof ring · lens ${i+1}`,[-.12+Math.cos(a)*.357,1.928,Math.sin(a)*.357],[Math.cos(a),0,Math.sin(a)],'Around the central roof tower','360° vision');}
 for(let i=0;i<3;i++)camera(`Forward roof · lens ${i+1}`,[.805,1.714,(i-1)*.265],[1,0,0],'Leading edge of the roof rack','Long-range vision');
 for(const [name,p,d,loc,n]of[
 ['Front perimeter',[2.344,.88,0],[1,0,0],'Front fascia beside the lidar',2],
 ['Rear perimeter',[-2.34,1.003,0],[-1,0,0],'Rear fascia beside the lidar',2],
 ['Left fender',[1.30,1.073,1.019],[0,0,1],'Front-left fender assembly',3],
 ['Right fender',[1.30,1.073,-1.019],[0,0,-1],'Front-right fender assembly',3],
 ['Left rear corner',[-2.07,.90,.94],[-.6,0,.8],'Rear-left corner pod',2],
 ['Right rear corner',[-2.07,.90,-.94],[-.6,0,-.8],'Rear-right corner pod',2]]){
   for(let i=0;i<n;i++){const off=(i-(n-1)/2)*.137;const pos=[...p];if(name.includes('perimeter'))pos[2]+=off+(i===0?-.14:.14);else pos[0]+=off;camera(`${name} · lens ${i+1}`,pos,d,loc,name.includes('perimeter')?'Perimeter vision':'Peripheral vision');}
 }
 for(const [i,name,p,d,loc]of[
 [1,'Left forward roof radar',[.59,1.735,.545],[1,0,0],'Front-left edge of the roof rack'],
 [2,'Right forward roof radar',[.59,1.735,-.545],[1,0,0],'Front-right edge of the roof rack'],
 [3,'Left side radar',[1.53,1.055,1.016],[0,0,1],'Front-left fender pod'],
 [4,'Right side radar',[1.53,1.055,-1.016],[0,0,-1],'Front-right fender pod'],
 [5,'Left rear radar',[-2.13,.785,.936],[-.7,0,.7],'Rear-left corner pod'],
 [6,'Right rear radar',[-2.13,.785,-.936],[-.7,0,-.7],'Rear-right corner pod']])addSensor(`R0${i}`,'radar',name,p,d,loc,'Imaging radar',layoutNote,'radar');
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;addSensor(`A0${i+1}`,'audio',`External audio · example ${i+1}`,[-.12+Math.cos(a)*.47,1.785,Math.sin(a)*.47],[Math.cos(a),.15,Math.sin(a)],'Representative roof receiver','Acoustic perception','Audio is a documented sensing modality. Four placements visualize an array; the actual count and mounting details are not verified.','audio');}
 addSensor('S01','support','GNSS / localization aid',[-.76,1.81,0],[0,1,0],'Illustrative roof position','Position reference','Conceptual localization component; this unit and mounting position are unverified. Localization also uses maps and sensor observations.','support');
 addSensor('S02','support','Inertial measurement unit',[0,.54,0],[0,1,0],'Illustrative internal position','Motion reference','Conceptual inertial sensing unit; physical location is unverified. Use See through body or Separate sensors to reveal it.','support');
 addSensor('S03','support','Onboard computer',[-1.46,.71,0],[0,1,0],'Illustrative rear cargo position','Sensor fusion & planning','Compute is documented, but this enclosure and position are illustrative. It processes sensor information; it is not itself a perception sensor.','support');
 for(const sensor of sensors){if(sensor.type==='support'){sensor.description=sensor.id==='S01'?'Satellite positioning can contribute to localization alongside maps and onboard sensor observations. This marker explains the function; it does not identify a verified I-PACE antenna.':sensor.id==='S02'?'Inertial measurements describe changes in motion and orientation. This internal component is shown as a contextual example.':'The onboard computer combines sensor information to interpret the scene and plan vehicle motion. The enclosure shown here is conceptual.';}}
 body.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){bodyMaterials.add(m);m.userData.originalOpacity=m.opacity;m.userData.originalTransparent=m.transparent;m.userData.originalDepthWrite=m.depthWrite;}}});
 return {vehicle,body,sensors,sensorRoot,bodyMaterials};
}
