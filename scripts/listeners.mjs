// The live listeners count of piabrota RADIO: a small server, with no
// dependency, that the radio talks to over Server-Sent Events.
//
//   GET /live/radio   one listener, for as long as the connection stays
//                     open; the server sends the count to every listener
//                     each time it changes, and a comment every 25 s so
//                     proxies keep the connection.
//   GET /live/health  "ok"
//
// It keeps nothing: no log of who listened, no address, no cookie. Run it
// beside the static site, behind the same name, with the proxy passing
// /live/ through unbuffered (piabrota/nix-os does this on piabrota2).
//
//   PORT=8787 HOST=127.0.0.1 MAX=2000 node scripts/listeners.mjs
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787), HOST = process.env.HOST ?? '127.0.0.1', MAX = Number(process.env.MAX ?? 2000);
const clients = new Set();
const send = (res, n) => res.write(`data: ${n}\n\n`);
const broadcast = () => { for (const res of clients) send(res, clients.size); };

const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (req.method === 'GET' && path === '/live/health') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }
  if (req.method !== 'GET' || path !== '/live/radio') { res.writeHead(404); res.end(); return; }
  if (clients.size >= MAX) { res.writeHead(503, { 'retry-after': '60' }); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  res.write('retry: 10000\n\n');
  clients.add(res); broadcast();
  req.on('close', () => { clients.delete(res); broadcast(); });
});
setInterval(() => { for (const res of clients) res.write(': still here\n\n'); }, 25000).unref();
server.listen(PORT, HOST, () => console.log(`listeners on http://${HOST}:${PORT}/live/radio`));
