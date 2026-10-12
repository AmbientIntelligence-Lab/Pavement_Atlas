import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4184);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.md':'text/plain; charset=utf-8','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
http.createServer(async(req,res)=>{try{const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(urlPath.endsWith('/')?urlPath+'index.html':urlPath));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`PaveData Atlas: http://127.0.0.1:${port}`));
