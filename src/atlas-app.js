"use strict";

const DATA = window.ATLAS_DATA;
const POINTS = window.ATLAS_POINTS;
const WORLD = window.ATLAS_WORLD;            /* real country outlines (Natural Earth via world.geo.json, equirectangular, precomputed) */
const SAMPLES = window.ATLAS_SAMPLES;
const DISTIMG = window.ATLAS_DISTIMG;        /* openly licensed reference photos (Wikimedia Commons) */        /* per-dataset sample thumbnails crawled from each dataset's source link */
const DISTKEYS = [["Longitudinal crack","longitudinal"],["Transverse crack","transverse|lateral crack"],["Alligator / fatigue crack","alligator|fatigue|net crack|map crack|block crack"],["Pothole","pothole|pit\\b"],["Rutting / deformation","rutting|depression|deformation|upheaval|shoving"],["Patch / sealed crack","patch|sealed|repair|crack pouring"],["Raveling / surface erosion","ravel|erosion|weathering|fretting|spalling"],["Manhole / road furniture","manhole|utility cover|speed (bump|breaker)|expansion joint"]];
const PLATS = [...new Set(DATA.flatMap(d=>d.plats))].sort();
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- inline icon set (SF-symbol style) ---------- */
const IC = {
 car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15V12l2-5h12l2 5v3"/><path d="M3 15h18v3h-2M3 18h2m2 0h10"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M7 12h10"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18h2"/></svg>',
 drone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="6" r="2.4"/><circle cx="19" cy="6" r="2.4"/><path d="M7 7.5 10 10h4l3-2.5M12 10v4"/><rect x="9" y="14" width="6" height="4" rx="1.6"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.6"/></svg>',
 street:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
 depth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/></svg>',
 web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2.4"/></svg>',
 pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
 box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16" opacity=".4"/></svg>',
 scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8m8 0h2.5A1.5 1.5 0 0 1 20 5.5V8m0 8v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M7 12h10"/></svg>',
 tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7l9 9-7 7-9-9V4Z"/><circle cx="8.5" cy="8.5" r="1.4"/></svg>',
 wand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m5 19 9-9m2.5-2.5L19 5M14 5l1 1M19 10l-1 1M9 5 8 6M5 9 6 8" /></svg>',
 gauge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14 16 9"/><path d="M3 18h18"/></svg>',
 chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/></svg>',
 layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5" opacity=".55"/><path d="m3 16 9 5 9-5" opacity=".3"/></svg>',
 flame:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 9 12 8 12 3Z"/><path d="M12 21a3 3 0 0 0 3-3c0-2-3-4-3-4s-3 2-3 4a3 3 0 0 0 3 3Z" opacity=".5"/></svg>',
 wave:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0"/></svg>',
 film:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14M3 10h5M3 14h5M16 10h5M16 14h5"/></svg>',
 sat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 9 6 6M7.5 13.5 4 17l3 3 3.5-3.5M13.5 7.5 17 4l3 3-3.5 3.5"/><circle cx="12" cy="12" r="1.6"/></svg>',
};

/* ---------- stylized "photo" tiles ---------- */
let uid=0;
function asphalt(children, extra){
 const id='g'+(uid++);
 return '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">'+
  '<defs><radialGradient id="'+id+'" cx="35%" cy="25%" r="1.1"><stop offset="0" stop-color="#6f7075"/><stop offset=".55" stop-color="#57585c"/><stop offset="1" stop-color="#3f4043"/></radialGradient>'+
  '<filter id="n'+id+'"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.16 0"/></filter></defs>'+
  '<rect width="300" height="150" fill="url(#'+id+')"/>'+
  '<rect width="300" height="150" filter="url(#n'+id+')"/>'+
  (extra||'')+(children||'')+'</svg>';
}
const CRACK='stroke="#26262a" fill="none" stroke-linecap="round"';
const CRACK_HL='stroke="rgba(255,255,255,.10)" fill="none" stroke-linecap="round"';
function jag(x0,y0,x1,y1,seg,amp,seed){
 let p='M'+x0+','+y0; const dx=(x1-x0)/seg, dy=(y1-y0)/seg; let s=seed||7;
 for(let i=1;i<=seg;i++){ s=(s*16807)%2147483647; const off=((s/2147483647)-0.5)*2*amp;
  const nx=x0+dx*i+(dy?off:0), ny=y0+dy*i+(dx?off:0); p+=' L'+nx.toFixed(1)+','+ny.toFixed(1);}
 return p;
}
const TILE = {
 long: asphalt('<path d="'+jag(150,-5,158,155,12,9,3)+'" '+CRACK+' stroke-width="3.4"/><path d="'+jag(150,-5,158,155,12,9,3)+'" '+CRACK_HL+' stroke-width="6"/>'),
 trans: asphalt('<path d="'+jag(-5,80,305,72,14,8,5)+'" '+CRACK+' stroke-width="3.4"/><path d="'+jag(-5,80,305,72,14,8,5)+'" '+CRACK_HL+' stroke-width="6"/>'),
 gator: asphalt(['<path d="'+jag(40,-5,70,155,9,12,2)+'" '+CRACK+' stroke-width="2.6"/>',
   '<path d="'+jag(120,-5,150,155,9,12,4)+'" '+CRACK+' stroke-width="2.6"/>',
   '<path d="'+jag(200,-5,235,155,9,12,6)+'" '+CRACK+' stroke-width="2.6"/>',
   '<path d="'+jag(-5,40,305,52,12,9,8)+'" '+CRACK+' stroke-width="2.4"/>',
   '<path d="'+jag(-5,100,305,110,12,9,9)+'" '+CRACK+' stroke-width="2.4"/>'].join('')),
 pothole: asphalt('<ellipse cx="150" cy="88" rx="64" ry="34" fill="#1b1b1e"/><ellipse cx="150" cy="84" rx="64" ry="32" fill="#232327"/><path d="M88 84c10-9 25-15 62-15s54 6 62 15" stroke="#141416" stroke-width="5" fill="none"/><ellipse cx="132" cy="78" rx="18" ry="7" fill="#3a3a40" opacity=".8"/>'),
 rut: asphalt('<rect x="60" y="0" width="42" height="150" fill="#333336" opacity=".85"/><rect x="196" y="0" width="42" height="150" fill="#333336" opacity=".85"/><rect x="70" y="0" width="8" height="150" fill="#8b8c92" opacity=".35"/><rect x="206" y="0" width="8" height="150" fill="#8b8c92" opacity=".35"/>'),
 patch: asphalt('<rect x="80" y="30" width="140" height="90" rx="6" fill="#242427"/><rect x="80" y="30" width="140" height="90" rx="6" stroke="#141416" stroke-width="4" fill="none"/><path d="'+jag(30,140,110,20,8,7,4)+'" stroke="#161619" stroke-width="6" fill="none" stroke-linecap="round"/>'),
 ravel: asphalt(Array.from({length:70},(_,i)=>{const s=(i*2654435761)%1000; const x=(s%300), y=((s*7)%150), r=1+((s*13)%23)/10;return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#2c2c30" opacity=".8"/>';}).join('')+'<ellipse cx="180" cy="70" rx="70" ry="40" fill="#4a4a4e" opacity=".55"/>'),
 manhole: asphalt('<circle cx="150" cy="78" r="44" fill="#26262a"/><circle cx="150" cy="78" r="44" stroke="#141416" stroke-width="5" fill="none"/><circle cx="150" cy="78" r="33" stroke="#3d3d42" stroke-width="2.5" fill="none"/><path d="M128 60l44 36M128 96l44-36M150 34v88M106 78h88" stroke="#3d3d42" stroke-width="2.5"/>'),
};
const MODT = {
 rgb: asphalt('<path d="'+jag(60,-5,110,155,10,10,3)+'" '+CRACK+' stroke-width="3"/><ellipse cx="220" cy="95" rx="34" ry="17" fill="#1e1e21"/>','<rect x="8" y="8" width="52" height="18" rx="9" fill="rgba(255,255,255,.85)"/><text x="34" y="21" text-anchor="middle" font-size="10" font-weight="700" fill="#1d1d1f">RGB</text>'),
 video: '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="300" height="150" fill="#1c1c1e"/>'+
   [0,1,2].map(i=>'<g transform="translate('+(18+i*92)+',28)"><rect width="80" height="94" rx="6" fill="#57585c"/><path d="'+jag(30+i*6,4,44+i*6,90,8,7,i+3)+'" stroke="#212124" stroke-width="2.6" fill="none"/><rect width="80" height="94" rx="6" fill="none" stroke="#0a84ff" stroke-opacity="'+(i===1?1:.25)+'" stroke-width="2.5"/></g>').join('')+
   '<circle cx="150" cy="136" r="4" fill="#0a84ff"/><circle cx="132" cy="136" r="3" fill="#3a3a3c"/><circle cx="168" cy="136" r="3" fill="#3a3a3c"/></svg>',
 stereo: '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="150" height="150" fill="#57585c"/><path d="'+jag(60,-5,86,155,10,9,3)+'" stroke="#26262a" stroke-width="3" fill="none"/>'+
   '<rect x="150" width="150" height="150" fill="#0b1d3a"/>'+[0,1,2,3,4,5].map(i=>'<path d="'+jag(150,20+i*22,300,26+i*22,8,5,i+2)+'" stroke="hsl('+(220-i*38)+',85%,55%)" stroke-width="9" fill="none" opacity=".85"/>').join('')+
   '<path d="'+jag(210,-5,236,155,10,9,3)+'" stroke="#ff453a" stroke-width="4" fill="none"/><rect x="146" width="8" height="150" fill="#f5f5f7"/></svg>',
 lidar: '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="300" height="150" fill="#0b0f1a"/>'+
   Array.from({length:220},(_,i)=>{const s=(i*48271)%1000;const x=s%300, y=30+((s*7)%110); const d=Math.abs(x-150)<40&&y>70? 1:0; const c=d?'#ff9f0a':(y<60?'#0a84ff':'#30d158');return '<circle cx="'+x+'" cy="'+(y+d*8)+'" r="1.4" fill="'+c+'" opacity=".9"/>';}).join('')+
   '<path d="M0 70 L300 60" stroke="rgba(255,255,255,.12)"/><path d="M0 130 L300 124" stroke="rgba(255,255,255,.12)"/></svg>',
 ir: '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="irg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d1b69"/><stop offset=".5" stop-color="#b5179e"/><stop offset="1" stop-color="#ff9f0a"/></linearGradient></defs><rect width="300" height="150" fill="url(#irg)" opacity=".9"/><path d="'+jag(70,-5,120,155,10,10,3)+'" stroke="#ffe066" stroke-width="7" fill="none" opacity=".95"/><path d="'+jag(70,-5,120,155,10,10,3)+'" stroke="#fff" stroke-width="2.5" fill="none"/><rect x="8" y="8" width="66" height="18" rx="9" fill="rgba(0,0,0,.45)"/><text x="41" y="21" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">THERMAL</text></svg>',
 gpr: '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="300" height="150" fill="#101418"/>'+
   Array.from({length:14},(_,i)=>'<path d="M0 '+(12+i*10)+' H300" stroke="#1f2933" stroke-width="6" opacity=".8"/>').join('')+
   [90,180,240].map((cx,i)=>'<path d="M'+(cx-46)+' '+(96+i*8)+' Q'+cx+' '+(34+i*8)+' '+(cx+46)+' '+(96+i*8)+'" stroke="#30d158" stroke-width="3" fill="none"/><path d="M'+(cx-38)+' '+(104+i*8)+' Q'+cx+' '+(46+i*8)+' '+(cx+38)+' '+(104+i*8)+'" stroke="#0a84ff" stroke-width="2" fill="none" opacity=".8"/>').join('')+'</svg>',
 gps: '<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="300" height="150" fill="#eaf2ec"/><path d="M-10 110 C60 100 80 40 150 46 S250 96 310 60" stroke="#c9d6cc" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M-10 110 C60 100 80 40 150 46 S250 96 310 60" stroke="#fff" stroke-width="2.5" stroke-dasharray="8 8" fill="none"/><path d="M40 104 C90 92 100 52 150 46" stroke="#0a84ff" stroke-width="4" fill="none" stroke-linecap="round"/>'+
   '<g transform="translate(150,46)"><circle r="9" fill="#0a84ff"/><circle r="4" fill="#fff"/><circle r="15" fill="none" stroke="#0a84ff" opacity=".4"/></g><g transform="translate(40,104)"><circle r="6" fill="#30d158"/></g></svg>',
};
function annTile(kind){
 const base='<path d="'+jag(120,10,170,140,10,12,3)+'" '+CRACK+' stroke-width="3.2"/>';
 if(kind==='cl') return asphalt(base,'<rect x="86" y="58" width="128" height="30" rx="15" fill="rgba(255,255,255,.92)"/><text x="150" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="#1d1d1f">crack ✓ 0.97</text>');
 if(kind==='bb') return asphalt(base+'<rect x="100" y="6" width="92" height="138" fill="rgba(10,132,255,.12)" stroke="#0a84ff" stroke-width="2.5"/><rect x="100" y="-6" width="60" height="16" rx="4" fill="#0a84ff"/><text x="130" y="6" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff">crack .93</text>'+
   ['100,6','192,6','100,144','192,144'].map(p=>'<circle cx="'+p.split(',')[0]+'" cy="'+p.split(',')[1]+'" r="3.6" fill="#fff" stroke="#0a84ff" stroke-width="2"/>').join(''));
 if(kind==='ob') return asphalt(base+'<g transform="rotate(-18 150 75)"><rect x="112" y="14" width="76" height="122" fill="rgba(191,90,242,.13)" stroke="#bf5af2" stroke-width="2.5"/></g>');
 if(kind==='pg') return asphalt(base+'<polygon points="112,16 148,32 176,70 170,120 138,138 116,96 124,52" fill="rgba(48,209,88,.15)" stroke="#30d158" stroke-width="2.5"/>'+
   '112,16 148,32 176,70 170,120 138,138 116,96 124,52'.split(' ').map(p=>'<circle cx="'+p.split(',')[0]+'" cy="'+p.split(',')[1]+'" r="3.4" fill="#fff" stroke="#30d158" stroke-width="2"/>').join(''));
 if(kind==='sm') return asphalt(base+'<path d="'+jag(120,10,170,140,10,12,3)+'" stroke="rgba(255,69,58,.65)" stroke-width="13" fill="none" stroke-linecap="round"/>'+base);
 if(kind==='sv') return asphalt(base,'<g font-size="10.5" font-weight="700"><rect x="10" y="10" width="58" height="20" rx="10" fill="#30d158"/><text x="39" y="24" text-anchor="middle" fill="#fff">LOW</text><rect x="74" y="10" width="58" height="20" rx="10" fill="#ff9f0a"/><text x="103" y="24" text-anchor="middle" fill="#fff">MED</text><rect x="138" y="10" width="58" height="20" rx="10" fill="#ff453a"/><text x="167" y="24" text-anchor="middle" fill="#fff">HIGH</text></g><rect x="104" y="40" width="86" height="104" fill="none" stroke="#ff453a" stroke-width="2.5"/>');
 return asphalt(base);
}

/* ---------- state ---------- */
const state={q:"",uniq:false,multi:false,conf:false,sortK:"id",sortAsc:true};
const distRe = {}; DISTKEYS.forEach(([lab,pat])=>distRe[lab]=new RegExp(pat,'i'));
function positiveDistressText(d){
 // A limitation such as "no crack/pothole labels" must not become a label.
 // Keep independently stated positive clauses, including "Pothole; No pothole".
 return String(d.dst||d.labels||'').replace(/\b(?:no|not|without)\b[^;|.]*/gi,' ').replace(/\bnon[- ](?:cracks?|potholes?|distress)\b[^;|.]*/gi,' ');
}
function matchesDistress(d,label){return distRe[label].test(positiveDistressText(d));}

/* ---------- v8 GLOBAL FILTERS: one state, applied to every section ---------- */
const GF = {plats:new Set(), srcs:new Set(), view:new Set(), vtd:new Set(), vff:new Set(), ctrys:new Set(), tasks:new Set(), mods:new Set(), ann:new Set(),
            dist:new Set(), acc:new Set(), lin:new Set(), lic:new Set(), vp:new Set(),
            imgMin:0, imgMax:6, imgNR:true, yrMin:2012, yrMax:2026, yrNR:true};
const IMG_STEPS = ['1','10','100','1k','10k','100k','1M'];
function imgNum(d){
 const text=String(d.img||'').trim();if(!text||text.includes('|'))return null;
 let m=/^([\d,]+)$/.exec(text);if(m)return Number(m[1].replaceAll(',',''))||null;
 m=/([\d,.]+)\s*(k|million|m)?\s+(?:camera images|visual images|images|frames|photographs)\b/i.exec(text);
 if(!m)return null;const mult=/million|m/i.test(m[2]||'')?1e6:(/k/i.test(m[2]||'')?1e3:1);return Number(m[1].replaceAll(',',''))*mult||null;
}
function licFam(d){
 const l=(d.lic||'').toLowerCase();if(!l||/^(nr|na|unk|not reported)$/.test(l.trim()))return 'Not reported';
 if(l.includes('|'))return 'Mixed / review required';
 if(/\bcc0\b|public domain/.test(l))return 'CC0 / Public domain';
 const cc=/\bcc[- ]?by\b|creative commons attribution/.test(l);
 if(cc){
  const nc=/by[- ]?nc|non[- ]?commercial/.test(l),nd=/(?:by|nc)[- ]?nd|no[- ]?derivatives/.test(l),sa=/(?:by|nc)[- ]?sa|share[- ]?alike/.test(l);
  if(nd&&sa)return 'Mixed / review required';
  if(nc&&nd)return 'CC BY-NC-ND';if(nc&&sa)return 'CC BY-NC-SA';
  if(nc)return 'CC BY-NC';if(nd)return 'CC BY-ND';if(sa)return 'CC BY-SA';return 'CC BY';
 }
 if(/\bmit\b/.test(l))return 'MIT';if(/\bapache\b/.test(l))return 'Apache';
 if(/noncommercial|non-commercial|educational|research only/.test(l))return 'Custom restricted terms';return 'Other';
}
function annKeys(d){
 const k=[]; if(d.ann.cl)k.push('cl'); if(d.ann.bb)k.push('bb'); if(d.ann.sm)k.push('sm');
 if(d.ann.pg)k.push('pg'); if(d.ann.sv)k.push('sv'); if(/oriented/i.test(d.annT))k.push('ob'); return k;
}
const GF_DIMS = {
 plats:{label:'Platform',        vals:()=>PLATS,                                   get:d=>d.plats},
 srcs: {label:'Image source',    vals:()=>[...new Set(DATA.flatMap(d=>d.srcs))].sort(),                       get:d=>d.srcs},
 view: {label:'Camera viewpoint',vals:()=>[...new Set(DATA.map(d=>d.view||'Not reported'))].sort(),                                get:d=>[d.view||'Not reported']},
 vtd:  {label:'Top-down imagery',vals:()=>['Yes','Partial','No','Unknown'],          get:d=>[d.vtd||'Unknown']},
 vff:  {label:'Forward-facing imagery',vals:()=>['Yes','Partial','No','Unknown'],    get:d=>[d.vff||'Unknown']},
 ctrys:{label:'Country',         vals:()=>[...new Set(DATA.flatMap(d=>d.ctrys))].sort(),                   get:d=>d.ctrys},
 tasks:{label:'AI task',         vals:()=>[...new Set(DATA.flatMap(d=>d.tasks))].sort(),                      get:d=>d.tasks},
 mods: {label:'Modality',        vals:()=>[...new Set(DATA.flatMap(d=>d.mods))].sort(),                       get:d=>d.mods},
 ann:  {label:'Annotation',      vals:()=>ANNS.map(a=>a[1]), name:k=>(ANNS.find(a=>a[1]===k)||[k])[0], get:d=>annKeys(d)},
 dist: {label:'Distress',        vals:()=>DISTKEYS.map(x=>x[0]),                   get:d=>DISTKEYS.filter(([l])=>matchesDistress(d,l)).map(x=>x[0])},
 acc:  {label:'Access',          vals:()=>[...new Set(DATA.map(d=>d.acc||'Not reported'))].sort(), get:d=>[d.acc||'Not reported']},
 lin:  {label:'Lineage',         vals:()=>[...new Set(DATA.map(d=>d.odc||'Not reported'))].sort(),       get:d=>[d.odc||'Not reported']},
 lic:  {label:'License family',  vals:()=>['CC BY','CC BY-SA','CC BY-ND','CC BY-NC','CC BY-NC-SA','CC BY-NC-ND','CC0 / Public domain','MIT','Apache','Custom restricted terms','Mixed / review required','Other','Not reported'], get:d=>[licFam(d)]},
 vp:   {label:'Verification',    vals:()=>['Low','Medium','High'],                 get:d=>[d.vp||'—']},
};
const GF_ORDER = ['ctrys','srcs','view','vtd','vff','plats','tasks','mods','ann','dist','acc','lic','lin','vp'];
function gfName(dim,v){ return GF_DIMS[dim].name? GF_DIMS[dim].name(v) : v; }
function gfMatch(d,skip){
 if(!GF.imgNR&&imgNum(d)===null)return false;if(!GF.yrNR&&!d.yr)return false;
 for(const dim of GF_ORDER){
  if(dim===skip) continue;   // faceted counts: ignore the group being listed
  const s=GF[dim]; if(!s.size) continue;
  const vals=GF_DIMS[dim].get(d);
  if(!vals.some(v=>s.has(v))) return false;
 }
 if(GF.imgMin>0||GF.imgMax<6){
  const n=imgNum(d);
  if(n==null){ if(!GF.imgNR) return false; }
  else { const lg=Math.log10(n); if(lg<GF.imgMin-1e-9||(GF.imgMax<6&&lg>GF.imgMax+1e-9)) return false; }
 }
 if(GF.yrMin>2012||GF.yrMax<2026){
  if(!d.yr){ if(!GF.yrNR) return false; }
  else if(d.yr<GF.yrMin||d.yr>GF.yrMax) return false;
 }
 return true;
}
function gfBase(arr){ return (arr||DATA).filter(d=>gfMatch(d)); }
function gfBaseExcept(dim){ return DATA.filter(d=>gfMatch(d,dim)); }   // everything the OTHER groups allow
function gfActiveItems(){
 const items=[];
 GF_ORDER.forEach(dim=>GF[dim].forEach(v=>items.push({dim,v,label:GF_DIMS[dim].label+': '+gfName(dim,v)})));
 if(GF.imgMin>0||GF.imgMax<6||!GF.imgNR) items.push({dim:'img',label:'Image/frame count: '+fmtImg(GF.imgMin)+' – '+(GF.imgMax===6?'No upper limit':fmtImg(GF.imgMax))+(GF.imgNR?' (+NR)':'')});
 if(GF.yrMin>2012||GF.yrMax<2026||!GF.yrNR) items.push({dim:'yr',label:'Year: '+GF.yrMin+' – '+GF.yrMax+(GF.yrNR?' (+NR)':'')});
 return items;
}
function fmtImg(lg){ const n=Math.pow(10,lg); return n>=1e6?(n/1e6).toFixed(n%1e6?1:0)+'M':n>=1e3?(n/1e3).toFixed(n%1e3?1:0)+'k':Math.round(n)+''; }
function gfToggle(dim,v){ const s=GF[dim]; if(s.has(v)) s.delete(v); else s.add(v); gfChanged(); }
function gfClearDim(dim){
 if(dim==='img'){GF.imgMin=0;GF.imgMax=6;GF.imgNR=true;}
 else if(dim==='yr'){GF.yrMin=2012;GF.yrMax=2026;GF.yrNR=true;}
 else GF[dim].clear();
 gfChanged();
}
function gfClearAll(){ GF_ORDER.forEach(d=>GF[d].clear()); GF.imgMin=0;GF.imgMax=6;GF.imgNR=true;GF.yrMin=2012;GF.yrMax=2026;GF.yrNR=true; gfChanged(); }
function gfChanged(){ renderAll(); renderSidebar(); }
function renderGFChips(){
 const items=gfActiveItems();
 const n=gfBase().length;
 document.querySelectorAll('.gf-chips').forEach(box=>{
  if(!items.length){ box.innerHTML='<span class="gf-none">No global filters — showing all '+DATA.length+' datasets. Open <b>Filters</b> to narrow every section at once.</span>'; return; }
  box.innerHTML='<span class="gf-lead">Global filters · '+n+' of '+DATA.length+' datasets · applied to every section</span>'+
   items.map((it,i)=>'<span class="chip gfc" data-i="'+i+'">'+esc(it.label)+'<button aria-label="Remove">✕</button></span>').join('')+
   '<button class="gf-clear" data-clear>Clear all</button>';
  box.querySelectorAll('.gfc button').forEach(b=>b.addEventListener('click',()=>{
   const it=items[+b.parentElement.dataset.i];
   if(it.dim==='img'||it.dim==='yr') gfClearDim(it.dim); else gfToggle(it.dim,it.v);
  }));
  box.querySelector('[data-clear]').addEventListener('click',gfClearAll);
 });
 const fab=document.getElementById('gfFab');
 fab.classList.toggle('active',items.length>0);
 document.getElementById('gfFabN').textContent=items.length?items.length:'';
}
/* dual-range slider component (shared by sidebar + register bar) */
function dualRange(host, kind){
 const isImg=kind==='img';
 const min=isImg?0:2012, max=isImg?6:2026, step=isImg?0.25:1;
 const lo=isImg?GF.imgMin:GF.yrMin, hi=isImg?GF.imgMax:GF.yrMax, nr=isImg?GF.imgNR:GF.yrNR;
 const fmt=v=>isImg?fmtImg(v):String(v);const fmtUpper=v=>isImg&&v===6?'No upper limit':fmt(v);
 host.innerHTML='<div class="dr"><div class="dr-track"><i class="dr-fill"></i></div>'+
  '<input type="range" class="dr-lo" min="'+min+'" max="'+max+'" step="'+step+'" value="'+lo+'">'+
  '<input type="range" class="dr-hi" min="'+min+'" max="'+max+'" step="'+step+'" value="'+hi+'"></div>'+
  '<div class="dr-lab"><span class="dr-lv">'+fmt(lo)+'</span><label class="dr-nr"><input type="checkbox" '+(nr?'checked':'')+'> '+(isImg?'include unknown counts':'include not-reported')+'</label><span class="dr-hv">'+fmtUpper(hi)+'</span></div>'+(isImg?'<p class="hint">Unknown counts include unreported values, ambiguous totals and non-image sample units.</p>':'');
 const a=host.querySelector('.dr-lo'), b=host.querySelector('.dr-hi'), fill=host.querySelector('.dr-fill');
 const paint=()=>{const l=+a.value,h=+b.value;fill.style.left=((l-min)/(max-min)*100)+'%';fill.style.right=(100-(h-min)/(max-min)*100)+'%';
  host.querySelector('.dr-lv').textContent=fmt(l);host.querySelector('.dr-hv').textContent=fmtUpper(h);};
 paint();
 const commit=()=>{let l=+a.value,h=+b.value; if(l>h){[l,h]=[h,l];a.value=l;b.value=h;}
  if(isImg){GF.imgMin=l;GF.imgMax=h;}else{GF.yrMin=l;GF.yrMax=h;} gfChanged();};
 a.addEventListener('input',paint); b.addEventListener('input',paint);
 a.addEventListener('change',commit); b.addEventListener('change',commit);
 host.querySelector('.dr-nr input').addEventListener('change',e=>{ if(isImg)GF.imgNR=e.target.checked; else GF.yrNR=e.target.checked; gfChanged(); });
}
/* sidebar */
function renderSidebar(){
 const base=gfBase();
 document.getElementById('gfCount').innerHTML='<b>'+base.length+'</b> of '+DATA.length+' datasets match';
 const groups=document.getElementById('gfGroups');
 const open=new Set([...groups.querySelectorAll('details[open]')].map(x=>x.dataset.dim));
 groups.innerHTML=GF_ORDER.map(dim=>{
  const D=GF_DIMS[dim], vals=D.vals();
  const counts={}; vals.forEach(v=>counts[v]=0);
  gfBaseExcept(dim).forEach(d=>D.get(d).forEach(v=>{ if(v in counts) counts[v]++; }));
  const active=GF[dim].size;
  const isOpen=open.size?open.has(dim):['ctrys','srcs','tasks'].includes(dim);
  return '<details class="gf-group" data-dim="'+dim+'" '+(isOpen?'open':'')+'><summary>'+D.label+
   (active?'<span class="gf-badge">'+active+'</span>':'')+'<span class="gf-caret">›</span></summary>'+
   '<div class="gf-vals">'+vals.filter(v=>counts[v]>0||GF[dim].has(v)).map(v=>
    '<button class="gf-val'+(GF[dim].has(v)?' on':'')+'" data-dim="'+dim+'" data-v="'+esc(v)+'"><span class="gf-check"></span>'+esc(gfName(dim,v))+'<span class="gf-n">'+counts[v]+'</span></button>').join('')+
   '</div></details>';
 }).join('')+
 '<details class="gf-group" data-dim="img" '+(open.has('img')||GF.imgMin>0||GF.imgMax<6?'open':'')+'><summary>Image/frame count (log scale)<span class="gf-caret">›</span></summary><div class="gf-vals" id="gfImgRange"></div></details>'+
 '<details class="gf-group" data-dim="yr" '+(open.has('yr')||GF.yrMin>2012||GF.yrMax<2026?'open':'')+'><summary>Release year<span class="gf-caret">›</span></summary><div class="gf-vals" id="gfYrRange"></div></details>';
 groups.querySelectorAll('.gf-val').forEach(b=>b.addEventListener('click',()=>gfToggle(b.dataset.dim,b.dataset.v)));
 dualRange(document.getElementById('gfImgRange'),'img');
 dualRange(document.getElementById('gfYrRange'),'yr');
 // register-bar mirrors
 const rb=document.getElementById('regImgRange'); if(rb) dualRange(rb,'img');
 document.querySelectorAll('.ms-btn[data-dim]').forEach(b=>{
  const n=GF[b.dataset.dim].size; b.classList.toggle('on',n>0);
  b.querySelector('.ms-n').textContent=n?n:'';
 });
}
function openSidebar(focusDim){
 renderSidebar();const target=focusDim?document.querySelector('.gf-group[data-dim="'+focusDim+'"]'):document.getElementById('filters');
 if(target){if(focusDim)target.open=true;target.scrollIntoView({behavior:'auto',block:'start'});}
}
function closeSidebar(){document.getElementById('readiness').scrollIntoView({behavior:'auto'});}
/* multi-select popover for the register bar */
let msOpenFor=null;
function openMS(dim, anchor){
 const pop=document.getElementById('msPop');
 if(msOpenFor===dim){ closeMS(); return; }
 msOpenFor=dim;
 const D=GF_DIMS[dim], vals=D.vals(), base=gfBaseExcept(dim);
 const counts={}; vals.forEach(v=>counts[v]=0); base.forEach(d=>D.get(d).forEach(v=>{ if(v in counts)counts[v]++; }));
 pop.innerHTML='<div class="ms-head"><b>'+D.label+'</b><span class="ms-tools"><button data-all>All</button><button data-none>None</button></span></div>'+
  '<input class="ms-q" placeholder="Search…">'+
  '<div class="ms-list">'+vals.map(v=>'<label class="ms-item'+(counts[v]?'':' dim')+'"><input type="checkbox" data-v="'+esc(v)+'" '+(GF[dim].has(v)?'checked':'')+'><span>'+esc(gfName(dim,v))+'</span><em>'+counts[v]+'</em></label>').join('')+'</div>'+
  '<div class="ms-foot"><span class="ms-hint">Multi-select · OR within this filter · applies to all sections</span><button class="btn btn-fill" data-done style="padding:6px 14px;font-size:12px">Done</button></div>';
 const r=anchor.getBoundingClientRect();
 pop.style.left=Math.min(r.left, innerWidth-330)+'px'; pop.style.top=(r.bottom+6+scrollY)+'px';
 pop.classList.add('open');
 pop.querySelectorAll('input[type=checkbox]').forEach(c=>c.addEventListener('change',()=>{ if(c.checked)GF[dim].add(c.dataset.v); else GF[dim].delete(c.dataset.v); gfChanged(); }));
 pop.querySelector('[data-all]').onclick=()=>{vals.forEach(v=>GF[dim].add(v));gfChanged();openMS(dim,anchor);msOpenFor=dim;};
 pop.querySelector('[data-none]').onclick=()=>{GF[dim].clear();gfChanged();openMS(dim,anchor);msOpenFor=dim;};
 pop.querySelector('[data-done]').onclick=closeMS;
 pop.querySelector('.ms-q').addEventListener('input',e=>{const q=e.target.value.toLowerCase();pop.querySelectorAll('.ms-item').forEach(it=>{it.style.display=it.textContent.toLowerCase().includes(q)?'':'none';});});
}
function closeMS(){ document.getElementById('msPop').classList.remove('open'); msOpenFor=null; }
document.addEventListener('click',e=>{ if(!e.target.closest('#msPop')&&!e.target.closest('.ms-btn')&&!e.target.closest('.th-f')) closeMS(); });
/* column visibility */
const REG_COLS=['ID','Dataset','Year','Country','Images','Image source','Viewpoint','AI tasks','Access','License','Readiness','Verify','Link'];
const hiddenCols=new Set();
function applyColVis(){
 const tbl=document.querySelector('#register table');
 REG_COLS.forEach((c,i)=>{ tbl.querySelectorAll('tr > *:nth-child('+(i+1)+')').forEach(cell=>{cell.style.display=hiddenCols.has(i)?'none':'';}); });
}
function openCols(anchor){
 const pop=document.getElementById('msPop'); msOpenFor='__cols';
 pop.innerHTML='<div class="ms-head"><b>Show columns</b></div><div class="ms-list">'+REG_COLS.map((c,i)=>
  '<label class="ms-item"><input type="checkbox" data-i="'+i+'" '+(hiddenCols.has(i)?'':'checked')+'><span>'+c+'</span></label>').join('')+'</div>'+
  '<div class="ms-foot"><span class="ms-hint">CSV includes the full metadata field set</span><button class="btn btn-fill" data-done style="padding:6px 14px;font-size:12px">Done</button></div>';
 const r=anchor.getBoundingClientRect(); pop.style.left=Math.min(r.left, innerWidth-330)+'px'; pop.style.top=(r.bottom+6+scrollY)+'px'; pop.classList.add('open');
 pop.querySelectorAll('input').forEach(c=>c.addEventListener('change',()=>{ if(c.checked)hiddenCols.delete(+c.dataset.i); else hiddenCols.add(+c.dataset.i); applyColVis(); }));
 pop.querySelector('[data-done]').onclick=closeMS;
}

function filtered(){
 const q=state.q.toLowerCase();
 return gfBase().filter(d=>{
  if(q && !((d.n+' '+d.alt+' '+d.dst+' '+d.ctrys.join(' ')+' '+d.acq+' '+d.id+' '+d.lic+' '+d.tasks.join(' ')+' '+d.mods.join(' ')).toLowerCase().includes(q))) return false;
  if(state.uniq && d.plats.length!==1) return false;
  if(state.multi && d.plats.length<2) return false;
  if(state.conf && !d.confl.length) return false;
  return true;
 });
}

/* ---------- KPIs ---------- */
(function(){
 const nc=Object.keys(DATA.reduce((a,d)=>{d.ctrys.forEach(c=>a[c]=1);return a;},{})).length;
 const open=DATA.filter(d=>d.acc==='Direct download').length;
 const multi=DATA.filter(d=>d.plats.length>1).length;
 const seg=DATA.filter(d=>d.ann.sm).length;
 document.getElementById('kpis').innerHTML=[
  [DATA.length,'Reconciled datasets','retained in source workbook v4.0'],
  [nc,'Countries covered','where location is reported'],
  [open,'Direct downloads','access route reported by source'],
  [multi,'Multi-platform datasets','mirrors merged into one record'],
  [seg,'With segmentation masks','pixel-level ground truth'],
 ].map(k=>'<div class="kpi"><b>'+k[0]+'</b><span>'+k[1]+'</span><em>'+k[2]+'</em></div>').join('');
})();

/* ---------- map (v10: real outlines + wheel/pinch zoom, drag pan, persistent view) ---------- */
function project(lon,lat,W,H){return [(lon+180)/360*W,(90-lat)/180*H];}
const CTRY_SET = new Set(POINTS.map(p=>p.name==='Turkey'?'Turkey':p.name));
const MAP_W=960, MAP_H=395, MAP_Y0=55, MAP_ZMAX=8;
const MAPV={z:1,x:0,y:MAP_Y0};               // current view: zoom factor + top-left corner of the viewBox, in map units
function mapClamp(){
 MAPV.z=Math.max(1,Math.min(MAP_ZMAX,MAPV.z));
 const w=MAP_W/MAPV.z, h=MAP_H/MAPV.z;
 MAPV.x=Math.max(0,Math.min(MAP_W-w,MAPV.x));
 MAPV.y=Math.max(MAP_Y0,Math.min(MAP_Y0+MAP_H-h,MAPV.y));
}
function mapApply(){
 const svg=document.querySelector('#mapBox svg'); if(!svg) return;
 mapClamp(); const z=MAPV.z, w=MAP_W/z, h=MAP_H/z;
 svg.setAttribute('viewBox',MAPV.x.toFixed(2)+' '+MAPV.y.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2));
 svg.classList.toggle('zoomed',z>1.05); svg.classList.toggle('z2',z>=2.5);   // z2 reveals the small-country labels once there is room
 const k=1/Math.sqrt(z);                       // dots and labels shrink slowly, so they stay legible without swamping small countries
 svg.querySelectorAll('.geo-dot').forEach(g=>{
  const r0=+g.dataset.r, y=+g.dataset.y, core=g.querySelector('.core'), halo=g.querySelector('.halo'), t=g.querySelector('text');
  core.setAttribute('r',(r0*k).toFixed(2)); halo.setAttribute('r',((r0+6)*k).toFixed(2));
  if(t){ t.style.fontSize=(9.5*k).toFixed(2)+'px'; t.setAttribute('y',(y-r0*k-7*k).toFixed(2)); }
 });
 const lbl=document.getElementById('mapZoomLbl'); if(lbl) lbl.textContent=z<1.05?'World view':('Zoom '+z.toFixed(1)+'×');
 const bi=document.getElementById('mapZin'), bo=document.getElementById('mapZout'), br=document.getElementById('mapReset');
 if(bi) bi.disabled=z>=MAP_ZMAX-.01; if(bo) bo.disabled=z<=1.01; if(br) br.disabled=z<=1.01;
}
function mapPoint(svg,cx,cy){                   // client pixel -> map units
 const r=svg.getBoundingClientRect();
 return [MAPV.x+(cx-r.left)/r.width*(MAP_W/MAPV.z), MAPV.y+(cy-r.top)/r.height*(MAP_H/MAPV.z)];
}
function mapZoomAt(factor,px,py){              // zoom keeping map point (px,py) under the same pixel
 const z0=MAPV.z, z1=Math.max(1,Math.min(MAP_ZMAX,z0*factor)); if(Math.abs(z1-z0)<1e-6) return;
 if(px==null){ px=MAPV.x+MAP_W/z0/2; py=MAPV.y+MAP_H/z0/2; }
 MAPV.x=px-(px-MAPV.x)*z0/z1; MAPV.y=py-(py-MAPV.y)*z0/z1; MAPV.z=z1; mapApply();
}
function mapResetView(){ MAPV.z=1; MAPV.x=0; MAPV.y=MAP_Y0; mapApply(); }
function mapWire(svg){
 const pts=new Map(); let drag=null, pinch=null, dragged=false;
 const rebase=(x,y)=>{ if(drag){ drag.x=x; drag.y=y; drag.mx=MAPV.x; drag.my=MAPV.y; } };   // after a zoom, measure the drag from the new origin
 svg.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0) return;
  pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size===1){ drag={x:e.clientX,y:e.clientY,mx:MAPV.x,my:MAPV.y,slop:e.pointerType==='touch'?10:4}; dragged=false; }
  else if(pts.size===2){ const [a,b]=[...pts.values()]; pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),z:MAPV.z}; drag=null; dragged=true; }
 });
 svg.addEventListener('pointermove',e=>{
  if(!pts.has(e.pointerId)) return;
  if(e.pointerType==='mouse'&&!(e.buttons&1)){ up(e); return; }   // the button was released outside the map before capture engaged
  pts.set(e.pointerId,[e.clientX,e.clientY]);
  const r=svg.getBoundingClientRect();
  if(pinch&&pts.size===2){
   const [a,b]=[...pts.values()], d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(d<1) return;
   const [px,py]=mapPoint(svg,(a[0]+b[0])/2,(a[1]+b[1])/2); mapZoomAt((pinch.z*d/pinch.d)/MAPV.z,px,py); return;
  }
  if(!drag) return;
  const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
  if(!dragged){ if(Math.hypot(dx,dy)<=drag.slop) return; dragged=true; svg.classList.add('dragging'); try{svg.setPointerCapture(e.pointerId);}catch(x){} }   // capture only once it is really a drag, so taps still reach the dots
  MAPV.x=drag.mx-dx/r.width*(MAP_W/MAPV.z); MAPV.y=drag.my-dy/r.height*(MAP_H/MAPV.z); mapApply();
 });
 const up=e=>{ pts.delete(e.pointerId); try{svg.releasePointerCapture(e.pointerId);}catch(x){}
  if(pts.size<2) pinch=null;
  if(pts.size===1){ const [x,y]=[...pts.values()][0]; drag={x:x,y:y,mx:MAPV.x,my:MAPV.y,slop:0}; dragged=true; }   // pinch -> the remaining finger keeps panning
  if(!pts.size){ drag=null; svg.classList.remove('dragging'); } };
 svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
 svg.addEventListener('click',e=>{ if(dragged){ e.stopPropagation(); e.preventDefault(); } },true);   // a drag that ends on a dot is not a click
 svg.addEventListener('wheel',e=>{
  if(!e.deltaY) return;
  const dy=e.deltaMode===1?e.deltaY*16:(e.deltaMode===2?e.deltaY*400:e.deltaY);
  const f=Math.exp(-Math.max(-120,Math.min(120,dy))*0.0025);        // one mouse notch (100) = 1.28x, a trackpad tick = a few percent
  const z1=Math.max(1,Math.min(MAP_ZMAX,MAPV.z*f)); if(Math.abs(z1-MAPV.z)<1e-6) return;   // nothing to zoom: let the page scroll
  e.preventDefault(); const [px,py]=mapPoint(svg,e.clientX,e.clientY); mapZoomAt(f,px,py); rebase(e.clientX,e.clientY);
 },{passive:false});
 svg.addEventListener('dblclick',e=>{ e.preventDefault(); if(e.target.closest('.geo-dot')) return; const [px,py]=mapPoint(svg,e.clientX,e.clientY); if(MAPV.z>=MAP_ZMAX-.01) mapResetView(); else mapZoomAt(2,px,py); rebase(e.clientX,e.clientY); });
}
function renderMap(){
 const W=960,H=395; const mapBase=gfBaseExcept("ctrys"), mapPoints=POINTS.map(p=>({...p,n:mapBase.filter(d=>d.ctrys.includes(p.name)).length})).filter(p=>p.n>0);
 let s='<svg viewBox="0 55 960 '+H+'" role="img" aria-label="World map of dataset collection countries">';
 // graticule every 30 degrees + equator (equirectangular)
 for(let lon=-150;lon<=150;lon+=30){const[x]=project(lon,0,W,480);s+='<path class="graticule" d="M'+x.toFixed(1)+' 55V450"/>';}
 for(let lat=-60;lat<=80;lat+=30){if(lat===0)continue;const[,y]=project(0,lat,W,480);s+='<path class="graticule" d="M0 '+y.toFixed(1)+'H960"/>';}
 {const[,y0]=project(0,0,W,480);s+='<path class="equator" d="M0 '+y0.toFixed(1)+'H960"/>';}
 // real country outlines; countries present in the inventory get a slightly darker fill
 WORLD.forEach(c=>{
  s+='<path class="land'+(CTRY_SET.has(c.n)?' hit':'')+'" d="'+c.d+'"><title>'+esc(c.n)+'</title></path>';
 });
 s+='<text class="map-cap" x="10" y="444">Equirectangular projection · Natural Earth country boundaries · graticule 30°</text>';
 mapPoints.forEach(p=>{
  const [x,y]=project(p.lon,p.lat,W,480);
  const r=4+Math.sqrt(p.n)*2.6;
  s+='<g class="geo-dot'+(GF.ctrys.has(p.name)?' sel':'')+'" data-c="'+esc(p.name)+'" data-x="'+x.toFixed(2)+'" data-y="'+y.toFixed(2)+'" data-r="'+r.toFixed(2)+'">'+
     '<circle class="halo" cx="'+x+'" cy="'+y+'" r="'+(r+6)+'"/>'+
     '<circle class="core" cx="'+x+'" cy="'+y+'" r="'+r+'"><title>'+esc(p.name)+': '+p.n+' dataset'+(p.n>1?'s':'')+'</title></circle>'+
     '<text class="'+(p.n>=5?'lbl':'lbl-far')+'" x="'+x+'" y="'+(y-r-7)+'" text-anchor="middle">'+esc(p.name)+'</text></g>';
 });
 s+='</svg>';
 const box=document.getElementById('mapBox'); box.innerHTML=s;
 const svg=box.querySelector('svg'); mapWire(svg); mapApply();
 document.querySelectorAll('.geo-dot').forEach(g=>g.addEventListener('click',()=>toggleCtry(g.dataset.c)));
 const mxn=Math.max(...mapPoints.map(p=>p.n));
 document.getElementById('geoList').innerHTML=
  mapPoints.map(p=>'<div class="geo-row'+(GF.ctrys.has(p.name)?' sel':'')+'" data-c="'+esc(p.name)+'"><span>'+esc(p.name)+'</span><b>'+p.n+'</b><span class="bar"><i style="width:'+(p.n/mxn*100)+'%"></i></span></div>').join('')+
  '<div class="geo-note">'+mapBase.filter(d=>!d.ctrys.length).length+' datasets do not report a collection country and are not on the map.</div>';
 document.querySelectorAll('.geo-row').forEach(g=>g.addEventListener('click',()=>toggleCtry(g.dataset.c)));
 const hint=document.getElementById('geoHint');
 if(GF.ctrys.size){
  const n=gfBase().length, list=[...GF.ctrys];
  hint.innerHTML='Showing '+n+' dataset'+(n===1?'':'s')+' collected in <b>'+list.map(esc).join('</b>, <b>')+'</b> — click more countries to add them, click again to remove.'+
   '<button class="btn btn-ghost geo-hint-btn" id="geoShow">Show in register →</button>';
  hint.querySelector('#geoShow').addEventListener('click',()=>document.getElementById('register').scrollIntoView({behavior:'auto'}));
 } else hint.textContent='Dot size = number of datasets reporting the country. Multi-country datasets appear once per country. Select any number of countries (OR).';
}
function toggleCtry(c){ gfToggle('ctrys',c); }
(function(){
 const on=(id,f)=>{const b=document.getElementById(id); if(b) b.addEventListener('click',f);};
 on('mapZin',()=>mapZoomAt(1.6)); on('mapZout',()=>mapZoomAt(1/1.6)); on('mapReset',mapResetView);
})();

/* ---------- camera viewpoint (v1.1) ---------- */
IC.nadir='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="5" rx="1.5"/><path d="M12 8v7M9.5 12.5 12 15l2.5-2.5"/><path d="M3 19h18M6 21h12"/></svg>';
IC.fwd='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v-3l2-4h8l3 4h3v3"/><path d="M3 15h16"/><circle cx="7" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/><path d="M19 10l3-2M19 12h3"/></svg>';
IC.mixed='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16V9l2-3h5"/><path d="M11 6l3 3h3v7"/><path d="M15 3v3M13 5l2 2 2-2"/><path d="M3 19h18"/><circle cx="7" cy="17" r="1.4"/><circle cx="15" cy="17" r="1.4"/></svg>';
IC.other='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 2.5 3 13.5 0 16M12 4c-3 2.5-3 13.5 0 16"/></svg>';
const VIEW_CARDS=[
 ['Nadir / top-down','nadir','Camera axis perpendicular to the pavement: survey vehicles, downward phones, UAV nadir',['Nadir / top-down']],
 ['Forward-facing / oblique','fwd','Dash-cams, windshield phones, bonnet cameras and street-level views',['Forward-facing / oblique']],
 ['Mixed (nadir + forward-facing)','mixed','Both viewpoints in one dataset',['Mixed (nadir + forward-facing)']],
 ['Other viewpoints','other','UAV oblique, rear-facing, panoramic or non-imaging data',['Oblique aerial (UAV)','Rear-facing / oblique','Side-facing / lateral','Panoramic (360°)','Not applicable (non-imaging)']],
 ['Unclear','scan','Web-scraped or conflicting sources',['Unclear (conflicting evidence)']],
 ['Not reported','scan','No viewpoint statement found in the workbook, dataset page or paper',['Not reported']],
];
const VIEW_VALS=VIEW_CARDS.flatMap(c=>c[3]);
function renderView(){
 document.getElementById('viewGrid').innerHTML=VIEW_CARDS.map(([name,ic,desc,vals])=>{
  const n=gfBase().filter(d=>vals.includes(d.view)).length, sel=vals.some(v=>GF.view.has(v));
  const dim=(name==='Not reported'||name==='Unclear');
  return '<div class="card icon-card clickable'+(sel?' sel':'')+'" data-v="'+esc(vals.join('|'))+'">'+
   '<div class="big-ic"'+(dim?' style="background:rgba(0,0,0,.05);color:var(--ink3)"':'')+'>'+IC[ic]+'</div><h3>'+esc(name)+'</h3><b>'+n+'</b><span>'+esc(desc)+'</span></div>';
 }).join('');
 document.querySelectorAll('#viewGrid .icon-card[data-v]').forEach(t=>t.addEventListener('click',()=>{
  const vals=t.dataset.v.split('|'); const on=vals.some(v=>GF.view.has(v));
  vals.forEach(v=>{ if(on) GF.view.delete(v); else GF.view.add(v); }); gfChanged(); scrollReg();
 }));
 const td=gfBase().filter(d=>d.vtd==='Yes'||d.vtd==='Partial').length, ff=gfBase().filter(d=>d.vff==='Yes'||d.vff==='Partial').length, lab=gfBase().filter(d=>d.view&&d.view!=='Not reported').length;
 document.getElementById('viewHint').textContent=lab+' of '+DATA.length+' datasets have a labelled viewpoint: '+td+' contain top-down imagery and '+ff+' contain forward-facing imagery (fully or in part). Viewpoint categories use explicit source statements only; unspecified directions remain unreported.';
}
function viewCell(d){
 if(!d.view) return '<span style="color:var(--ink3)">—</span>';
 const short={'Nadir / top-down':'Top-down','Forward-facing / oblique':'Forward','Mixed (nadir + forward-facing)':'Mixed','Oblique aerial (UAV)':'UAV oblique','Rear-facing / oblique':'Rear-facing','Side-facing / lateral':'Side','Panoramic (360°)':'360°','Not applicable (non-imaging)':'Non-imaging','Not reported':'—','Unclear (conflicting evidence)':'Unclear'}[d.view]||d.view;
 return '<span class="view-cell" title="'+esc(d.view+(d.vmount?' · '+d.vmount:'')+(d.vq?'\n“'+d.vq+'”':''))+'">'+esc(short)+(d.vmount&&d.view!=='Not reported'?'<small>'+esc(d.vmount.length>48?d.vmount.slice(0,47)+'…':d.vmount)+'</small>':'')+'</span>';
}

/* ---------- section grids ---------- */
const MODS=[
 ['RGB imagery','rgb','cam','Standard color photographs and survey frames — the backbone of the inventory.'],
 ['Video / frames','video','film','Driving video and frame sequences, often with per-frame labels.'],
 ['Stereo / depth','stereo','depth','Stereo pairs and depth maps for 3-D pothole and rut measurement.'],
 ['LiDAR / point cloud','lidar','sat','Laser scans and synchronized image + point-cloud captures.'],
 ['Infrared / thermal','ir','flame','Thermography that reveals subsurface and low-light distress.'],
 ['GPR / subsurface','gpr','wave','Ground-penetrating radargrams paired with surface imagery.'],
 ['GPS / IMU telemetry','gps','pin','Geolocation and inertial traces alongside the imagery.'],
];
MODT.generic=asphalt('<path d="M125 56h50v38h-50z" stroke="#dce4eb" fill="none" stroke-width="2"/><circle cx="150" cy="75" r="10" stroke="#dce4eb" fill="none" stroke-width="2"/>');
for(const value of [...new Set(DATA.flatMap(d=>d.mods))])if(!MODS.some(m=>m[0]===value))MODS.push([value,'generic','cam','As recorded in the source workbook. Open a dataset for collection and file details.']);
function renderMods(){
 document.getElementById('modGrid').innerHTML = MODS.map(([name,tile,ic,desc])=>{
  const n=gfBase().filter(d=>d.mods.includes(name)).length;
  return '<div class="card tile clickable'+(GF.mods.has(name)?' sel':'')+'" data-m="'+esc(name)+'">'+
   '<div class="visual">'+MODT[tile]+'<span class="badge-il">Illustration</span></div>'+
   '<div class="body"><h3><span class="ic">'+IC[ic]+'</span>'+esc(name)+'</h3><p>'+esc(desc)+'</p>'+
   '<div class="count">'+n+' dataset'+(n===1?'':'s')+' →</div></div></div>';
 }).join('');
 document.querySelectorAll('#modGrid .tile').forEach(t=>t.addEventListener('click',()=>{gfToggle('mods',t.dataset.m);scrollReg();}));
}
const ANNS=[
 ['Classification label','cl','tag','One label for the whole image — crack / no-crack, condition class.'],
 ['Bounding box','bb','box','Axis-aligned boxes around each distress instance (VOC, COCO, YOLO).'],
 ['Oriented box','ob','scan','Rotated boxes that follow the crack direction.'],
 ['Polygon','pg','wand','Instance outlines traced point by point.'],
 ['Segmentation mask','sm','layers','Pixel-accurate masks for every distress region.'],
 ['Severity level','sv','gauge','Graded labels — low / medium / high damage severity.'],
];
function renderAnns(){
 document.getElementById('annGrid').innerHTML = ANNS.map(([name,k,ic,desc])=>{
  const n = k==='ob' ? gfBase().filter(d=>/oriented/i.test(d.annT)).length : gfBase().filter(d=>d.ann[k]).length;
  return '<div class="card tile clickable'+(GF.ann.has(k)?' sel':'')+'" data-k="'+k+'">'+
   '<div class="visual">'+annTile(k)+'<span class="badge-il">Illustration</span></div>'+
   '<div class="body"><h3><span class="ic">'+IC[ic]+'</span>'+esc(name)+'</h3><p>'+esc(desc)+'</p>'+
   '<div class="count">'+n+' dataset'+(n===1?'':'s')+' →</div></div></div>';
 }).join('');
 document.querySelectorAll('#annGrid .tile').forEach(t=>t.addEventListener('click',()=>{gfToggle('ann',t.dataset.k);scrollReg();}));
}
const SRCS=[
 ['Vehicle camera','car','Survey vehicles, dashcams and windshield rigs'],
 ['Smartphone','phone','Handheld or vehicle-mounted phones'],
 ['UAV / drone','drone','Low-altitude aerial capture'],
 ['Handheld / fixed','cam','Handheld cameras and fixed mounts'],
 ['Street view','street','Street-level imagery services'],
 ['Depth / LiDAR / IR','depth','Stereo, laser, thermal and 3-D rigs'],
 ['Web-compiled','web','Aggregated or scraped collections'],
];
for(const value of [...new Set(DATA.flatMap(d=>d.srcs))])if(!SRCS.some(t=>t[0]===value))SRCS.push([value,'car','Collection platform recorded in the source.']);
function renderAcq(){
 document.getElementById('acqGrid').innerHTML = SRCS.map(([name,ic,desc])=>{
  const n=gfBase().filter(d=>d.srcs.includes(name)).length;
  return '<div class="card icon-card clickable'+(GF.srcs.has(name)?' sel':'')+'" data-s="'+esc(name)+'">'+
   '<div class="big-ic">'+IC[ic]+'</div><h3>'+esc(name)+'</h3><b>'+n+'</b><span>'+esc(desc)+'</span></div>';
 }).join('')+
 '<div class="card icon-card"><div class="big-ic" style="background:rgba(0,0,0,.05);color:var(--ink3)">'+IC.scan+'</div><h3>Not reported</h3><b>'+gfBase().filter(d=>!d.srcs.length).length+'</b><span>No acquisition platform stated</span></div>';
 document.querySelectorAll('#acqGrid .icon-card[data-s]').forEach(t=>t.addEventListener('click',()=>{gfToggle('srcs',t.dataset.s);scrollReg();}));
}
const TASKS=[
 ['Object detection','box'],['Classification','tag'],['Semantic segmentation','layers'],
 ['Instance segmentation','wand'],['Severity assessment','gauge'],['Condition prediction','chart'],
 ['Multimodal / fusion','depth'],
];
for(const value of [...new Set(DATA.flatMap(d=>d.tasks))])if(!TASKS.some(t=>t[0]===value))TASKS.push([value,'scan']);
function renderTasks(){
 const counts=TASKS.map(([t])=>gfBase().filter(d=>d.tasks.includes(t)).length);
 const mx=Math.max(...counts);
 document.getElementById('taskList').innerHTML = TASKS.map(([t,ic],i)=>
  '<div class="task-row'+(GF.tasks.has(t)?' sel':'')+'" data-t="'+esc(t)+'">'+
  '<span class="ic">'+IC[ic]+'</span><span class="nm">'+esc(t)+'</span>'+
  '<span class="tr"><i style="width:'+(counts[i]/mx*100)+'%"></i></span><span class="ct">'+counts[i]+'</span></div>').join('');
 document.querySelectorAll('.task-row').forEach(t=>t.addEventListener('click',()=>{gfToggle('tasks',t.dataset.t);scrollReg();}));
}
const DIST_TILE={'Longitudinal crack':'long','Transverse crack':'trans','Alligator / fatigue crack':'gator','Pothole':'pothole','Rutting / deformation':'rut','Patch / sealed crack':'patch','Raveling / surface erosion':'ravel','Manhole / road furniture':'manhole'};
function renderDist(){
 document.getElementById('distGrid').innerHTML = DISTKEYS.map(([lab])=>{
  const n=gfBase().filter(d=>matchesDistress(d,lab)).length;
  return '<div class="card tile clickable'+(GF.dist.has(lab)?' sel':'')+'" data-d="'+esc(lab)+'">'+
   '<div class="visual"><img loading="lazy" src="'+DISTIMG[DIST_TILE[lab]].data+'" alt="'+esc(lab)+' reference photograph"></div>'+
   '<div class="body"><h3>'+esc(lab)+'</h3><div class="count">'+n+' dataset'+(n===1?'':'s')+' label this →</div><small class="photo-credit">'+esc(DISTIMG[DIST_TILE[lab]].author)+' · '+esc(DISTIMG[DIST_TILE[lab]].license)+'</small></div></div>';
 }).join('');
 document.querySelectorAll('#distGrid .tile').forEach(t=>t.addEventListener('click',()=>{gfToggle('dist',t.dataset.d);scrollReg();}));
}
function scrollReg(){ document.getElementById('register').scrollIntoView({behavior:'auto',block:'start'}); }

/* ---------- register ---------- */
function opts(sel,values,label){document.getElementById(sel).innerHTML='<option value="">'+label+'</option>'+values.map(v=>'<option>'+esc(v)+'</option>').join('');}

const SRC_IC={'Vehicle camera':'car','Smartphone':'phone','UAV / drone':'drone','Handheld / fixed':'cam','Street view':'street','Depth / LiDAR / IR':'depth','Web-compiled':'web'};
function srcCell(d){
 if(!d.srcs.length) return '<span style="color:var(--ink3)">—</span>';
 return d.srcs.map(s=>'<span class="src-ic" title="'+esc(s)+'">'+(IC[SRC_IC[s]]||IC.cam)+esc(s.replace(' / drone','').replace('Handheld / fixed','Handheld').replace('Depth / LiDAR / IR','Depth/IR'))+'</span>').join('');
}
function vpPill(v){
 if(v==='High') return '<span class="pill p-hi">High</span>';
 if(v==='Medium') return '<span class="pill p-mid">Medium</span>';
 if(v==='Low') return '<span class="pill p-ok">Low</span>';
 return '<span class="pill p-low">—</span>';
}
function sortRows(rows){
 const k=state.sortK, asc=state.sortAsc?1:-1;
 const key=d=>{
  if(k==='air')return airScore(d);
  if(k==='view')return d.view||'';
  if(k==='tasks')return d.tasks.join(';'); if(k==='srcs')return d.srcs.join(';');
  if(k==='ctry')return d.ctrys.join(';'); if(k==='yr')return d.yr||0;
  if(k==='img')return imgNum(d)??-1;
  return (d[k]??'').toString().toLowerCase();};
 return rows.slice().sort((a,b)=>{const cohortOrder=k==='air'?AtlasScore.cohort(a).localeCompare(AtlasScore.cohort(b)):0;if(cohortOrder)return cohortOrder;const x=key(a),y=key(b);return (x<y?-1:x>y?1:0)*asc;});
}
function renderTable(rows){
 document.querySelectorAll('.th-f').forEach(b=>{const dm=b.dataset.dim;b.classList.toggle('on',dm==='img'?(GF.imgMin>0||GF.imgMax<6):dm==='yr'?(GF.yrMin>2012||GF.yrMax<2026):GF[dm].size>0);});
 document.getElementById('tbody').innerHTML = rows.map(d=>{
  const tags=d.plats.map(p=>'<span class="tg pl">'+esc(p)+'</span>').join('')+
   (d.plats.length===1?'<span class="tg un">single-platform</span>':'')+
   (d.mir?'<span class="tg mr">mirrored</span>':'')+
   (d.odc!=='Original'?'<span class="tg">'+esc(d.odc.toLowerCase())+'</span>':'')+
   (d.confl.length?'<span class="tg cf">values differ</span>':'')+
   '<span class="tg">'+esc(d.scr.toLowerCase())+'</span>';
  return '<tr><td style="white-space:nowrap;color:var(--ink3)">'+esc(d.id)+'</td>'+
   '<td style="min-width:250px"><span class="ds-name" data-o="'+esc(d.id)+'">'+esc(d.n)+'</span><div class="trow">'+tags+'</div></td>'+
   '<td>'+(d.yr||'—')+'</td><td style="max-width:110px">'+esc(d.ctrys.join('; ')||'—')+'</td>'+
   '<td style="max-width:120px">'+esc(d.img||'—')+'</td>'+
   '<td style="min-width:130px">'+srcCell(d)+'</td>'+
   '<td style="min-width:120px">'+viewCell(d)+'</td>'+
   '<td style="max-width:150px;color:var(--ink2)">'+esc(d.tasks.join('; ')||'—')+'</td>'+
   '<td style="white-space:nowrap">'+esc(d.acc)+'</td><td style="max-width:110px">'+esc(d.lic||'—')+'</td>'+
   '<td>'+airPill(d)+'</td>'+
   '<td>'+vpPill(d.vp)+'</td>'+
   '<td>'+(d.url?'<a href="'+esc(d.url)+'" target="_blank" rel="noopener">Open ↗</a>':'—')+'</td></tr>';
 }).join('')||'<tr><td colspan="13" class="empty-results">No datasets match this search. Clear the search or reset filters.</td></tr>';
 document.getElementById('nShown').textContent=rows.length;
 document.querySelectorAll('[data-o]').forEach(el=>el.addEventListener('click',()=>openSheet(el.dataset.o)));
}
function renderChips(){ renderGFChips(); }
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

function viewFlag(v,label){ const cls=v==='Yes'?'on':(v==='Partial'?'part':'off'); return '<span class="view-flag '+cls+'">'+label+': '+esc(v||'Unknown')+'</span>'; }
function viewBlock(d){
 if(!d.view) return '';
 const row=(t,x)=>x?'<dt>'+t+'</dt><dd>'+esc(x)+'</dd>':'';
 return '<h3>Camera viewpoint</h3><div style="margin:4px 0 8px"><span class="view-flag '+(d.view==='Not reported'?'off':'on')+'" style="font-size:12px">'+esc(d.view)+'</span>'+viewFlag(d.vtd,'Top-down')+viewFlag(d.vff,'Forward-facing')+'</div>'+
  '<dl class="kv">'+row('Platform / mounting',d.vmount)+row('Other view',d.vother)+
  (d.vq?'<dt>Evidence</dt><dd>“'+esc(d.vq)+'”'+(d.vurl?' <a href="'+esc(d.vurl)+'" target="_blank" rel="noopener">source ↗</a>':'')+'</dd>':'')+
  row('Evidence source',d.vsrc)+row('Label confidence',d.vconf)+row('Second review',d.vver)+row('Notes',d.vnotes)+'</dl>';
}


/* ---------- sample gallery v5: filterable, paginated dataset cards ---------- */
const GAL_PAGE = 12;
const GSTATE = {q:'', plat:'', task:'', y0:'', y1:'', sort:'yr_d', page:1};
const GAL_DS = DATA.filter(d=>SAMPLES[d.id] && SAMPLES[d.id].length);
function srcDomain(u){ try{ return new URL(u).hostname.replace('www.','').replace('raw.githubusercontent.com','github.com'); }catch(e){ return 'source'; } }
function galFiltered(){
 const q=GSTATE.q.toLowerCase();
 let rows=gfBase(GAL_DS).filter(d=>{
  if(q && !((d.n+' '+d.alt+' '+d.dst+' '+d.ctrys.join(' ')).toLowerCase().includes(q))) return false;
  if(GSTATE.plat && !d.plats.includes(GSTATE.plat)) return false;
  if(GSTATE.task && !d.tasks.includes(GSTATE.task)) return false;
  if(GSTATE.y0 && (!d.yr || d.yr < +GSTATE.y0)) return false;
  if(GSTATE.y1 && (!d.yr || d.yr > +GSTATE.y1)) return false;
  return true;
 });
 const key={yr_d:d=>-(d.yr||0), yr_a:d=>d.yr||9999, name:d=>d.n.toLowerCase(),
   img_d:d=>-(imgNum(d)??-1),
   air_d:d=>-airScore(d), nsam_d:d=>-SAMPLES[d.id].length}[GSTATE.sort];
 rows.sort((a,b)=>{const cohortOrder=GSTATE.sort==='air_d'?AtlasScore.cohort(a).localeCompare(AtlasScore.cohort(b)):0;if(cohortOrder)return cohortOrder;const x=key(a),y=key(b);return x<y?-1:x>y?1:0;});
 return rows;
}
function galCard(d){
 const items=SAMPLES[d.id];
 const cover=items[0];
 const chips=d.plats.map(p=>'<span class="tg pl">'+esc(p)+'</span>').join('')+
  (d.ctrys.length?'<span class="tg">'+esc(d.ctrys[0]+(d.ctrys.length>1?' +'+(d.ctrys.length-1):''))+'</span>':'')+
  (d.tasks.length?'<span class="tg">'+esc(d.tasks[0])+'</span>':'')+
  (d.r2?'<span class="tg" style="background:rgba(0,113,227,.1);color:var(--accent)">Evidence '+airScore(d).toFixed(0)+' '+(AtlasScore.cohort(d)==='labeled'?'L16':'U13')+'</span>':'');
 const hl=[d.img?esc(d.img):null,
           d.acc?esc(d.acc):null, d.lic?esc(d.lic.split('|')[0].trim()):null].filter(Boolean).join(' · ');
 return '<div class="dcard" data-o="'+esc(d.id)+'" title="Open the full record">'+
  '<div class="cover"><img src="'+cover.data+'" alt="Sample from '+esc(d.n)+'" loading="lazy">'+
  (d.yr?'<span class="yr-badge">'+d.yr+'</span>':'')+
  '<span class="nimg">'+items.length+' sample'+(items.length>1?'s':'')+(items.some(i=>i.kind==='gif')?' · GIF':'')+'</span></div>'+
  '<div class="cbody"><h3>'+esc(d.n)+'</h3>'+
  '<div class="meta-chips">'+chips+'</div>'+
  '<div class="hl">'+hl+'</div>'+
  '<div class="src-line"><span>Samples: '+esc(srcDomain(cover.src))+'</span>'+
  (d.url?'<a href="'+esc(d.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">Dataset ↗</a>':'')+
  '</div></div></div>';
}
function renderGallery(){
 const rows=galFiltered();
 const pages=Math.max(1, Math.ceil(rows.length/GAL_PAGE));
 if(GSTATE.page>pages) GSTATE.page=pages;
 const start=(GSTATE.page-1)*GAL_PAGE;
 document.getElementById('gN').textContent=rows.length;
 document.getElementById('gPageInfo').textContent='Page '+GSTATE.page+' of '+pages+' · '+GAL_PAGE+' per page';
 document.getElementById('galGrid').innerHTML=rows.slice(start,start+GAL_PAGE).map(galCard).join('')
  || '<div style="grid-column:1/-1;color:var(--ink3);font-size:13px;padding:20px;text-align:center">No datasets match the gallery filters.</div>';
 document.querySelectorAll('.dcard[data-o]').forEach(el=>el.addEventListener('click',()=>openSheet(el.dataset.o)));
 // pager: prev, windowed numbers, next
 let btns='<button '+(GSTATE.page===1?'disabled':'')+' data-p="prev">‹</button>';
 const win=[];
 for(let p=1;p<=pages;p++){ if(p===1||p===pages||Math.abs(p-GSTATE.page)<=2) win.push(p); }
 let last=0;
 win.forEach(p=>{ if(p-last>1) btns+='<span style="color:var(--ink3)">…</span>'; btns+='<button class="'+(p===GSTATE.page?'cur':'')+'" data-p="'+p+'">'+p+'</button>'; last=p; });
 btns+='<button '+(GSTATE.page===pages?'disabled':'')+' data-p="next">›</button>';
 document.getElementById('galPager').innerHTML=btns;
 document.querySelectorAll('#galPager button').forEach(b=>b.addEventListener('click',()=>{
  const p=b.dataset.p;
  GSTATE.page = p==='prev'?GSTATE.page-1 : p==='next'?GSTATE.page+1 : +p;
  renderGallery();
  document.getElementById('gallery').scrollIntoView({behavior:'auto'});
 }));
}
function initGalleryFilters(){
 const yrs=[...new Set(GAL_DS.map(d=>d.yr).filter(Boolean))].sort();
 const opt=(id,vals,label)=>{document.getElementById(id).innerHTML='<option value="">'+label+'</option>'+vals.map(v=>'<option>'+esc(String(v))+'</option>').join('');};
 opt('gPlat',PLATS,'All platforms');
 opt('gTask',TASKS.map(t=>t[0]),'All tasks');
 opt('gY0',yrs,'Any'); opt('gY1',yrs,'Any');
 const wire=(id,k,ev)=>document.getElementById(id).addEventListener(ev||'change',e=>{GSTATE[k]=e.target.value;GSTATE.page=1;renderGallery();});
 wire('gQ','q','input'); wire('gPlat','plat'); wire('gTask','task');
 wire('gY0','y0'); wire('gY1','y1'); wire('gSort','sort');
}
function renderAll(){
 updateWeightLabels();
 renderMap();renderMods();renderAnns();renderAcq();renderView();renderTasks();renderDist();renderChips();
 renderRank();renderStates();renderScatter();
 renderTable(sortRows(filtered()));
 if(typeof renderGallery==='function'&&typeof GSTATE!=='undefined'){GSTATE.page=1;renderGallery();}
 applyColVis();
}
initGalleryFilters();
renderGallery();
renderWeights();
updateWeightLabels();
renderSidebar();
renderGFChips();
applyColVis();
document.getElementById('wReset').addEventListener('click',()=>{W=defaultWeights(PROFILE);renderWeights();updateAir();});

/* ---------- sheet ---------- */
function openSheet(id){location.href='dataset.html?id='+encodeURIComponent(id);}
function closeSheet(){document.getElementById('sheet').classList.remove('open');document.getElementById('scrim').classList.remove('open');}
document.getElementById('shClose').addEventListener('click',closeSheet);
document.getElementById('scrim').addEventListener('click',closeSheet);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();});

/* ---------- wiring ---------- */
const bind=(id,ev,fn)=>document.getElementById(id).addEventListener(ev,fn);
bind('fQ','input',e=>{state.q=e.target.value;renderTable(sortRows(filtered()));});
[['tUniq','uniq'],['tMulti','multi'],['tConf','conf']].forEach(([id,k])=>{
 const el=document.getElementById(id);
 el.addEventListener('click',()=>{state[k]=!state[k];el.classList.toggle('on',state[k]);renderAll();});
});
bind('fReset','click',()=>{
 Object.assign(state,{q:'',uniq:false,multi:false,conf:false});
 document.getElementById('fQ').value='';
 ['tUniq','tMulti','tConf'].forEach(i=>document.getElementById(i).classList.remove('on'));
 gfClearAll();
});
document.querySelectorAll('.ms-btn[data-dim]').forEach(b=>b.addEventListener('click',()=>openMS(b.dataset.dim,b)));
document.querySelectorAll('.th-f').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();
 const dim=b.dataset.dim; if(dim==='img'||dim==='yr') openSidebar(dim); else openMS(dim,b);}));
document.getElementById('btnCols').addEventListener('click',function(){openCols(this);});
document.getElementById('gfFab').addEventListener('click',()=>openSidebar());
document.getElementById('navFilters').addEventListener('click',e=>{e.preventDefault();openSidebar();});
document.getElementById('gfClose').addEventListener('click',closeSidebar);
document.getElementById('gfDone').addEventListener('click',closeSidebar);
document.getElementById('gfScrim').addEventListener('click',closeSidebar);
document.getElementById('gfClearAll').addEventListener('click',gfClearAll);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){closeMS();} });
document.querySelectorAll('th[data-k]').forEach(th=>th.addEventListener('click',()=>{
 const k=th.dataset.k;
 if(state.sortK===k)state.sortAsc=!state.sortAsc;else{state.sortK=k;state.sortAsc=true;}
 renderTable(sortRows(filtered()));
}));
bind('btnCsv','click',()=>{
 const rows=sortRows(filtered());
 const cols=['id','n','alt','plats','yr','ctrys','img','res','srcs','view','vtd','vff','vmount','vq','vsrc','vurl','vconf','mods','tasks','dst','annT','annF','acc','lic','odc','mir','scr','vp','cohort','screening_weights','readiness_confirmed','readiness_upper','evidence_resolved_pct','eligibility','confl','url','doi','pub'];
 const csv=cols.join(',')+'\n'+rows.map(d=>cols.map(c=>{
  let x=d[c];if(c==='screening_weights')x=CRITERIA.map((cr,i)=>cr.key+':'+(r2Score(d).weights[i]/r2Score(d).weights.reduce((a,b)=>a+b,0)*100).toFixed(4)+'%').join('; '); if(c==='readiness_confirmed'||c==='readiness_upper'||c==='evidence_resolved_pct'){const s=d.r2?r2Score(d):null; x=s?(c==='readiness_confirmed'?s.conf:c==='readiness_upper'?s.upper:s.res).toFixed(1):'';} if(c==='eligibility') x=d.r2?eligibility(d):'';
  if(Array.isArray(x))x=x.join('; ');if(x===true)x='Y';if(x===false)x='N';if(x==null)x='';
  return '"'+String(x).replace(/^[=+@\-]/,"'$&").replace(/"/g,'""')+'"';}).join(',')).join('\n');
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));
 a.download='pavedata_atlas_v1.3_filtered.csv';a.click();URL.revokeObjectURL(a.href);
});

renderAll();

document.getElementById("heroN").textContent=DATA.length;
const initial=new URLSearchParams(location.search);if(initial.has("q")){state.q=initial.get("q");document.getElementById("fQ").value=state.q;renderTable(sortRows(filtered()));}
