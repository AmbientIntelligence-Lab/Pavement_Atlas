/* Shared, deterministic v4.0 evidence arithmetic. No empirical quality is inferred. */
(function(root){
 const keys=['A','L','D','C','R','M'];
 function cohort(d){return /unlabeled/i.test(d.cohort||d.r2?.cohort||'')?'unlabeled':'labeled';}
 function defaults(c){return c==='unlabeled'?[20,0,20,20,20,20]:[20,20,20,20,20,20];}
 function criterion(d,i){
  const checks=root.ATLAS_RUBRIC.criteria[i].checks, m=checks.length;
  const excluded=cohort(d)==='unlabeled'&&keys[i]==='L';
  const s=excluded?'':(d.r2?.st?.[i]||'U'.repeat(m));
  const count=k=>[...s].filter(x=>x===k).length;
  const y=count('Y'),n=count('N'),x=count('X'),u=count('U');
  return {s,m,y,n,x,u,excluded,conf:excluded?0:5*y/m,upper:excluded?0:5*(y+u+x)/m,res:y+n,grade:excluded?'Not scored':`${y}/${m} confirmed`};
 }
 function score(d,w=defaults(cohort(d))){
  const weights=w.map((v,i)=>cohort(d)==='unlabeled'&&i===1?0:Math.max(0,Number(v)||0));
  const sum=weights.reduce((a,b)=>a+b,0);if(!sum)return {conf:0,upper:0,res:0,weights,valid:false};
  let conf=0,upper=0,res=0;
  keys.forEach((_,i)=>{const r=criterion(d,i);conf+=weights[i]*r.conf/5;upper+=weights[i]*r.upper/5;res+=weights[i]*r.res/r.m;});
  return {conf:100*conf/sum,upper:100*upper/sum,res:100*res/sum,weights,valid:true};
 }
 root.AtlasScore={cohort,defaults,criterion,score};
})(typeof window==='undefined'?globalThis:window);
