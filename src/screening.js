/* v4.0 six-dimension screening. Inserted into atlas-app.js by upgrade-v13.mjs. */
const M3=window.ATLAS_RUBRIC;
const CRITERIA=M3.criteria.map((c,i)=>({...c,k:i}));
const PROFILES={labeled:{n:'Labeled-16'},unlabeled:{n:'Unlabeled-13'}};
let PROFILE='labeled', W=AtlasScore.defaults(PROFILE);
const defaultWeights=AtlasScore.defaults;
const ST_COL={Y:'#178249',N:'#c53936',X:'#b87300',U:'#d2d2d7'};
const ST_NAME={Y:'confirmed',N:'failed',X:'unresolved conflict',U:'unknown / unreported'};
const r2Crit=AtlasScore.criterion;
function r2Score(d){return AtlasScore.score(d,AtlasScore.cohort(d)===PROFILE?W:defaultWeights(AtlasScore.cohort(d)));}
function airScore(d){return r2Score(d).conf;}
function r2Grade(d){const rs=CRITERIA.map(c=>r2Crit(d,c.k)).filter(r=>!r.excluded);return rs.some(r=>r.x)?'X · conflict':rs.every(r=>r.res===r.m)?'Resolved':'Provisional';}
function eligibility(d){const g=d.r2?.g||'NNNN';return g.includes('F')?'Ineligible':g==='PPPP'?'Eligible':'Pending';}
function airPill(d){const s=r2Score(d);return '<span class="air-pill" title="'+esc(AtlasScore.cohort(d)==='labeled'?'Labeled-16':'Unlabeled-13')+' · lower–upper evidence interval; compare within cohort">'+s.conf.toFixed(0)+'–'+s.upper.toFixed(0)+'<small>'+ (AtlasScore.cohort(d)==='labeled'?'L16':'U13')+'</small></span>';}
function screeningBase(){return gfBase().filter(d=>AtlasScore.cohort(d)===PROFILE);}
function renderWeights(){
 document.getElementById('wProfile').innerHTML=Object.entries(PROFILES).map(([k,v])=>'<button data-p="'+k+'" class="'+(PROFILE===k?'on':'')+'" aria-pressed="'+(PROFILE===k)+'">'+v.n+'</button>').join('');
 document.querySelectorAll('#wProfile button').forEach(b=>b.onclick=()=>{PROFILE=b.dataset.p;W=defaultWeights(PROFILE);renderWeights();updateAir();});
 document.getElementById('wRows').innerHTML=CRITERIA.map(c=>'<div class="w-row"><div class="lab"><i style="background:'+c.c+'"></i>'+esc(c.key+' · '+c.n)+'</div><div class="w-val" id="wv'+c.k+'"></div><input type="range" min="0" max="40" step="1" value="'+W[c.k]+'" data-k="'+c.k+'" aria-label="Weight: '+esc(c.n)+'" '+(PROFILE==='unlabeled'&&c.key==='L'?'disabled':'')+'><div class="desc">'+esc(c.q||c.n)+' · '+c.checks.length+' checks</div></div>').join('');
 document.querySelectorAll('#wRows input').forEach(sl=>sl.oninput=()=>{W[+sl.dataset.k]=+sl.value;if(!W.some(v=>v>0)){W[+sl.dataset.k]=1;sl.value=1;}updateAir();});
 document.getElementById('mcLegend').innerHTML=CRITERIA.filter(c=>PROFILE!=='unlabeled'||c.key!=='L').map(c=>'<span><i style="background:'+c.c+'"></i>'+esc(c.key+' '+c.n)+'</span>').join('')+'<span>Translucent bar: unresolved evidence</span>';
}
function updateWeightLabels(){const sum=W.reduce((a,b)=>a+b,0)||1;CRITERIA.forEach(c=>document.getElementById('wv'+c.k).textContent=(100*W[c.k]/sum).toFixed(1)+'%');document.getElementById('wSum').textContent=PROFILES[PROFILE].n+' · '+screeningBase().length+' matching records · weights normalized to 100%. Reset restores the source profile.';}
function renderRank(){
 const sum=W.reduce((a,b)=>a+b,0)||1;
 const rows=screeningBase().map(d=>[d,r2Score(d)]).sort((a,b)=>b[1].conf-a[1].conf||a[0].n.localeCompare(b[0].n)).slice(0,20);
 document.getElementById('rankList').innerHTML=rows.map(([d,s],i)=>'<button class="rk" data-o="'+esc(d.id)+'" title="'+esc(d.n)+'"><span class="pos">'+(i+1)+'</span><span class="nm">'+esc(d.n)+'</span><span class="stack">'+CRITERIA.map(c=>'<i style="width:'+(W[c.k]*r2Crit(d,c.k).conf/5/sum*100)+'%;background:'+c.c+'"></i>').join('')+'<i class="up" style="width:'+(s.upper-s.conf)+'%"></i></span><span class="sc">'+s.conf.toFixed(1)+' <small>≤'+s.upper.toFixed(1)+'</small></span></button>').join('')||'<p>No records in this cohort match the filters. Clear filters or switch cohorts.</p>';
 document.querySelectorAll('#rankList [data-o]').forEach(b=>b.onclick=()=>openSheet(b.dataset.o));
}
function renderStates(){
 const base=screeningBase();
 document.getElementById('stateBox').innerHTML=CRITERIA.map(c=>{if(PROFILE==='unlabeled'&&c.key==='L')return '<div class="st-row">L · Label quality — excluded for this cohort</div>';const cnt={Y:0,N:0,U:0,X:0};base.forEach(d=>[...r2Crit(d,c.k).s].forEach(s=>cnt[s]++));const total=base.length*c.checks.length||1;return '<div class="st-row"><span class="nm">'+esc(c.n)+'</span><span class="bar">'+Object.keys(cnt).map(k=>'<i style="background:'+ST_COL[k]+';width:'+(100*cnt[k]/total)+'%" title="'+k+': '+cnt[k]+'"></i>').join('')+'</span><span class="pct">'+(100*cnt.Y/total).toFixed(0)+'% Y</span></div>';}).join('');
 const gates=M3.gates||[];
 document.getElementById('gateBox').innerHTML=gates.map((g,i)=>{const n={P:0,F:0,N:0,A:0};base.forEach(d=>{const detail=d.r2?.gates?.[g[0]]||'',st=(d.r2?.g||'UUUU')[i];n[/^N\/A\b/i.test(detail)?'A':st==='P'?'P':st==='F'?'F':'N']++;});return '<div class="gate-row"><b>'+esc(g[0])+'</b><span>'+esc(g[1])+'</span><span class="gc"><span class="gate-chip pass">'+n.P+' pass</span><span class="gate-chip fail">'+n.F+' fail</span><span class="gate-chip pend">'+n.N+' pending</span>'+(n.A?'<span class="gate-chip">'+n.A+' not applicable</span>':'')+'</span></div>';}).join('')+'<p class="hint">'+esc(M3.gate_note||'Not-assessed gates remain pending. Confirm source access, rights, task fit and data leakage before use.')+'</p>';
}
function renderScatter(){
 const base=screeningBase(),pts=base.filter(d=>d.yr),years=pts.map(d=>d.yr),lo=Math.min(2012,...years),hi=Math.max(2026,...years);const x=y=>48+(y-lo)/(hi-lo)*850,yy=v=>252-v*2.25;
 let svg='<svg viewBox="0 0 940 295" role="img" aria-label="Evidence scores by release year">';
 for(let v=0;v<=100;v+=25)svg+='<line x1="48" x2="918" y1="'+yy(v)+'" y2="'+yy(v)+'" stroke="#e2e4e8"/><text x="10" y="'+(yy(v)+4)+'" fill="#515560" font-size="12">'+v+'</text>';
 for(let y=lo;y<=hi;y+=2)svg+='<text x="'+x(y)+'" y="281" fill="#515560" font-size="12">'+y+'</text>';
 pts.forEach((d,i)=>{const s=r2Score(d);svg+='<a href="dataset.html?id='+encodeURIComponent(d.id)+'"><circle cx="'+(x(d.yr)+(i%5-2)*2)+'" cy="'+yy(s.conf)+'" r="4.5" fill="#0071e3" opacity=".7"><title>'+esc(d.n)+' · '+s.conf.toFixed(1)+'–'+s.upper.toFixed(1)+'</title></circle></a>';});
 document.getElementById('scatterBox').innerHTML=svg+'</svg>';document.getElementById('scNote').textContent=(base.length-pts.length)+' records without a release year omitted from this chart.';
}
function updateAir(){updateWeightLabels();renderRank();renderStates();renderScatter();renderTable(sortRows(filtered()));applyColVis();if(typeof GSTATE!=='undefined'&&typeof renderGallery==='function')renderGallery();}
function r2Block(d){return '<p>Open the full dataset page for check states and source evidence.</p>';}
