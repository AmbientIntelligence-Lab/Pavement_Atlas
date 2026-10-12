const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let datasetPromise;
export async function showVehicleDatasets(host,key){
 if(!host)return;host.dataset.vehicle=key;host.innerHTML='<p class="dataset-status" role="status">Loading related datasets…</p>';
 try{
  datasetPromise ||= fetch('data/vehicle-datasets.json').then(r=>{if(!r.ok)throw new Error('Dataset list unavailable');return r.json();}).catch(e=>{datasetPromise=null;throw e;});
  const data=await datasetPromise;if(host.dataset.vehicle!==key)return;const entry=data.vehicles?.find(v=>v.id===key);
  if(!entry){host.innerHTML='<p>No vehicle-specific association is recorded yet. Browse the Atlas catalogue for alternatives.</p><a href="index.html#register" target="_top">Browse all datasets</a>';return;}
  const links=(entry.datasets||[]).map(d=>`<article class="dataset-row"><div><h4><a href="${escapeHTML(d.catalogUrl||`dataset.html?id=${d.id}`)}" target="_top">${escapeHTML(d.name)}</a></h4><span class="dataset-relationship">${escapeHTML(d.relationship)}</span></div><p>${escapeHTML(d.summary)}</p>${d.limitations?`<p class="dataset-limitation">${escapeHTML(d.limitations)}</p>`:''}<p class="dataset-access"><strong>Access:</strong> ${escapeHTML(d.access||'See source')}<br><strong>Terms:</strong> ${escapeHTML(d.terms||'Verify at source')}</p><a class="dataset-source" href="${escapeHTML(d.url)}" target="_blank" rel="noopener">Dataset source <span aria-hidden="true">↗</span></a></article>`).join('');
  host.innerHTML=`<p class="association-note">${escapeHTML(entry.associationNote)}</p>${links||'<p>No direct public dataset is recorded for this vehicle in the supplied review.</p>'}`;
 }catch{if(host.dataset.vehicle===key)host.innerHTML='<p role="status">The related dataset list could not be loaded. Open the site through its web address, or browse the main catalogue.</p><a href="index.html#register" target="_top">Browse all datasets</a>';}
}
