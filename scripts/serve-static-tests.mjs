import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('out');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  const body=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{
  try{res.writeHead(404,{'Content-Type':mime['.html']});res.end(await fs.readFile(path.join(root,'404.html')));}
  catch{res.writeHead(404).end('Not found');}
 }
}).listen(3017,'127.0.0.1');
