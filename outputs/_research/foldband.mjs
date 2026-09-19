import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9485;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'fb-'));
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
  const tb = document.querySelector('.dp-topbar');
  const inner = document.querySelector('.dp-topbar-inner');
  const vis = e => { if (!e) return null; const s = getComputedStyle(e); return s.display !== 'none'; };
  const w = e => e ? Math.round(e.getBoundingClientRect().width) : null;
  const kids = inner ? [...inner.children] : [];
  return JSON.stringify({
    vw: de.clientWidth,
    scrollW: de.scrollWidth,
    tbH: tb ? Math.round(tb.getBoundingClientRect().height) : null,
    innerH: inner ? Math.round(inner.getBoundingClientRect().height) : null,
    innerW: w(inner),
    navText: vis(document.querySelector('.dp-nav-text')),
    searchLabel: vis(document.querySelector('.dp-search-label')),
    agentLabel: vis(document.querySelector('.dp-agent-label')),
    logoSub: vis(document.querySelector('.dp-logo-sub')),
    pillW: w(document.querySelector('.dp-search-pill')),
    navW: w(document.querySelector('nav.dp-nav')),
    logoW: w(document.querySelector('.dp-logo')),
    actW: w(document.querySelector('.dp-topbar-actions')),
    kidTops: kids.map(e => Math.round(e.getBoundingClientRect().top)),
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

  const rows = [];
  for (let vw = 360; vw <= 1440; vw += 4) {
    await send('Emulation.setDeviceMetricsOverride', { width: vw, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(180);
    const v = JSON.parse((await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value);
    rows.push(v);
  }
  // 归纳为"带"：把连续相同特征合并成区间
  const sig = v => [v.tbH, v.navText, v.searchLabel, v.agentLabel, v.logoSub, v.scrollW === v.vw ? 'OK' : 'OVF'].join('|');
  const bands = [];
  for (const v of rows) {
    const s = sig(v);
    const last = bands[bands.length - 1];
    if (last && last.sig === s) last.to = v.vw;
    else bands.push({ from: v.vw, to: v.vw, sig: s });
  }
  log('=== 顶栏形态带（desktop emulation, 360→1440 步进 4）===');
  log('列: 宽度区间 | topbarH | navText | searchLabel | agentLabel | logoSub | 溢出');
  for (const b of bands) {
    const [h, nt, sl, al, ls, ov] = b.sig.split('|');
    log(`${b.from}–${b.to}`.padEnd(13) + `| h=${h}`.padEnd(11) + `| navText=${nt}`.padEnd(19) + `| searchLabel=${sl}`.padEnd(22) + `| agentLabel=${al}`.padEnd(21) + `| logoSub=${ls}`.padEnd(17) + `| ${ov}`);
  }
  log('');
  log('=== 折行带细节（tbH 变化点前后）===');
  let prev = null;
  for (const v of rows) {
    if (prev === null || v.tbH !== prev) {
      log(`vw=${v.vw}  tbH=${v.tbH} innerH=${v.innerH} navW=${v.navW} logoW=${v.logoW} actW=${v.actW} pillW=${v.pillW} scrollW=${v.scrollW}`);
    }
    prev = v.tbH;
  }
  // 内容不变式：全展开态最小可用宽度
  const expanded = rows.filter(v => v.navText === true);
  const minExpanded = expanded.length ? Math.min(...expanded.map(v => v.vw)) : null;
  log('');
  log(`全展开（navText=true）最小宽度 = ${minExpanded}`);

  // 连续溢出断言：step 1
  log('');
  log('=== 连续溢出扫描 step=1 (375→1920) ===');
  const bad = [];
  for (let vw = 375; vw <= 1920; vw += 1) {
    await send('Emulation.setDeviceMetricsOverride', { width: vw, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(60);
    const v = JSON.parse((await send('Runtime.evaluate', { expression: `(()=>{const d=document.documentElement;return JSON.stringify({s:d.scrollWidth,c:d.clientWidth})})()`, returnByValue: true })).result.value);
    if (v.s > v.c) bad.push(`${vw}(${v.s}>${v.c})`);
  }
  log(bad.length ? `[FAIL] 溢出档位 ${bad.length} 个: ${bad.slice(0, 40).join(' ')}` : '[OK] 1546 档全部 scrollWidth <= clientWidth');

  ws.close();
} catch (e) { log('FATAL ' + String(e && e.stack || e)); }
finally { try { child.kill(); } catch { } writeFileSync(join(DIR, 'foldband.txt'), L.join('\n'), 'utf8'); console.log('done'); process.exit(0); }
