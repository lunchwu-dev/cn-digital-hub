import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9455;
const BASE = 'file:///C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify';
mkdirSync(DIR, { recursive: true });
const udd = mkdtempSync(join(tmpdir(), 'vfy2-'));

const lines = [];
const log = (...a) => lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));

const CASES = [
  { hash: 'home', tab: null, want: ['今日 Hub', '置顶决议', '健康度快照', '核心系统可用性', '平均响应时间', '错误率', '错误预算', 'Agent for Digital', '近期 Release', '里程碑精选', '快捷入口', '内容负责人', '最后更新'] },
  { hash: 'news', tab: null, want: ['信息中心', '公告与决议', '产品 Release', '项目动态', '内容负责人'] },
  { hash: 'news', tab: '产品 Release', want: ['版本号', '变更项', '状态', 'Grafana'] },
  { hash: 'ops', tab: null, want: ['监控运营', 'L1 健康度概览', '稳定性状态', 'Grafana', '手动刷新', '错误预算', '无法在门户内解决'] },
  { hash: 'knowledge', tab: null, want: ['知识中心', '最佳实践', '设计规范', 'FAQ'] },
  { hash: 'knowledge', tab: 'FAQ', want: ['待补知识', '这个回答有用吗'] },
  { hash: 'knowledge', tab: '设计规范', want: ['设计规范'] },
  { hash: 'knowledge/article/bp-stock-dedup', tab: null, want: ['本文目录', '大促期间库存扣减的一致性处理', '分钟阅读', '更新于'] },
  { hash: 'workspace', tab: null, want: ['工作台', '工具导航', '组织速查', '需求提交', 'Owner', '申请权限'] },
  { hash: 'workspace', tab: '需求提交', want: ['需求提交'] },
  { hash: 'workspace', tab: '组织速查', want: ['组织速查'] },
  { hash: 'nope-404', tab: null, want: ['页面不存在', '404'] },
];

const child = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`,
  '--window-size=1440,1200', '--hide-scrollbars',
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
  const pending = new Map(); const events = [];
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

const RAW = `(() => {
  const el = document.getElementById('root');
  const txt = el ? el.innerText : '';
  const de = document;
  return JSON.stringify({
    len: txt.length,
    text: txt,
    hasHScroll: de.documentElement.scrollWidth > de.documentElement.clientWidth + 2,
    scrollW: de.documentElement.scrollWidth,
    clientW: de.documentElement.clientWidth,
    cards: de.querySelectorAll('.ant-card').length,
    btns: de.querySelectorAll('.ant-btn').length,
    tables: de.querySelectorAll('.ant-table').length,
    tags: de.querySelectorAll('.ant-tag').length,
    emptyImgs: de.querySelectorAll('img:not([src]), img[src=""]').length,
    brokenImgs: [...de.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length,
  });
})()`;

try {
  await waitJson('/json/version');
  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(BASE), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const { send, events } = mkcdp(ws);
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(6000);

  // dismiss tour if present
  try { await send('Runtime.evaluate', { expression: `document.querySelector('.ant-tour-close')?.click()` }); } catch { }
  await sleep(600);

  let fails = 0;
  log('===== 逐路由 / 逐 Tab 全文核验 =====');
  for (const c of CASES) {
    await send('Runtime.evaluate', { expression: `location.hash = '#/${c.hash}'` });
    await sleep(1400);
    if (c.tab) {
      const ok = await send('Runtime.evaluate', {
        expression: `(() => {
          const t = [...document.querySelectorAll('.ant-tabs-tab')].find(e => e.innerText.trim().startsWith(${JSON.stringify(c.tab)}));
          if (!t) return false; t.click(); return true;
        })()`, returnByValue: true
      });
      await sleep(1200);
      if (!ok.result.value) { log(`  [WARN] 未找到 Tab「${c.tab}」`); }
    }
    const r = await send('Runtime.evaluate', { expression: RAW, returnByValue: true });
    const o = JSON.parse(r.result.value);
    const miss = c.want.filter(w => !o.text.includes(w));
    if (miss.length) fails++;
    const label = `#/${c.hash}` + (c.tab ? ` 【${c.tab}】` : '');
    log(`[${miss.length ? 'FAIL' : 'PASS'}] ${label}  len=${o.len} card=${o.cards} btn=${o.btns} table=${o.tables}`);
    if (miss.length) log(`        缺失: ${JSON.stringify(miss)}`);
    if (o.hasHScroll) log(`        [横向溢出] scrollW=${o.scrollW} clientW=${o.clientW}`);
    if (o.brokenImgs || o.emptyImgs) log(`        [图片问题] broken=${o.brokenImgs} empty=${o.emptyImgs}`);

    if (!c.tab) {
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      writeFileSync(join(DIR, c.hash.replace(/\//g, '_') + '.png'), Buffer.from(shot.data, 'base64'));
    }
  }

  const errs = events.filter(e =>
    e.method === 'Runtime.exceptionThrown' ||
    (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') ||
    (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error')
  ).map(e => e.method === 'Runtime.exceptionThrown'
    ? 'EXC: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text)
    : (e.method === 'Log.entryAdded' ? 'LOG: ' + e.params.entry.text
      : 'CONSOLE: ' + (e.params.args || []).map(a => a.value ?? a.description).join(' ')));

  log('\n===== 控制台错误 =====');
  log(errs.length ? errs.slice(0, 20).join('\n') : '无（0 条）');
  log(`\n===== 小结：${CASES.length} 个用例，${fails} 个失败 =====`);

  ws.close();
} catch (e) {
  log('FATAL ' + String(e && e.stack || e));
} finally {
  try { child.kill(); } catch { }
  writeFileSync(join(DIR, 'verify2.txt'), lines.join('\n'), 'utf8');
  console.log('done');
  process.exit(0);
}
