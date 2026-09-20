/**
 * 出图 + 布局测量 + 响应式断言：直接驱动 Chrome DevTools Protocol，不需要 puppeteer。
 *   - Node 22 自带全局 WebSocket；Chrome 自带 --remote-debugging-port。
 *   - 每个界面顺便量 getBoundingClientRect().left，用来「证明」栅格对齐而不只是「看着像」。
 *   - 截图前移除首次引导 Tour 遮罩，保证画面干净。
 *   - 响应式断言 4 组：① 连续溢出 ② 顶栏高恒等(≥768)+单调 ③ 内容不变式(仅 ≥768，余量 ≥16px)
 *     ④ navText 上区间(无 ✓→✗)+≥T_B2(1164) 可见；外加「前置哨兵」与「空数据计为失败」两道保险。
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
  const fa = document.querySelector('.dp-float-agent');
  const fr = fa ? fa.getBoundingClientRect() : null;
  // 悬浮 doodle 遮挡复核（02b §B.2 / §B.4）：fixed 元素不随滚动，故需证明
  //   ① 它在视口内（fixed right/bottom 生效）② 不与 sticky 顶栏相交 ③ 页面底部预留了 ≥doodle 高的内边距
  const shellCS = shell ? getComputedStyle(shell) : null;
  // #/demand/new 表单顺序几何（仅该页有 .dp-g-spec）：promise / assistant / form 的 top/left。
  //   ≤900 单列：三张卡 left 相同、top 递增 promise<assistant<form（display:contents 拆掉右栏）。
  //   >900 双栏：form 与右栏 left 不同；右栏内 promise.top<assistant.top。
  const G = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const specGeom = document.querySelector('.dp-g-spec') ? {
    form: G('.dp-demand-form-col'),
    side: G('.dp-demand-side'),
    promise: G('.dp-demand-promise'),
    assistant: G('.dp-demand-assistant'),
  } : null;
  // v0.4.3 个人主页楼层 3 两栏栅格几何（.dp-g-duo）：量两个直接子列的 left/top/width。
  //   v0.4.3 改动：个人主页楼层 3 由「非对称 .dp-g-profile（1.85fr/1fr）」改为
  //   「等宽双栏 .dp-g-duo（1fr/1fr）」。采集选择器随之改为 .dp-g-duo（否则量到 null）。
  //   规范（global.css）：grid-template-columns: minmax(0,1fr) minmax(0,1fr)；
  //   ≤900px 塌缩为单列（两列 left 相同、上下列排）。这是 jsdom 无布局引擎、只能靠真实 Chrome 实测的项。
  const profGrid = document.querySelector('.dp-g-duo');
  const profGeom = profGrid ? {
    cols: Array.from(profGrid.children).map((e) => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width) }; }),
    gridW: Math.round(profGrid.getBoundingClientRect().width),
    cols0: getComputedStyle(profGrid).gridTemplateColumns,
  } : null;
  return {
    vw: window.innerWidth,
    vh: window.innerHeight,
    shellLeft: L(shell),
    containersLeft: containers,
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    topbarH: tb ? Math.round(tb.getBoundingClientRect().height) : null,
    navText: vis('.dp-nav-text'),
    searchLabel: vis('.dp-search-label'),
    agentLabel: vis('.dp-agent-label'),
    logoSub: vis('.dp-logo-sub'),
    floatAgent: fr ? { left: Math.round(fr.left), top: Math.round(fr.top), right: Math.round(fr.right), bottom: Math.round(fr.bottom), w: Math.round(fr.width), h: Math.round(fr.height) } : null,
    floatInViewport: fr ? (fr.left >= 0 && fr.top >= 0 && fr.right <= window.innerWidth && fr.bottom <= window.innerHeight) : null,
    floatBelowTopbar: fr && tb ? fr.top >= tb.getBoundingClientRect().bottom : null,
    shellPadBottom: shellCS ? parseFloat(shellCS.paddingBottom) : null,
    specGeom,
    profGeom,
  };
})())`;

const KILL_TOUR = `document.querySelectorAll('.ant-tour,.ant-tour-mask,.ant-tour-target-placeholder').forEach(n=>n.remove())`;

// 02b §B：Agent 入口已从顶栏按钮移为右下角悬浮 doodle（.dp-float-agent，图标按钮无文字），
// 故改按 class 命中；旧 textContent 匹配 /Agent for Digital/ 对新图标按钮恒为 false。
const OPEN_AGENT = `(()=>{const b=document.querySelector('.dp-float-agent');if(b)b.click();return !!b})()`;
const OPEN_SEARCH = `(()=>{const b=document.querySelector('[aria-label="打开全局搜索"]');if(b)b.click();return !!b})()`;
const TYPE_SEARCH = `(()=>{const i=document.querySelector('.ant-modal input');if(!i)return false;const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(i,'积分');i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`;
// 切到「功能 / 系统」（BRD 完整档）：只有完整档才渲染 .dp-demand-assistant，几何门依赖它。
const CLICK_BRD = `(()=>{const it=Array.from(document.querySelectorAll('.ant-segmented-item')).find(x=>/功能 \\/ 系统/.test(x.textContent));if(it)it.click();return !!it})()`;

/* ── 存在性探针（供 pre 之后的「同步等待」用）─────────────────────────────
   为什么需要：375 档 mobile 下 CLICK_BRD 偶发未生效（分段控件未渲染 / React 尚未挂载
   完成即被点），于是 BRD 分支没渲染、.dp-demand-assistant 缺失、specGeom 量到空 →
   shots 断言 1c flaky（首轮红、复跑绿）。而 M2 的「文本门由 shots 1c 几何独立兜底」
   辩护正依赖 1c 的确定性——若 1c 时灵时不灵，辩护就是空的。
   故：pre 点击后**轮询等待目标元素出现**，带上限与超时诊断；超时**必须 fail**，
   不许静默 pass（否则又退化成「靠运气的门」）。 */
const EXISTS = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;
// 分段控件值（读当前选中档位文案，用于超时诊断：区分「没点到」与「点了没渲染」）
const SEG_TEXT = `(()=>{const it=document.querySelector('.ant-segmented-item-selected');return it?it.textContent:null})()`;
// 页面是否已挂载 demand/new 的表单栅格（区分「路由没到」与「档位没切」）
const SPEC_PRESENT = `!!document.querySelector('.dp-g-spec')`;

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
  // 窄屏折叠（顶栏分档 v2：T1≥1312 / T2 1164–1311 / T3 941–1163 / T4 768–940 / T5 ≤767；
  // navText 在 ≤1163 折叠，logo 副标题在 ≤767 隐藏）：验证顶栏折叠后无横向溢出 + 悬浮 doodle 不遮挡正文
  { name: '12-home-768', hash: '#/home', w: 768, h: 1400 },
  { name: '13-workspace-768', hash: '#/workspace', w: 768, h: 1400 },
  { name: '14-ops-768', hash: '#/ops', w: 768, h: 1500 },
  { name: '15-home-375', hash: '#/home', w: 375, h: 1600, mobile: true },
  { name: '16-workspace-375', hash: '#/workspace', w: 375, h: 1600, mobile: true },
  { name: '17-ops-375', hash: '#/ops', w: 375, h: 1700, mobile: true },
  // 标签体系新页面（个人主页 + 反查页）
  { name: '18-person-1440', hash: '#/workspace/people/min.zhou', w: 1440, h: 1500 },
  { name: '19-person-768', hash: '#/workspace/people/min.zhou', w: 768, h: 1700 },
  { name: '20-tags-1440', hash: '#/workspace/tags', w: 1440, h: 1500 },
  { name: '21-tags-375', hash: '#/workspace/tags', w: 375, h: 1700, mobile: true },
  // 站点重构一级栏目：业务需求（楼层 5 格）+ 组织速查 + 需求提交（表单顺序两档）
  //   #/demand：1440 验楼层一行；375 验窄屏换行
  { name: '22-demand-1440', hash: '#/demand', w: 1440, h: 1400 },
  { name: '23-demand-375', hash: '#/demand', w: 375, h: 1700, mobile: true },
  //   #/demand/new：900 验单列顺序（promise→assistant→form）；375 验更窄；1280 验双栏
  //   注意：该页按规范刻意卸载 doodle（shots.cjs:415 已允许「量不到不算失败」）。
  //   先点「功能 / 系统」档，让完整档的 BRD 助手卡（.dp-demand-assistant）渲染出来再量。
  { name: '24-demandnew-900', hash: '#/demand/new', w: 900, h: 2400, pre: CLICK_BRD, waitSel: '.dp-demand-assistant', settle: 800 },
  { name: '25-demandnew-1280', hash: '#/demand/new', w: 1280, h: 2000, pre: CLICK_BRD, waitSel: '.dp-demand-assistant', settle: 800 },
  { name: '26-demandnew-375', hash: '#/demand/new', w: 375, h: 2600, mobile: true, pre: CLICK_BRD, waitSel: '.dp-demand-assistant', settle: 800 },
  //   组织速查：1440 + 768
  { name: '27-org-1440', hash: '#/org', w: 1440, h: 1500 },
  { name: '28-org-768', hash: '#/org', w: 768, h: 1700 },
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
  { name: 'people', hash: '#/workspace/people/min.zhou' },
  { name: 'tags', hash: '#/workspace/tags' },
  // 站点重构后升为一级栏目的三条：必须在「唯一能做真实几何测量」的通道里被量过。
  { name: 'org', hash: '#/org' },
  { name: 'demand', hash: '#/demand' },
  { name: 'demand-new', hash: '#/demand/new' },
];
const OVERFLOW = `JSON.stringify((()=>{const de=document.documentElement;return {scrollWidth:de.scrollWidth,clientWidth:de.clientWidth}})())`;

/* 连续扫描范围与分界（分界值须与 global.css 一致；此处用于断言3 取点）
   顶栏分档 v2（7 项导航 + Agent 移出顶栏）：T1≥1312 / T2 1164–1311 / T3 941–1163 / T4 768–940 / T5 ≤767。
   navText 在 ≤1163 才隐藏，故可见下界 T_B2 = 1164（原 1012 分档已作废，见 global.css 注释）。 */
const SWEEP_MIN = 375;
const SWEEP_MAX = 1920;
const T_B1 = 1312; // global.css 的 T1 起点（媒体查询 max-width:1311px）
const T_B2 = 1164; // navText 可见下界（媒体查询 max-width:1163px 才隐藏导航文字）
const NAVTEXT_MUST = [1164, 1280, 1440, 1600, 1920]; // 断言4：这些宽度 navText 必须可见

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
  // pre 阶段（点档 / 开弹层）的存在性等待失败收集 —— 超时**必须 fail**，不许静默跳过。
  const preFailures = [];
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
      const pr = await send('Runtime.evaluate', { expression: s.pre, returnByValue: true });
      // pre 脚本统一返回布尔（是否命中目标控件）；false = 连控件都没找到，是确定性失败信号。
      const preHit = pr && pr.result ? pr.result.value : undefined;
      await sleep(s.settle || 600);
      // 「存在性重试」：仅当该截图声明了 waitSel 时启用。轮询等待目标元素出现，
      //   带**上限**（attempts × step ≈ 上限毫秒）；超时**不静默**——把诊断写进 preFailures，
      //   由断言阶段汇总成 FAIL（含：目标选择器 / 已等待时长 / pre 是否命中 / 当前分段档位 / 路由是否渲染）。
      if (s.waitSel) {
        const MAX_ATTEMPTS = 10; // 10 × 300ms ≈ 3s 上限
        const STEP_MS = 300;
        let found = false;
        let waited = 0;
        for (let k = 0; k < MAX_ATTEMPTS; k++) {
          const ex = await send('Runtime.evaluate', { expression: EXISTS(s.waitSel), returnByValue: true });
          if (ex && ex.result && ex.result.value === true) {
            found = true;
            break;
          }
          // 重试期间再点一次 BRD：偶发「首次点击落在未就绪的分段控件上」→ 补一次点击即可恢复。
          if (s.pre === CLICK_BRD) await send('Runtime.evaluate', { expression: CLICK_BRD });
          await sleep(STEP_MS);
          waited += STEP_MS;
        }
        if (!found) {
          // 采集诊断快照（尽量多信息，便于区分根因）
          const seg = await send('Runtime.evaluate', { expression: SEG_TEXT, returnByValue: true });
          const specOk = await send('Runtime.evaluate', { expression: SPEC_PRESENT, returnByValue: true });
          preFailures.push(
            `[pre 存在性超时] ${s.name}（${s.w}x${s.h}）：等待 ${s.waitSel} 出现失败——` +
              `已等待 ${waited}ms / 上限 ${MAX_ATTEMPTS * STEP_MS}ms；` +
              `pre 命中控件=${preHit}; 当前分段档=${seg && seg.result ? JSON.stringify(seg.result.value) : 'n/a'}; ` +
              `.dp-g-spec 是否渲染=${specOk && specOk.result ? specOk.result.value : 'n/a'}`
          );
        }
      } else if (preHit === false) {
        // 未声明 waitSel 但 pre 明确返回 false（控件未命中）→ 同样确定性失败，不静默。
        preFailures.push(`[pre 未命中] ${s.name}（${s.w}x${s.h}）：pre 脚本返回 false（目标控件未找到）`);
      }
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
        preFailures,
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

  // 断言0：pre 阶段存在性等待失败（超时 / pre 未命中）——**确定性失败，不静默跳过**。
  //   这条是修 P1-1 flaky 的核心：把「偶发未渲染」变成「重试后仍失败则明确报错」，
  //   而不是让 specGeom 悄悄变空、再靠「复跑碰运气」通过。
  for (const pf of preFailures) failures.push(pf);

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

  // 断言1b：悬浮 doodle 几何复核（02b §B.2/§B.4）——
  //   每张截图都须量到 .dp-float-agent（存在）+ 位于视口内（fixed right/bottom 生效）+ 不与顶栏相交。
  //   #/demand/new 二级页按 spec 刻意卸载 doodle，故仅对「量到该元素」的截图断言几何；量不到不算失败。
  for (const r of report) {
    const m = r.measure;
    if (!m || typeof m !== 'object' || !m.floatAgent) continue;
    if (m.floatInViewport !== true) failures.push(`doodle 越出视口 ${r.name}：${JSON.stringify(m.floatAgent)} vw=${m.vw} vh=${m.vh}`);
    if (m.floatBelowTopbar === false) failures.push(`doodle 与顶栏相交 ${r.name}：doodle.top=${m.floatAgent.top}，顶栏高=${m.topbarH}`);
  }

  // 断言1c：★ 真实几何门 —— #/demand/new 表单顺序（这是唯一能实测 DOM 几何的通道，
  //   jsdom 没有布局引擎，smoke 里的 ≤900px 媒体块检查只能是「样式表规则级」而非实测）。
  //   规范：#/demand/new 用 .dp-grid.dp-g-spec（左表单 1.5fr : 右栏 1fr）；
  //     ≤900px 中右栏 display:contents 拆掉，三张卡（promise / assistant / form）落回单列，
  //        DOM order 由媒体块里 .dp-demand-*{order:n} 重排为 promise→assistant→form；
  //     >900px 恢复双栏：form 在左、右栏在右，右栏内 promise 在 assistant 之上。
  //   用 getBoundingClientRect().top/left 证明「顺序真的生效」，而不是「样式表里写了 order」。
  const specShots = report.filter((r) => r.measure && typeof r.measure === 'object' && r.measure.specGeom);
  const specBy = (name) => specShots.find((r) => r.name === name);
  const geq = (a, b) => typeof a === 'number' && typeof b === 'number';
  const chk = (r, label, cond, detail) => {
    if (!r) {
      failures.push(`断言1c 几何门缺图 ${label}：未找到该截图或未量到 specGeom`);
      return;
    }
    if (!cond) failures.push(`断言1c 表单顺序 ${label}：${detail}`);
  };
  // ≤900 单列档：三张卡 left 相同（同一列）且 top 递增 promise < assistant < form。
  {
    const r = specBy('24-demandnew-900');
    const g = r && r.measure ? (r.measure.specGeom || {}) : {};
    const { promise, assistant, form } = g;
    const have = geq(promise && promise.top, assistant && assistant.top) && geq(assistant && assistant.top, form && form.top);
    if (!have) failures.push('断言1c 表单顺序 24-demandnew-900：promise/assistant/form 的 top 未全部量到（可能未点「功能 / 系统」档，助手卡未渲染）');
    else {
      if (!(promise.top < assistant.top)) failures.push(`断言1c 表单顺序 24-demandnew-900：promise.top=${promise.top} 应 < assistant.top=${assistant.top}`);
      if (!(assistant.top < form.top)) failures.push(`断言1c 表单顺序 24-demandnew-900：assistant.top=${assistant.top} 应 < form.top=${form.top}`);
      if (!(promise.left === assistant.left && assistant.left === form.left)) failures.push(`断言1c 单列对齐 24-demandnew-900：三张卡 left 应相同，实为 promise=${promise.left} assistant=${assistant.left} form=${form.left}`);
    }
  }
  // >900 双栏档：form.left 与右栏（side/promise/assistant）left 不同；右栏内 promise.top < assistant.top。
  {
    const r = specBy('25-demandnew-1280');
    const g = r && r.measure ? (r.measure.specGeom || {}) : {};
    const { promise, assistant, form } = g;
    const have = geq(form && form.left, assistant && assistant.left) && geq(promise && promise.top, assistant && assistant.top);
    if (!have) failures.push('断言1c 表单顺序 25-demandnew-1280：form.left / promise.top / assistant.top 未全部量到');
    else {
      if (!(form.left !== assistant.left)) failures.push(`断言1c 双栏 25-demandnew-1280：form.left=${form.left} 应 ≠ 右栏 left=${assistant.left}`);
      if (!(promise.top < assistant.top)) failures.push(`断言1c 右栏顺序 25-demandnew-1280：右栏内 promise.top=${promise.top} 应 < assistant.top=${assistant.top}`);
    }
  }
  // ≤900 窄屏档（375）：单列 —— 三张卡 left 相同且 promise.top < assistant.top。
  {
    const r = specBy('26-demandnew-375');
    const g = r && r.measure ? (r.measure.specGeom || {}) : {};
    const { promise, assistant, form } = g;
    const have = geq(promise && promise.left, assistant && assistant.left) && geq(promise && promise.top, assistant && assistant.top);
    if (!have) failures.push('断言1c 表单顺序 26-demandnew-375：promise/assistant 的 left/top 未量到');
    else {
      if (!(promise.left === assistant.left && assistant.left === form.left)) failures.push(`断言1c 窄屏单列 26-demandnew-375：三张卡 left 应相同，实为 promise=${promise.left} assistant=${assistant.left} form=${form.left}`);
      if (!(promise.top < assistant.top)) failures.push(`断言1c 窄屏顺序 26-demandnew-375：promise.top=${promise.top} 应 < assistant.top=${assistant.top}`);
    }
  }
  // 哨兵：三条新路由必须都在 report 中真实量到 specGeom / 至少真实渲染（防止 URL 拼错量到空页）。
  if (!report.some((r) => r.hash === '#/demand/new' && r.measure && r.measure.specGeom)) {
    failures.push('断言1c 哨兵：#/demand/new 的任何截图都未量到 .dp-g-spec —— 页面可能没渲染（检查路由与 CLICK_BRD）');
  }

  // 断言1d：★ 真实几何门 —— v0.4.3 个人主页楼层 3 两栏栅格（.dp-g-duo）
  //   规范（global.css）：grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)（等宽双栏）；
  //     ≤900px 塌缩为单列。jsdom 无布局引擎 → 只有本通道能实测「两栏真的等宽 / 真的塌缩成单列」。
  //   v0.4.3 改动：选择器由 .dp-g-profile 改为 .dp-g-duo；宽屏期望比由 ≈1.85 改为 **≈1.00**
  //     （容差 [0.92, 1.08]，计入 24px gap 分配与亚像素取整）。
  //   判定：宽屏（1440）两列 left 不同 + width 比落在 [0.92, 1.08]；窄屏（768）两列 left 相同（单列堆叠）。
  {
    const profWide = report.find((r) => r.name === '18-person-1440');
    const profNarrow = report.find((r) => r.name === '19-person-768');
    const pg = (r) => (r && r.measure && typeof r.measure === 'object' ? r.measure.profGeom : null);

    // (a) 宽屏：两列 left 不同、两列宽度近似相等、宽比 ≈ 1.00
    {
      const g = pg(profWide);
      if (!g || !g.cols || g.cols.length < 2) {
        failures.push('断言1d 个人主页栅格 18-person-1440：未量到 .dp-g-duo 的两列几何');
      } else {
        const [a, b] = g.cols;
        if (a.left === b.left) failures.push(`断言1d 个人主页栅格 18-person-1440：两列 left 相同（${a.left}）——宽屏应为两栏而非单列`);
        const lo = Math.min(a.w, b.w);
        const ratio = lo ? Math.max(a.w, b.w) / lo : null;
        if (ratio == null || ratio < 0.92 || ratio > 1.08) {
          failures.push(`断言1d 个人主页栅格 18-person-1440：两列宽比 ${ratio == null ? 'n/a' : ratio.toFixed(3)} 应 ≈1.00（容差 0.92–1.08）；实测 列1=${a.w}px 列2=${b.w}px，grid-template-columns=${g.cols0}`);
        }
      }
    }
    // (b) ≤900 窄屏：塌缩单列（两列 left 相同、宽度近似相等、上下列排）
    {
      const g = pg(profNarrow);
      if (!g || !g.cols || g.cols.length < 2) {
        failures.push('断言1d 个人主页栅格 19-person-768：未量到 .dp-g-duo 的两列几何');
      } else {
        const [a, b] = g.cols;
        if (a.left !== b.left) failures.push(`断言1d 个人主页栅格 19-person-768：≤900px 应塌缩为单列（两列 left 相同），实测 ${a.left} vs ${b.left}`);
        if (!(b.top > a.top)) failures.push(`断言1d 个人主页栅格 19-person-768：单列后第二列应在第一列之下，实测 a.top=${a.top} b.top=${b.top}`);
      }
    }
  }

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

  // 断言4b（下界钉住）：navText 在 ≥T_B2(1164) 必须可见（顶栏分档 v2：≤1163 才隐藏导航文字）。
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

  /* #/demand/new 表单顺序几何实测值（人读）——证明「顺序」是量出来的，不是样式表里读出来的 */
  console.log('\n  #/demand/new 表单顺序几何实测（getBoundingClientRect）：');
  for (const nm of ['24-demandnew-900', '25-demandnew-1280', '26-demandnew-375']) {
    const r = specBy(nm);
    const g = r && r.measure ? r.measure.specGeom : null;
    if (!g) {
      console.log(`    ${nm}：未量到 specGeom`);
      continue;
    }
    const f = (x) => (x ? `top=${x.top} left=${x.left} w=${x.w}` : 'null');
    console.log(`    ${nm} (${r.viewport})  promise[${f(g.promise)}]  assistant[${f(g.assistant)}]  form[${f(g.form)}]  side[${f(g.side)}]`);
  }

  /* v0.4.3 个人主页楼层 3 两栏栅格几何实测值（人读）——证明「1:1 等宽 + ≤900 单列」是量出来的 */
  console.log('\n  v0.4.3 个人主页 .dp-g-duo 两栏几何实测（getBoundingClientRect）：');
  for (const nm of ['18-person-1440', '19-person-768']) {
    const r = report.find((x) => x.name === nm);
    const g = r && r.measure ? r.measure.profGeom : null;
    if (!g) {
      console.log(`    ${nm}：未量到 profGeom`);
      continue;
    }
    const c0 = g.cols[0] || {};
    const c1 = g.cols[1] || {};
    const lo = Math.min(c0.w || 0, c1.w || 0);
    const ratio = lo ? (Math.max(c0.w, c1.w) / lo).toFixed(3) : 'n/a';
    console.log(`    ${nm} (${r.viewport})  列1[w=${c0.w} left=${c0.left}]  列2[w=${c1.w} left=${c1.left}]  宽比=${ratio}  grid-template-columns=${g.cols0}`);
  }

  if (failures.length) {
    console.error('\n[FAIL]');
    failures.forEach((f) => console.error('  - ' + f));
    process.exitCode = 1;
  } else {
    console.log(`\n[OK] 断言1–4 全部通过（含 #/demand/new 表单顺序真实几何门 900/1280/375；v0.4.3 个人主页 .dp-g-duo 两栏宽比≈1.00 + ≤900 单列真实几何门 1440/768；无空数据 / 无溢出 / 顶栏高恒等且单调 / 内容不超宽 / navText 上区间且 ≥${T_B2} 可见）`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
