/**
 * _geom_gantt.cjs —— v0.5 个人主页「8 周资源占用甘特」几何 + 色值探针
 *                    （供 mutation.cjs 的 gate:'geom-gantt' 专用钩子）
 *
 * 为什么需要它：
 *   smoke 是 jsdom 跑的，**没有布局引擎**，也**不解析 CSS 自定义属性**——
 *   所以「8 周列是否等宽」「任务列是否真的更宽」「色带是不是真的连成一条」
 *   「三档填充是不是真的三种颜色」这四件事，在 smoke 里**测不了**（只能测 class 名）。
 *   而它们恰恰是 v0.5 甘特的核心事实。故本脚本用**真实 Chrome + CDP** 直接量。
 *   它取代 v0.4.3 的 _geom_duo.cjs（`.dp-g-duo` 双栏在 v0.5 已从 DOM 移除，
 *   原几何门失去被测量对象，必须换锚点而不是删掉）。
 *
 * 输出（机器可判）：末行打印 `GEOM_JSON=` + JSON：
 *   { ok, weekW, rowheadW, ratioMax, bandColor, bandStartRadius, bandEndLeftRadius,
 *     tierColors, overflow, verdict }
 *   ok=true ⇔ 五条**全部**成立：
 *     ① notStacked —— 任务列宽 > 周列宽 × 1.2（栅格真的生效，没有塌成单列）
 *     ② widthsEqual —— 8 个周列两两相对偏差 ≤ 8%（真的等分）
 *     ③ bandColor   —— DS-3102 的 W1/W2 两格填充 = rgb(54,67,186)（c.brand，色带真的连色）
 *     ④ bandRadius  —— W1 格左上圆角 4px、W2 格左上圆角 0px（只有首格有左圆角）
 *     ⑤ bandGap     —— W2 格左边界与 W1 格右边界重合（色带**无缝**；column-gap:0 的直接证据）
 *     ⑥ tierFill    —— 总占用行 8 格填充 = 该周档位对应的品牌蓝阶（周敏实测 [2,2,2,2,0,1,0,1]）
 *     ⑦ noOverflow  —— documentElement 不横向溢出（滚动只在 .dp-gantt-scroll 内）
 *
 * 退出码：ok=true → 0；ok=false → 2（便于 mutation 判「变红」）。启动/加载失败 → 1。
 *
 * 运行：node tests/_geom_gantt.cjs   （NODE_PATH 指向 managed node_modules）
 */
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const CHROME = process.env.DP_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.DP_GEOM_PORT || 9346);
const DIST_INDEX = 'file:///' + path.resolve(__dirname, '..', 'dist', 'index.html').replace(/\\/g, '/');
const PROFILE = path.join(os.tmpdir(), 'dp-geom-gantt-' + Date.now());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpJson(pathname) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: pathname }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
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
  const send = (method, params) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  return { ws, ready, send };
}

/* 采集口径：全部读 getBoundingClientRect + getComputedStyle（即浏览器**最终算出来的值**），
   不读源码文本、不读 className —— 变异的正是 CSS，必须靠渲染结果才能证明它真的改变了版式。 */
const GEOM = `JSON.stringify((()=>{
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const gantt = q('.dp-floor-work .dp-gantt');
  if (!gantt) return { found: false };

  // ① 表头：第 0 格是任务列，1..8 是周列
  const heads = qa('.dp-floor-work .dp-gantt-head');
  const headW = heads.map((e) => Math.round(e.getBoundingClientRect().width));
  const weekW = headW.slice(1);
  const rowheadW = headW.length ? headW[0] : null;

  // ② 跨周色带：DS-3102 行 = W1 + W2 两格
  const kids = Array.from(gantt.children);
  const ri = kids.findIndex((e) => e.className.indexOf('dp-gantt-rowhead') >= 0 && (e.textContent || '').indexOf('DS-3102') >= 0);
  let bandColor = null, bandStartRadius = null, bandEndLeftRadius = null, bandGap = null;
  if (ri >= 0) {
    const c0 = kids[ri + 1], c1 = kids[ri + 2];
    if (c0 && c1) {
      bandColor = getComputedStyle(c0).backgroundColor;
      bandStartRadius = getComputedStyle(c0).borderTopLeftRadius;
      bandEndLeftRadius = getComputedStyle(c1).borderTopLeftRadius;
      // ★ 「无缝」判据：下一格的左边界必须与上一格的右边界重合。
      //   column-gap 只要非 0，色带就会被切出一道缝 —— 这是「连续色带」最容易被无声破坏的点，
      //   而它**既不影响宽度相等、也不影响颜色**，故必须单独量这条缝。
      const r0 = c0.getBoundingClientRect(), r1 = c1.getBoundingClientRect();
      bandGap = Math.round((r1.left - r0.right) * 100) / 100;
    }
  }

  // ③ 总占用行 8 格填充
  const tierColors = qa('.dp-floor-work .dp-gantt-total').map((e) => getComputedStyle(e).backgroundColor);

  // ④ 页面本体不得横向溢出（滚动只许发生在 .dp-gantt-scroll 内）
  const de = document.documentElement;
  const scroller = q('.dp-floor-work .dp-gantt-scroll');
  const overflow = de.scrollWidth - de.clientWidth;
  const scrollerScrolls = scroller ? scroller.scrollWidth - scroller.clientWidth : null;

  return { found: true, headW, weekW, rowheadW, bandColor, bandStartRadius, bandEndLeftRadius, bandGap, tierColors, overflow, scrollerScrolls };
})())`;

const BRAND_BAR = 'rgb(54, 67, 186)'; // c.brand #3643BA
// 周敏实测 totals = [2,2,2,2,0,1,0,1] → t-mid ×4 / 空槽 ×3 / t-low ×2
const TIER_MID = 'rgb(169, 178, 230)'; // c.brandStep2 #A9B2E6
const TIER_LOW = 'rgb(220, 224, 244)'; // c.brandStep1 #DCE0F4
const TIER_SLOT = 'rgb(245, 244, 245)'; // c.page #F5F4F5
const EXPECT_TIERS = [TIER_MID, TIER_MID, TIER_MID, TIER_MID, TIER_SLOT, TIER_LOW, TIER_SLOT, TIER_LOW];

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank',
  ], { stdio: 'ignore' });

  let page = null;
  for (let i = 0; i < 80; i++) {
    try {
      const targets = await httpJson('/json/list');
      page = (targets || []).find((t) => t.type === 'page');
      if (page) break;
    } catch { /* 端口未起 */ }
    await sleep(250);
  }
  if (!page) { console.error('未找到 page target（Chrome 未起）'); chrome.kill(); process.exit(1); }

  const { ws, ready, send } = connect(page.webSocketDebuggerUrl);
  await ready;
  await send('Page.enable');
  await send('Runtime.enable');

  // 宽屏 1440（与 shots 断言 1d 的 18-person-1440 同档）
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1600, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'about:blank' });
  await sleep(120);
  await send('Page.navigate', { url: DIST_INDEX + '#/workspace/people/min.zhou' });
  await sleep(2400);
  await send('Runtime.evaluate', { expression: `document.querySelectorAll('.ant-tour,.ant-tour-mask,.ant-tour-target-placeholder').forEach(n=>n.remove())` });

  const r = await send('Runtime.evaluate', { expression: GEOM, returnByValue: true });
  let g = null;
  // ⚠️ CDP 返回是 {id, result:{result:{type,value}}}，故先取 r.result.value（本处 r 已是 result）
  try { g = JSON.parse(r.result.value); } catch { g = null; }

  let ok = false;
  let notStacked = false, widthsEqual = false, bandColorOk = false, bandRadiusOk = false;
  let bandGapOk = false, tierFillOk = false, noOverflow = false;
  let ratioMax = null, verdict = '';

  if (!g || !g.found) {
    verdict = '未找到 .dp-floor-work .dp-gantt（个人主页未渲染 / 类名被改 / 工作楼层仍是列表）';
  } else {
    const wk = g.weekW || [];
    // ① 未塌成单列：任务列宽 > 周列宽 × 1.2
    notStacked = !!(g.rowheadW && wk.length === 8 && wk[0] && g.rowheadW > wk[0] * 1.2);
    // ② 8 周列等分：两两相对偏差 ≤ 8%
    if (wk.length === 8) {
      const mx = Math.max(...wk), mn = Math.min(...wk);
      ratioMax = mn ? mx / mn : null;
      widthsEqual = ratioMax != null && ratioMax <= 1.08;
    }
    // ③ 色带连色：DS-3102 的 W1 格填充 = c.brand
    bandColorOk = g.bandColor === BRAND_BAR;
    // ④ 只有色带首格有左圆角
    bandRadiusOk = g.bandStartRadius === '4px' && g.bandEndLeftRadius === '0px';
    // ⑤ 色带无缝：相邻两格边界重合（容差 1px 取整）
    bandGapOk = typeof g.bandGap === 'number' && g.bandGap <= 1;
    // ⑥ 总占用行填充与档位一致
    tierFillOk =
      Array.isArray(g.tierColors) &&
      g.tierColors.length === 8 &&
      g.tierColors.every((col, i) => col === EXPECT_TIERS[i]);
    // ⑦ 页面本体不横向溢出
    noOverflow = typeof g.overflow === 'number' && g.overflow <= 1;

    ok = notStacked && widthsEqual && bandColorOk && bandRadiusOk && bandGapOk && tierFillOk && noOverflow;
    verdict =
      `headW=[${(g.headW || []).join(',')}] ratioMax=${ratioMax != null ? ratioMax.toFixed(3) : 'n/a'} ` +
      `notStacked=${notStacked} widthsEqual=${widthsEqual} bandColor=${g.bandColor} bandColorOk=${bandColorOk} ` +
      `bandStartR=${g.bandStartRadius}/bandEndLeftR=${g.bandEndLeftRadius} bandRadiusOk=${bandRadiusOk} ` +
      `bandGap=${g.bandGap} bandGapOk=${bandGapOk} ` +
      `tiers=[${(g.tierColors || []).join('|')}] tierFillOk=${tierFillOk} ` +
      `overflow=${g.overflow} scrollerScrolls=${g.scrollerScrolls} noOverflow=${noOverflow}`;
  }

  console.log('GEOM_JSON=' + JSON.stringify({
    ok,
    weekW: g ? g.weekW : null,
    rowheadW: g ? g.rowheadW : null,
    ratioMax,
    bandColor: g ? g.bandColor : null,
    bandStartRadius: g ? g.bandStartRadius : null,
    bandEndLeftRadius: g ? g.bandEndLeftRadius : null,
    bandGap: g ? g.bandGap : null,
    tierColors: g ? g.tierColors : null,
    overflow: g ? g.overflow : null,
    notStacked, widthsEqual, bandColorOk, bandRadiusOk, bandGapOk, tierFillOk, noOverflow,
    verdict,
  }));

  ws.close();
  chrome.kill();
  await sleep(150);
  process.exit(ok ? 0 : 2);
})().catch((e) => {
  console.error('[fatal] ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
