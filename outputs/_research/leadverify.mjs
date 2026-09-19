import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9477;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'lv-'));

const L = []; const log = (...a) => L.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));
const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`, '--window-size=1440,1200', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitJson(p, t = 80) { for (let i = 0; i < t; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}${p}`); if (r.ok) return await r.json(); } catch { } await sleep(500); } throw new Error('devtools'); }
let mid = 0;
function mk(ws) {
  const p = new Map(); const ev = [];
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } else if (m.method) ev.push(m); });
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++mid; p.set(id, m => m.error ? rej(new Error(method + ':' + JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); });
  return { send, ev };
}

const PROBE = (route) => `(() => {
  const R = '${route}';
  const de = document.documentElement;
  const q = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const T = t => document.body.innerText.includes(t);
  const shell = q('.dp-shell');
  const conts = all('.dp-container');
  const o = {
    route: R,
    shellLeft: shell ? Math.round(shell.getBoundingClientRect().left) : null,
    containerLefts: conts.map(e => Math.round(e.getBoundingClientRect().left)),
    hScroll: de.scrollWidth > de.clientWidth + 2,
    scrollW: de.scrollWidth, clientW: de.clientWidth,
  };
  if (R === 'fonts') {
    o.roboto = document.fonts.check('14px Roboto');
    o.robotoMono = document.fonts.check('14px "Roboto Mono"');
    o.roboto500 = document.fonts.check('500 14px Roboto');
    o.faces = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })
      .filter(r => r.constructor.name === 'CSSFontFaceRule').map(r => r.style.fontFamily + '/' + r.style.fontWeight);
  }
  if (R === 'contrast') {
    const el = all('*').find(e => (e.textContent || '').includes('脚本示例'));
    if (el) { const s = getComputedStyle(el); o.disclaimer = { color: s.color, fontSize: s.fontSize, text: el.textContent.trim().slice(0, 40) }; }
    o.msCount = (document.body.innerText.match(/单位\\s*ms/g) || []).length;
    o.enterPromise = T('回车打开首条');
  }
  if (R === '404') {
    o.hasResultIllustration = !!q('.ant-result-image, .ant-result-icon svg, .ant-result-icon img');
    o.html = document.body.innerHTML;
    o.multiColor = (document.body.innerHTML.match(/#1677ff|#7BB2F9|#5BA02E/gi) || []).length;
    o.imgs = all('img').length;
    o.svgPaths = all('svg').length;
  }
  if (R === 'charts') {
    const bars = all('svg [class*=bar], svg rect').filter(e => { const r = e.getBoundingClientRect(); return r.width > 3 && r.width < 60 && r.height > 3; });
    const fills = {};
    bars.forEach(b => { const f = b.getAttribute('fill') || getComputedStyle(b).fill; fills[f] = (fills[f] || 0) + 1; });
    o.barFills = fills;
  }
  return JSON.stringify(o);
})()`;

async function setW(send, w, h = 1200) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(700);
}
async function evalTo(send, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  return r.result.value;
}

try {
  await waitJson('/json/version');
  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(BASE), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const { send, ev } = mk(ws);
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(6500);
  try { await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close')?.click()` }); } catch { }
  await sleep(500);

  log('===== 1. 字体实际加载 =====');
  log(await evalTo(send, PROBE('fonts')));

  log('\n===== 2. 栅格对齐（.dp-shell vs .dp-container 左边界）=====');
  for (const w of [1280, 1440, 1920]) {
    await setW(send, w);
    await send('Runtime.evaluate', { expression: `location.hash='#/home'` }); await sleep(1200);
    const v = JSON.parse(await evalTo(send, PROBE('home')));
    const allEqual = [v.shellLeft, ...v.containerLefts].every(x => x === v.shellLeft);
    log(`[${allEqual ? 'PASS' : 'FAIL'}] ${w}px   shell=${v.shellLeft}  containers=${JSON.stringify(v.containerLefts)}  hScroll=${v.hScroll}`);
  }

  log('\n===== 3. 404 空态是否残留 antd 内置插画 =====');
  await setW(send, 1440);
  await send('Runtime.evaluate', { expression: `location.hash='#/nope-404'` }); await sleep(1600);
  const nf = JSON.parse(await evalTo(send, PROBE('404')));
  log(`[${!nf.hasResultIllustration && nf.multiColor === 0 ? 'PASS' : 'FAIL'}] antdIllustration=${nf.hasResultIllustration} 站外色命中=${nf.multiColor} <img>=${nf.imgs} <svg>=${nf.svgPaths}`);

  log('\n===== 4. 图表柱色（P95 应为单色品牌蓝 / 告警分布单色）=====');
  await send('Runtime.evaluate', { expression: `location.hash='#/ops'` }); await sleep(2200);
  const ch = JSON.parse(await evalTo(send, PROBE('charts')));
  log(`barFills=${JSON.stringify(ch.barFills)}`);

  log('\n===== 5. 文案与对比度 =====');
  await send('Runtime.evaluate', { expression: `location.hash='#/home'` }); await sleep(1200);
  await evalTo(send, `(()=>{const b=[...document.querySelectorAll('button,span')].find(e=>/Agent for Digital/.test(e.innerText||'')); b&&b.click();})()`);
  await sleep(1500);
  const ct = JSON.parse(await evalTo(send, PROBE('contrast')));
  log(`免责句: ${JSON.stringify(ct.disclaimer)}`);
  log(`「单位 ms」全页出现次数 = ${ct.msCount}`);
  log(`「回车打开首条」文案存在 = ${ct.enterPromise}`);

  log('\n===== 6. 各档横向溢出 =====');
  for (const w of [375, 768, 1440, 1920]) {
    await setW(send, w);
    const bad = [];
    for (const h of ['home', 'news', 'ops', 'knowledge', 'workspace']) {
      await send('Runtime.evaluate', { expression: `location.hash='#/${h}'` }); await sleep(900);
      const v = JSON.parse(await evalTo(send, PROBE(h)));
      if (v.hScroll) bad.push(`${h}(scrollW=${v.scrollW}>${v.clientW})`);
    }
    log(`[${bad.length ? 'FAIL' : 'PASS'}] ${w}px  ` + (bad.length ? JSON.stringify(bad) : '无横向溢出'));
  }

  const errs = ev.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'))
    .map(e => e.method === 'Runtime.exceptionThrown' ? 'EXC:' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text) : ('LOG:' + (e.params.entry?.text || '')));
  log('\n===== 7. 控制台错误 =====');
  log(errs.length ? errs.slice(0, 15).join('\n') : '无（0 条）');

  ws.close();
} catch (e) { log('FATAL ' + String(e && e.stack || e)); }
finally { try { child.kill(); } catch { } writeFileSync(join(DIR, 'lead-verify.txt'), L.join('\n'), 'utf8'); console.log('done'); process.exit(0); }
