// Public allowlist keeps development dependencies and private runtime configuration out of Pages.
import {cp,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'_site');
await mkdir(out,{recursive:true});
for(const entry of ['index.html','dataset.html','av-model-simulation.html','driving-simulation.html','submit.html','schema.html','guide.html','.nojekyll','assets','data','src','licenses','docs','integrations','README.md','CHANGELOG.md','CREDITS.md'])await cp(path.join(root,entry),path.join(out,entry),{recursive:true});
console.log('Public site staged in _site. Integration source is downloadable documentation; it does not execute on Pages. No credentials included.');
