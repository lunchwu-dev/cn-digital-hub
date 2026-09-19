# 员工个人主页 + 统一 Digital 标签体系 · 交付说明

> 迪卡侬中国 · Digital 部门内部门户｜本次增量：**个人主页 `#/workspace/people/:id` + 标签反查页 `#/workspace/tags` + 统一标签体系（词表 72 条：active 69 / deprecated 2 / merged 1）**
> 面向对象：**下一位接手这个门户的开发者**。这不是"快速上手"，是交接文档——请通读 A→F 再动手。

---

## 0. 怎么打开（最重要的一件事）

本交付目录**无需安装任何依赖、无需起服务**：

- ✅ **双击 `index.html`** 即可在浏览器打开（`file://` 协议下直接运行）
- ✅ 已配 `base: './'` + `rollupOptions.output.format='iife'` + 一个剥离 `type="module"` 的 Vite 插件
- ✅ 零 CDN、零外部网络请求（字体走本地 `.woff2`）
- ⚠️ 不要用 IDE 的 "Open with Live Server" 也行，但**没必要**——本地双击即可

目录结构：

```
outputs/delivery-person-profile/
├── index.html              # 主入口（双击即开）
├── assets/
│   ├── index.js            # 全部源码打包（IIFE，1.36 MB）
│   ├── style.css           # 全部样式（14 KB）
│   ├── roboto-latin.woff2  # 本地字体（正文）
│   └── roboto-mono-latin.woff2  # 本地字体（数字等宽）
├── shots/                  # 本次新增 4 张成品截图
│   ├── 18-person-1440.png  # 个人主页 · 桌面
│   ├── 19-person-768.png   # 个人主页 · 平板
│   ├── 20-tags-1440.png    # 标签反查页 · 桌面
│   └── 21-tags-375.png     # 标签反查页 · 手机
└── README-交付说明.md       # 本文件
```

---

## A. 本次新增了什么

### 新增 2 个页面

| 页面 | 路由 | 文件 | 职责 |
|---|---|---|---|
| 员工个人主页 | `#/workspace/people/:id` | `src/pages/PersonProfile.jsx` | 只读的第三人称视图：基本信息 + 标签矩阵 + 近期知识贡献 + 协作触点 |
| 标签反查页 | `#/workspace/tags`（可选 `/:tagId`） | `src/pages/TagBrowse.jsx` | 按标签找人（**不判断人**） |

URL 前缀是 `workspace` 是历史包袱——见 F 节，**不要为了"看起来对齐"去改成 `org`**。

### 新增 4 个组件（均在 `src/components/ui.jsx`）

| 组件 | 职责 |
|---|---|
| `MaturityAxis` | **双轴成熟度条**（本体系最关键的组件）。自评 = 圆形点阵；实证 = 矩形分段胶囊条。`variant='compact'`（TagMatrix 内）/ `'expanded'`（个人页主标签） |
| `TagChip` | 标签胶囊，带轴语义与 `status` 三态视觉（active / deprecated 虚线 / merged 角标） |
| `TagMatrix` | 标签矩阵容器：单个 Panel 内分「领域轴 + 能力类型轴」两区（**不拆两块 Panel**） |
| `TagArrow` | 「→ 标签名」联动标注（贡献列表用，整块不可点） |

### 数据层扩展（`src/data/mock.js`）

- `TAG_DICT`（72 条：active 69 / deprecated 2 / merged 1）、`TAG_BY_ID`（索引）、`DOMAIN_GROUPS` / `CAP_GROUPS`（分组顺序）
- `personTags` / `primaryTags`（每人标签映射，10 人）
- `EVIDENCE_AS_OF` / `EVIDENCE_WEIGHTS` / `parseOwnerName()` / `withinWindow()` / `collectEvidence()` / `ALL_EVIDENCE` / `tierOfScore()` / `getPersonProfile()` / `toolsOfPerson()` / `peopleWithTag()`
- `personId(email)` / `personById(id)` —— 人员 id 的**唯一事实来源**（取 `@` 前缀小写，不给 `orgPeople` 加 `id` 字段，避免数据重复）

---

## B. 标签体系怎么用（给未来的维护者）

### B.1 `TAG_DICT` 的结构

```js
{ id, label, axis, group, status, aliases, mergedInto }
//   axis        ∈ 'domain' | 'capability'（两轴互斥）
//   group       分组名（DOMAIN_GROUPS / CAP_GROUPS 定义显示顺序）
//   status      ∈ 'active' | 'deprecated' | 'merged'（三态，不得扩展）
//   aliases     把既有 mock 的 category / tags 映射到领域轴标签
//   mergedInto  status==='merged' 时指向新词 id
```

### B.2 `status` 三态机的含义与操作规则

| status | 含义 | 渲染 | 可否物理删除 |
|---|---|---|---|
| `active` | 有效标签 | 正常 chip | ❌ 不删除（要下线走 deprecated） |
| `deprecated` | 已停用 | 虚线描边 + 「已停用」后缀；**从可选列表消失**；历史引用仍渲染（灰显） | ❌ **禁止物理删除**（保留记录） |
| `merged` | 已合并 | 显示 target 的 label + 「原『旧名』」角标 | ❌ 保留旧词条以便审计 |

**关键操作规则**

- `deprecated`：保留记录、从可选列表消失、历史引用仍渲染、**禁止物理删除**。
- `merged`：写 `mergedInto`，历史数据**不重写**，改为**渲染期重定向**（显示 target 的 label + 「原『旧名』」角标），**可逆**——清空 `mergedInto` 即回滚。
- **为什么用"渲染期重定向"而不是"数据迁移重写"**：原型无后端、可逆、可审计。数据迁移是一次性不可逆的重写，且在本项目里没有持久化层来承载它。渲染期重定向的代价只是一次 `TagChip` 分支判断，收益是**任何合并都能一行回滚**。

> 实现位置：`getPersonProfile.buildTag()` 里对 `status==='merged'` 补 `originLabel`；`TagChip` 负责渲染角标；`TagBrowse.ARCHIVED_TAGS` 是 deprecated/merged 的**渲染出口**（折叠在「已归档标签」区，历史引用仍可检索/审计）。

### B.3 R1 / R2 / R3 —— 三条互斥裁决规则（判断一个新词归哪条轴）

- **R1 对象优先**：指向**具体技术对象 / 系统 / 算法**（RAG、Agent、SSO、埋点）→ **领域轴**
- **R2 动作优先**：描述**可迁移的做法 / 能力**（系统架构、性能优化、需求拆解）→ **能力类型轴**
- **R3 互斥闸门**：**同一个词字符串只能存在于一条轴**；同时满足 R1 / R2 时**以 R1 为准**

> 例：「设计系统」是领域轴（`d-design-system`，它是一个对象产物），而「规范制定」是能力轴（`c-spec`，它是一种做法）。二者不冲突、不重复。

### B.4 数量上限（写入规范，UI 未强制，但请遵守）

- 领域轴每人 **≤5**
- 能力轴每人 **≤4**
- 合计 **≤9**
- 主标签 **≤3**（个人页页头只渲染前 3 个：`primaries.slice(0, 3)`）

---

## C. 双轴成熟度怎么算（最容易改错的地方）

### C.1 自评兴趣度 —— 4 级

| 值 | 文案 |
|---|---|
| `curious` | 有点好奇 |
| `following` | 持续关注 |
| `practicing` | 在项目中用过 |
| `advocating` | 主动投入 |

**⚠️ 措辞纪律（硬约束）**：全程**不出现"擅长 / 精通 / 掌握 / 熟练"等能力词**。它是"**兴趣**"不是"**能力**"——用能力词会与实证度的语义打架（一个"兴趣=精通"、另一个"实证=客观产出"，两套语义混在一起，用户会拿去排名）。

### C.2 实证度 —— 加权算分 → 4 档

**权重表**（`EVIDENCE_WEIGHTS`）：

| 证据类型 | 权重 |
|---|---|
| 最佳实践 `bestPractice` | 3 |
| 文章 `article` | 3 |
| 项目动态 `projectUpdate` | 2 |
| 公告 `announcement` | 2 |
| Release `release` | 1 |

**分档**（`tierOfScore`）：`0 → none` / `1–2 → emerging` / `3–5 → established` / `≥6 → authoritative`

**时间窗**：
- 基准日 `EVIDENCE_AS_OF = '2026-09-17'`（**固定常量**）
- **不要改用运行时真实日期**——否则 mock 数据会随时间滑出 12 个月窗口，实证度逐日贬值，**demo 崩坏、断言无法在任何运行日复现**。
- 近 12 个月决定档位；超窗的计为「历史贡献 N 条」，**不参与档位**。

**Release 守卫**：**只有 `status === 'released'` 的 Release 计入**（`gray` 灰度中 / `planned` 计划中都不算）。见 `collectEvidence()` 里 `if (r.status !== 'released') return;`。
> 同类排查：`announcements` / `projectUpdates` **无 status 字段**（公告即已发生的事实，不存在"未发布"态），无需守卫——已逐对象核对字段。

### C.3 两个必须注意的数据坑

**坑 1 — owner/author 格式不统一（必须经 `parseOwnerName()`）**

| 数据源 | 格式 | 例 |
|---|---|---|
| `bestPractices.author` / `releaseNotes.owner` | 裸名 | `郑远` |
| `announcements.owner` / `projectUpdates.owner` | 「组 · 姓名」 | `会员增长组 · 陈思远` |

`parseOwnerName()` 在**格式异常（空串 / 纯分隔符 / 残缺「何嘉 ·」）时返回 `null`**——**绝不允许产生空串姓名**，否则会伪造出一个孤立/幽灵的个人页 key。

**坑 2 — 幽灵贡献者**

`releaseNotes` 里有 `owner: '周立'`，他**不在 `orgPeople` 名单内**。
**裁决：未匹配到人的证据不计入任何个人页，只计入部门级总数**（`departmentEvidenceCount()`）。
实现：`getPersonProfile()` 里 `ALL_EVIDENCE.filter(e => e.personName != null && e.personName === person.name)` —— `null` 与「不在名单」走同一条"不计入任何人"的路径。

**坑 3 — 状态守卫（代码保证，不是数据巧合）**

`deprecated` / `merged` 标签**不参与实证计算**：`buildTag()` 里有 `isActive` 守卫，非 active 的 `recentScore` 恒为 0（tier 恒 `none`）。

```js
const isActive = tag.status !== 'deprecated' && tag.status !== 'merged';
const recentScore = isActive ? recent.reduce((s, e) => s + e.weight, 0) : 0;
```

> 为什么必须写在**代码**里：曾有一个 domain 轴旧标签可能被贡献命中而**污染档位**的风险。如果只靠"当前没有贡献映射到旧标签"这个数据巧合，一旦有人给旧标签补了别名，档位就会被凭空抬高。`selfRating` 仍保留（历史自评可展示），但实证恒 `none`。

---

## D. 设计决策（为什么这么做，给未来改设计的人）

### D.1 实证度 4 档用单一色相深浅阶，**坚决不用红黄绿**

三条理由：
1. **语义色已被占用**：`success / warning / error` 已绑定"运行状态"。挪用会稀释全站信噪比——很快就没有人认真看红色了。
2. **红绿灯隐喻必然被读成"绩效排名"**，与"**禁止跨人比较**"这条产品红线直接冲突。
3. **实证 4 档是同一度量的分档 = 单序列分档**，本就适用既有的「单序列必须单色」规约。

> 实现：`MaturityAxis` 填充色取 `[c.brandStep1, c.brandStep2, c.brandStep3, c.brand]`，**零新色相**。

### D.2 两轴不合成一个分数

- 自评用**圆形点阵**（主观、可打点）
- 实证用**矩形分段胶囊条**（客观、系统算）

**形状不同 → 用户不会误把两者相加。** 这是"两轴不合成"的**物理保证**，不是文案提醒。

**填充比例是 4 等分**（25 / 50 / 75 / 100%），**不是按分数比例**——按比例会被读成绩效分（条长可比，100 分制联想），等分**主动粗化比较颗粒度**。

### D.3 两轴区分零新色相

- 领域轴 = 品牌蓝系 + `◈` 实心菱形
- 能力轴 = 中性灰系 + `◇` 空心菱形

**实心 / 空心的几何差异是给色盲用户的第三通道**（不依赖颜色也能区分两轴）。

### D.4 吹牛态（自评高、实证 0）不隐藏、不降权

只诚实标注「暂无实证 · 仅自评」+「该标签暂无公开贡献佐证」，**点阵不灰化、不加删除线**——不为用户自评道歉。

- **触发阈值**：自评 ≥ `practicing`（3 级）且实名证（`evidenceTier === 'none'`）
- 实现：`MaturityAxis` 里 `const boast = selfIdx >= 3 && evidenceTier === 'none'`，此时实证轨改为**虚线描边空槽**（同宽同高，不缩不涨）。

### D.5 闭环验收（硬约束）

> **个人页上任一标签实证档位 ≥1，则「近期知识贡献」内必须有 ≥1 条带该标签映射的「→ 标签名」标注。**

这条约束让**实证度的每一分都可追溯**。

**数据现状（复算，基准 `EVIDENCE_AS_OF = 2026-09-17`）**：全 10 人共 **79 个标签实例**，其中实证档 ≥1 的有 **12 个**（分布：沈知微 `d-dataplatform`=authoritative；林望 `d-store`、刘倩 `d-ecommerce`/`d-promo`、何嘉 `d-sso`、郑远 `d-supply`=established；陈思远 `d-member`/`d-miniapp`、林望 `d-pos`、吴桐 `d-esl`/`d-store`、顾一鸣 `d-security`=emerging）。全量复算**闭环失败数 = 0**。

> ⚠️ **回归护栏的覆盖边界（勿高估）**：`smoke.cjs` 的闭环断言目前**只在 `yuan.zheng` 一个页面上下文执行**（`已校验 2 个正档位标签`），是**逐标签**校验但**只覆盖 1 人**。上面「全 10 人 0 失败」来自审计脚本的一次性复算，**不在回归护栏内**。给单个标签补箭头而漏掉其他人时，冒烟**不一定会红**——扩到全 10 人（数据层遍历 `Object.keys(personTags)` 即可，不必走 DOM）是待办。

### D.6 反查页结果列表**不显示成熟度**

反查页职责是「**找人**」，成熟度是「**判断人**」——两步分开更清爽。结果列表里只显示姓名 / 部门 / 角色 / 命中标签。

### D.7 反查页**按姓名排序，不做任何基于实证度的排序**

`PanelHead` 主动声明「按姓名排序」是"**不排名**"的可见证据。别再给它加"按贡献度排序"的按钮——这违反产品红线。

---

## E. 如何验证（回归护栏）

### E.1 标准三步

```powershell
# 环境：Node 22.22.2-3；Bash 工具在本机已损坏，一律用 PowerShell
cd portal
npm run build                 # vite build
node tests/smoke.cjs          # 137 项断言
node tests/shots.cjs          # 响应式断言 1–4（77 格抽点 + 连续扫描 1546×2 档）
```

### E.2 ⚠️ 冒烟测试必须先设 NODE_PATH

否则 `require('jsdom')` 直接报错：

```powershell
$env:NODE_PATH = 'C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules'
node tests\smoke.cjs
```

### E.3 变异测试流程（**本项目的验证纪律，务必保留**）

证明断言**真的会咬人**：

1. 改坏构建产物 / 源码（如把 `recentScore` 的 `isActive` 守卫删掉）
2. **断言必须变红**
3. 还原
4. 核指纹（比对 SHA256，确认已完全还原）

辅助脚本：`portal/tests/mutation.cjs`。

### E.4 ⚠️ 一条重要教训

本轮修掉了 **3 条"死断言"**——形如 `if (...) ok(...)` 但没有 `else fail(...)`，**永远不会变红**。

> **永远不会红的断言比没有断言更危险**：它给人虚假的安全感，还占着"已覆盖"的名额。

**新增断言后请务必做一次变异测试确认它会红。**

### E.5 响应式阈值常量（**不要回退到旧的 1272 / 1012**）

顶栏响应式分档为 **v2**（由 v0.2 重构引入，7 项导航 + Agent 移出顶栏）：

| 档 | 宽度 |
|---|---|
| T1 | ≥ 1312 |
| T2 | 1164 – 1311 |
| T3 | 941 – 1163 |
| T4 | 768 – 940 |
| T5 | ≤ 767 |

- `tests/shots.cjs` 的 `T_B1 = 1312`、`T_B2 = 1164` 与 `global.css` 的媒体查询**必须一致**。
- `navText` 在 ≤1163 才隐藏，故**可见下界 = 1164**。
- 原 1012 / 1272 分档**已作废**。

---

## F. 已知取舍与遗留问题

1. **数据全部为高质量 mock**，不接任何外部 API，**无后端持久化**（刷新即回默认）。
2. **无登录鉴权**：个人页是**只读的第三人称视图**，不放任何「编辑我的资料」入口、无关注、无"这是我的页面"暗示。
3. **不新增一级导航**：个人页挂在 `#/workspace/people/:id`，靠 `NAV_OF` 把**导航高亮解耦**到「组织速查」。
   - **URL 前缀 `workspace` 是历史包袱，不要为了"看起来对齐"去改它**——`02b §A.4` 已裁决 URL 不迁（`smoke.cjs` 用正则把这条路径钉死了；迁移对用户零收益、对回归全是成本）。
   - 高亮以**信息语义**为准：从组织速查点进个人主页，看到的是组织信息，高亮就该停在「组织速查」，而不是跳回「工作台」。
4. **标签新增走管理员维护**，本次**不做用户侧「待审核」中间态**——`status` 枚举只有三态，**不得扩展**。
5. **顶栏响应式分档为 v2**（见 E.5），**不要回退**。
6. **工作区有一批未提交的 v0.2 改动**（导航 5→7 项、Agent 移出顶栏改悬浮、新增 `#/org` 与 `#/demand` 一级频道），与本次标签体系改动混在同一工作区。
   - **建议提交时分成两个 commit**（v0.2 一个、标签体系一个），避免标签体系背顶栏回归的锅。
7. **个人主页的 `dp-person-head` 等新样式类**已加入 `global.css`；改动 `global.css` 时注意不要影响既有 `.dp-g-article`（个人页复用了它，未改定义）。

---

## G. 截图用途

`shots/` 内 4 张为**本次新增**（全量 21 张在 `portal/shots/`）：

| 文件 | 用途 |
|---|---|
| `18-person-1440.png` | 个人主页 · 1440 桌面档，验收标签矩阵 + 主标签放大态 MaturityAxis 布局 |
| `19-person-768.png` | 个人主页 · 768 平板档，验收 `dp-person-head` 折行与双栏降级 |
| `20-tags-1440.png` | 标签反查页 · 1440 桌面档，验收 chip 组分行 + 结果列表（不显示成熟度） |
| `21-tags-375.png` | 标签反查页 · 375 手机档，验收窄屏 chip 换行与结果行折行 |

其余 17 张（`01`–`17`）为门户既有页面在 v0.2 下的回归基线，见 `portal/shots/report.json`。

---

## H. 交付清单核对

### 交付目录内容

```
outputs/delivery-person-profile/
├── index.html                    # dist 副本（SHA256 与 portal/dist 一致）
├── assets/
│   ├── index.js                  # 1,363,308 B
│   ├── style.css                 # 13,993 B
│   ├── roboto-latin.woff2        # 43,136 B
│   └── roboto-mono-latin.woff2   # 32,796 B
├── shots/                        # 4 张新增截图
└── README-交付说明.md
```

> ⚠️ **工作区同时混有两条未提交的改动线**（见 §F.6）。下表刻意拆成两张，避免把 v0.2 站点重构的功过算到标签体系头上，也避免下一位开发者误以为 v0.2 的文件是本线产物。
>
> **合入方式建议**：按 §F.6，分成两个 commit——v0.2 一个、标签体系一个。**本线无法单独 commit**：`people → org` 导航高亮与「一级导航 7 项」断言都依赖 v0.2 的导航改造。

#### H.1 本线（标签体系 + 员工个人主页）新增的文件

| 文件 | 说明 |
|---|---|
| `portal/src/pages/PersonProfile.jsx` | 员工个人主页（`#/workspace/people/:id`） |
| `portal/src/pages/TagBrowse.jsx` | 标签反查页（`#/workspace/tags`，含已归档标签出口） |
| `portal/shots/18-person-1440.png` … `21-tags-375.png` | 4 张新增截图 |
| 交付目录整体 | `outputs/delivery-person-profile/` 为本次产出 |

#### H.2 本线修改的文件与改动要点

| 文件 | 改动要点 |
|---|---|
| `src/data/mock.js` | + 标签体系数据层：`TAG_DICT`(72 = active 69 + deprecated 2 + merged 1) / `TAG_BY_ID` / `DOMAIN_GROUPS` / `CAP_GROUPS` / `personTags` / `primaryTags` / `EVIDENCE_AS_OF` / `EVIDENCE_WEIGHTS` / `parseOwnerName` / `withinWindow` / `collectEvidence` / `ALL_EVIDENCE` / `tierOfScore` / `getPersonProfile` / `personId` / `personById` / `toolsOfPerson` / `peopleWithTag` / `departmentEvidenceCount` |
| `src/components/ui.jsx` | + `MaturityAxis` / `TagChip` / `TagMatrix` / `TagArrow`；`InitialAvatar` 加可选 `fontSize`（向后兼容） |
| `src/router.js` | `NAV_OF` 新增 `people → org` / `tags → org`（路径与高亮解耦） |
| `src/App.jsx` | `workspace` 分支按 `sub` 分发 `people` / `tags`；`activeKey` 改为**先试 `sub` 再回落 `seg`** |
| `src/global.css` | + 个人页 / 反查页样式类（`dp-person-head*` / `dp-tagbrowse-*` / `dp-archived-*`） |
| `src/theme.js` | + 5 个令牌（`brandStep1..3` / `cardHeadBg` / `dashedBorder`），供实证度单色阶与分区标题条使用 |
| `src/components/GlobalSearch.jsx` | 搜索索引纳入「人员」「标签」两个分组（人员排最前） |
| `tests/smoke.cjs` | + 标签/个人页/反查页断言（共 137 项）；修 3 条死断言 |
| `tests/shots.cjs` | + 4 张新截图用例 |

#### H.3 同工作区的 **v0.2 站点重构线**改动（非本线产物，勿记到标签体系头上）

| 文件 | 改动要点 |
|---|---|
| `src/router.js` | 一级导航 5 → 7 项；`NAV_OF` 新增 `org` / `demand` |
| `src/App.jsx` | 新增 `#/org` / `#/demand` 一级路由分支；`renderRoute` 改组件内闭包 |
| `src/components/TopBar.jsx` | **v0.2：7 项导航，Agent 移出顶栏改悬浮** |
| `src/components/AgentPanel.jsx` / `FloatAgent.jsx` | v0.2 新增（替代被删除的 `AgentDrawer.jsx`） |
| `src/pages/Org.jsx` | **v0.2 新增**：组织速查一级页（本线只是把它变成个人页入口） |
| `src/pages/DemandList.jsx` / `DemandNew.jsx` / `components/demand/*` | v0.2 新增：业务需求一级页 + 需求表单拆分 |
| `src/pages/Workspace.jsx` | v0.2：工作台退回纯工具目录（移除 Tabs）；`OrgView` 保持既有表格，仅加整行可点（本线） |
| `src/global.css` | v0.2：顶栏响应式分档 v2（1312 / 1164） |
| `tests/smoke.cjs` / `shots.cjs` | v0.2：导航 7 项、`#/org`、`#/demand`、Agent 悬浮等断言与新截图 |

> 未修改的既有页面（`Home` / `News` / `Ops` / `Knowledge` / `ArticleDetail`）不受影响，回归由 `smoke.cjs` 的既有断言保障。
>
> **`TopBar` 的分档 v2 属 v0.2**，本线未动；`Org.jsx` 的「本次新增」标注已在本版更正为 v0.2。

---

## I. 我（导出交付专家）实际核实了什么

导出前逐项静态 + 运行时核验，结论如下：

| 核实项 | 方法 | 结果 |
|---|---|---|
| `dist/index.html` 无 `type="module"` | 正则计数 | **0 处** ✅（`file://` 不会被 CORS 拦） |
| 无 `crossorigin` 属性 | 正则计数 | **0 处** ✅ |
| 引用路径为相对 | 提取 `src` / `href` | `./assets/index.js` / `./assets/style.css` ✅ |
| 字体 `url()` 为相对路径 | 提取 CSS 内 `url()` | `url(./roboto-latin.woff2)` 等 4 处，均 `./` ✅ |
| CSS 无外部请求 | `https?://` 计数 | **0 处** ✅ |
| JS 无外部请求 | `fetch` / `XMLHttpRequest` / `WebSocket` / `EventSource` / `sendBeacon` 计数 | **全部 0** ✅ |
| JS 中的 19 处 `http(s)://` | 逐条提取 | 均为 SVG/XML **命名空间**、Babel/React 许可证注释与 dev 报错文档 URL、1 处 mock OAuth callback 字符串——**无运行时网络请求** ✅ |
| 打包为 IIFE | 读取 JS 头部 | `(function(){"use strict";...` ✅ |
| `file://` 下可执行 | jsdom 以 `file:///...` URL `eval` 整包 | **无异常执行**（无 CORS 报错）✅ |
| 交付副本与 `dist` 一致 | 5 个文件 SHA256 比对 | **全部一致** ✅ |
| 冒烟测试 | `node tests/smoke.cjs` | **137 / 137 通过，exit 0** ✅ |

> 说明：jsdom 无真实事件循环，React 的异步挂载不会在 `eval` 后同步完成（`root` 仍为空属正常），因此**运行时渲染的正确性以 `smoke.cjs` 的 137 项断言为准**（它做了正确的 flush）。

---

*交付人：导出交付专家 交付达（Jiao）｜基准日 `EVIDENCE_AS_OF = 2026-09-17`*
