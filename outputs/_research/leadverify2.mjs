import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9481;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'lv2-'));

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
  const vis = e => { if (!e) return null; const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden'; };
  const o = {
    route: R,
    hScroll: de.scrollWidth > de.clientWidth + 2,
    scrollW: de.scrollWidth, clientW: de.clientWidth,
  };
  if (R === 'chrome') {
    const tb = q('.dp-topbar');
    const inner = q('.dp-topbar-inner');
    o.topbarH = tb ? Math.round(tb.getBoundingClientRect().height) : null;
    o.innerH = inner ? Math.round(inner.getBoundingClientRect().height) : null;
    o.navTextVisible = vis(q('.dp-nav-text'));
    o.searchLabelVisible = vis(q('.dp-search-label'));
    o.agentLabelVisible = vis(q('.dp-agent-label'));
    o.logoSubVisible = vis(q('.dp-logo-sub'));
    const sp = q('.dp-search-pill');
    o.searchPillW = sp ? Math.round(sp.getBoundingClientRect().width) : null;
    o.rawTabIndexInTopbar = all('.dp-topbar [tabindex]').length;
    o.topbarButtons = all('.dp-topbar button').length;
    o.footerText = (document.body.innerText.match(/示意数据[^\\n]*/g) || []).join(' | ');
  }
  if (R === 'fonts') {
    o.roboto = document.fonts.check('14px Roboto');
    o.robotoMono = document.fonts.check('14px "Roboto Mono"');
    o.roboto500 = document.fonts.check('500 14px Roboto');
    o.faces = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })
      .filter(r => r.constructor.name === 'CSSFontFaceRule').map(r => r.style.fontFamily + '/' + r.style.fontWeight);
  }
  if (R === '404') {
    o.hasResultIllustration = !!q('.ant-result-image, .ant-result-icon svg, .ant-result-icon img');
    o.multiColor = (document.body.innerHTML.match(/#1677ff|#7BB2F9|#5BA02E/gi) || []).length;
    o.imgs = all('img').length;
  }
  if (R === 'charts') {
    const bars = all('svg rect').filter(e => { const r = e.getBoundingClientRect(); return r.width > 3 && r.width < 90 && r.height > 3; });
    const fills = {};
    bars.forEach(b => { const f = b.getAttribute('fill') || getComputedStyle(b).fill; fills[f] = (fills[f] || 0) + 1; });
    o.barFills = fills;
    o.unitMsCount = (document.body.innerText.match(/单位\\s*ms/g) || []).length;
  }
  if (R === 'feedback') {
    o.modalOpen = !!q('.ant-modal-title');
    o.modalTitle = (q('.ant-modal-title') || {}).textContent || null;
    o.hasTextarea = !!q('.ant-modal textarea');
    o.hasSelect = !!q('.ant-modal .ant-select');
  }
  return JSON.stringify(o);
})()`;

async function setW(send, w, mobile = false, h = 1200) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await sleep(800);
}
async function evalTo(send, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result.value;
}
async function goto(send, hash, wait = 1100) {
  await send('Runtime.evaluate', { expression: `location.hash='#/${hash}'` });
  await sleep(wait);
}

try {
  await waitJson('/json/version');
  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(BASE), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const { send, ev } = mk(ws);
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(7000);
  try { await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close')?.click()` }); } catch { }
  await sleep(600);

  log('===== A. 字体实际加载（file:// 下自托管 woff2）=====');
  log(await evalTo(send, PROBE('fonts')));

  log('\n===== B. 横向溢出（375/768 用 desktop 与 mobile 两种 emulation 各测一遍）=====');
  for (const [w, mob] of [[375, false], [375, true], [768, false], [768, true], [1024, false], [1280, false], [1440, false], [1920, false]]) {
    await setW(send, w, mob);
    const bad = [];
    for (const h of ['home', 'news', 'ops', 'knowledge', 'workspace']) {
      await goto(send, h, 850);
      const v = JSON.parse(await evalTo(send, PROBE(h)));
      if (v.hScroll) bad.push(`${h}(${v.scrollW}>${v.clientW})`);
    }
    log(`[${bad.length ? 'FAIL' : 'PASS'}] ${w}px mobile=${mob}  ` + (bad.length ? JSON.stringify(bad) : '全部路由 scrollWidth === clientWidth'));
  }

  log('\n===== C. 顶栏折叠状态 vs 断点 =====');
  for (const [w, mob] of [[375, true], [768, true], [1024, false], [1440, false]]) {
    await setW(send, w, mob);
    await goto(send, 'home', 900);
    const v = JSON.parse(await evalTo(send, PROBE('chrome')));
    log(`${w}px mobile=${mob}  topbarH=${v.topbarH} innerH=${v.innerH} searchPillW=${v.searchPillW}  navText=${v.navTextVisible} searchLabel=${v.searchLabelVisible} agentLabel=${v.agentLabelVisible} logoSub=${v.logoSubVisible}  顶栏内原生tabindex元素=${v.rawTabIndexInTopbar} 顶栏button数=${v.topbarButtons}`);
  }

  log('\n===== D. 页脚演示数据披露 =====');
  await setW(send, 1440);
  await goto(send, 'home', 900);
  log('页脚命中: ' + JSON.parse(await evalTo(send, PROBE('chrome'))).footerText);

  log('\n===== E. 404 空态 =====');
  await goto(send, 'nope-404', 1500);
  const nf = JSON.parse(await evalTo(send, PROBE('404')));
  log(`[${!nf.hasResultIllustration && nf.multiColor === 0 ? 'PASS' : 'FAIL'}] antd插画=${nf.hasResultIllustration} 站外色命中=${nf.multiColor} <img>=${nf.imgs}`);

  log('\n===== F. 监控页图表柱色 + 单位出现次数 =====');
  await goto(send, 'ops', 2200);
  const ch = JSON.parse(await evalTo(send, PROBE('charts')));
  log(`barFills=${JSON.stringify(ch.barFills)}   「单位 ms」出现 ${ch.unitMsCount} 次`);

  log('\n===== G. 咖啡杯反馈入口是否真能打开 Modal（键盘可达）=====');
  await goto(send, 'home', 1200);
  const opened = await evalTo(send, `(()=>{const b=[...document.querySelectorAll('.dp-topbar button')].find(e=>/反馈/.test(e.getAttribute('aria-label')||'')); if(!b) return 'NOT_FOUND'; b.click(); return 'CLICKED';})()`);
  log('触发: ' + opened);
  await sleep(1400);
  const fb = JSON.parse(await evalTo(send, PROBE('feedback')));
  log(`[${fb.modalOpen && fb.hasTextarea ? 'PASS' : 'FAIL'}] modal=${fb.modalOpen} title=${JSON.stringify(fb.modalTitle)} textarea=${fb.hasTextarea} select=${fb.hasSelect}`);

  const errs = ev.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'))
    .map(e => e.method === 'Runtime.exceptionThrown' ? 'EXC:' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text) : ('LOG:' + (e.params.entry?.text || '')));
  log('\n===== H. 控制台错误 =====');
  log(errs.length ? errs.slice(0, 15).join('\n') : '无（0 条）');

  ws.close();
} catch (e) { log('FATAL ' + String(e && e.stack || e)); }
finally { try { child.kill(); } catch { } writeFileSync(join(DIR, 'lead-verify2.txt'), L.join('\n'), 'utf8'); console.log('done'); process.exit(0); }
