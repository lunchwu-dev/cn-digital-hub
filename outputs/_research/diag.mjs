import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9488;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'diag-'));
const L = []; const log = (...a) => L.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));

const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`, '--window-size=1440,1200', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitJson(p, t = 80) { for (let i = 0; i < t; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}${p}`); if (r.ok) return await r.json(); } catch { } await sleep(500); } throw new Error('devtools'); }
let mid = 0;
function mk(ws) {
  const p = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  return (method, params = {}) => new Promise((res, rej) => { const id = ++mid; p.set(id, m => m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); });
}

const DIAG = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 || r.right > vw + 1) {
      out.push({
        tag: el.tagName,
        cls: (el.getAttribute('class')||'').slice(0,60),
        id: el.id || '',
        w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right),
        txt: (el.innerText||'').replace(/\\s+/g,' ').slice(0,40),
        depth: (()=>{let d=0,n=el;while(n.parentElement){d++;n=n.parentElement}return d})()
      });
    }
  }
  out.sort((a,b)=> b.w - a.w);
  return JSON.stringify({
    vw,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    top: out.slice(0, 18),
    total: out.length,
    mediaQueries: [...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return[]}})
      .filter(r=>r.media).map(r=>r.media.mediaText).filter((v,i,a)=>a.indexOf(v)===i).slice(0,20),
    shellCSS: (()=>{const s=document.querySelector('.dp-shell'); if(!s) return null; const c=getComputedStyle(s); return {maxW:c.maxWidth,minW:c.minWidth,pad:c.padding,mar:c.margin,w:Math.round(s.getBoundingClientRect().width)};})(),
    topbarCSS: (()=>{const s=document.querySelector('.dp-container'); if(!s) return null; const c=getComputedStyle(s); return {maxW:c.maxWidth,minW:c.minWidth,pad:c.padding,w:Math.round(s.getBoundingClientRect().width)};})(),
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
  await sleep(6500);
  try { await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close')?.click()` }); } catch { }
  await sleep(400);

  for (const w of [375, 768]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await sleep(900);
    for (const r of ['home', 'workspace', 'ops']) {
      await send('Runtime.evaluate', { expression: `location.hash='#/${r}'` });
      await sleep(1200);
      const v = JSON.parse((await send('Runtime.evaluate', { expression: DIAG, returnByValue: true })).result.value);
      log(`\n##### ${w}px  #/${r}  vw=${v.vw} docScrollW=${v.docScrollW} 溢出元素数=${v.total}`);
      log('  .dp-shell: ' + JSON.stringify(v.shellCSS));
      log('  .dp-container: ' + JSON.stringify(v.topbarCSS));
      log('  媒体查询断点: ' + JSON.stringify(v.mediaQueries));
      log('  最宽的元素:');
      for (const e of v.top.slice(0, 8)) log(`    w=${e.w} left=${e.left} right=${e.right} d=${e.depth} <${e.tag} class="${e.cls}"> "${e.txt}"`);
    }
  }
  ws.close();
} catch (e) { log('FATAL ' + String(e && e.stack || e)); }
finally { try { child.kill(); } catch { } writeFileSync(join(DIR, 'diag.txt'), L.join('\n'), 'utf8'); console.log('done'); process.exit(0); }
