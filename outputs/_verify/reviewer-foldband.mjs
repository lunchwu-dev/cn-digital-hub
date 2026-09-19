/**
 * 审查官第四轮独立复核：形态带连续性 + 4 组断言的判据强度
 * 不复用 lead 的 foldband.mjs / leadverify2.mjs；测量量与判据均为自写。
 *
 * 与 lead 的差异：
 *  - 除 topbarH 外，另量「顶栏容器子元素出现几个不同的 top」= 实际行数（比高度更直接地反映折行）
 *  - 内容不变式不只在 4 个 tier 起点取值，而是**每一档**都算，取带内最紧处（连续收缩的搜索胶囊
 *    可能让「带内最紧处 ≠ 带起点」，只验起点会漏）
 *  - 额外验「≥768 顶栏恒等于 1920 的高度」这一绝对判据（比单调性更强：单调性允许「窄端多行」）
 *  - 记录 window.innerWidth / visualViewport / outerWidth，检测 mobile 模拟下的缩放异常
 *
 * 只读 dist，不修改原型任何文件。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9350 + Math.floor(Math.random() * 80); // 随机端口，避开可能残留的旧 Chrome 实例
const DIST = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html'; // 裸路径；前缀 file:/// 在下方拼接
const BASE = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify/reviewer-foldband';
const MIN = 375;
const MAX = 1920;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEASURE = `JSON.stringify((()=>{
  const de = document.documentElement;
  const tb = document.querySelector('.dp-topbar');
  const inner = document.querySelector('.dp-topbar-inner');
  const ics = inner ? getComputedStyle(inner) : null;
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const vis = (sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const W = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().width * 100) / 100 : null; };
  const rows = inner ? Array.from(inner.children).filter(e => getComputedStyle(e).display !== 'none')
        .map(e => Math.round(e.getBoundingClientRect().top + window.scrollY)) : null;
  const uniqTops = rows ? Array.from(new Set(rows)) : null;
  return {
    innerW: inner ? inner.clientWidth : null,
    padL: ics ? px(ics.paddingLeft) : null,
    padR: ics ? px(ics.paddingRight) : null,
    gap: ics ? px(ics.gap) : null,
    topbarH: tb ? Math.round(tb.getBoundingClientRect().height * 100) / 100 : null,
    rowCount: uniqTops ? uniqTops.length : null,
    logoW: W('.dp-logo'), navW: W('.dp-nav'), actionsW: W('.dp-topbar-actions'),
    searchW: W('.dp-search-wrap'), searchPillW: W('.dp-search-pill'),
    logoSub: vis('.dp-logo-sub'), searchLabel: vis('.dp-search-label'),
    agentLabel: vis('.dp-agent-label'), navText: vis('.dp-nav-text'),
    sw: de.scrollWidth, cw: de.clientWidth,
    winW: window.innerWidth, vvW: window.visualViewport ? Math.round(window.visualViewport.width) : null,
  };
})())`;

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map(); }
  static async attach(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && c.p.has(m.id)) { const { res, rej } = c.p.get(m.id); c.p.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.p.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 20000);
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
}

async function httpJson(pathname) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${pathname}`); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('CDP 未就绪 ' + pathname);
}

const profile = 'C:/Users/uuzz/AppData/Local/Temp/reviewer-foldband-' + Date.now(); // 每次全新 profile
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${profile}`, '--window-size=1440,900',
  '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });

const out = { meta: {}, desktop: [], mobile: [] };

try {
  const ver = await httpJson('/json/version');
  out.meta.browser = ver.Browser;
  out.meta.port = PORT;
  const list = await httpJson('/json/list');
  const page = list.find((t) => t.type === 'page');
  const cdp = await CDP.attach(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  // 引导浮层由 App 挂载时读 localStorage 决定：在文档创建前注入标记，Tour 永不打开。
  // —— 教训：本脚本第一版把 DIST 拼成了 file:///file:///…（ERR_FILE_NOT_FOUND）→ 页面全空，
  //    却因为没有哨兵/失败快而把 1546×2 档 null 当数据写完、还 exit 0。故下方加了前置哨兵 + 逐档失败快。
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('dp_portal_tour_done','1')}catch(e){}` });
  // 命令行 URL 用 about:blank，再显式导航到目标 —— 避免「命令行加载 + 立即 navigate」打架打出空白页
  const nav = await cdp.send('Page.navigate', { url: 'file:///' + DIST + '#/home' });
  if (nav && nav.errorText) throw new Error('导航失败：' + nav.errorText);
  for (let i = 0; i < 120; i++) { try { if (await cdp.eval('!!document.querySelector(".dp-topbar")')) break; } catch {} await sleep(250); }
  await cdp.eval(`(()=>{const s=document.createElement('style');s.id='rv-hide-tour';
    s.textContent='.ant-tour,.ant-tour-mask,.ant-tour-target-placeholder{display:none !important}';
    document.head.appendChild(s);return true})()`);
  await sleep(700);
  // 前置哨兵：顶栏没渲染就直接失败，绝不产出「全 null 却 exit 0」的假绿报告
  const sentry = await cdp.eval(`(()=>{const tb=document.querySelector('.dp-topbar'),inner=document.querySelector('.dp-topbar-inner');
    return {href:location.href, tb:!!tb, inner:!!inner, h: tb?Math.round(tb.getBoundingClientRect().height):null};})()`);
  if (!sentry.tb || !sentry.inner || !(sentry.h > 0)) throw new Error('前置哨兵失败（顶栏未渲染）：' + JSON.stringify(sentry));
  out.meta.sentry = sentry;

  async function sweep(mobile) {
    const rows = [];
    for (let w = MIN; w <= MAX; w++) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile });
      await sleep(9);
      const raw = await cdp.eval(MEASURE);
      const rec = Object.assign({ w }, JSON.parse(raw));
      // 失败快：任一档量不到顶栏高度，立刻中止（而不是把 null 当数据写完再 exit 0）
      if (rec.topbarH == null || rec.rowCount == null) throw new Error(`第 ${w}px 档顶栏缺失 —— app 疑似崩溃，中止`);
      rows.push(rec);
    }
    return rows;
  }
  out.desktop = await sweep(false);
  out.mobile = await sweep(true);
  fs.writeFileSync(BASE + '.json', JSON.stringify(out, null, 1));

  const L = [];
  const tag = (r) => `${r.topbarH}|${r.rowCount}行|nav${r.navText ? 'T' : 'F'} agent${r.agentLabel ? 'T' : 'F'} search${r.searchLabel ? 'T' : 'F'} sub${r.logoSub ? 'T' : 'F'}`;

  for (const mode of ['desktop', 'mobile']) {
    const rows = out[mode];
    L.push(`===== ${mode} =====`);
    // 1) 形态变化点
    const changes = [];
    let prev = null;
    for (const r of rows) { const t = tag(r); if (t !== prev) { changes.push(`${r.w}: ${t}`); prev = t; } }
    L.push(`形态变化点(${changes.length}): ${changes.join('  →  ')}`);
    // 2) 高度非单调（变宽却变高）
    const bumps = [];
    for (let i = 1; i < rows.length; i++) if (rows[i].topbarH > rows[i - 1].topbarH) bumps.push(`${rows[i - 1].w}(${rows[i - 1].topbarH})→${rows[i].w}(${rows[i].topbarH})`);
    L.push(`高度非单调处(${bumps.length}): ${bumps.slice(0, 8).join(', ') || '无'}`);
    // 3) 行数非单调
    const rBumps = [];
    for (let i = 1; i < rows.length; i++) if (rows[i].rowCount > rows[i - 1].rowCount) rBumps.push(`${rows[i - 1].w}(${rows[i - 1].rowCount})→${rows[i].w}(${rows[i].rowCount})`);
    L.push(`行数非单调处(${rBumps.length}): ${rBumps.slice(0, 8).join(', ') || '无'}`);
    // 4) 绝对判据：>=768 顶栏高是否恒等于 1920 的高度（非单调性允许窄端多行，这条不允许桌面段任何多行）
    const h1920 = rows.find((r) => r.w === 1920).topbarH;
    const desktopNonSingle = rows.filter((r) => r.w >= 768 && (r.topbarH !== h1920 || r.rowCount !== 1));
    L.push(`≥768 仍非单行/非 ${h1920}px 的档位(${desktopNonSingle.length}): ${desktopNonSingle.slice(0, 8).map((r) => `${r.w}(${r.topbarH}/${r.rowCount}行)`).join(', ') || '无'}`);
    // 5) 溢出
    const ov = rows.filter((r) => r.sw > r.cw);
    L.push(`文档级溢出档位(${ov.length}): ${ov.slice(0, 8).map((r) => `${r.w}(${r.sw}>${r.cw})`).join(', ') || '无'}`);
    // 6) 内容不变式：每档余量（= 内容宽 − 三块宽 − 2gap），取最小值
    const marg = rows.map((r) => {
      if (r.innerContentW == null && r.innerW != null) r.innerContentW = r.innerW - r.padL - r.padR;
      const used = (r.logoW || 0) + (r.navW || 0) + (r.actionsW || 0) + 2 * (r.gap || 0);
      return { w: r.w, margin: r.innerContentW == null ? null : Math.round((r.innerContentW - used) * 100) / 100, inner: r.innerContentW, used: Math.round(used) };
    });
    const minM = marg.slice().sort((a, b) => a.margin - b.margin)[0];
    L.push(`每档余量最小值: ${minM.w}px → ${minM.margin}px (内容宽${minM.inner} − 占${minM.used})`);
    const thin = marg.filter((m) => m.margin != null && m.margin < 16);
    L.push(`余量<16 的档位(${thin.length}): ${thin.slice(0, 10).map((m) => `${m.w}:${m.margin}`).join(', ') || '无'}`);
    for (const w of [768, 1012, 1272, 1920]) { const m = marg.find((x) => x.w === w); L.push(`  起点 ${w}: 余量=${m ? m.margin : 'n/a'} (内容宽${m ? m.inner : '?'} − 占${m ? m.used : '?'})`); }
    // 7) navText 从哪一档起可见
    const firstNav = rows.find((r) => r.navText === true);
    L.push(`navText 首次可见: ${firstNav ? firstNav.w : '无'}`);
    const navBad = rows.filter((r) => r.w >= 1012 && r.navText !== true);
    L.push(`≥1012 但 navText 不可见(${navBad.length}): ${navBad.slice(0, 8).map((r) => r.w).join(', ') || '无'}`);
    // 8) 搜索胶囊连续收缩情况（T1）
    const t1 = rows.filter((r) => r.w >= 1272);
    if (t1.length) L.push(`T1 搜索胶囊宽: ${Math.min(...t1.map((r) => r.searchW))}–${Math.max(...t1.map((r) => r.searchW))}（应≈恒定 220）`);
    // 9) window.innerWidth 与设定宽度是否一致（查 mobile 缩放异常）
    const winOdd = rows.filter((r) => r.winW !== r.w || (r.vvW != null && r.vvW !== r.w));
    L.push(`innerWidth≠设定宽 的档位(${winOdd.length}): ${winOdd.slice(0, 5).map((r) => `${r.w}(win${r.winW}/vv${r.vvW})`).join(', ') || '无'}`);
  }
  fs.writeFileSync(BASE + '.txt', L.join('\n'));
  console.log(L.join('\n'));
} catch (e) {
  fs.writeFileSync(BASE + '.err.txt', String((e && e.stack) || e));
  throw e;
} finally {
  try { chrome.kill(); } catch {}
}
