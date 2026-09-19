/**
 * jsdom 冒烟测试 —— 直接跑在构建产物 dist 上（构建通过 ≠ 能跑）
 * 覆盖：挂载 / 6 条路由逐条断言特征文案 / 搜索命中与空态 / 主要交互 /
 *       加载态 Skeleton 出现→消失 / 404 Result / Form 校验 / Watermark 容器 / Tour /
 *       file:// 不透明源下 localStorage 抛错仍能挂载 / 零 console.error
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
  return { html: inlined, bundleName: rel, bundleKB: Math.round(fs.statSync(jsPath).size / 1024) };
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

  if (doc.querySelectorAll('.dp-nav-item').length === 5) ok('一级导航 5 项（无侧边栏）');
  else fail('一级导航 5 项（无侧边栏）', `实际 ${doc.querySelectorAll('.dp-nav-item').length} 项`);

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
      texts: ['工作台', '工具导航', '组织速查', '需求提交', '申请权限', 'Grafana 监控看板', 'Owner', '门店设备管理后台'],
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
    const expectKey = { '#/home': '首页', '#/news': '信息中心', '#/ops': '监控运营', '#/knowledge': '知识中心', '#/knowledge/article/bp-stock-dedup': '知识中心', '#/workspace': '工作台' }[r.hash];
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

  // P0 回归锚点：不得出现 antd Result 的内置彩色插画（违反 ds-04「禁用彩色插画」）
  if (!doc.querySelector('.ant-result-image') && !doc.querySelector('.ant-result')) {
    ok('   ↳ 未使用 antd Result 内置插画（ds-04 合规）');
  } else {
    fail('   ↳ 未使用 antd Result 内置插画', '检测到 .ant-result / .ant-result-image');
  }

  /* ================= Agent Drawer ================= */
  const agentBtn = byText(doc, 'button', 'Agent for Digital');
  if (agentBtn) {
    click(win, agentBtn);
    await sleep(220);
    if (doc.querySelector('.ant-drawer') && has(doc, '脚本化原型')) ok('Agent Drawer 打开');
    else fail('Agent Drawer 打开');
    const prompt = byText(doc, '.ant-drawer button', '生产环境数据库只读权限');
    if (prompt) {
      click(win, prompt);
      await sleep(200);
      if (has(doc, '90 天')) ok('Agent 脚本化回复命中关键词');
      else fail('Agent 脚本化回复命中关键词', bodyText(doc).slice(-200));
    } else {
      fail('Agent 建议问题可点击');
    }
    const dClose = doc.querySelector('.ant-drawer-close');
    if (dClose) click(win, dClose);
    await sleep(220);
    if (!doc.querySelector('.ant-drawer-open')) ok('Agent Drawer 可关闭');
    else fail('Agent Drawer 可关闭');
  } else {
    fail('Agent 入口存在');
  }

  /* ================= 工作台：Form 校验 + 提交 ================= */
  await navigate(win, '#/workspace');
  await settle(460);
  const demandTab = byText(doc, '.ant-tabs-tab', '需求提交');
  if (demandTab) {
    click(win, demandTab);
    await sleep(240);
    if (has(doc, '提交历史')) ok('工作台切换至「需求提交」Tab');
    else fail('工作台切换至「需求提交」Tab');

    const newBtn = byText(doc, 'button', '提交新需求');
    if (newBtn) {
      click(win, newBtn);
      await sleep(240);
      if (has(doc, '需求标题')) ok('需求提交 Modal + Form 打开');
      else fail('需求提交 Modal + Form 打开');

      const okBtn = byText(doc, '.ant-modal-footer button', '提交');
      if (okBtn) {
        click(win, okBtn);
        await sleep(240);
        if (has(doc, '请填写需求标题')) ok('Form 校验生效：空表单提交被拦截');
        else fail('Form 校验生效：空表单提交被拦截', bodyText(doc).slice(-200));
      } else {
        fail('Modal 提交按钮可定位');
      }

      const cancelBtn = byText(doc, '.ant-modal-footer button', '取消');
      if (cancelBtn) click(win, cancelBtn);
      await sleep(240);
    } else {
      fail('「提交新需求」按钮存在');
    }

    // rc-select 用 mousedown 展开
    const selectTrigger = doc.querySelector('.ant-modal .ant-select-selector, .dp-form .ant-select-selector');
    if (selectTrigger) {
      selectTrigger.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true }));
      await sleep(160);
      const opt = doc.querySelector('.ant-select-item-option');
      if (opt) ok('Select 下拉可展开（mousedown）');
      else fail('Select 下拉可展开（mousedown）');
    }
  } else {
    fail('工作台 Tab 可定位');
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

  // ② 锚点偏移：深链跳转时标题不被 sticky 顶栏（60px）压住
  if (/scroll-margin-top/.test(css)) ok('锚点跳转预留顶栏偏移（scroll-margin-top）');
  else fail('锚点跳转预留顶栏偏移', 'style.css 无 scroll-margin-top');

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
