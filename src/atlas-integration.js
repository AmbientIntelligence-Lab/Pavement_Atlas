// The iframe and driving scene share a vehicle selection, without sharing scene objects.
const avFrame=document.getElementById('avFrame');
function syncViewerVehicle(key){if(avFrame?.contentWindow)avFrame.contentWindow.postMessage({type:'atlas-vehicle',vehicle:key},location.origin==='null'?'*':location.origin);}
window.addEventListener('message',event=>{
 if(event.source!==avFrame?.contentWindow)return;
 if(event.origin!==location.origin&&event.origin!=='null')return;
 if(event.data?.type==='atlas-viewer-height'&&Number.isFinite(event.data.height))avFrame.style.height=Math.min(3000,Math.max(700,event.data.height+4))+'px';
 if(event.data?.type==='atlas-vehicle'&&VEHICLES[event.data.vehicle]){
  const key=event.data.vehicle;if(SIM.veh!==key)setVehicle(key);
  [...document.querySelectorAll('#optVeh button')].forEach(b=>{const on=b.textContent===VEHICLES[key].name;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
 }
});
avFrame?.addEventListener('load',()=>syncViewerVehicle(SIM.veh));
const requestedVehicle=new URLSearchParams(location.search).get('vehicle');
if(VEHICLES[requestedVehicle]){setVehicle(requestedVehicle);document.querySelectorAll('#optVeh button').forEach(b=>b.classList.toggle('on',b.textContent===VEHICLES[requestedVehicle].name));}
document.querySelectorAll('[data-drive-action]').forEach(b=>b.addEventListener('click',()=>{
 const action=b.dataset.driveAction;
 if(action==='left'||action==='right'){SIM.auto=false;document.getElementById('sbAuto').classList.remove('on');SIM.targetX=Math.max(-5.6,Math.min(5.6,SIM.targetX+(action==='left'?-1.5:1.5)));}
 if(action==='faster')SIM.speed=Math.min(55,SIM.speed+3);
 if(action==='slower')SIM.speed=Math.max(0,SIM.speed-3);
}));
document.querySelectorAll('.segm button').forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('on')));
document.querySelectorAll('.segm').forEach(group=>group.addEventListener('click',()=>group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('on')))));
