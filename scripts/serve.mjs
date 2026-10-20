import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve(process.env.SERVE_DIR || '.');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.bin':'application/octet-stream'};
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (!(await stat(path)).isFile()) throw Error();
    res.writeHead(200, {'Content-Type': types[extname(path)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(path));
  } catch {res.writeHead(404, {'Content-Type':'text/plain'}).end('Not found');}
}).listen(Number(process.env.PORT || 4173),'0.0.0.0',()=>console.log('Raydin Labs preview: http://localhost:' + (process.env.PORT || 4173)));
