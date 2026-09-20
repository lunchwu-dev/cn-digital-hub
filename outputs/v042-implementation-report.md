# v0.4.2 实现报告：删主标签 + 拆双轨成熟度 + 加点赞

- **任务板**：#31（实现）/ #33（数据层）/ #6（测试与回归）
- **基线 commit**：`36347c2`（v0.4.1），工作树干净
- **规范文档**：`outputs/v042-design-tokens.md`（§0–§8，全文已读）
- **主理人修正**：3 条（图标纪律 / 变异 find 重定 / 陈旧归因删除），全部照做，见 §6
- **交付状态**：构建 ✓ / smoke 174 全绿 ✓ / mutation 12 个全真红 ✓ / shots 断言 1–4 ✓ / `file://` 四项 ✓ / **未 commit**（按要求）

---

## 1. 用户指令（唯一权威来源）

> 个人主页上的主标签，不需要了，只需要技能标签就好。简单说，
> 1. 个人主页三个模块：头像+个人信息，技能标签，近期知识贡献
> 2. 再次强调员工技能标签，**仅来自于系统客观数据抽取 以及 公司人才盘点系统结果**
> 3. 技能标签里面，不需要「持续关注」和「公开贡献」这个板块，**每个技能标签多一个点赞的功能**，可以用来让浏览该主页的同事，认可这个同事的某个标签

三条需求 → 三重改造：**① 主标签概念整体退场 ② 成熟度从「自评轨 + 证据轨」双轨拆为「系统轨」单轨 ③ 每个技能标签新增点赞**。

---

## 2. 改动文件与行（最终态）

### 2.1 数据层 `portal/src/data/mock.js`

| 位置 | 改动 |
|---|---|
| 删导出 `SELF_RATINGS` / `primaryTags` | 自评轨（self-rating）与主标签概念的数据源整体删除 |
| 删局部 `primaries` / `tags[i].selfRating` / `tags[i].primary` 字段 | 字段契约移除（门⑥校验） |
| `personTags[...]`（`:1040`）| 所有值改写为 `true`（**保留 key 结构**，仅值语义化） |
| **新增** `ALIAS_TO_TAG`（`:952`）| 词表→tagId 别名映射表 |
| **新增** `resolveTagId(word)`（`:964`）| 单词解析：别名/标签名 → tagId，无法解析返回 `null` |
| **新增** `resolveTagIds(words)`（`:973`）| 多词解析（去重、丢弃无法解析词）；`collectEvidence` 改为复用本函数（单一真源） |
| **新增** `baseLikesOf(personId, tagId)`（`:1300`）| **FNV-1a 32 位散列 → `h % 2`**，值域 `{0,1}`；函数体内 **无 `Math.random()`**（门⑨） |
| `getPersonProfile`（`:1317`）| 每条 tag 新增 `likes: baseLikesOf(key, id)` |
| `TIER_ORDER`（`:1384`）+ `tierRank` + `orderOf` | 排序双口径一致：**组序 → tierRank 降序 → 词表索引升序**（数据层与 UI 层同键） |
| R1 修复 | `'设备'` 补进 `d-esl` aliases（词表解析覆盖面） |

**实测回填数字（esbuild 探针实测）**：personTags 共 **79 实例**；基线点赞 **0 赞 37 / 1 赞 42**；周敏 likes 合计 **2**（`c-visual=1`, `d-docs=1`）；沈知微 likes 合计 **7**；周敏 none 档 **8**；沈知微 none 档 **8**；org 无法解析词落 **NONE**。

### 2.2 图标注册表 `portal/src/components/icons.jsx`

- 头注：加「**只登记 Outlined 系列，不得登记 Filled 面版图标**」纪律。
- `LikeOutlined` 加入 `import` 与 `ICONS` 注册表（**不用 `LikeFilled`** —— 主理人修正 1）。

### 2.3 组件层 `portal/src/components/ui.jsx`

| 位置 | 改动 |
|---|---|
| import | 新增 `TAG_DICT`（from mock）、`ICONS`（from ./icons） |
| 删除 | `SELF_RATING_COPY` / `SELF_RATING_ORDER` / `EVIDENCE_COPY` / `EVIDENCE_ORDER` / `PRIMARY_GLYPH` / `MaturityAxis` |
| **新增** `TIER_COPY`（`:329`）| 4 档文案：`暂无系统记录` / `有初步记录` / `有稳定记录` / `有沉淀与影响` |
| **新增** `SystemTier`（`:349`）| 4 段等分胶囊条（25/50/75/100%）；`tier`/`count`/`showCopy`；`none` 档 4 空槽 + `c.text3` 文案 |
| **新增** `TagLike`（`:428`）| 原生 `<button type="button">` + `aria-pressed` + `aria-label`；`onClick` 内 `e.stopPropagation(); setLiked((v)=>!v);`；`onKeyDown` 只 `e.stopPropagation()`（不自行 toggle，避免与父卡 keydown 双触发）；hover 态；计数 `<span className="dp-num" aria-hidden="true">{count}</span>` |
| `TagChip`（`:501`）| 删 `primary` prop / 分支 / `◈` 前缀；selected 分支去 `{PRIMARY_GLYPH} ` |
| `TagMatrix`（`:695`）| 删 `ratingRank`；`orderOf = TAG_DICT.findIndex`；空态 desc 改；tagCard 标签名行加 `TagLike`；档位条改 `SystemTier`；PanelHead extra 改「近 12 月记录 N 条」 |

**点赞可交互实现要点**（规范 §4）：
- **未点赞**：`fg = c.text3`，底透明。
- **已点赞**：`fg = c.brand` **且** `bg = c.brandSubtle` 胶囊底（**只用色/底区分，不换实心图标** —— 主理人修正 1）。
- 值域 `count = baseLikes + (liked ? 1 : 0)`，`baseLikes ∈ {0,1}` → 屏幕计数 ∈ `{0,1,2}`。

### 2.4 页面层

- `pages/PersonProfile.jsx`：删 `Typography`/`SectionTitle`/`MaturityAxis` import 与 `Text`；文件头注释改（v0.4.2 三模块 + 点赞纪律）；hero **单列化**（删 `.dp-person-head-row`/`.dp-person-head-tags`，`.dp-person-head-main` flex 收为 `'0 1 auto'`）；删 `primaries`；404 文案 / 合规脚注 / 贡献空态改。**`.dp-g-profile` 两栏栅格（1.85fr : 1fr）冻结不动**（几何门 1d 依赖）。
- `pages/Workspace.jsx`：import 加 `TAG_BY_ID`/`resolveTagIds`/`TagChip`；表头 `'专长 / 关注'` → `'技能标签'`；内容改 `resolveTagIds(tags).map(id => <TagChip .../>)`；placeholder 改「技能标签」。
- `pages/Org.jsx`（`:19`）：副标题改「按姓名、团队或技能标签找到对接人」。
- `pages/TagBrowse.jsx`：`emptyCopy` 空组 desc、`:245` 未选空态 desc（加「标签来自系统数据抽取与人才盘点」）、`:302-304` 脚注改。**不显示点赞**（R7 满足：反查页只用 `TagChip`，无 `TagLike`/`likes`）。
- `global.css`：`.dp-like:focus-visible` 加入焦点环规则组；删死 CSS `.dp-person-head-row`/`.dp-person-head-tags`；头注更新。

### 2.5 测试层

- `tests/smoke.cjs`：见 §4.1。
- `tests/mutation.cjs`：TARGETS 重算 + 新增 M10/M11/M12，见 §4.2。

---

## 3. `file://` 四项实测（dist 硬约束）

对 `portal/dist/assets/index.js`（IIFE bundle）实测：

| 项 | 结果 |
|---|---|
| 无 `type="module"` | ✓ 0 命中 |
| 无 `crossorigin` | ✓ 0 命中 |
| 无 importmap | ✓ 0 命中 |
| IIFE 格式 | ✓ 以 `(function(){...})()` 包裹 |
| 零外部请求（`fetch`/`XMLHttpRequest`）| ✓ 均为 `false` |

> 注：bundle 内 8 处 `Math.random` 全部来自 React / antd / rc-* 库内部，**非本代码**；本代码的点赞基线用 FNV-1a（门⑨ 已断言 `baseLikesOf` 确定性且无 `Math.random`）。

---

## 4. 测试与回归

### 4.1 smoke（jsdom）— **全绿：合计 174 项断言，通过 174，失败 0**

新增/改造的 **12 条 v0.4.2 实测门**（全部 PASS）：

| # | 门 | 断言 | 实测证据 |
|---|---|---|---|
| ① | 主标签 0 命中 | 「主标签」屏上 0 次 | `PASS v0.4.2 门①「主标签」字样屏上 0 次` |
| ② | 顶级 Panel 恰 3 个 | `.dp-shell` 内排除 `.dp-grid--tight` 内标签卡与被嵌套卡 = 3 | `PASS 门② 模块级 Panel 恰 3 个` |
| ③ | 系统档位条已渲染、无点阵 | 每标签卡 4 段等分胶囊；点阵 0 命中 | `PASS 系统档位条已渲染 [32 段 / 8 卡]` |
| ④ | 单一档位门 | 周敏「暂无系统记录」屏上 = 8（全 none，无 +1）；旧文案 0 | `PASS 单一档位门 [none=8]` |
| ⑤ | 字段契约 | `tags[i]` 不含 `selfRating`/`primary`；导出契约 | `PASS 字段契约 [已扫 10 人]` |
| ⑥ | 死代码清除门 | `PRIMARY_GLYPH`/`SELF_RATING_COPY`/`SELF_RATING_ORDER`/`MaturityAxis`/`if(primary)` 均 0；死 CSS 0；新组件就位 | `PASS ↳ v0.4.2 死代码清除 …` |
| ⑦ | 点赞点击 +1 且未跳转 | `aria-pressed` false→true、计数 +1、hash 未变 | `PASS 门⑦ [0→1 hash=#/workspace/people/min.zhou]` |
| ⑧ | 点赞键盘可达 | a) 原生 `<button type="button">` b) 可 focus c) Enter keydown 不误跳 d) click 翻转 aria-pressed | `PASS 门⑧a…`（a–d 全 PASS） |
| ⑨ | 点赞基线确定性 | `baseLikesOf` 可复现、无 `Math.random` | `PASS [c-visual=1 c-spec=0]` |
| ⑩ | 组织速查表头 | 「技能标签」有、「专长」无 | `PASS 门⑩` |
| ⑪ | 来源口径上屏 | 含「系统数据抽取」+「人才盘点」 | `PASS 门⑪` |
| ⑫ | 栅格未污染 | `.dp-g-profile` 1.85fr/1fr 规则级文本门仍在 | `PASS`（样式表规则级；真实几何由 shots 断言 1d 覆盖） |

**门⑧ 的诚实说明**：jsdom 30.0.1 的 native `<button>` + Enter keydown **不会**自动合成 click（实测 clicks=0）。故门⑧不假装「Enter→翻转」，而断言「键盘可达」的**可观测充分条件**（原生 button + 可 focus + keydown 不误跳 + click 响应）。

### 4.2 mutation（变异自证）— **变异 12 个，自证通过 12，未通过 0；EXIT=0**

收尾：`✅ 全部目标文件 sha256 = 基线，工作树洁净。`

| 变异 | 目标门 | 结果 |
|---|---|---|
| M1–M6 | v0.3 demand / BRD（既有） | PASS（各 173/174） |
| M7 | v0.4.1 TagMatrix 分组渲染口径 | PASS（170/174，4 红） |
| M8 | v0.4.1 TagMatrix 分组渲染口径 | PASS（172/174，2 红） |
| M9 | v0.4.1 `.dp-g-profile` 栅格 | PASS（173/174） |
| **M10** | v0.4.2 点赞基线确定性 | PASS（171/174，3 红） |
| **M11** | v0.4.2 门⑦ 点赞点击 | PASS（168/174，6 红） |
| **M12** | v0.4.1 TagMatrix 分组渲染口径 | PASS（171/174，3 红） |

**`find` 串各恰命中 1 次**（脚本 `_v042_findcount.cjs` 实测，`ALL_FIND_UNIQUE=1`）：

```
OK  [src/data/mock.js]            M10  find 命中 1 次
OK  [src/components/ui.jsx]       M11  find 命中 1 次
OK  [src/data/mock.js]            M12  find 命中 1 次
OK  ... M1–M9                    各 find 命中 1 次
```

**TARGETS sha256 已重算并同步**（`--print-sha` 输出，7 个目标文件）：
`Workspace.jsx F449B1E5…B0431` / `DemandNew.jsx 135AB61F…F8A5` / `mock.js 24603D09…E4406` / `global.css 655DA927…1AF03` / `ScaleChips.jsx B63C695F…ECF1` / `BrdAssistantCard.jsx CFDCEBC8…C2E6` / `ui.jsx B7C9B0D2…2997`。

### 4.3 shots（真实 Chrome + CDP）— **断言 1–4 全部通过（EXIT=0）**

```
[哨兵] 页面已渲染：.dp-topbar ✓ / .dp-shell ✓ / innerText=1939 字符 / DOM 节点=612
[OK] 断言1–4 全部通过（含 #/demand/new 表单顺序真实几何门 900/1280/375；
     v0.4.1 个人主页 .dp-g-profile 两栏宽比≈1.85 + ≤900 单列真实几何门 1440/768；
     无空数据 / 无溢出 / 顶栏高恒等且单调 / 内容不超宽 / navText 上区间且 ≥1164 可见）
EXIT=0
```

**几何门 1d（个人主页两栏栅格，本轮关键 —— 证明 hero 单列化未污染模块栅格）**：

| 截图 | 视口 | 主列 | 辅列 | 宽比 | 判定 |
|---|---|---|---|---|---|
| `18-person-1440` | 1440×1500 | w=774 left=112 | w=418 left=910 | **1.852** | ✓ 落在 [1.70, 2.05]，两列 left 不同 |
| `19-person-768` | 768×1700 | w=736 left=16 | w=736 left=16 | 1.000 | ✓ ≤900 塌缩单列，两列 left 相同、上下列排 |

- 断言 1（连续溢出）：110 格路由抽点 + 1546×2 档连续扫描，**无溢出**。
- 断言 2（顶栏高恒等且单调）：`≥768` 恒为 61px；`375–422` 折行段 99px。
- 断言 3（内容不变式）：tier 锚点余量 @768=310 / @1164=93 / @1312=61 / @1920=61，均 ≥16。
- 断言 4（navText 上区间）：`1164–1920` 均 ✓，无 ✓→✗ 抖动。
- 1c（`#/demand/new` 表单顺序）：900 单列（left 全 16，top 递增）、1280 双栏（form left=32 ≠ 右栏 768）、375 窄屏单列，全部符合。

---

## 5. 与规范不一致的处置

| 规范 | 主理人修正 | 处置 |
|---|---|---|
| §4.3 用 `LikeFilled` | **修正 1**：项目图标纪律 = Outlined 线性系列，只用 `LikeOutlined`；已点赞靠 `c.brand` 色 + `c.brandSubtle` 底区分 | **照主理人改**，不引入 `LikeFilled` / 新图标库 |
| 变异 `find` 串沿用旧文本 | **修正 2**：M10/M11 改造前 0 命中，须落地后重定并核验恰命中 1 次 | **照主理人改**，find 重定并用脚本核验 `ALL_FIND_UNIQUE=1` |
| `smoke.cjs:1888` 旧归因 | **修正 3**：整块删除吹牛/收轨分档门 | **照主理人改**，新写单一档位门（可自证） |
| 规范主体 §1/§3/§4/§5 | — | 照做 |

**注意**：规范中未明确、由实现自行裁决的点：
1. `.dp-person-head-main` flex 本应通栏，hero 单列化后收为 `'0 1 auto'`（避免头像信息块横向拉伸）。
2. `TagLike` 的 `onKeyDown` **只阻断冒泡、不 toggle** —— 若自行 toggle，一次 Enter 会被原生 button 的 click + 手动 toggle 双触发，导致计数 +2。这是规范 §4.6 条文 2 的实现要求。
3. 门⑧ 因 jsdom 限制改为「键盘可达充分条件」断言（见 §4.1）。

---

## 6. 构建

- `vite build` 成功：**3061 modules**，exit 0。
- dist 产物：`portal/dist/assets/index.js`（IIFE）、`portal/dist/assets/style.css`。

---

## 7. 未 commit

按要求 **不 commit**。工作树：11 个 `M` + 1 个 `??`（`outputs/v042-design-tokens.md`，设计系统专家产出）。HEAD 仍为 `36347c2`。

### 附：本轮诊断/证据脚本（outputs/，均为换新文件名，未覆盖）

`_v042_findcount.cjs`（find 命中计数）、`_v042_mutation2.txt`（变异自证全量日志）、`_v042_smoke4.txt`（smoke 全绿日志）、`_v042_shots*.txt`（shots 日志）、`_v042_printsha.txt`（TARGETS sha）。
