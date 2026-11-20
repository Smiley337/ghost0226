// 저장소 루트를 제공하는 로컬 확인용 서버입니다. 설치나 빌드가 필요 없습니다.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  let filename = path.resolve(root, '.' + pathname);
  if (filename !== root && !filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  if (fs.existsSync(filename) && fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
  fs.readFile(filename, (error, data) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(data);
  });
});
server.listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173/dice/'));
