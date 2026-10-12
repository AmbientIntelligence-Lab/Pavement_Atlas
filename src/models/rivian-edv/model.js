import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SENSOR_DATA,TYPES} from './sensors.js';

export function createVehicle(){
 const vehicle=new THREE.Group();vehicle.name='Amazon_Rivian_EDV_700';
 vehicle.userData={units:'metres',coordinateSystem:'+X front, +Y up, +Z vehicle left',notice:'Educational reconstruction. Dimensions, sensor housings and coordinates are approximate; not calibration data. Optional fleet assemblies are illustrative.'};
 const body=new THREE.Group();body.name='Exterior_body';vehicle.add(body);
 const interior=new THREE.Group();interior.name='Cabin_and_cargo';vehicle.add(interior);
 const chassis=new THREE.Group();chassis.name='Chassis_and_wheels';vehicle.add(chassis);
 const sensorRoot=new THREE.Group();sensorRoot.name='Annotated_sensors';vehicle.add(sensorRoot);
 const mat=(color,roughness=.45,metalness=.15)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const paint=new THREE.MeshPhysicalMaterial({color:'#344d5c',roughness:.3,metalness:.48,clearcoat:.7,clearcoatRoughness:.26});
 const black=mat('#121d23',.55,.15),trim=mat('#26333b',.6,.12),rubber=mat('#151a1e',.91,0),silver=mat('#b1bbc1',.32,.75),steel=mat('#303c44',.34,.72);
 const glass=new THREE.MeshPhysicalMaterial({color:'#172b39',roughness:.14,metalness:.55,clearcoat:1,side:THREE.DoubleSide});
 const seam=mat('#182a35',.55,.2),inside=mat('#bbc1c0',.8,.05),seatMat=mat('#293438',.95,0),lensMat=mat('#082a3d',.1,.7);
 const whiteLight=new THREE.MeshStandardMaterial({color:'#eaf6fc',emissive:'#c8edff',emissiveIntensity:1.25,roughness:.26});
 const redLight=new THREE.MeshStandardMaterial({color:'#cc2334',emissive:'#ed1930',emissiveIntensity:.52,roughness:.34});
 const amberLight=new THREE.MeshStandardMaterial({color:'#f5a62c',emissive:'#ff9a18',emissiveIntensity:.55,roughness:.36});
 const add=(geo,material,pos=[0,0,0],parent=body,name='')=>{const m=new THREE.Mesh(geo,material);m.position.fromArray(pos);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const boxCache=new Map();
 const box=(size,pos,material=paint,parent=body,r=.04,name='')=>{const key=size.join(',')+':'+r;if(!boxCache.has(key))boxCache.set(key,r<=.012?new THREE.BoxGeometry(...size):new RoundedBoxGeometry(...size,2,Math.min(r,...size.map(x=>x*.45))));return add(boxCache.get(key),material,pos,parent,name);};
 const cyl=(r,h,pos,material=black,parent=body,n=48)=>add(new THREE.CylinderGeometry(r,r,h,n),material,pos,parent);
 const path=(points,material=seam,r=.006,parent=body,closed=false)=>{const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');return add(new THREE.TubeGeometry(c,Math.max(16,points.length*9),r,6,false),material,[0,0,0],parent);};
 function poly(points,material=paint,parent=body,name=''){
  const pos=points.flat(),idx=[];for(let i=1;i<points.length-1;i++)idx.push(0,i,i+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=material.clone();m.side=THREE.DoubleSide;return add(g,m,[0,0,0],parent,name);
 }
 // Hollow bodywork: wheel openings are cut into the long side panels.
 const sideShape=new THREE.Shape();sideShape.moveTo(-3.47,.49);sideShape.lineTo(-3.47,2.64);sideShape.quadraticCurveTo(-3.46,2.87,-3.24,2.90);sideShape.lineTo(1.45,2.90);sideShape.bezierCurveTo(1.9,2.90,2.19,2.78,2.39,2.5);sideShape.lineTo(3.075,1.46);sideShape.quadraticCurveTo(3.42,1.40,3.51,1.26);sideShape.lineTo(3.51,.51);
 for(let x=3.51;x>=-3.48;x-=.018){let y=.49;for(const cx of [2.43,-2.32])if(Math.abs(x-cx)<.48)y=Math.max(y,.428+Math.sqrt(.48**2-(x-cx)**2));sideShape.lineTo(x,y);}sideShape.closePath();
 for(const s of [-1,1]){
  const g=new THREE.ExtrudeGeometry(sideShape,{depth:.035,bevelEnabled:false,curveSegments:20});add(g,paint,[0,0,s===1?1.068:-1.103],body,s===1?'Left_body_panel':'Right_body_panel');
 }
 // Crown and gently rounded shoulders, built as an open roof ribbon.
 const roofProfile=[[-3.48,2.67,.91],[-3.43,2.79,1.01],[-3.25,2.90,1.10],[-2.8,2.92,1.1],[0,2.92,1.1],[1.44,2.91,1.1],[1.76,2.88,1.095],[2.03,2.81,1.08],[2.23,2.70,1.055],[2.43,2.52,1.035]];
 const roofPos=[],roofIdx=[],segments=20;
 for(const [x,y,w] of roofProfile){for(let j=0;j<=segments;j++){const t=(j/segments)*Math.PI;const z=Math.cos(t)*w;const edge=Math.pow(Math.abs(z/w),8);roofPos.push(x,y-.145*edge,z);}}
 for(let i=0;i<roofProfile.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;roofIdx.push(a,b,a+1,b,b+1,a+1);}
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(roofPos,3));rg.setIndex(roofIdx);rg.computeVertexNormals();const roofMat=paint.clone();roofMat.side=THREE.DoubleSide;add(rg,roofMat,[0,0,0],body,'Rounded_roof_and_front_cap');
 // Front windshield: wide, steeply raked, uninterrupted glass.
 const windshield=[[3.094,1.51,-.96],[3.125,1.57,-1.0],[2.448,2.57,-.957],[2.359,2.636,-.82],[2.354,2.653,.82],[2.448,2.57,.957],[3.125,1.57,1.0],[3.094,1.51,.96]];
 poly(windshield,glass,body,'Panoramic_windshield');path(windshield,black,.023,body,true);
 for(const s of [-1,1]){
  const p=(x,y,z=1.111)=>[x,y,z*s];
  poly([p(1.49,1.68),p(1.49,2.55),p(1.60,2.63),p(2.19,2.61),p(2.40,2.41),p(2.95,1.56),p(2.3,1.60)],glass,body,'Cab_side_glazing');
  path([p(1.48,1.68),p(1.475,2.53),p(1.60,2.64),p(2.18,2.62),p(2.42,2.42),p(2.95,1.56),p(2.3,1.59)],black,.017,body,true);
  path([p(2.45,1.59),p(2.03,2.62)],black,.018);
  // Driver door versus curbside sliding door.
  path([p(1.40,.58),p(1.40,2.70),p(2.01,2.70),p(2.42,2.51),p(3.02,1.48)],seam,.006);
  box([.078,.21,.036],[1.59,1.34,s*1.124],black,body,.025,'Door_handle');
  box([.028,.13,.014],[1.589,1.35,s*1.146],silver,body,.008);
  if(s===-1){path([[1.36,1.03,-1.128],[-.2,1.03,-1.128]],steel,.012);box([1.05,.075,.23],[1.00,.44,-1.07],black,body,.03,'Curbside_step');}
  for(const x of [-3.32,-2.14,-.96,.22,1.38])path([[x,.91,s*1.112],[x,2.70,s*1.112],[x,2.815,s*1.052]],seam,.0038);
  path([[-3.25,.77,s*1.12],[1.40,.77,s*1.12]],black,.017);
  path([[-3.28,.81,s*1.117],[1.40,.81,s*1.117]],silver,.008);
  // Wheel arch guards and utility sill.
  for(const x of [2.43,-2.32]){
   const pts=[];for(let i=0;i<=48;i++){const a=i*Math.PI/48;pts.push([x+Math.cos(a)*.485,.43+Math.sin(a)*.485,s*1.12]);}path(pts,trim,.034);
  }
  box([3.65,.16,.045],[-.01,.52,s*1.113],trim,body,.025,'Side_sill');
  box([.23,.07,.019],[.63,.72,s*1.147],amberLight,body,.025,'Side_indicator');
  box([.11,.055,.021],[3.31,.77,s*1.119],amberLight,body,.018,'Front_marker');
  box([.09,.055,.022],[-3.22,.73,s*1.126],redLight,body,.018,'Rear_marker');
  // Double-section commercial mirror with arms.
  path([[2.60,1.59,s*1.11],[2.63,1.55,s*1.22],[2.48,1.57,s*1.30]],black,.026);
  path([[2.45,1.97,s*1.11],[2.42,1.95,s*1.30]],black,.020);
  box([.18,.40,.18],[2.43,1.79,s*1.30],black,body,.045,'Mirror_housing');
  box([.016,.24,.146],[2.332,1.85,s*1.30],silver,body,.018,'Mirror_upper_glass');
  box([.016,.105,.146],[2.332,1.655,s*1.30],silver,body,.018,'Mirror_lower_glass');
  box([.021,.013,.135],[2.529,1.71,s*1.30],amberLight,body,.004,'Mirror_turn_indicator');
 }
 // Shallow hood and friendly circular headlamp face.
 poly([[3.10,1.48,-1.0],[3.10,1.48,1.0],[3.46,1.34,.99],[3.51,1.25,.90],[3.51,1.25,-.90],[3.46,1.34,-.99]],paint,body,'Short_hood');
 box([.19,.44,2.06],[3.445,1.055,0],paint,body,.105,'Front_fascia');
 box([.033,.284,1.79],[3.55,1.065,0],black,body,.13,'Headlamp_band');
 box([.26,.30,2.05],[3.40,.63,0],trim,body,.11,'Front_bumper');
 box([.045,.104,1.30],[3.55,.755,0],black,body,.045,'Lower_intake');
 box([.038,.028,1.22],[3.581,.774,0],steel,body,.005,'Intake_lip');
 for(const z of [-.728,.728]){
  const housing=cyl(.164,.034,[3.58,1.074,z],steel);housing.rotation.z=Math.PI/2;
  const inner=cyl(.130,.041,[3.605,1.074,z],black);inner.rotation.z=Math.PI/2;
  const ring=add(new THREE.TorusGeometry(.137,.017,10,64),whiteLight,[3.624,1.074,z]);ring.rotation.y=Math.PI/2;
  const bulb=add(new THREE.SphereGeometry(.075,24,16),silver,[3.635,1.074,z]);bulb.scale.x=.34;
  box([.028,.017,.210],[3.669,1.074,z],whiteLight,body,.005,'Headlight_crossbar');
 }
 // Wipers sit visibly on the bottom of the windshield.
 for(const s of [-1,1]){path([[3.11,1.565,s*.82],[3.085,1.61,s*.40],[3.038,1.69,s*.13]],black,.011);path([[3.045,1.68,s*.55],[3.002,1.745,s*.02]],black,.016);}
 // Charge-port cover on the driver-side front wing.
 box([.205,.178,.014],[3.035,1.13,1.121],trim,body,.038,'Charge_port_outline');
 box([.188,.162,.018],[3.035,1.13,1.131],paint,body,.03,'Charge_port_door');
 // Roof marker lights and seam rails.
 for(const z of [-.85,-.28,0,.28,.85])box([.035,.041,.065],[2.50,2.691,z],amberLight,body,.015,'Roof_clearance_light');
 for(const s of [-1,1])path([[-3.23,2.815,s*1.047],[1.48,2.825,s*1.047]],paint,.013);
 // Rear frame, roll-up door, and perimeter tail-light signature.
 box([.09,2.22,2.11],[-3.435,1.57,0],paint,body,.13,'Rear_frame');
 box([.018,1.91,1.69],[-3.493,1.56,0],trim,body,.07,'Rollup_door_seal');
 box([.025,1.855,1.61],[-3.506,1.57,0],paint,body,.055,'Rear_rollup_door');
 for(let y=.70;y<2.44;y+=.225)path([[-3.527,y,-.78],[-3.527,y,.78]],seam,.006);
 box([.026,.075,.21],[-3.535,.945,0],black,body,.018,'Rollup_door_handle');
 path([[-3.485,.64,-.987],[-3.485,2.49,-.987],[-3.475,2.75,-.79],[-3.47,2.797,0],[-3.475,2.75,.79],[-3.485,2.49,.987],[-3.485,.64,.987]],black,.04);
 path([[-3.53,.68,-.976],[-3.53,2.49,-.976],[-3.515,2.724,-.80],[-3.51,2.763,0],[-3.515,2.724,.80],[-3.53,2.49,.976],[-3.53,.68,.976]],redLight,.023);
 box([.32,.14,2.16],[-3.465,.425,0],black,body,.045,'Rear_step_bumper');
 for(const z of [-.79,.79]){box([.035,.09,.27],[-3.513,.655,z],whiteLight,body,.015);path([[-3.55,1.04,z],[-3.55,1.40,z]],silver,.017);}
 box([.035,.095,.38],[-3.549,.565,0],silver,body,.01,'Rear_plate');
 for(const z of [-.28,0,.28])box([.035,.04,.061],[-3.48,2.862,z],redLight,body,.01,'Rear_clearance_light');
 // Black steel fleet wheels, tire sidewalls, tread and fasteners.
 for(const x of [2.43,-2.32])for(const s of [-1,1]){
  const wheel=new THREE.Group();wheel.name=`Wheel_${x>0?'front':'rear'}_${s>0?'left':'right'}`;wheel.position.set(x,.424,s*1.015);chassis.add(wheel);
  const tire=cyl(.419,.235,[0,0,0],rubber,wheel,64);tire.rotation.x=Math.PI/2;
  for(const dz of [-.097,.097]){const tor=add(new THREE.TorusGeometry(.338,.080,12,64),rubber,[0,0,dz],wheel);}
  const disc=cyl(.265,.019,[0,0,s*.124],steel,wheel);disc.rotation.x=Math.PI/2;
  const lip=add(new THREE.TorusGeometry(.267,.011,8,64),steel,[0,0,s*.14],wheel);
  const hub=cyl(.105,.047,[0,0,s*.14],black,wheel);hub.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const hole=add(new THREE.SphereGeometry(.033,12,8),black,[Math.cos(a)*.211,Math.sin(a)*.211,s*.147],wheel);hole.scale.set(1,1,.22);}
  for(let i=0;i<6;i++){const a=i*Math.PI/3;const bolt=cyl(.014,.017,[Math.cos(a)*.072,Math.sin(a)*.072,s*.168],silver,wheel,6);bolt.rotation.x=Math.PI/2;}
  for(let i=0;i<64;i++){const a=i*Math.PI/32;const tread=box([.012,.008,.168],[Math.cos(a)*.42,Math.sin(a)*.42,0],trim,wheel,.002);tread.rotation.z=a-Math.PI/2;}
  const valve=box([.008,.030,.009],[.155,-.170,s*.162],black,wheel,.001);valve.rotation.z=-.5;
 }
 box([5.72,.20,1.68],[-.36,.37,0],black,chassis,.03,'Underfloor_battery_enclosure');
 for(const z of [-.67,.67])box([6.20,.12,.10],[-.1,.40,z],steel,chassis,.015,'Chassis_rail');
 for(const x of [2.43,-2.32]){const axle=cyl(.068,1.86,[x,.41,0],black,chassis,20);axle.rotation.x=Math.PI/2;}
 // Simple interior exposed by the body transparency control.
 box([6.22,.07,1.99],[-.28,.76,0],inside,interior,.02,'Cabin_and_cargo_floor');
 box([.075,1.95,1.94],[1.22,1.74,0],inside,interior,.02,'Bulkhead');
 box([.08,1.75,.64],[1.17,1.67,-.28],trim,interior,.012,'Bulkhead_sliding_door');
 box([.10,.15,.025],[1.10,1.67,.0],black,interior,.015,'Bulkhead_handle');
 for(const s of [-1,1])for(const y of [1.20,1.91]){
  box([4.30,.045,.48],[-1.08,y,s*.73],silver,interior,.009,'Cargo_shelf');
  box([4.28,.075,.015],[-1.08,y+.055,s*.48],inside,interior,.004,'Shelf_edge');
 }
 for(const x of [-3.12,-1.75,-.40,.98])for(const s of [-1,1])box([.04,1.7,.04],[x,1.58,s*.94],silver,interior,.004,'Shelf_upright');
 const parcel=mat('#9d815e',.95,0),tape=mat('#c4ad86',.9,0);
 for(const [x,y,z,w,h] of [[-2.7,1.405,.73,.46,.36],[-1.7,1.38,.73,.5,.30],[-.8,2.13,.73,.56,.39],[-2.8,2.12,-.73,.48,.36],[-1.6,1.37,-.73,.53,.29],[-.4,1.43,-.73,.46,.42]]){
  box([w,h,.35],[x,y,z],parcel,interior,.008,'Parcel');box([.05,.002,.352],[x,y+h/2+.004,z],tape,interior,.001,'Parcel_tape');
 }
 box([.95,.22,1.88],[2.59,1.48,0],trim,interior,.07,'Dashboard');
 box([.48,.11,.47],[1.84,1.24,.61],seatMat,interior,.06,'Driver_seat_base');
 const seatBack=box([.13,.69,.48],[1.63,1.67,.61],seatMat,interior,.07,'Driver_seat_back');seatBack.rotation.z=.12;
 box([.12,.21,.32],[1.68,2.075,.61],seatMat,interior,.045,'Headrest');
 box([.30,.47,.30],[1.82,.98,.61],black,interior,.03,'Seat_pedestal');
 const steering=add(new THREE.TorusGeometry(.17,.021,12,40),black,[2.25,1.63,.62],interior);steering.rotation.y=Math.PI/2-.3;
 const boss=cyl(.056,.065,[2.25,1.63,.62],black,interior);boss.rotation.z=Math.PI/2;
 path([[2.23,1.64,.45],[2.23,1.64,.79]],steel,.014,interior);
 box([.035,.23,.43],[2.34,1.735,-.21],black,interior,.02,'Center_display');
 const screen=box([.005,.195,.39],[2.318,1.738,-.21],mat('#294c5c',.4,.2),interior,.01,'Display_surface');
 box([.03,.145,.33],[2.51,1.74,.59],black,interior,.01,'Driver_display');
 box([.27,.08,.35],[1.62,1.14,-.72],seatMat,interior,.03,'Foldaway_jump_seat');

 // All decals are original canvas drawings, embedded in the offline file / GLB.
 function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
 const livery=texture(1400,650,(c,w,h)=>{
  c.clearRect(0,0,w,h);c.fillStyle='#f8fbfc';c.font='600 141px Arial';c.textAlign='right';c.fillText('prime',1320,180);
  c.strokeStyle='#27a9df';c.lineWidth=47;c.lineCap='round';c.beginPath();c.moveTo(115,242);c.bezierCurveTo(370,485,786,520,1095,253);c.stroke();
  c.fillStyle='#27a9df';c.beginPath();c.moveTo(970,231);c.quadraticCurveTo(1080,184,1169,229);c.quadraticCurveTo(1180,312,1085,392);c.lineTo(1097,257);c.closePath();c.fill();
 });
 for(const s of [-1,1]){
  const material=new THREE.MeshBasicMaterial({map:livery,transparent:true,depthWrite:false,side:THREE.FrontSide});
  const decal=add(new THREE.PlaneGeometry(3.52,1.635),material,[-.91,1.99,s*1.111],body,'Amazon_prime_livery');if(s===-1)decal.rotation.y=Math.PI;
 }
 const amazon=texture(512,180,(c)=>{c.fillStyle='#f3f7f8';c.font='bold 96px Arial';c.textAlign='center';c.fillText('amazon',256,108);c.strokeStyle='#f3f7f8';c.lineWidth=8;c.beginPath();c.moveTo(158,132);c.quadraticCurveTo(264,177,349,130);c.stroke();});
 const wordmat=new THREE.MeshBasicMaterial({map:amazon,transparent:true,depthWrite:false});const word=add(new THREE.PlaneGeometry(.37,.13),wordmat,[3.577,1.10,0],body,'Front_amazon_badge');word.rotation.y=Math.PI/2;
 const rearWord=add(new THREE.PlaneGeometry(.76,.267),wordmat,[-3.527,2.18,0],body,'Rear_amazon_badge');rearWord.rotation.y=-Math.PI/2;

 // Each selectable component carries its evidence and model-space transform.
 const sensors=SENSOR_DATA.map(data=>{
  const group=new THREE.Group();group.name=`${data.id}_${data.name.replaceAll(/[^a-z0-9]+/gi,'_')}`;group.position.fromArray(data.pos);sensorRoot.add(group);
  const dir=new THREE.Vector3(...data.dir).normalize();group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);
  group.userData={...data,position:data.pos,illustrativeTransform:true};
  const col=mat(TYPES[data.type].color,.32,.3);let accent;
  if(data.type==='camera'||data.type==='fleet'){
   const size=data.id==='F02'?[.36,.12,.24]:data.id==='F01'?[.14,.13,.13]:data.id==='C12'?[.10,.06,.055]:[.09,.072,.045];
   box(size,[0,0,0],black,group,.017,'Camera_housing');
   const rim=add(new THREE.TorusGeometry(data.type==='fleet'?.028:.025,.005,8,32),col,[0,0,size[2]/2+.004],group,'Lens_ring');accent=rim;
   add(new THREE.SphereGeometry(data.type==='fleet'?.024:.021,20,12),lensMat,[0,0,size[2]/2+.007],group,'Optical_lens').scale.z=.5;
   if(data.id==='F02'){for(const x of [-.11,.11]){const proj=add(new THREE.CircleGeometry(.028,24),whiteLight,[x,0,.13],group,'Projector');}}
  }else if(data.type==='radar'){
   box([.155,.11,.045],[0,0,0],black,group,.015,'Concealed_radar_module');accent=box([.118,.077,.008],[0,0,.027],col,group,.009,'Radar_face');
  }else if(data.type==='ultrasonic'){
   const puck=cyl(.022,.016,[0,0,0],black,group,24);puck.rotation.x=Math.PI/2;
   accent=add(new THREE.CircleGeometry(.016,24),col,[0,0,.01],group,'Ultrasonic_transducer');
  }else{
   accent=box([.15,.075,.04],[0,0,0],black,group,.025,'Illustrative_GNSS_antenna');
  }
  group.traverse(o=>{if(o.isMesh)o.userData.sensorId=data.id;});
  return {...data,group,base:new THREE.Vector3(...data.pos),dir,accent};
 });
 const bodyMaterials=new Set();body.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!bodyMaterials.has(m)){m.userData.originalOpacity=m.opacity;m.userData.originalTransparent=m.transparent;m.userData.originalDepthWrite=m.depthWrite;bodyMaterials.add(m);}}});
 return {vehicle,body,interior,chassis,sensorRoot,sensors,bodyMaterials};
}
