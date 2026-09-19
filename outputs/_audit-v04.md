# v0.4 独立审计报告 · 统一 Digital 标签体系 + 员工个人主页

> 质量审查官：严过审（Yan）· 第二分身 critique-reviewer-2
> 审计对象：工作区 `C:\Users\uuzz\WorkBuddy\2026-09-17-21-20-34` 中「统一 Digital 标签体系 + 员工个人主页」这条线
> 基准：自行复算 + 自行实跑，**不采信任何自述**（含 `p4-critique-report.md` 的 22/25 与交付说明的声明）
> 审计日（复算基准）：沿用代码固定常量 `EVIDENCE_AS_OF = 2026-09-17`
> 报告落盘：`outputs/_audit-v04.md`（gitignore，不污染提交）

---

## 0. 结论前置（TL;DR）

- **这条线现在不能独立作为可交付版本 v0.4。**
- 核心机制（双轴成熟度 / 实证解算 / 词表三态 / 入口 / 回归护栏）**实现质量高、真实可跑**：**构建 exit 0；冒烟 137/137 通过、exit 0**；`dist` 与交付目录 **5 文件 SHA256 全一致**；4 张新截图均为合法 PNG。
- 但存在 **1 个用户可见的旗舰场景落空（P0）+ 若干规范/文档 vs 代码落差**，使「标签体系」作为一个**产品**看不成立：
  1. **P0 — 规格的旗舰用例「谁懂 RAG」指向一个 0 人的空组。** 整个「AI 与智能」领域组（6 个 active 标签）**没有任何人被标注**，`peopleWithTag('d-rag') = []`。反查页选中 RAG/Agent/向量检索 → 恒「没有匹配的人」。全 69 个 active 标签里 **20 个（29%）无人**。个人页的旗舰演示样本 `min.zhou` **全部 8 个标签实证=0**，整页是「暂无实证 · 仅自评」→ demo 读作「系统没数据」。
  2. **P1 — 能力类型轴在结构上永远无法获得实证。** `mapToTags()` 只把证据映射到 `axis==='domain'`（`mock.js:1154`），因此**能力轴每个标签的实证恒为 `none`**。规范 D.3 承诺的「双轴成熟度条」在能力轴上是**恒定空轨**——用户永远看到「暂无实证」，与「吹牛态」在视觉上无法区分。
  3. **P1 —「72 词」三处对不上。** 文档/README 说 72，设计规范 mock 说 78，运行页面显示 **69**（`TagBrowse.jsx:106` 只数 active）。交付说明标题「72 词统一标签体系」与页面「共 69 个标签」并置时自相矛盾。
  4. **P1 — 交付说明的归属/新增清单与实际不符。** `README §H` 把 `portal/src/pages/Org.jsx` 列为「本次新增」的文件，但该文件自己的注释写明「02b §A 导航 5→7 项后新增的一级页」——属 **v0.2 站点重构线**，非本线产物。
- **未完成事项统计：P0 = 1，P1 = 5，P2 = 6。**

---

## 1. 证据收集（实跑原文）

### 1.1 构建

命令（cwd=`portal`）：`node node_modules/vite/bin/vite.js build`

```
vite v5.4.21 building for production...
✓ 3061 modules transformed.
dist/index.html                     0.41 kB │ gzip:   0.28 kB
dist/assets/roboto-mono-latin.woff2 32.80 kB
dist/assets/roboto-latin.woff2      43.14 kB
dist/assets/style.css               13.99 kB │ gzip:   3.87 kB
dist/assets/index.js             1,334.06 kB │ gzip: 429.34 kB   ← vite 报告值（kB=1000）
✓ built in 8.79s
exit=0
```

> 说明：vite 报告的 `1,334.06 kB` 与磁盘上 `dist/assets/index.js` 实测 **1,363,308 B** 不同源（vite 报告的是压缩后参与 gzip 的字节口径）。**以磁盘字节为准，与 README §0/§H 声称的 `1,363,308 B` 一致 ✅。**

### 1.2 冒烟

命令（cwd=`portal`，`NODE_PATH` 指向 workspace node_modules）：`node tests/smoke.cjs`

```
合计 137 项断言，通过 137，失败 0
exit=0
```

**137/137 通过，确认。** 其中本线相关断言全部 PASS（原文摘录）：

```
PASS  组织速查成员行可点（role=button + tabindex=0）
PASS  点击成员行跳转到个人主页路由   [#/workspace/people/min.zhou]
PASS  个人主页渲染：页头 + 标签矩阵双分区 + 右栏贡献   [7 项命中]
PASS     ↳ 个人主页导航高亮 = 组织速查
PASS  标签矩阵使用 .dp-grid--tight 更紧网格
PASS  标签卡可点（role=button + tabindex=0，跳反查页）   [8 张]
PASS  双轴成熟度：自评圆点阵已渲染   [59 个圆点元素]
PASS  近期知识贡献含「→ 标签名」联动标注（有实证者）   [3 条带标注]
PASS  个人标签矩阵：legacy(deprecated) 标签带状态样式渲染（非静默丢弃）
PASS  闭环验收：逐标签校验…   [已校验 2 个正档位标签，箭头目标 2 个]
PASS  标签反查页渲染：页头 + 筛选器 + 结果区   [5 项命中]
PASS  反查页含 Segmented 轴切换
PASS  反查页含词选择 chip 组（按域分组分行）   [76 个 chip]
PASS  反查页未选择时显示空态 / 已选条无选择时不占位
PASS  选中标签后出现结果行（键盘可达）   [1 行]
PASS  结果区主动声明「按姓名排序」
PASS  结果行不显示成熟度
PASS  反查页含「已归档标签」可折叠区 / deprecated chip 结构合规 / merged chip 结构合规   [Agent ← 原「Agent框架」]
PASS  全局搜索命中「人员」分组 / 人员结果含 dept · role 描述
PASS  P1-1 吹牛态收敛：除指定样本外无「高自评 + 零实证」标签   [样本外吹牛标签 2 个（吴桐:d-realtime, 吴桐:c-testing）]
PASS  P1-2 parseOwnerName：残缺/空 owner 返回 null（不再返回空串幽灵人）
PASS  P1-3 release 守卫：证据集合只含「已发布」Release 的条目   [已发布 release 证据 4 条，未发布 0 条]
PASS  P1-4 词表含 deprecated + merged 标签 / 状态守卫 legacy 不参与实证   [已校验 1 个 legacy 标签实例]
PASS  零 console.error / 无 React 与 antd 警告
```

> **⚠️ 注意 p4-critique-report.md 已过时**：该报告（18:32 产出）把 P1-2（parseOwnerName 返回空串）、P1-3（release 无 status 守卫）、P1-4（legacy 不可达）列为未修问题。**当前代码三项均已修复**（`mock.js:1115-1124` 返回 null；`mock.js:1227` `if (r.status !== 'released') return;`；`TagBrowse.jsx:44-58` 新增 `ARCHIVED_TAGS` 渲染出口）。p4 报告的 22/25 与 P1 清单**不构成当前代码的评估基础**。

### 1.3 数据复算（esbuild 离线打包 → require，非正则抽取）

```
TAG_DICT.length            = 72     ✅ 与 README「72 条」一致
  byAxis                   = {domain:47, capability:25}
  byStatus                 = {active:69, deprecated:2, merged:1}
  dup ids                  = []      ✅
  R3 同词两轴violations    = []      ✅（互斥闸门成立）
  alias/label collisions   = []      ✅
personTags people count    = 10      ✅ 与 README「10 人」一致
orgPeople count            = 10      ✅
personTags keys vs orgPeople ids：双向零差异  ✅
每人上限：dom≤5 / cap≤4 / total≤9 / prim≤3 —— 10 人全部 ok
ALL_EVIDENCE.length        = 19
  by kind = {bestPractice:3, article:3, projectUpdate:4, announcement:5, release:4}
  null personName count    = 0
  ghost（不在 orgPeople）= []（周立被 release 守卫剔除，未入集合）
releaseNotes total=6, released=4 → 证据里 release 恰好 4 条，未发布 0 条  ✅ 守卫有效
parseOwnerName('')→null / '   '→null / '·'→null / '何嘉 ·'→null / null→null  ✅
parseOwnerName('组·姓·名')→'名' / 'A · B · C'→'C'（取末段，见 P1-4）
```

**逐人档位复算（12 个「实证档 ≥1」的标签实例，非 p4 声称的 13）：**

| 人 | 标签 | tier | score | 证据来源 |
|---|---|---|---|---|
| 陈思远 | d-member | emerging | 2 | 公告 an-002 (会员) |
| 陈思远 | d-miniapp | emerging | 1 | Release v2.8.0 |
| 林望 | d-pos | emerging | 1 | Release v3.2.1 |
| 林望 | d-store | established | 5 | bestPractice(门店)3 + 公告(门店)2 |
| 刘倩 | d-ecommerce | established | 3 | projectUpdate(电商)2 + release(线上商城)1 |
| 刘倩 | d-promo | established | 3 | bestPractice(交易)3 |
| 沈知微 | d-dataplatform | **authoritative** | 7 | bp(数据)3 + proj(数据)2 + 公告(数据)2 |
| 何嘉 | d-sso | established | 3 | article(平台)3 |
| 郑远 | d-supply | established | 5 | article(供应链)3 + proj(供应链)2 |
| 吴桐 | d-esl | emerging | 1 | Release v0.9.4 |
| 吴桐 | d-store | emerging | 2 | projectUpdate(门店)2 |
| 顾一鸣 | d-security | emerging | 2 | 公告 an-005 (安全) |

```
闭环（D.5）全 10 人独立复现：closure fails = []      ✅
非 active 标签 recentScore!=0：[]                     ✅（P1-4 守卫成立）
capability 轴 score>0 的实例 = 0（设计使然，见 P1-1）
历史（超窗）贡献：全库 0 条 → 「历史贡献 N 条」召回行从未被渲染（dead 分支）
selfRating 实际取值 = {advocating, practicing, following} → 最低档「curious」从未被使用
```

### 1.4 交付一致性

```
dist vs outputs/delivery-person-profile/ —— 5 文件 SHA256 逐个比对：
  index.html       match=True
  assets/index.js  match=True（1,363,308 B）
  assets/style.css match=True
  roboto-latin.woff2 / roboto-mono-latin.woff2  match=True   ✅
4 张新截图：均为合法 PNG（magic 89 50 4E 47），18/19/20/21 全部存在
```

### 1.5 标签覆盖率复算（关键负面证据）

```
active 标签 69 个，其中「有 ≥1 人」= 49，无人 = 20（29%）
【AI 与智能】组：0/6 有人员   ← 规格旗舰场景「谁懂 RAG」整组落空
【业务系统域】13/14  【数据域】5/8  【平台与基础设施】6/9  【组织与流程域】6/8
【工程技术】6/8 【产品与设计】6/6 【数据与分析】4/5 【项目管理与协作】3/5

peopleWithTag：d-rag=[]、d-ai=[]、d-agent=[]、d-vector=[]、d-prompt=[]、d-llm-eval=[] 全为空
无人的 active 标签（20 个）：
  AI 与智能 / RAG / Agent / 向量检索 / 提示词工程 / 模型评测
  迪卡侬 App / 经营看板 / A/B 实验平台 / 数据质量 / API 网关 / 云原生 / 配置与发布
  新人上手 / 研发流程 / 前端工程 / 代码评审 / 算法与建模 / 里程碑管理 / 带人与分享
```

---

## 2. 逐项验收表

> 基准来源：设计规范 `p2-design-system.md` + 需求 `p1-requirements.md` + 交付说明 `README-交付说明.md` 中**声称完成**的项，逐条对代码/运行结果核验。

| # | 声称（出处） | 判定 | 证据 |
|---|---|---|---|
| 1 | 新增 2 页面 `#/workspace/people/:id`、`#/workspace/tags`（README A） | **已验证** | `App.jsx:200-207` 按 sub 分发；截图 18/20 可渲染 |
| 2 | 新增 4 组件 `MaturityAxis`/`TagChip`/`TagMatrix`/`TagArrow` 入 ui.jsx | **已验证** | `ui.jsx:356/567/802/950` |
| 3 | `TAG_DICT` = 72 条（README A/§H） | **已验证** | 复算 = 72 |
| 4 | `personTags` = 10 人（README A） | **已验证** | 复算 = 10，且与 orgPeople 双向零差异 |
| 5 | 新增 5 个 token（p2 §A.3/§G.1） | **已验证** | `theme.js:72-76` 恰为 `brandStep1/2/3`+`cardHeadBg`+`dashedBorder`，色值与规范逐一相同 |
| 6 | `personId(email)` 为唯一事实来源、不加 id 字段 | **已验证** | `mock.js:947`；路由/搜索/反查/组织表共用 |
| 7 | 词表三态 `active/deprecated/merged`，不扩展（G.1） | **已验证** | 复算 byStatus = {69,2,1}，无第四态 |
| 8 | R3 互斥闸门：同词不入两轴 | **已验证** | 复算 violations = []；alias collisions = [] |
| 9 | `parseOwnerName` 空/全空白/残缺分隔符 → null | **已验证** | 复算 5 类输入全 null（p4 的旧 bug 已修） |
| 10 | 幽灵贡献者周立不入任何个人页 | **已验证** | ghost = []；且被 release 守卫提前剔除；`getPersonProfile('zhou.li')` 早退 null |
| 11 | Release 守卫只统计 `status==='released'` | **已验证** | `mock.js:1227`；复算 release 证据 4 条=released 数 |
| 12 | 非 active 标签实证恒 0（P1-4 代码守卫） | **已验证** | `mock.js:1291-1306`；复算 violations=[] |
| 13 | 闭环 D.5 硬约束（任标签档≥1 ⇒ 贡献列表有该标签箭头） | **已验证** | 全 10 人复算 closure fails=[] |
| 14 | 反查页按姓名排序、不按实证度；结果行不显示成熟度 | **已验证** | `TagBrowse.jsx:96/221`；冒烟对应项 PASS；截图 20 无档位文案 |
| 15 | 两轴不合成一个分数；4 等分不按比例 | **已验证** | `ui.jsx:436-446` `flex:'1 1 0'`；`recentScore` 从不进渲染 |
| 16 | 实证 4 档=品牌蓝单色阶、无红黄绿 | **已验证** | `ui.jsx:385`；截图 18 无红黄绿 |
| 17 | 吹牛态：不隐藏不降权，点阵不灰化 | **已验证** | `ui.jsx:374/388-408`；截图 18 点阵正常着色 |
| 18 | 组织速查行可点 → 个人主页（入口 1） | **已验证** | `Workspace.jsx:301-312`；冒烟 PASS；截图可跳 |
| 19 | 全局搜索新增「人员」分组且排最前（入口 2） | **已验证** | `GlobalSearch.jsx:21-31`；冒烟 PASS |
| 20 | 导航高亮解耦：people/tags → 组织速查 | **已验证** | `router.js:34-35` + `App.jsx:117`；冒烟 PASS |
| 21 | 不新增一级导航（保持 7 项） | **已验证** | `router.js:8-16` 7 项；冒烟「一级导航仍 7 项」PASS |
| 22 | ≥900 双栏 / ≤900 单列降级（响应式） | **已验证** | `global.css:458-483`；截图 19（768）单列、21（375）单列 |
| 23 | 单 Panel 内双分区、领域在上能力在下 | **已验证** | `ui.jsx:930-945`；截图 18 可见 |
| 24 | 已归档标签（deprecated+merged）有渲染出口、可审计 | **已验证** | `TagBrowse.jsx:44-58,289-302`；截图 20 折叠区「已归档标签 3」 |
| 25 | 「主标签 ≤3」页头只渲染前 3 | **已验证** | `PersonProfile.jsx:182` `.slice(0,3)`；复算 primary 声明≤3 |
| 26 | `dist` 与交付目录一致（README §I） | **已验证** | 5 文件 SHA256 全 match |
| 27 | 冒烟 137/137（README §I） | **已验证** | 实跑 137/137、exit 0 |
| 28 | 导出可 `file://` 双击打开（无 module/crossorigin） | **部分落实** | 本次未复跑 CDP；静态观察 dist/index.html 引相对路径、IIFE 打包（构建 exit 0）。jsdom eval 无法证明浏览器行为，属**未独立复验**项 |
| 29 | 「近 6 月贡献密度」Sparkline | **部分落实** | 组件在（`PersonProfile.jsx:49-59`），但**全库无超窗数据、min.zhou 全 0** → 实际渲染为一条贴底的平线（截图 18 右侧），读作坏图 |
| 30 | 能力轴双轴成熟度条（p2 §B/C 核心） | **文档说法与代码不符** | 能力轴结构上永远 `tier=none`（见 P0/P1-1），「双轴条」在能力轴恒空 |
| 31 | 「共 N 个标签」页头 | **文档说法与代码不符** | 页面渲染「共 69 个」（`TagBrowse.jsx:99-106` 只数 active），与 README「72 词」矛盾 |
| 32 | README §H：`Org.jsx` 为「本次新增的文件」 | **文档说法与代码不符** | `Org.jsx:1-5` 自证「02b §A 导航 5→7 项后新增」，属 v0.2 线；本线只是让它成为入口 |
| 33 | p4 报告「闭环在 …13 个标签上复现」 | **文档说法与代码不符** | 复算正档位 = **12** 个（非 13）；且冒烟只对**郑远 1 人 2 标签**做逐标签闭环 |
| 34 | 时间衰减两段式「历史贡献 N 条」（D.4） | **未落实（数据侧）** | 全库 19 条证据全部在 12 月窗内，`historicalCount` 恒 0 → 该分支为死代码，未验证 |

---

## 3. 未完成事项清单

### P0 — 阻塞（必须修）

**P0-1 · 规格旗舰场景「谁懂 RAG」落在 0 人空组**
- 位置：`mock.js:808-814`（AI 与智能 6 个 active 标签）+ `mock.js:986-1091`（personTags 无任何 AI 标签）。
- 复现：反查页选中「RAG」→“没有匹配的人”；全局搜「RAG」→命中标签项但点进去 0 人；`peopleWithTag('d-rag')=[]`。
- 影响：需求 §A 明列第一动机是「找专家——谁懂 RAG / 谁做过 SSO 接入」。后者成立（SSO→何嘉/顾一鸣），**前者完全落空**。整个「AI 与智能」域组（8 词、active 6 词）无人，全库 29% 的 active 标签无人。
- 建议修法：给 2–3 位真实感成员补 AI 域标签+对应证据（如给沈知微加 `d-rag`+一条 RAG 相关最佳实践；给陈思远加 `d-agent`）。**注意这会同时激活「能力轴恒空」的另一面**，见 P1-1。

**P0-2 · 个人页旗舰样本 `min.zhou` 全标签实证=0，整页读作「系统无数据」**
- 位置：`mock.js:987-997`（周敏 8 标签，贡献数 0）；截图 18。
- 复现：打开 `#/workspace/people/min.zhou` → 8 张标签卡全部「暂无实证 · 仅自评」+ 8 行「该标签暂无公开贡献佐证」；页头「近 12 月实证 0 条」。
- 影响：`min.zhou` 是被规范 D.3/C.4 选定的「纯吹牛态示教样本」，但作为**验收截图主角**（README §G 明示 `18-person-1440.png` 用于「验收标签矩阵 + 主标签放大态 MaturityAxis 布局」），呈现的是一个**看似坏掉**的页面。冒烟也正是因为这个原因要跳去 `yuan.zheng` 才能验「→ 标签名」（`smoke.cjs:1266`）。
- 建议修法：验收截图改用有实证者（如沈知微 `zhiwei.shen`：有 authoritative 档 + 3 条贡献）；把 `min.zhou` 保留为**单元断言样本**而非**视觉验收主角**。或给周敏补 1–2 条「设计系统」贡献使其至少出现一个 `emerging`。

### P1 — 用户可感（建议修）

**P1-1 · 能力类型轴结构上永远零实证，「双轴成熟度条」半边恒空**
- 位置：`mock.js:1150-1157` `mapToTags` 内 `if (hit && TAG_BY_ID[hit].axis === 'domain')` —— 证据只映射到领域轴。
- 复现：`capability 轴 score>0 的实例 = 0`（复算）；打开任意人页，**每个能力标签**都是「暂无实证」。
- 影响：规范 p2 §B/§C 的核心卖点是「双轴条并排显示」；但能力轴永远没有第一手证据 → 用户在每个能力标签上看到「暂无实证」，与「吹牛态」虚线空槽**视觉几乎不可区分**（吹牛态只是多一行灰字）。双轴只落实了**领域**那一半。
- 建议修法（二选一，需与规范作者确认口径）：① 让 `bestPractices/announcements` 的 `tags` 也能映射到能力轴（改映射表加能力别名）；或 ② 明确「实证度只适用于领域轴」，并在 UI 上对能力轴**不渲染实证轨**（避免恒空噪音），同时更新规范 D 节。

**P1-2 · 「72 词」三处数字对不上**
- 位置：README 标题「72 词统一标签体系」/ `TAG_DICT`=72 / `p2-design-system.md:533` 页头 mock「共 78 个标签」、`:565`「78 词封顶」/ 运行页 `TagBrowse.jsx:99-106` 渲染「共 69 个标签」。
- 复现：截图 20 页头可见「共 69 个标签」；README 并置写「72 词」。
- 影响：用户/接手者无法判断系统到底几个词。规范 mock 的 78 是**未落地数字**（词表实际做到 72）。
- 建议修法：统一为「**词表 72 条（其中 active 69 / deprecated 2 / merged 1）**」，页头「共 N 个标签」文案改成「共 69 个可用标签」并补一句「另有 3 个已归档」；规范 mock 的 78 改为 72。

**P1-3 · 交付说明「本次新增」清单混入 v0.2 文件**
- 位置：`README §H` 把 `portal/src/pages/Org.jsx` 列为本次新增。
- 证据：`Org.jsx:1-5` 注释自证属「02b §A 导航 5→7」；`git status` 显示 Org.jsx 为未跟踪但内容依赖 v0.2 的 7 项导航；README §F.6 自己也承认「工作区有一批未提交 v0.2 改动…与本次标签体系混在同一工作区」。
- 影响：交接文档的**文件归属失真**，会让下一个开发者以为 Org.jsx 是本线产物。同理 README §H 把 `TopBar.jsx`（v0.2 改 7 项导航）列入「本次修改」。
- 建议修法：§H 拆成「本线新增/修改」与「同工作区的 v0.2 改动（非本线）」两张表，与 §F.6 的 commit 分线建议呼应。

**P1-4 · `parseOwnerName` 对「多分隔符/无可解析人名」不够稳**
- 位置：`mock.js:1115-1124`。
- 复现：`parseOwnerName('组·姓·名')='名'`、`parseOwnerName('A · B · C')='C'`（取末段）；`'组名没有人名'`（无 `·`）原样返回组名，会被当作人名匹配。
- 影响：当前 mock 无此输入（已核实），**不构成线上 bug**，但作为「幽灵人防护器」其健壮性不完整——一旦数据源引入无分隔符的纯组名，会伪造一个不在花名册的 key。（此项 p1 §D.2/README C.3 承诺「绝不产生空串姓名」已满足，但「组名当人名」是同类风险的残留口子。）
- 建议修法：解析后校验「结果 ∈ orgPeople.name 白名单」，否则返回 null；或在 `getPersonProfile` 匹配前先比对白名单（现已在匹配阶段用 `=== person.name` 过滤，故风险被下游兜住——建议在解析器处显式注释这一点）。

**P1-5 · 冒烟「闭环验收」只覆盖 1 人，p4 声称的「全 10 人」未落进回归**
- 位置：`smoke.cjs:1302-1339`（在 `yuan.zheng` 页面上下文执行，`已校验 2 个正档位标签`）。
- 对比：p4 报告声称「闭环在所有 10 人、所有 13 个标签上独立复现成功」，但那是**一次性外部脚本**，**没进 smoke.cjs**。
- 影响：回归护栏只对 1 人做逐标签闭环。若其他 9 人的闭环被破坏（如改证据映射），冒烟不一定变红——**这正是 team-lead 要求的「断言不覆盖而静默出错」的典型**。
- 建议修法：把闭环断言改为对 `Object.keys(personTags)` 全 10 人遍历（数据层即可，不必走 DOM），失败者列出。

### P2 — 洁癖 / 可选优化

- **P2-1 · `d-ai` 标签与其分组同名**：`mock.js:809` 标签 label 与 `group` 都是「AI 与智能」，在反查页同一行出现「AI 与智能（组名）… ◈ AI 与智能（标签）」两次，读作冗余/自指。建议删该词或改名为更具体的对象词。
- **P2-2 · `curious` 自评档从未被使用**：4 级量表最低档无样本，圆点阵「全空」态在 demo 中不可见；D.1「刻意用偶数逼用户取舍」的设计意图未被样本覆盖。建议给 1–2 个标签配 `curious`。
- **P2-3 · 「历史贡献 N 条」为死分支**：全库无超窗证据（最早 2026-08-29，基准 2026-09-17 仅差 19 天），D.4 的两段式衰减**在 demo 中完全不可见**。建议加入至少 1 条 >12 月的历史证据以激活该机制（否则规范 D.4 是空谈）。
- **P2-4 · 页头「近 6 月贡献密度」Sparkline 常为平线**：全 0 数据下渲染贴底直线（截图 18）；建议 0 数据时给「暂无」占位而非一条看起来坏掉的线。
- **P2-5 · merged 角标引号字符**：`ui.jsx:637` 用 `原「旧名」`（U+300C/D），规范 C.4 写 `原『旧名』`（U+300E/F）。字符级偏差（p4 已提，仍未改）。
- **P2-6 · `TagChip` 的 `disabled` 态用 `textDisabled`**：规范已授权（p2 §B.2 论证「禁用态装饰合法」），但当前**无任何调用点传 disabled**，属未使用分支（同 p4 指出的 merged/deprecated 曾不可达——现 deprecated/merged 已可达，disabled 仍不可达）。可接受，仅记录。

---

## 4. 5 维评分

| 维度 | 评分 | 说明 |
|---|---|---|
| **设计哲学** | **4/5** | 双轴正交、不合成、不排名、单色阶、吹牛态透明化——五条核心决策在代码里都能找到对应实现，不是口号；两轴用「◈/◇ + 蓝/灰」双通道区分（色盲友好）是亮点。扣分：能力轴结构上无实证（P1-1），使「双轴」只落实了一半，哲学与数据模型之间有裂缝。 |
| **视觉层次** | **3/5** | 个人页版式（页头通栏 → 左矩阵/右贡献双栏 → 底部免责）层级清楚，反查页「筛选器 → 结果 → 归档」也清楚。扣分：`min.zhou` 中 8 张卡全是「暂无实证」+ 8 行重复灰字提示，**视觉噪音淹没了层次**（应为稀缺标记的「暂无实证」变成满屏常态）；标签矩阵 dp-g3 只排 3 列致右侧大片空白。 |
| **执行质量** | **4/5** | 构建 exit 0、冒烟 137/137、dist≡交付 SHA256 全一致、响应式 900/768/375 三档降级正确、零硬编码色成立、三处历史 P1（parseOwnerName/release守卫/legacy出口）均已修。扣分：闭环回归只覆盖 1 人（P1-5）、能力轴恒空（P1-1）、文档数字不一致（P1-2）。 |
| **特异性** | **4/5** | 这套标签语汇（◈/◇/◆ 几何前缀 + 四档蓝阶 + 吹牛态虚线空槽 + 反查页「不排名」声明）在本门户之外认不出来，且零新色相、完全复用品牌资产。扣分：`d-ai` 与分组同名等模型瑕疵稀释了词表专业性。 |
| **克制** | **3/5** | 无紫渐变、无 emoji 图标、无插画、无排行榜、无分数暴露；空态自建不用 `Result`。但**「暂无实证」标记被系统性过度使用**——因为旗舰样本全 0 且能力轴恒 0，一个本该稀缺的诚实标记变成了大面积常态灰噪（P0-2 + P1-1），是本次最主要的克制失分。 |

**总分：18/25**（每维均 ≥3，按框架**形式上通过**）
**门控：P0 = 1（≥1 → 阻断交付），P1 = 5，P2 = 6 → 按框架属「须修正」。**

**一句话总评：** 机制扎实、护栏到位、执行精度高（137/137 + SHA 全一致），但**旗舰场景（谁懂 RAG / 个人页样板）在数据层是空的**，能力轴又结构性拿不到实证——它现在是一个「引擎造好了但油箱是空的」的标签体系，工程可交付、产品不可演示。

---

## 5. 明确回答：能否独立作为可交付版本 v0.4？

**不能。**

理由（按优先级）：
1. **旗舰用例落空（P0-1 + P0-2）**：需求 §A 第一动机「找专家：谁懂 RAG」在数据上恒 0 结果；个人页验收主截图是一个「8 标签全无实证」的页面。任何一个真实用户按规格给出的第一条使用路径（搜 RAG → 反查 → 看人）都会走到空态。**这不是 polish 问题，是 demo 讲不圆。**
2. **双轴只落实一半（P1-1）**：规范核心卖点「双轴成熟度条」在能力轴上恒空，与吹牛态视觉难分。
3. **文档自相矛盾（P1-2 + P1-3）**：「72 vs 69 vs 78」三套数字、Org.jsx 归属失真——作为「交接文档」它会把下一个开发者带偏。

**要独立成为 v0.4，至少需要：**
- **必修（P0）**：给 AI 域补 2–3 位带证据的真实感成员（激活「谁懂 RAG」）；验收截图主角换成有实证者（沈知微/郑远）。
- **建议修（P1）**：收敛「暂无实证」的使用面（能力轴要么能拿证据、要么不渲染实证轨）；统一「72/69/78」为单一口径；§H 文件归属拆表；闭环回归扩到全 10 人。
- **可选（P2）**：`d-ai` 去重名、补 `curious` 样本、补 1 条超窗历史证据激活 D.4。

**附带条件（非本线问题但影响可交付性）**：工作区同时混有 v0.2 站点重构线与本线改动（`git status` 35+ 文件未提交，README §F.6 已预警）。**本线不能单独 commit 而不带上 v0.2 的导航 5→7/新频道改动**——personTags 里的 `people→org` 高亮、7 项导航断言都依赖 v0.2。因此「独立 v0.4」在**版本切分**上也需要 team-lead 的 §14 任务先落地。

---

## 附：复算产物（本报告依据的可复现文件）

- `outputs/_audit-recompute.mjs` / `_audit-recompute.txt`（词表/人/上限/解析器/证据/逐人档位/闭环/守卫）
- `outputs/_audit-recompute2.mjs` / `.txt`（正档位计数、证据→标签映射、history 检查）
- `outputs/_audit-recompute3.mjs` / `.txt`（标签覆盖率、空组清单）
- `outputs/_smoke-utf8.txt`（137 项断言全文，UTF-8）
- `outputs/_build.log` / `_hash-check.txt` / `_dist-sizes.txt` / `_deliv-sizes.txt` / `_git.txt`

*审查人：critique-reviewer-2（严过审第二分身）｜基准日 EVIDENCE_AS_OF = 2026-09-17*
