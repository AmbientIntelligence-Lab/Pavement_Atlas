// Synchronize only messages from the two local simulation frames.
const frames=[document.getElementById('avFrame'),document.getElementById('driveFrame')];
const vehicles=new Set(['waymo','cybercab','aurora','rivian','research','adas','lab']);
window.addEventListener('message',e=>{
 const sender=frames.find(f=>f?.contentWindow===e.source);if(!sender||e.origin!==location.origin)return;
 if(['atlas-viewer-height','atlas-driving-height'].includes(e.data?.type)&&Number.isFinite(e.data.height))sender.style.height=Math.min(3600,Math.max(680,e.data.height+8))+'px';
 if(e.data?.type==='atlas-vehicle'&&vehicles.has(e.data.vehicle))frames.filter(f=>f!==sender).forEach(f=>f.contentWindow?.postMessage(e.data,location.origin));
});
// Semantic access for dynamically rebuilt dataset tiles.
const enhance=()=>document.querySelectorAll('.clickable,.task-row,.geo-row,.ds-name,.dcard').forEach(el=>{if(el.dataset.keyboard)return;el.dataset.keyboard='true';el.tabIndex=0;el.setAttribute('role','button');el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});});
function initializeKeyboardAccess(){
 const main=document.querySelector('main');
 if(main)new MutationObserver(enhance).observe(main,{childList:true,subtree:true});
 enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeKeyboardAccess,{once:true});
else initializeKeyboardAccess();
