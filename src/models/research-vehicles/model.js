import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original generic research vehicles, +X forward, +Y up, +Z left. No manufacturer claim.
export const TYPES={
 camera:{label:'Camera',color:'#a95320',output:'Image sequences',description:'Optical images provide road appearance, lane markings and surrounding context.'},
 lidar:{label:'Lidar',color:'#23789b',output:'Point cloud geometry',description:'Laser ranging samples surface geometry. This illustration is not a calibrated scanning pattern.'},
 radar:{label:'Radar',color:'#287249',output:'Range and relative motion',description:'Radar complements visual observations with range and relative-motion measurements.'},
 profile:{label:'Road profiler',color:'#7951a0',output:'Transverse pavement profile',description:'Downward-looking profile instruments can measure pavement surface shape when appropriately calibrated.'},
 support:{label:'Position / compute',color:'#596b7a',output:'Position, motion or recording',description:'Position, inertial measurements and time-synchronized recording support research workflows.'}
};
export function createResearchVehicle(kind='lab'){
 const lab=kind==='lab',vehicle=new THREE.Group(),body=new THREE.Group(),sensorRoot=new THREE.Group(),bodyMaterials=new Set(),sensors=[];
 vehicle.name=lab?'Generic_research_survey_vehicle':'Generic_driver_assistance_vehicle';vehicle.add(body,sensorRoot);
 vehicle.userData={units:'metres',front:'+X',notice:'Original generic educational vehicle. Instrument arrangement, dimensions and capabilities are illustrative; not a real fleet inventory.'};
 const material=(color,roughness=.4,metalness=.15)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const paint=new THREE.MeshPhysicalMaterial({color:lab?'#e4e8e7':'#617f91',roughness:.28,metalness:.42,clearcoat:.7});
 const black=material('#17232c',.6),glass=material('#183647',.19,.55),steel=material('#9ba8b1',.26,.8),rubber=material('#151c21',.94,0),trim=material('#37434b');
 const lamp=new THREE.MeshStandardMaterial({color:'#ebf4ff',emissive:'#c9e6ff',emissiveIntensity:.7}),tail=new THREE.MeshStandardMaterial({color:'#a62228',emissive:'#ec242a',emissiveIntensity:.45});
 const add=(geo,mat,pos,parent=body,name='')=>{const m=new THREE.Mesh(geo,mat);m.position.fromArray(pos);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(size,pos,mat=paint,parent=body,r=.025,name='')=>add(new RoundedBoxGeometry(...size,2,Math.min(r,...size.map(x=>x*.4))),mat,pos,parent,name);
 const cyl=(r,h,pos,mat=black,parent=body)=>add(new THREE.CylinderGeometry(r,r,h,32),mat,pos,parent);
 const poly=(points,mat,parent=body)=>{const g=new THREE.BufferGeometry(),idx=[];for(let i=1;i<points.length-1;i++)idx.push(0,i,i+1);g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex(idx);g.computeVertexNormals();return add(g,mat,[0,0,0],parent);};
 // Smooth wagon silhouette with open wheel arches built from an extruded side profile.
 const shape=new THREE.Shape();shape.moveTo(-2.4,.37);shape.lineTo(-2.4,1.03);shape.quadraticCurveTo(-2.3,1.22,-1.98,1.23);shape.lineTo(-1.58,1.79);shape.quadraticCurveTo(-1.44,1.87,-1.2,1.87);shape.lineTo(.62,1.83);shape.lineTo(1.33,1.20);shape.lineTo(2.16,1.13);shape.quadraticCurveTo(2.44,1.05,2.44,.83);shape.lineTo(2.44,.37);
 for(let x=2.44;x>=-2.4;x-=.015){let y=.37;for(const axle of [-1.51,1.53])if(Math.abs(x-axle)<.45)y=Math.max(y,.4+Math.sqrt(.45**2-(x-axle)**2));shape.lineTo(x,y);}shape.closePath();
 const sideGeo=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.015,curveSegments:20});
 add(sideGeo,paint,[0,0,.91]);add(sideGeo,paint,[0,0,-.985]);
 box([4.54,.15,1.78],[0,.35,0],black);box([2.93,.17,1.78],[-.42,1.79,0],paint,body,.07);box([1.13,.13,1.86],[1.8,1.125,0],paint,body,.05);box([.18,.38,1.94],[2.34,.67,0],paint,body,.04);box([.15,.50,1.91],[-2.36,.81,0],paint,body,.035);
 poly([[1.37,1.21,.855],[.65,1.78,.86],[.65,1.78,-.86],[1.37,1.21,-.855]],glass);
 poly([[-2.01,1.23,-.86],[-1.61,1.77,-.86],[-1.61,1.77,.86],[-2.01,1.23,.86]],glass);
 for(const s of [-1,1]){
  const p=(x,y)=>[x,y,s*.993],ordered=pts=>s>0?pts:pts.reverse();
  poly(ordered([p(1.22,1.22),p(.59,1.73),p(-.16,1.75),p(-.16,1.23)]),glass);
  poly(ordered([p(-.23,1.23),p(-.23,1.75),p(-1.42,1.77),p(-1.82,1.23)]),glass);
  box([2.97,.035,.015],[-.29,1.195,s*1.005],steel);
  for(const x of [-.21,-1.83])box([.012,.7,.016],[x,.80,s*1.008],trim,body,.001);
  for(const x of [-.40,-1.54])box([.17,.035,.025],[x,1.09,s*1.02],steel);
  box([.09,.05,.17],[.99,1.27,s*1.03],black);box([.26,.13,.20],[1.01,1.34,s*1.14],paint,body,.04);box([.016,.087,.15],[.889,1.345,s*1.14],glass);
  box([2.9,.11,.045],[-.10,.405,s*1.012],trim);
  box([.035,.105,.5],[2.437,.945,s*.64],lamp,body,.02);box([.02,.25,.35],[-2.443,1.02,s*.71],tail,body,.01);
  for(const x of [-1.51,1.53]){
   const wheel=new THREE.Group();wheel.name=`Wheel_${x>0?'front':'rear'}_${s>0?'left':'right'}`;wheel.position.set(x,.403,s*.9);body.add(wheel);
   const tire=cyl(.397,.24,[0,0,0],rubber,wheel);tire.rotation.x=Math.PI/2;
   const rim=cyl(.28,.252,[0,0,0],steel,wheel);rim.rotation.x=Math.PI/2;
   const disk=cyl(.236,.259,[0,0,0],black,wheel);disk.rotation.x=Math.PI/2;
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const spoke=box([.048,.24,.018],[Math.sin(a)*.12,Math.cos(a)*.12,s*.137],steel,wheel,.012);spoke.rotation.z=-a;}
   const hub=cyl(.069,.29,[0,0,0],steel,wheel);hub.rotation.x=Math.PI/2;
   for(let i=0;i<32;i++){const a=i*Math.PI/16;const tread=box([.015,.017,.19],[Math.sin(a)*.397,Math.cos(a)*.397,0],trim,wheel,.001);tread.rotation.z=-a;}
  }
 }
 box([.023,.22,1.12],[2.443,.68,0],black);for(let z=-.49;z<.55;z+=.11)box([.02,.17,.019],[2.46,.68,z],steel);
 // Visible cabin fittings provide context for the interior view.
 box([.4,.25,1.6],[1.07,1.05,0],trim);box([.7,.13,1.65],[-.7,.5,0],trim);
 for(const z of [-.48,.48]){box([.50,.15,.48],[.18,.68,z],black,body,.065);const back=box([.14,.57,.48],[-.10,.98,z],black,body,.06);back.rotation.z=.12;box([.14,.2,.29],[-.10,1.36,z],black,body,.05);}
 const steering=add(new THREE.TorusGeometry(.17,.023,8,32),black,[.75,1.18,.47]);steering.rotation.y=Math.PI/2;steering.rotation.z=-.3;
 function sensor(id,type,name,pos,dir,location,description){
  const group=new THREE.Group();group.position.fromArray(pos);group.name=id+'_'+name.replaceAll(' ','_');sensorRoot.add(group);
  const accent=material(TYPES[type].color,.35,.5),d=new THREE.Vector3(...dir).normalize();
  if(type==='lidar'){cyl(.19,.08,[0,-.08,0],steel,group);cyl(.175,.20,[0,.05,0],glass,group);cyl(.183,.04,[0,.17,0],black,group);cyl(.18,.02,[0,.13,0],accent,group);}
  else if(type==='camera'){
   const local=new THREE.Group();group.add(local);local.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),d);box([.13,.14,.17],[0,0,0],black,local);const optic=cyl(.047,.04,[.084,0,0],glass,local);optic.rotation.z=Math.PI/2;const ring=add(new THREE.TorusGeometry(.046,.006,8,24),steel,[.106,0,0],local);ring.rotation.y=Math.PI/2;
  }else if(type==='profile'){box([.20,.17,.48],[0,0,0],black,group);box([.15,.02,.38],[0,-.096,0],accent,group);}
  else{box(type==='radar'?[.05,.18,.27]:[.21,.08,.20],[0,0,0],type==='radar'?black:steel,group);box([.012,.04,.055],[.04,0,0],accent,group);}
  sensors.push({id,type,name,base:new THREE.Vector3(...pos),dir:d,group,location,description,source:'overview',note:'Generic research example. Placement and dimensions are illustrative; the model does not identify a commercial system.'});
 }
 sensor('C01','camera','Forward scene camera',[1.02,1.55,0],[1,0,0],'Behind the windshield','Records road appearance and lane context.');
 sensor('R01','radar','Forward radar example',[2.49,.68,0],[1,0,0],'Front fascia','Illustrates forward range and relative-motion sensing.');
 sensor('S01','support','Inertial and recording unit',[-1.35,.77,0],[0,1,0],'Rear load area','Illustrative synchronized inertial measurement and data logging unit.');
 if(lab){
  for(const x of [-.95,.55])box([.06,.12,2.02],[x,1.95,0],steel);for(const z of [-.82,.82])box([2.6,.045,.055],[-.25,2.02,z],steel);
  sensor('L01','lidar','Roof lidar',[-.1,2.15,0],[1,0,0],'Roof survey rack','Captures surrounding geometry for a mobile research dataset.');
  sensor('C02','camera','Left stereo camera',[.62,2.12,.40],[1,-.10,0],'Forward rack, left','One member of an illustrative stereo pair; baseline is not calibrated.');
  sensor('C03','camera','Right stereo camera',[.62,2.12,-.40],[1,-.10,0],'Forward rack, right','One member of an illustrative stereo pair; baseline is not calibrated.');
  sensor('S02','support','GNSS antenna',[-1.20,2.10,0],[0,1,0],'Rear survey rack','Supports positioning when synchronized with motion and sensor streams.');
  box([.15,.10,2.28],[-2.58,.48,0],steel);for(const z of [-.74,.74]){box([.37,.05,.06],[-2.44,.5,z],steel);sensor(z>0?'P01':'P02','profile',z>0?'Left road profiler':'Right road profiler',[-2.65,.48,z],[0,-1,0],'Rear transverse survey beam','Downward-looking example for road-profile measurement. Accurate distress measurements require validated calibration and processing.');}
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#1d5276';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#fff';ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.fillText('PAVEMENT RESEARCH',512,88);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.MeshStandardMaterial({map:texture});for(const s of [-1,1]){const panel=add(new THREE.PlaneGeometry(2.45,.305),label,[-.45,.93,s*1.024]);if(s<0)panel.rotation.y=Math.PI;}
 }else{
  sensor('C02','camera','Rear-view camera',[-2.48,1.13,0],[-1,0,0],'Tailgate','Illustrates rear-view imagery used by assistance systems.');
  sensor('R02','radar','Left rear radar example',[-2.25,.68,.96],[-.7,0,.7],'Rear left corner','Illustrates adjacent-lane and blind-zone sensing.');sensor('R03','radar','Right rear radar example',[-2.25,.68,-.96],[-.7,0,-.7],'Rear right corner','Illustrates adjacent-lane and blind-zone sensing.');
 }
 body.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat()){bodyMaterials.add(m);m.userData={...m.userData,originalOpacity:m.opacity,originalTransparent:m.transparent,originalDepthWrite:m.depthWrite};}});
 return{vehicle,body,sensorRoot,sensors,bodyMaterials};
}
