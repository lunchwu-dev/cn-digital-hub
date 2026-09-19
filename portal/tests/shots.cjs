/**
 * 出图 + 布局测量 + 响应式断言：直接驱动 Chrome DevTools Protocol，不需要 puppeteer。
 *   - Node 22 自带全局 WebSocket；Chrome 自带 --remote-debugging-port。
 *   - 每个界面顺便量 getBoundingClientRect().left，用来「证明」栅格对齐而不只是「看着像」。
 *   - 截图前移除首次引导 Tour 遮罩，保证画面干净。
 *   - 响应式断言 4 组：① 连续溢出 ② 顶栏高恒等(≥768)+单调 ③ 内容不变式(仅 ≥768，余量 ≥16px)
 *     ④ navText 上区间(无 ✓→✗)+≥1012 可见；外加「前置哨兵」与「空数据计为失败」两道保险。
 *
 * 运行：
 *   set NODE_PATH=C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules
 *   node tests/shots.cjs
 *
 * 断言会不会咬人？用变异测试自证（see README「回归护栏 / 变异测试」）：
 *   往 portal/dist/assets/style.css 追加一条可疑规则 → 跑本脚本应当非零退出 → 还原并核 sha256。
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.DP_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const DIST_INDEX = 'file:///' + path.resolve(__dirname, '..', 'dist', 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, '..', 'shots');
const PROFILE = path.join(os.tmpdir(), 'dp-cdp-profile-' + Date.now());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpJson(pathname) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path: pathname }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { ws, ready, send };
}

/* 量顶栏容器与正文容器左边界：两者相等才算「单一栅格对齐」；
   同时量 documentElement.scrollWidth/clientWidth，用于断言无横向溢出；
   并记录窄屏折叠状态（navText / searchLabel / agentLabel / logoSub 是否可见）+ 顶栏高度。 */
const MEASURE = `JSON.stringify((()=>{
  const L = (e) => e ? Math.round(e.getBoundingClientRect().left) : null;
  const shell = document.querySelector('.dp-shell');
  const containers = Array.from(document.querySelectorAll('.dp-container')).map(L);
  const de = document.documentElement;
  const vis = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const cs = getComputedStyle(e);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const tb = document.querySelector('.dp-topbar');
  return {
    vw: window.innerWidth,
    shellLeft: L(shell),
    containersLeft: containers,
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    topbarH: tb ? Math.round(tb.getBoundingClientRect().height) : null,
    navText: vis('.dp-nav-text'),
    searchLabel: vis('.dp-search-label'),
    agentLabel: vis('.dp-agent-label'),
    logoSub: vis('.dp-logo-sub'),
  };
})())`;

const KILL_TOUR = `document.querySelectorAll('.ant-tour,.ant-tour-mask,.ant-tour-target-placeholder').forEach(n=>n.remove())`;

const OPEN_AGENT = `(()=>{const b=Array.from(document.querySelectorAll('button')).find(x=>/Agent for Digital/.test(x.textContent));if(b)b.click();return !!b})()`;
const OPEN_SEARCH = `(()=>{const b=document.querySelector('[aria-label="打开全局搜索"]');if(b)b.click();return !!b})()`;
const TYPE_SEARCH = `(()=>{const i=document.querySelector('.ant-modal input');if(!i)return false;const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(i,'积分');i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`;

const SHOTS = [
  { name: '01-home-1440', hash: '#/home', w: 1440, h: 1500 },
  { name: '02-home-1920', hash: '#/home', w: 1920, h: 1500 },
  { name: '03-ops-1440', hash: '#/ops', w: 1440, h: 1600 },
  { name: '04-notfound-1440', hash: '#/definitely-missing', w: 1440, h: 900 },
  { name: '05-pending-1440', hash: '#/knowledge/article/bp-tracking-v2', w: 1440, h: 1200 },
  // 深链会先 scrollIntoView 滚动页面；带 sticky 顶栏时用 captureBeyondViewport 会把顶栏画到文档中部
  // （看着像「深链仍被遮住」）。这一张改用纯视口截图，才是用户真正看到的画面。
  { name: '06-deeplink-1440', hash: '#/workspace/tools/delivery', w: 1440, h: 1200, viewportOnly: true },
  { name: '07-knowledge-1440', hash: '#/knowledge', w: 1440, h: 1200 },
  { name: '08-news-1440', hash: '#/news', w: 1440, h: 1300 },
  { name: '09-agent-1440', hash: '#/home', w: 1440, h: 1000, pre: OPEN_AGENT, settle: 700 },
  { name: '10-search-1440', hash: '#/home', w: 1440, h: 1000, pre: OPEN_SEARCH, typed: TYPE_SEARCH, settle: 700 },
  // 产品 Release Tab：验证「变更类型」胶囊已改中性（不再占用语义色）
  {
    name: '11-news-release-1440',
    hash: '#/news',
    w: 1440,
    h: 1100,
    pre: `(()=>{const t=Array.from(document.querySelectorAll('.ant-tabs-tab')).find(x=>/产品 Release/.test(x.textContent));if(t)t.click();return !!t})()`,
    settle: 700,
  },
  // 窄屏折叠（≤1023 折叠导航文字 / ≤767 只留图标 + 隐藏副标题）：验证顶栏折叠后无横向溢出
  { name: '12-home-768', hash: '#/home', w: 768, h: 1400 },
  { name: '13-workspace-768', hash: '#/workspace', w: 768, h: 1400 },
  { name: '14-ops-768', hash: '#/ops', w: 768, h: 1500 },
  { name: '15-home-375', hash: '#/home', w: 375, h: 1600, mobile: true },
  { name: '16-workspace-375', hash: '#/workspace', w: 375, h: 1600, mobile: true },
  { name: '17-ops-375', hash: '#/ops', w: 375, h: 1700, mobile: true },
];

/* 断言集：连续扫描 + 路由抽点。
   抽点抽样正是前两轮分别漏掉 1024–1268 与 768–976 的原因——断言集的档位必须铺满
   缺陷可能出现的位置，而不是「几个代表值」。 */
const SCAN_WIDTHS = [375, 414, 768, 900, 1024, 1152, 1240, 1280, 1366, 1440, 1920]; // 路由抽点档位
const SCAN_ROUTES = [
  { name: 'home', hash: '#/home' },
  { name: 'news', hash: '#/news' },
  { name: 'ops', hash: '#/ops' },
  { name: 'knowledge', hash: '#/knowledge' },
  { name: 'workspace', hash: '#/workspace' },
];
const OVERFLOW = `JSON.stringify((()=>{const de=document.documentElement;return {scrollWidth:de.scrollWidth,clientWidth:de.clientWidth}})())`;

/* 连续扫描范围与分界（分界值须与 global.css 一致；此处用于断言3 取点） */
const SWEEP_MIN = 375;
const SWEEP_MAX = 1920;
const T_B1 = 1272; // global.css 的 T1 起点（媒体查询 max-width:1271px）
const T_B2 = 1012; // global.css 的 T2 起点（媒体查询 max-width:1011px）
const NAVTEXT_MUST = [1024, 1152, 1200, 1280, 1440]; // 断言4：这些宽度 navText 必须可见

/* 连续扫描每档要量：溢出 / 顶栏高 / 折叠态 / 三段内容宽（供断言3） */
const SWEEP_MEASURE = `JSON.stringify((()=>{
  const de = document.documentElement;
  const tb = document.querySelector('.dp-topbar');
  const nt = document.querySelector('.dp-nav-text');
  const W = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().width) : null; };
  const inner = document.querySelector('.dp-topbar-inner');
  const ics = inner ? getComputedStyle(inner) : null;
  return {
    sw: de.scrollWidth, cw: de.clientWidth,
    innerW: inner ? inner.clientWidth : null,
    // clientWidth 含 padding；真正能放内容的宽度要减掉左右内边距
    innerContentW: inner && ics ? inner.clientWidth - parseFloat(ics.paddingLeft) - parseFloat(ics.paddingRight) : null,
    topbarH: tb ? Math.round(tb.offsetHeight) : null,
    navText: nt ? getComputedStyle(nt).display !== 'none' : null,
    logoW: W('.dp-logo'), navW: W('.dp-nav'), actionsW: W('.dp-topbar-actions'),
  };
})())`;

/* 前置哨兵：先证明页面真的渲染了，再谈扫描。
   教训：曾出现 URL 拼错、量到空页，却把 1546×2 档的 null 全写完然后 exit 0 —— 正是「不会变红的断言」。 */
const SENTINEL = `JSON.stringify((()=>{
  const b = document.body;
  return {
    topbar: !!document.querySelector('.dp-topbar'),
    shell: !!document.querySelector('.dp-shell'),
    textLen: b ? (b.innerText || '').length : 0,
    nodes: document.querySelectorAll('*').length,
  };
})())`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let targets = null;
  for (let i = 0; i < 80; i++) {
    try {
      targets = await httpJson('/json/list');
      if (targets && targets.some((t) => t.type === 'page')) break;
    } catch {
      /* 端口还没起来 */
    }
    await sleep(250);
  }
  const page = (targets || []).find((t) => t.type === 'page');
  if (!page) throw new Error('未找到 page target');

  const { ws, ready, send } = connect(page.webSocketDebuggerUrl);
  await ready;
  await send('Page.enable');
  await send('Runtime.enable');

  /* ---------- 0) 前置哨兵：页面必须真的渲染，否则立即非零退出（不继续扫） ---------- */
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'about:blank' });
  await sleep(120);
  await send('Page.navigate', { url: DIST_INDEX + '#/home' });
  await sleep(2400);
  const so = await send('Runtime.evaluate', { expression: SENTINEL, returnByValue: true });
  let sent = null;
  try {
    sent = JSON.parse(so.result.value);
  } catch {
    sent = null;
  }
  const sentProblems = [];
  if (!sent) sentProblems.push('哨兵表达式未返回（页面可能是空白）');
  else {
    if (!sent.topbar) sentProblems.push('.dp-topbar 不存在');
    if (!sent.shell) sentProblems.push('.dp-shell 不存在');
    if (!(sent.textLen > 500)) sentProblems.push(`document.body.innerText.length=${sent.textLen}（应 >500）`);
    if (!(sent.nodes > 100)) sentProblems.push(`document.querySelectorAll('*').length=${sent.nodes}（应 >100）`);
  }
  if (sentProblems.length) {
    console.error('\n[SENTINEL FAIL] 扫描前置哨兵未通过 —— 立即退出，不继续扫：');
    sentProblems.forEach((p) => console.error('  - ' + p));
    ws.close();
    chrome.kill();
    process.exitCode = 1;
    return;
  }
  console.log(`\n[哨兵] 页面已渲染：.dp-topbar ✓ / .dp-shell ✓ / innerText=${sent.textLen} 字符 / DOM 节点=${sent.nodes}`);

  // 空数据哨兵：任何一档测量值 null/undefined/NaN 一律计为失败，绝不当作「跳过」
  const badNum = (x) => x == null || (typeof x === 'number' && Number.isNaN(x));

  const report = [];
  for (const s of SHOTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.w,
      height: s.h,
      deviceScaleFactor: 1,
      mobile: !!s.mobile,
    });
    // 必须先进 about:blank 再进目标：否则「只有 hash 不同」会被 Chrome 当成同文档片段跳转，
    // React 不会重挂载，上一张打开的 Drawer / Modal 会残留、污染下一张。
    await send('Page.navigate', { url: 'about:blank' });
    await sleep(150);
    await send('Page.navigate', { url: DIST_INDEX + s.hash });
    await sleep(2400); // 首屏 Skeleton(460ms) + 渲染
    await send('Runtime.evaluate', { expression: KILL_TOUR });
    if (s.pre) {
      await send('Runtime.evaluate', { expression: s.pre });
      await sleep(s.settle || 600);
    }
    if (s.typed) {
      await send('Runtime.evaluate', { expression: s.typed });
      await sleep(500);
    }
    const m = await send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !s.viewportOnly });
    const file = path.join(OUT, s.name + '.png');
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    let measure = null;
    try {
      measure = JSON.parse(m.result.value);
    } catch {
      measure = m.result.value;
    }
    report.push({ name: s.name, hash: s.hash, viewport: `${s.w}x${s.h}`, measure, bytes: fs.statSync(file).size });
  }

  /* ---------- A) 路由抽点：11 宽度 × 5 路由（保留路由覆盖） ---------- */
  const scan = [];
  for (const w of SCAN_WIDTHS) {
    for (const r of SCAN_ROUTES) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w <= 767 });
      await send('Page.navigate', { url: 'about:blank' });
      await sleep(120);
      await send('Page.navigate', { url: DIST_INDEX + r.hash });
      await sleep(1800);
      await send('Runtime.evaluate', { expression: KILL_TOUR });
      const mo = await send('Runtime.evaluate', { expression: OVERFLOW, returnByValue: true });
      let v = null;
      try {
        v = JSON.parse(mo.result.value);
      } catch {
        v = null;
      }
      scan.push({
        width: w,
        route: r.name,
        scrollWidth: v ? v.scrollWidth : null,
        clientWidth: v ? v.clientWidth : null,
        ok: !!v && v.scrollWidth <= v.clientWidth,
      });
    }
  }

  /* ---------- B) 连续扫描：375→1920 步进 1，desktop + mobile（#/home） ----------
     关键：同一页面只 navigate 一次，之后只改 deviceMetrics（不重载）——1546 档才跑得动。
     这一步同时喂给断言 1/2/3/4。 */
  async function sweep(mobile) {
    await send('Page.navigate', { url: 'about:blank' });
    await sleep(120);
    await send('Page.navigate', { url: DIST_INDEX + '#/home' });
    await sleep(2200);
    await send('Runtime.evaluate', { expression: KILL_TOUR });
    const rows = [];
    for (let w = SWEEP_MIN; w <= SWEEP_MAX; w++) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile });
      await sleep(18);
      const mo = await send('Runtime.evaluate', { expression: SWEEP_MEASURE, returnByValue: true });
      let v = null;
      try {
        v = JSON.parse(mo.result.value);
      } catch {
        v = null;
      }
      // 空数据一律计为失败（不是跳过）：null/undefined/NaN 说明该档根本没量到。
      const bad = !v || badNum(v.sw) || badNum(v.cw) || badNum(v.topbarH) || badNum(v.innerContentW);
      rows.push(v ? Object.assign({ w, __bad: bad }, v) : { w, __bad: true });
    }
    return rows;
  }
  const sweepDesktop = await sweep(false);
  const sweepMobile = await sweep(true);

  fs.writeFileSync(
    path.join(OUT, 'report.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        shots: report,
        routeScan: scan,
        thresholds: { T1: T_B1, T2: T_B2 },
        sweep: { desktop: sweepDesktop, mobile: sweepMobile },
      },
      null,
      2
    )
  );
  ws.close();
  chrome.kill();

  /* ---------- 断言 ---------- */
  const failures = [];
  const pick = (rows, w) => rows.find((r) => r.w === w);
  const GAP = 16; // .dp-topbar-inner 在 ≥768 的 gap

  // 空数据哨兵：任何一档测量值 null/undefined/NaN → 失败（不是跳过）
  for (const mode of ['desktop', 'mobile']) {
    const rows = mode === 'desktop' ? sweepDesktop : sweepMobile;
    const bad = rows.filter((r) => r.__bad);
    if (bad.length) failures.push(`空数据[${mode}]：${bad.length}/${rows.length} 档测量值无效，例 ${bad.slice(0, 3).map((r) => r.w + 'px').join(', ')}`);
  }

  // 断言1：连续溢出（desktop + mobile 各 1546 档）
  for (const mode of ['desktop', 'mobile']) {
    const rows = mode === 'desktop' ? sweepDesktop : sweepMobile;
    const bad = rows.filter((r) => r.sw == null || r.sw > r.cw);
    if (bad.length) failures.push(`断言1 连续溢出[${mode}]：${bad.length} 档，首例 ${bad[0].w}px sw=${bad[0].sw} cw=${bad[0].cw}`);
  }
  const badRoute = scan.filter((s) => !s.ok);
  if (badRoute.length) failures.push(`路由抽点溢出：${badRoute.map((s) => `${s.width}/${s.route}`).join(', ')}`);
  const overflowShots = report.filter((r) => r.measure && typeof r.measure === 'object' && r.measure.scrollWidth > r.measure.clientWidth);
  if (overflowShots.length) failures.push(`截图溢出：${overflowShots.map((r) => r.name).join(', ')}`);

  // 断言2a（等值 —— 水平回归的守门员）：≥768 每一档顶栏高必须恒等于 1920 档。
  //   旧判据只禁「越宽越高」，对「高度不变的水平回归」全盲：若有人在 max-width:1300 里加 padding:4px 0，
  //   则 1280→69、1301→61，宽度增加高度下降 → 单调性通过；但 h(1280)=69 ≠ h(1920)=61 → 被这条抓住。
  const REF_H = (pick(sweepDesktop, SWEEP_MAX) || {}).topbarH;
  if (REF_H == null) failures.push('断言2 等值：取不到 1920 档顶栏高');
  else {
    const eqBad = sweepDesktop.filter((r) => r.w >= 768 && r.topbarH !== REF_H);
    if (eqBad.length) failures.push(`断言2 顶栏高度应恒等于 ${REF_H}(@1920)：${eqBad.length} 档不符，例 ${eqBad.slice(0, 6).map((r) => `${r.w}px=${r.topbarH}`).join(' ')}${eqBad.length > 6 ? ` …共${eqBad.length}档` : ''}`);
  }

  // 断言2b（单调，保留）：≤767 是刻意折行段，仍要求「越宽越不矮」。
  const mono = sweepDesktop.filter((r) => r.topbarH != null);
  const bumps = [];
  for (let i = 1; i < mono.length; i++) {
    if (mono[i].topbarH > mono[i - 1].topbarH) bumps.push(`${mono[i - 1].w}(${mono[i - 1].topbarH})→${mono[i].w}(${mono[i].topbarH})`);
  }
  if (bumps.length) failures.push(`断言2 顶栏高度非单调：${bumps.slice(0, 6).join(' ')}${bumps.length > 6 ? ` …共${bumps.length}处` : ''}`);

  // 断言3：内容不变式 —— **仅 ≥768**（≤767 是刻意折行段，最多 239 档余量为负属良性，不纳入）。
  const tierPoints = [768, T_B2, T_B1, SWEEP_MAX].filter((w) => w >= 768);
  for (const w of tierPoints) {
    const r = pick(sweepDesktop, w);
    if (!r || r.logoW == null || r.innerContentW == null) {
      failures.push(`断言3 取数失败 @${w}px`);
      continue;
    }
    const used = r.logoW + r.navW + r.actionsW + 2 * GAP;
    const margin = r.innerContentW - used;
    if (margin < 0) failures.push(`断言3 内容超宽 @${w}px：logo${r.logoW}+nav${r.navW}+actions${r.actionsW}+gap${2 * GAP}=${used} > 内容宽${r.innerContentW}`);
    else if (margin < 16) failures.push(`断言3 余量不足 @${w}px：仅 ${margin}px（要求 ≥16）`);
  }

  // 断言4a（上区间）：navText 可见性「一旦打开就不许再关」——不允许出现 ✓→✗ 抖动。
  //   旧判据只钉 5 个抽点，对「1012–1015 可见、1016 又不可见」全盲。
  const drops = [];
  for (let i = 1; i < sweepDesktop.length; i++) {
    const a = sweepDesktop[i - 1];
    const b = sweepDesktop[i];
    if (a.navText === true && b.navText === false) drops.push(`${a.w}(✓)→${b.w}(✗)`);
  }
  if (drops.length) failures.push(`断言4 navText 可见性非上区间（出现 ✓→✗）：${drops.slice(0, 5).join(' ')}${drops.length > 5 ? ` …共${drops.length}处` : ''}`);

  // 断言4b（下界钉住）：navText 在 ≥1012 必须可见（本轮修复目标）。
  const ntBad = sweepDesktop.filter((r) => r.w >= T_B2 && r.navText !== true);
  if (ntBad.length) failures.push(`断言4 navText 在 ≥${T_B2}px 不可见：${ntBad.length} 档，例 ${ntBad.slice(0, 5).map((r) => `${r.w}px`).join(', ')}`);
  // 断言4c（可读性锚）：显式抽点，与 4a/4b 等价但便于人读。
  const ntAnchor = NAVTEXT_MUST.filter((w) => {
    const r = pick(sweepDesktop, w);
    return !r || r.navText !== true;
  });
  if (ntAnchor.length) failures.push(`断言4 navText 锚点不可见：${ntAnchor.join(', ')}`);

  /* ---------- 输出 ---------- */
  console.log('\n================ 连续扫描形态带（desktop #/home）================');
  let prev = null;
  let start = SWEEP_MIN;
  const shape = (r) => `topbarH=${r.topbarH} navText=${r.navText ? '✓' : '✗'}`;
  for (const r of sweepDesktop) {
    const s = shape(r);
    if (s !== prev) {
      if (prev !== null) console.log(`  ${String(start).padStart(4)}–${String(r.w - 1).padStart(4)}  ${prev}`);
      prev = s;
      start = r.w;
    }
  }
  console.log(`  ${String(start).padStart(4)}–${String(SWEEP_MAX).padStart(4)}  ${prev}`);
  console.log('\n  各 tier 起点余量（内容宽 − 内容 − 2×gap，要求 ≥16）：');
  for (const w of [768, T_B2, T_B1, SWEEP_MAX]) {
    const r = pick(sweepDesktop, w) || {};
    const used = r.logoW != null ? r.logoW + r.navW + r.actionsW + 2 * GAP : null;
    console.log(
      `    @${String(w).padStart(4)}  内容宽=${r.innerContentW}  used=${used}  余量=${used != null && r.innerContentW != null ? r.innerContentW - used : 'n/a'}  navText=${r.navText}`
    );
  }
  console.log(`  路由抽点 ${scan.length} 格，连续扫描 ${sweepDesktop.length}×2 档`);

  if (failures.length) {
    console.error('\n[FAIL]');
    failures.forEach((f) => console.error('  - ' + f));
    process.exitCode = 1;
  } else {
    console.log('\n[OK] 断言1–4 全部通过（无空数据 / 无溢出 / 顶栏高恒等且单调 / 内容不超宽 / navText 上区间且 ≥1012 可见）');
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
