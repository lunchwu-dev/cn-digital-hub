/**
 * 审查官独立复核脚本（不复用 leadverify2.mjs / sweep.mjs）
 *
 * 与 team-lead 脚本的三点方法差异，用于交叉验证而非复读：
 *  1. 文档级 overflow 之外，另做「元素级溢出审计」：只统计 computed overflow-x 为
 *     visible 的元素（排除 antd Table 那种 by-design 的 overflow:auto 滚动容器）。
 *     理由：若有人日后给 body 加 overflow-x:hidden，文档级 scrollWidth 会变绿而页面仍是坏的。
 *  2. 顶栏「不变式」断言：sum(直接子元素宽度) <= 容器 clientWidth —— 不依赖文档是否溢出。
 *  3. 连续扫描：375→1920 步进 1px（另在 1180-1340 关键区间加密复核）。
 *
 * 只读 dist 产物，不修改原型任何文件。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const DIST = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const OUT = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify/reviewer-audit.json';
const ROUTES = ['#/home', '#/news', '#/ops', '#/knowledge', '#/workspace'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 页面内测量函数（字符串注入，避免作用域问题）----
const MEASURE = `(() => {
  const de = document.documentElement;
  const topbar = document.querySelector('.dp-topbar');
  const inner = topbar ? topbar.querySelector('.dp-container') : null;
  const kids = inner ? Array.from(inner.children) : [];
  const kidsSum = Math.round(kids.reduce((a, el) => a + el.getBoundingClientRect().width, 0));
  const innerClient = inner ? inner.clientWidth : null;

  // 元素级溢出：只看内容真的会画出去的（overflow-x 非滚动/隐藏）
  let worst = { over: 0, sel: null };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.overflowX !== 'visible') continue;       // 滚动/裁剪容器不算
    if (cs.position === 'fixed' || cs.position === 'absolute') continue;
    if (cs.display === 'none' || el.clientWidth === 0) continue;
    const over = el.scrollWidth - el.clientWidth;
    if (over > worst.over) {
      worst = { over, sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0,2).join('.') : '') };
    }
  }
  return {
    vw: window.innerWidth,
    docScrollW: de.scrollWidth,
    docClientW: de.clientWidth,
    docOver: de.scrollWidth - de.clientWidth,
    bodyScrollW: document.body.scrollWidth,
    innerClientW: innerClient,
    topbarKidsSum: kidsSum,
    topbarFits: innerClient === null ? null : kidsSum <= innerClient,
    navW: Math.round((document.querySelector('.dp-nav') || {}).getBoundingClientRect?.().width || 0),
    logoW: Math.round((document.querySelector('.dp-logo') || {}).getBoundingClientRect?.().width || 0),
    actionsW: Math.round((document.querySelector('.dp-topbar-actions') || {}).getBoundingClientRect?.().width || 0),
    elOver: worst.over,
    elOverSel: worst.sel,
  };
})()`;

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async attach(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id);
        c.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 20000);
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
}

async function getJson(path) {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('CDP 未就绪 ' + path);
}

const userDataDir = 'C:/Users/uuzz/AppData/Local/Temp/reviewer-chrome-profile';
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${userDataDir}`, '--window-size=1440,900',
  'file:///' + DIST + '#/home',
], { stdio: 'ignore' });

const results = { meta: {}, widths: [], routes: [], continuous: [], invariant: [], notes: [] };

try {
  const ver = await getJson('/json/version');
  results.meta.browser = ver.Browser;
  const targets = await getJson('/json/list');
  const page = targets.find((t) => t.type === 'page');
  const cdp = await CDP.attach(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // 等应用挂载
  for (let i = 0; i < 60; i++) {
    try { if (await cdp.eval('!!document.querySelector(".dp-topbar")')) break; } catch {}
    await sleep(250);
  }
  await sleep(800);
  // 关掉首访 Tour（file:// 下 localStorage 可能不可用，直接点关闭兜底）
  await cdp.eval(`(() => { try { localStorage.setItem('dp_portal_tour_done','1'); } catch(e){}
    const b = document.querySelector('.ant-tour-close'); if (b) b.click();
    return !!b; })()`);
  await sleep(400);

  // ---- 阶段 1：5 路由 × 11 档（复现 team-lead 的矩阵，但用我的测量法）----
  for (const route of ROUTES) {
    await cdp.eval(`location.hash = ${JSON.stringify(route)}`);
    await sleep(700); // 路由切换有 320ms skeleton
    for (const w of [375, 414, 768, 900, 1024, 1152, 1240, 1280, 1366, 1440, 1920]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(140);
      const m = await cdp.eval(MEASURE);
      results.routes.push({ route, want: w, ...m });
    }
  }

  // ---- 阶段 2：全展开状态下核对 1269 这个「真实所需宽度」是否成立 ----
  await cdp.eval(`location.hash = '#/home'`); await sleep(700);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  const at1920 = await cdp.eval(MEASURE);
  const innerStyle = await cdp.eval(`(() => { const i = document.querySelector('.dp-topbar .dp-container');
    const cs = getComputedStyle(i); return { padL: cs.paddingLeft, padR: cs.paddingRight, gap: cs.gap, maxW: cs.maxWidth, clientW: i.clientWidth }; })()`);
  const kidW = await cdp.eval(`(() => { const i = document.querySelector('.dp-topbar .dp-container');
    return Array.from(i.children).map(el => ({ t: el.className, w: Math.round(el.getBoundingClientRect().width) })); })()`);
  results.invariant.push({ at1920, innerStyle, kidW });

  // ---- 阶段 3：连续扫描 #/home，375→1920 步进 1px ----
  await cdp.eval(`location.hash = '#/home'`); await sleep(700);
  for (let w = 375; w <= 1920; w++) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
    const m = await cdp.eval(MEASURE);
    results.continuous.push({ w, docOver: m.docOver, elOver: m.elOver, elOverSel: m.elOverSel, fits: m.topbarFits, navW: m.navW });
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));

  // ---- 汇总结论 ----
  const docBad = results.continuous.filter((r) => r.docOver > 0);
  const elBad = results.continuous.filter((r) => r.elOver > 1);
  const fitBad = results.continuous.filter((r) => r.fits === false);
  const routeBad = results.routes.filter((r) => r.docOver > 0 || r.elOver > 1);
  const navJump = [];
  for (let i = 1; i < results.continuous.length; i++) {
    if (results.continuous[i].navW !== results.continuous[i - 1].navW) navJump.push(`${results.continuous[i - 1].w}(${results.continuous[i - 1].navW}) -> ${results.continuous[i].w}(${results.continuous[i].navW})`);
  }
  const lines = [
    `browser: ${results.meta.browser}`,
    `连续扫描档位数: ${results.continuous.length}（375-1920 步进 1）`,
    `文档级溢出(>0) 的宽度数: ${docBad.length}${docBad.length ? ' -> ' + JSON.stringify(docBad.slice(0, 12)) : ''}`,
    `元素级溢出(>1px) 的宽度数: ${elBad.length}${elBad.length ? ' -> ' + JSON.stringify(elBad.slice(0, 12)) : ''}`,
    `顶栏不变式不成立(子元素和>容器) 的宽度数: ${fitBad.length}${fitBad.length ? ' -> ' + JSON.stringify(fitBad.slice(0, 12)) : ''}`,
    `5路由x11档 有问题的格数: ${routeBad.length}${routeBad.length ? ' -> ' + JSON.stringify(routeBad.slice(0, 12)) : ''}`,
    `dp-nav 宽度跳变点: ${navJump.join(' | ') || '无'}`,
    `1920 全展开: logo=${at1920.logoW} nav=${at1920.navW} actions=${at1920.actionsW} 子元素和=${at1920.topbarKidsSum} 容器clientW=${at1920.innerClientW} 需含padding=${at1920.topbarKidsSum}+${innerStyle.padL}+${innerStyle.padR}`,
    `子元素明细: ${JSON.stringify(kidW)}`,
  ].join('\n');
  fs.writeFileSync(OUT.replace('.json', '.txt'), lines);
  console.log(lines);
} finally {
  try { chrome.kill(); } catch {}
}
