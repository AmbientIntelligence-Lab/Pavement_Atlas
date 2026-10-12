import * as THREE from 'three';
import {createVehicle as waymo, TYPES as waymoTypes} from './models/waymo-ipace/model.js';
import {buildCybercab} from './models/cybercab/model.js';
import {sensors as cyberSensors, sources as cyberSources} from './models/cybercab/sensors.js';
import {createVehicle as aurora, TYPES as auroraTypes} from './models/aurora-truck/model.js';
import {SOURCES as auroraSources} from './models/aurora-truck/sensors.js';
import {createVehicle as rivian} from './models/rivian-edv/model.js';
import {TYPES as rivianTypes, SOURCES as rivianSources} from './models/rivian-edv/sensors.js';
import {createResearchVehicle,TYPES as researchTypes} from './models/research-vehicles/model.js';

export const FLEET = {
  waymo: {name:'Waymo I-PACE', role:'Autonomous passenger vehicle', length:4.68, width:1.98, height:2.2, eye:[.35,1.22,-.40], radius:.387, note:'47 educational annotations. Individual mounts and camera allocations are schematic; this is not a production sensor inventory.'},
  cybercab: {name:'Cybercab', role:'Autonomous passenger vehicle concept', length:4.4, width:1.754, height:1.408, eye:[.34,1.12,.2], radius:.365, note:'14 annotations represent cameras, audio and door sensing functions. They are not a verified sensor total. The cabin view is a passenger view; this model has no steering wheel.'},
  aurora: {name:'Aurora truck', role:'Autonomous freight tractor', length:8.1, width:2.6, height:4.1, eye:[.65,2.55,-.6], radius:.52, note:'22 educational annotations on a Peterbilt-style tractor. Sensor counts and mounting coordinates are illustrative. Trailer is optional in this explorer.'},
  rivian: {name:'Rivian EDV', role:'Driver-operated delivery van with assistance systems', length:7.0, width:2.2, height:3.1, eye:[.65,2.0,-2.3], radius:.419, note:'34 base annotations and two optional fleet system examples. This EDV is a driver-operated van, not an autonomous robotaxi.'},
  lab: {name:'Research survey vehicle',role:'Generic lab-designed sensing platform',length:5.5,width:2.28,height:2.4,eye:[.45,1.40,.45],radius:.397,note:'Original generic research vehicle with cameras, roof lidar, GNSS / inertial recording and rear road profilers. Hardware and mounting are illustrative; this is not a commercial sensor inventory.'},
  adas: {name:'Assisted-driving vehicle',role:'Generic driver-supervised assistance platform',length:4.9,width:2.0,height:1.9,eye:[.45,1.40,.45],radius:.397,note:'Original generic camera-and-radar assistance vehicle. A human driver remains responsible. The model does not imply that any dataset vehicle has autonomous-driving capability.'}
};
const extraTypes={audio:{label:'Audio',color:'#785396',output:'Sound'},sensing:{label:'Door sensing',color:'#2e7958',output:'Obstruction-detection function'}};
const waymoSources={overview:{title:'Waymo model evidence and limitations',url:'src/models/waymo-ipace/SOURCE-README.md'}};
export function createFleetModel(key) {
  let model, types, sources;
  if(key==='waymo'){model=waymo();types=waymoTypes;sources=waymoSources;}
  else if(key==='aurora'){model=aurora();types=auroraTypes;sources=auroraSources;}
  else if(key==='rivian'){model=rivian();types=rivianTypes;sources=rivianSources;}
  else if(key==='cybercab'){
    const c=buildCybercab(cyberSensors);
    model={...c,vehicle:c.car,body:c.shell,sensorRoot:c.hardware,bodyMaterials:new Set(),sensors:cyberSensors.map(s=>({...s,group:c.sensorMeshes.get(s.id),base:new THREE.Vector3(...s.pos),dir:new THREE.Vector3(...s.dir)}))};
    types={camera:{label:'Camera',color:'#b76425',output:'Images and visual context'},...extraTypes};sources=cyberSources;
  } else if(['lab','adas'].includes(key)){model=createResearchVehicle(key);types=researchTypes;sources={overview:{title:'Generic research vehicle notes',url:'src/models/research-vehicles/SOURCE-README.md'}};}
  else throw new Error(`Unknown fleet model: ${key}`);
  model.key=key;model.spec=FLEET[key];model.types=types;model.sources=sources;
  model.sensors.forEach(s=>{s.location ||= s.zone;s.description ||= types[s.type]?.description || s.role || s.subtype;s.note ||= s.placement;s.source ||= 'overview';s.group.traverse(o=>{if(o.isMesh)o.userData.sensorId=s.id;});});
  model.setGhost=value=>{
    if(model.setXray){model.setXray(value);return;}
    for(const m of model.bodyMaterials){m.transparent=value||m.userData.originalTransparent;m.opacity=value?.16:m.userData.originalOpacity;m.depthWrite=value?false:m.userData.originalDepthWrite;m.needsUpdate=true;}
  };
  model.setOptional=value=>{if(model.trailer)model.trailer.visible=value;model.sensors.filter(s=>s.optional).forEach(s=>s.group.visible=value);};
  model.setOptional(false);
  // Explicit wheel groups, with their original axle convention preserved.
  model.wheels=[];
  model.vehicle.traverse(o=>{if(o.isGroup && (/^Wheel(?:_|$)/i.test(o.name)||/^(Left|Right) (front|rear) wheel$/.test(o.name)))model.wheels.push(o);});
  return model;
}
export function disposeModel(model){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  model.vehicle.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (o.material?[].concat(o.material):[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
