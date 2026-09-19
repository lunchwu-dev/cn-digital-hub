# v0.3 质量审查报告 —— 站点结构重构 + 业务需求页改造

> 审查官：严过审（critique-reviewer） · 日期：2026-09-19
> 审查对象：v0.3 工作线（未提交工作区） · 报告文件：`outputs/_audit-v03.md`（gitignore）

---

## 0. 结论前置

**结论：需修正（不可直接交付）。**

- 构建 ✅ 通过（`vite build` exit 0），冒烟 ✅ 137/137 全绿，`dist` ✅ `file://` 可双击（非 module、无外部请求、无 crossorigin）。
- 7 条用户需求中 **6 条已落实、1 条部分落实**。
- **发现 1 条 P0 阻断缺陷**：需求提交带「期望完成时间」后，`#/demand` 整页白屏（React error #31）。**冒烟 137 条断言无一覆盖此路径** —— 正是本项目「断言不覆盖 → 静默崩溃」的典型。
- 另有 P1 2 条、P2 4 条。
- 规范 `outputs/02b-site-restructure-spec.md` §D 表格数字 **有 2 格错误**（见 §3），代码本身正确（均由数据实算），仅规范文字失真。

---

## 1. 逐条需求验收表（验收基准 = 用户 7 条原话）

| # | 用户需求 | 判定 | 证据（文件:行 / 实跑） |
|---|---------|------|----------------------|
| 1 | 工作台只保留工具导航（组织速查、业务需求移走） | ✅ 已落实 | `Workspace.jsx:949` 默认导出已去掉 Tabs，仅渲染 `ToolsView`；无「组织速查/需求提交」Tab。`#/workspace` 冒烟特征文案为 `['工作台','工具分组','申请权限',...]`（smoke.cjs:309-314）PASS |
| 2 | 组织速查、业务需求升为一级栏目 | ✅ 已落实 | `router.js:8-16` NAV 7 项含 `org`/`demand`；`NAV_OF` (19-38) 映射齐备；`Org.jsx` 新增 `#/org`；`DemandList.jsx` 新增 `#/demand`。冒烟「一级导航 7 项」PASS（137 项含个人主页复验） |
| 3 | agent for digital 改右下角悬浮 doodle | ✅ 已落实 | `FloatAgent.jsx`（新，52px 白底品牌蓝描边）；`App.jsx:268-275` 与 TopBar/Watermark/footer 平级渲染；`TopBar.jsx:109` 已移除 Agent 按钮；CSS `.dp-float-agent` fixed right:24 bottom:24 z-index:900（global.css:662）。冒烟「Agent 入口存在」PASS |
| 4 | 站点反馈融合进 agent | ✅ 已落实 | 无独立反馈入口/路由（grep 全库确认）；`AgentPanel.jsx` 反馈意图 → 「登记为反馈」→ 气泡内联表单（`:57-124`）；TopBar 反馈按钮已删。冒烟「提个反馈」显式入口 + 反馈词表反劫持 + 口语命中三项 PASS |
| 5 | 需求页展示当前业务需求列表 | ⚠️ **部分落实** | 列表存在（`DemandList.jsx:379-416`，6 行不折叠，冒烟 PASS）。**但提交带日期的需求后整页崩溃、列表消失（P0-1）** |
| 6 | 状态楼层：各状态数量 + 异常告警待跟进及责任人 | ✅ 已落实（数字与规范不符） | `DemandList.jsx:90-125` 5 格；异常告警格 `ownerText`（`:296-312`）格内明示责任人。实算：待处理1/进行中2/已完成3/异常告警1/本月新增4（规范表写 3/2/3/1/2，见 §3） |
| 7 | 新增需求入口显著 → 二级页（表单+嵌入表单的 agent） | ✅ 已落实 | 一级页页头 primary 主按钮 + 列表上方整行虚线入口（`DemandList.jsx:260,353`）；二级页 `DemandNew.jsx` `.dp-g-spec` 左表单右引导栏；6 字段挂 `FieldAgent`（`DemandNew.jsx:445-630`）。冒烟「新增入口显著」「内嵌字段 agent」PASS |

---

## 2. 未完成事项清单（含严重度 / 位置 / 复现 / 修法）

### 🔴 P0-1 —— 提交带「期望完成时间」的需求后，`#/demand` 整页白屏

**位置**：`portal/src/pages/DemandNew.jsx:560`（根因）→ `:351`（传播）→ `portal/src/pages/DemandList.jsx:205`（崩溃点）

**根因**：DatePicker 的 `onChange` 把 **dayjs 对象**直接存进草稿：
```js
onChange={(d) => set({ expectAt: d })}   // d 是 dayjs 对象，不是字符串
```
提交时 `expectAt: v.expectAt || undefined`（:351）把该对象写进需求行；列表行 `期望 <span className="dp-num">{r.expectAt}</span>`（DemandList.jsx:205）把对象当 React 子节点渲染 → **React error #31（Objects are not valid as a React child）→ 整棵 `/demand` 子树渲染失败 → 页面全白**。

**复现（实跑证据，见 `outputs/_audit-submit2.txt`）**：
1. 进 `#/demand/new` → 切「功能 / 系统」（完整档）
2. 填必填 6 项，**把「期望完成时间」选成 2026-09-20**
3. 点「提交需求」→ 提示「已提交…编号 REQ-2026-936」
4. 回到 `#/demand` → **body 文本为空、`.dp-row` = 0、`.dp-floor-cell` = 0**
5. 控制台：`Minified React error #31 … object with keys {$L,$u,$d,$y,$M,$D,$W,$H,$m,$s,$ms,$x,$isDayjsObject}` —— 键名即 dayjs 对象标识

**为什么 137 条断言全绿**：冒烟从未填「期望完成时间」再提交（只测了表单渲染与完成度上升），这条路径零覆盖。现有 6 条 mock 数据的 `expectAt` 都是字符串（`'2026-09-25'` / `'无硬性期限'`），所以列表初始渲染正常，缺陷只在**用户真实提交带日期时**暴露。

**修复建议（代码级）**：
```js
// DemandNew.jsx:560
onChange={(d) => set({ expectAt: d ? d.format('YYYY-MM-DD') : undefined })}
```
同时建议在 `DemandList.jsx` 的 `DemandRow` 加一层防御：`{typeof r.expectAt === 'string' ? r.expectAt : ''}`，避免将来其它入口再写入非字符串。
> 注：同一缺陷在 `Workspace.jsx:792` 的死代码 `DemandView` 里同样存在（`:619`），但该组件已无人引用，见 P2-1。

---

### 🟠 P1-1 —— 首页「提交需求」区块用静态 `demandHistory`，不跟随新提交

**位置**：`Home.jsx:255,262`（`demandStats(demandHistory)` 与 `<DemandRecentList rows={demandHistory} …/>`）

**现象**：App 层用 `demandRows`（state）承载真实需求流水，`#/demand` 与 `#/demand/new` 都吃这份 state；但首页大卡是**静态常量**。用户在二级页成功提交后，首页「最近提交」与三个计数**不会更新**，同一份数据在站内出现两个真相源。

**严重度理由**：P1 而非 P0 —— 首页区块定位是「服务台语气引导 + 社会证明」，用示意数据可辩护；但「我提交了却哪儿都看不见」是用户可感的信任损伤，且与 `#/demand` 不一致。

**修复建议**：把 `demandRows`/`addDemandRow` 通过 App 层下发给 `<Home>`（`renderRoute` 的 `case 'home'` 传入），Home 改用传入的 rows；`demandStats(demandHistory)` → `demandStats(rows)`。

---

### 🟠 P1-2 —— 首页入口卡两个 CTA 语义与目标页不符（轻）

**位置**：`Home.jsx:254-259`（`DemandEntryCard onSubmit/onGuide`）+ `DemandEntryCard.jsx:89-94`

**现象**：主按钮文案是 `copy.primaryCta = '提交需求'`，点击跳 `#/demand/new`（✅ 正确）；次按钮 `copy.secondaryCta = '先看提交指引'`，点击跳 `#/demand`（一级列表页）。「提交指引」指向的是**需求列表**，文案与落点不符（用户预期是「说明/帮助」页）。冒烟未校验次按钮文案-落点一致性。

**修复建议**：二选一 —— ① 改文案为「先看看别人提了什么」；② 若确要「指引」，跳到知识中心对应 FAQ 或二级页锚点，而非列表页。

---

### ⚪ P2-1 —— `Workspace.jsx` 残留 ~620 行死代码 `DemandView`（含重复评分引擎）

**位置**：`Workspace.jsx:320-940`（`export function DemandView`，含 §322-419 一份与 `DemandNew.jsx` **完全重复**的评分引擎 D1–D5 / `brdMissing` / `lightMissing` / `agentAdvice`，以及 `DemandRecentList` 引用）

**事实**：`DemandView` 全库无任何 import（grep 确认），是纯死代码。团队口头称「DemandView 已删除」，实际仅从 `renderRoute` 摘除，组件体仍在文件里。

**风险**：① 未来有人在死代码里改精度/改文案，误以为生效；② 它内部仍保留 `[data-role="recent"]`，与 §E.5「二级页无 recent」契约相悖；③ 评分引擎两份拷贝已开始漂移（`DemandNew.jsx` 的 `computeCompleteness` 有 `finalItems` 补 name，`Workspace` 版没有）。

**修复建议**：删除 `Workspace.jsx:320-940` 整段（保留 `OrgView` 导出，`Org.jsx` 依赖它）。

---

### ⚪ P2-2 —— 楼层「多责任人」分支为未测死路径

**位置**：`DemandList.jsx:94-102`（`owners.length===2 && includes('待分配')` / `>0` 分支）

**事实**：当前 6 条数据异常告警恒为 1 条、唯一责任人「顾一鸣」，仅走 `owners.length===1` 分支（实算 owners=`["顾一鸣"]`）。另外两条分支（`"责任人 X + 待指派"` / `"责任人 N 人 · 含待指派"`）**永不可达**，冒烟也未覆盖。若将来数据变化触发，文案与 ellipsis 截断行为未经验证。

**修复建议**：要么补一条多责任人 mock 覆盖，要么在注释显式标注「未测路径」并把阈值逻辑抽成纯函数单测（可复用 smoke.cjs 里 esbuild 打纯函数的手法）。

---

### ⚪ P2-3 —— `todayStamp` 用真实 `new Date()`，与基准日解耦

**位置**：`DemandList.jsx:47-48`

**事实**：`TODAY` 恒取 `META.updated` 的日期（2026-09-17，保证可复现），但 `todayStamp = ymd(new Date())` 取**运行时真实日期**。两处口径不同：`isSameDay(todayStamp, baseStamp)` 用于决定「本月新增」格是否显示「截至今日」副标签。实测真实今天为 2026-09-19，副标签不出。这是一个**随真实时间漂移的隐性分支**，不同日期跑出的 UI 会有细微差异（无功能损害）。

**修复建议**：若「截至今日」无真实语义需求，直接删掉该副标签；若要保留，应显式说明它依赖真实日期并在测试里固定。

---

### ⚪ P2-4 —— 栅格 `.dp-demand-side` 三卡 `<900px` 重排已验规则、未验真实浏览器几何

**位置**：`global.css:558-583`；断言 `smoke.cjs:704-763`

**事实**：jsdom 无布局引擎，smoke 用「结构 A + 规则 B + 无内联 display C」三段证明替代像素断言（这是正确处理）。但 `order` 重排的真实视觉顺序（承诺卡→助手→表单）**仅在 jsdom 里以规则存在性被证明**，未见 headless Chrome 通道实证。属可接受的能力边界，记录在案。

---

## 3. 规范数字复算（team-lead 点名的「必须自己复算」）

对 `demandHistory`（6 条）用 `DemandList.jsx` 同款逻辑实算（`outputs/_audit-floor.txt`）：

| 楼层格 | **代码实算（正确）** | 规范 §D.1 mockup / §D.4 | 判定 |
|--------|-------------------|------------------------|------|
| 待处理 | **1**（仅 REQ-0915 pending） | 3 | ❌ 规范错 |
| 进行中 | 2 | 2 | ✓ |
| 已完成 | 3 | 3 | ✓ |
| 异常告警 | 1（REQ-0921 命中 R3 阻塞词「确认库范围」） | 1 | ✓ |
| 本月新增（2026-09） | **4**（0921/0918/0915/0912 均 09 月） | 2 | ❌ 规范错 |

**结论**：规范 §D 表格 5 格中 **2 格数字是错的**（待处理、本月新增），与项目既往「规范表 5 格有 2 格错」完全吻合。**页面渲染值取自实算，故 UI 正确**；仅规范文档文字失真，需在文档层更正，勿据规范表去「修」代码。

> 附：异常告警归一结论「= 1（仅 0921）」与规范 §D.2 一致；责任人实算 `顾一鸣`（仅 1 人），故格内 `ownerText = "责任人 顾一鸣"`。

---

## 4. 5 维度评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 设计哲学 | **5**/5 | 立场极清晰且处处有据：doodle 不用实心蓝（避免与导航激活态撞语义）、反馈「向内收」而非扩列表、异常告警用「图标+文案+可下钻」替代橙数字、D 维叫「完整度」不叫「分数」。每个裁决都写清了代价与对冲，是全项目最成熟的模块。 |
| 视觉层次 | **4**/5 | 页头（h1+显著主按钮）→ 楼层（大数字主角）→ 整行新增入口 → 列表，主次分明；异常告警格以唯一图标 + hover 下钻在克制前提下取得焦点。扣分：页头在**同时**存在 primary 主按钮 + 虚线整行入口 + 次级返回时略显拥挤（可接受）。 |
| 执行质量 | **2**/5 | 表面干净（零硬编码色、`getContainer={false}` 齐备、reduced-motion 齐备、`file://` 安全），但 **P0-1 是核心功能级崩溃**（提交带日期即白屏），且 137 条断言零覆盖。执行质量的判据是「真实路径不崩」，故压到 2。 |
| 特异性 | **4**/5 | Decathlon Digital 语言强：品牌蓝语义边界、`dp-num` 等宽数字、`脚本化原型` 披露胶囊、服务台语气文案（「门店盘点时库存对不上账」）。不会被误认为其它品牌。非 5 分因楼层/列表范式仍属通用 portal 语汇。 |
| 克制 | **5**/5 | 教科书级克制：楼层零语义色像素（computed style 实测）、进度条永远单色品牌蓝、反馈类型胶囊刻意中性、`BRD 助手`明确「不为了显得有用硬提建议」并代码级保证「任一时刻只有一条待改建议」。 |

**总分：20 / 25**
**结论：需修正**（责任维度 ≥3 全过，但 Anti-Slop P0 未清零 → 不通过）

---

## 5. Anti-Slop 检测

**P0（必须修复）**：
- [x] **破坏性渲染错误 / 页面白屏** → P0-1（React error #31，`#/demand` 整页崩溃）。**这是唯一 P0。**
- [ ] 紫色/彩虹渐变背景 —— 无
- [ ] 编造统计/虚假证言 —— 无（数据统一标注「示意数据」）
- [ ] 通用 emoji 替代专业图标 —— 无（全用 `@ant-design/icons`）
- [ ] 圆角卡片+左侧彩色边框 AI 套路 —— 无（首页 4px 品牌蓝条是「全页唯一」且带严格论证）
- [ ] 手绘风 SVG 人物 —— 无
- [ ] 文本对比度不达标 —— 无（`#B3B7B9` 2.04:1 明确只做装饰，smoke 有守门断言）
- [ ] 完全无响应式 —— 无（`.dp-floor` 2→1 列、doodle/agent panel 均有断点）

**P1（建议修复）**：
- [x] 数据真相源分裂（Home 静态 vs App state）→ P1-1
- [x] CTA 文案与落点不符 → P1-2
- [ ] Inter 作展示字体 —— 未使用
- [ ] 过多圆角/阴影堆叠 —— 无
- [ ] 4+ 种颜色同屏 —— 无
- [ ] 动画 >0.3s 无降级 —— 无（0.16s/0.14s，且有 reduced-motion）

**P2（可选优化）**：见 P2-1 ~ P2-4；另建议补 hover/focus 已基本齐备（doodle/胶囊/行均有 `:focus-visible`）。

---

## 6. 附录 A —— P0-1 回归断言补充 + 变异自证（Task #15 交付）

> 审查官：严过审 · 日期：2026-09-19
> 交付物：`portal/tests/smoke.cjs` 新增 2 条断言（137 → **139**）+ 变异自证记录。
> **产品代码已 byte-exact 还原**（`DemandNew.jsx` sha256 = `5DE680406B8FA505…`，与实验前一致）；本附录只交付「断言 + 证据」。

### A.1 为什么必须补这条断言

原 137 条断言全绿却漏掉 P0-1，原因有二：
1. 冒烟从未走「填期望完成时间 → 提交」这条路径（`DatePicker` 是受控浮层，旧写法在 jsdom 里点日历不可靠 → 干脆没写）；
2. 6 条 mock 数据的 `expectAt` 全是字符串或 `'无硬性期限'` → 渲染断言永远喂不到 dayjs 对象 → **零覆盖**。

### A.2 新增断言（2 条）

在 `smoke.cjs` 主流程末尾（`win.close()` 前）新增独立探针块：

| 断言名 | 类型 | 判定 |
|--------|------|------|
| `P0-1 填期望完成时间→提交→一级页列表可见该行（零 React 错误）` | **端到端主门** | 独立 jsdom 内联执行 dist → `#/demand/new` → 填必填 → **写 `.ant-picker input` 值 + Enter 设日期** → 提交 → 回 `#/demand`；要求「提交成功 ∧ `.dp-row`>0 ∧ 含新标题 ∧ 零新增 React 错误」 |
| `P0-1 数据层对照：expectAt=字符串时 DemandList 渲染 1 行且零报错` | defense-in-depth | esbuild 单独打包 `DemandList.jsx` → 喂字符串 `expectAt` → 断言行渲染正常（证明渲染器本身没问题） |

**设计要点（回应「必须端到端、不能只点 UI」）**：
- 日期**不点日历浮层**，而是给 `.ant-picker input` 走 `setNativeValue + keydown Enter` —— 这是 antd `DatePicker` 的受控入口，jsdom 下稳定触发 `onChange`（实测 `dateValue=2026-09-20` 可靠生效）；
- **不**用 `getBoundingClientRect/offsetWidth` 当可见性门（jsdom 恒为 0），只看「`.dp-row` 数量 + 标题文本 + `console.error` 数」；
- 独立起 jsdom（不复用主 ctx）→ 隔离性最好、可重复性最高。

### A.3 变异自证（红/绿双向，含一次重要纠偏）

| 步骤 | 变更 | 断言结果 | 结论 |
|------|------|---------|------|
| ① 基线（未修 bug） | 原样 | **RED** `submitted=true … rows=0 newReactErrors=2 \| React error #31` | 断言抓到真缺陷 ✓ |
| ② 试修（**错误位置**：改 `:560` onChange 为 format） | 源+rebuild | **RED（换因）** `submitted=false … t.year is not a function` | ⚠️ 暴露新的隐性崩溃 |
| ③ 正修（**正确位置**：改 `:351` 提交处 format，`onChange` 还原） | 源+rebuild | **GREEN** 139/139，exit 0 | 修复生效 ✓ |
| ④ 变异（把 `:351` 改回 `v.expectAt \|\| undefined`） | 源+rebuild | **RED**（仅 P0-1 翻红）`rows=0 newReactErrors=2` | 断言非空转 ✓ |
| ⑤ 还原正修 | 源+rebuild | **GREEN** 139/139，exit 0 | 可复现 ✓ |
| ⑥ 交付态（产品代码 byte-exact 还原 + rebuild） | — | **139 条，138 过 / 1 失败（= P0-1 门，因 bug 未修故正确地红），exit 1** | 与基线一致 ✓ |

### A.4 ★ 重要纠偏：P0-1 的修复位置不是 `:560`，而是 `:351`

⚠️ **本条比断言本身更值钱，请务必转给修复方（prototype-builder）。**

原报告 §2 P0-1 的修法建议写的是「`:560` 的 `onChange` 加 `format`」—— **经实跑证明这是错的**：

- 把 `:560` 改成 `set({ expectAt: d.format('YYYY-MM-DD') })` 后，草稿里存的变成**字符串**；
- 但 `DatePicker value={v.expectAt || null}`（`:555`）期望的是 **dayjs 对象** → antd 内部对该字符串调 `.year()` → **`TypeError: t.year is not a function`** → 表单子树崩 → 提交按钮都点不到（`submitBtn=false`）。
- 即：改 `:560` 只是「把白屏从列表页挪到了表单页」，是隐性回归。

**正确修法：保留 `onChange` 存 dayjs（供 DatePicker 回填），只在「提交组行数据」处转字符串**：

```js
// DemandNew.jsx:560  —— 保持不变（draft 存 dayjs 对象，DatePicker value 需要它）
onChange={(d) => set({ expectAt: d })}

// DemandNew.jsx:351  —— 真正该改的地方：写进行数据前 format 成字符串
expectAt: v.expectAt ? (v.expectAt.format ? v.expectAt.format('YYYY-MM-DD') : v.expectAt) : undefined,
```

（`v.expectAt.format` 三重判空是为了兼容 `'无硬性期限'`/字符串等历史形状。）

防御性建议（非必须）：`DemandList.jsx:205` 的行渲染可加 `typeof r.expectAt === 'string'` 守卫，作为**下游兜底**；但**回归门以端到端行为为准**——若把「DemandList 必须容忍 dayjs 对象」写成硬断言，一旦上游已按正法修好、下游不兜底，这条就会变成**永远红的假门**，反而有害（这也是我没有采纳「dayjs 直测渲染器」方案的原因）。

### A.5 证据文件

| 文件 | 内容 |
|------|------|
| `portal/tests/_run-baseline-utf8.txt` | ① 基线：139 条，`FAIL P0-1 … React error #31` |
| `outputs/_diag-fixed.txt` | ② 错误试修：`t.year is not a function`，`submitBtn=false` |
| `portal/tests/_run-fixed2-utf8.txt` | ③ 正修：139/139 全绿，exit 0（`rows=7 hasNew=true newErr=0`） |
| `portal/tests/_run-mut-utf8.txt` | ④ 变异：`FAIL P0-1 … rows=0 newReactErrors=2` |
| `portal/tests/_run-restored-utf8.txt` | ⑥ 交付态：139 条，138 过 / 1 失败 |
| `portal/tests/_sha-restore.txt` | 产品代码 byte-exact 还原校验（sha 一致） |


---

## 6. 一句话总评

**设计判断与克制是全院最高水准（哲学 5 / 克制 5），但「表单提交带日期的需求」这条最核心的用户路径会在 `#/demand` 造成整页白屏，且 137 条断言无一覆盖 —— 修掉 `DemandNew.jsx:560` 那一行（`d.format('YYYY-MM-DD')`）再补一条「填日期→提交→列表可见」的断言，v0.3 即可放行。**

---

## 附：本次审计实跑证据文件

| 文件 | 内容 |
|------|------|
| `outputs/_audit-build-exit.txt` | `EXIT=0`（vite build 通过） |
| `outputs/_audit-smoke.txt` | 137 项断言，通过 137，失败 0 |
| `outputs/_audit-floor.txt` | 楼层 5 格实算 + 与规范数字对照 |
| `outputs/_audit-submit2.txt` | **P0-1 复现证据**（提交带日期 → `#/demand` body 空 / 0 行 / React error #31） |
| `outputs/_audit-urls.txt` | dist 无外部 URL（file:// 安全） |
