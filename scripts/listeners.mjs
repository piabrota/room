// The live listeners count of piabrota RADIO: a small server, with no
// dependency, that the radio talks to over Server-Sent Events.
//
//   GET /live/radio   one listener, for as long as the connection stays
//                     open; the server sends the count to every listener
//                     each time it changes, and a comment every 25 s so
//                     proxies keep the connection.
//   GET /live/health  "ok"
//   POST /live/door   the room's door (src/lock.js): {"email": "..."} from a visitor who wants
//                     to try its lock. The address is appended, with the time, to DOOR_FILE
//                     (a TSV); nothing else about the visitor is kept. 204 when kept, 400 for
//                     a body that is not an email, 413 past 1 kB, 429 past LIMIT a minute.
//
// For the radio it keeps nothing: no log of who listened, no address, no cookie. Run it
// beside the static site, behind the same name, with the proxy passing
// /live/ through unbuffered (piabrota/nix-os does this on piabrota2).
//
//   PORT=8787 HOST=127.0.0.1 MAX=2000 DOOR_FILE=/var/lib/room/door.tsv node scripts/listeners.mjs
import { createServer } from 'node:http';
import { appendFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT ?? 8787), HOST = process.env.HOST ?? '127.0.0.1', MAX = Number(process.env.MAX ?? 2000);
const DOOR_FILE = process.env.DOOR_FILE ?? 'door.tsv', LIMIT = Number(process.env.LIMIT ?? 30);
const clients = new Set();
let minute = 0, posts = 0; // every visitor shares one budget a minute: enough for people, too little for a flood
const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,24}$/i;
function door(req, res) {
  const now = Math.floor(Date.now() / 60000); if (now !== minute) { minute = now; posts = 0; }
  if (++posts > LIMIT) { res.writeHead(429, { 'retry-after': '60' }); res.end(); return; }
  let body = '', big = false;
  req.on('data', (c) => { if (big) return; body += c; if (body.length > 1024) { big = true; res.writeHead(413, { connection: 'close' }); res.end(); } });
  req.on('end', async () => {
    if (big) return;
    let email = '';
    try { email = String(JSON.parse(body).email ?? '').trim(); } catch { /* not JSON */ }
    if (!EMAIL.test(email)) { res.writeHead(400); res.end(); return; }
    try { await appendFile(DOOR_FILE, `${new Date().toISOString()}\t${email.toLowerCase()}\n`); res.writeHead(204); res.end(); }
    catch { res.writeHead(500); res.end(); }
  });
}
const send = (res, n) => res.write(`data: ${n}\n\n`);
const broadcast = () => { for (const res of clients) send(res, clients.size); };

const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (req.method === 'GET' && path === '/live/health') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }
  if (req.method === 'POST' && path === '/live/door') { door(req, res); return; }
  if (req.method !== 'GET' || path !== '/live/radio') { res.writeHead(404); res.end(); return; }
  if (clients.size >= MAX) { res.writeHead(503, { 'retry-after': '60' }); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  res.write('retry: 10000\n\n');
  clients.add(res); broadcast();
  req.on('close', () => { clients.delete(res); broadcast(); });
});
setInterval(() => { for (const res of clients) res.write(': still here\n\n'); }, 25000).unref();
server.listen(PORT, HOST, () => console.log(`listeners on http://${HOST}:${PORT}/live/radio, the door on /live/door into ${DOOR_FILE}`));
