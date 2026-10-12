import * as THREE from 'three';
export const surfaceMaterial=(color,roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
export function meshBox(parent,size,pos,material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function asphaltTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),data=ctx.createImageData(256,256);let seed=731;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<data.data.length;i+=4){const v=70+random()*25;data.data[i]=v*.94;data.data[i+1]=v*.98;data.data[i+2]=v;data.data[i+3]=255;}ctx.putImageData(data,0,0);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(25,25);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function setSceneLighting(scene,renderer,{urban=false}={}){
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene.background=new THREE.Color(urban?'#bdcedb':'#e5ebef');scene.fog=new THREE.Fog(urban?'#bdcedb':'#e5ebef',urban?95:35,urban?240:100);
 scene.add(new THREE.HemisphereLight('#eaf5ff','#777568',2.2));
 const sun=new THREE.DirectionalLight('#fff2df',3.1);sun.position.set(urban?-25:7,urban?45:16,urban?30:10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const extent=urban?65:15;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:.5,far:160});sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;scene.add(sun);scene.add(sun.target);return sun;
}
export function makeTree(parent,x,z,scale=1){
 const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);parent.add(group);
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.21,2.4,8),surfaceMaterial('#6d5e49'));trunk.position.y=1.2;trunk.castShadow=true;group.add(trunk);
 const leaves=surfaceMaterial('#596d49');for(const [dx,y,dz,r]of[[0,3.1,0,1.25],[-.6,2.8,.1,.85],[.5,3.25,.5,.9],[.3,3.6,-.4,.75]]){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),leaves);m.position.set(dx,y,dz);m.castShadow=true;group.add(m);}return group;
}
export function makeTestPad(scene){
 const road=surfaceMaterial('#aab1b5');road.map=asphaltTexture();road.map.repeat.set(12,12);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),surfaceMaterial('#c5cebc'));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
 meshBox(scene,[44,.10,27],[0,-.07,0],road);const white=surfaceMaterial('#e1e1d8'),curb=surfaceMaterial('#c4c7c4');
 for(const z of [-13.7,13.7]){meshBox(scene,[45,.2,.35],[0,0,z],curb);for(let x=-20;x<22;x+=5)meshBox(scene,[2.5,.012,.09],[x,.001,z*.68],white);}
 for(const x of [-21,21])meshBox(scene,[.10,.012,26],[x,0,0],white);
 const orange=surfaceMaterial('#d9773a'),dark=surfaceMaterial('#242c31');
 for(const [x,z]of[[-7,5],[-7,-5],[7,5],[7,-5]]){meshBox(scene,[.36,.035,.36],[x,.018,z],dark);const cone=new THREE.Mesh(new THREE.ConeGeometry(.13,.43,18),orange);cone.position.set(x,.25,z);cone.castShadow=true;scene.add(cone);const band=new THREE.Mesh(new THREE.CylinderGeometry(.068,.085,.07,18),white);band.position.set(x,.28,z);scene.add(band);}
 for(const x of [-28,-18,-7,5,18,29])makeTree(scene,x,-21,1.1);
 const metal=surfaceMaterial('#78878b',.6,.5);for(let x=-35;x<40;x+=5)meshBox(scene,[.06,1.7,.06],[x,.85,-17],metal);for(const y of [.45,1.5])meshBox(scene,[75,.05,.05],[0,y,-17],metal);
}
