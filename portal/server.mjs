/**
 * 单端口静态服务：把 portal/dist 以 HTTP 方式暴露出去（供公网发布用）。
 *
 * 约定：必须监听 PORT 环境变量并绑定 0.0.0.0，否则反向代理接不进来。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Bad Request');
  }

  console.log(`[req] ${req.method} ${pathname}`);

  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    const fallback = join(ROOT, 'index.html');
    if (!existsSync(fallback)) return send(res, 404, 'Not Found');
    filePath = fallback;
  }

  const stream = createReadStream(filePath);
  stream.on('error', () => send(res, 500, 'Internal Server Error'));
  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  stream.pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[portal] listening on ${HOST}:${PORT}`);
  console.log(`[portal] ROOT resolved to: ${ROOT}`);
  console.log(`[portal] index.html present: ${existsSync(join(ROOT, 'index.html'))}`);
});

server.on('error', (err) => {
  console.error('[portal] server error:', err.message);
  process.exit(1);
});

['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => {
    console.log(`[portal] received ${sig}, closing`);
    server.close(() => process.exit(0));
  });
});
