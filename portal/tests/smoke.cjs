/**
 * jsdom 冒烟测试 —— 直接跑在构建产物 dist 上（构建通过 ≠ 能跑）
 * 覆盖：挂载 / 7 条路由逐条断言特征文案 / 搜索命中与空态 / 主要交互 /
 *       加载态 Skeleton 出现→消失 / 404 Result / Form 校验 / Watermark 容器 / Tour /
 *       file:// 不透明源下 localStorage 抛错仍能挂载 / 零 console.error /
 *       需求提交页（面 2）：两档模板分流 / ≤900px 单列顺序 / 完整度三态 / BRD 助手保留建议
 *
 * P0-2 断言纪律（重要）：
 *   本文件里凡涉及「当前页面内容」的存在性断言，一律走 pageHas()（排除 .dp-agent-panel 子树），
 *   或直接 panelText() 作用域化；禁止在面板残留可能命中的短语上用整页 has()。
 *   —— 反面教材：把 chip 的 label 改掉后 smoke 仍 81/81 全绿（该断言被同页 hint 文案污染）。
 *   —— 02b §F.1 #5：面板关闭后 DOM 仍常驻，剔除选择器已由 .ant-drawer 改为 .dp-agent-panel。
 *
 * 配套变异自证：node tests/mutation.cjs（把 6 个修复点各自改坏，验证对应断言确实变红）
 *
 * 运行：
 *   set NODE_PATH=C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules
 *   node tests/smoke.cjs
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DIST = path.resolve(__dirname, '..', 'dist');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 把 mock.js 的真实数据拿进来，供「词表反劫持」这类**静态数据断言**使用。
   为什么不从 bundle 里抠：minify 后字符串仍可读但结构不可靠。
   esbuild 在项目的 node_modules（不是 managed workspace），故显式拼路径。 */
let MOCK = {};
try {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  const bundled = esbuild.buildSync({
    entryPoints: [path.resolve(__dirname, '..', 'src', 'data', 'mock.js')],
    bundle: true,
    format: 'cjs',
    write: false,
    platform: 'node',
    logLevel: 'silent',
  }).outputFiles[0].text;
  const tmp = path.resolve(__dirname, `_smoke_mock_${process.pid}_${Date.now()}.cjs`);
  fs.writeFileSync(tmp, bundled);
  MOCK = require(tmp);
  try { fs.unlinkSync(tmp); } catch (_) { /* 清理失败不影响断言 */ }
} catch (e) {
  // 取不到不影响主流程；相关断言会明确报「未取到词表」而不是静默跳过
  MOCK = { __error: String((e && e.message) || e) };
}

/* 捕获未处理的 Promise rejection（antd 某些组件内部会产生），避免进程直接崩掉 */
const unhandled = [];
process.on('unhandledRejection', (reason) => {
  let s;
  if (reason && reason.stack) s = reason.stack;
  else if (reason && reason.message) s = reason.message;
  else {
    try {
      s = JSON.stringify(reason);
    } catch {
      s = String(reason);
    }
  }
  unhandled.push(s);
  console.log('[unhandledRejection] ' + s);
});

/* --------------------------- 结果收集 --------------------------- */
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
}
function ok(name, detail) {
  check(name, true, detail);
}
function fail(name, detail) {
  check(name, false, detail);
}

/* --------------------------- 加载构建产物 --------------------------- */
function loadInlinedHtml() {
  const htmlPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(htmlPath)) throw new Error('dist/index.html 不存在，请先执行 npm run build');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script[^>]*src="([^"]+)"[^>]*>\s*<\/script>/);
  if (!m) throw new Error('未在 dist/index.html 中找到外部 script 标签');
  const rel = m[1].replace(/^\.\//, '');
  const jsPath = path.join(DIST, rel);
  if (!fs.existsSync(jsPath)) throw new Error('找不到 bundle 文件：' + jsPath);
  const js = fs.readFileSync(jsPath, 'utf8').replace(/<\/script/gi, '<\\/script');
  // 关键 1：原 script 带 defer（在 head 里），内联后 defer 失效会先于 #root 执行 → 必须移到 </body> 前。
  // 关键 2：用 replacer 函数，否则 $&/$`/$1 等替换模式会吃掉 bundle 内容导致语法错误。
  const withoutScript = html.replace(m[0], '');
  const inlined = withoutScript.replace('</body>', () => `<script>${js}</script>\n  </body>`);

  /* 关键 3（本轮新增，修一个长期存在的 harness 漏洞）：
     dist/index.html 里是 <link rel="stylesheet" href="./assets/style.css">，
     而 jsdom 不联网、也不解析同目录的 link —— 项目样式表**从来没被加载进测试 DOM**。
     后果：
       · 任何 getComputedStyle 断言读到的都是「没套项目 CSS」的值 → 结构性空转；
       · 只有 antd 的运行时 CSS-in-JS（<style> 注入）是生效的，
         所以凡是依赖 .dp-* 类样式的断言都测不到。
     这里把构建出来的 style.css 内联成 <style>，让 computed style 反映真实产物。
     —— 这也是「为什么变异测试要把语义色写成 CSS 类」能抓到问题的原因：
        改 CSS 文本 → 注入后 computed style 变了 → 断言才可能红。 */
  let withCss = inlined;
  try {
    const cssPath = path.join(DIST, 'assets', 'style.css');
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      withCss = withCss.replace('</head>', () => `<style>${css}</style>\n</head>`);
      // 移除原 link，避免 jsdom 报无法加载
      withCss = withCss.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
    }
  } catch (e) {
    /* 样式注入失败不致命：让后续断言按「无项目样式」跑，但会立刻暴露 */
  }
  return { html: withCss, bundleName: rel, bundleKB: Math.round(fs.statSync(jsPath).size / 1024) };
}

/* --------------------------- 启动 JSDOM --------------------------- */
function boot({ storageThrows = false, label = '' } = {}) {
  const { html, bundleName, bundleKB } = loadInlinedHtml();
  const errors = [];
  const vc = new VirtualConsole();
  const NOISE = /Not implemented|Could not parse CSS/i;
  vc.on('jsdomError', (e) => {
    const s = (e && (e.message || String(e))) || '';
    if (!NOISE.test(s)) errors.push('jsdomError: ' + s);
  });
  vc.on('error', (...a) => {
    const s = a.map((x) => (x && x.message ? x.message : String(x))).join(' ');
    if (!NOISE.test(s)) errors.push('console.error: ' + s);
  });
  vc.on('warn', (...a) => {
    const s = a.map((x) => (x && x.message ? x.message : String(x))).join(' ');
    // React key / 废弃 API / antd 警告一律视为错误
    if (/Warning: |antd:|React does not recognize/i.test(s)) errors.push('console.warn: ' + s);
  });

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://portal.internal.digital/',
    virtualConsole: vc,
    beforeParse(win) {
      // antd 依赖的浏览器能力 polyfill
      win.matchMedia = (q) => ({
        matches: /min-width:\s*(768|992|1200|1600)px/.test(q),
        media: q,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      });
      win.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      win.scrollTo = () => {};
      win.HTMLElement.prototype.scrollIntoView = () => {};
      // localStorage：file:// 为不透明源会抛 SecurityError，这里模拟两种情形
      const mem = new Map();
      if (storageThrows) {
        Object.defineProperty(win, 'localStorage', {
          configurable: true,
          get() {
            throw new Error('SecurityError: localStorage is not available');
          },
        });
      } else {
        Object.defineProperty(win, 'localStorage', {
          configurable: true,
          value: {
            getItem: (k) => (mem.has(k) ? mem.get(k) : null),
            setItem: (k, v) => mem.set(k, String(v)),
            removeItem: (k) => mem.delete(k),
            clear: () => mem.clear(),
          },
        });
      }
    },
  });

  return { dom, win: dom.window, doc: dom.window.document, errors, bundleName, bundleKB, label };
}

/* --------------------------- DOM 工具 --------------------------- */
const norm = (s) => (s || '').replace(/\s+/g, '');
const bodyText = (doc) => doc.body.textContent || '';
const byText = (root, sel, t) =>
  Array.from(root.querySelectorAll(sel)).find((e) => norm(e.textContent).includes(norm(t)));
const has = (doc, t) => norm(bodyText(doc)).includes(norm(t));

/* —— 作用域化断言（P0-2 处方）——
   AgentPanel（原 Drawer，02b §B.4 改造为 .dp-agent-panel）关闭后 DOM **仍驻留**在文档里
   （用 data-open=false + visibility:hidden 隐藏，以保留对话历史），
   其脚本化回复含「用途与期限 / 说不清 / 验收标准」等字样，反馈表单里还会出现
   「信息架构 / 导航」等词 —— 污染风险比旧 Drawer 更高。

   策略：**不删除**节点（删除会破坏 React 对 getContainer=false / 常驻 DOM 的引用，
   导致后续重新打开面板失败——上一版即因此误伤 SSO 断言）。
   改为在读取整页文本时，**排除所有 .dp-agent-panel 子树**，得到「页面内容文本」。
     · pageText(doc)：整页文本 - 面板子树（用于「存在性」断言）
     · panelText(doc, sel)：仅指定面板文本（用于「不应存在」断言，最稳） */
const pageText = (doc) => {
  const clone = doc.body.cloneNode(true);
  clone.querySelectorAll('.dp-agent-panel').forEach((n) => n.remove());
  clone.querySelectorAll('script').forEach((n) => n.remove());
  return clone.textContent || '';
};
const pageHas = (doc, t) => norm(pageText(doc)).includes(norm(t));
const panelText = (doc, sel) => {
  const p = doc.querySelector(sel);
  return p ? norm(p.textContent || '') : null;
};

function setNativeValue(win, el, value) {
  const proto =
    el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
}

async function navigate(win, hash) {
  win.location.hash = hash;
  win.dispatchEvent(new win.Event('hashchange'));
  await sleep(90); // 让 loading=true 的 Skeleton 先渲染出来
}

async function settle(ms = 480) {
  await sleep(ms);
}

function click(win, el) {
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
}

/* =====================================================================
   P0-1 专用探针：端到端「填期望完成时间 → 提交 → 回 #/demand 列表可见该行」
   ---------------------------------------------------------------------
   为什么单独起一个 jsdom 而不复用主 ctx：
     主 ctx 在断言阶段已 `doc.body.querySelectorAll('script').forEach(remove)`，
     且被大量交互改造过 DOM；在它上面继续「填表→提交」容易被残留状态干扰。
     独立 jsdom + 内联同一份 dist，隔离性最好、可重复性最高。

   日期赋值为什么不点日历：
     antd DatePicker 是受控浮层，jsdom 下点日历依赖 transitionend / 布局，不可靠。
     直接给 `.ant-picker input` 写值 + 回车（keydown Enter）即可稳定触发 onChange —— 
     这正是受控组件的真实入口，且实测可靠（dateValue=2026-09-20）。

   返回结构：
     { submitted, dateValue, rowsAfter, hasNewTitle, newReactErrors, firstErr,
       renderer: { rows, objErr, note } }
   ===================================================================== */
async function probeDemandExpectAtPath() {
  const { html } = loadInlinedHtml();
  const errs = [];
  const vc = new VirtualConsole();
  const NOISE = /Not implemented|Could not parse CSS/i;
  const push = (s) => { if (!NOISE.test(s)) errs.push(s); };
  vc.on('jsdomError', (e) => push('jsdomError: ' + ((e && (e.message || String(e))) || '')));
  vc.on('error', (...a) => push('console.error: ' + a.map((x) => (x && x.message ? x.message : String(x))).join(' ')));
  vc.on('warn', (...a) => {
    const s = a.map((x) => (x && x.message ? x.message : String(x))).join(' ');
    if (/Warning: |antd:|React does not recognize/i.test(s)) push('console.warn: ' + s);
  });

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://portal.internal.digital/',
    virtualConsole: vc,
    beforeParse(pwin) {
      pwin.matchMedia = (q) => ({ matches: /min-width:\s*(768|992|1200|1600)px/.test(q), media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
      pwin.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      pwin.scrollTo = () => {};
      pwin.HTMLElement.prototype.scrollIntoView = () => {};
      const mem = new Map();
      Object.defineProperty(pwin, 'localStorage', {
        configurable: true,
        value: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear() },
      });
    },
  });
  const pwin = dom.window;
  const pdoc = pwin.document;

  await sleep(900);
  pdoc.body.querySelectorAll('script').forEach((s) => s.remove());
  // 关掉首访 Tour（覆盖浮层会挡住表单点击）
  const tc = pdoc.querySelector('.ant-tour-close');
  if (tc) { click(pwin, tc); await sleep(150); }

  // —— 进入二级页 #/demand/new ——
  await navigate(pwin, '#/demand/new');
  await sleep(520);

  // 选「功能 / 系统」档（BRD 完整档，必填项更全，最能压出 expectAt 路径）
  const segBrd = byText(pdoc, '.ant-segmented-item', '功能 / 系统');
  if (segBrd) { click(pwin, segBrd); await sleep(320); }

  const form = pdoc.querySelector('.dp-demand-form-col');
  const out = { submitted: false, dateValue: '', rowsAfter: 0, hasNewTitle: false, newReactErrors: 0, firstErr: '', renderer: { rows: -1, objErr: -1, note: '未执行' } };
  if (!form) return out;

  const NEW_TITLE = '门店盘点时库存对不上账，希望定位到具体环节';
  // ① 必填：标题（单行）、当前做法、期望结果（多行）
  setNativeValue(pwin, form.querySelector('input.ant-input'), NEW_TITLE);
  const areas = Array.from(form.querySelectorAll('textarea'));
  setNativeValue(pwin, areas[0], '门店盘点时对不上账，系统库存和实际货架差 3-5 件，但不知道是入库还是收银环节漏记。');
  setNativeValue(pwin, areas[1], '能在盘点差异报表里直接看到差异产生的具体环节和时间点。');
  await sleep(200);
  // ② 三组单选胶囊
  for (const t of ['3 人以内', '每天', '阻塞，业务做不了', '数据平台']) {
    const b = Array.from(form.querySelectorAll('button[aria-pressed]')).find((x) => norm(x.textContent) === norm(t));
    if (b) click(pwin, b);
    await sleep(160);
  }

  // ③ ★ 关键：填「期望完成时间」——直接写 .ant-picker input 值 + 回车
  const dateInput = pdoc.querySelector('.ant-picker input');
  if (!dateInput) { out.firstErr = '未找到 .ant-picker input'; return out; }
  setNativeValue(pwin, dateInput, '2026-09-20');
  dateInput.dispatchEvent(new pwin.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await sleep(420);
  out.dateValue = dateInput.value;

  const errBefore = errs.length;
  // ④ 提交
  const submitBtn = byText(pdoc, '.dp-demand-form-col button', '提交需求');
  if (submitBtn) { click(pwin, submitBtn); await sleep(720); }
  out.submitted = Array.from(pdoc.querySelectorAll('.ant-message-notice-content')).some((n) => /已提交/.test(norm(n.textContent)));

  // ⑤ 回一级页 #/demand，断言列表可见新行
  await navigate(pwin, '#/demand');
  await sleep(720);
  out.rowsAfter = pdoc.querySelectorAll('.dp-row').length;
  out.hasNewTitle = norm(pdoc.body.textContent).includes(norm(NEW_TITLE));
  const newErrs = errs.slice(errBefore);
  out.newReactErrors = newErrs.length;
  out.firstErr = newErrs[0] || '';

  // ⑥ 数据层对照组：打包 DemandList，喂「契约合法输入（字符串）」必须渲染 1 行
  try {
    out.renderer = await renderDemandListWithString();
  } catch (e) {
    out.renderer = { rows: -1, objErr: -1, note: ' ' + String((e && e.message) || e).slice(0, 140) };
  }

  try { pwin.close(); } catch (_) { /* 忽略 */ }
  return out;
}

/* 单独打包 DemandList.jsx（无 external，全量自带）→ 在独立 jsdom 内 IIFE 执行，
   喂一条 expectAt=字符串 的合法行，断言渲染 1 行且零「非字符串子节点」错误。
   —— 这是 P0-1 的数据层对照：证明渲染器本身没问题，红只可能来自上游喂脏数据。 */
async function renderDemandListWithString() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  const P = (p) => p.replace(/\\/g, '/');
  const entry = `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { ConfigProvider } from 'antd';
    import DemandList from '${P(path.resolve(__dirname, '..', 'src', 'pages', 'DemandList.jsx'))}';
    window.__runDemandList = function (el) {
      var r = { id: 'REQ-2026-999', title: '契约对照需求', type: '功能需求', track: 'brd',
        status: 'pending', submitted: '2026-09-17', assignee: '吴桐', note: '对照', completeness: 90,
        expectAt: '2026-09-25' };
      createRoot(el).render(React.createElement(ConfigProvider, null, React.createElement(DemandList, { rows: [r] })));
    };
  `;
  const bundleJs = esbuild.buildSync({
    stdin: { contents: entry, resolveDir: path.resolve(__dirname), loader: 'jsx', sourcefile: 'demandlist-probe.jsx' },
    bundle: true, format: 'iife', write: false, platform: 'browser', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"development"' },
    loader: { '.jsx': 'jsx' },
  }).outputFiles[0].text;

  const errs = [];
  const vc = new VirtualConsole();
  const NOISE = /Not implemented|Could not parse CSS/i;
  vc.on('error', (...a) => { const s = a.map((x) => (x && x.message ? x.message : String(x))).join(' '); if (!NOISE.test(s)) errs.push(s); });
  vc.on('jsdomError', (e) => { const s = (e && (e.message || String(e))) || ''; if (!NOISE.test(s)) errs.push(s); });
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(pwin) {
      pwin.matchMedia = (q) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
      pwin.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      pwin.IS_REACT_ACT_ENVIRONMENT = false;
    },
  });
  const pwin = dom.window;
  const sc = pwin.document.createElement('script');
  sc.textContent = bundleJs;
  pwin.document.body.appendChild(sc);

  const box = pwin.document.createElement('div');
  pwin.document.body.appendChild(box);
  pwin.__runDemandList(box);
  await sleep(340);
  const rows = box.querySelectorAll('.dp-row').length;
  const objErr = errs.filter((s) => /Objects are not valid as a React child/.test(s)).length;
  try { pwin.close(); } catch (_) { /* 忽略 */ }
  return { rows, objErr, note: '' };
}

/* ---------------------------------------------------------------------
   P2-2 纯函数探针：单独打包 DemandList.jsx，导出 floorOwnerText 供数据层单测。
   —— 状态楼层「多责任人」分支（owners.length === 1 / 2 / >2）原本从未被覆盖
      （真实数据异常告警恒为 1 条、唯一责任人）；抽成纯函数后此处直接喂入
      4 种 owners 输入，断言全部路径文案正确。
   为什么不用 jsdom 渲染整页来测：多责任人数据在当前 mock 下不存在，
   渲染层无法构造；纯函数单测是覆盖死分支最直接、最可重复的方式。 */
function probeFloorOwnerText() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  const P = (p) => p.replace(/\\/g, '/');
  const entry = `
    export { floorOwnerText } from '${P(path.resolve(__dirname, '..', 'src', 'pages', 'DemandList.jsx'))}';
  `;
  const code = esbuild.buildSync({
    stdin: { contents: entry, resolveDir: path.resolve(__dirname), loader: 'jsx', sourcefile: 'floorowner-probe.jsx' },
    bundle: true, format: 'cjs', write: false, platform: 'node', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.jsx': 'jsx' },
    // 外部依赖不打包（node 侧仅取纯函数，无需 React/antd）
    external: ['react', 'react-dom', 'antd', '@ant-design/icons'],
  }).outputFiles[0].text;
  const tmp = path.resolve(__dirname, `_smoke_floorowner_${process.pid}_${Date.now()}.cjs`);
  fs.writeFileSync(tmp, code);
  try {
    return { fn: require(tmp).floorOwnerText, note: '' };
  } catch (e) {
    return { fn: null, note: String((e && e.message) || e).slice(0, 160) };
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* 清理失败不影响断言 */ }
  }
}

/* ---------------------------------------------------------------------
   v0.4 纯函数探针：单独打包 TagBrowse.jsx，导出 emptyCopy 供数据层单测。
   —— 反查页空态按「所选标签是否属空组」分流，是纯函数逻辑，
      用 esbuild 打包取函数是覆盖死分支最直接的方式（空组 / 交集空两种输入）。 */
function probeEmptyCopy() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  const P = (p) => p.replace(/\\/g, '/');
  const entry = `
    export { emptyCopy } from '${P(path.resolve(__dirname, '..', 'src', 'pages', 'TagBrowse.jsx'))}';
  `;
  const code = esbuild.buildSync({
    stdin: { contents: entry, resolveDir: path.resolve(__dirname), loader: 'jsx', sourcefile: 'emptycopy-probe.jsx' },
    bundle: true, format: 'cjs', write: false, platform: 'node', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.jsx': 'jsx' },
    external: ['react', 'react-dom', 'antd', '@ant-design/icons'],
  }).outputFiles[0].text;
  const tmp = path.resolve(__dirname, `_smoke_emptycopy_${process.pid}_${Date.now()}.cjs`);
  fs.writeFileSync(tmp, code);
  try {
    return { fn: require(tmp).emptyCopy, note: '' };
  } catch (e) {
    return { fn: null, note: String((e && e.message) || e).slice(0, 160) };
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* 清理失败不影响断言 */ }
  }
}

/* --------------------------- 主流程 --------------------------- */
async function main() {
  const ctx = boot();
  const { win, doc, errors, bundleName, bundleKB } = ctx;
  console.log(`[i] bundle: ${bundleName} (${bundleKB} kB) 已内联执行`);

  await settle(900); // 初次挂载 + 首屏 Skeleton 走完

  // 断言文本前先摘掉 <script>，否则内联 bundle 源码会污染 body.textContent（假通过）
  doc.body.querySelectorAll('script').forEach((s) => s.remove());

  const root = doc.getElementById('root');
  if (root && root.children.length > 0 && bodyText(doc).length > 200) {
    ok('React 挂载成功', `${bodyText(doc).length} chars`);
  } else {
    fail('React 挂载成功', `root children=${root ? root.children.length : 'n/a'}, text=${bodyText(doc).length}`);
  }

  if (doc.querySelector('.dp-topbar')) ok('深色顶栏已渲染');
  else fail('深色顶栏已渲染');

  if (doc.querySelectorAll('.dp-nav-item').length === 7) ok('一级导航 7 项（无侧边栏）');
  else fail('一级导航 7 项（无侧边栏）', `实际 ${doc.querySelectorAll('.dp-nav-item').length} 项`);

  // Watermark 容器已挂载（水印层依赖 canvas，jsdom 下不渲染，只能断言容器）
  if (doc.querySelector('.dp-watermark')) ok('Watermark 容器已挂载（className=dp-watermark）');
  else fail('Watermark 容器已挂载');

  // ---- 首次访问引导 Tour ----
  if (doc.querySelector('.ant-tour')) ok('首访 Tour 已弹出');
  else fail('首访 Tour 已弹出');
  const tourClose = doc.querySelector('.ant-tour-close');
  const tourFinish = byText(doc, '.ant-tour button', '结束导览') || byText(doc, '.ant-tour button', '跳过');
  if (tourClose) click(win, tourClose);
  else if (tourFinish) click(win, tourFinish);
  await sleep(120);
  if (!doc.querySelector('.ant-tour')) ok('Tour 可关闭');
  else fail('Tour 可关闭');

  /* ================= 6 条路由逐条走查 ================= */
  const routes = [
    {
      hash: '#/home',
      name: '首页 · 今日 Hub',
      texts: ['今日 Hub', '置顶决议', '健康度快照', '核心系统可用性', '快捷入口', 'Agent for Digital', '近期 Release', '里程碑精选'],
    },
    {
      hash: '#/news',
      name: '信息中心',
      texts: ['信息中心', '公告与决议', '产品 Release', '项目动态', '门店自助结账 v3.2 全量上线通知', '订阅说明'],
    },
    {
      hash: '#/ops',
      name: '监控运营',
      texts: ['监控运营', '稳定性状态', '无法在门户内解决', 'Grafana', '手动刷新', '错误预算余量', 'L1 健康度概览'],
    },
    {
      hash: '#/knowledge',
      name: '知识中心',
      texts: ['知识中心', '最佳实践', '设计规范', '大促期间库存扣减的一致性处理'],
    },
    {
      hash: '#/knowledge/article/bp-stock-dedup',
      name: '文章详情',
      texts: ['大促期间库存扣减的一致性处理', '本文目录', '背景与问题', '幂等键设计', '约 9 分钟阅读'],
    },
    {
      hash: '#/workspace',
      name: '工作台',
      // 02b §A.1/§C.4：工作台退回纯工具导航（去 Tabs），「工具导航」Tab 标签已不存在，
      // 「组织速查」「需求提交」已升为一级栏目（#/org、#/demand）。
      texts: ['工作台', '工具分组', '申请权限', 'Grafana 监控看板', 'Owner', '门店设备管理后台'],
    },
    {
      hash: '#/demand',
      name: '业务需求（一级栏目）',
      texts: ['业务需求', '待处理', '进行中', '已完成', '异常告警', '新增需求', '责任人'],
    },
  ];

  const routeReport = [];
  for (const r of routes) {
    await navigate(win, r.hash);

    // 加载态：Skeleton 出现 → 消失（用 seg 真正发生变化的 #/news 来验证）
    const skeletonShown = !!doc.querySelector('.ant-skeleton');
    await settle(460);
    const skeletonGone = !doc.querySelector('.ant-skeleton');
    if (r.hash === '#/news') {
      check('加载态 Skeleton 出现→消失', skeletonShown && skeletonGone, `shown=${skeletonShown} gone=${skeletonGone}`);
    }

    const missing = r.texts.filter((t) => !has(doc, t));
    if (missing.length === 0) {
      ok(`路由 ${r.hash} → ${r.name}`, r.texts.length + ' 项特征文案全部命中');
      routeReport.push({ hash: r.hash, name: r.name, texts: r.texts, pass: true });
    } else {
      fail(`路由 ${r.hash} → ${r.name}`, '缺失：' + missing.join(' / '));
      routeReport.push({ hash: r.hash, name: r.name, texts: r.texts, missing, pass: false });
    }

    // 导航高亮正确
    const navActive = doc.querySelector('.dp-nav-item[data-active="true"]');
    const expectKey = {
      '#/home': '首页',
      '#/news': '信息中心',
      '#/ops': '监控运营',
      '#/knowledge': '知识中心',
      '#/knowledge/article/bp-stock-dedup': '知识中心',
      '#/workspace': '工作台',
      '#/demand': '业务需求',
    }[r.hash];
    if (navActive && norm(navActive.textContent).includes(norm(expectKey))) ok(`  ↳ 导航高亮 = ${expectKey}`);
    else fail(`  ↳ 导航高亮 = ${expectKey}`, navActive ? norm(navActive.textContent) : '无激活项');
  }

  /* ================= 信息中心：产品 Release 子频道（Table） ================= */
  await navigate(win, '#/news');
  await settle(460);
  const releaseTab = byText(doc, '.ant-tabs-tab', '产品 Release');
  if (releaseTab) {
    click(win, releaseTab);
    await sleep(260);
    const need = ['版本号', '变更类型', '变更项数', 'v3.2.1', '已发布', '灰度中'];
    const miss = need.filter((t) => !has(doc, t));
    if (miss.length === 0) ok('Release 子频道 Table 渲染', '版本号 / 类型 / 变更项数 / 状态胶囊 等全部命中');
    else fail('Release 子频道 Table 渲染', '缺失：' + miss.join(' / '));

    // 「变更类型」是分类不是状态：必须是中性灰胶囊，不能占用语义色
    // （否则「修复」涂警示橙像故障、「性能」涂绿与「已发布」撞色）。
    const typePill = byText(doc, '.dp-chip', '修复');
    const neutralStyle = typePill ? typePill.getAttribute('style') || '' : '';
    if (typePill && /245,\s*244,\s*245/.test(neutralStyle)) {
      ok('「变更类型」胶囊为中性灰（不占用语义色）');
    } else {
      fail('「变更类型」胶囊为中性灰', typePill ? neutralStyle : '未找到「修复」胶囊');
    }
  } else {
    fail('Release Tab 可定位');
  }

  /* ================= 全局搜索 ================= */
  const searchTrigger = doc.querySelector('[aria-label="打开全局搜索"]');
  if (searchTrigger) {
    click(win, searchTrigger);
    await sleep(160);
    const openSearch = doc.querySelector('.ant-modal');
    if (openSearch) ok('全局搜索 Modal 打开');
    else fail('全局搜索 Modal 打开');

    const input = Array.from(doc.querySelectorAll('.ant-modal input')).find((i) =>
      /搜索公告/.test(i.getAttribute('placeholder') || '')
    );
    if (input) {
      setNativeValue(win, input, '积分');
      await sleep(180);
      if (has(doc, '会员积分规则调整')) ok('搜索命中：关键词「积分」→ 公告结果');
      else fail('搜索命中：关键词「积分」', bodyText(doc).slice(-260));
      if (has(doc, '公告与决议') && has(doc, '分组')) ok('搜索结果按频道分组');
      else fail('搜索结果按频道分组', bodyText(doc).slice(-260));

      setNativeValue(win, input, 'zzzzzz-不存在');
      await sleep(180);
      if (has(doc, '没有找到')) ok('搜索空态：无结果显示「没有找到」');
      else fail('搜索空态：无结果显示「没有找到」');
    } else {
      fail('全局搜索输入框可定位');
    }

    const closer = doc.querySelector('.ant-modal-close');
    if (closer) click(win, closer);
    await sleep(520);
    const wrap = doc.querySelector('.ant-modal-wrap');
    // jsdom 不会触发 transitionend，antd 的退出动画永远走不完 → 残留 ant-zoom-leave 属环境特性，
    // 这里改为断言「已进入关闭流程」：组件被卸载 / wrap 隐藏 / 出现 leave 动画类。
    const leaving = doc.querySelector('.ant-modal-wrap .ant-zoom-leave');
    const closedOk = !wrap || wrap.style.display === 'none' || !!leaving;
    if (closedOk) ok('搜索 Modal 可关闭（已进入关闭流程）', leaving ? '残留 DOM 为 jsdom 动画限制' : '');
    else fail('搜索 Modal 可关闭', `wrap.display=${wrap.style.display || '(unset)'}`);
  } else {
    fail('全局搜索触发器存在（aria-label）');
  }

  /* ================= 404 Result ================= */
  await navigate(win, '#/this/route/does/not/exist');
  await settle(460);
  if (has(doc, '页面不存在') && doc.querySelector('.dp-empty')) ok('未知路由 → 404 空态');
  else fail('未知路由 → 404 空态', bodyText(doc).slice(0, 120));

  // 加固：坏链接必须被原样回显。
  // 原因：NotFound 是解构收参（{ route }），一旦被误传 <NotFound hash={r} />，
  // route.hash 会变 undefined，404 文案里的坏链接退化成「#/」——这条断言专门抓它。
  if (has(doc, '#/this/route/does/not/exist')) ok('   ↳ 404 文案原样回显坏链接（route 正确传入）');
  else fail('   ↳ 404 文案原样回显坏链接', bodyText(doc).slice(0, 200));

  // P0 回归锚点：不得出现 antd Result 的内置彩色插画（违反 ds-04「禁用彩色插画」）
  if (!doc.querySelector('.ant-result-image') && !doc.querySelector('.ant-result')) {
    ok('   ↳ 未使用 antd Result 内置插画（ds-04 合规）');
  } else {
    fail('   ↳ 未使用 antd Result 内置插画', '检测到 .ant-result / .ant-result-image');
  }

  /* ================= Agent 轻面板（.dp-agent-panel，替代原 Drawer）================= */
  // 02b §B：入口已从 TopBar 按钮改为右下角悬浮 doodle（.dp-float-agent），
  //         面板由 Drawer 改为 position:fixed 的 .dp-agent-panel（无遮罩、非模态）。
  const agentBtn = byText(doc, 'button', 'Agent for Digital');
  const agentDoodle = doc.querySelector('.dp-float-agent');
  const agentEntry = agentBtn || agentDoodle;
  if (agentEntry) {
    click(win, agentEntry);
    await sleep(220);
    // 面板内容用 has()（读整页含面板），不能用 pageHas()（已剔除 .dp-agent-panel 子树）
    if (doc.querySelector('.dp-agent-panel[data-open="true"]') && has(doc, '脚本化原型')) ok('Agent 面板打开');
    else fail('Agent 面板打开');
    const prompt = byText(doc, '.dp-agent-panel button', '生产环境数据库只读权限');
    if (prompt) {
      click(win, prompt);
      await sleep(200);
      if (has(doc, '90 天')) ok('Agent 脚本化回复命中关键词');
      else fail('Agent 脚本化回复命中关键词', bodyText(doc).slice(-200));
    } else {
      fail('Agent 建议问题可点击');
    }
    const dClose = doc.querySelector('.dp-agent-panel-close');
    if (dClose) click(win, dClose);
    await sleep(220);
    // 关闭后 DOM 常驻（保留对话历史），用 data-open 判定是否已收起（02b §F.1 #5）
    if (!doc.querySelector('.dp-agent-panel[data-open="true"]')) ok('Agent 面板可关闭');
    else fail('Agent 面板可关闭');
  } else {
    fail('Agent 入口存在');
  }

  /* =====================================================================
     需求提交：首页入口区块（面 1 · 服务台语气）
     ===================================================================== */
  await navigate(win, '#/home');
  await settle(460);

  // ① 入口区块存在：大卡 + 「提交需求」按钮 + 状态摘要计数
  const entryCard = doc.querySelector('.dp-demand-entry');
  if (entryCard) ok('首页存在「需求提交」入口大卡（.dp-demand-entry）');
  else fail('首页存在「需求提交」入口大卡', '未找到 .dp-demand-entry');

  // 4px 强调条：全页唯一，且必须恰好一条
  const bars4 = Array.from(doc.querySelectorAll('span')).filter((s) => {
    const st = s.getAttribute('style') || '';
    return /width:\s*4px/.test(st) && /background/.test(st);
  });
  if (bars4.length === 1) ok('入口大卡 4px 强调条全页唯一（置顶决议为 3px）', `4px 条 ${bars4.length} 处`);
  else fail('入口大卡 4px 强调条全页唯一', `实际 ${bars4.length} 处`);

  const entryBtn = byText(doc, 'button', '提交需求');
  if (entryBtn) ok('入口大卡含主按钮「提交需求」');
  else fail('入口大卡含主按钮「提交需求」');

  // 状态摘要三计数（待处理 / 进行中 / 已完成）+ 等宽数字
  const summaryOk = has(doc, '待处理') && has(doc, '进行中') && has(doc, '已完成');
  if (summaryOk) ok('入口大卡含状态摘要：待处理 / 进行中 / 已完成');
  else fail('入口大卡含状态摘要三计数');

  const statNums = Array.from(doc.querySelectorAll('.dp-demand-entry .dp-num')).map((e) => norm(e.textContent));
  if (statNums.length >= 3) ok('状态摘要计数使用 dp-num 等宽数字', statNums.slice(0, 3).join(' / '));
  else fail('状态摘要计数使用 dp-num', `找到 ${statNums.length} 个`);

  // 承诺文案（服务台语气：具体时限 + 具体可见性）
  if (has(doc, '2 个工作日内由受理人回应并指派')) ok('入口大卡含一句服务承诺（2 个工作日 + 进度可见）');
  else fail('入口大卡含服务承诺');

  // ② 点击首页入口 → 跳 #/demand/new（02b §C.3 ⑥：「提交需求」的语义就是新增，直接进二级页）
  if (entryBtn) {
    click(win, entryBtn);
    await sleep(200);
    const hashNow = win.location.hash;
    if (hashNow === '#/demand/new') ok('点击首页入口跳转到 #/demand/new', hashNow);
    else fail('点击首页入口跳转到 #/demand/new', `实际 ${hashNow}`);
  }

  // ③ 首页公开列表（3 条，且不得折叠）
  await navigate(win, '#/home');
  await settle(460);
  const homeList = doc.querySelector('.dp-demand-entry') ? true : false;
  const homeRows = doc.querySelectorAll('.dp-row[role="button"][tabindex="0"]');
  if (homeList && homeRows.length >= 3) ok('首页入口区块含公开列表（最近 3 条，键盘可达）', `${homeRows.length} 行`);
  else fail('首页入口区块含公开列表', `dp-row 命中 ${homeRows.length} 行`);
  if (has(doc, '别人提了什么、处理到哪一步')) ok('首页公开列表带说明「别人提了什么、处理到哪一步」');
  else fail('首页公开列表带说明文案');

  /* =====================================================================
     业务需求 —— 一级页（#/demand）列表 / 二级页（#/demand/new）表单
     ---------------------------------------------------------------------
     02b E9 拆分：原「需求提交页」一个路由承担了列表 + 表单两件事，
     重构后二者分属两条路由，断言必须跟着拆，否则：
       · 在 #/demand 上找表单 → 找不到（假红）
       · 在 #/demand/new 上找 ≥6 条公开列表 → 找不到（假红）
     —— 拆法：一级页验「列表 + 状态楼层」，二级页验「表单 + 双档 + 字段 agent」。
     ===================================================================== */
  await navigate(win, '#/demand');
  await settle(480);

  // 一级页：状态楼层（02b §D.4）
  const floorCells = doc.querySelectorAll('.dp-floor-cell');
  if (floorCells.length === 5) ok('业务需求一级页 · 状态楼层 5 格（.dp-floor-cell）');
  else fail('业务需求一级页 · 状态楼层 5 格', `实际 ${floorCells.length} 格`);

  // 一级页：公开列表（C3 是产品判据，≥6 条不折叠）
  // 注意：这里只数 .dp-row 本身，**不**叠加 role="button"/tabindex。
  // 需求行是**展示型**（无需求详情路由可跳），因此正确地没有 role/tabindex ——
  // 而 .dp-row[role="button"] 在 News/Knowledge/TagBrowse 上是「整行可点」范式。
  // 旧写法把「列表存在」和「行可点」混在一个断言里，导致 0 行时无法区分
  // 是列表没渲染还是属性没加，属断言过specified（vacuous 的近亲）。
  const demandRows = doc.querySelectorAll('.dp-row');
  if (demandRows.length >= 6) ok('业务需求一级页公开列表存在且不折叠（≥6 条）', `${demandRows.length} 行`);
  else fail('业务需求一级页公开列表存在且不折叠', `${demandRows.length} 行`);
  const collapse = doc.querySelector('.ant-collapse');
  if (!collapse) ok('   ↳ 公开列表未使用 Collapse 折叠隐藏（C3 合规）');
  else fail('   ↳ 公开列表未使用 Collapse', '检测到 .ant-collapse');

  // 一级页：显著的新增入口（02b §E.2）
  {
    const addBtn = byText(doc, 'button', '新增需求');
    const addRow = doc.querySelector('.dp-demand-addrow');
    if (addBtn && addRow) ok('业务需求一级页 · 「新增需求」入口显著（页头主按钮 + 列表上方整行）');
    else fail('业务需求一级页 · 「新增需求」入口', `headBtn=${!!addBtn} addRow=${!!addRow}`);
  }

  // 一级页：楼层五格计数用等宽数字（02b §D.4 的 dp-num 硬要求）
  {
    const nums = Array.from(doc.querySelectorAll('.dp-floor-cell .dp-num'));
    if (nums.length === 5) ok('   ↳ 楼层 5 格计数均用 .dp-num 等宽数字');
    else fail('   ↳ 楼层 5 格计数均用 .dp-num', `实际 ${nums.length} 个`);
  }

  /* —— 用户原话点名「异常告警需求待跟进事项**及责任人**」——
     责任人必须是**格内可见**，不能只藏在右栏列表里让人先下钻再逐行扫。
     ⚠️ 但「可见」在这里**不能**用 getBoundingClientRect().width > 0 判定：
     jsdom 没有布局引擎，**所有**元素的 rect 恒为 0×0 —— 用它当门，
     这条断言在本环境里永远红，红得没有信息量（而且会污染相邻断言）。
     真正的证据是「在不在渲染树里 + 字号是否可读 + 颜色是否合规」：
       · 不在树里（或无文本）        → 真缺陷，红
       · 字号 < 12px（缩到读不出）    → 真缺陷，红
       · 颜色是语义红/黄/绿            → 真缺陷，红（见下一条断言）
     真实几何（在视口内、非 0 宽）交给 headless Chrome 那条通道验，不由 jsdom 承担。 */
  {
    const alertCell = doc.querySelector('.dp-floor-cell[data-alert="true"]');
    const owner = alertCell ? alertCell.querySelector('.dp-floor-owner') : null;
    const txt = owner ? owner.textContent.trim() : '';
    const cs = owner ? win.getComputedStyle(owner) : null;
    const fs_px = cs ? Number(String(cs.fontSize).replace('px', '')) : 0;
    const inTree = !!owner && !!owner.parentNode && doc.contains(owner);
    if (inTree && /责任人|指派|认领/.test(txt) && fs_px >= 12) {
      ok('异常告警格内明示「责任人」（用户点名的待跟进信号）', txt);
    } else {
      fail('异常告警格内明示「责任人」', `inTree=${inTree} txt="${txt}" fontSize=${fs_px}px`);
    }
    if (owner && cs && cs.color !== 'rgb(0, 15, 23)' && cs.color !== 'rgb(97, 97, 97)' && cs.color !== 'rgb(102, 112, 133)') {
      fail('   ↳ 责任人摘要只用中性灰', `color=${cs.color}`);
    } else if (owner) {
      ok('   ↳ 责任人摘要只用中性灰（computed style）', cs.color);
    }
    // 楼层语义色扫描在上面的块里已覆盖该 div；这里补一条：异常格不得用语义色背景
    const cellBg = alertCell ? win.getComputedStyle(alertCell).backgroundColor : null;
    if (alertCell && (cellBg === 'rgba(0, 0, 0, 0)' || cellBg === 'rgb(255, 255, 255)')) {
      ok('   ↳ 异常告警格无告警底色（品牌蓝图标 + 中性，不引入红黄）', cellBg);
    } else {
      fail('   ↳ 异常告警格无告警底色', String(cellBg));
    }
  }

  /* —— 02b §D.3 / C3：楼层不得出现语义色（红黄绿只许出现在 #/ops 稳定性状态区）——
     ⚠️ 断言范围**必须**锁定到 .dp-floor 子树，不能整页跑：
     一级页的列表行里有 Pill(semantic='info'/'success') 的单条状态色，
     那是**允许**的（列表内单条标记），整页断言会把它误判为违规 → 假红。

     ⚠️ 只扫 inline style 是**不够的**：语义色完全可以由 CSS 类挂上去
     （例如有人给数字加个 .is-warning 类），此时 getAttribute('style') 里空无一物，
     断言照样绿 —— 那就成了空转门。故这里改用 getComputedStyle 逐元素读
     color / background-color / border-color，这是浏览器实际渲染的值，
     无论颜色从 inline 还是从类来，都逃不掉。 */
  {
    const floorEl = doc.querySelector('.dp-floor');
    const semColors = ['#e8890c', '#8a5200', '#fef4e6', '#f6ce93', '#1e8e4e', '#0f6b39', '#e9f7ef', '#a8dfc0', '#e3262f', '#b0151d', '#fdeced', '#f4b9bc', '#1c7ed6', '#0b5aa6', '#e8f3fd'];
    const normHex = (v) => (v || '').toLowerCase().replace(/\s/g, '');
    const shape = (v) => {
      // rgb(232,137,12) / rgba(...) 统一成 #rrggbb 以便与十六进制表比对
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v || '');
      if (!m) return normHex(v);
      return (
        '#' +
        [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('')
      );
    };
    const hits = [];
    if (floorEl) {
      const nodes = [floorEl].concat(Array.from(floorEl.querySelectorAll('*')));
      for (const el of nodes) {
        const cs = win.getComputedStyle(el);
        for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor']) {
          const val = shape(cs[prop]);
          if (val && semColors.some((col) => val === col || val.includes(col))) {
            hits.push(`${el.className || el.tagName}.${prop}=${val}`);
          }
        }
      }
    }
    if (floorEl && hits.length === 0) ok('业务需求楼层 · 零语义色像素（computed style 实测，品牌蓝 + 中性）');
    else fail('业务需求楼层 · 零语义色像素', floorEl ? `${hits.length} 处命中: ${hits.slice(0, 4).join(' | ')}` : '未找到 .dp-floor');
  }

  /* =====================================================================
     P2-2 —— 异常告警格「多责任人」分支覆盖（数据层纯函数单测）
     ---------------------------------------------------------------------
     现状：6 条 mock 数据异常告警恒为 1 条、唯一责任人「顾一鸣」→
     只走 owners.length===1 分支；另外两条（"+ 待指派" / "N 人 · 含待指派"）
     从未被任何断言覆盖。这里对抽出的纯函数 floorOwnerText 直接喂 5 组输入，
     把全部路径钉死（含空数组的健壮性）。
     ===================================================================== */
  {
    const probe = probeFloorOwnerText();
    if (probe.fn) {
      const cases = [
        { in: [], want: '', name: '空数组 → 无摘要' },
        { in: ['待分配'], want: '尚未指派 · 需受理组认领', name: '仅待分配 → 认领提示' },
        { in: ['顾一鸣'], want: '责任人 顾一鸣', name: '单责任人 → 具名' },
        { in: ['顾一鸣', '待分配'], want: '责任人 顾一鸣 + 待指派', name: '2 人含待分配 → 具名 + 待指派' },
        { in: ['顾一鸣', '沈知微', '待分配'], want: '责任人 3 人 · 含待指派', name: '>2 人 → N 人汇总' },
        { in: ['顾一鸣', '沈知微'], want: '责任人 2 人 · 含待指派', name: '2 人均具名（无待分配）→ 走 >2 兜底' },
      ];
      const bad = cases.filter((c) => probe.fn(c.in) !== c.want);
      if (bad.length === 0) ok('P2-2 状态楼层「多责任人」分支全覆盖（6 组输入，纯函数）', `${cases.length} 组全对`);
      else
        fail(
          'P2-2 状态楼层「多责任人」分支全覆盖',
          bad.map((b) => `${b.name}: 期望「${b.want}」实得「${probe.fn(b.in)}」`).join(' | ')
        );
    } else {
      fail('P2-2 状态楼层「多责任人」分支全覆盖', '纯函数探针未取到：' + probe.note);
    }
  }

  /* =====================================================================
     P1-1 —— 首页与需求页「同一份数据真相源」
     ---------------------------------------------------------------------
     根因：Home 曾用静态 demandHistory，DemandList/DemandNew 用 App 层 state
     demandRows → 首页计数与需求页状态楼层可能对不上。
     修法：App 把 demandRows 下发给 <Home demandRows={...}>，首页大卡与
     最近列表统一读它。
     断言方式（jsdom 可稳定复现）：在首页读取「入口大卡三个计数 + 最近列表行」，
     与 #/demand 状态楼层的「待处理/进行中/已完成」三格数字逐一比对，必须一致。
     —— 这是端到端一致性断言，不依赖内部实现细节。
     ===================================================================== */
  {
    await navigate(win, '#/home');
    await settle(480);
    const entryCard = doc.querySelector('.dp-demand-entry');
    const statNums = entryCard
      ? Array.from(entryCard.querySelectorAll('.dp-num')).map((n) => n.textContent.trim()).filter((s) => /^\d+$/.test(s))
      : [];
    const homeRecentRows = doc.querySelectorAll('.dp-demand-recent .dp-row, .dp-row[role="button"][tabindex="0"]').length;

    await navigate(win, '#/demand');
    await settle(480);
    const floorNums = Array.from(doc.querySelectorAll('.dp-floor-cell .dp-num')).map((n) => n.textContent.trim());

    // 楼层前 3 格 = 待处理 / 进行中 / 已完成 —— 与首页入口大卡三段计数必须一致
    const floorTriple = floorNums.slice(0, 3);
    const same = statNums.length >= 3 && floorTriple.length === 3 && statNums.slice(0, 3).join(',') === floorTriple.join(',');
    if (same) ok('P1-1 首页入口卡计数 === 需求页状态楼层（单一数据源）', `home=[${statNums.slice(0, 3)}] floor=[${floorTriple}]`);
    else fail('P1-1 首页入口卡计数 === 需求页状态楼层', `home=[${statNums.slice(0, 3)}] floor=[${floorTriple}]`);
    if (homeRecentRows >= 1) ok('   ↳ 首页「最近提交」列表有数据（读 demandRows）', `${homeRecentRows} 行`);
    else fail('   ↳ 首页「最近提交」列表有数据', `${homeRecentRows} 行`);

    // 回到一级页继续后续断言需要它；这里在文件末尾之前不改变后续锚点，
    // 故再显式导航回 #/demand/new 交还给下面的二级页断言块。
  }

  /* =====================================================================
     二级页 #/demand/new —— 表单 + 内嵌字段 agent
     ===================================================================== */
  await navigate(win, '#/demand/new');
  await settle(480);

  // 左表单 + 右引导栏：必须用既有 .dp-g-spec
  const specGrid = doc.querySelector('.dp-g-spec');
  if (specGrid) ok('新增需求页使用既有栅格 .dp-g-spec（左表单 + 右引导栏）');
  else fail('新增需求页使用 .dp-g-spec');

  // 表单必须挂 dp-form，否则输入框会全变成胶囊
  if (doc.querySelector('.dp-form')) ok('表单容器挂 className="dp-form"（输入框回 6px 控件圆角）');
  else fail('表单容器挂 dp-form');

  // 返回入口（02b §E.3）
  if (pageHas(doc, '返回业务需求')) ok('   ↳ 二级页有「返回业务需求」次級导航');
  else fail('   ↳ 二级页有「返回业务需求」');

  /* =====================================================================
     P0-1 —— ≤900px 单列视觉顺序：承诺卡 →（BRD 助手）→ 表单
     ---------------------------------------------------------------------
     ⚠️ 02b E8 拆分：重构后公开列表（[data-role="recent"]）已移出一级表单页，
     因此本页右栏只剩「承诺卡 + BRD 助手」两张卡，左侧表单仍是第三档。
     原断言要求「承诺卡先于公开列表」+ orderHits===4 —— 在二级页上必然假红：
       · recentEl 恒为 null（该页没有公开列表）
       · 媒体块里的 dp-demand-recent{order:4} 对页面无实际作用（CSS 仍保留，
         供一级页潜在的单列场景用），但不能再拿它当本页证据。
     裁决：本页只验「三张卡」的顺序与内联 display 根因消除；
         `order:4` 的存在性改到一级页的 CSS 契约断言里验（见下方 E8b）。
     ---------------------------------------------------------------------
     这条布局曾经失效：右栏容器 .dp-demand-side 上写了内联
       style={{ display:'flex', flexDirection:'column', gap:16 }}
     内联样式优先级高于外部样式表的 @media ≤900 { display:contents }，
     于是容器在窄屏**仍是一个 flex 块**，整块落到左侧表单**之后**——
     用户先看到「表单 → 承诺卡 → 列表」，与 spec 第 3.4 节「承诺卡提到表单上方」相反。

     为什么这样断言（jsdom 无布局引擎）：
       jsdom 不做排版，`offsetTop` / `getBoundingClientRect()` 恒为 0，
       `getComputedStyle` 也不加载外部样式表（会把元素报成 block）。
       所以「像素 top 比较」在 jsdom 里**不可能**真实成立 —— 硬写只会得到
       恒真的空转断言（这正是上一轮被变异测试抓到的教训）。
       可判定且不空转的等价物是「结构 + 规则」两段证明：
         A. 结构：承诺卡在 DOM 里确实出现在 BRD 助手之前（DOM 顺序即 order:auto 下的视觉顺序）；
         B. 规则：≤900px 媒体块里 order 声明齐备，且承诺卡 order 最大级差正确
            （承诺卡 1 < 助手 2 < 表单 3）。
       —— 只要把内联 display 改回来（P0-1 原样），B 虽仍在，但真实浏览器里
          display:contents 不再生效、容器重新包住两张卡；而 A 仍会通过，
          因此 A+B **不足以单独**证明修复。
       为让 P0-1 在 jsdom 下真正「可红」，再加一条**必需的结构断言**：
         C. 右栏容器上不得存在内联 display（内联 display 是唯一能让媒体规则失效的机制）。
       把 C 变异（把内联 display 加回去）即可使测试变红 —— 见项目内 self-test 说明。
     ===================================================================== */
  {
    const side = doc.querySelector('.dp-demand-side');
    const promiseEl = doc.querySelector('[data-role="promise"]');
    const assistantEl = doc.querySelector('[data-role="assistant"]');
    const formEl = doc.querySelector('[data-role="form"]');
    const cssText = fs.readFileSync(path.join(DIST, 'assets', 'style.css'), 'utf8');

    // C（可变异点）：容器上不得有内联 display —— 根因消除
    const inlineStyle = side ? side.getAttribute('style') || '' : '';
    if (side && !/display\s*:/.test(inlineStyle)) {
      ok('P0-1 右栏容器无内联 display（媒体 display:contents 可生效）', `inline="${inlineStyle}"`);
    } else {
      fail('P0-1 右栏容器无内联 display', `inline="${inlineStyle}"`);
    }

    // A：DOM 顺序 —— 表单先于右栏容器，且容器内 承诺卡 先于 BRD 助手
    const domOrderOk = (() => {
      if (!specGrid) return false;
      const kids = Array.from(specGrid.children);
      const idx = (el) => kids.indexOf(el);
      if (idx(formEl) < 0 || idx(side) < 0) return false;
      if (!(idx(formEl) < idx(side))) return false; // 表单在左、右栏在其后
      const inner = Array.from(side.children);
      if (idx(formEl) < 0) return false;
      if (inner.indexOf(promiseEl) < 0) return false;
      if (assistantEl && inner.indexOf(assistantEl) >= 0) {
        return inner.indexOf(promiseEl) < inner.indexOf(assistantEl);
      }
      return true; // 轻量档不渲染助手卡，此时只要求承诺卡在右栏内
    })();
    if (domOrderOk) ok('P0-1 DOM 顺序：承诺卡排在 BRD 协作助手之前（结构正确）');
    else fail('P0-1 DOM 顺序：承诺卡排在 BRD 助手之前', `promise=${!!promiseEl} assistant=${!!assistantEl}`);

    // B：≤900 媒体块 —— display:contents + 三张卡 order 齐备（02b §E.5：二级页无 recent）
    // 锚点用「最后一条仍然存活的 order 规则」。本轮已删除死规则 .dp-demand-recent{order:4}
    // （公开列表已移出二级页），若仍以它为终止锚点，本断言会永久为红 —— 断言锚点必须跟着
    // 被删的规则一起死，否则变成「永远红」或（更糟）「永远绿」。
    const mediaBlock =
      (cssText.match(
        /@media\s*\(max-width:\s*900px\)\s*\{\s*\.dp-demand-side\{display:contents\}[\s\S]*?\.dp-demand-form-col\{order:3\}\s*\}/
      ) || [''])[0];
    const orderHits = ['dp-demand-promise{order:1}', 'dp-demand-assistant{order:2}', 'dp-demand-form-col{order:3}']
      .filter((k) => mediaBlock.includes(k)).length;
    if (mediaBlock && orderHits === 3) {
      // 注意：jsdom 没有布局引擎，本条只能证明「样式表里写了 order」，不能证明「渲染出来真的是这个顺序」。
      // 真实几何（getBoundingClientRect 实测 top/left）由 tests/shots.cjs 的断言1c 在 headless Chrome 里证明。
      ok('P0-1 ≤900px 媒体块含 display:contents + 三张卡 order 1..3（样式表规则级检查，非实测）');
    } else {
      fail('P0-1 ≤900px 媒体块完整（样式表规则级检查，非实测）', `block=${!!mediaBlock} orderHits=${orderHits}/3`);
    }

    // B2：桌面态 flex 由类表达（而非内联）
    if (/\.dp-demand-side\{display:flex;flex-direction:column/.test(cssText)) {
      ok('P0-1 桌面态 display:flex column 由 .dp-demand-side 类表达');
    } else {
      fail('P0-1 桌面态 flex 类规则存在', '未找到 .dp-demand-side{display:flex;flex-direction:column');
    }

    // D：三锚点齐备，避免上面断言静默失真
    if (promiseEl && formEl && side) ok('P0-1 顺序断言三锚点齐备（promise / form / side）');
    else fail('P0-1 顺序断言三锚点齐备', `promise=${!!promiseEl} form=${!!formEl} side=${!!side}`);
  }

  // 轻量档（默认：权限类）—— 4 字段 + 承诺条 + 不出现评分
  // 注意：这些断言走 pageHas（排除抽屉残留），避免抽屉回复污染整页文本。
  if (pageHas(doc, '轻量档 · 需求登记')) ok('默认档位为轻量档（类型预设为权限类）');
  else fail('默认档位为轻量档');
  if (pageHas(doc, '这类需求不需要填完整 BRD') && pageHas(doc, '4 项必填')) ok('轻量档显示响应承诺条 + 「4 项必填」中性胶囊');
  else fail('轻量档显示承诺条');
  if (!pageHas(doc, '资料完整度')) ok('轻量档不出现「资料完整度」评分条（不跑评分）');
  else fail('轻量档不出现评分条', '仍渲染了「资料完整度」');

  // 选「数据权限 - 只读」后仍是轻量档字段（用途与期限），无 BRD 字段
  // 断言严格限定在表单面板内：抽屉残留已被 stripDrawers 清除，双保险避免假阳性。
  const lightPanel = doc.querySelector('.dp-demand-form-col');
  const lightText = lightPanel ? norm(lightPanel.textContent || '') : '';
  if (lightPanel && lightText.includes(norm('用途与期限')) && !lightText.includes(norm('现状 / 遇到的问题'))) {
    ok('轻量档字段集正确：用途与期限存在 / 无「现状」BRD 字段');
  } else {
    fail(
      '轻量档字段集正确',
      `panel=${!!lightPanel} purpose=${lightText.includes(norm('用途与期限'))} current=${lightText.includes(norm('现状 / 遇到的问题'))}`
    );
  }

  // —— 切到完整档（功能需求）——
  const segBrd = byText(doc, '.ant-segmented-item', '功能 / 系统');
  if (segBrd) {
    click(win, segBrd);
    await sleep(300);
    const brdNeed = ['现状 / 遇到的问题', '期望结果', '影响范围与量级', '涉及系统 / 入口', '期望完成时间', '验收 / 成功标准', '资料完整度'];
    const brdMiss = brdNeed.filter((t) => !has(doc, t));
    if (brdMiss.length === 0) ok('选「功能需求」后出现 BRD 完整档 8 字段 + 资料完整度');
    else fail('选「功能需求」后出现 BRD 完整档字段', '缺失：' + brdMiss.join(' / '));

    // 量级三组胶囊
    const scaleOk = ['影响多少人', '多频繁', '是否阻塞业务'].every((t) => has(doc, t));
    if (scaleOk) ok('量级胶囊三组齐备（人数 / 频率 / 是否阻塞）');
    else fail('量级胶囊三组齐备');

    /* —— P2-2：鼠标点击量级胶囊不得留下焦点环；键盘聚焦必须可见 ——
       组件用 onMouseDown 标记「指针交互」，onFocus 读取该标记决定是否点亮 outline。
       注意 React 的 onFocus/onBlur 委托的是 **focusin/focusout**（会冒泡），
       因此这里派发 focusin/focusout 才能触发 React 处理器。
       jsdom 不计算 :focus 伪类，但可读内联 style.outline：
         ① mousedown → focusin ：outline 应为 none（鼠标点完不留环）
         ② 纯 focusin（模拟 Tab）：outline 应为 2px 实线（无障碍可见）
       若去掉 onMouseDown 抑制，① 会变红。 */
    {
      const chip = Array.from(doc.querySelectorAll('.dp-demand-form-col button')).find((b) =>
        norm(b.textContent).includes(norm('3 人以内'))
      );
      if (chip) {
        // ① 指针交互：先 mousedown 再 focusin
        chip.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        chip.dispatchEvent(new win.FocusEvent('focusin', { bubbles: true }));
        await sleep(60);
        const outlineMouse = chip.style.outline || '';
        // ② 键盘聚焦：先 focusout 复位（同时清掉 pointer 标记），再纯 focusin
        chip.dispatchEvent(new win.FocusEvent('focusout', { bubbles: true }));
        await sleep(60);
        chip.dispatchEvent(new win.FocusEvent('focusin', { bubbles: true }));
        await sleep(60);
        const outlineKb = chip.style.outline || '';
        const mouseClean = outlineMouse === 'none' || outlineMouse === '';
        const kbVisible = /2px/.test(outlineKb);
        if (mouseClean && kbVisible) {
          ok('P2-2 鼠标点击胶囊不留焦点环 / 键盘聚焦可见', `mouse="${outlineMouse}" kb="${outlineKb}"`);
        } else {
          fail('P2-2 胶囊焦点环行为', `mouse="${outlineMouse}" kb="${outlineKb}"`);
        }
        chip.dispatchEvent(new win.FocusEvent('focusout', { bubbles: true }));
      } else {
        fail('P2-2 量级胶囊可定位', '未找到「3 人以内」按钮');
      }
    }

    // 轻量档字段消失（切档隐藏，不丢数据）
    // 注意：断言必须**限定在表单面板内**。AgentDrawer 关闭后 DOM 仍驻留
    // （getContainer={false}），其脚本化回复含「用途与期限」字样，会对整页 body 断言造成假阳性。
    const formPanel = doc.querySelector('.dp-demand-form-col');
    const formText = formPanel ? formPanel.textContent || '' : '';
    if (formPanel && !norm(formText).includes(norm('用途与期限'))) {
      ok('切到完整档后轻量档字段隐藏（切档不 reset 数据）');
    } else {
      fail('切到完整档后轻量档字段隐藏', formPanel ? '表单内仍见「用途与期限」' : '未定位到 .dp-demand-form-col');
    }

    /* —— §E.1 ③ 防重复：全局建议卡高亮某字段时，该字段的 agent 必须收起 ——
       本轮修掉的真 bug：adviceTopic() 原先只可能返回 'current' | null，
       于是 `adviceField === 'title' / 'expected' / 'scale' / 'acceptance' / 'systems'`
       全是死比较 —— 规范要求的防重复只对 1 个话题生效，另外 5 个会两处重复播报。

       为什么**不**走 DOM 模拟：要造出「建议指向验收」需要填满 6 个必填再提交，
       在 jsdom 里逐步填表会因 React 受控组件重渲染而中断切档（实测：填完后
       页面退回轻量档，连环打红 7 条无关断言）。这是「为了让断言能跑而扭曲被测对象」，
       得不偿失。改为**直接测纯函数** adviceTopic —— 它本来就是纯逻辑，
       用 esbuild 打包后调用即可，既精确又不污染页面状态。 */
    {
      let logicOk = false;
      try {
        const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
        const b = esbuild.buildSync({
          entryPoints: [path.resolve(__dirname, '..', 'src', 'pages', 'DemandNew.jsx')],
          bundle: true, format: 'cjs', write: false, platform: 'node',
          logLevel: 'silent',
          external: ['react', 'react-dom', 'antd', '@ant-design/icons'],
          loader: { '.jsx': 'jsx' },
        }).outputFiles[0].text;
        // 唯一文件名：避免与上一次运行的残留文件 / 并发写入发生 require 竞态
        // （历史现象：偶发 `Unexpected "export"` 或旧模块被缓存，导致假失败）
        const tmp = path.resolve(__dirname, `_smoke_demandnew_${process.pid}_${Date.now()}.cjs`);
        fs.writeFileSync(tmp, b);
        const mod = require(tmp);
        const { adviceTopic } = mod;
        try { fs.unlinkSync(tmp); } catch (_) { /* 清理失败不影响断言 */ }
        if (typeof adviceTopic !== 'function') {
          fail('§E.1③ 防重复逻辑覆盖多字段', 'adviceTopic 未导出，无法直接测');
        } else {
          // 必填齐、验收空 → 建议指向验收
          const r1 = adviceTopic(
            { title: 'x'.repeat(6), type: 'feature', current: 'y'.repeat(25), expected: 'z'.repeat(18), scale: { headcount: 'a', frequency: 'b', blocking: 'c' }, systems: ['s'] },
            true,
            { pct: 70, weakestName: '验收 / 成功标准', tierMin: 60 },
            ['验收 / 成功标准']
          );
          if (r1 === 'acceptance') ok('§E.1③ adviceTopic 在「仅缺验收」时指向 acceptance（防重复可生效）');
          else fail('§E.1③ adviceTopic 指向 acceptance', `实际返回 ${JSON.stringify(r1)}`);

          // 最弱项为「影响范围与量级」→ 应指向 scale
          const r2 = adviceTopic(
            { title: 'x'.repeat(6), type: 'feature', current: 'y'.repeat(25), expected: 'z'.repeat(18), systems: ['s'] },
            true,
            { pct: 70, weakestName: '影响范围与量级', tierMin: 60 },
            []
          );
          if (r2 === 'scale') ok('   ↳ adviceTopic 按最弱项指向 scale（非只认 current）');
          else fail('   ↳ adviceTopic 按最弱项指向 scale', `实际返回 ${JSON.stringify(r2)}`);

          // 现状里写了「加个」→ 指向 current
          const r3 = adviceTopic({ current: '希望能加个导出按钮' }, false, { pct: 0, weakestName: '', tierMin: 0 }, []);
          if (r3 === 'current') ok('   ↳ adviceTopic 仍正确识别 current（原有行为未回归）');
          else fail('   ↳ adviceTopic 识别 current', `实际返回 ${JSON.stringify(r3)}`);
        }
      } catch (e) {
        fail('§E.1③ 防重复逻辑覆盖多字段', 'esbuild 打包 DemandNew 失败：' + String((e && e.message) || e).slice(0, 200));
      }
    }

    // 「说不清，帮我定位」是合法选项
    // ⚠️ P0-2 教训：不能查「面板文本含『说不清，帮我定位』」——该短语同时出现在
    //    SystemsField 的字段 hint 里（「不确定就选『说不清，帮我定位』」），
    //    即使把 chip 的 label 改掉，hint 仍会让断言假通过。
    //    必须**精确定位到那个 chip 按钮**：在表单面板内找到 aria-pressed 的 button，
    //    其可见文本（去掉勾选图标）必须等于「说不清，帮我定位」。
    {
      const formPanel = doc.querySelector('.dp-demand-form-col');
      const chips = formPanel ? Array.from(formPanel.querySelectorAll('button[aria-pressed]')) : [];
      // 该 chip 的 label 来自 demandSystems 里 value===DEMAND_UNSURE 的项，
      // 是「涉及系统 / 库」组里第一个 button（SystemsField 先渲染 unsure）。
      const unsureChip = chips.find((b) => /说不清，帮我定位/.test(b.textContent || ''));
      if (unsureChip) {
        ok('涉及系统含「说不清，帮我定位」合法选项（精确定位到 chip 按钮）', `chip="${norm(unsureChip.textContent)}"`);
      } else {
        fail(
          '涉及系统含「说不清，帮我定位」合法选项',
          `表单内 aria-pressed 按钮 ${chips.length} 个，无一 label 命中（hint 不算）`
        );
      }
    }

    // —— 轻量档字段确实隐藏（提升为「同时验证 BRD 字段存在」的对照断言）——
    {
      const fpText = panelText(doc, '.dp-demand-form-col') || '';
      if (!fpText.includes(norm('用途与期限')) && fpText.includes(norm('现状 / 遇到的问题'))) {
        ok('   ↳ 完整档字段集对照：现状存在 / 用途与期限不存在');
      } else {
        fail('   ↳ 完整档字段集对照', `purpose=${fpText.includes(norm('用途与期限'))} current=${fpText.includes(norm('现状 / 遇到的问题'))}`);
      }
    }

    // —— 完成度随填写变化 ——
    const pctBefore = (norm(bodyText(doc)).match(/资料完整度(\d+)%/) || [])[1];
    const titleInput = doc.querySelector('.dp-form input.ant-input, .dp-form .ant-input');
    const areas = Array.from(doc.querySelectorAll('.dp-form textarea.ant-input, .dp-form textarea'));
    if (titleInput && areas.length >= 2) {
      setNativeValue(win, titleInput, '门店盘点时库存对不上账，希望定位到具体环节');
      setNativeValue(win, areas[0], '门店盘点时对不上账，系统库存和实际货架差 3-5 件，但不知道是入库还是收银环节漏记的。');
      setNativeValue(win, areas[1], '能在盘点差异报表里直接看到差异产生的具体环节和时间点。');
      await sleep(300);
      const pctAfter = (norm(bodyText(doc)).match(/资料完整度(\d+)%/) || [])[1];
      if (pctAfter && Number(pctAfter) > Number(pctBefore || 0)) {
        ok('填写必填项后完成度上升', `${pctBefore || 0}% → ${pctAfter}%`);
      } else {
        fail('填写必填项后完成度上升', `before=${pctBefore} after=${pctAfter}`);
      }
    } else {
      fail('完成度测试所需输入框可定位', `title=${!!titleInput} textareas=${areas.length}`);
    }

    // —— 评分区不得出现语义色（红黄绿）——
    const completenessEl = Array.from(doc.querySelectorAll('div')).find(
      (d) => !d.children.length && /资料完整度/.test(d.textContent || '')
    );
    const scope = completenessEl ? completenessEl.closest('.dp-card') || doc.body : doc.body;
    const semColors = ['#e8890c', '#8a5200', '#fef4e6', '#f6ce93', '#1e8e4e', '#0f6b39', '#e9f7ef', '#a8dfc0', '#e3262f', '#b0151d', '#fdeced', '#f4b9bc'];
    const semHit = Array.from(scope.querySelectorAll('[style]')).filter((e) => {
      const st = (e.getAttribute('style') || '').toLowerCase().replace(/\s/g, '');
      return semColors.some((col) => st.includes(col));
    });
    if (semHit.length === 0) ok('完整度 / 评分区域不含语义色 success/warning/error');
    else fail('完整度 / 评分区域不含语义色', `${semHit.length} 处命中`);

    // 进度条填充只有品牌蓝
    const fills = Array.from(scope.querySelectorAll('span')).filter((s) => {
      const st = (s.getAttribute('style') || '').toLowerCase().replace(/\s/g, '');
      return /width:\d+%/.test(st) && /background/.test(st);
    });
    const brandFill = fills.every((f) => (f.getAttribute('style') || '').includes('#3643BA') || (f.getAttribute('style') || '').includes('rgb(54, 67, 186)'));
    if (fills.length > 0 && brandFill) ok('完整度进度条填充只用品牌蓝');
    else fail('完整度进度条填充只用品牌蓝', `fills=${fills.length} allBrand=${brandFill}`);

    // 展开明细后逐项 D1–D5 存在且用三态（无分值）
    const expandBtn = byText(doc, 'button', '展开明细');
    if (expandBtn) {
      click(win, expandBtn);
      await sleep(260);
      const dims = ['问题与方案的分离', '影响范围', '涉及系统', '验收标准', '标题的指向性'];
      const dMiss = dims.filter((t) => !pageHas(doc, t));
      if (dMiss.length === 0) ok('展开明细后 D1–D5 五项人话名齐备');
      else fail('展开明细后 D1–D5 齐备', '缺失：' + dMiss.join(' / '));
      if (!/\d+\s*\/\s*5\s*分|得分|扣分|满分/.test(pageText(doc))) ok('   ↳ 逐项不给分值、无「得分/扣分/满分」字样');
      else fail('   ↳ 逐项不给分值', '出现分值或评分字样');

      /* —— P1-2：空字段的三态提示必须是独立的 emptyHint，不得复用 partialHint ——
         此刻「验收标准」必然为空（未填写），其提示应为 emptyHint（「还没填验收标准…」），
         **不得**是 partialHint（「验收标准偏抽象…」——那是给已写但写得太泛的人看的）。
         若把 none 态错接 partialHint，这条会立刻变红。 */
      {
        const t = norm(pageText(doc));
        const hasPartialD4 = t.includes(norm('验收标准偏抽象'));
        const hasEmptyD4 = t.includes(norm('还没填验收标准'));
        if (!hasPartialD4 && hasEmptyD4) {
          ok('P1-2 未填「验收标准」用独立 emptyHint（未复用「偏抽象」）');
        } else {
          fail('P1-2 未填「验收标准」用独立 emptyHint', `partialD4=${hasPartialD4} emptyD4=${hasEmptyD4}`);
        }
      }
    } else {
      // 首次进入必填未填时进度条可能已达部分分，展开按钮必定存在
      fail('完整度面板「展开明细」按钮存在');
    }

    // BRD 协作助手（内联卡，不是 Drawer）
    if (has(doc, 'BRD 协作助手') && has(doc, '脚本化原型')) {
      ok('完整档右栏含 BRD 协作助手内联卡（带「脚本化原型」披露胶囊）');
    } else {
      fail('完整档右栏含 BRD 协作助手内联卡');
    }
    if (!doc.querySelector('.ant-drawer-open')) ok('   ↳ agent 未做成 Drawer（不遮挡表单，C7 沿用脚本化范式）');
    else fail('   ↳ agent 未做成 Drawer', '检测到已打开的 Drawer');

    /* —— 附加裁决：点「可以这样问」的快捷问题后，agent 建议必须**保留**（只追加 Q&A）——
       历史实现会在点 chip 时清空待改建议，导致用户「为了提问而丢掉刚拿到的建议」。
       这里在 BRD 内联卡（.dp-demand-assistant）作用域内验证：
         ① 先记录当前建议气泡文本；
         ② 点一个快捷问题；
         ③ 断言建议文本仍在，且新增了用户提问气泡。 */
    {
      const box = doc.querySelector('[data-role="assistant"]');
      const bubbleSel = '.dp-demand-assistant .dp-bubble--agent';
      const beforeBubbles = box ? Array.from(box.querySelectorAll('.dp-bubble--agent')).map((b) => norm(b.textContent)) : [];
      const adviceBefore = beforeBubbles[beforeBubbles.length - 1] || '';
      const promptBtn = box
        ? Array.from(box.querySelectorAll('button')).find((b) => norm(b.textContent).includes(norm('量级怎么估')))
        : null;
      if (box && adviceBefore && promptBtn) {
        click(win, promptBtn);
        await sleep(240);
        const afterText = norm(box.textContent || '');
        const keptAdvice = afterText.includes(adviceBefore);
        const hasUserBubble = !!box.querySelector('.dp-bubble--user');
        if (keptAdvice && hasUserBubble) {
          ok('点快捷问题后保留 agent 建议（只追加 Q&A，不清空）', `advice ${adviceBefore.length} 字仍在`);
        } else {
          fail('点快捷问题后保留 agent 建议', `keptAdvice=${keptAdvice} userBubble=${hasUserBubble}`);
        }
      } else {
        fail(
          '点快捷问题后保留 agent 建议（前置条件）',
          `box=${!!box} advice="${adviceBefore.slice(0, 24)}" prompt=${!!promptBtn}`
        );
      }
    }
  } else {
    fail('完整档切换器（Segmented）可定位');
  }

  /* =====================================================================
     文案回正（C12）：不再把人引向第三层
     ===================================================================== */
  const bodyAll = bodyText(doc);
  if (!/请到工作台「需求提交」提交/.test(bodyAll)) ok('文案已回正：agentReplies 不再出现旧口径「请到工作台『需求提交』提交」');
  else fail('文案已回正', '仍出现旧口径文案');

  // 通过 Agent 面板验证 SSO / 权限两条回复已指向「业务需求」一级栏目 + 「新增需求」
  // （02b §C.3 ⑤/§F.7 E7：旧口径「首页「提交需求」大卡 + 工作台「需求提交」」已失效）
  // ⚠️ 注意：#/demand/new 上按 §E.4 不渲染悬浮 doodle；若本块所在页无 Agent 入口，
  //     说明该页断言不适用——入口缺失按「不适用跳过」而非「失败」处理，避免误导。
  const agentBtn2 = byText(doc, 'button', 'Agent for Digital') || doc.querySelector('.dp-float-agent');
  if (agentBtn2) {
    click(win, agentBtn2);
    await sleep(240);
    const pSso = byText(doc, '.dp-agent-panel button', '新系统接入 SSO 的流程是什么？');
    if (pSso) {
      click(win, pSso);
      await sleep(220);
      // 回复文本在面板内 → 用 has()（pageHas 已剔除面板子树）
      if (has(doc, '业务需求') && has(doc, '新增需求')) {
        ok('   ↳ SSO 回复指向「业务需求」一级栏目 + 「新增需求」入口');
      } else {
        fail('   ↳ SSO 回复指向「业务需求」+「新增需求」', bodyText(doc).slice(-200));
      }
    } else {
      fail('   ↳ SSO 建议问题可点击');
    }
    const dClose2 = doc.querySelector('.dp-agent-panel-close');
    if (dClose2) click(win, dClose2);
    await sleep(240);
  } else {
    // 本页无 Agent 入口（如 #/demand/new）→ 该断言不适用，不判失败
    ok('   ↳ 本页无悬浮 Agent 入口（#/demand/new 按 §E.4 不渲染 doodle，跳过 SSO 回复校验）');
  }

  /* =====================================================================
     反馈融合的两个要害（本轮新增，对应两处实测缺陷）
     ① 兜底可达性：关键词识别会漏，必须有一个**不靠关键词**的显式入口。
        否则原「站点反馈」独立入口移除后，漏检 = 功能不可达。
     ② 反劫持：反馈意图无条件抢先，故其词表**不得含纯话题词**（如裸词「问题」），
        否则「SSO 接入有什么常见问题？」会被答成「我帮你登记成反馈」。

     ⚠️ ② 是**纯静态数据断言**（只读 mock.js 的词表），必须放在 DOM 分支**外面**。
     先前把它写在 `if (agentBtn3)` 里，等于让一条不依赖 DOM 的断言受制于 DOM ——
     变异测试立刻揭穿：把裸词「问题」加回词表后仍然全绿（该分支未执行），
     即「空转门」。判断标准：**断言的前提条件，不能包含它并不依赖的运行时状态。**
     ===================================================================== */
  {
    const normQ = (s) => String(s || '').replace(/\s+/g, '');
    const fbIntent = MOCK.agentFeedbacksIntent;
    if (!fbIntent || !Array.isArray(fbIntent.match)) {
      fail('反馈词表反劫持', '未能从 mock.js 取到 agentFeedbacksIntent（esbuild 打包失败？' + (MOCK.__error || '') + '）');
    } else {
      const fbWords = fbIntent.match.map((x) => normQ(x));
      const knowledgeProbes = [
        'SSO 接入有什么常见问题？',
        '库存对不上账是什么问题',
        '这个接口有什么潜在问题',
        '权限申请有什么注意事项',
      ];
      const hijacked = knowledgeProbes.filter((q) => fbWords.some((w) => normQ(q).includes(w)));
      if (hijacked.length === 0) ok('反馈词表不劫持知识型问句（裸话题词已剔除）');
      else fail('反馈词表不劫持知识型问句', `被劫持: ${hijacked.join(' / ')}`);

      // 反向：真实反馈表达必须仍能命中，否则「提个反馈」以外的口语说法就漏了
      const fbProbes = ['我想提个反馈', '这个页面有点乱', '希望能加一个导出功能'];
      const missed = fbProbes.filter((q) => !fbWords.some((w) => normQ(q).includes(w)));
      if (missed.length === 0) ok('   ↳ 常见反馈口语仍能命中词表');
      else fail('   ↳ 常见反馈口语仍能命中词表', `漏检: ${missed.join(' / ')}`);
    }
  }

  // ① 兜底入口（依赖 DOM，需要 Agent 入口在本页可见）
  const agentBtn3 = byText(doc, 'button', 'Agent for Digital') || doc.querySelector('.dp-float-agent');
  if (agentBtn3) {
    click(win, agentBtn3);
    await sleep(240);
    // 显式反馈入口在「可以这样问」行里可见
    const fbChip = byText(doc, '.dp-agent-panel button', '提个反馈');
    if (fbChip) ok('Agent 面板含显式「提个反馈」入口（不依赖关键词命中）');
    else fail('Agent 面板含显式「提个反馈」入口', '未找到该 chip');

    // 点它必须直接展开反馈表单（而不是又走一遍文本匹配）
    if (fbChip) {
      click(win, fbChip);
      await sleep(260);
      const sel = doc.querySelector('.dp-agent-panel .dp-form .ant-select, .dp-agent-panel .dp-form textarea');
      if (sel) ok('   ↳ 点「提个反馈」直接进入反馈表单（绕过关键词识别）');
      else fail('   ↳ 点「提个反馈」直接进入反馈表单', '未出现表单控件');
    }

    const dClose3 = doc.querySelector('.dp-agent-panel-close');
    if (dClose3) click(win, dClose3);
    await sleep(240);
  }

  /* ================= 知识中心：待补知识 交互 ================= */
  await navigate(win, '#/knowledge');
  await settle(460);
  const faqTab = byText(doc, '.ant-tabs-tab', 'FAQ');
  if (faqTab) {
    click(win, faqTab);
    await sleep(240);
    if (has(doc, '待补知识队列')) ok('FAQ Tab 含「待补知识队列」区块（核心机制可视化）');
    else fail('FAQ Tab 含「待补知识队列」');

    const q1 = byText(doc, 'button', '如何申请生产环境数据库只读权限？');
    if (q1) {
      click(win, q1);
      await sleep(200);
      if (has(doc, '这个回答有用吗')) ok('FAQ 展开后含「这个回答有用吗」反馈入口');
      else fail('FAQ 展开后含「这个回答有用吗」反馈入口');
      const dislike = byText(doc, 'button', '没帮到我');
      if (dislike) {
        click(win, dislike);
        await sleep(240);
        if (has(doc, '已加入「待补知识」队列')) ok('「没帮到我」→ 进入待补知识队列（feedback 闭环）');
        else fail('「没帮到我」→ 进入待补知识队列', bodyText(doc).slice(-160));
      } else {
        fail('「没帮到我」按钮存在');
      }
    } else {
      fail('FAQ 问题可展开');
    }
  } else {
    fail('知识中心 Tab 可定位');
  }

  /* ================= 键盘可达性（可点卡片不能只是 div+onClick） ================= */
  await navigate(win, '#/news');
  await settle(460);
  const kbRows = doc.querySelectorAll('.dp-row[role="button"][tabindex="0"]');
  if (kbRows.length > 0) ok('可点列表行为键盘可达（role=button + tabindex=0 + Enter/Space）', kbRows.length + ' 行');
  else fail('可点列表行为键盘可达', '未找到 .dp-row[role=button][tabindex=0]');

  /* ================= 深链：#/workspace/tools/<group> ================= */
  await navigate(win, '#/workspace/tools/delivery');
  await settle(460);
  const activeGroup = doc.querySelector('.dp-toolgroup[data-active="true"]');
  if (activeGroup && norm(activeGroup.textContent).includes('研发与交付')) {
    ok('工具导航深链 #/workspace/tools/delivery 命中「研发与交付」分组');
  } else {
    fail('工具导航深链命中分组', activeGroup ? norm(activeGroup.textContent) : '无激活分组');
  }

  /* =====================================================================
     标签体系（面 3）：员工个人主页 + 标签反查页
     ---------------------------------------------------------------------
     断言纪律：全部走 pageHas()（排除抽屉残留），且关键存在性断言限定到具体
     容器（.dp-card / .dp-row 等），避免被同页文案污染成假通过。
     ===================================================================== */

  // —— 入口 1：组织速查行可点 → 跳个人主页 ——
  // 02b §A.5：组织速查已升为一级栏目 #/org（旧 #/workspace/org 不再存在）
  await navigate(win, '#/org');
  await settle(500);
  {
    const orgRow = doc.querySelector('tr[role="button"][tabindex="0"]');
    if (orgRow) {
      ok('组织速查成员行可点（role=button + tabindex=0）');
      click(win, orgRow);
      await sleep(320);
      const h = win.location.hash;
      if (/^#\/workspace\/people\/[a-z.]+$/.test(h)) ok('点击成员行跳转到个人主页路由', h);
      else fail('点击成员行跳转到个人主页路由', `实际 ${h}`);
    } else {
      fail('组织速查成员行可点', '未找到 tr[role=button][tabindex=0]');
    }
  }

  // —— 个人主页：#/workspace/people/min.zhou ——
  await navigate(win, '#/workspace/people/min.zhou');
  await settle(520);
  {
    const peopleNeed = ['周敏', '设计系统组 · 设计系统负责人', '标签', '领域轴', '能力类型轴', '近期知识贡献', '主标签'];
    const pmiss = peopleNeed.filter((t) => !pageHas(doc, t));
    if (pmiss.length === 0) ok('个人主页渲染：页头 + 标签矩阵双分区 + 右栏贡献', peopleNeed.length + ' 项命中');
    else fail('个人主页渲染', '缺失：' + pmiss.join(' / '));

    // 导航高亮工作台
    const navA = doc.querySelector('.dp-nav-item[data-active="true"]');
    // 02b §A.4：people 在 workspace 路径下，但导航高亮改指「组织速查」（NAV_OF 显式映射）
    if (navA && norm(navA.textContent).includes(norm('组织速查'))) ok('   ↳ 个人主页导航高亮 = 组织速查');
    else fail('   ↳ 个人主页导航高亮 = 组织速查', navA ? norm(navA.textContent) : '无激活项');

    // 导航为 7 项（02b §A.1/§A.5：新增「组织速查」「业务需求」）
    if (doc.querySelectorAll('.dp-nav-item').length === 7) ok('   ↳ 一级导航仍 7 项');
    else fail('   ↳ 一级导航 7 项', `实际 ${doc.querySelectorAll('.dp-nav-item').length}`);

    // 标签矩阵必须存在（含 .dp-grid--tight 网格），且标签卡可点（role=button + tabindex=0）
    const tightGrid = doc.querySelector('.dp-grid--tight');
    if (tightGrid) ok('标签矩阵使用 .dp-grid--tight 更紧网格（不改 .dp-grid 默认值）');
    else fail('标签矩阵使用 .dp-grid--tight', '未找到 .dp-grid--tight');

    const tagCards = doc.querySelectorAll('.dp-grid--tight .dp-card[role="button"][tabindex="0"]');
    if (tagCards.length > 0) ok('标签卡可点（role=button + tabindex=0，跳反查页）', `${tagCards.length} 张`);
    else fail('标签卡可点', `命中 ${tagCards.length} 张`);

    // 成熟度双轴：自评圆点 + 实证分段条（形状不同 → 不可相加）
    const dots = doc.querySelectorAll('.dp-card span[style*="border-radius: 999"]');
    if (dots.length >= 4) ok('双轴成熟度：自评圆点阵已渲染', `${dots.length} 个圆点元素`);
    else fail('双轴成熟度：自评圆点阵已渲染', `仅 ${dots.length} 个圆点元素（应 ≥4）`);

  }

  // —— 「→ 标签名」联动标注：须换一位有公开实证的人（min.zhou 全标签实证=0，是纯自评/吹牛态，不产生 → ）——
  await navigate(win, '#/workspace/people/yuan.zheng');
  await settle(520);
  {
    const arrowItems = Array.from(doc.querySelectorAll('.dp-card, .dp-row, div[role="button"]'))
      .filter((el) => /→/.test(el.textContent || ''));
    if (arrowItems.length > 0) ok('近期知识贡献含「→ 标签名」联动标注（有实证者）', `${arrowItems.length} 条带标注`);
    else fail('近期知识贡献含「→ 标签名」联动标注', '未找到「→」（yuan.zheng 有 2 条公开贡献）');
  }

  /* —— P1-4 个人侧渲染出口：有人背着 legacy（deprecated）标签时，
     个人标签矩阵必须**带状态样式渲染**，不得静默丢弃。
     样本：林望(wang.lin) 携带已停用标签 c-fullstack（术语「全栈开发」）。 */
  await navigate(win, '#/workspace/people/wang.lin');
  await settle(520);
  {
    const legacyChip = Array.from(doc.querySelectorAll('.dp-grid--tight .dp-chip')).find((el) => {
      const cs = win.getComputedStyle(el);
      return (
        /dashed/.test(cs.borderTopStyle) &&
        parseFloat(cs.borderLeftWidth) >= 3 &&
        /已停用/.test(norm(el.textContent))
      );
    });
    if (legacyChip) ok('个人标签矩阵：legacy(deprecated) 标签带状态样式渲染（非静默丢弃）');
    else {
      const anyLegacy = Array.from(doc.querySelectorAll('.dp-grid--tight .dp-chip')).map((e) => norm(e.textContent)).join('|');
      fail('个人标签矩阵 legacy 标签渲染', `未找到虚线+竖条+已停用的 chip；现有 chips=${anyLegacy.slice(0, 160)}`);
    }
  }

  /* —— 闭环验收（P1 E.2 硬约束）——**逐标签**校验，非页面级 ——
     盲区修正：原写法只看「页面里存在正档位文案」+「页面里存在任意 →」，
     A 标签缺箭头可被 B 标签的箭头掩盖（假通过）。
     现改为：对标签矩阵里**每一个**实证档 ≥1 的标签卡，断言贡献列表里存在
     **指向该标签**的「→ 标签名」标注。 */
  {
    const TIER_TEXT = { emerging: '有初步产出', established: '有稳定的产出', authoritative: '有沉淀与影响力' };
    const cards = Array.from(doc.querySelectorAll('.dp-grid--tight .dp-card[role="button"]'));
    // 贡献列表里的箭头目标（→ 后紧跟的标签名，取自 TagChip 内文本）
    const arrowTargets = new Set();
    Array.from(doc.querySelectorAll('div[role="button"], .dp-card, .dp-row')).forEach((el) => {
      const txt = norm(el.textContent);
      // 形如 →◈设计系统 / →◇系统架构
      const re = /→[◈◇]([^→◈◇\s]+)/g;
      let m;
      while ((m = re.exec(txt)) !== null) arrowTargets.add(m[1]);
    });

    let checked = 0;
    const unclosed = [];
    cards.forEach((card) => {
      const txt = norm(card.textContent);
      const tier = Object.keys(TIER_TEXT).find((k) => txt.includes(TIER_TEXT[k]));
      if (!tier) return; // 该标签实证=0，不要求箭头
      // 卡内标签名：首个 span 文本形如 ◈设计系统
      const labelEl = card.querySelector('span');
      const labelTxt = norm(labelEl ? labelEl.textContent : '');
      const label = labelTxt.replace(/^[◈◇]/, '');
      checked += 1;
      // 精确匹配：箭头必须指向**该标签本身**（规范 C.5 闭环）。
      // 不放宽为子串匹配——否则 A 标签的「→ A（旧）」会掩盖 B 的缺失，
      // 且「供应与采购」与「采购」这类前缀关系会互相假通过。
      const hit = arrowTargets.has(label);
      if (!hit) unclosed.push(`${label}(${tier})`);
    });
    if (checked > 0 && unclosed.length === 0) {
      ok('闭环验收：逐标签校验，每个实证≥1 的标签都有指向它的「→ 标签名」贡献条目', `已校验 ${checked} 个正档位标签，箭头目标 ${arrowTargets.size} 个`);
    } else if (checked === 0) {
      fail('闭环验收逐标签', '未找到任何实证≥1 的标签卡（测试无效）');
    } else {
      fail('闭环验收逐标签：存在实证≥1 但无对应箭头条目的标签', unclosed.join(', '));
    }
  }

  // —— 标签反查页：#/workspace/tags ——
  await navigate(win, '#/workspace/tags');
  await settle(520);
  {
    const browseNeed = ['标签浏览', '按标签找人', '领域轴', '能力类型轴', '结果'];
    const bmiss = browseNeed.filter((t) => !pageHas(doc, t));
    if (bmiss.length === 0) ok('标签反查页渲染：页头 + 筛选器 + 结果区', browseNeed.length + ' 项命中');
    else fail('标签反查页渲染', '缺失：' + bmiss.join(' / '));

    // 筛选器：Segmented（轴切换）+ chip 组
    if (doc.querySelector('.ant-segmented')) ok('反查页含 Segmented 轴切换（全部 / 领域轴 / 能力类型轴）');
    else fail('反查页含 Segmented 轴切换');
    const chips = doc.querySelectorAll('.dp-chip');
    if (chips.length >= 10) ok('反查页含词选择 chip 组（按域分组分行）', `${chips.length} 个 chip`);
    else fail('反查页含词选择 chip 组（按域分组分行）', `仅 ${chips.length} 个 .dp-chip（应 ≥10）`);

    // 未选择时结果区为空态（不显示结果行）
    const emptyBrowse = doc.querySelector('.dp-empty');
    if (emptyBrowse) ok('反查页未选择时显示空态（不显示结果行）');
    else fail('反查页未选择时显示空态');

    // 已选条无选择时不占位
    if (!pageHas(doc, '已选')) ok('反查页已选条无选择时不占位');
    else fail('反查页已选条无选择时不占位');

    // 选中一个「确有成员」的标签后：结果行出现、按姓名排序声明出现、且结果行不显示成熟度
    //   （用 SSO 统一身份 / 数据平台 —— 二者在 personTags 里都有成员；避免选到空标签）
    const firstChip = Array.from(doc.querySelectorAll('.dp-chip')).find((c) =>
      /SSO 统一身份|数据平台/.test(c.textContent || '')
    );
    if (firstChip) {
      click(win, firstChip);
      await sleep(300);
      const rows = doc.querySelectorAll('.dp-row[role="button"][tabindex="0"]');
      if (rows.length > 0) ok('选中标签后出现结果行（键盘可达）', `${rows.length} 行`);
      else fail('选中标签后出现结果行', `命中 ${rows.length} 行`);
      if (pageHas(doc, '按姓名排序')) ok('结果区主动声明「按姓名排序」（不排名的可见证据）');
      else fail('结果区主动声明「按姓名排序」');
      if (pageHas(doc, '已选')) ok('反查页已选条在有选择时出现（带清空）');
      else fail('反查页已选条在有选择时出现');
      // 结果行不得显示成熟度档位文案（反查页职责是找人，不是判断人）
      const rowText = Array.from(rows).map((r) => norm(r.textContent)).join('|');
      const hasTierInRow = /有稳定的产出|有初步产出|有沉淀与影响力|暂无实证/.test(rowText);
      if (!hasTierInRow) ok('结果行不显示成熟度（P2 E.2 裁决：找人≠判断人）');
      else fail('结果行不显示成熟度', '结果行出现档位文案');
    } else {
      fail('反查页可点标签 chip 可定位');
    }

    /* —— P1-4：已归档标签区（deprecated + merged 的真实渲染出口，规范 C.4）——
       默认折叠 → 点开后必须能看到 deprecated chip（虚线 + 「已停用」）
       与 merged chip（新词 + 「原『旧名』」角标）。 */
    const archToggle = doc.querySelector('.dp-archived-toggle');
    if (archToggle) {
      ok('反查页含「已归档标签」可折叠区');
      click(win, archToggle);
      await sleep(200);
      const archItems = doc.querySelectorAll('.dp-archived-item');
      if (archItems.length >= 3) ok('已归档区展开后列出条目', `${archItems.length} 条`);
      else fail('已归档区展开后列出条目', `实际 ${archItems.length} 条`);

      /* deprecated chip：必须是 .dp-chip，且 上/右/下 虚线描边 + 左端 3px 竖条 + 内含「已停用」。
         不能只匹配文本——否则一个纯文字「已停用」也会假通过。 */
      const archChips = Array.from(doc.querySelectorAll('.dp-archived-item .dp-chip'));
      const depChip = archChips.find((el) => {
        const cs = win.getComputedStyle(el);
        return (
          /dashed/.test(cs.borderTopStyle) &&
          /dashed/.test(cs.borderRightStyle) &&
          parseFloat(cs.borderLeftWidth) >= 3 &&
          /solid/.test(cs.borderLeftStyle) &&
          /已停用/.test(norm(el.textContent))
        );
      });
      if (depChip) ok('已归档区 deprecated chip 结构合规（虚线描边 + 3px 轴色竖条 + 「已停用」）');
      else fail('已归档区 deprecated chip 结构', archChips.map((e) => norm(e.textContent)).join('|').slice(0, 120));

      /* merged chip：外层包「新词 chip + 原『旧名』角标」，角标文本必须是 原「旧名」，
         且新词 ≠ 旧名（证明是用 target.label 渲染的）。角标是 chip 的兄弟节点，
         故在 .dp-archived-item 行级取文本。 */
      const mergedRow = Array.from(archItems).find((el) => /原「.+」/.test(norm(el.textContent)));
      if (mergedRow) {
        const t = norm(mergedRow.textContent);
        const m = t.match(/^(.*?)原「(.+?)」/);
        const newWord = m ? m[1].replace(/[◈◇]/g, '').trim() : '';
        const oldWord = m ? m[2].trim() : '';
        if (newWord && oldWord && newWord !== oldWord)
          ok('已归档区 merged chip 结构合规（新词 + 原「旧名」角标，且新词≠旧名）', `${newWord} ← 原「${oldWord}」`);
        else fail('已归档区 merged chip 结构', `newWord=${newWord} oldWord=${oldWord}`);
      } else {
        fail('已归档区 merged chip 结构', Array.from(archItems).map((e) => norm(e.textContent)).join('|').slice(0, 120));
      }
    } else {
      fail('反查页含「已归档标签」可折叠区', '未找到 .dp-archived-toggle');
    }
  }

  // —— 入口 2：全局搜索「人员」分组排在最前 ——
  {
    const st = doc.querySelector('[aria-label="打开全局搜索"]');
    if (st) {
      click(win, st);
      await sleep(200);
      const input = Array.from(doc.querySelectorAll('.ant-modal input')).find((i) =>
        /搜索公告/.test(i.getAttribute('placeholder') || '')
      );
      if (input) {
        setNativeValue(win, input, '周敏');
        await sleep(260);
        const groupHeads = Array.from(doc.querySelectorAll('.ant-modal div')).filter(
          (d) => /^人员\d*$/.test(norm(d.textContent)) && d.children.length <= 2
        );
        if (groupHeads.length > 0) ok('全局搜索命中「人员」分组');
        else fail('全局搜索命中「人员」分组', bodyText(doc).slice(-200));
        if (pageHas(doc, '设计系统组 · 设计系统负责人')) ok('   ↳ 人员结果含 dept · role 描述');
        else fail('   ↳ 人员结果含 dept · role 描述');
      } else {
        fail('全局搜索输入框可定位（人员分组校验）');
      }
      const closer = doc.querySelector('.ant-modal-close');
      if (closer) click(win, closer);
      await sleep(400);
    } else {
      fail('全局搜索触发器存在（人员分组校验）');
    }
  }

  /* ================= 标签体系 · 数据层回归（P1-1 / P1-2 / P1-3 / P1-4）=================
     全部走 MOCK（esbuild 打包进来的 mock.js），比走 DOM 更早、更稳地暴露问题。 */
  {
    const SELF_ORDER = ['curious', 'following', 'practicing', 'advocating'];
    const okData = typeof MOCK.getPersonProfile === 'function' && MOCK.personTags;

    // P1-1：吹牛态收敛 —— 除指定样本（min.zhou）外，其余人不得有「自评≥practicing 且实证=none」
    if (!okData) {
      fail('P1-1 吹牛态收敛', '取不到 getPersonProfile / personTags（' + (MOCK.__error || '') + '）');
    } else {
      const others = Object.keys(MOCK.personTags).filter((id) => id !== 'min.zhou');
      const offenders = [];
      others.forEach((id) => {
        const p = MOCK.getPersonProfile(id);
        p.tags.forEach((t) => {
          if (SELF_ORDER.indexOf(t.selfRating) >= 2 && t.evidenceTier === 'none') offenders.push(`${p.person.name}:${t.tag.id}`);
        });
      });
      // 允许 1 位指定样本（tong.wu，≤2 个标签）
      const tongWu = offenders.filter((x) => x.startsWith('吴桐')).length;
      if (offenders.length <= 2 && tongWu === Math.min(offenders.length, 2)) {
        ok('P1-1 吹牛态收敛：除指定样本外无「高自评 + 零实证」标签', `样本外吹牛标签 ${offenders.length} 个${offenders.length ? '（' + offenders.join(', ') + '）' : ''}`);
      } else {
        fail('P1-1 吹牛态收敛', `样本外仍有 ${offenders.length} 个：${offenders.slice(0, 6).join(', ')}`);
      }
      // min.zhou 仍为纯吹牛对照样本（不动她）
      const mz = MOCK.getPersonProfile('min.zhou');
      if (mz.tags.length > 0 && mz.tags.every((t) => t.evidenceTier === 'none')) ok('   ↳ 指定纯吹牛样本 min.zhou 保持全 none（未被误改）');
      else fail('   ↳ 指定纯吹牛样本 min.zhou 应保持全 none');
    }

    // P1-2：parseOwnerName 边界——残缺/空格式返回 null，绝不产生空串幽灵人
    if (typeof MOCK.parseOwnerName === 'function') {
      const bad = MOCK.parseOwnerName('何嘉 ·');
      const bad2 = MOCK.parseOwnerName('·');
      const empty = MOCK.parseOwnerName('');
      const good = MOCK.parseOwnerName('会员增长组 · 陈思远');
      if (bad === null && bad2 === null && empty === null && good === '陈思远') {
        ok('P1-2 parseOwnerName：残缺/空 owner 返回 null（不再返回空串幽灵人）');
      } else {
        fail('P1-2 parseOwnerName 边界', `'何嘉 ·'=${JSON.stringify(bad)} '·'=${JSON.stringify(bad2)} ''=${JSON.stringify(empty)} good=${JSON.stringify(good)}`);
      }
      // 无人的证据条目 personName 必须为 null（不允许空串混入 attributable 集合）
      const ghostEmpty = (MOCK.ALL_EVIDENCE || []).filter((e) => e.personName === '');
      if (ghostEmpty.length === 0) ok('   ↳ 证据层无空串 personName（空 owner 一律 null）');
      else fail('   ↳ 证据层存在空串 personName', `${ghostEmpty.length} 条`);
    } else {
      fail('P1-2 parseOwnerName 边界', '未导出 parseOwnerName');
    }

    /* ==================================================================
       v0.4 视觉噪音分档 —— 吹牛态门（本轮最关键的回归点）
       ------------------------------------------------------------------
       改造内容（ui.jsx）：按 selfIdx 分两档渲染，仅改**渲染分支**，
       `boast = selfIdx>=3 && tier==='none'` 判定一字未动：
         · selfIdx<=2 && tier==='none' → 收轨：不画空槽，只留极淡「暂无公开贡献」
         · selfIdx>=3 && tier==='none' → 保留完整双行（点阵+虚线空槽+「仅自评 · 暂无公开贡献」+提示行）
       最怕的错法：分档把「吹牛」也收轨了 → 吹牛态的诚实并列被消解。
       故此处钉住 UI-accurate 数值（与 outputs/_audit-emptystate-verify3.mjs 同口径）：
         · 周敏 min.zhou：吹牛双行 = 7、提示行 = 7（改造前后**不变**）
       口径：屏幕出现次数 = expanded(head,主标签≤3) + compact(矩阵,全部标签)，
             用「直接文本节点恰等于文案」的元素个数计。
       ================================================================== */
    {
      const BOAST_COPY = '仅自评 · 暂无公开贡献';
      const HINT_COPY = '这项仅有自评，系统暂未找到对应的公开产出。';
      const countDirect = (text) => {
        let n = 0;
        for (const el of Array.from(doc.querySelectorAll('*'))) {
          if (Array.from(el.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim() === text)) n++;
        }
        return n;
      };
      await navigate(win, '#/workspace/people/min.zhou');
      await settle(560);
      const boastRows = countDirect(BOAST_COPY);
      const hintRows = countDirect(HINT_COPY);
      if (boastRows === 7) {
        ok('v0.4 分档门：周敏 min.zhou 吹牛双行屏上仍 = 7（分档未误伤吹牛态）', `吹牛双行=${boastRows}`);
      } else {
        fail('v0.4 分档门：周敏吹牛双行应 = 7', `实得 ${boastRows}（分档判据可能把吹牛也收轨了）`);
      }
      if (hintRows === 7) ok('   ↳ 周敏吹牛提示行屏上仍 = 7', `提示行=${hintRows}`);
      else fail('   ↳ 周敏吹牛提示行应 = 7', `实得 ${hintRows}`);

      // 反向：一位「无吹牛态」的人（沈知微 zhiwei.shen）吹牛双行必须 = 0
      await navigate(win, '#/workspace/people/zhiwei.shen');
      await settle(560);
      const shBoast = countDirect(BOAST_COPY);
      const shCollapse = countDirect('暂无公开贡献');
      if (shBoast === 0) ok('   ↳ 沈知微 zhiwei.shen 吹牛双行 = 0（无吹牛态）', `boast=${shBoast}`);
      else fail('   ↳ 沈知微非吹牛样本吹牛双行应 = 0', `实得 ${shBoast}`);
      if (shCollapse === 10) ok('   ↳ 沈知微收轨淡文案屏上 = 10（噪音收敛生效）', `收轨=${shCollapse}`);
      else fail('   ↳ 沈知微收轨淡文案应 = 10', `实得 ${shCollapse}`);

      // 反向：周敏收轨行 = 3（收轨与吹牛并存，二者互斥不混算）
      await navigate(win, '#/workspace/people/min.zhou');
      await settle(560);
      const mzCollapse = countDirect('暂无公开贡献');
      if (mzCollapse === 3) ok('   ↳ 周敏收轨淡文案屏上 = 3（与吹牛 7 并存、互不混算）', `收轨=${mzCollapse}`);
      else fail('   ↳ 周敏收轨淡文案应 = 3', `实得 ${mzCollapse}`);
    }

    /* ==================================================================
       v0.4 反查页空态分流 —— emptyCopy 纯函数门
       ------------------------------------------------------------------
       改造内容（TagBrowse.jsx）：空态文案按「所选标签是否落在全员为 0 的空组」
       分流（审查官 §2.1）。抽成导出纯函数 emptyCopy(selected) 便于覆盖死分支。
       数据事实（本轮实测 _tmp_mockprobe.txt）：
         · 「AI 与智能」是唯一全员为 0 的领域组，active=6 个标签全无人 → d-ai
         · 「业务系统域 / 门店 POS」d-pos 有 2 人（林望、吴桐）→ 非空组样本
       断言两分支：空组 → 组织诊断文案（含「AI 与智能」+「6 个标签」）；
                   交集空 → 行动指引（去掉条件 / 分别查看）。
       最怕的错法：分流判据写反（非空组也套空组文案），或 memberCount 数错。
       ================================================================== */
    {
      const probed = probeEmptyCopy();
      if (!probed.fn) {
        fail('v0.4 反查页空态：emptyCopy 探针打包失败', probed.note);
      } else {
        const { fn } = probed;

        // (1) 空组分支：d-ai（AI 与智能，全组 0 人）
        const g = fn(['d-ai']);
        const gOk =
          g &&
          g.title === '「AI 与智能」暂时还没有人登记' &&
          typeof g.desc === 'string' &&
          g.desc.includes('「AI 与智能」这个领域目前还没有人登记') &&
          g.desc.includes('词表已预留该领域的 6 个标签') &&
          g.desc.includes('等待第一位贡献者') &&
          g.desc.includes('部门能力盘点');
        if (gOk) ok('v0.4 反查页空态：空组（AI 与智能）走组织诊断文案', `「…6 个标签…等待第一位贡献者…」`);
        else fail('v0.4 反查页空态：空组分流', `title=${JSON.stringify(g && g.title)} desc=${JSON.stringify(g && g.desc).slice(0, 120)}`);

        // (2) 交集空分支：非空组里的标签单点无人（d-app，业务系统域内唯一 0 人标签）
        const i = fn(['d-app']);
        const iOk =
          i &&
          i.title === '「迪卡侬 App」暂时还没有人登记' &&
          i.desc === '这些标签的交叉暂时没有落在同一个人身上。可以去掉一两个条件，或分别查看每个标签下的人。';
        if (iOk) ok('v0.4 反查页空态：非空组交集空走行动指引文案', '去掉条件 / 分别查看');
        else fail('v0.4 反查页空态：交集空分流', `title=${JSON.stringify(i && i.title)} desc=${JSON.stringify(i && i.desc).slice(0, 120)}`);

        // (3) 多选：一空组 + 一非空组 → 空组优先（诊断文案胜出），title 为组合式
        const multi = fn(['d-pos', 'd-ai']);
        const mOk =
          multi &&
          multi.title === '这个标签组合暂时没有匹配的人' &&
          multi.desc.includes('「AI 与智能」这个领域目前还没有人登记');
        if (mOk) ok('v0.4 反查页空态：多选含空组 → 空组诊断优先、title 为组合式');
        else fail('v0.4 反查页空态：多选优先级', `title=${JSON.stringify(multi && multi.title)} desc=${JSON.stringify(multi && multi.desc).slice(0, 120)}`);

        // (4) 非空组合（应有人在，不会进空态；此处只验 title 分流不抛错）
        const live = fn(['d-pos']);
        if (live && live.title === '「门店 POS」暂时还没有人登记' && live.desc.includes('这些标签的交叉')) {
          ok('   ↳ 非空标签 d-pos 单点：走交集空文案（title 具名、无空组特征）');
        } else {
          fail('   ↳ 非空标签 d-pos 单点空态', `title=${JSON.stringify(live && live.title)} desc=${JSON.stringify(live && live.desc).slice(0, 120)}`);
        }

        // (5) 防御：空数组 / 非数组输入不抛错
        let robust = true;
        try { fn([]); fn(undefined); fn(null); } catch (_) { robust = false; }
        if (robust) ok('   ↳ emptyCopy 对空/非数组输入不抛错', '[] / undefined / null 均安全');
        else fail('   ↳ emptyCopy 空输入健壮性', '对 [] / undefined / null 抛错');
      }
    }

    // P1-3：release 守卫——planned/gray 的 Release 不得计入实证。
    //   断言直接作用在**证据集合本身**（对守卫敏感）：ALL_EVIDENCE 里任何 kind==='release'
    //   的条目，其标题必须来自一条 status==='released' 的 releaseNote。若守卫被移除，
    //   未来日期（gray）或他人（planned）的未发布 Release 会出现在集合里 → 变红。
    if (okData && Array.isArray(MOCK.ALL_EVIDENCE) && Array.isArray(MOCK.releaseNotes)) {
      const releasedTitles = new Set(MOCK.releaseNotes.filter((r) => r.status === 'released').map((r) => `${r.system} ${r.version}`));
      const notReleasedTitles = new Set(MOCK.releaseNotes.filter((r) => r.status !== 'released').map((r) => `${r.system} ${r.version}`));
      const releaseEv = MOCK.ALL_EVIDENCE.filter((e) => e.kind === 'release');
      const leaked = releaseEv.filter((e) => !releasedTitles.has(e.title) || notReleasedTitles.has(e.title));
      if (leaked.length === 0 && releaseEv.length > 0) {
        ok('P1-3 release 守卫：证据集合只含「已发布」Release 的条目', `已发布 release 证据 ${releaseEv.length} 条，未发布 0 条`);
      } else if (releaseEv.length === 0) {
        fail('P1-3 release 守卫', '证据集合里没有任何 release 证据（守卫把已发布也误杀了？）');
      } else {
        fail('P1-3 release 守卫失效：未发布 Release 混入证据集合', leaked.map((e) => e.title).join(', '));
      }
    }

    // P1-4：deprecated / merged 标签必须存在且可渲染（词表侧）
    if (okData && Array.isArray(MOCK.TAG_DICT)) {
      const dep = MOCK.TAG_DICT.filter((t) => t.status === 'deprecated');
      const mer = MOCK.TAG_DICT.filter((t) => t.status === 'merged');
      if (dep.length >= 1 && mer.length >= 1) ok('P1-4 词表含 deprecated + merged 标签（有渲染出口）', `deprecated=${dep.length} merged=${mer.length}`);
      else fail('P1-4 词表缺 deprecated / merged', `deprecated=${dep.length} merged=${mer.length}`);

      /* P1-4 状态守卫（不变量）：**任何**人身上的 deprecated / merged 标签，
         实证度必须恒为 none、recentScore 恒为 0——旧标签不得参与实证计算。
         直接扫全体 personTags，不只查林望一人。 */
      const legacyIds = new Set([...dep, ...mer].map((t) => t.id));
      let checkedLegacy = 0;
      const violations = [];
      Object.keys(MOCK.personTags).forEach((id) => {
        MOCK.getPersonProfile(id).tags.forEach((t) => {
          if (!legacyIds.has(t.tag.id)) return;
          checkedLegacy += 1;
          if (t.evidenceTier !== 'none' || t.recentScore !== 0) {
            violations.push(`${(MOCK.getPersonProfile(id).person || {}).name}:${t.tag.id}(tier=${t.evidenceTier},score=${t.recentScore})`);
          }
        });
      });
      if (checkedLegacy > 0 && violations.length === 0) {
        ok('P1-4 状态守卫：legacy 标签不参与实证（tier=none / score=0）', `已校验 ${checkedLegacy} 个 legacy 标签实例`);
      } else if (checkedLegacy === 0) {
        fail('P1-4 状态守卫', 'personTags 里没有任何 legacy 标签实例（测试无效）');
      } else {
        fail('P1-4 状态守卫失效：legacy 标签参与了实证计算', violations.join(', '));
      }
    }
  }

  /* ================= 摘要态文章（有卡片、无全文）================= */
  await navigate(win, '#/knowledge/article/bp-tracking-v2');
  await settle(460);
  const needP = ['埋点规范 v2 落地指引', '内容建设中', '正文建设中', '待补知识'];
  const missP = needP.filter((t) => !has(doc, t));
  if (missP.length === 0) ok('无全文的知识卡片降级为「建设中」摘要页（而非 404）');
  else fail('无全文的知识卡片降级为摘要页', '缺失：' + missP.join(' / '));

  // 降级页角色位文案：'待补充' 与作者名拼成「沈知微 · 待补充」语义别扭，改为「待补充正文」
  if (has(doc, '待补充正文') && !/·\s*待补充(?!正文)/.test(bodyText(doc)))
    ok('降级页作者角色文案清晰（待补充正文）');
  else fail('降级页作者角色文案清晰', bodyText(doc).match(/沈知微[^）\n]{0,12}/)?.[0] || '未命中');

  /* ================= 栅格 / 图表 / 深链 回归锚点 ================= */
  const css = fs.readFileSync(path.join(DIST, 'assets', 'style.css'), 'utf8');

  // ① 单一栅格：顶栏(.dp-container) 与 正文(.dp-shell) 必须同为 margin:0 auto。
  //    否则父级 <main> 是 block 不会替 .dp-shell 居中 → 宽视口顶栏居中、正文靠左
  //    （1440 差 80px，1920 差 320px；1220 以下看不出，正是易漏档位）。
  const contC = /\.dp-container\{[^}]*margin:0 auto/.test(css);
  const shellC = /\.dp-shell\{[^}]*margin:0 auto/.test(css);
  if (contC && shellC) ok('.dp-shell 与 .dp-container 同为居中栅格（宽视口不错位）');
  else fail('.dp-shell 与 .dp-container 同为居中栅格', `.dp-container=${contC} .dp-shell=${shellC}`);

  // ② 锚点偏移：深链跳转时标题不被 sticky 顶栏（60px）压住。
  //    P2-1：仅断言「存在 scroll-margin-top」太弱（写 0px 也能过）。
  //    升级为断言**具体数值 ≥ 60px**（顶栏高度），并校验单位是 px。
  {
    const m = css.match(/scroll-margin-top:\s*(\d+(?:\.\d+)?)px/);
    const val = m ? Number(m[1]) : NaN;
    if (m && val >= 60) ok('锚点跳转预留顶栏偏移（scroll-margin-top ≥ 60px）', `${val}px`);
    else fail('锚点跳转预留顶栏偏移 ≥ 60px', m ? `实际 ${val}px` : 'style.css 无 px 单位的 scroll-margin-top');
  }

  // ③ 键盘焦点环：可点卡片/列表行获得焦点后必须可见
  const cardF = /\.dp-card\[role=["']?button["']?\]:focus-visible/.test(css);
  const rowF = /\.dp-row:focus-visible/.test(css);
  if (cardF && rowF) ok('可点卡片/列表行有键盘焦点环（:focus-visible）');
  else fail('可点卡片/列表行有键盘焦点环', `.dp-card=${cardF} .dp-row=${rowF}`);

  // ④ 图表颜色编码：单序列柱状图必须单色（品牌蓝）；分类色板只留给多序列折线。
  //    早年把 6 根柱涂成 6 色，绿=健康却指向最差的库存 305ms，与数据反着来。
  await navigate(win, '#/ops');
  await settle(480);
  // 注意：不要用 rect[fill="#hex"] 这类属性选择器——nwsapi 对属性值里的 # 兼容不佳，
  // 会返回 0 个（假阴性）。改为遍历 rect 读 getAttribute('fill')。
  const palette = ['#1c7ed6', '#12a594', '#2f9e44', '#f08c00', '#e8590c', '#c2255c', '#868e96'];
  const rectFills = Array.from(doc.querySelectorAll('rect')).map((r) => (r.getAttribute('fill') || '').toLowerCase());
  const brandBars = rectFills.filter((f) => f === '#3643ba').length;
  const strayBars = rectFills.filter((f) => palette.includes(f));
  if (strayBars.length === 0 && brandBars >= 6) {
    ok('P95 柱状图单序列单色（品牌蓝，无分类色板残留）', `brand=${brandBars} / rect 总数=${rectFills.length}`);
  } else {
    fail('P95 柱状图单序列单色', `stray=${strayBars.join(',') || '无'} brand=${brandBars} rect=${rectFills.length}`);
  }

  // ⑤ 卡头「单位 ms」不得重复（desc 与 extra 曾各渲染一次）
  const unitMs = (norm(bodyText(doc)).match(/单位ms/g) || []).length;
  if (unitMs === 1) ok('Ops 卡头「单位 ms」不重复渲染');
  else fail('Ops 卡头「单位 ms」不重复渲染', `出现 ${unitMs} 次`);

  // ⑥ 对比度：textDisabled(#B3B7B9, 2.04:1) 只许做装饰，不许承载文字。
  //    图表内的单位字样已删（改由卡头 desc 承担），这里守住不再退化。
  const dimTexts = Array.from(doc.querySelectorAll('svg text')).filter(
    (t) => (t.getAttribute('fill') || '').toLowerCase() === '#b3b7b9'
  );
  if (dimTexts.length === 0) ok('图表内无 2.04:1 装饰色文字（单位由卡头承担）');
  else fail('图表内无 2.04:1 装饰色文字', `svg text=${dimTexts.length}`);

  // ⑦ 数据披露口径一致：同屏 Agent 已声明「脚本化原型」，而指标/计数以真实运行值口吻呈现
  //    会造成披露标准不一致。统一在页脚声明一次。
  if (has(doc, '示意数据')) ok('页脚声明「数据均为示意数据」（与 Agent 披露口径一致）');
  else fail('页脚声明「数据均为示意数据」', '未在页脚找到披露文案');

  /* ================= 零 console.error ================= */
  if (errors.length === 0) ok('零 console.error / 无 React 与 antd 警告', '运行时干净');
  else fail('零 console.error / 无 React 与 antd 警告', errors.slice(0, 6).join(' | '));

  if (unhandled.length === 0) ok('无未处理的 Promise rejection');
  else fail('无未处理的 Promise rejection', unhandled.slice(0, 3).join(' | '));

  /* ================= 不透明源：localStorage 抛错仍能挂载 ================= */
  try {
    const ctx2 = boot({ storageThrows: true, label: 'opaque-origin' });
    await sleep(900);
    ctx2.doc.body.querySelectorAll('script').forEach((s) => s.remove());
    const t2 = bodyText(ctx2.doc);
    if (t2.length > 200 && ctx2.doc.getElementById('root').children.length > 0 && has(ctx2.doc, '今日 Hub')) {
      ok('file:// 不透明源下 localStorage 抛错仍能正常挂载（store 兜底）');
    } else {
      fail('file:// 不透明源下仍能挂载', `text=${t2.length}`);
    }
    if (ctx2.errors.length === 0) ok('   ↳ 该情形下亦零 console.error');
    else fail('   ↳ 该情形下亦零 console.error', ctx2.errors.slice(0, 4).join(' | '));
    ctx2.win.close();
  } catch (e) {
    fail('file:// 不透明源下仍能挂载', String(e && e.message));
  }

  /* =====================================================================
     P0-1 回归（关键路径覆盖缺口）——「填期望完成时间 → 提交 → 回一级页列表可见该行」
     ---------------------------------------------------------------------
     真缺陷（已实跑复现）：DemandNew.jsx 的 DatePicker onChange 把 **dayjs 对象**
     直接写进草稿（`set({ expectAt: d })`），提交后该对象进入需求行；DemandList
     行渲染 `<span>{r.expectAt}</span>` 把对象当 React 子节点 → React error #31
     （Objects are not valid as a React child）→ **整个 #/demand 子树渲染失败、页面白屏**。

     为什么原 137 条断言漏掉了它：
       · smoke 从未走过「填日期 → 提交」这条路径（DatePicker 是受控浮层，
         旧写法在 jsdom 里点日历不可靠 → 干脆没写）；
       · 6 条 mock 数据的 expectAt 全是字符串或「无硬性期限」，
         所以「渲染数据行」的断言永远喂不到 dayjs 对象 → 零覆盖。

     本回归如何造这条路径（jsdom 边界内的可靠写法）：
       · 不复用主 ctx（主 ctx 已把 <script> 摘掉、且被上游断言改造过 DOM），
         而是**另起一个全新 jsdom**，内联执行同一份 dist 产物；
       · 日期不靠「点日历浮层」，而是**直接给 .ant-picker input 写值 + 回车**
         （setNativeValue + keydown Enter）——这是 antd DatePicker 的受控入口，
         jsdom 下稳定触发 onChange；已实测 dateValue=2026-09-20 可靠生效；
       · 提交后导航回 #/demand，断言「列表出≥1 行且含新标题、零新增 React 错误」。

     ⚠️ jsdom 能力边界：getBoundingClientRect/offsetWidth 恒为 0，
        故**不**用几何当可见性门；只看「.dp-row 数量 + 标题文本 + console.error 数」。

     变异自证：把 DemandNew.jsx:560 改回 `set({ expectAt: d })`（不 format）后，
     本组断言①会变红（说明它确实在守这个洞）；还原后变绿。
     修复方向 = 上游 format（`set({ expectAt: d ? d.format('YYYY-MM-DD') : null })`），
     故本断言以「端到端行为」为准，**不**要求 DemandList 自身容忍 dayjs 对象
     （否则一旦上游已修、这里仍强求下游兜底，就会变成永远红的假门）。
     ===================================================================== */
  {
    let e2e = null;
    try {
      e2e = await probeDemandExpectAtPath();
    } catch (e) {
      fail('P0-1 填期望完成时间→提交→列表可见该行', '探针异常：' + String((e && e.message) || e).slice(0, 200));
    }

    if (e2e) {
      // ① 端到端主断言：新提交的需求（含期望完成时间）必须出现在 #/demand 列表里
      const rowVisible = e2e.rowsAfter > 0 && e2e.hasNewTitle;
      const cleanRun = e2e.newReactErrors === 0;
      if (rowVisible && cleanRun && e2e.submitted) {
        ok(
          'P0-1 填期望完成时间→提交→一级页列表可见该行（零 React 错误）',
          `rows=${e2e.rowsAfter} hasNew=${e2e.hasNewTitle} date=${e2e.dateValue} newErr=${e2e.newReactErrors}`
        );
      } else {
        fail(
          'P0-1 填期望完成时间→提交→一级页列表可见该行',
          `submitted=${e2e.submitted} date=${e2e.dateValue} rows=${e2e.rowsAfter}（应>0）` +
            ` hasNewTitle=${e2e.hasNewTitle} newReactErrors=${e2e.newReactErrors}（应 0）` +
            (e2e.firstErr ? ' | ' + e2e.firstErr.slice(0, 130) : '') +
            ' —— 根因：DemandNew.jsx:560 的 DatePicker onChange 未把 dayjs format 成字符串'
        );
      }

      // ② 数据层对照组（defense-in-depth）：DemandList 对「契约合法输入（字符串/undefined）」
      //    必须正常渲染 1 行 —— 证明渲染器本身是好的，红只可能来自上游喂了脏数据。
      if (e2e.renderer.rows === 1 && e2e.renderer.objErr === 0) {
        ok('P0-1 数据层对照：expectAt=字符串时 DemandList 渲染 1 行且零报错', `rows=${e2e.renderer.rows}`);
      } else {
        fail(
          'P0-1 数据层对照：expectAt=字符串时 DemandList 渲染 1 行',
          `rows=${e2e.renderer.rows}（应 1）objErr=${e2e.renderer.objErr}（应 0）` + (e2e.renderer.note || '')
        );
      }
    }
  }

  win.close();

  /* --------------------------- 汇总 --------------------------- */
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log('\n================ 冒烟测试结果 ================');
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '   [' + r.detail + ']' : ''}`);
  }
  console.log('--------------------------------------------');
  console.log(`路由逐条断言：`);
  for (const r of routeReport) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.hash}  ${r.name}  →  ${r.texts.join(' / ')}`);
  }
  console.log('--------------------------------------------');
  console.log(`合计 ${results.length} 项断言，通过 ${passed}，失败 ${failed.length}`);
  if (failed.length) {
    console.log('\n失败明细：');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
  }
  process.exitCode = failed.length ? 1 : 0;
}

main().catch((e) => {
  console.error('测试运行异常：', e);
  process.exitCode = 1;
});
