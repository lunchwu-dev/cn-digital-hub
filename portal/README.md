# Decathlon Digital · 部门门户（高保真可交互原型）

> 迪卡侬中国 · Digital 部门内部门户。桌面优先、基础响应式。
> 技术栈：**React 18 + Ant Design 5 + Vite 5**（自写 hash 路由，不引 react-router）。
> 设计系统事实来源：`outputs/01b-decathlon-cn-visual-spec.md`（decathlon.com.cn 生产站点实测）。

---

## 快速开始

```bash
npm install
npm run dev        # 开发预览 http://localhost:5173
npm run build      # 产出 dist/（iife 单包，可 file:// 双击打开）
npm run test:smoke # 在 dist 上跑 jsdom 冒烟测试（53 项断言）
node tests/shots.cjs   # 出图 17 张 + 路由抽点 + 375→1920 连续扫描(桌面/移动) 断言 1–4（驱动本机 Chrome，无需 puppeteer）
```

**离线打开**：`npm run build` 后直接双击 `dist/index.html` 即可运行，无需服务器。
（`base: './'` + `rollupOptions.output.format='iife'` + 剥离 `type="module"`/`crossorigin` 的插件共同保证这一点。）

**本地 HTTP 预览**：`npm start`（即 `node server.mjs`，零依赖静态服务，读 `PORT` 环境变量、绑 `0.0.0.0`）。

> **发布到公网时不要用这条 Node 服务**。平台发布沙箱里 `node` 型 http-service 会全部返回 404，必须走 `static` 型：
> 把 `dist/` 复制成独立目录（如 `portal-site/`），以 `language:"static"` + `entryHtml:"index.html"` 发布。
> 判据是发布结果里的 `deployedAs` 字段：`"web-page"` 才代表走平台内置静态服务。详见 `outputs/04-delivery-notes.md`。

> 冒烟测试依赖共享目录里的 jsdom，**运行前需设**：
> `set NODE_PATH=C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules`
> 否则 `require('jsdom')` 直接报错、进程以退出码 1 结束。
> `tests/shots.cjs` 只用 Node 内置模块 + 本机 Chrome，无需 NODE_PATH。

---

## 目录结构与各文件职责

```
portal/
├─ index.html                 # 入口 HTML
├─ vite.config.js             # base './' / iife / offlineFriendlyHtml 插件 / chunkSizeWarningLimit 1200
├─ package.json               # React 18 · antd 5 · Vite 5（无 react-router）
├─ README.md
├─ shots/                     # 出图产物（17 张 PNG）+ report.json（{shots, routeScan, thresholds, sweep}：含 1546×2 连续扫描原始数据）
├─ src/
│  ├─ main.jsx                # 挂载：ConfigProvider(theme + zhCN) → antd App → Root；引入 reset.css 与 global.css
│  ├─ App.jsx                 # 应用外壳：顶栏 + Watermark 内容区 + 页脚 + 路由分发 + Skeleton 加载态 + Tour + 404 空态
│  ├─ router.js               # 自写 hash 路由（useHashRoute / NAV / NAV_OF / go）
│  ├─ theme.js                # TOKENS 全量设计令牌 · decathlonDigitalTheme · useT() 语义别名 · SEMANTIC 映射
│  ├─ store.js                # 安全 localStorage（file:// 不透明源与无痕模式兜底）
│  ├─ global.css              # 胶囊圆角 / 等宽数字 / 卡片静止 1px 边框 / 单一栅格 / 锚点偏移 / 焦点环 / 长文排版
│  ├─ data/mock.js            # 全部 mock 数据（围绕迪卡侬中国真实数字化形态构造）
│  ├─ components/
│  │  ├─ TopBar.jsx           # 深色顶栏（#000F17，60px）+ 一级导航 + 全局搜索 / Agent / 通知
│  │  ├─ GlobalSearch.jsx     # 全局搜索 Modal + 结果按频道分组 + 空态（回车打开首条）
│  │  ├─ AgentDrawer.jsx      # Agent for Digital 右侧 Drawer 对话面板（脚本化回复）
│  │  ├─ charts.jsx           # 手写 SVG 图表：LineChart / BarChart / HBarChart / Legend（零外部依赖）
│  │  ├─ ui.jsx               # 原子组件：Panel / PanelHead / Pill / KpiTile / Sparkline / ContentMeta / PageEmpty …
│  │  └─ icons.jsx            # 图标注册表（@ant-design/icons Outlined 线性系列）
│  └─ pages/
│     ├─ Home.jsx             # ① 首页 · 今日 Hub（置顶决议 / 健康度快照 / 双栏 / 快捷入口 / Agent 引导条）
│     ├─ News.jsx             # ② 信息中心（公告与决议 / 产品 Release / 项目动态）
│     ├─ Ops.jsx              # ③ 监控运营（L1 看板 / KPI / 图表 / 稳定性 / 下钻卡）
│     ├─ Knowledge.jsx        # ④ 知识中心（最佳实践 / 设计规范 / FAQ + 待补知识队列）
│     ├─ ArticleDetail.jsx    # ⑤ 文章详情（Breadcrumb + TOC + 长文排版）
│     └─ Workspace.jsx        # ⑥ 工作台（工具导航 / 组织速查 / 需求提交）
└─ tests/
   ├─ smoke.cjs               # jsdom 冒烟测试（跑在 dist 上，53 断言）
   └─ shots.cjs               # CDP 出图 + 路由抽点 + 连续扫描断言 1–4（Chrome DevTools Protocol）
```

---

## 路由表

| 路由 | 页面 |
|---|---|
| `#/home` | 首页 · 今日 Hub |
| `#/news` | 信息中心 |
| `#/ops` | 监控运营 |
| `#/knowledge` | 知识中心 |
| `#/knowledge/article/:id` | 文章详情（`NAV_OF` 映射回知识中心高亮） |
| `#/workspace` | 工作台 |
| 其他 | 404 空态（自建 `PageEmpty`） |

## 全局组件

- **全局搜索**：顶栏胶囊搜索框（快捷键 `/`）→ Modal，结果按频道分组，含空态；输入框支持回车打开首条结果。
- **Agent for Digital**：顶栏入口 → 右侧 Drawer 对话面板，脚本化回复。

---

## 设计系统约束（已落地）

- **零硬编码颜色**：组件内一律 `const c = useT()` 后取 `c.xxx`；色值只存在于 `theme.js` 与 `global.css`。
- **自托管字体**：`src/assets/fonts/` 内嵌 Roboto / Roboto Mono 的 **latin 子集**（Apache-2.0，可自由分发，合计约 76 KB），
  中文走系统字体回退栈。不自托管的话 Windows 端会静默回退 Segoe UI，「数字用 Roboto Mono」这一签名会失效。
  构建后 CSS 中的 `url()` 为相对路径（`./roboto-latin.woff2`），`file://` 下可直接加载。
- **两层结构、无侧边栏**：深色顶栏（一级导航）+ 分区内 Tabs 子导航。
- **胶囊签名**：按钮 / 标签 / 搜索框 999px；卡片 8px、控件 6px、浮层 12px。
- **等宽数字**：版本号 / ID / 指标值统一 `tabular-nums` + Roboto Mono。
- **单一栅格**：顶栏 / 内容区 / 页脚同为 1280px，且**都必须 `margin: 0 auto` 自居中**
  （父级 `<main>` 是 block，不会替 `.dp-shell` 居中；漏了就会在宽视口下顶栏居中、正文靠左）。
- **顶栏响应式（牺牲顺序 + 单调高度）**：折叠一律由 `global.css` 的 `@media` + className 控制
  （**不写内联 style**——内联无法被媒体查询覆盖）。**牺牲顺序**：logo 副标题 → 搜索文字（胶囊转图标）
  → agent 文字 → **最后才是导航文字**（导航是路标、搜索有 `/` 快捷键与放大镜兜底，不能反过来）。
  实测分档（分界值实测后取，各留 ≥16px 余量）：
  | tier | 宽度 | nav 文字 | agent 文字 | 搜索文字 | 顶栏高 |
  |---|---|---|---|---|---|
  | T1 | ≥ 1272 | ✓ | ✓ | ✓（胶囊 220） | 61 |
  | T2 | 1012–1271 | **✓** | ✗ | ✗ | 61 |
  | T3 | 768–1011 | ✗ | ✗ | ✗ | 61 |
  | T4 | ≤ 767 | ✗ | ✗ | ✗ | 141/99/61（允许换行） |
  `≥768 恒为单行（`flex-wrap:nowrap`）；搜索胶囊基态 `flex:0 1 220px; min-width:0` 可连续收缩。
  详细根因双坑见文末「已知取舍」。
- **卡片静止仅 1px 边框无阴影**，仅 hover 抬升；阴影只两档。
- **图表颜色编码**：单序列柱状/条形图 **必须单色**（品牌蓝）——语义色集中在「稳定性状态」区，
  分类色板只用于**多序列折线**（区分身份）。把 6 根同类柱子涂 6 色会让「绿=健康」与数据反着来。
- **品牌黄 `#FFCD4E` 仅小面积标记**（置顶 / 里程碑 / NEW / 顶栏通知徽标）。
- **无登录鉴权**：无头像、无个人中心、无我的订阅、无已读态；顶栏右侧仅搜索 / Agent / 通知。
- **交互可达性**：整卡/整行可点必须 `role="button"` + `tabindex="0"` + Enter/Space，且有可见 `:focus-visible` 焦点环。
- **锚点偏移**：sticky 顶栏 60px，锚点目标统一 `scroll-margin-top: 76px`，深链跳转标题不被压住。
- **空态自建**：不使用 antd `Result` —— 其 `status=404/403/500` 会强制渲染内置**彩色插画**并忽略传入 `icon`，
  与本系统 ds-04「禁用彩色插画图标」冲突。改用自建 `PageEmpty`（品牌几何符号 + 标题 + 操作）。

## 深链（hash 路由）

| 深链 | 行为 |
|---|---|
| `#/workspace/org` / `#/workspace/demand` | 直接落到对应 Tab |
| `#/workspace/tools/delivery`（monitor / business / data） | 工具导航中直接定位到该分组并高亮 |

首页「快捷入口」即使用该机制，避免所有磁贴都跳到同一个分区页。

## antd 用透清单

`ConfigProvider(theme + zhCN)` · `App`(message 上下文) · `Tour`(首访引导) · `Watermark`(内部资料水印) ·
`Breadcrumb` · `Skeleton`(路由加载态) · `Modal` + `Form`(需求提交 / 权限申请 / 补充 FAQ) ·
`Table`(Release / 组织速查 / 需求历史) · `Tabs` · `Segmented` · `Select` · `Badge` · `Tooltip` · `Input` ·
`Button` · `Space` · `Typography` · `Flex` · `Empty` · `Drawer`。
（未用 `Result` —— 理由见上「空态自建」。）

## 回归护栏（冒烟测试锁定的不变量）

`tests/smoke.cjs` 跑在 **构建产物** 上（构建通过 ≠ 能跑），共 **53 项断言**，除逐路由特征文案外还包括：

- `.dp-shell` 与 `.dp-container` 同为 `margin:0 auto`（栅格不错位）
- 锚点 `scroll-margin-top`、可点卡片/行的 `:focus-visible` 焦点环
- Ops 的 P95 柱状图为**单序列单色**（无分类色板残留）、卡头「单位 ms」只渲染一次
- 图表内无 `textDisabled`(#B3B7B9, 2.04:1) 承载的文字（单位改由卡头承担）
- 「变更类型」胶囊为中性灰，不占用语义色
- 页脚统一声明「本原型所有数据均为示意数据 · 非真实运行值」（与 Agent「脚本化原型」披露口径一致）
- 无全文知识卡片的降级页作者角色位文案为「待补充正文」（不与作者名拼成「沈知微 · 待补充」）
- 未使用 antd `Result` 内置插画（ds-04 合规）
- 未知路由 404 空态 / 无全文知识卡片降级为「正文建设中」/ 深链分组高亮
- 键盘可达（`role=button` + `tabindex=0`）
- 零 `console.error`、无 React/antd 警告、无未处理 Promise rejection
- `file://` 不透明源下 `localStorage` 抛错仍能挂载（store 兜底）

`tests/shots.cjs` 会用 Chrome 出 **17 张**图，并跑「**路由抽点 + 连续扫描**」两组检查，全部写进
`shots/report.json`（结构：`{ generatedAt, shots, routeScan, thresholds, sweep:{desktop,mobile} }`）。
断言的档位必须**铺满缺陷可能出现的位置**（前两轮分别漏掉 1024–1268 与 768–976，正是抽点抽样所致）：

- **对齐**：1440 → 顶栏与正文均 `80`；1920 → 均 `320`。
- **前置哨兵（先证明页面真的渲染，再谈扫描）**：扫之前先查 `.dp-topbar` / `.dp-shell` 存在、
  `document.body.innerText.length > 500`、`querySelectorAll('*').length > 100`；任一条不满足
  → **立即非零退出，不继续扫**。（教训：曾出现 URL 拼错、量到空页，却把 1546×2 档的 null
  全写完然后 exit 0 —— 正是「不会变红的断言」。）
- **空数据计为失败**：扫描任一档测量值为 `null/undefined/NaN` → 失败，**不当作跳过**。
- **路由抽点**：11 宽度 × 5 路由 = 55 格，逐格 `scrollWidth <= clientWidth`。
- **连续扫描**：`vw = 375→1920` 步进 1，**desktop + mobile 各 1546 档**（只 `navigate` 一次，
  之后仅改 `Emulation.setDeviceMetricsOverride`，不重载，否则跑不动）。
- **断言 1 · 无溢出**：连续扫描任一档 `scrollWidth > clientWidth` → `process.exitCode = 1`。
- **断言 2 · 顶栏高恒等（≥768）＋ 单调（保留）**：`≥768` 每一档 `topbar.offsetHeight`
  必须**恒等于 1920 档**；`≤767` 是刻意折行段，只要求「越宽越不矮」。
  *等值这条是水平回归的守门员*——旧的纯单调判据对「高度不变/变矮」的水平回归全盲：
  若有人在 `max-width:1300` 里加 `padding:4px 0`，`1280→69、1301→61`，宽度增加高度下降 → 单调通过；
  但 `h(1280)=69 ≠ h(1920)=61` → 被等值这条抓住。
- **断言 3 · 内容不变式（仅 ≥768，余量 ≥16px）**：各 tier 起点
  `logo+nav+actions+2×gap <= 顶栏容器内容宽`（内容宽 = `clientWidth − padding`）。
  ⚠️ **不扩到全宽**：`≤767` 是刻意折行段，最多 239 档余量为负属良性。
- **断言 4 · navText 区间（无 ✓→✗）＋ ≥1012 可见**：沿 `375→1920` 扫描，`navText`
  可见性**一旦打开就不许再关**（抓「1012 可见、1016 又不可见」这类抖动）；并显式钉住
  `1024/1152/1200/1280/1440` 必须可见（把本轮修复钉住）。
- 实测形态带（desktop `#/home`）：`375–396` 141px / `397–597` 99px / `598–1011` 61px /
  `1012–1920` 61px（`navText` 自 1012 起为 ✓）；tier 起点余量 115 / 19 / 21 / 29 px。

### 变异测试：证明断言真的会咬人

「断言全绿」不等于「断言有用」——必须先证明**往坏里改会变红**。流程（结尾必须还原 + 核指纹）：

1. **备份构建产物**：`Copy-Item dist/assets/style.css dist/assets/style.css.bak`。
2. **注入一条可疑规则**（破坏顶栏高恒等）：往 `dist/assets/style.css` 末尾追加
   `@media (max-width:1300px){.dp-topbar-inner{min-height:69px}}`。
   > 为什么不用 `padding:4px 0`：`.dp-topbar-inner` 有 `min-height:60px`，纯加内边距会被
   > `min-height` **吸收**，`≥768` 高度纹丝不动（实测 `padding:4px 0` 只改了 `≤767` 的
   > 141→133 / 99→91），注入**不生效**、断言自然不红；`min-height:69px` 才真的改高。
3. **跑脚本**：`node tests/shots.cjs` —— 应当**非零退出**。实测只有**断言 2 等值**报红
   （`顶栏高度应恒等于 61(@1920)：533 档不符，例 768px=70 …`），而**旧的纯单调判据是绿的**
   （高度随宽度非增），恰好证明等值这条补上的正是盲区。
4. **还原并核指纹**：`Copy-Item dist/assets/style.css.bak dist/assets/style.css` 后
   `Get-FileHash dist/assets/style.css -Algorithm SHA256` 必须回到
   `DC5E342CA8A4EEB841AE8546F327F50C7E9BC6A74041F907BFE47BBF32457702`（逐位一致）。
   删除 `.bak`，再干净重跑一次 `node tests/shots.cjs` 应 `exit 0`。

> `README.md` 与 `tests/` 都不进交付包，改它们不影响打包；但 `dist/**` 是交付物，
> 变异测试**只允许临时改动并必须还原**（上一步的 sha256 就是为此设的闸）。

## 已知取舍

- 数据全部为 **高质量 mock**，不接任何外部 API；Agent 为脚本化回复。页脚统一声明「数据均为示意数据 · 非真实运行值」。
- 图表为手写 SVG（避免引入图表库，保持纯 HTML/SVG 可离线），无 hover 十字线与 tooltip。
- 门户只做 L1 概览，深度排查通过下钻卡跳转 Grafana / 日志 / 值班看板（界面上明确表达该架构决策）。
- 最佳实践中只有 3 篇有全文；其余条目点击后进入**「正文建设中」摘要页**（而非 404），
  呼应「待补知识」机制——被反复访问却缺正文的条目会自动进入待补队列。
- 字体仅覆盖 Latin/数字子集，中文走系统栈；如需中文也锁定字体需另授权字体文件。
- 375px 极端窄屏下顶栏折成多行（≈141px 高）而非汉堡菜单 —— 原型未做抽屉式导航，属已知取舍。

### 顶栏响应式的两个坑（务必读，否则下一个人一定会再踩）

1. **`flex-wrap: wrap` 不能当「降级」手段：它先折行、后收缩。**
   折行依据是 flex-basis（理想尺寸），不是收缩后的尺寸。所以「理想宽度 913px」会让
   768–976 直接换行、而 980（刚好放得下 913）反而不折 —— 出现**越宽越矮**的非单调高度。
   正确做法：`≥768` 一律 `flex-wrap: nowrap`，让空间不足时的让步**只由「按优先级隐藏标签 +
   搜索胶囊连续收缩」承担**，单调性由构造保证，不靠调参。

2. **牺牲顺序不能反：导航文字要留到最后。**
   曾把顺序写成「先砍导航文字（省 308px）、保留搜索文字（值 217px）」，结果在 1024/1152/1200
   这些主流笔记本宽度上一级导航只剩图标 —— 而五个图标里 `NotificationOutlined`（信息中心）
   与顶栏通知铃同视觉语汇、`DashboardOutlined`/`ReadOutlined`/`AppstoreOutlined` 难区分，
   等于在最主流设备上砍掉了「找路」这个首要功能。正确顺序：
   **logo 副标题 → 搜索文字（胶囊转图标）→ agent 文字 → 导航文字**。搜索有 `/` 快捷键与放大镜兜底，
   导航没有替代品。

> 两个分界（1271 / 1011）都是**实测**取的、各留 ≥16px 余量，并被 `shots.cjs` 断言 3/4 钉住；
> 改动 `global.css` 顶栏相关规则后必须重跑 `node tests/shots.cjs`，让断言 1–4 说话。
