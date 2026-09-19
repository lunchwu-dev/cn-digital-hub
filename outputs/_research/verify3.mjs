import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9466;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'vfy3-'));
const lines = []; const log = (...a) => lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));

const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`, '--window-size=1440,1400', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitJson(p, tries = 80) { for (let i = 0; i < tries; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}${p}`); if (r.ok) return await r.json(); } catch { } await sleep(500); } throw new Error('nope'); }
let msgId = 0;
function mkcdp(ws) {
  const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  return (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, m => m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); });
}

try {
  await waitJson('/json/version');
  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(BASE), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const send = mkcdp(ws);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(6000);
  try { await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close')?.click()` }); } catch { }
  await sleep(500);

  // ---- 信息中心 ----
  await send('Runtime.evaluate', { expression: `location.hash='#/news'` });
  await sleep(1800);
  let s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(DIR, 'zz-news.png'), Buffer.from(s.data, 'base64'));

  // ---- FAQ tab + 展开 ----
  await send('Runtime.evaluate', { expression: `location.hash='#/knowledge'` });
  await sleep(1600);
  const tabRes = await send('Runtime.evaluate', {
    expression: `(() => { const t=[...document.querySelectorAll('.ant-tabs-tab')].find(e=>e.innerText.trim().startsWith('FAQ')); if(!t) return 'no-tab'; t.click(); return 'clicked'; })()`, returnByValue: true
  });
  log('FAQ tab:', tabRes.result.value);
  await sleep(1500);

  const before = await send('Runtime.evaluate', { expression: `document.getElementById('root').innerText`, returnByValue: true });
  log('\n--- FAQ tab 文案 ---\n' + before.result.value.replace(/\n+/g, '\n'));

  // 展开第一个 FAQ 条目
  const exp = await send('Runtime.evaluate', {
    expression: `(() => {
      const cands = [...document.querySelectorAll('.ant-collapse-header, .ant-list-item, [class*=faq] , .ant-card-head, .ant-typography')];
      const hit = cands.find(e => /权限|SSO|流程|如何/.test(e.innerText||''));
      if (!hit) return 'no-item';
      hit.click();
      return 'clicked:' + (hit.innerText||'').slice(0,30).replace(/\\n/g,' ');
    })()`, returnByValue: true
  });
  log('\n展开条目:', exp.result.value);
  await sleep(1500);

  const after = await send('Runtime.evaluate', {
    expression: `(() => { const t=document.getElementById('root').innerText; return JSON.stringify({ hasFeedback: /这个回答有用吗|有用|没帮到/.test(t), hasQueue: /待补知识/.test(t), snippet: (t.match(/.{0,80}(这个回答有用吗|没帮到).{0,120}/)||[''])[0] }); })()`, returnByValue: true
  });
  log('展开后检查:', after.result.value);

  s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(DIR, 'zz-faq-expanded.png'), Buffer.from(s.data, 'base64'));

  // ---- news Release tab ----
  await send('Runtime.evaluate', { expression: `location.hash='#/news'` });
  await sleep(1400);
  await send('Runtime.evaluate', { expression: `(() => { const t=[...document.querySelectorAll('.ant-tabs-tab')].find(e=>e.innerText.trim().startsWith('产品 Release')); if(t) t.click(); })()` });
  await sleep(1400);
  const rel = await send('Runtime.evaluate', { expression: `document.getElementById('root').innerText.replace(/\n+/g,' | ')`, returnByValue: true });
  log('\n--- Release tab 文案 ---\n' + rel.result.value);
  s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(DIR, 'zz-news-release.png'), Buffer.from(s.data, 'base64'));

  ws.close();
} catch (e) { log('FATAL ' + String(e && e.stack || e)); }
finally { try { child.kill(); } catch { } writeFileSync(join(DIR, 'verify3.txt'), lines.join('\n'), 'utf8'); console.log('done'); process.exit(0); }
