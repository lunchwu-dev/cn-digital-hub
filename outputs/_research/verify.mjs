import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9444;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'vfy-'));

const lines = [];
const log = (...a) => lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));

const ROUTES = [
  ['home', '首页 · 今日 Hub', ['今日 Hub', '置顶决议', '健康度快照', '核心系统可用性', 'Agent for Digital', '近期 Release', '里程碑精选']],
  ['news', '信息中心', ['信息中心', '公告与决议', '产品 Release', '项目动态']],
  ['ops', '监控运营', ['监控运营', '稳定性状态', 'Grafana', 'L1']],
  ['knowledge', '知识中心', ['知识中心', '最佳实践', '待补知识']],
  ['knowledge/article/bp-stock-dedup', '文章详情', ['本文目录']],
  ['workspace', '工作台', ['工作台', '工具导航', '组织速查', '需求提交', 'Owner']],
  ['nope-404', '404', ['404']],
];

const child = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`,
  '--window-size=1440,1200', '--hide-scrollbars', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitJson(path, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`); if (r.ok) return await r.json(); } catch { }
    await sleep(500);
  }
  throw new Error('devtools not ready');
}

let msgId = 0;
function mkcdp(ws) {
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) events.push(m);
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, m => m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result));
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { send, events };
}

try {
  const ver = await waitJson('/json/version');
  log('Chrome:', ver.Browser);

  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(BASE), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const { send, events } = mkcdp(ws);

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(6000);

  const check = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      origin: location.origin,
      rootLen: (document.getElementById('root')||{}).innerText ? document.getElementById('root').innerText.length : 0,
      scripts: [...document.querySelectorAll('script')].map(s => ({ src: s.src.slice(-30), type: s.type || '(none)', defer: s.defer })),
      stylesheets: document.styleSheets.length,
      hasModule: document.documentElement.innerHTML.includes('type="module"'),
      hasCrossorigin: /<script[^>]*crossorigin/.test(document.documentElement.innerHTML),
      topbarBg: (() => { const h = document.querySelector('header'); return h ? getComputedStyle(h).backgroundColor : null; })(),
      fontUsed: getComputedStyle(document.body).fontFamily.slice(0, 60),
      btnRadius: (() => { const b = document.querySelector('.ant-btn'); return b ? getComputedStyle(b).borderRadius : null; })(),
      cardRadius: (() => { const c = document.querySelector('.ant-card'); return c ? getComputedStyle(c).borderRadius : null; })(),
      primary: (() => { const b = document.querySelector('.ant-btn-primary'); return b ? getComputedStyle(b).backgroundColor : null; })(),
    })`, returnByValue: true
  });
  log('\n===== 首屏加载核验 (file://) =====');
  log(check.result.value);

  log('\n===== 路由逐条实机渲染 =====');
  for (const [hash, name, expects] of ROUTES) {
    await send('Runtime.evaluate', { expression: `location.hash = '#/${hash}'` });
    await sleep(2000);
    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('root');
        const txt = el ? el.innerText : '';
        return JSON.stringify({ name: ${JSON.stringify(name)}, len: txt.length, src: txt.slice(0, 220).replace(/\\n/g, ' | ') });
      })()`, returnByValue: true
    });
    const o = JSON.parse(r.result.value);
    const miss = expects.filter(e => !o.src.includes(e));
    log(`[${miss.length ? 'FAIL' : 'PASS'}] #/${hash}  ${name}  len=${o.len}` + (miss.length ? `  MISSING=${JSON.stringify(miss)}` : ''));
    log(`        ${o.src}`);

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(DIR, hash.replace(/\//g, '_') + '.png'), Buffer.from(shot.data, 'base64'));
  }

  const errs = events.filter(e =>
    e.method === 'Runtime.exceptionThrown' ||
    (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') ||
    (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error')
  ).map(e => {
    if (e.method === 'Runtime.exceptionThrown') return 'EXC: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text);
    if (e.method === 'Log.entryAdded') return 'LOG: ' + e.params.entry.text;
    return 'CONSOLE: ' + (e.params.args || []).map(a => a.value ?? a.description).join(' ');
  });
  log('\n===== 控制台错误 =====');
  log(errs.length ? errs.join('\n') : '无（0 条）');

  // route back to home for a clean hero shot
  await send('Runtime.evaluate', { expression: `location.hash = '#/home'` });
  await sleep(2500);
  try {
    await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close, .ant-tour .ant-btn')?.click()` });
  } catch { }
  await sleep(800);
  const hero = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(DIR, 'zz-home-hero.png'), Buffer.from(hero.data, 'base64'));

  ws.close();
} catch (e) {
  log('FATAL ' + String(e && e.stack || e));
} finally {
  try { child.kill(); } catch { }
  writeFileSync(join(DIR, 'verify.txt'), lines.join('\n'), 'utf8');
  console.log('done');
  process.exit(0);
}
