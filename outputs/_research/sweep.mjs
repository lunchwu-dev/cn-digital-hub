import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9483;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'sw-'));
const L = []; const log = (...a) => L.push(a.map(String).join(' '));
const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`, '--window-size=1440,1200', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitJson(p, t = 80) { for (let i = 0; i < t; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}${p}`); if (r.ok) return await r.json(); } catch { } await sleep(500); } throw new Error('devtools'); }
let mid = 0;
function mk(ws) {
  const p = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  return (method, params = {}) => new Promise((res, rej) => { const id = ++mid; p.set(id, m => m.error ? rej(new Error(method + JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); });
}
const PROBE = `(() => {
  const de = document.documentElement;
  const inner = document.querySelector('.dp-topbar-inner');
  const kids = inner ? [...inner.children] : [];
  const w = e => e ? Math.round(e.getBoundingClientRect().width) : null;
  return JSON.stringify({
    vw: de.clientWidth,
    scrollW: de.scrollWidth,
    overflow: de.scrollWidth - de.clientWidth,
    innerW: w(inner),
    innerKids: kids.map(e => (e.className || e.tagName) + '=' + w(e)),
    pagPad: inner ? getComputedStyle(inner).paddingLeft + '/' + getComputedStyle(inner).paddingRight : null,
  });
})()`;

try {
  await waitJson('/json/version');
  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(BASE), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const send = mk(ws);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(7000);
  try { await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close')?.click()` }); } catch { }
  await sleep(600);

  log('宽度扫描（#/home，desktop emulation）—— 找全展开顶栏的最小可用宽度');
  log('vw     scrollW  overflow  innerW  topbar子元素宽度');
  for (const vw of [1000, 1024, 1100, 1152, 1200, 1240, 1250, 1260, 1264, 1268, 1269, 1270, 1272, 1280, 1290, 1366, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width: vw, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(650);
    const v = JSON.parse((await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value);
    log(String(vw).padEnd(6) + String(v.scrollW).padEnd(9) + String(v.overflow).padEnd(10) + String(v.innerW).padEnd(8) + (v.innerKids || []).join('  '));
  }
  ws.close();
} catch (e) { log('FATAL ' + String(e && e.stack || e)); }
finally { try { child.kill(); } catch { } writeFileSync(join(DIR, 'sweep.txt'), L.join('\n'), 'utf8'); console.log('done'); process.exit(0); }
