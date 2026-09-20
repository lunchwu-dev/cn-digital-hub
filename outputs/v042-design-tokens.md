# v0.4.2 设计令牌与信息架构规范

> 设计系统专家：彩格调（Cai）｜阶段：v0.4.2 设计系统阶段（Phase 2）
> 事实来源（本次实读，非转述）：`portal/src/pages/PersonProfile.jsx`、`portal/src/components/ui.jsx`、`portal/src/data/mock.js`、`portal/src/global.css`、`portal/src/pages/Workspace.jsx`、`portal/src/pages/TagBrowse.jsx`、`portal/tests/smoke.cjs`、`portal/tests/mutation.cjs`
> 数据事实（本次独立复算，脚本 `outputs/_v042_probe.cjs` + `outputs/_v042_like_probe.cjs`，输出 `_v042_probe.txt` / `_v042_like_probe.txt`）

---

## 0. 用户指令与本期裁定摘要

**用户原文（唯一权威来源）**：

> 个人主页上的主标签，不需要了，只需要技能标签就好
> 简单说，
> 1. 个人主页三个模块：头像+个人信息，技能标签，近期知识贡献
> 2. 再次强调员工技能标签，仅来自于系统客观数据抽取 以及 公司人才盘点系统结果
> 3. 技能标签 里面，不需要持续关注和 公开贡献这个板块，每个技能标签多一个 点赞的功能，可以用来让浏览该主页的同事，认可这个同事的某个标签

**本期四条裁定（结论前置，前文已给理由）**：

| # | 裁定 | 一句话理由 |
|---|------|-----------|
| **A** | **主标签概念整体退场**——不是「页头不显示主标签」，而是数据层、组件层、组织速查表全部清除「主 / 专长 / 关注」语义 | 用户说「不需要了」，且它与「标签仅来自系统抽取」冲突（主标签是人工挑选的） |
| **B** | **成熟度拆为单轨**——自评轨（点阵 / 兴趣行 / 吹牛态 / 收轨态）**整体删除**，只留系统派生档位 | 「自评」既非「系统客观数据抽取」，也非「人才盘点结果」→ 数据来源上已失去合法性 |
| **C** | **点赞 = 可交互的读侧社交信号**，不是「编辑资料」 | 它不改被浏览者的任何字段，只在「浏览者 session」里记一个「我认可过」——与「只读第三人称视图」不冲突 |
| **D** | **点赞基线计数用 FNV-1a 确定性散列**，绝不用 `Math.random()` | 屏幕级断言必须可复现；本项目已三次栽在「名义覆盖 ≠ 实际覆盖」 |

**一个我明确顶住的点**：用户说「不需要持续关注和公开贡献这个板块」——`持续关注`是自评档文案、`公开贡献`是实证 `none` 档文案，**用户看到的正是这两条文案**。但根因不是文案错了，是**自评轨不该存在**。所以本期不做「换文案」这种表面手术，而是**整条自评轨退场**；实证轨保留但 `none` 档文案必须改写（因为「公开贡献」这个词被用户点名，且与新的来源口径冲突，见 §2/§3）。

---

## 1. 主标签退场规范

### 1.1 页面信息架构：恰好三模块（最终版式）

**模块清单（顺序即上下顺序，不可调）**：

```
┌─ #/workspace/people/:id ────────────────────────────────────────┐
│  Breadcrumb：首页 / 组织速查 / 周敏                    （极轻，12px）│
│                                                                  │
│  ┌─ 模块 1 · 头像 + 个人信息（通栏 Panel）───────────────────┐   │
│  │  ┌────┐  周敏                                            │   │
│  │  │ 周 │  设计系统组 · 设计系统负责人                       │   │
│  │  └────┘  上海 · 总部 · min.zhou@digital                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↑ 单列，无右栏                         │
│  ┌───────────────────────────┐  ┌──────────────────────────┐   │
│  │ 模块 2 · 技能标签（主栏）  │  │ 模块 3 · 近期知识贡献（辅栏）│   │
│  │  ┌─────────────────────┐  │  │ ┌──────────────────────┐ │   │
│  │  │ ▸ 产品与设计    4   │  │  │ │ 最佳实践  2026-08-14 │ │   │
│  │  │  [标签卡][标签卡]   │  │  │ │ 标题…                │ │   │
│  │  │ ▸ 协作与流程    4   │  │  │ │ → 设计系统           │ │   │
│  │  └─────────────────────┘  │  │ └──────────────────────┘ │   │
│  │  合规脚注（12px text3）    │  │  …                       │   │
│  └───────────────────────────┘  └──────────────────────────┘   │
│        1.85fr（宽）                    1fr（窄）                  │
└──────────────────────────────────────────────────────────────────┘
```

| 模块 | 容器 | 尺寸 | 层级 | 上方间距 |
|------|------|------|------|---------|
| **1 头像+个人信息** | 通栏 `Panel.dp-person-head` | padding `24px 28px`；头像 `InitialAvatar size={64} fontSize={23}`；姓名 24px/500/`c.ink`；`部门 · 角色` 14px/`c.text2`；`地点 · 邮箱` 13px/`c.text3` | **最高（hero）** | Breadcrumb 下 `12px` |
| **2 技能标签** | 左栏 `TagMatrix`（宽） | `minmax(0, 1.85fr)` | **主**（用户明确「以技能标签为主」） | 模块 1 下 `20px` |
| **3 近期知识贡献** | 右栏 `Panel`（窄） | `minmax(0, 1fr)` | **辅** | 与模块 2 同排 |

**间距体系**：Breadcrumb→模块1 = `12px`；模块1→模块2/3 = `20px`；两栏间隙 = `24px`（`dp-grid` 的 gap）。**全部沿用既有 token，零新增间距值。**

### 1.2 Hero 单列化后的具体做法

**做法**：删除 hero 内的 `.dp-person-head-row` 包裹层与其右侧主标签块，hero 退化为**单列 flex**：

```
修改前：Panel.dp-person-head
          └ div.dp-person-head-row（flex, flexWrap, gap 24）
               ├ div.dp-person-head-main（头像 + 姓名块）   ← 保留并上提一层
               └ div.dp-person-head-tags（主标签块 ≤2）    ← 整块删除
修改后：Panel.dp-person-head
          └ div.dp-person-head-main（头像 + 姓名块）        ← 直接作为唯一子节点
```

**留白如何收口**：`.dp-person-head-main` 当前是 `flex: '1 1 320px'`（为与右栏分宽而设）。删掉右栏后，**必须把 `flex` 改为 `'0 1 auto'` 或直接去掉**——否则在宽视口下 `flex-grow:1` 会把头像+姓名拉伸铺满整行，视觉上头像与姓名被「撑开」，失去左对齐的紧凑感。**这是最容易漏的一处**。

**`.dp-person-head-*` 系列类的去留清单（`global.css:465-478`）**：

| 类名 | 现用途 | 处置 |
|------|--------|------|
| `.dp-person-head` | hero 容器，≤900px `flex-wrap:wrap` | **保留**（`flex-wrap` 无害，向后兼容） |
| `.dp-person-head-row` | 左右分栏行，≤900px `flex-direction:column` | **删除**（DOM 中已无此节点，属死 CSS） |
| `.dp-person-head-main` | 头像+姓名，≤900px `flex-direction:column` | **保留**（样式需从 `flex:1 1 320px` 收为 `flex:0 1 auto`，见上） |
| `.dp-person-head-tags` | 主标签块，≤900px `width:100%; align-items:flex-start` | **删除**（DOM 中已无此节点，属死 CSS） |

> **判定依据**：删块后 `.dp-person-head-row` 与 `.dp-person-head-tags` 在 `global.css:468-478` 的两条规则**再也匹配不到任何元素**。留着它们会误导后续维护者以为还有左右分栏。**必须删**。

### 1.3 `mock.js` 侧变更

| 项 | 处置 | 具体 |
|----|------|------|
| `primaryTags`（`:1113-1125`） | **删除整个导出** | 删除后无任何消费方（`peopleWithTag` 不用它，见复算；`ui.jsx` 的唯一消费点随 §1.4 一并删）。留着会变成「只被自己引用的死代码」 |
| `getPersonProfile` 内 `const primaries = primaryTags[key] \|\| [];`（`:1293`） | **删除** | 唯一事实来源链断裂 |
| `tags[i].primary` 字段（`:1344` `primary: primaries.includes(id)`） | **删除字段** | 返回结构不再含 `primary` |
| `personTags` 注释（`:1003`「遵守上限：… 主标签 ≤3」） | **改写** | 见 §1.6 文案清单 |

#### ★ `:1362` 组内二级排序键的替代判据（**必须改，不能静默留 false**）

**现状**：`if (a.primary !== b.primary) return a.primary ? -1 : 1;`

**裁定：改为按「实证档位降序 → 同档按词表索引升序」。** 即：

```js
// v0.4.2：主标签概念退场 → 组内二级排序键改为「系统档位优先」
//   1) 先按 evidenceTier 降序（authoritative > established > emerging > none）——「系统认可的排前面」
//   2) 同档按 TAG_DICT 词表索引升序（稳定、与数据录入顺序一致，不引入任何人工挑选）
const TIER_ORDER = { none: 0, emerging: 1, established: 2, authoritative: 3 };
const tierRank = (t) => TIER_ORDER[t.evidenceTier] || 0;
// sort 内：
//   if (ga !== gb) return ga - gb;
//   const td = tierRank(b) - tierRank(a);
//   if (td !== 0) return td;
//   return orderOf(a.tag.id) - orderOf(b.tag.id);
```

**为什么选「档位优先」而不是「纯词表索引」**：
1. **数据来源合法性**：档位是系统派生的（加权分 → 档），用它排序**完全符合用户「标签仅来自系统客观数据抽取」的口径**；纯词表索引虽然也中立，但会把「有实证的」和「零实证的」混杂在一起，用户看不出轻重。
2. **与 `TagMatrix` 的桶内排序一致**（§3.4）——数据层与展示层同序，避免「同一组数据在数据层与 UI 层顺序不同」的诡异现象。
3. **不造横向比较**：这是**同一个人内部**的排序，不是跨人排序，`TagBrowse` 的「按姓名排序」铁律不受影响。

> ⚠️ **注意**：`PersonProfile.jsx` 侧不再需要 `tags.filter(t => t.primary)`，且 `tags` 顺序已由 `getPersonProfile` 给出；`TagMatrix` 会**再次**按自己的桶内规则排序（§3.4），两处规则一致即可。

### 1.4 `ui.jsx` 侧变更

| 项 | 处置 | 理由 |
|----|------|------|
| `const PRIMARY_GLYPH = '◈'`（`:346`） | **删除** | 唯一语义是「标记主标签」，主标签退场后失去所指 |
| 文件头注释（`:341-345` 那段解释 `PRIMARY_GLYPH` 的块） | **删除** | 随常量一并删 |
| `TagChip` 的 **primary 分支**（`:737-763`） | **删除整个分支** | 无调用方。`TagMatrix`（`:932`）与 hero 是仅有的两处主标签渲染，均已删 |
| `TagChip` 的 `primary` prop（`:606`） | **删除 prop** | 分支删除后 prop 无用 |
| `TagChip` 的 **selected 分支**（`:766-793`） | **保留分支，但去掉 `{PRIMARY_GLYPH} ` 前缀** | `selected` 是 `TagBrowse` 筛选器的活跃态，仍在用；只把字形前缀删掉，改为纯 `{label} ×` |
| `TagMatrix` 卡内 `{t.primary ? \`${PRIMARY_GLYPH} \` : ''}`（`:932`） | **删除该表达式** | 只留 `{t.tag.label}` |

**删除后 `TagChip` 的分支集**：`merged` / `deprecated` / `disabled` / `selected` / `active`（5 支）。**颜色语义同步收窄**：`c.brandSubtle` 与 `c.brandBorder` 原服务于 primary 分支，primary 退场后**它们在本组件内不再被引用**——但**不要从 `theme.js` 删除这两个令牌**（`brandSubtle` 是 antd `colorPrimaryBg` 的取值来源、`brandBorder` 是 `colorPrimaryBorder` 来源，删除会连带 antd 主题）。**只在本组件内停止引用即可**。

### 1.5 组织速查表「专长 / 关注」列裁定（`Workspace.jsx:213-225`）

**现状**：表头 `'专长 / 关注'`，内容渲染 `orgPeople[].tags`（如 `['设计规范','设计令牌']`）。

**裁定：表头改为 `'技能标签'`，内容改渲染「系统标签名」（经词表解析），不再直接渲染 `orgPeople[].tags` 的原始字符串。**

**理由（三条）**：
1. **「关注」这个词直接违反用户第 2 条指令**——它暗示「这个人在关注什么」，是主观兴趣口径。用户明确要求「仅来自系统客观数据抽取 + 人才盘点」。
2. **「专长」是评价性词汇**——项目已确立「不做「擅长/精通/掌握」措辞」的纪律（`ui.jsx:322` 注释）。表头写「专长」等于在组织级列表上给每个人下能力判断，与「不作为绩效评价」的合规脚注正面冲突，且**这是跨人横向铺开的列表，最容易被读成排行榜**。
3. **`orgPeople[].tags` 是自由字符串**（`'设计规范'`、`'设计令牌'`、`'设备'`），**不是 `TAG_DICT` 的 id**——`'设备'` 甚至不在词表里。直接渲染等于在「统一技能标签树」之外另开了一套野生标签。**必须改为经 `TAG_DICT.aliases` 解析为词表标签**（`'设计规范'→d-design-system`、`'设计令牌'→d-design-system`）。

**具体做法**：
- 表头：`title: '技能标签'`
- 单元格：复用 `mock.js` 已有的 `aliases` 映射能力，解析 `orgPeople[].tags` → 去重后的 `TAG_DICT` 标签 id → 渲染 `TagChip label={tag.label}`
- **无法解析的字符串**（如 `'设备'`）：**不渲染**（宁可少显示，不可引入词表外标签）。若构建师认为必须保留信息量，可改为渲染但**同时把该字符串补进 `TAG_DICT.aliases`**（推荐：把 `'设备'` 作为 `d-esl` 或新增标签的 alias，由构建师决定；**但绝不允许渲染词表外裸字符串**）。
- 搜索 placeholder（`Workspace.jsx:241`）「按姓名 / 团队 / 专长检索」→ **改为「按姓名 / 团队 / 技能标签检索」**
- `Org.jsx:19`「按姓名、团队或专长找到对接人」→ **改为「按姓名、团队或技能标签找到对接人」**

### 1.6 连带文案清单（逐条，含行号）

| # | 位置 | 现文案（片段） | 改为 |
|---|------|--------------|------|
| 1 | `PersonProfile.jsx:5`（文件头注释） | `+ 主标签成熟度卡（≤2，放大态）` | 删去该分句：`L0 hero 基础信息（头像 + 姓名 + 部门/角色 + 联系）` |
| 2 | `PersonProfile.jsx:9`（文件头注释） | `无编辑入口、无关注、无「这是我的页面」暗示。` | `无编辑入口、无「这是我的页面」暗示；同事可对标签点赞表示认可（读侧社交信号，不改动被访者资料）。` |
| 3 | `PersonProfile.jsx:110` | `const primaries = tags.filter((t) => t.primary);` | **整行删除** |
| 4 | `PersonProfile.jsx:136`（注释） | `{/* L0 · Hero（通栏）：左侧人信息 + 右侧主标签成熟度卡（≤2，放大态） */}` | `{/* 模块 1 · 头像 + 个人信息（通栏，单列） */}` |
| 5 | `PersonProfile.jsx:153-191` | 整个主标签块（含 `<span>主标签</span>`） | **整块删除** |
| 6 | `PersonProfile.jsx:95`（404 空态） | `可回到组织速查按姓名与专长检索。` | `可回到组织速查按姓名与技能标签检索。` |
| 7 | `PersonProfile.jsx:195`（注释） | `{/* L1 + L2 · 主体两栏：技能标签树（宽）｜近期知识贡献（窄） */}` | `{/* 模块 2 + 模块 3 · 主体两栏：技能标签（宽）｜近期知识贡献（窄） */}` |
| 8 | `PersonProfile.jsx:205`（合规脚注） | 见 §2 口径表 | 见 §2 |
| 9 | `PersonProfile.jsx:227-230`（贡献空态） | 见 §2 口径表 | 见 §2 |
| 10 | `ui.jsx:839`（`TagMatrix` 空态 desc） | `该成员尚未选择任何标签。标签用于让同事找到你的专长——可在组织速查里发起补充。` | `该成员暂无可展示的技能标签。技能标签来自系统数据抽取与人才盘点，无需本人登记。` |
| 11 | `ui.jsx:887`（注释） | `单张标签卡：标签名（+主标签 ◈ 前缀）+ 分组名…` | `单张标签卡：标签名 + 分组名 + 系统档位条 + 点赞` |
| 12 | `ui.jsx:735-736`（primary 分支注释） | `—— 主标签：brandSubtle 底 + …「主」字标 ——` | **随分支一并删除** |
| 13 | `mock.js:1003`（注释） | `遵守上限：领域 ≤5 / 能力 ≤4 / 合计 ≤9 / 主标签 ≤3。` | `遵守上限：合计 ≤9。技能标签仅来自系统数据抽取与人才盘点，无「主标签」概念。` |
| 14 | `mock.js:1113`（`primaryTags` 注释） | `/** 主标签（每人 ≤3）：进入反查页一级展示，并在个人页头高亮 */` | **随导出一并删除** |
| 15 | `Workspace.jsx:214`（表头） | `'专长 / 关注'` | `'技能标签'` |
| 16 | `Workspace.jsx:241`（placeholder） | `按姓名 / 团队 / 专长检索，例如「门店」「SSO」` | `按姓名 / 团队 / 技能标签检索，例如「门店」「SSO」` |
| 17 | `Org.jsx:19` | `按姓名、团队或专长找到对接人` | `按姓名、团队或技能标签找到对接人` |
| 18 | `global.css:460`（注释） | `① 个人页页头：≤900px 改纵向（头像在上、姓名与主标签换行到下方）` | `① 个人页页头：≤900px 改纵向（头像在上、姓名换行到下方）` |
| 19 | `TagBrowse.jsx` 反查页相关文案 | 见 §2 口径表 | 见 §2 |

---

## 2. 标签来源口径规范

### 2.1 一句话口径文案（可直接上屏）

> **技能标签来自系统数据抽取与公司人才盘点，由系统自动生成，无需本人登记，也不作为绩效评价。**

**为什么这一句能同时覆盖两条来源**：
- 「系统数据抽取」← 对应最佳实践 / 文章 / 项目动态 / 公告 / Release 的署名与分类映射（`mock.js:1161` `collectEvidence()` 的既有机制）
- 「公司人才盘点」← 对应人才盘点系统的结果导入（本期为口径先立，数据接入后置）
- 「无需本人登记」← **这是对用户第 2 条指令的正面回应**，也是对「已删除的自评轨」的交代
- 「不作为绩效评价」← 保留既有合规纪律，`none` 档「没实证」不得被读成「能力差」

### 2.2 所有来源描述的落点与处置

| # | 位置 | 现文案 | 处置 |
|---|------|--------|------|
| 1 | `PersonProfile.jsx:205`（合规脚注） | `本页为只读视图 · 标签用于让同事找到你的专长，实证度由系统按公开贡献核算，不作为绩效评价。` | **改为**：`本页为只读视图（同事可对标签点赞表示认可）· 技能标签来自系统数据抽取与公司人才盘点，由系统自动生成，无需本人登记，也不作为绩效评价。` |
| 2 | `PersonProfile.jsx:227-230`（贡献空态） | `暂无公开知识贡献。标签的实证度来自最佳实践、文章、项目动态、公告与 Release 的署名，由系统自动核算。` | **改为**：`暂无近期知识贡献。技能标签的档位来自最佳实践、文章、项目动态、公告与 Release 的署名，以及人才盘点结果，由系统自动核算。` |
| 3 | `ui.jsx:839`（`TagMatrix` 空态 desc） | `该成员尚未选择任何标签。标签用于让同事找到你的专长——可在组织速查里发起补充。` | **改为**（同 §1.6 #10）：`该成员暂无可展示的技能标签。技能标签来自系统数据抽取与人才盘点，无需本人登记。` |
| 4 | `TagBrowse.jsx:245`（未选标签空态 desc） | `在上方选择一个或多个标签，这里会列出相关的人。结果按姓名排序，不按任何贡献度排名。` | **保留**（无来源描述、无主观措辞，文案本身合规）；**追加一句**：`标签来自系统数据抽取与人才盘点。` |
| 5 | `TagBrowse.jsx:302-304`（结果区脚注） | `结果按姓名排序，不做任何基于贡献度的排序 · 反查页只负责「找到人」，判断人的成熟度请进入个人主页查看。` | **改为**：`结果按姓名排序，不做任何基于档位的排序 · 反查页只负责「找到人」；标签档位来自系统数据抽取与人才盘点，可在个人主页查看。` |
| 6 | `ui.jsx:834-842`（`TagMatrix` 空态 `title`） | `暂无标签` | **保留**（中性，无来源暗示） |
| 7 | `TagBrowse.jsx:100-106`（`emptyCopy` 空组诊断文案） | 含 `词表已预留该领域的 N 个标签，等待第一位贡献者——这类空档本身也是部门能力盘点的一个信号。` | **改为**：去掉「等待第一位贡献者」（暗示人工登记）；改为：`该分组已预留 N 个技能标签，暂无成员的标签落在此分组——这是能力盘点可关注的一处空档。` |

### 2.3 必须清除的措辞清单（凡暗示主观选择的）

**一律清除**（出现即违规）：
`「自己选」「自己填」「自己关注」「订阅」「关注了」「我关注的」「选标签」「发起补充」「等待第一位贡献者」「成员尚未选择」「本人维护」「主标签」「专长」（作评价性名词时）`

**允许保留**：
`「技能标签」「档位」「数据抽取」「人才盘点」「系统生成/核算」「无需本人登记」`

> **「关注」一词在 `Knowledge.jsx:289` 的 `{b.votes} 人关注`**（知识中心「待补知识」队列的订阅数）：**不在本期射程**——那是「关注一个问题」的知识协作语义，与「员工标签」无关。**不要连带修改**（改了会破坏 `Knowledge` 页既有断言）。

---

## 3. 单一系统成熟度规范

### 3.1 `MaturityAxis` 的新定义

**结论：组件保留「4 段等分胶囊条」这一唯一形态，删掉自评点阵 / 兴趣行 / 吹牛态 / 收轨态 / 双 variant 语义。**

**实读复算的分布（`_v042_probe.txt`）**：全员 79 个标签实例中 `none=66 / emerging=6 / established=6 / authoritative=1`。**`none` 占 83.5%** —— 这意味着**「没有档位」是这个页面的视觉常态，不是异常态**。这个数字决定了 `none` 档的渲染必须是「安静的默认态」而不是「告警态」。

> ⚠️ **注意与旧断言的差异**：`smoke.cjs:1888` 注释称「沈知微收轨淡文案屏上 = 9」，但复算显示沈知微 9 个标签只有 1 个是 `authoritative`、其余 8 个 `none`。**旧的「9」依赖的是「expanded 主标签卡额外渲染 +1 处」的旧版式**，主标签退场后这个数字必然变化。**该断言必须重算，不能照抄。**

### 3.2 是否保留 4 档文案、是否改名

**保留 4 档文案**，但 `none` 档文案必须改；**组件改名 `MaturityAxis` → `SystemTier`**。

| 决策 | 裁定 | 理由 |
|------|------|------|
| 保留 4 档？ | **保留** | 档位是系统派生的客观事实，4 档粒度（0 / 1-2 / 3-5 / ≥6）已在 `tierOfScore` 落地并有断言，改动无收益 |
| 改名？ | **改。`MaturityAxis` → `SystemTier`** | `Axis`（轴）这个词是双轨制遗物——`MaturityAxis` 的名字里「双轴」已不存在，留着会误导后续维护者以为还有两条轨。**名字必须与实现一致** |
| `variant` prop？ | **删除** | 只有一个消费场景（标签卡内），不再需要 compact/expanded 两档 |

### 3.3 4 档文案裁定

| 档位 | 现文案 | v0.4.2 新文案 | 理由 |
|------|--------|--------------|------|
| `none` | `'暂无公开贡献'` | **`'暂无系统记录'`** | ①用户点名「公开贡献」这个词不要；②「公开贡献」把 `none` 读成「你不公开」，带贬义；③「暂无系统记录」是纯事实陈述（系统没抽到数据），中性且与来源口径一致 |
| `emerging` | `'有初步产出'` | **`'有初步记录'`** | 「产出」隐含成果评价；「记录」是数据事实。四档统一用「记录/沉淀」语义域 |
| `established` | `'有稳定的产出'` | **`'有稳定记录'`** | 同上，去「产出」 |
| `authoritative` | `'有沉淀与影响力'` | **`'有沉淀与影响'`** | 「影响力」是评价词，「影响」更克制；且与前三档保持「记录/沉淀」语义域一致性 |

> **文案纪律**：四档统一落在「系统记录 / 沉淀」语义域，**全程无「擅长/精通/掌握」，也无「贡献/产出」这类成果评价词**。这与项目既有的措辞纪律（`ui.jsx:322`）一脉相承，并**进一步收紧了「不做能力评价」的承诺**。

### 3.4 组件命名与 props 契约（构建师照抄）

```jsx
/**
 * SystemTier —— 系统档位条（v0.4.2 单一系统轨）
 * ------------------------------------------------------------------
 * 唯一形态：4 段等分胶囊条（25/50/75/100%），不按分数比例
 *   —— 按比例会造出「绩效分」的横向比较读法，既有决策保留。
 * 档位只来自系统派生（系统数据抽取 + 人才盘点），无自评轨、无吹牛态、无收轨态。
 * 空槽用 c.border（读起来像「凹槽」而不是「占位」）。
 *
 * props:
 *   tier        'none'|'emerging'|'established'|'authoritative'  （必需）
 *   count       近 12 月系统记录条数（可选，等宽数字；不传则不显示计数）
 *   showCopy    是否显示档位文案（默认 true）
 */
export function SystemTier({ tier = 'none', count, showCopy = true }) { ... }
```

**渲染契约**：

| 行 | 内容 | 规范 |
|----|------|------|
| L1 | 档位条（4 段等分胶囊） | `trackW: 64`, `trackH: 6`, `segGap: 2`, `borderRadius: 999`；已达段 `fillColor`（单色阶 `c.brandStep1→c.brand`），未达段 `c.border` |
| L2 | 档位文案 | 12px（卡内）/ `c.text2`（`none` 档用 `c.text3`，更安静）；文案取自 4 档表 |
| L2 右侧 | 计数（可选） | `className="dp-num"`，12px，`c.text3`，格式 `近 12 月 N 条`（仅当 `count > 0` 时渲染，`count === 0` 不渲染——避免 `none` 档同时出现「暂无系统记录」和「近 12 月 0 条」的重复否定） |

**`none` 档的渲染（关键）**：
- **四条空槽照常渲染**（4 段 `c.border`）——**不隐藏、不换成虚线条**。理由：83.5% 的标签是 `none`，若把空槽换成虚线条/隐藏，页面会满屏虚线，反而更吵。**统一的空槽 = 安静的默认态**，这是「常态不喧哗」的正确处理。
- 文案 `'暂无系统记录'` 用 `c.text3`（比 `emerging` 以上的 `c.text2` 更淡一档），形成「低档位更安静」的自然降序。
- **不再有「提示行」「吹牛态提示」「收轨态」任何一个特殊分支**。

### 3.5 `TagMatrix` 桶内排序键裁定

**现状（`ui.jsx:848-859`）**：`tierRank(evidenceTier)` 降序 → `ratingRank(selfRating)` 降序。

**裁定：`ratingRank(selfRating)` 整个删除，改为 `tierRank` 降序 → 词表索引升序。**

```js
// v0.4.2：ratingRank 退场（自评轨已删）；组内排序 = 档位降序 → 词表序升序
const tierRank = (tier) => ({ none: 0, emerging: 1, established: 2, authoritative: 3 }[tier] || 0);
const buckets = SKILL_GROUPS.map((g) => ({
  label: g,
  list: tags
    .filter((t) => t.tag && t.tag.group === g)
    .slice()
    .sort((a, b) => {
      const td = tierRank(b.evidenceTier) - tierRank(a.evidenceTier);
      if (td !== 0) return td;
      return orderOf(a.tag.id) - orderOf(b.tag.id);   // orderOf = TAG_DICT.findIndex
    }),
})).filter((b) => b.list.length > 0);
```

**理由**：与 §1.3 的数据层排序键**完全一致**（档位降序 → 词表序升序），避免「同一人的同一组标签，在数据层与 UI 层顺序不同」的双口径。`ratingRank` 依赖 `selfRating`，该字段已删，**留着会 `indexOf(undefined) === -1` 导致排序静默错乱**——必须删。

---

## 4. 点赞（认可）组件规范

### 4.1 裁定：可交互的「读侧社交信号」

**结论：点赞是「可交互、有本地状态」的，但它在语义上属于「读侧社交动作」，不属于「编辑被访者资料」，因此与「只读第三人称视图」纪律不冲突。**

**为什么不是「只读展示的聚合计数」**（三条）：
1. **用户原话是「可以用来让浏览该主页的同事，认可这个同事的某个标签」**——「让同事认可」是一个**动作**，纯展示数字无法承载「认可」这个动作。
2. **纯展示计数在这个系统里没有数据来源**：若只是展示，计数从哪来？只能是 mock 里编一个静态数字，那用户会问「我点了为什么不变」。**要么真可点，要么根本不做。**
3. **「只读」纪律的原文边界是「无编辑入口、无关注、无『这是我的页面』暗示」**（`PersonProfile.jsx:9`）——约束的是「不能编辑**这个人的**数据」与「不能产生**归属感**」。点赞两个都不违反：它不改被访者任何字段，也不产生「这是我的页面」的暗示（点赞者是浏览者，不是页主）。

**必须在文档头同步修订纪律原文**（§1.6 #2）：把「无关注」这个**已被本期推翻**的约束改写成明确允许点赞的表述。**不改注释会导致下一位维护者以为点赞违规。**

### 4.2 组件命名与 props 契约

```jsx
/**
 * TagLike —— 标签点赞（同事之间的认可动作）
 * ------------------------------------------------------------------
 * 定位：读侧社交信号。点赞不改动被访者的任何字段，也不进入被访者的资料；
 *       它只表达「浏览者认可这个标签」。计数 = 确定性基线 + 本 session 的 +1。
 *
 * 事件纪律（关键）：标签卡本身是 role="button" onClick → 跳反查页。
 *   TagLike 的 onClick 必须 e.stopPropagation()，否则点赞会连带跳转路由。
 *
 * props:
 *   baseLikes  number   确定性基线计数（来自 mock，见 §4.6）
 *   label      string   所属标签名（用于 aria-label 组装）
 *   size       number   图标尺寸（默认 14）
 */
export function TagLike({ baseLikes = 0, label = '', size = 14 }) {
  const c = useT();
  const [liked, setLiked] = React.useState(false);
  const count = baseLikes + (liked ? 1 : 0);
  ...
}
```

> **`TagLike` 内部 `useState` 是本地状态，不持久化**。刷新页面后 `liked` 归 false——**这是刻意设计**：本项目零后端（`file://` 双击可用、零外部请求），没有可信的持久化位置。**在文档里写明这一点**，避免审查官误判为「状态丢失 bug」。

### 4.3 图标

**用 antd 图标（已在项目 dependency 内，零新增依赖）**：

```jsx
import { LikeOutlined, LikeFilled } from '@ant-design/icons';
```

> **已核实**：`portal/node_modules/@ant-design/icons/es/icons/LikeOutlined.js` 与 `LikeFilled.js` **均存在**（本次实测），antd 图标在项目里已被使用（`ui.jsx:7` 用 `ArrowUpOutlined`）。**不引入任何新图标库。**
> **未点赞** = `LikeOutlined`；**已点赞** = `LikeFilled`。两者形状相同（同一轮廓的线/面版），**不依赖颜色也能区分状态**（无障碍要求）。

### 4.4 视觉规范（用既有 token，零硬编码色值）

| 状态 | 图标 | 图标色 | 文字/计数色 | 背景 |
|------|------|--------|------------|------|
| **未点赞** | `LikeOutlined` | `c.text3` | `c.text3` | `transparent` |
| **已点赞** | `LikeFilled` | `c.brand` | `c.brand` | `c.brandSubtle`（圆角胶囊底） |
| **hover（未点赞）** | `LikeOutlined` | `c.brand` | `c.brand` | `c.page` |

- **形态**：`inline-flex`，`gap: 4`，`height: 22`，`padding: '0 7px'`，`borderRadius: 999`，`fontSize: 12`（与 `.dp-chip` 同节奏，但不复用 `.dp-chip` 类——`.dp-chip` 含 `border` 语义，点赞不需要边框）
- **计数排版**：`className="dp-num"`（等宽数字），12px；**计数为 0 时仍显示 `0`**（不隐藏）——因为「0 人认可」是一个有意义的事实，且隐藏会导致卡片布局跳动
- **`c.brandSubtle` 的新用途**：primary 分支退场后（§1.4）该令牌在本模块内空出，**恰好被「已点赞」态复用**——这是有意的令牌循环利用，不新增颜色

### 4.5 无障碍规范

| 要求 | 实现 |
|------|------|
| 语义 | `<button type="button" role="button">`（用原生 button，天然键盘可达） |
| `aria-pressed` | `aria-pressed={liked ? 'true' : 'false'}` —— 与项目既有范式一致（`global.css:817` `.dp-floor-cell[aria-pressed='true']` 已是本项目既有用法） |
| `aria-label` | `liked ? \`取消认可「${label}」\` : \`认可「${label}」\`` |
| 键盘可达 | 原生 `<button>` 自动支持 Tab 聚焦 + Enter/Space 触发（**不要用 `div role=button`**，需手写 keydown；原生 button 免写） |
| 焦点环 | 必须加 `className="dp-like"` 并在 `global.css` 增补 `.dp-like:focus-visible { outline: 2px solid #3643ba; outline-offset: 2px; }`（沿用 `global.css:608-612` 的既有范式与同色值） |
| 数字可读 | 计数外包一层 `aria-hidden="true"`，让 `aria-label` 独占语义（避免读屏把「2」和「认可」割裂朗读） |

### 4.6 ★ 事件纪律（规范条文，构建师必须照抄）

```jsx
// 规范条文 1：点赞必须阻断冒泡，否则会误触标签卡的跳转
<button
  type="button"
  className="dp-like"
  aria-pressed={liked ? 'true' : 'false'}
  aria-label={liked ? `取消认可「${label}」` : `认可「${label}」`}
  onClick={(e) => {
    e.stopPropagation();   // ★ 必须：父级标签卡 role=button onClick → go('#/workspace/tags/'+id)
    setLiked((v) => !v);
  }}
>
  {liked ? <LikeFilled /> : <LikeOutlined />}
  <span className="dp-num" aria-hidden="true">{count}</span>
</button>
```

**规范条文 2**：`TagLike` 的 `onKeyDown` **不得**自行处理 Enter/Space —— 原生 `<button>` 已内建，重复处理会导致「按一次 Enter 触发两次 toggle」。

**规范条文 3**：`TagLike` 必须渲染在标签卡的**内层**，且标签卡的 `onClick`（跳转）保持不变；两者靠 `stopPropagation` 解耦。**不允许**把点赞做成「标签卡外挂第 6 个卡片」。

### 4.7 ★ 数据确定性：基线计数生成算法（逐字写出）

**算法（写进 `mock.js`，构建师照抄）**：

```js
/**
 * baseLikesOf(personId, tagId) —— 标签点赞的确定性基线计数。
 * ------------------------------------------------------------------
 * 纪律：**绝不用 Math.random()**。本项目所有屏幕级断言依赖可复现数字，
 *       随机计数会让断言在任何运行日失效（且本项目已三次栽在「不可复现」上）。
 *
 * 算法：FNV-1a 32 位散列 → 取模 2 → 0 | 1
 *   · 取模 2 的意图：点赞是「稀缺的认可」，不是人气榜。79 个标签实例下
 *     %2 给出 37 个 0 赞 / 42 个 1 赞（本次实测，见 outputs/_v042_like_probe.txt），
 *     0 赞是合法常态（渲染为「0」），不是空态。
 *   · 若用 %12 之类会产生大量个位数差异，读起来像「人气温差」——
 *     而本项目铁律是「不造跨人横向比较」，故必须限制在极小值域。
 *
 * 确定性验证：同输入两次调用结果一致（本次实测 same=true），且函数体内无 Math.random。
 */
export function baseLikesOf(personId, tagId) {
  const s = String(personId) + '::' + String(tagId);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 2;
}
```

**实测锚点（`_v042_like_probe.txt`，构建师可直接用作断言基准）**：

| 事实 | 值 |
|------|-----|
| 标签实例总数 | **79** |
| `baseLikes = 0` 的实例 | **37** |
| `baseLikes = 1` 的实例 | **42** |
| 周敏 min.zhou 逐标签 | `c-spec=0, c-product=0, c-ux=0, c-visual=1, d-design-system=0, d-docs=1, d-content-ops=0, d-portal=0` → **合计 = 2** |
| 沈知微 zhiwei.shen 逐标签 | `d-dataplatform=1, d-tracking=1, c-data-eng=0, d-metrics=1, d-realtime=1, d-warehouse=1, c-analytics=1, c-modeling=0, c-metrics-design=1` → **合计 = 7** |

> **这些数字是本次独立复算的**（脚本 `_v042_like_probe.cjs` 已落盘），不是转述。构建师实现后若与上表不符，说明实现有误，**不要反过来改数字去迁就实现**。

### 4.8 点赞与「只读视图」纪律的关系（写进代码注释）

```js
/* 【为什么「点赞」不违反「只读第三人称视图」】
   本页的「只读」约束原文（历史）是「无编辑入口、无关注、无『这是我的页面』暗示」，
   约束的是两件事：
     ① 不能让浏览者编辑**被访者的**数据；
     ② 不能制造「这是我的页面」的归属暗示。
   点赞两条都不触碰：
     · 它不写入被访者的任何字段（被访者的 tags / tier / contributions 原样不动）；
     · 点赞者是浏览者，不是页主，不产生归属暗示。
   因此点赞是「读侧的社交信号」，与被观看的数据正交。
   ⚠️ 但「无关注」这一条**已被本期推翻**（用户明确要求点赞），文档头注释必须同步改写，
      否则后续维护者会依据旧注释判定点赞违规。 */
```

---

## 5. 数据层变更清单

### 5.1 `getPersonProfile` 返回结构前后对比

| 层级 | v0.4.1 | v0.4.2 | 变更 |
|------|--------|--------|------|
| 顶层 | `{ person, tags, contributions }` | `{ person, tags, contributions }` | 不变 |
| `tags[i]` | `{ tag, selfRating, evidenceTier, recentScore, recentCount, historicalCount, totalCount, primary, contributions }` | `{ tag, evidenceTier, recentScore, recentCount, historicalCount, totalCount, likes, contributions }` | **删 `selfRating` / `primary`；新增 `likes`** |
| `personTags` | `{ [pid]: { [tagId]: selfRating } }` | `{ [pid]: { [tagId]: true } }` | **值从「自评档字符串」改为 `true`**（仅表示「此人有此标签」） |
| `primaryTags` | `{ [pid]: [tagId,...] }` | **删除整个导出** | 见 §1.3 |

### 5.2 新增字段

| 字段 | 类型 | 位置 | 语义 |
|------|------|------|------|
| `likes` | `number` | `tags[i].likes` | 该标签的确定性基线计数，取值 `baseLikesOf(personId, tagId)`，值域 `{0, 1}` |
| （导出）`baseLikesOf` | `function(personId, tagId) → 0\|1` | `mock.js` | 计数生成函数，导出供测试做数据层断言 |

### 5.3 删除字段

| 字段 | 位置 | 理由 |
|------|------|------|
| `selfRating` | `tags[i]`（`:1338`） + `personTags` 的值 | 自评轨整体退场（用户第 2、3 条） |
| `primary` | `tags[i]`（`:1344`） | 主标签退场（用户第 1 条） |
| `primaries` | `getPersonProfile` 局部变量（`:1293`） | 同上 |
| `primaryTags` | 模块导出（`:1114`） | 同上 |
| `SELF_RATINGS` | 模块导出（`:999`） | 自评轨退场，无消费方 |
| `SELF_RATING_ORDER` / `SELF_RATING_COPY` | `ui.jsx` 模块常量（`:323-329`） | 同上 |

### 5.4 `personTags` 的值改造（**注意：不能直接删表**）

**现状**：`personTags['min.zhou'] = { 'd-design-system': 'advocating', 'd-portal': 'practicing', ... }` —— 值承载自评档。

**裁定**：**保留 `personTags` 表结构与 key，把值统一改为 `true`。**

```js
// v0.4.2：自评轨退场 → 值不再表示自评档，改为「此人有此标签」的布尔标记。
// 保留 key 结构（而不是改造成数组）的理由：`Object.keys()` 的消费点有 4 处
// （getPersonProfile / peopleWithTag / TagBrowse 的 PEOPLE_BY_TAG / TagBrowse 结果行），
// 改结构会牵动 4 处无关改动面，收益为零。
export const personTags = {
  'min.zhou': {
    'd-design-system': true,
    'd-portal': true,
    ...
  },
  ...
};
```

> **为什么值不干脆删掉（用 `Set` 或数组）**：`Object.keys()` 消费点遍布 4 处（详见上注释），改结构牵动无关改动面。**`true` 是零成本的中性占位。**
> **同时必须删除 `personTags` 上方的注释**（`:1001-1004`「personTags —— 人 × 标签 × 自评级别」「刻意保留两位『吹牛态』」）——「吹牛态」概念已不存在。

### 5.5 空的点赞（0 次）如何渲染（数据层视角）

`likes = 0` 是**正常数据**（37/79 实例），渲染为 `0`。**不得**：
- 隐藏 `0`（会破坏卡片布局稳定性）
- 把 `0` 换成「暂无认可」文案（制造了一个不存在的「空态」概念）

---

## 6. 测试影响与验收清单

### 6.1 已知会失效的断言（逐条给处置）

| # | 位置 | 现断言 | 失效原因 | 处置建议 |
|---|------|--------|---------|---------|
| 1 | `smoke.cjs:1533` | `peopleNeed` 含 `'主标签'` | 「主标签」字样已从页面删除 | **从数组移除 `'主标签'`**，改为加入 `'技能标签'`、`'近期知识贡献'`（已存在）。**并新增反向断言：页面上 `'主标签'` 出现 0 次**（见 §6.2 #1） |
| 2 | `smoke.cjs:1583-1586` | 「自评圆点阵已渲染」（`span[style*="border-radius: 999"]` ≥ 4） | 自评点阵已删 | **整条删除**，替换为「系统档位条已渲染」断言（见 §6.2 #3） |
| 3 | `smoke.cjs:1600-1619` | legacy chip 门依赖 `.dp-grid--tight .dp-chip` | **仍有效**（`TagChip` 的 deprecated 分支保留，选择器不变） | **保留不动**。⚠️ 但需实测确认 `.dp-chip` 仍在 `.dp-grid--tight` 内渲染（`TagMatrix` 内 legacy 卡片走 `TagChip`） |
| 4 | `smoke.cjs:1621-1666` | 闭环门依赖 `TIER_TEXT`（`'有初步产出'` 等）与 `◈` 前缀剥离（`:1652` `replace(/^[◈◇]\s*/, '')`） | **TIER_TEXT 三档文案全改**（§3.3）；`◈` 前缀已删 | **改 `TIER_TEXT` 为新文案**（`emerging:'有初步记录', established:'有稳定记录', authoritative:'有沉淀与影响'`）；`:1652` 的 `replace` **可删除**（已无字形前缀），但**保留也无害**（正则匹配不到即原样返回）。**建议删除以减少噪音** |
| 5 | `smoke.cjs:1846-1897` | 吹牛/收轨分档门：`:1873` 周敏 boast=7、`:1878` hint=7、`:1886` 沈知微 boast=0、`:1888` 沈知微 collapse=9、`:1894` 周敏 collapse=3 | **全部失效**——吹牛态/收轨态整体删除，这两个概念不存在了 | **整块删除**（`:1846-1897`），替换为「单一档位门」（见 §6.2 #3/#4）。**`:1888` 的注释「v0.4.1 hero 主标签由 ≤3 收窄为 ≤2…→-1」已成陈旧归因**，注释一并删除 |
| 6 | `smoke.cjs:1990-2011` | P1-4 状态守卫依赖 `t.recentScore` | **仍有效**（`recentScore` 未删） | **保留不动** |
| 7 | `smoke.cjs:1802-1825` | P1-1 吹牛态收敛门（依赖 `SELF_ORDER` / `t.selfRating`） | **失效**——`selfRating` 已删 | **整块删除**（`SELF_ORDER` 与 offenders 逻辑全部无意义）；可替换为「全员 `tags[i]` 不含 `selfRating` 字段」的契约断言（见 §6.2 #5） |
| 8 | `smoke.cjs:2055-2070` | 栅格文本门（`.dp-g-profile` 1.85fr/1fr + `AXIS_GLYPH` 死代码门） | **仍有效**（栅格未改；`AXIS_GLYPH` 已清） | **保留**。⚠️ `:2064-2069` 的「死代码清理」门可**追加** `PRIMARY_GLYPH` 与 `primary` 分支的清除断言（见 §6.2 #6） |
| 9 | `mutation.cjs:93-101` `TARGETS` | `mock.js` / `ui.jsx` / `global.css` 的 sha256 | **三个文件的 sha256 全部会变**（本轮改动命中三者） | **必须 `node tests/mutation.cjs --print-sha` 重算并同步**。`Workspace.jsx` 的 sha 也会变（§1.5 改表头）。`DemandNew.jsx` / `ScaleChips.jsx` / `BrdAssistantCard.jsx` 若未动则 sha 不变 |
| 10 | `mutation.cjs:152-181` M7/M8/M9 | v0.4.1 三条变异 | M7（`'协作与流程'`）、M8（`.filter((b) => b.list.length > 0)`）、M9（1.85fr）**三条仍然有效**（改动面未触碰它们） | **保留 M7/M8/M9**，另加 v0.4.2 新变异（§6.5） |

### 6.2 必须新增的实测门（**不是文本门**）

> 全部要求**走 DOM / 数据层实测**，不得用「style.css 里有某个字符串」这种文本门冒充。

| # | 断言名 | 实测方法 | 期望 |
|---|--------|---------|------|
| 1 | **「主标签」字样屏上 0 次** | `pageHas(doc, '主标签')` 取反；并扫描 `bodyText(doc)` 不得匹配 `/主标签/` | **0 次命中** |
| 2 | **三模块计数** | 数 `#/workspace/people/min.zhou` 页面上的**顶级 Panel 数**：hero(1) + 技能标签(1) + 近期知识贡献(1) = **3**；通过 `.dp-shell > .dp-card` 或其实际 DOM 结构定位 | **恰好 3** |
| 3 | **系统档位条已渲染且无点阵** | ①`doc.querySelectorAll('.dp-card span[style*="border-radius: 999"]')` 计数（轨道段，每卡 4 段）；②断言**不存在**自评点阵特征（旧点阵是 `background: #3643ba` 的实心圆 + `border: 1.5px solid #c3c9f0` 空心圆混排）| ① ≥ 4×卡片数；② 点阵特征 0 命中 |
| 4 | **单一档位门（替代吹牛/收轨门）** | 对 `min.zhou` / `zhiwei.shen` 两个样本，用 `countDirect()` 计 `'暂无系统记录'` 出现次数，与**复算值**比对：周敏 8 个标签全是 `none` → **8**；沈知微 9 个标签中 8 个 `none` → **8** | 周敏 = 8，沈知微 = 8（**构建师须实测回填确认**，本值为复算推导） |
| 5 | **`selfRating` / `primary` 字段契约** | `MOCK.getPersonProfile('min.zhou').tags.every(t => !('selfRating' in t) && !('primary' in t))` | **true**；且 `MOCK.primaryTags === undefined`、`MOCK.SELF_RATINGS === undefined` |
| 6 | **死代码清除门** | 读 `src/components/ui.jsx` 源：不得匹配 `/(?:const\|let\|var)\s+PRIMARY_GLYPH\s*=/`；不得有 `if (primary)` 分支；不得有 `SELF_RATING_COPY` / `MaturityAxis` 定义 | 全部 0 命中 |
| 7 | **点赞点击后计数 +1 且未跳转** | 在 `min.zhou` 页：记录路由 hash → 找第一个 `.dp-like` → 读 `aria-pressed` 与计数文本 → `click()` → `settle` → 断言 ①`aria-pressed` 由 `false` 变 `true`；②计数文本 +1；③**路由 hash 未变**（未跳到 `#/workspace/tags/...`） | 三条全中 |
| 8 | **点赞键盘可达** | 对同一 button `focus()` 后派发 `keydown`（Enter，`key: 'Enter', keyCode: 13`）→ 断言 `aria-pressed` 翻转 | 翻转成功 |
| 9 | **点赞基线确定性** | `MOCK.baseLikesOf('min.zhou','c-visual') === 1`；`MOCK.baseLikesOf('min.zhou','c-spec') === 0`；且连续两次调用同值；且 `baseLikesOf.toString()` 不含 `Math.random` | 全中 |
| 10 | **组织速查表头** | `#/org` 页断言 `pageHas(doc,'技能标签')` 为真、`pageHas(doc,'专长')` 为假（注意排除导航/其他页噪音） | 技能标签 = 有，专长 = 无 |
| 11 | **来源口径文案在位** | `#/workspace/people/min.zhou` 断言含 `'系统数据抽取'` 与 `'人才盘点'` | 两者均命中 |
| 12 | **栅格未污染** | `.dp-g-profile` 仍 `1.85fr/1fr`；`.dp-g-article` 仍 `1fr 232px`（既有门保留） | 均保持 |

### 6.3 需重算的既有数字（**不要照抄旧值**）

| 数字 | 旧值（v0.4.1） | v0.4.2 期望 | 依据 |
|------|--------------|-----------|------|
| 周敏标签数 | 8 | **8**（不变） | 复算 |
| 周敏分组数 | 2（产品与设计 4 + 协作与流程 4） | **2**（不变） | 复算：`c-spec/c-product/c-ux/c-visual` 属「产品与设计」；`d-design-system/d-docs/d-content-ops/d-portal` 属「协作与流程」 |
| 周敏 `none` 档数量 | —（旧为 boast=7 / collapse=3） | **8**（全部 8 个标签都是 `none`） | 复算 `_v042_probe.txt` |
| 沈知微 `none` 档数量 | 9（旧 collapse） | **8**（9 个标签中 1 个 authoritative + 8 个 none） | 复算：`d-dataplatform = authoritative` |

> ⚠️ **沈知微的 8 vs 旧 9**：旧值 9 是「8 个矩阵卡 + 1 个 hero 主标签卡（expanded）」；主标签退场后 hero 不渲染标签，**只剩 8 个矩阵卡**。**这个「-1」的归因必须写对**（旧注释归因为「hero 主标签 ≤3 收窄为 ≤2」，那是 v0.4.1 的归因；v0.4.2 的归因是「hero 主标签块整体退场，-1 或 -3 取决于被试者主标签数」）。

### 6.4 变异测试要求

**（a）`TARGETS` 重算**：本轮改动命中 `mock.js` / `ui.jsx` / `global.css` / `Workspace.jsx` 四个文件，**四者 sha256 全部变化**。必须跑：

```
node tests/mutation.cjs --print-sha
```

把输出的四行（以及未变动的三个 demand 文件行）原样粘回 `TARGETS`（`mutation.cjs:93-101`）。

**（b）至少 2 条针对本轮改动的新变异**（要求：`find` 在目标文件**恰好命中 1 次**，变异后**真变红**）：

| id | file | find（恰好 1 次） | repl | expectRed |
|----|------|------------------|------|-----------|
| **M10** | `src/data/mock.js` | `  return h % 2;`（`baseLikesOf` 内唯一一行） | `  return h % 7;` | `点赞基线确定性`（计数变 → §6.2 #9 的红） |
| **M11** | `src/components/ui.jsx` | `    e.stopPropagation();`（`TagLike` 内唯一一行） | `    /* removed */;` | `点赞点击后计数 +1 且未跳转`（冒泡未被阻断 → 路由跳到反查页 → hash 变 → §6.2 #7 的红） |

**（c）额外建议的第 3 条**（可选，用于钉住「主标签退场」）：

| id | file | find | repl | expectRed |
|----|------|------|------|-----------|
| **M12** | `src/pages/PersonProfile.jsx` | `const { person, tags, contributions } = profile;` | 在其后**插入** `const primaries = tags.filter((t) => t.primary); ` 且保留渲染？ | ⚠️ **不建议**——`primary` 字段已删，重新引入会变成 `undefined` 过滤，变异语义不干净。**推荐改为**：变异 `mock.js` 里 `personTags` 的一条 key（如 `'d-design-system': true` → `'d-design-system': false`）使该标签从 `Object.keys` 消失 → 周敏标签数 8→7 → 「三模块/分组口径」门变红。find: `    'd-design-system': true,`（**需先确认改造后文本**），expectRed: `v0.4.1 TagMatrix 分组渲染口径`（该门仍存在）。**由构建师在改造完成后按实际文本确定 find 串。** |

> ⚠️ **M10/M11 的 `find` 串依赖改造后的确切文本**，本规范给出的是**目标形态**。构建师改造完成后必须**逐一核验 `find` 在文件中恰好命中 1 次**再写入（可用 `node -e` 计数），**否则变异会静默跳过**（这正是本项目 `mutation.cjs` 反复强调的坑）。

### 6.5 12 条验收清单

| # | 验收项 | 通过标准 |
|---|--------|---------|
| 1 | 个人主页**恰好三模块** | hero + 技能标签 + 近期知识贡献，无第 4 块 |
| 2 | 页面无「主标签」字样 | `bodyText` 匹配 `/主标签/` = 0 |
| 3 | hero 单列 | `.dp-person-head-row` / `.dp-person-head-tags` 在 DOM 与 `global.css` 中均不存在 |
| 4 | 技能标签为单一系统轨 | 无点阵、无「兴趣」行、无吹牛提示行、无收轨分支 |
| 5 | 档位文案为新 4 档 | 出现 `暂无系统记录`；不出现 `暂无公开贡献` / `持续关注` / `有初步产出` |
| 6 | 点赞可点且计数 +1 | §6.2 #7 三条全中 |
| 7 | 点赞不跳转 | 点击后路由 hash 未变 |
| 8 | 点赞键盘可达 | Enter 触发翻转，`aria-pressed` 正确 |
| 9 | 点赞基线确定 | `baseLikesOf` 无 `Math.random`，两次同值 |
| 10 | 来源口径上屏 | 含「系统数据抽取」「人才盘点」「无需本人登记」 |
| 11 | 组织速查表头为「技能标签」 | 无「专长 / 关注」 |
| 12 | 交付硬约束保持 | IIFE 输出、无 `type="module"`、无 `crossorigin`、零外部请求、双击 `file://` 可开 |

---

## 7. 令牌变更清单

### 7.1 新增令牌

| 令牌名 | 值 / 语义 | 影响组件 |
|--------|----------|---------|
| （无颜色令牌新增） | — | — |
| `.dp-like:focus-visible`（CSS 类，非 token） | `outline: 2px solid #3643ba; outline-offset: 2px;` | `TagLike` |

> **本期零新增颜色令牌**。`TagLike` 的已点赞态复用 `c.brandSubtle`（primary 分支退场后空出），未点赞态复用 `c.text3` / `c.brand`（hover）。这是**有意的令牌循环利用**。

### 7.2 语义变更（值不变）

| 令牌名 | 原语义 | 新语义 | 影响组件 |
|--------|--------|--------|---------|
| `brandSubtle` | 主标签（primary）底 | **已点赞态底**（primary 分支已删，语义转移） | `TagLike` |
| `brandStep1` | 实证 none 档填充 + selected 底 | **selected 底**（`none` 档填充改由 `c.border` 空槽承担？**不**——见下注） | `TagChip(selected)` |
| `cardHeadBg` | 技能树分组标题条底 | 不变 | `TagMatrix(groupBar)` |
| `dashedBorder` | 吹牛态虚线 + 已停用 chip | **仅「已停用 chip」**（吹牛态已删，用途收窄） | `TagChip(deprecated)` |

> ⚠️ **`brandStep1` 的重要澄清**：`MaturityAxis` 的**第 1 段填充色**（`none` 档对应 `fillColor`）在旧代码里是 `c.brandStep1`——但 `none` 档根本不会点亮任何段（`evIdx = 0`，所有段走 `c.border`）。所以 `brandStep1` 的「实证度 none 档填充」这个语义**本来就是名义语义、无实际渲染**。**删除自评轨后，`brandStep1` 的实际用途只剩 `TagChip(selected)` 底色**。**值为 `#DCE0F4` 不变**，但**语义描述必须改写**，否则下一位维护者会以为 `none` 档用了它。

### 7.3 删除令牌 / 常量

| 名称 | 位置 | 理由 |
|------|------|------|
| `PRIMARY_GLYPH` | `ui.jsx:346` | 主标签退场（§1.4） |
| `SELF_RATING_COPY` | `ui.jsx:323-328` | 自评轨退场（§3） |
| `SELF_RATING_ORDER` | `ui.jsx:329` | 同上 |
| `SELF_RATINGS` | `mock.js:999` | 同上 |
| `primaryTags` | `mock.js:1114` | 主标签退场（§1.3） |
| `MaturityAxis`（组件名） | `ui.jsx:362` | 改名 `SystemTier`（§3.2）——**不是删除组件，是改名 + 简化** |

### 7.4 冻结项（本期不动）

- ❌ **不改 `theme.js` 的任何色值**（本期是「删概念 + 改语义」，不是「调色」）
- ❌ **不动 `brandSubtle` / `brandBorder` 的取值**（它们是 antd `colorPrimaryBg` / `colorPrimaryBorder` 的来源，改取值会连带 antd 主题）
- ❌ **不动 4 档品牌色阶**（`brandStep1/2/3` + `brand`）
- ❌ **不动 `chart` 色板**、**不动语义四件套**（红黄绿禁令继续生效）
- ❌ **不动 `.dp-g-profile` 的 1.85fr/1fr 栅格**（v0.4.1 刚经审查验收，本期无理由改）
- ❌ **不动 `Knowledge.jsx:289` 的「{b.votes} 人关注」**（知识中心语义，不在射程）

---

## 8. 风险与遗留决策

| # | 风险 / 待决 | 我的裁定 | 需要谁拍板 |
|---|------------|---------|-----------|
| R1 | `orgPeople[].tags` 里的 `'设备'` 不在 `TAG_DICT` | **本轮实现为「不渲染无法解析的字符串」**；若需保留，把 `'设备'` 补进 `TAG_DICT.aliases`（归 `d-esl` 电子价签或新增标签） | 构建师按需，**但不许渲染词表外裸字符串** |
| R2 | 点赞状态不持久化（刷新归零） | **接受**。零后端 + `file://` 双击约束下无可信持久化位置；已在 §4.2 写明 | 已裁定 |
| R3 | `deprecated` 标签（林望的 `c-fullstack`）是否也给「点赞」按钮 | **给**。历史标签仍可被认可，且 `TagChip(deprecated)` 分支保留；但**档位条对 legacy 恒为 `none`**（既有 P1-4 状态守卫不动） | 已裁定 |
| R4 | `smoke.cjs:1600-1619` legacy chip 门是否仍通过 | **应仍通过**（选择器与 deprecated 分支未变），但需构建师实测确认 | 构建师实测 |
| R5 | 周敏/沈知微 `none` 档「8/8」期望值 | **本次复算推导，非实测屏上值**。构建师必须实测屏上 `countDirect` 回填后再钉死 | 构建师实测回填 |
| R6 | `M7/M8/M9` 变异是否仍有效 | **仍有效**（本轮未触碰其 `find` 目标：`'协作与流程'` / `.filter((b) => b.list.length > 0)` / `1.85fr`）。**但 `mock.js` / `ui.jsx` / `global.css` 的 sha 必变 → TARGETS 必须重算** | 构建师重算 |
| R7 | 反查页 `TagBrowse` 是否也要显示点赞 | **不显示**。反查页铁律是「只负责找到人，判断人的成熟度请进个人主页」；点赞会污染该页的「不排名」定位 | 已裁定 |
| R8 | `PersonProfile.jsx` 的 `Typography.Text` 与 `SectionTitle` 是否仍被使用 | 需构建师检查——删主标签块后 `Text` 可能成未使用导入（`PersonProfile.jsx:15,30`）。**未使用的 import 必须清**（否则 lint 噪音） | 构建师检查 |

---

**（全文完）**
