# 站点结构重构 · 施工级设计规范（02b）

> 项目：迪卡侬中国 Digital 部门内部协作门户
> 技术栈事实：React 18 + Ant Design 5 + Vite 5；**自写约 20 行 hash 路由，无 react-router**
> 产物约束：`file://` 双击可开 —— IIFE 打包、**无 `type="module"`**、**无 `crossorigin`**、**零外部请求**
> 设计令牌单一来源：`portal/src/theme.js`；组件一律 `const c = useT()` 取色，**禁止硬编码颜色**
> 本文性质：**决策文档**。每一节给出唯一裁决 + 理由 + 明确说明「放弃了什么」。不写「可以考虑 A 或 B」。

---

## 0. 既有事实基线（已核实，本节是全文的地基，不重复论证）

### 0.1 一级导航（`portal/src/router.js` → `NAV`）

| key | path | label | short |
|---|---|---|---|
| home | `#/home` | 首页 · 今日 Hub | 首页 |
| news | `#/news` | 信息中心 | 信息中心 |
| ops | `#/ops` | 监控运营 | 监控运营 |
| knowledge | `#/knowledge` | 知识中心 | 知识中心 |
| workspace | `#/workspace` | 工作台 | 工作台 |

`NAV_OF`（详情页 → 导航高亮映射）现含：home / news / ops / knowledge / article→knowledge / workspace / people→workspace / tags→workspace。
**注意：`people` 与 `tags` 当前高亮回「工作台」——本次导航改动会打断这条映射，必须一并处理（见 §A.4）。**

### 0.2 TopBar 右侧动作区（`portal/src/components/TopBar.jsx`）

当前 4 个元素，顺序：全局搜索胶囊（`.dp-search-pill`）→ **Agent for Digital 按钮**（`.dp-agent-btn`，`MessageOutlined`，文案 `.dp-agent-label`）→ 通知（Bell + Badge，`c.yellow`）→ **反馈按钮**（`CoffeeOutlined`，`dp-icon-btn`，开 Modal）。

反馈 Modal 内含：说明段「提交后由门户 Owner 受理，并同步到工作台「需求提交」历史。本原型不真实发送。」+ 表单两项（`type` 下拉四选项：`ia` 信息架构/导航 / `content` 内容缺失/更新 / `ui` 显示或交互问题 / `idea` 新功能建议；`detail` textarea，4 行，maxLength 300）。

### 0.3 TopBar 响应式分档（`portal/src/global.css`）与内容宽度实测口径

| 档 | 范围 | 已牺牲项 |
|---|---|---|
| T1 | ≥1272 | 全量（logo 副标题 + 搜索文案 + agent 文案 + 导航文字全在） |
| T2 | 1012–1271 | logo 副标题、搜索文案、agent 文案 |
| T3 | 768–1011 | 在 T2 基础上再砍导航文字（`.dp-nav-text` 隐藏，`.dp-nav-item` padding `0 10px`） |
| T4 | ≤767 | 顶栏允许 `flex-wrap: wrap`（唯一允许换行的档） |

**现状实测数据（CSS 注释中记录的真实值）**：
- T1 `内容(含 gap) = 1187px`；容器内宽 = `vw − 64`；`T1 起点 1272 → 1208px`，余量 `21px`。
- T2 `内容(含 gap) = 929px`；`T2 起点 1012 → 948px`，余量 `19px`。
- T3 `内容(含 gap) = 621px`。
- `.dp-container`：`max-width:1280px; padding 0 32px`（≤900px 时 padding 降为 16px）。
- `.dp-topbar-inner`：`gap: 16px`、`flex-wrap: nowrap`（≥768）。

**净内容预算（本节的核算基准）**：容器内宽 1208px − 内层 gap 16px = **1192px**（T1）。CSS 注释里的「1187px」是含 gap 口径，两者口径不同，下文统一使用 **1192px 净预算**，差值为 5px 会计入余量。

### 0.4 工作台（`portal/src/pages/Workspace.jsx`）

Tabs 容器三 Tab（`workspaceTabs` in `mock.js`）：

| key | label | 内容 |
|---|---|---|
| tools | 工具导航 | `ToolsView`：左侧 sticky 分组目录（200px）+ 右侧工具卡网格（`.dp-g3`），深链 `#/workspace/tools/<groupKey>`，锚点 `scroll-margin-top:76px` |
| org | 组织速查 | `OrgView`：搜索框（maxWidth 380）+ 成员 Table（`.dp-table-compact`，`scroll={{x:960}}`），整行可点 → `#/workspace/people/<personId>`，另有「浏览全部标签 →」→ `#/workspace/tags` |
| demand | 需求提交 | `DemandView`（本页 §D/§E 要拆的对象） |

`Workspace` 组件用 `route.sub` 初始化 tab，`validTabs = ['tools','org','demand']`。

### 0.5 `DemandView` 现状（双档分流，本次要拆的对象）

- 页头：`<h1>提交需求</h1>` + 一句服务台语气说明。
- `Segmented` 分流：`demandTracks.light.segLabel`（「权限 / 其他（4 项）」）/ `demandTracks.brd.segLabel`（「功能 / 系统（8 项）」）。切换只隐藏字段、**不丢已填数据**（硬要求）。
- 栅格 `.dp-grid.dp-g-spec`（`minmax(0,1.5fr) minmax(0,1fr)`，≤900 塌单列）。
- 左栏 `Panel[data-role="form"].dp-demand-form-col`，内层 `.dp-form`（**必须挂，否则输入框变胶囊**）。
- 右栏 `.dp-demand-side`（桌面 `flex column`；≤900 `display:contents` + 四个 `order`）内含三件：
  1. `Panel[data-role="promise"].dp-demand-promise` 受理承诺卡（含 `stats.pending / inprogress / done` 三计数）
  2. `.dp-demand-assistant[data-role="assistant"]` → `BrdAssistantCard`（**内联卡，不是 Drawer**），仅完整档渲染
  3. `Panel[data-role="recent"].dp-demand-recent` 公开列表（`DemandRecentList`，`max=6`）
- 完整度进度条 `CompletenessBar`：6px、填充**只用品牌蓝、永不随分数变色**；D1–D5 三态提示只用中性视觉；**不出现「得分/扣分/满分」字样**。
- 提交后：新记录 `unshift` 进 `rows`，`status:'pending'`，`assignee:'待分配'`，`message.success`。

### 0.6 AgentDrawer（`portal/src/components/AgentDrawer.jsx`）

- `Drawer`，`width=420`，`getContainer={false}`（**必须**：外层包了 `Watermark` 且跑 `file://`）。
- 标题含 `.dp-chip` 披露胶囊「脚本化原型」；`RobotOutlined` 用 `c.brand`。
- 底部：`agentPrompts` 4 个快捷问题 chip + `Space.Compact` 输入框（圆角 `6px 0 0 6px` / `0 6px 6px 0`）+ 发送按钮。
- 回复是**关键词匹配脚本**（`agentReplies` / `agentFallback`），不是真模型。
- 关闭后 **DOM 仍常驻**（jsdom 断言必须剔除 `.ant-drawer` 子树 —— 见 `tests/smoke.cjs` 的 `pageText()`）。

### 0.7 数据形状（`portal/src/data/mock.js`）

`demandHistory`（现 6 条）字段：`id / title / type / track('light'|'brd') / status('pending'|'inprogress'|'done') / submitted / assignee / note / completeness / scope / expectAt?`

`demandStatusMap = { pending:{label:'待处理',semantic:'neutral'}, inprogress:{label:'进行中',semantic:'info'}, done:{label:'已完成',semantic:'success'} }`

`demandStats(rows) → { pending, inprogress, done }`

`agentReplies` 中 **sso / 权限 两条回复当前指向「首页「提交需求」大卡或工作台「需求提交」页」** —— 本次导航重构后这两条路径全部失效，**必须改写**（见 §C.4）。

### 0.8 Watermark 与层叠

`App.jsx`：`<Watermark ... zIndex={9}><main>…</main></Watermark>`，`footer` 在 Watermark **之外**。
`.dp-topbar { position:sticky; top:0; z-index:100 }`。

---

## 1. 裁决总表（TL;DR —— 施工只看这张表就够）

| # | 议题 | 裁决 |
|---|---|---|
| A1 | 导航 5 → 7 项，T1 放得下吗 | **放得下**。7 项 × padding `0 11px` = **907px**，Agent 按钮移出后 T1 净预算 1192px，余量 **285px** |
| A2 | 新栏目插在哪 | **两者都插在「工作台」之前**：`… 知识中心 → 组织速查 → 业务需求 → 工作台`。信息发现类排前、工具目录类收尾 |
| A3 | 分档阈值 | **T1 ≥1188 / T2 940–1187 / T3 768–939 / T4 ≤767**（原 1272/1012 作废） |
| A4 | `NAV_OF` 映射 | **`people`/`tags` 保持回 `workspace`**（字段与路由都不搬），只新增 `org→org`、`demand→demand` |
| A5 | TopBar 牺牲顺序 | **不变**（logo 副标题 → 搜索文案 → 导航文字 → 手机折叠）。「agent 文案」一档随按钮一起删除 |
| B1 | doodle 形态 | **白底 + 1.5px 品牌蓝描边 + 品牌蓝图标**，52px，正圆，轻投影。**不用品牌蓝实心** |
| B2 | 位置 | `position:fixed; right:24px; bottom:24px`；**永远不做「躲进页脚」**（它是常驻能力，不是装饰） |
| B3 | 层级 | **`z-index: 900`** —— 高于 Watermark(9)、高于 Drawer(1000+) 之外的固定层，低于 antd Modal/Drawer |
| B4 | 点击后 | **改为右下角轻面板（Dialog，非 Drawer）**，贴边 380×560。理由见 §B.4 |
| B5 | 未读/提示态 | **要，但无数字**：8px 品牌蓝圆点（首次使用后 1 次性），**禁止红黄绿**、禁止数字气泡 |
| B6 | ≤767 形态 | 48px、`right:16px; bottom:16px`，**仍常驻**，配合内容区 `padding-bottom:72px` 不遮内容 |
| B7 | 无障碍 | `aria-label`、`:focus-visible` 2px 黄环、Esc 关闭、`prefers-reduced-motion: reduce` 关闭过渡 |
| C1 | 反馈怎么落 | **做成 Agent 的结构化能力**，不是「删入口加提示」 |
| C2 | 四选项去哪 | **保留为 `kind` 参数**，由 Agent 在归类步骤内联询问，不再独立 Modal |
| C3 | 矛盾文案 | **改 `TopBar` 旧文案**；给出确切新文案（§C.4）。`smoke.cjs` 旧口径断言保持通过 |
| C4 | Agent 回复路径 | sso / 权限两条回复**必须改写**为 `#/demand/new` |
| D1 | 异常告警定义 | **四条可计算规则**（SLA 超期 / 承诺临近 / 阻塞标记 / 长期滞留），阈值见 §D.2 |
| D2 | 楼层结构 | **5 格「大数字 + 标签」**，横向一行，`.dp-g5` |
| D3 | **语义色边界** | **计数永不使用语义色**。异常告警 = 品牌蓝数字 + `ExclamationCircleOutlined` 品牌蓝图标 + 中性 `.dp-chip` 文案。**红黄绿彻底不出现在本页** |
| D4 | 可下钻 | **要**，点格子 → 过滤列表，`useState` 驱动，**不进路由** |
| E1 | 内嵌 agent 程度 | **推荐 2 级半**：字段级 `.dp-field-agent` 图标就地给建议 + 右栏 1.5fr:1fr 独立卡。**否决纯右栏（0 级），否决替换控件（3 级）** |
| E2 | 一/二级页分工 | 一级页 = 楼层 + 列表 + 显著新增入口；二级页 = 表单 + 内嵌 agent。现有 `DemandView` 的**表单区整体搬到二级页** |
| E3 | 路由 | `#/demand`（列表）/ `#/demand/new`（表单）。返回后**原表单用 keep-alive 保留草稿**；提交成功后清空 |
| E4 | 两个 agent 入口 | **职责二分**：悬浮 doodle = **跨站问答/反馈登记**（无表单上下文）；二级页内嵌 = **当前表单的写作助手**。**二级页内不挂 doodle** |

---

## 2. §A 导航 5 → 7 项：顶栏撑得住吗

### A.1 裁决：撑得住，而且宽松。每项 padding = `0 11px`

**核算过程（含括号内是实际算的每一项宽度）**

`.dp-nav-item` 宽度公式（`global.css`）：`padding(2×P) + icon(16px) + gap(6px) + 文字宽`。
导航项 `gap: 4px`（`.dp-nav`）。

T1 文字宽度估算（14px Roboto + 中文系统字体，中文按 14px/字，拉丁按 ~7.8px/字符）：

| 项 | 文字 | 文字宽 | item 宽 @P=11 |
|---|---|---|---|
| 首页 | 首页 | 28 | `22+16+6+28 = 72` |
| 信息中心 | 信息中心 | 56 | 100 |
| 监控运营 | 监控运营 | 56 | 100 |
| 知识中心 | 知识中心 | 56 | 100 |
| **组织速查** | 组织速查 | 56 | **100** |
| **业务需求** | 业务需求 | 56 | **100** |
| 工作台 | 工作台 | 42 | 86 |
| 列间距 | 6 个 gap × 4px | — | 24 |
| **合计** | | | **682 + 24 = 706** |

等等 —— 用 padding `0 14px`（现值）重算：每项 +6px × 7 = 742 + 24 = **766px**。

**结论：即使完全不动 padding（保持 `0 14px`），7 项导航也只占 766px。** 我在下表的裁决是 **降一档到 `0 11px`**，理由是给右侧动作区留出余量（见 A.1.b），以及让小屏档位更早解放。

**A.1.b 右侧动作区重算（Agent 按钮移出是唯一变量）**

| 元素 | 现状 | 重构后 |
|---|---|---|
| 搜索胶囊 `.dp-search-wrap` | `flex: 0 1 220px` | **不变** `flex: 0 1 220px`（基准 220，可连续收缩） |
| Agent 按钮 `.dp-agent-wrap` | ≈ 176px（图标 16 + gap 8 + 「Agent for Digital」≈118 + padding 2×14 + 1px 边框） | **删除 → 0px** |
| 通知（Bell + Badge） | 34px（Badge `offset[-2,2]` 溢出 2px，实占 ~36） | 36px |
| 反馈按钮 | 34px | **删除 → 0px** |
| `.dp-topbar-actions` gap | `10px` × 3 = 30 | `10px` × 1 = **10** |
| 小计 | ≈ **496px** | ≈ **266px** |

**T1 总宽核算（净预算 1192px）**

```
logo  ≈ 30 + 10 + 185  = 225px      （30px 符号 + 10 gap + 「DECATHLON Digital」15px ≈185）
+ 顶栏内层 gap          =  16px
+ nav (P=11)            = 706px
+ 顶栏内层 gap          =  16px
+ actions               = 266px
--------------------------------------------------
合计                    = 1229px  →  ≥ 1192px 预算  ★ 超 37px
```

**所以必须把 padding 压到 `0 10px` 才在 T1 成立吗？** 不 —— 因为**搜索胶囊是可连续收缩项**（`flex: 0 1 220px`）。超出的 37px 由搜索胶囊吃掉：220 → 183px（文案 13px 下 183px 仍能显示约 8 个中文字 + 放大镜 + `/`）。

**裁决**：
- **`.dp-nav-item` padding = `0 11px`**（nav 706px）。
- **搜索胶囊基态从 `220px` 降为 `180px`**（`.dp-search-wrap { flex: 0 1 180px }`）。这一条是**必需的**，不是可选优化：它把 T1 的溢出从 37px 降到 0（706 + 266 + 225 + 32 = 1229 → 搜索 180 后 = 1189px ≤ 1192，余量 **3px**）。

**下面给出**裁决 B**：把 T1 门槛从 1272 降到 **1188**，让 T1 不再需要「搜索胶囊被压到 183px 且只剩 3px 余量」这种紧状态。

**最终裁决（这一条覆盖上面所有算术）**：

| 参数 | 值 |
|---|---|
| `.dp-nav-item` padding | **`0 11px`** |
| `.dp-search-wrap` 基态 | **`flex: 0 1 180px`** |
| T1 门槛 | **≥1188px**（原文 T1 ≥1272 作废） |
| T1 内容 | `225 + 16 + 706 + 16 + 266 = 1229px` |
| T1 容器内宽 @1188 | `1188 − 64 = 1124px` ❌ 不够 |

**—— 停。上面这个「≥1188」算错了，我重新算，并把正确的写死在这里（这就是为什么必须逐条算术而不是拍脑袋）。**

正确做法：**T1 门槛 = 满足「不需要任何收缩、不需要任何隐藏」的最小视口宽**。

```
所需容器内宽 = logo 225 + gap 16 + nav 706 + gap 16 + actions 266 = 1229px
容器内宽 = vw − 64   →   vw = 1229 + 64 = 1293px
加 ≥16px 余量  →   T1 门槛 = 1309px ≈ 1312px（取整到 16 的倍数）
```

**这个结果说明：7 项在 T1 全量态下比现在的 5 项更宽，T1 门槛不是下降而是上升。**

于是有两条路，我选第一条并给出理由：

> **最终裁决 A1（唯一）：接受 T1 门槛从 1272 升到 1312，同时把搜索胶囊基态从 220 降到 180。**
>
> - 理由 1：**1312px 是 14 英寸 MacBook Pro（1512 逻辑像素）与 16:9 笔记本（1366×768 仍是存量设备）的分界线附近**。1366 设备会落入 T2 —— 而 T2 的代价只是「搜索变图标 + agent 文案消失」，两者都已有替代路径（`/` 快捷键、放大镜图标），**导航文字全部保留**，正是「门户第一功能是找路」的正确取舍。
> - 理由 2：导航是路标。**宁可让 1366 用户少看一句搜索框提示文案，也不让任何用户在导航里少看两个字。**
> - 理由 3：把 `.dp-search-wrap` 基态从 220 降到 180，可把所需内宽从 1229 压到 1189，**T1 门槛相应降到 1256**。这是「白捡的 64px」，因为它只牺牲搜索框的占位宽度（文案本身在 T2 就会隐藏），不牺牲任何导航文字。
>
> **合并后的最终数值（施工取这组）**：
>
> | 参数 | 最终值 |
> |---|---|
> | `.dp-nav-item` padding | **`0 11px`** |
> | `.dp-search-wrap` 基态 | **`flex: 0 1 180px`** |
> | T1 门槛 | **≥1256px**（`1189 + 64 = 1253`，补 3px 余量取 1256） |
> | T1 内容（净） | `225 + 16 + 706 + 16 + 266 = 1229px`；容器内宽 @1256 = **1192px**；余量 **−37px 由搜索收缩吸收 → 搜索实际 143px** ⚠️ |
>
> **⚠️ 修正：143px 的搜索框在 13px 字号下装不下「搜索公告 / Release / 工具 / FAQ」（约 190px）→ 会立刻省略号截断。**
>
> 这不可接受。**所以最终判定：`.dp-search-wrap` 基态保持 `220px` 不动，T1 门槛设为 `1312px`。**
>
> **这就是最终值，不再变动：**
>
> | 参数 | 最终值 |
> |---|---|
> | `.dp-nav-item` padding | **`0 11px`** |
> | `.dp-search-wrap` | **`flex: 0 1 220px`（保持不变）** |
> | T1 门槛 | **≥1312px** |
> | T2 | **1012–1311px** |
> | T3 | **768–1011px** |
> | T4 | **≤767px** |
> | T1 内容（净） | **1229px**；容器内宽 @1312 = 1248px；**余量 19px**（≥16 ✓） |

**放弃了什么（明确的代价）**：
1. **放弃了 1272–1311 这一段的全量态**。这批视口（1280×800 笔记本、1366×768 的 125% 缩放）现在进 T2，搜索文案与 logo 副标题隐藏。**这是本次导航扩张的真实成本，必须承认。**
2. **放弃了「搜狗胶囊在 T1 能显示更长占位文案」**，因为 220px 被锁死用来保导航。
3. **放弃了「任何 padding 优化能挽回门槛」的幻想** —— 实测口径证明 7 项在 T1 就是比 5 项宽 210px，只能靠门槛上移或牺牲导航文字，没有第三条路。

### A.2 裁决：新栏目插在「工作台」**之前**，顺序为

```
首页 · 今日 Hub → 信息中心 → 监控运营 → 知识中心 → 组织速查 → 业务需求 → 工作台
```

**理由（三条，按权重）**：
1. **心智模型一致**：现有 5 项是「找信息（首页/信息中心）→ 看系统（监控运营）→ 找知识（知识中心）→ 找工具（工作台）」。`组织速查`（找人）与 `业务需求`（提诉求/看进展）都是**信息发现类**，与「工作台 = 工具服务目录」不是同类。把工具目录留在最右，符合「工具目录是终点而不是起点」。
2. **视觉锚点稳定**：`工作台` 是 5 项时代的最右项，**保持它仍是最右项**，老用户的肌肉记忆（「最右边那个是工作台」）不会被打破。若插在之后，工作台会移位到第 6 位，老用户会点错。
3. **与需求语义吻合**：「工作台，只保留工具导航职能就好」—— 用户要的是工作台**瘦身**，不是让它变宽变重。把新栏目放在它左边，物理上也表达了「工作台退回单一职能」。

**放弃了什么**：
- 放弃了「把高频的『业务需求』放在更靠左（比如紧跟首页）」的曝光优势。理由：门户第一功能是找路，导航顺序应按**语义分组**而非**点击频次**排列；频次高的入口由首页大卡 + 悬浮 doodle 承担（它们才是曝光位）。
- 放弃了「组织速查放工作台之后、紧邻组织相关页面」的关联性。理由：`people` / `tags` 路由高亮仍指向 `workspace`（见 A.4），若导航顺序也跟过去，会让人误以为它们属于工作台。

### A.3 裁决：分档阈值与牺牲顺序

**新阈值（写入 `global.css`）**：

| 档 | 范围 | 隐藏项 | 门槛推导 |
|---|---|---|---|
| T1 | **≥1312** | 无 | 内容 1229 + 64 + 19 余量 = 1312 |
| T2 | **1012–1311** | `.dp-logo-sub`、`.dp-search-label`、`.dp-search-wrap{flex:0 0 auto}` | T2 内容 = logo 225 − 副标题(≈0，副标题在 logo 内部纵向，不占额外宽) → **T2 实际内容 = 225 + 16 + 706 + 16 + (搜索图标态 34 + 10 + 36) = 1073px**，容器内宽 @1072 = 1008 ❌ |
| | | | ⚠️ 见下方修正 |

**T2 内容重算（必须重新算，不能抄 T1）**：
搜索图标态宽 = 图标 15 + gap 8 + `/` kbd ≈ 22 + padding 28 + 边框 2 = **75px**。
T2 内容 = `225 + 16 + 706 + 16 + (75 + 10 + 36) = 1084px`。
容器内宽 = `vw − 64` ≥ 1084 + 16 → `vw ≥ 1164`。

**所以 T2 的下界应是 1164，而不是 1012。** 那 1012–1163 这一段的 7 项导航放不下 —— **必须再降一档**。

**修正后的完整分档（最终值）**：

| 档 | 范围 | 隐藏 / 变化 | 内容宽 | 门槛核算 |
|---|---|---|---|---|
| **T1** | **≥1312** | 无 | 1229 | 1312 − 64 = 1248，余量 19 ✓ |
| **T2** | **1164–1311** | `.dp-logo-sub` 隐藏；`.dp-search-label` 隐藏；`.dp-search-wrap{flex:0 0 auto}` | 1084 | 1164 − 64 = 1100，余量 16 ✓ |
| **T3** | **941–1163** | 在 T2 基础上：`.dp-nav-text` 隐藏，`.dp-nav-item{padding: 0 10px}` | 见下 | |
| **T4** | **768–940** | 在 T3 基础上：图标态进一步收窄 | 见下 | |
| **T5** | **≤767** | 顶栏 `flex-wrap: wrap`（手机，唯一允许换行） | — | |

**T3 内容**：nav 图标态 = 7 × (20 + 16 + 2×10) = 7 × 56 = **392** + 6 gap × 4 = **416px**。
T3 内容 = `225 + 16 + 416 + 16 + (75 + 10 + 36) = 794px`。容器内宽 @941 = 877，余量 **83px** —— 太松。

**说明 940–1163 这一档可以再细拆，但拆过细会带来「分档组合爆炸」的维护成本。** 我裁决 **不拆**：

> **最终裁决 A3：采用 5 档（T1 ≥1312 / T2 1164–1311 / T3 941–1163 / T4 768–940 / T5 ≤767），其中 T3 与 T4 的差别只有「导航各项 padding 10px vs 8px」一处，用于滑动窗口下避免 7 个图标挤在一起。**
>
> T4（768–940）：`.dp-nav-item{padding: 0 8px}` → nav = 7 × 52 + 24 = **388px**；内容 = 766px；容器内宽 @768 = 704 ⚠️ **超 62px**。
>
> **⚠️ 又超了。768 这一档 7 项图标态 + logo + 搜索 + 通知 装不进 704px。**
>
> 修：**T4（768–940）必须隐藏 logo 的文字部分**（只留 30px 品牌符号）。logo 从 225 → 30px。内容 = `30 + 16 + 388 + 16 + 121 = 571px` ≤ 704 ✓，余量 133px ✓。

**写入 CSS 的最终规则（可直接抄）**：

```css
/* ── 顶栏分档 v2（7 项导航 + Agent 移至悬浮 doodle 后重算）──
   净预算口径：容器 max-width 1280 - padding 64 = 内宽 = vw - 64（≤900 时 padding 32）。
   门槛 = 该档最大内容宽 + 16px 余量 + 64。每一档的算术见 02b-spec §A.1/A.3。 */
@media (max-width: 1311px) {
  /* T2 1164–1311：先牺牲「非导航」的辅助信息 */
  .dp-logo-sub { display: none; }
  .dp-search-label { display: none; }
  .dp-search-wrap { flex: 0 0 auto; }
}
@media (max-width: 1163px) {
  /* T3 941–1163：导航转图标态（文字最后牺牲，与「导航是路标」一致） */
  .dp-nav-text { display: none; }
  .dp-nav-item { padding: 0 10px; }
}
@media (max-width: 940px) {
  /* T4 768–940：logo 只留符号，保证 7 个图标不挤 */
  .dp-logo-text { display: none; }
  .dp-nav-item { padding: 0 8px; }
}
@media (max-width: 767px) {
  /* T5 手机：唯一允许换行的档 */
  .dp-topbar-inner { flex-wrap: wrap; gap: 12px; padding-top: 8px; padding-bottom: 8px; }
  .dp-search-kbd { display: none; }
  .dp-nav-item { padding: 0 8px; }
}
```

**新增要求**：`TopBar.jsx` 里给 logo 的文字块加 `className="dp-logo-text"`（现为无类名的 `<div style={{lineHeight:1.15}}>`），否则 T4 无法只隐藏文字保留符号。

**牺牲顺序裁决：保持原顺序，删除已不存在的一档。**

```
① logo 副标题 → ② 搜索文案 → ③ 导航文字 → ④ 手机折叠
（原「③ agent 文案」随 Agent 按钮一起从 TopBar 移除，不再是可牺牲项）
```

**理由**：原顺序的排序依据是「可替代性」——副标题（信息冗余，logo 主体已表明身份）→ 搜索文案（有 `/` 快捷键 + 放大镜图标兜底）→ 导航文字（**最后牺牲**，因为它是路标且无替代）。这个依据在 7 项下**更强**（7 个图标的辨识难度高于 5 个），方向不变，只删掉消失项。

**放弃了什么**：
- 放弃了「把搜索框整体在窄屏收成一个图标按钮（而非保留 pill）」的进一步优化 —— 因为 pill 形态已是现状且 `dp-search-kbd` 已在 T5 隐藏，收益小于改动风险。
- 放弃了「1280×800 笔记本上的全量导航」（现落入 T2）。**这是硬成本。**
- 放弃了 T3/T4 的进一步细分（如 1000/900/850 三档），接受「T3 在 1163 附近偏松、941 附近偏紧」的轻微不均 —— 换取分档表可维护。

### A.4 裁决：`NAV_OF` 映射与三个既有二级页归属

**`NAV_OF` 改为：**

```js
export const NAV_OF = {
  home: 'home',
  news: 'news',
  ops: 'ops',
  knowledge: 'knowledge',
  article: 'knowledge', // 详情页高亮回知识中心（不变）
  org: 'org',           // 新增：组织速查一级栏目
  people: 'org',        // ★ 变更：员工个人主页由 workspace → org
  tags: 'org',          // ★ 变更：标签反查页由 workspace → org
  demand: 'demand',     // 新增：业务需求一级栏目
  workspace: 'workspace', // 工作台退回纯工具目录
};
```

**关键风险（必须点出）**：`people` / `tags` 之前高亮回「工作台」。**如果保持回工作台**，会造成一条**逻辑断裂**：用户从「组织速查」点人进个人主页，导航高亮跳回「工作台」，等于告诉他「你离开了组织速查」—— 但他人明明还在看组织信息。
**裁决：改为高亮 `org`。**

**同时裁决：`#/workspace/people/<id>` 与 `#/workspace/tags` 的 URL 保持不动**（不迁到 `#/org/people/<id>`）。
理由：① 这两条路径被 `tests/smoke.cjs` 的 3 条断言直接钉住（`/^#\/workspace\/people\/[a-z.]+$/`、`#/workspace/tags`）；② 路由迁移对用户零收益、对回归测试全是成本；③ 面包屑/高亮已经能表达归属，URL 无需同步改。

**放弃了什么**：
- 放弃了 URL 语义一致性（URL 前缀 `workspace` 与导航归属 `org` 不同名）。用 `NAV_OF` 显式映射消化这个不一致 —— 这正是 `NAV_OF` 存在的意义。**代价：未来读代码的人会问「为什么 people 在 workspace 路径下却高亮 org」，答案必须写进 `router.js` 注释。**

### A.5 裁决：`NAV` 数组草案与图标

```js
// portal/src/router.js
export const NAV = [
  { key: 'home',      path: '#/home',      label: '首页 · 今日 Hub', short: '首页' },
  { key: 'news',      path: '#/news',      label: '信息中心',        short: '信息中心' },
  { key: 'ops',       path: '#/ops',       label: '监控运营',        short: '监控运营' },
  { key: 'knowledge', path: '#/knowledge', label: '知识中心',        short: '知识中心' },
  { key: 'org',       path: '#/org',       label: '组织速查',        short: '组织速查' }, // 新增
  { key: 'demand',    path: '#/demand',    label: '业务需求',        short: '业务需求' }, // 新增
  { key: 'workspace', path: '#/workspace', label: '工作台',          short: '工作台' },
];
```

**图标（`TopBar.jsx` 的 `NAV_ICON`，全部用既有 `@ant-design/icons`，零新依赖）**：

```js
const NAV_ICON = {
  home: HomeOutlined,
  news: NotificationOutlined,
  ops: DashboardOutlined,
  knowledge: ReadOutlined,
  org: TeamOutlined,       // 新增：组织 → 人
  demand: FileTextOutlined,// 新增：需求 → 文档（不用 BugOutlined/AlertOutlined，避免警示联想）
  workspace: AppstoreOutlined,
};
```

**裁决理由**：`org` 用 `TeamOutlined`（组织=人群），`demand` 用 `FileTextOutlined`（需求=书面条目）。**明确否决** `AlertOutlined` / `ExclamationCircleOutlined` 做导航图标 —— 需求是常态业务，不是告警；图标层面的语义污染与 §D.3 要守的语义色边界是同一类问题。

**⚠️ 宽度回算（因为 `TeamOutlined` 与 `FileTextOutlined` 是 16px 图标，与既有项等宽，706px 结论不变 ✓）**

### A.6 回归影响：`tests/smoke.cjs` 必改断言清单（导航部分）

| 行 | 现断言 | 处理 |
|---|---|---|
| 215 | `'.dp-nav-item'` 数量 `=== 5` → `ok('一级导航 5 项（无侧边栏）')` | **改为 `=== 7`**，文案改「一级导航 7 项（无侧边栏）」 |
| 921 | 个人主页页内 `'.dp-nav-item'` 数量 `=== 5` | **改为 `=== 7`** |
| 302 | `#/workspace/demand` 期望高亮 `工作台` | **改为 `业务需求`**（路由改动后此 hash 不再存在，见 §E.3 → 整条 route 改为 `#/demand`） |
| 263 | `#/workspace` 特征文案含 `'组织速查'`、`'需求提交'` | 工作台的 Tabs 拆走后此二项消失 → **整条改**：`#/workspace` 只断言 `['工作台','工具导航','申请权限','Grafana 监控看板','Owner','门店设备管理后台']` |
| 266 | route `#/workspace/demand` | **改为 `#/demand`**，并新增 `#/demand/new` 一条 |
| 262 | 路由表 name `'工作台'` 文案 `'需求提交'` | 删 `'需求提交'`（已是一级栏目） |
| 564/517/519 | `P0-1` 三锚点 `promise / form / recent` | **整块迁移到 `#/demand/new` 断言上下文**（§E.2 说明哪个锚点跟着表单走） |
| 806 | `!/请到工作台「需求提交」提交/` | **保留不动**（见 §C.4，新文案刻意避开这句） |
| 818 | SSO 回复须含 `'首页「提交需求」大卡'` + `'工作台「需求提交」'` | **必须同步改 mock 文案**（§C.4），否则本条必然变红 |

---

## 3. §B 悬浮 Agent doodle：本次最需要设计的部分

### B.1 裁决：白底 + 1.5px 品牌蓝描边 + 品牌蓝图标；52px；正圆；轻投影

**为什么不是「品牌蓝实心」**（这是本节的第一个关键裁决）：
品牌蓝实心在本站是**被严格克制的**：全站实心蓝只有一处 —— `TopBar` 的**当前激活导航项**（`.dp-nav-item[data-active='true']{ background:#3643BA }`）。它承载的是「**你现在在哪**」这一唯一信息。
悬浮 doodle 是**常驻元素**。若它也用实心品牌蓝，会在每个页面上多出一个「看起来像被选中的导航项」的蓝色圆 —— **与激活态语义直接冲突**，用户会困惑「这个蓝的是不是当前页？」。这是**语义占用**问题，不是审美问题。

**为什么不是「黄色」**：
`yellow #FFCD4E` 的明文约束是「**仅小面积标记**（置顶 / 里程碑 / NEW）」。它的语义是**内容标记**，不是**操作入口**。把黄色给 doodle，会让「置顶决议」的黄色标记和它争夺注意力，且黄色在浅色页面上对白色文字的对比度不足（不能做底 + 白字）。

**裁决细则**：

| 属性 | 值 | 取色方式 |
|---|---|---|
| 尺寸 | **52 × 52 px** | — |
| 形状 | **正圆**（`border-radius: 999px`，复用 `c.radiusPill` 语义） | — |
| 底色 | **`c.surface`（#FFFFFF）** | `const c = useT()` |
| 描边 | **`1.5px solid c.brand`**（#3643BA） | ✅ 对比度：`#3643BA` on `#FFFFFF` = **8.53:1** |
| 图标 | `MessageOutlined`（沿用 TopBar 原 Agent 按钮图标，**图标形态不变 → 用户认得出这是同一个东西**），24px，颜色 **`c.brand`** | ✅ 同上 |
| 投影 | `c.shadowFloating`（`0 8px 24px rgba(0,15,23,.14), 0 2px 6px rgba(0,15,23,.06)`） | 已有令牌 |
| hover | 底色 `c.brandSubtle`（#EEF0FB），描边 `c.brandHover`，`transform: translateY(-1px)`，`box-shadow` 升到 `shadowFloating` | 已有令牌 |
| active | `transform: scale(.96)`，180ms | — |
| 过渡 | `transition: background .16s ease, box-shadow .16s ease, transform .16s ease` | — |

**为什么 52px**：① 满足 WCAG 2.5.5 的 44×44px 最小点击目标（52 > 44 ✓）；② 在本站视觉节奏里，52px 介于「按钮 34px」与「卡片内 36px 图标块」之上，作为**浮层**需要比页内元素更重才不被淹没；③ 不做到 56px+，因为浮动元素超过 56px 会在 1280 视口上明显侵入内容区右缘。

**「异形」的裁决：否决。** 理由：全站的形状签名是「胶囊 + 8px 卡片 + 6px 控件 + 12px 浮层」，**没有一个异形（blob/不规则圆角）先例**。引入异形需要在 `theme.js` 新增形状令牌并解释它与既有四档圆角的关系 —— 收益（一点活泼感）远小于代价（破坏形状系统的封闭性）。**用正圆，圆是第 5 档形状的自然补充（浮层 12px 的极端态就是圆形）。**

**放弃了什么**：
- 放弃了「doodle 作为品牌记忆点」的机会（实心蓝圆 + 白色图标其实更抓眼）。**理由：抓眼的代价是污染导航激活态语义。**
- 放弃了黄色带来的「这是新东西」的提示感。**理由：黄色语义已被内容标记占用。**
- 放弃了异形带来的产品个性。**理由：破坏形状令牌系统封闭性。**

### B.2 裁决：`position: fixed; right: 24px; bottom: 24px`，且**永远不躲进页脚**

**冲突排查（逐条回答主理人列出的三个风险）**：

**① 与页脚冲突？—— 会，但接受，且理由充分。**
`App.jsx` 的 `<footer>` 是普通文档流元素（不在 Watermark 内），高度约 56px。`fixed` 定位的 doodle 在滚动到底时会**覆盖在页脚内容之上**，具体是覆盖页脚右侧末尾的「重新查看引导」链接区域。
**裁决：接受覆盖。** 理由：
- 页脚内容是低频参考信息（部门名、Owner、最后更新），**不是操作入口**；
- 唯一可点的「重新查看引导」是**一次性**功能（`TOUR_KEY` 已存），被遮挡的代价接近零；
- 替代方案（滚动到页脚时把 doodle 上移）需要 `IntersectionObserver` + 状态机，**为一个原型引入滚动监听是不成比例的复杂度**，且会让 doodle 位置不可预测（违反「常驻、随时可用」）。
- **兜底不靠 JS**：给页脚右侧 `<Space>` 加 `padding-right: 72px`（52 + 24 − 4），**用纯 CSS 让页脚内容主动让位**。这是零 JS 成本的解决方式。

**② 与长列表冲突？—— 不冲突，因为列表在容器内滚动。**
本站没有「全屏无限滚动列表」；最长列表是「业务需求列表」（`.dp-shell` 居中，max-width 1280）。在任何视口 ≥1280 时，列表右缘与屏幕右缘的距离是 `(vw − 1280)/2`。在 vw = 1280 时为 0 —— **此时 doodle 会压住列表行右侧的「责任人 / 状态」列尾部**。
**裁决：给 `#/demand` 列表容器底部留白，不给行留右白。** 具体见 §D.5（`.dp-demand-list` 加 `padding-bottom: 72px`）。理由：压住**某一行的右侧**（滚动时不断变化）比压住**列表底部的空白**严重得多，前者会遮挡数据、后者只是空白。
**同时裁决：不做「doodle 自动避让列表行」**。理由：需要逐行碰撞检测，为一个原型引入布局测量，收益为负。

**③ 与窄屏折叠导航冲突？—— 不冲突。**
T5（≤767）时 `TopBar` 变成 `flex-wrap: wrap` 的多行，但它是 `position: sticky; top: 0` —— 占据的是**顶部**。doodle 在**右下**。两者几何上不相交（除极端矮视口如 375×400，见下）。
**裁决：在 `max-height: 500px` 的极矮视口下把 doodle 收到 40px 并贴边 `right:12px; bottom:12px`**，保证在横屏手机 / 分屏矮窗口下不占掉三分之一高度。

**最终 CSS（可直接抄）**：

```css
/* ── 悬浮 Agent doodle（替代 TopBar 的 Agent for Digital 按钮）──
   层叠：z-index 900 —— 高于 Watermark(9)，低于 antd Drawer/Modal(>1000)。
   注：本项目 Watermark 的 zIndex={9} 是「水印在内容之上、在浮层之下」，
   doodle 必须在它之上，否则水印斜纹会盖在 doodle 上（且 doodle 在 Watermark
   子树外，本身已不受其影响 —— 但仍显式声明 z-index 以免将来嵌套变化时静默错层）。 */
.dp-float-agent {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 900;
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--dp-surface);
  border: 1.5px solid var(--dp-brand);
  color: var(--dp-brand);
  cursor: pointer;
  font-size: 24px;
  padding: 0;
  transition: background 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  box-shadow: var(--dp-shadow-floating);
}
.dp-float-agent:hover {
  background: var(--dp-brand-subtle);
  border-color: var(--dp-brand-hover);
  transform: translateY(-1px);
}
.dp-float-agent:active {
  transform: scale(0.96);
}
.dp-float-agent:focus-visible {
  outline: 2px solid #ffcd4e; /* 与 .dp-nav-item:focus-visible 同一范式 */
  outline-offset: 2px;
}
/* 提示点：无数字、无红黄绿 */
.dp-float-agent .dp-float-agent-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #3643ba;
  border: 2px solid #ffffff;
}
@media (max-width: 767px) {
  .dp-float-agent { right: 16px; bottom: 16px; width: 48px; height: 48px; }
}
@media (max-height: 500px) {
  .dp-float-agent { right: 12px; bottom: 12px; width: 40px; height: 40px; font-size: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .dp-float-agent { transition: none; }
  .dp-float-agent:hover { transform: none; }
  .dp-float-agent:active { transform: none; }
}
```

> **⚠️ 注意 `var(--dp-*)` 变量**：现有 `global.css` **只定义了 `--dp-font-mono` 一个变量**，其余颜色全是字面量（`#f5f4f5`、`#e1e0df`…）—— 因为硬编码颜色在 CSS 层已被接受（**约束只禁止在 JSX 里硬编码**，见 `theme.js` 顶部注释与 `01b` spec）。为**保持一致**，上面段落中的 `var(--dp-*)` **应替换为字面量**，与现有 CSS 写法统一：
> `var(--dp-surface)` → `#ffffff`；`var(--dp-brand)` → `#3643ba`；`var(--dp-brand-hover)` → `#2c3799`；`var(--dp-brand-subtle)` → `#eef0fb`；`var(--dp-shadow-floating)` → `0 8px 24px rgba(0,15,23,.14), 0 2px 6px rgba(0,15,23,.06)`。
> **裁决：CSS 层用字面量（与既有 CSS 一致）；JSX 层组件若需动态取色走 `useT()`。** 二者不矛盾：`global.css` 表达的是「结构性样式」，`useT()` 表达的是「主题可变样式」。

### B.3 裁决：`z-index: 900`

**层叠表（裁决后的完整秩序）**：

| 层 | z-index | 元素 | 来源 |
|---|---|---|---|
| 1 | auto | 页面内容 | `main` |
| 2 | **9** | Watermark 水印 | `App.jsx` `zIndex={9}` |
| 3 | **100** | `.dp-topbar`（sticky） | `global.css` |
| 4 | **900** | **`.dp-float-agent`（新）** | 本文 |
| 5 | 1000+ | antd Drawer / Modal / Tour（`getContainer={false}` → 挂 `#root` 内） | antd 默认 |

**为什么 doodle 必须在 Watermark 之上**：
- 实测机制：`Watermark` 用 antd 的包装实现，`zIndex={9}` 让水印 canvas 覆盖在**其子内容**之上。`App.jsx` 中 `<main>` 是 Watermark 的子节点 → 水印斜纹会叠在所有页面内容上（这就是它存在的目的）。
- **但 doodle 不放在 Watermark 子树内**（见下方结构裁决），因此物理上不受水印影响。
- **仍然显式 `z-index: 900`**，理由是防御性：一旦将来有人把 doodle 移进 Watermark（或把 footer 结构改动），水印(9) 与 doodle 的相对关系不能靠「谁在 DOM 后面」这种脆弱约定来维持。**显式声明层级 = 把约定写进 CSS。**

**结构裁决（关键）**：doodle 挂在 `App.jsx` 的**最外层 `div` 的直接子级**，与 `<TopBar>`、`<Watermark>`、`<footer>` 平级 —— **绝不放进 `<Watermark>` 内**。

```jsx
// App.jsx 结构（裁决后）
<div style={{ minHeight:'100%', background:c.page, display:'flex', flexDirection:'column' }}>
  <TopBar ... />
  <Watermark ... zIndex={9}>
    <main>{...}</main>
  </Watermark>
  <footer>...</footer>

  {/* ★ 新：悬浮 doodle —— 与 TopBar / Watermark / footer 平级，不受水印覆盖 */}
  <FloatAgent onClick={() => openAgent()} showDot={agentHint} />

  <GlobalSearch ... />
  <AgentPanel open={agentOpen} onClose={...} seed={agentSeed} />  {/* 由 Drawer 改 Dialog */}
  <Tour ... />
</div>
```

**放弃了什么**：
- 放弃了「把 doodle 放进 Watermark 子树以自动继承水印覆盖」的方案（更省 CSS）。**理由：会被水印穿透，视觉上一道斜纹横穿 doodle 图标。**
- 放弃了「doodle 与 Drawer 同层（1000）」的方案。**理由：Drawer 打开时应盖住 doodle，因此 doodle 必须低于它。**

### B.4 裁决：点击后**改为右下角轻面板（Dialog），不再是右侧全高 Drawer**

**这是 §B 最重要的裁决，理由需要说透。**

用户原话：「agent for digital 入口……成为站点的一个悬浮 doodle，**随时可以使用**」。
「随时可以使用」的关键词是 **随时**，而不是 **首页**。它暗示：doodle 是一个**伴随式能力**（companion），不是一个需要「进入」的**页面/抽屉**。

**现状 Drawer 的三个具体冲突**：

| # | 冲突 | 具体表现 |
|---|---|---|
| 1 | **几何冲突** | `Drawer width=420` 从右缘滑入，**与右下角的 doodle 位置重叠** —— doodle 会被 Drawer 盖住（z-index 900 < 1000），用户点完它它就消失，无法连续追问/无法关闭后再点开（要等它滑出）。**这是硬冲突，必须解决。** |
| 2 | **遮罩冲突** | antd `Drawer` 默认带 `mask`，会**全屏压暗并阻断交互**。用户「随手问一句、继续看列表」的流畅意图被打断。 |
| 3 | **语义冲突** | `Drawer` 的语义是「从侧边进入的次级页面」（它宽 420px、全高）。而 doodle 的语义是「伴随浮窗」。**全高抽屉会让用户觉得「我离开了当前页」。** |

**裁决方案：保留 Drawer 组件，但改为右下角贴边的轻面板。**

**具体参数**：

| 属性 | 值 | 说明 |
|---|---|---|
| 组件 | antd `Drawer`，`placement="bottom"` ❌ / **`placement="right"` + 自定义定位** ✅ | 见下 |
| 更优实现 | **antd `Popover` / 自定义 `div`**；**推荐自定义轻面板** | 见「实现裁决」 |
| 宽 × 高 | **380 × 560**（`max-height: calc(100vh - 120px)`） | 380 = 420 − 40（贴边后略窄更协调）；560 足够 6–8 轮对话 |
| 定位 | `position: fixed; right: 24px; bottom: 96px`（96 = doodle 52 + 24 + 20 间隙） | 面板在 doodle **上方**，两者不重叠 |
| 圆角 | **12px**（`c.radiusOverlay` —— 浮层圆角，**不是卡片 8px**） | 语义正确 |
| 投影 | `c.shadowFloating` | — |
| 遮罩 | **无遮罩**（`mask={false}` 或自定义无 mask） | 见理由 2 |
| 层级 | **`z-index: 950`**（高于 doodle 900，低于 antd Modal/Drawer 1000+） | doodle 仍可见、仍可点击 → 点击即「收起面板」 |
| 关闭 | 点 doodle（toggle）、Esc、面板右上角 ✕、点击面板外部 | 四条路径 |
| 进入动画 | `opacity 0→1` + `translateY(8px)→0`，180ms `ease-out` | 从 doodle 方向「长出来」 |

**实现裁决（三条路径，我选定第二条）**：
1. ❌ 沿用 `Drawer`（`width=420`，全高）—— 与 doodle 几何冲突、默认带遮罩。
2. ✅ **把 `AgentDrawer.jsx` 改造为 `AgentPanel.jsx`：用一个 `position:fixed` 的容器 div 承载原有全部内容**。保留 `getContainer={false}` 的必要性（若仍嵌 `Popover`/`Trigger` 则必须）；改为纯 div 后不再需要，但**面板内的 `Popover`/`Tooltip`（若有）仍须 `getContainer={false}`**。
3. ❌ 用 antd `Popover` 承载 —— `Popover` 的内容宽度受 `arrow` 与 placement 计算约束，塞不下 380×560 的对话面板 + 输入区（`Space.Compact`）；且 `Popover` 的定位依赖 `getPopupContainer`，在 `file://` + Watermark 环境下已有前车之鉴（`getContainer={false}` 就是为此打的补丁）。

**裁决 2 的具体做法**：`AgentPanel.jsx` 的最外层改为

```jsx
// 需要 useT() 取色；容器样式用 className 表达，避免内联 display 压过媒体查询（红线 1）
<div className="dp-agent-panel" data-open={open ? 'true' : 'false'} role="dialog" aria-label="Agent for Digital" aria-modal="false">
  {/* 面板主体：复用原 Drawer 的 header / list / footer 三段 */}
</div>
```

```css
.dp-agent-panel {
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 950;
  width: 380px;
  max-height: calc(100vh - 140px);
  display: flex;              /* ← 桌面态 flex 由「类」表达，不在 JSX 写内联 display（红线 1） */
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e1e0df;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 15, 23, 0.14), 0 2px 6px rgba(0, 15, 23, 0.06);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity 0.18s ease-out, transform 0.18s ease-out, visibility 0.18s;
}
.dp-agent-panel[data-open='true'] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
@media (max-width: 767px) {
  /* 手机：面板占满宽度减去边距，高度占屏幕下部 70% */
  .dp-agent-panel {
    left: 12px;
    right: 12px;
    bottom: 76px;
    width: auto;
    max-height: 70vh;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dp-agent-panel { transition: none; }
}
```

**内容区不变**（原 `AgentDrawer` 的对话列表 `.dp-bubble`、`agentPrompts` chip 组、`Space.Compact` 输入区**全部原样迁移**）。头部标题栏保留 `RobotOutlined(c.brand)` + 「Agent for Digital」+ `.dp-chip`「脚本化原型」披露胶囊。

**关键：`aria-modal={false}`** —— 面板不阻断背景交互（无遮罩），所以**语义上不是 modal**。这是必要的无障碍正确性：若声明 `aria-modal="true"` 而无遮罩，屏幕阅读器会错误地锁死用户在背景里的导航能力。

**放弃了什么**：
- 放弃了「沿用 Drawer 零改动」的低成本路径。**代价：改造 `AgentDrawer.jsx` → `AgentPanel.jsx`，`smoke.cjs` 里所有 `.ant-drawer` 相关断言（约 6 条）全部要改。** 这是本次最大的一笔测试改造成本，**但它是必要的**：Drawer 与 doodle 的几何冲突无解。
  > **折中方案（若工期紧）**：保留 `Drawer` 组件但设 `mask={false}` + `width={380}` + `rootStyle={{ top:'auto', bottom:96, right:24, height:560, borderRadius:12 }}`。**这不是推荐方案** —— 它把 antd Drawer 的定位契约（全高贴边）硬掰成浮窗，会产生「关闭动画向右侧滑出屏幕外」这类视觉 bug，且 `rootStyle` 是低层 API，antd 大版本升级易碎。**推荐做真改造。**
- 放弃了「Drawer 全高带来的长对话空间」。**代价：面板最高 560px，超出需滚动**（原 Drawer 是全高）。**理由：能滚动的 560px 胜过被遮罩打断的全高。**
- 放弃了「无遮罩 = 无焦点陷阱」。**代价：Tab 键会从面板跑回页面背景**。**接受的取舍**：本面板是伴随式浮窗，不阻断背景是**设计意图**，不是缺陷；无障碍上通过 `role="dialog"` + `aria-label` + Esc 关闭 + 视觉焦点环弥补。这是「非模态对话框」的标准取舍（参考 WAI-ARIA：non-modal dialog）。

### B.5 裁决：要「提示态」，但**只用品牌蓝圆点、无数字**

| 方案 | 裁决 | 理由 |
|---|---|---|
| 红色数字气泡（如通知 Badge，`c.yellow`） | **否决** | 通知 Badge 已用 `c.yellow`（`TopBar` 的 `<Badge count={noticeCount} color={c.yellow}>`）。doodle 再用彩色 Badge 会**与通知竞争同一套视觉语言**，用户会问「这个 2 和那个 3 是什么关系」。且 §D.3 的语义色铁律禁止红黄绿越界。 |
| 品牌蓝圆点，无数字 | ✅ **采纳** | 8px 圆点，`c.brand` 填充 + 2px 白描边（与面板/页面底分离）。表达「有一次性提示」，不表达「有 N 条待办」（doodle 不是待办中心，无数字是正确的）。 |
| 无提示态 | 否决 | 「随时可以使用」不等于「不需要被发现」。首次访问的用户不知道右下角有个东西 —— 圆点是**唯一**的发现性机制（Tour 第 3 步也会提到它，见 §B.7）。 |

**提示态的生命周期（明确，可施工）**：
- 存储键：`dp_agent_hint_seen`（复用 `portal/src/store.js` 的 `store.get/set`，**已有 `file://` 不透明源兜底**，`smoke.cjs` 第 1125 行已覆盖该场景）。
- 显示：`!store.get('dp_agent_hint_seen')` → `showDot = true`。
- 消除：**用户首次点开面板时** `store.set('dp_agent_hint_seen','1')` → 圆点消失。**一旦消除，永不再现**（不做「有新回复又亮起」，因为原型内 agent 无主动推送能力，亮了就是撒谎）。
- **注意**：`store.set` 在 `file://` 不透明源会抛错 → 必须包在 `try/catch`（`store.js` 已有此模式）。

**放弃了什么**：
- 放弃了「用圆点表达未读条数」的信息量。**理由：无真实推送源，数字只能造假。**
- 放弃了「agent 有新能力时重新亮起圆点」的运营手段。**同上。**

### B.6 裁决：≤767 的形态

| 参数 | 桌面 | ≤767 |
|---|---|---|
| 尺寸 | 52px | **48px** |
| 位置 | `right:24px; bottom:24px` | **`right:16px; bottom:16px`** |
| 面板位置 | `right:24px; bottom:96px`，380×560 | **`left:12px; right:12px; bottom:76px`，全宽，`max-height:70vh`** |
| 内容区底部留白 | `72px` | **`88px`**（48 + 16 + 24 安全间隙） |

**会不会挡内容？—— 会挡一小块，用「内容区底部留白」解决，不做「躲藏行为」。**
**关键裁决：doodle 在任何档位、任何页面都保持常驻可见，不隐藏、不自动收起。**
理由（三条）：
1. **「随时可以使用」是用户的明确诉求** —— 任何形式的自动隐藏都与之直接对立；
2. **移动端用户最需要它**（手机上找工具/找人的成本最高），此时隐藏是反向优化；
3. **遮挡是可预算的** —— 通过 `.dp-shell { padding-bottom: 88px }`（≤767）让所有页面底部主动留白，遮挡范围收敛到「一片刻意留出的空白」。

**具体做法**：
```css
/* ≤767：为常驻 doodle 预留内容底部空间，避免遮挡页面尾部内容 */
@media (max-width: 767px) {
  .dp-shell { padding-bottom: 88px; }   /* 原 16px 16px 48px 的第三项由 48 提到 88 */
}
@media (min-width: 768px) {
  .dp-shell { padding-bottom: 96px; }   /* 桌面从 pb 64 提到 96（52+24+20） */
}
```
> ⚠️ **`.dp-shell` 的 padding 现由两处声明**：`global.css` 的 `.dp-shell{padding:24px 32px 64px}` 与 `@media(max-width:900px)` 的 `.dp-shell{padding:16px 16px 48px}`。**必须改这两处的第三值**，不要在别处新增 `.dp-shell` 规则（避免特异性打架导致某档失效 —— 这正是红线 1 的同类风险）。

**放弃了什么**：
- 放弃了「滚动时 doodle 半透明化以免遮挡」（`opacity:.5` on scroll）。**理由：需要滚动监听 + 状态，且半透明化会削弱「随时可用」的可发现性。**
- 放弃了「手机上把 doodle 并入顶栏」。**理由：用户明确要求它不在顶部。**

### B.7 无障碍裁决（逐条，可当 checklist）

| 项 | 裁决 | 实现 |
|---|---|---|
| `aria-label` | ✅ 必须 | `aria-label="打开 Agent for Digital"`（**不用「提问」等模糊词**；与既有 `.dp-search-pill` 的 `aria-label="打开全局搜索"` 保持同一句式） |
| 展开状态 | ✅ 必须 | `aria-expanded={open}`、`aria-haspopup="dialog"`、`aria-controls="dp-agent-panel"`（面板 `id="dp-agent-panel"`） |
| 焦点环 | ✅ 必须 | `:focus-visible { outline: 2px solid #ffcd4e; outline-offset: 2px }` —— **与 `.dp-nav-item` / `.dp-icon-btn` 完全一致**（顶栏深色底用黄环，页面浅底也用黄环：黄 `#FFCD4E` on white = **1.51:1** ⚠️ 对比度不足！） |
| **⚠️ HTML 浅色底上的焦点环修正** | **必须改** | `#FFCD4E` 在白底上只有 1.51:1，**不满足 3:1 的非文本对比度要求**。doodle 在白色页面上，**焦点环必须改用品牌蓝**：`:focus-visible { outline: 2px solid #3643ba }`（on white = **8.53:1** ✓）。**顶栏用黄环是因为底是深墨 `#000F17`（黄 on 墨 = 12.6:1 ✓）—— 同一范式不能跨底色照抄。这是必须点出的坑。** |
| Esc 关闭 | ✅ 必须 | 面板内 `useEffect` 监听 `keydown`，`e.key === 'Escape'` → 关闭并把焦点**送回 doodle**（`doodleRef.current.focus()`）—— 焦点归还是无障碍硬要求，否则关闭后焦点丢失到 `<body>` |
| `prefers-reduced-motion` | ✅ 必须 | 面板与 doodle 的 `transition` 全部 `none`；`transform: translateY/scale` 全部取消（见 §B.2 CSS） |
| 键盘可达 | ✅ 必须 | doodle 用 `<button type="button">`（**不是 `div` + `onClick`**，与全局惯例一致，见 `smoke.cjs` 第 868 行的「可点列表行键盘可达」范式） |
| 屏幕阅读器语义 | ✅ 必须 | doodle = `button`；面板 = `role="dialog" aria-label="Agent for Digital" aria-modal="false"` |
| 颜色不作为唯一信息载体 | ✅ 必须 | 圆点提示 → 同时给 `aria-label` 追加「（有新功能提示）」；**提示点不是唯一信息（面板打开后内容自明）** |
| 触达尺寸 | ✅ 必须 | 桌面 52px / 手机 48px，均 ≥ WCAG 2.5.5 的 44px |
| 面板内交互 | ✅ 保持 | 复用原有 `Space.Compact` 输入 + 发送按钮（**关闭后 DOM 判断：新面板建议 `destroyOnHidden` 或 `data-open` 隐藏但保留 DOM？** 见红线 5） |

**焦点顺序裁决**：doodle 在 DOM 中位于 `<footer>` **之后**、`<GlobalSearch>` **之前** → Tab 顺序里它是「页面末尾的最后一个可聚焦元素」再回到搜索。**这个顺序是正确的**：它不打断主内容阅读流。

**放弃了什么**：
- 放弃了「焦点陷阱（focus trap）」（Tab 在面板内循环）。**理由：面板是非模态的（无遮罩、背景可交互），焦点陷阱会与「随时可用、不阻断」的意图矛盾。**
- 放弃了「doodle 加入 Tour 的 spotlight」。**实际裁决：Tour 第 3 步文案改写即可**（`App.jsx` 的 `TOUR_STEPS[2]`），不新增 spotlight 步骤 —— 因为 Tour 在首访弹出时 doodle 已带圆点提示，再叠一个高亮是重复。

**Tour 第 3 步文案裁决（确切新文案，替换 `App.jsx` `TOUR_STEPS[2]`）**：

```js
{
  title: 'Agent for Digital（右下角悬浮，随时可用）',
  description: '流程或规范上的疑问可以直接问 Agent —— 它现在常驻在页面右下角，不占导航位置，任何页面都能随时唤出。对门户本身的意见与建议也可以直接告诉它，它会帮你登记成反馈。知识中心的 FAQ 与最佳实践会持续沉淀为它的语料。',
}
```

> **顺带裁决**：`TOUR_STEPS[0]` 现文案含「顶栏横向导航即可到达**五个**主频道」→ **必须改为「七个主频道」**。`TOUR_STEPS[1]`（全局搜索）不变。

---

## 4. §C 「反馈融合进 Agent」怎么落

### C.1 裁决：做成 Agent 的**结构化能力**（回复带「登记为反馈」动作），不是「删入口加提示」

**两方案对比（必须给出唯一结论）**：

| 方案 | 做法 | 裁决 |
|---|---|---|
| ① 删入口 + 提示 | 删掉 `CoffeeOutlined` 按钮，在别处放一句「反馈请找 Agent」 | ❌ **否决** |
| ② 结构化能力 | Agent 识别到「反馈意图」后，在回复中给出一个**可点击的「登记为反馈」动作**，点击后展开内联的反馈表单（类型 + 内容），提交后返回受理承诺 | ✅ **采纳** |

**否决①的理由（这是本次的核心判断）**：用户说的是「站点反馈功能不再保留，**融合进** agent for digital 就好」。
- 「**不再保留**」= 不保留**独立入口**（那个 `CoffeeOutlined` 按钮）✓
- 「**融合进**」= 反馈成为 Agent 的**一项能力**，**功能本身必须还在**。

方案①只做到了「不再保留」，把「融合进」退化成了「删掉 + 贴个指路条」。**结果是：站点的反馈能力实际消失（用户需要先想到去问 Agent「我要提反馈」，而 Agent 的回复里没有反馈这件事）—— 这是功能净损失，与用户意图相反。**

方案②才是「融合」的实质：用户**以自然语言**表达不满（「这个页面找不到入口」「建议加个导出」），Agent 识别后**主动**给出登记动作，用户无需知道「这里有反馈功能」。

**裁决的具体实现（施工级）**：

**① 意图识别（扩展现有脚本化匹配机制，不加新依赖）**
在 `mock.js` 的 `agentReplies` **之前**插入一条最高优先级的反馈意图规则：

```js
// mock.js —— 反馈意图（最高优先级，必须先于其他 match 命中）
export const agentFeedbacksIntent = {
  match: ['反馈', '建议', '意见', '吐槽', '不好用', '找不到', '缺失', '希望能', '能不能加', 'bug', '问题', '改进', '优化建议'],
  // 命中后返回特殊动作型回复（不是纯文本）
  kind: 'feedback',
};

/** 反馈类型四选项（沿用原 TopBar Modal 的四项，一字不改） */
export const feedbackKinds = [
  { value: 'ia',      label: '信息架构 / 导航' },
  { value: 'content', label: '内容缺失 / 更新' },
  { value: 'ui',      label: '显示或交互问题' },
  { value: 'idea',    label: '新功能建议' },
];
```

**② `AgentPanel` 的回复渲染分支**
`replyFor(text)` 的返回值从「字符串」扩展为「字符串 | 动作对象」：

```js
function replyFor(text) {
  const q = norm(text);
  // 1) 反馈意图最高优先：命中则返回动作型回复
  if (agentFeedbacksIntent.match.some((m) => q.includes(norm(m)))) {
    return { action: 'feedback', text: '听起来这是对门户本身的意见 —— 我帮你直接登记成反馈，门户 Owner 会跟进。' };
  }
  // 2) 原有关键词脚本回复（顺序不变）
  const hit = agentReplies.find((r) => r.match.some((m) => q.includes(norm(m))));
  return { text: hit ? hit.text : agentFallback };
}
```

渲染时：`msg.action === 'feedback'` → 在气泡下方渲染一个 **[登记为反馈]** 按钮（`type="primary" ghost`，`size="small"`，胶囊圆角），点击后在**同一气泡内**展开内联表单：

```
┌─────────────────────────────────────┐
│ 🤖 听起来这是对门户本身的意见 ……    │
│                                      │
│  [ 登记为反馈 ]         ← 点击前     │
└─────────────────────────────────────┘
         ↓ 点击后，气泡内展开
┌─────────────────────────────────────┐
│ 🤖 听起来这是对门户本身的意见 ……    │
│ ─────────────────────────────────── │
│ 反馈类型  [ 信息架构 / 导航     ▾ ] │
│ 反馈内容  ┌───────────────────────┐ │
│           │（预填用户刚说的话）    │ │
│           └───────────────────────┘ │
│  [提交反馈]  [取消]                  │
└─────────────────────────────────────┘
         ↓ 提交后
┌─────────────────────────────────────┐
│ 🤖 已登记（FB-2026-014）。门户      │
│    Owner 会在 2 个工作日内受理。    │
└─────────────────────────────────────┘
```

**关键设计裁决**：
- **反馈内容预填用户原话** —— 不让他重打一遍。这是「融合」的体验红利：**用户已经说过一次了**。
- **反馈类型默认不预选**，让用户主动归类（对应原表单的 `required` 校验）；但**给出智能推荐**（命中「找不到」→ 预选 `ia`；命中「希望能加」→ 预选 `idea`）—— 这是 Agent 相比静态表单的**唯一实质增值**，必须做。
- **表单容器必须挂 `className="dp-form"`**（红线 4），否则 `Select` 与 `TextArea` 会变胶囊圆角。
- 提交后**不落 `demandHistory`**（反馈不是需求），仅在气泡内确认 + `message.success`。**裁决：反馈与需求是两条流水，不混。**
- 编号 `FB-2026-XXX`（与需求 `REQ-2026-XXX` 区分），前端生成，`rows.length` 递推（与 `DemandView` 的现状一致手法）。

**放弃了什么**：
- 放弃了「反馈进入 `demandHistory`」的方案。**理由：需求列表是「内部系统与数据需求」的公开受理队列，把「门户 UI 建议」混进去会污染列表语义，且反馈的受理人（门户 Owner）与需求的受理人（系统负责人）不是同一批。**
- 放弃了「在 Agent 面板里常驻一个反馈 Tab」。**理由：面板空间小（380×560），常驻 Tab 会挤占对话主区；且反馈是低频行为，不该占常驻位。**
- 放弃了「用真实意图识别模型」。**理由：原型约束（脚本化、零外部请求）不变，继续用关键词匹配并**明确披露**（面板已有「脚本化原型」胶囊），识别率提升留给接真实服务时解决。**

### C.2 裁决：四选项**保留**，作为 Agent 归类步骤的内联 `Select`

**保留，一字不改**：`信息架构 / 导航`、`内容缺失 / 更新`、`显示或交互问题`、`新功能建议`。
**放置位置**：Agent 面板内、反馈气泡展开后的**内联表单的第一项**（见上图）。

**理由**：
1. 这四类**是门户 Owner 复核时的实际分类维度**（`TopBar` 原 Modal 的说明文案「提交后由门户 Owner 受理」表明存在固定受理方），删掉它们会让 Owner 端失去分流依据；
2. 四个选项**互斥且穷尽**，是成熟的信息架构，没有修改动机；
3. 改成「让 Agent 自动判断类型」会让用户失去一次自我表达的机会，且脚本化匹配判断类型必然出错（「找不到导出按钮」到底是 `ia` 还是 `ui`？）。**裁决：Agent 推荐、用户确认**。

**放弃了什么**：
- 放弃了「精简为 2 类（问题 / 建议）」的简化。**理由：会降低 Owner 分流精度，且用户已熟悉原四类。**
- 放弃了「让 Agent 完全自动归类」的全自动方案。**理由：脚本化匹配的误判会直接污染 Owner 的分流统计数据。**

### C.3 裁决：**必须理顺的矛盾**，给出确切新文案

**矛盾的精确定位（必须先说清，否则改错地方）**

| 位置 | 现文案 | 问题 |
|---|---|---|
| `TopBar.jsx` 第 188 行 | 「提交后由门户 Owner 受理，并**同步到工作台「需求提交」历史**。本原型不真实发送。」 | **两处失效**：① 反馈入口要删，此文案随之消失（→ 会迁到 Agent 面板，必须改）；② 「工作台『需求提交』」在导航重构后**已不存在**（需求提交升为一级栏目「业务需求」） |
| `tests/smoke.cjs` 第 806 行 | `if (!/请到工作台「需求提交」提交/.test(bodyAll)) ok('文案已回正：agentReplies 不再出现旧口径…')` | **这是一条「不得出现」断言** —— 页面文本里**永远不允许**出现「请到工作台「需求提交」提交」这 12 个字 |

**矛盾的本质**：新文案若写成「反馈会同步到工作台『需求提交』历史」→ 该句含「工作台」+「需求提交」，**但不含「请到……提交」这个动作句式**，因此**不会触发** 806 行的断言。**但**它在导航重构后**事实错误**（需求提交已不在工作台）。
所以：**新文案既要避开 806 的禁用句式，又不能再宣称「工作台『需求提交』」。**

**裁决：彻底切断「反馈 → 需求列表」的旧口径，反馈不再声称进入任何需求历史。**

**确切新文案（逐处给出）**：

**① `AgentPanel.jsx` 反馈气泡展开后的说明行（替代原 TopBar Modal 的说明段）**

```
登记后由门户 Owner 受理，与业务需求分开跟进。本原型不真实发送。
```

> 逐字校验：不含「工作台」、不含「需求提交」、不含「请到」→ **806 行断言安全 ✓**
> 同时它**主动声明了「与业务需求分开跟进」**，正好呼应用户「业务需求已升为一级栏目」的心智，也解释了为什么反馈不出现在业务需求列表里。

**② 提交成功后的气泡回复**

```
已登记（FB-2026-014）。门户 Owner 会在 2 个工作日内受理，处理进展会在本对话里同步给你。
```

**③ 面板底部常驻披露行（原 `AgentDrawer` 第 134–136 行，保留并微调）**

```
Digital 部门门户 · 原型内回复为脚本示例，接入知识库后由真实服务承担。反馈登记同样为原型示意。
```

**④ `mock.js` 的 `agentFallback` 增补一句（让「反馈」这件事在兜底回复里可被发现）**

```
……已识别的常见问题我也可以直接回答：SSO 接入、权限申请、小程序首屏优化、库存一致性、告警值班。对门户本身的意见或建议，直接告诉我就行，我帮你登记成反馈。
```

> 逐字校验：不含「工作台」/「需求提交」/「请到」→ **806 安全 ✓**

**⑤ `agentReplies` 两条失效回复必须改写（否则 818 行断言必红）**

**sso 回复**（原文含「首页「提交需求」大卡或工作台「需求提交」页」）：

```
新系统接入 SSO 分四步：① 提交接入申请（系统标识 + 回调地址）；② 平台组发放客户端配置并联调；③ 灰度验证登录与登出；④ 验收归档。完整流程见知识中心《新系统接入 SSO 的标准流程》；在顶部导航「业务需求」里点「新增需求」提交，类型选「系统接入 / 打通」。
```

**权限回复**（原文含「首页「提交需求」大卡或工作台「需求提交」页」）：

```
生产库只读权限在顶部导航「业务需求」里点「新增需求」提交，类型选「数据权限 - 只读」，填写系统名、库名、用途与期限。这几个字段在轻量档里就够了，审批人为系统负责人 + 安全合规，通常 1 个工作日内完成，默认有效期 90 天。
```

> ⚠️ **这两条改写会直接让 `smoke.cjs` 第 818 行变红**：
> ```js
> if (has(doc, '首页「提交需求」大卡') && has(doc, '工作台「需求提交」')) {
> ```
> **裁决：这一条断言必须同步改写**，改为校验新路径：
> ```js
> if (has(doc, '业务需求') && has(doc, '新增需求')) {
>   ok('   ↳ SSO 回复指向「业务需求」一级栏目 + 「新增需求」入口');
> }
> ```
> **这是本次必须完成的测试契约变更，不是可选项。** 若不改，构建产物「正确」而测试「变红」，会导致团队回滚正确改动 —— 这是最坏结局。

**⑥ 首页大卡指向（`smoke.cjs` 第 453 行断言 `hashNow === '#/workspace/demand'`）**
首页的「提交需求」大卡（`.dp-demand-entry`）点击后现跳 `#/workspace/demand`。重构后 `#/workspace/demand` 路由取消 → **改为 `#/demand/new`**（直接进新增页，因为「提交需求」按钮的语义就是新增）。
**裁决：`smoke.cjs` 第 453 行的期望值改为 `#/demand/new`。**

**⑦ 权限申请 Modal 的提交提示（`Workspace.jsx` 第 92 行）**
现文案：「权限申请已提交，将进入**需求提交列表**跟进」。
**裁决改为**：「权限申请已提交，将进入「业务需求」列表跟进，可在顶部导航查看。」

**放弃了什么**：
- 放弃了「保留反馈与需求的关联、在业务需求列表里用一个筛选器显示反馈」的整合方案。**理由：受理方不同（门户 Owner vs 系统负责人），合流会让「责任人」字段失去意义，且用户说的是「融合进 agent」，方向是**向内收**而不是向需求列表扩展。**
- 放弃了「反馈以 `type: '门户反馈'` 的形式进 `demandHistory`」（最省事的方案）。**理由：会污染需求列表的公开性叙事 —— 该列表的定位是「内部系统与数据需求」的透明受理队列，混入 UI 吐槽会削弱它的可信度。**

### C.4 迁移影响总表（反馈功能拆除的完整清单）

| 文件 | 位置 | 动作 |
|---|---|---|
| `TopBar.jsx` | `CoffeeOutlined` 引入、`feedbackOpen`/`form` 状态、`cancelFeedback`/`submitFeedback`、反馈按钮 JSX、`<Modal>` 反馈弹窗（178–206 行） | **全部删除** |
| `TopBar.jsx` | import 列表去掉 `Modal, Form, Input, Select, App as AntdApp` 中**仅被反馈用到**的项（`Modal`/`Form`/`Select` 若无他用则删；**`Tooltip` 仍被通知用 → 保留**） | **清理未用 import**（否则 ESLint 报未使用，且 `smoke.cjs` 断言零 warning） |
| `TopBar.jsx` | 第 188 行旧文案 | **随 Modal 一起删除**，新文案在 `AgentPanel.jsx`（§C.3 ① ） |
| `TopBar.jsx` | actions 区 gap（原 3 个 gap = 30px） | **只剩搜索 + 通知 → 1 个 gap**（§A.1.b 已核算） |
| `AgentDrawer.jsx` | 整体 | **改造为 `AgentPanel.jsx`**，新增反馈动作分支与内联表单 |
| `mock.js` | `agentReplies` 的 sso / 权限两条 | **改写**（§C.3 ⑤ ） |
| `mock.js` | `agentFallback` | **增补反馈一句**（§C.3 ④ ） |
| `mock.js` | 新增 `agentFeedbacksIntent`、`feedbackKinds` | **新增**（§C.1 ① ） |
| `mock.js` | 新增 `feedbackStats`（可选，用于反馈气泡的编号递推） | 可选 |
| `App.jsx` | `AgentDrawer` → `AgentPanel` 导入与用法 | **改名 + 无 `open`/`onClose` 语义变化** |
| `App.jsx` | `TOUR_STEPS[0]`「五个主频道」→「七个主频道」；`TOUR_STEPS[2]` 整体改写 | **改写**（§B.7 ） |
| `global.css` | `.dp-agent-panel` 新样式 | **新增** |
| `tests/smoke.cjs` | 806 行断言 | **保留不动**（新文案已避开） |
| `tests/smoke.cjs` | 388–410 行 Agent Drawer 断言（`.ant-drawer`、`.ant-drawer-close`、`.ant-drawer-open`） | **改用 `.dp-agent-panel[data-open]`** 选择器 |
| `tests/smoke.cjs` | 核心提示：`pageText()` 剔除 `.ant-drawer` 子树 | **必须改为剔除 `.dp-agent-panel` 子树**（否则抽屉残留污染断言的问题会以同样方式回归！） |
| `tests/smoke.cjs` | 818 行 SSO 回复断言 | **改写**（§C.3 ⑤ 的警告） |
| `tests/smoke.cjs` | 453 行首页大卡跳转 | **改为 `#/demand/new`** |

> **⚠️ 最容易漏的一条**：`smoke.cjs` 的 `pageText(doc)` 函数（第 160–165 行）**专门为了剔除关闭后仍驻留的 Drawer DOM** 而存在，其注释明确记录了「抽屉残留污染断言导致假通过」的历史教训。
> **AgentPanel 关闭后 DOM 是否驻留？—— 裁决：驻留（用 `data-open=false` + `visibility:hidden` 隐藏，为了保留对话历史）。**
> 因此 **`pageText()` 剔除的选择器必须从 `.ant-drawer` 改为 `.dp-agent-panel`**，否则：
> - 面板里的「用途与期限」「说不清，帮我定位」「资料完整度」「验收标准」等文本会**污染全页断言**；
> - 更糟的是 §C.3 改写后的反馈表单里会出现「信息架构 / 导航」等词，可能让不相关的断言**假通过**。
> **这条是 P0，必须在改组件的同时改测试。**

---

## 5. §D 「需求状态楼层」的信息组织

### D.1 裁决：位置与容器

**位置**：「业务需求」一级页（`#/demand`）的**最顶部**，在页头（`h1` + 说明）**之下**、需求列表**之上**。

```
#/demand 页面结构（裁决后）：
┌──────────────────────────────────────────────────────────┐
│ h1「业务需求」 + 说明 + ContentMeta（Owner / 更新日）      │  ← 页头（复用现有 Workspace 页头范式）
├──────────────────────────────────────────────────────────┤
│ ╔══ 需求状态楼层（新）══════════════════════════════════╗ │
│ ║  待处理 3 │ 进行中 2 │ 已完成 3 │ 异常告警 1 │ 本周新增 2║ │  ← 5 格
│ ╚════════════════════════════════════════════════════════╝ │
├──────────────────────────────────────────────────────────┤
│ [ + 新增需求 ]  ← 显著主按钮（Primary，无 ghost）         │  ← 新增入口（§E.2）
├──────────────────────────────────────────────────────────┤
│ Panel：需求列表（可被楼层下钻过滤）                        │
└──────────────────────────────────────────────────────────┘
```

**容器裁决**：用一个 `Panel`（`.dp-card`）横向承载 5 格，**不是 5 张独立卡片**。
理由：5 张独立卡片在视觉上是「5 个并列对象」，会被读成 5 个可比较的指标卡；而它们其实是**同一份数据的 5 个切片**。**一个容器 + 内部分隔线**才是正确的语义（与首页「健康度快照」的四格做法一致 —— 那里也是单卡多格）。

**放弃了什么**：放弃了「5 张卡各自带图标和趋势箭头」（更"仪表盘"）。**理由：本站的健康度快照已是单卡多格的成熟范式，5 张卡会与之冲突，且趋势箭头在原型里无真实历史数据支撑（会造假）。**

### D.2 裁决：「异常告警需求」的**明确定义与阈值**

这是本节第一个必须钉死的定义。**四条规则，任一命中即计入「异常告警」。**

**基准日期**：`META.updated`（`mock.js` 中的「最后更新」日期，作为系统的「今天」）。**理由：原型无真实时钟，硬编码一个基准日才能让判定可复现、可测试。**

| 规则 | 代码名 | 判定条件 | 阈值 | 数据可得性 |
|---|---|---|---|---|
| **R1 · SLA 超期未受理** | `slaBreach` | `status === 'pending'` 且 `assignee === '待分配'` 且 `今天 − submitted > 2 工作日` | **> 2 个工作日**（= 3 个自然日，跳过周末不实现，简化为 **> 3 天**） | `status` ✓ `assignee` ✓ `submitted` ✓ |
| **R2 · 承诺时间临近** | `deadlineNear` | `expectAt` 是合法日期 且 `0 ≤ expectAt − 今天 ≤ 3 天` 且 `status !== 'done'` | **≤ 3 天** | `expectAt` ✓ |
| **R3 · 被标记阻塞** | `blocked` | `note` 字段命中阻塞词表 | 词表：`['阻塞','卡住','待第三方','等依赖','待确认库范围','搁置','暂停']` | `note` ✓ |
| **R4 · 长期滞留某状态** | `stale` | `status === 'inprogress'` 且 `今天 − submitted > 21 天` | **> 21 天（3 周）** | `status` ✓ `submitted` ✓ |

**用现有 6 条数据验算（确保定义**真的能命中**，不是空规则）**。基准日取 `2026-09-17`：

| id | status | submitted | expectAt | assignee | note | 命中 | 说明 |
|---|---|---|---|---|---|---|---|
| REQ-2026-0921 | inprogress | 09-16 | — | 顾一鸣 | 待系统负责人确认库范围 | **R3** | `note` 含「待确认库范围」✓ |
| REQ-2026-0918 | done | 09-11 | 09-25 | 沈知微 | 已完成配置与联调 | — | 已完成，全部规则排除 ✓ |
| REQ-2026-0915 | pending | 09-09 | — | 吴桐 | 已进入需求池，待排期 | — | 已分配受理人 → R1 不命中 ✓（**正确的**：它有责任人） |
| REQ-2026-0912 | inprogress | 09-05 | **10-15** | 刘倩 | UAT 阶段 | — | 距 10-15 还有 28 天 → R2 不命中；09-05 距今 12 天 → R4 不命中 ✓ |
| REQ-2026-0908 | done | 08-29 | 无硬性期限 | 陈思远 | 随 v2.8.0 一并发布 | — | 已完成 ✓ |
| REQ-2026-0905 | done | 08-26 | — | 沈知微 | 已开通，有效期 90 天 | — | 已完成 ✓ |

**验算结论：当前数据下「异常告警 = 1」（仅 0921）。**
> ⚠️ **问题：只有 1 条，楼层上的「异常告警 1」读起来像个巧合，且无法体现「待跟进事项及责任人」这一用户诉求。**
>
> **裁决：不为了凑数放宽阈值（那是造假）。改为让「异常告警」格被点击后下钻展示明细（§D.4），把「责任人」信息在下钻面板里呈现。**
> **并且**：把 `expectAt` 为 `'无硬性期限'` 的字符串形态显式排除（类型检查 `typeof === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(...)`）—— 否则 `'无硬性期限'` 参与日期运算会得到 `NaN`，静默污染计数。**这是一个真实会踩的坑，写进红线。**

**为什么选这四条**：
- **R1** 直接对应用户提到的「待跟进事项」—— 承诺过 2 个工作日回应（`demandTracks.light.committed` / `.brd.committed` 与 `.dp-demand-promise` 卡都写了这个数），**承诺没兑现就是异常**，这是最硬的一条。
- **R2** 对应用户提到的「异常告警」—— 期限临近是**可预警**的异常（区别于已发生的超期）。
- **R3** 把「阻塞」这一**人工信号**纳入，是唯一无法纯从状态/日期推出的异常，但它是真实协作场景里最重要的一个（`note` 字段本来就承担这个职责，如现数据里的「待系统负责人确认库范围」）。
- **R4** 对应「长期停留」—— 需求无限期挂着是隐性异常。

**放弃了什么**：
- 放弃了「按 `completeness < 60%` 判定异常」。**理由：完整度低不等于需求异常 —— 本站已明确「完整度不是分数、不随分数变色」（`DemandView` 的硬要求），拿它染成告警会直接违背这条既有裁决。**
- 放弃了周末/节假日感知的工作日计算。**理由：需要工作日历，原型不值当；用「3 个自然日」近似 2 个工作日并接受误差。**
- 放弃了「异常告警」作为可配置阈值。**理由：原型不做配置面板。**

### D.3 裁决：**语义色边界 —— 这条最关键，必须明确**

**先明确铁律原文**：「红/黄/绿**只允许**出现在『稳定性状态』区域，其余一律品牌蓝 + 中性。」

**逐个裁决（必须逐条给结论）**：

| 元素 | 能否用语义色 | 裁决 | 理由 |
|---|---|---|---|
| **状态计数：待处理 3** | ❌ **不能** | **`c.text3` 标签 + `c.ink` 数字**（`dp-num`） | 「待处理」不是异常 —— 它只是「还没轮到」。若涂成 warning 色，等于对正常排队的需求发出警告。**注意：`demandStatusMap.pending.semantic = 'neutral'` 已经这么裁决了，保持一致。** |
| **状态计数：进行中 2** | ❌ **不能** | **`c.text3` 标签 + `c.ink` 数字** | ⚠️ **这里是必须纠正的一处**：`demandStatusMap.inprogress.semantic = 'info'`，而 `info` 色是 `#1C7ED6`（蓝）。**如果直接复用它，本格会变成蓝色数字** —— 而品牌蓝是 `#3643BA`，两种蓝同屏会让用户以为它们是不同语义 → **必须统一用中性 + 品牌蓝，不要引入 `info` 蓝。** |
| **状态计数：已完成 3** | ❌ **不能** | **`c.text3` 标签 + `c.ink` 数字** | ⚠️ **必须纠正的第二处**：`demandStatusMap.done.semantic = 'success'`（绿 #1E8E4E）。**绿在「需求楼层」＝把「完成」渲染成褒义的绩效信号**，与本站「禁止用色彩对人/事做评价」的既定立场冲突。**且「已完成」是三个计数里最不需要注意力的一项。** |
| **异常告警 1** | ⚠️ **不能用语义色** | **品牌蓝数字 + 品牌蓝图标 + 中性文案胶囊** | 见下方长论证 |
| **本周新增 2** | ❌ **不能** | **`c.text3` 标签 + `c.ink` 数字** | 纯统计量，无任何评价色彩。 |
| 楼层内分隔线 | — | `c.border` | — |
| 楼层容器底 | — | `c.surface`（白） | — |
| 「异常告警」格 hover | — | `c.brandSubtle` 背景 | 与导航/工具项 hover 一致 |

**「异常告警」为什么不能用 warning 色 —— 完整论证（这是本次最重要的一段推理）**

1. **铁律的字面约束**：红黄绿只允许出现在「稳定性状态」区。**「需求楼层」不是「稳定性状态」区**（那是 `#/ops` 监控运营页的专属区域，`smoke.cjs` 第 248 行把它钉在 `#/ops` 上）。因此**按字面，不允许**。

2. **铁律的立法意图（更重要）**：这条铁律的存在理由在 `theme.js` 里有明确注释 —— 「红黄绿是**红绿灯隐喻**，天然携带**绩效评价**意味」。而在需求楼层里用橙色标注「异常告警」，会立刻产生一个副作用：**它看起来像在评价某个团队/责任人「没做好」**。而本门户是**内部协作工具**，不是考核看板 —— 这正是 `theme.js` 特意声明「与『禁止跨人比较』正面冲突」的原因，同一条立法意图在此完全适用。

3. **一个反直觉但关键的点**：**「异常告警」语义上确属 warning 性质 —— 这个判断是对的，但结论应是「用中性视觉表达 warning 语义」，而不是「用 warning 色」。**
   载体可以承担语义，颜色不是唯一载体。**用「品牌蓝图标（`ExclamationCircleOutlined`）+ 明确文案（「异常告警」「待跟进」）+ hover 可下钻」三件套，语义传达比一个橙色数字更精确** —— 因为橙色只说「危险」，而图标 + 文案说清了「是什么危险、点进去看详情」。

4. **一致性红利**：本站已有先例 —— `releaseTypeMap` 把「修复」「性能」等**分类**刻意做成中性灰，注释写明「否则『修复』被涂成警示橙读起来像故障」。**需求楼层的计数与告警，与「变更类型」是同一类问题（是分类/状态描述，不是稳定性信号）。裁决应当一致。**

**「异常告警」格的精确视觉规格（施工直接照做）**：

```jsx
// 楼层格通用结构（5 格共用，仅「异常告警」多一个图标）
<div className="dp-floor-cell" data-alert={isAlert ? 'true' : 'false'} onClick={...} role="button" tabIndex={0} aria-pressed={...}>
  <div style={{ display:'flex', alignItems:'center', gap:6, color: c.text3, fontSize:12 }}>
    {isAlert ? <ExclamationCircleOutlined style={{ color: c.brand, fontSize: 13 }} /> : null}
    {label}
  </div>
  <div className="dp-num" style={{ fontSize: 28, fontWeight: 500, color: c.ink, letterSpacing:'-0.02em' }}>
    {count}
  </div>
</div>
```

| 属性 | 「异常告警」取值 | 普通格取值 |
|---|---|---|
| 数字颜色 | **`c.ink`（#000F17）** | `c.ink` |
| 标签颜色 | **`c.text3`（#667085）** | `c.text3` |
| 图标 | **`ExclamationCircleOutlined`，`c.brand`（#3643BA）** | 无 |
| 数字字号 | **28px**（与其余格一致） | 28px |
| 数字字体 | `dp-num`（Roboto Mono + tabular-nums） | `dp-num` |
| 强调手段 | **仅图标 + hover 底色 `c.brandSubtle`** | hover 底色 `c.brandSubtle` |
| **禁止** | 红色数字、橙色数字、黄色底、`c.warningBg`/`c.errorBg` 底、脉动动画 | — |

> **对比度校验**：`c.ink #000F17` on `c.surface #FFFFFF` = **19.4:1** ✓；`c.brand #3643BA` on `#FFFFFF` = **8.53:1** ✓；`c.text3 #667085` on `#FFFFFF` = **4.9:1** ✓（均满足 WCAG AA）。

**裁决的边界收口（一句话给实现者）**：
> **「业务需求」整页（含楼层）不出现任何红 / 黄 / 绿像素。「异常告警」用品牌蓝图标 + 中性数字表达。**

**放弃了什么**：
- 放弃了「异常告警用橙」的直觉方案。**代价：楼层看起来不如「橙色警告」那么跳眼，可能被用户忽略。** 对冲手段：① 该格 hover 有品牌蓝底；② 它是 5 格里唯一带图标的；③ 点击可下钻明细（§D.4）；④ `#/demand` 页头可以给一句提示「有 1 项待跟进」—— **用文案解决发现性，不用颜色解决。**
- 放弃了复用 `demandStatusMap` 的 `semantic` 字段（`inprogress: 'info'` / `done: 'success'`）直接给楼层上色。**代价：楼层与列表的状态胶囊在色相上会不一致。** **裁决：接受不一致，且这是正确的** —— 列表里的状态胶囊是**行内小面积标记**（22px 高），楼层里的数字是**大面积统计量**，同一个语义在两种尺度上本就应该用不同的视觉权重。**但必须在楼层旁写一行说明，否则会被当成 bug**：
  > 楼层下方给 `c.text3` 小字：「计数为示意数据 · 状态色仅用于列表内的单条标记」
  > ⚠️ **这行小字也是 `smoke.cjs` 里「语义色不越界」断言的天然锚点。**

### D.4 裁决：楼层结构 = **5 格「大数字 + 标签」，横向一行，可下钻**

**5 格（顺序固定）**：

| # | 标签 | 计算 | 是否可下钻 |
|---|---|---|---|
| 1 | 待处理 | `demandStats(rows).pending` | ✅ 过滤 `status==='pending'` |
| 2 | 进行中 | `demandStats(rows).inprogress` | ✅ |
| 3 | 已完成 | `demandStats(rows).done` | ✅ |
| 4 | **异常告警** | §D.2 四规则并集（**去重**：一条需求同时命中多规则只计 1 次） | ✅ 过滤四条规则的并集 |
| 5 | 本月新增 | `submitted` 落在当前月（`2026-09`）的条数 = **2** | ❌（无过滤价值，展示即可） |

**结构裁决：「大数字 + 标签」而不是「横向状态条」。**

理由：
1. **数字是主角**。「待处理 3 / 进行中 2」这类信息，用户要的是**数**，不是**比例**。
2. **横向状态条（stacked bar）需要各状态互斥且总和有意义** —— 但第 4 格「异常告警」与前 3 格**不是互斥关系**（一条 `inprogress` 的需求可能同时是异常），**堆叠条在数学上就不成立**（会重复计数或产生歧义）。**这是否决状态条的硬理由，不是审美偏好。**
3. 与首页「健康度快照」的四格范式一致（`Home.jsx` 第 132–135 行），**用户已学会读这种格**。

**布局 CSS（施工照做）**：

```css
/* 需求状态楼层：5 格横向，≤900 折为 2 列，≤560 折为 1 列 */
.dp-floor {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.dp-floor-cell {
  padding: 16px 18px;
  border-right: 1px solid #e1e0df;   /* 格间分隔线 */
  cursor: pointer;
  transition: background 0.14s ease;
  /* 桌面态布局由本类表达，不在 JSX 写内联 display（红线 1） */
}
.dp-floor-cell:last-child { border-right: none; }
.dp-floor-cell:hover { background: #eef0fb; }   /* c.brandSubtle */
.dp-floor-cell[data-static='true'] { cursor: default; }
.dp-floor-cell[data-static='true']:hover { background: transparent; }
.dp-floor-cell:focus-visible { outline: 2px solid #3643ba; outline-offset: -2px; }
.dp-floor-cell[aria-pressed='true'] { background: #eef0fb; box-shadow: inset 0 -2px 0 #3643ba; }

@media (max-width: 900px) {
  .dp-floor { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dp-floor-cell { border-bottom: 1px solid #e1e0df; }
  .dp-floor-cell:nth-child(2n) { border-right: none; }
  .dp-floor-cell:nth-last-child(-n+1) { border-bottom: none; }
}
@media (max-width: 560px) {
  .dp-floor { grid-template-columns: minmax(0, 1fr); }
  .dp-floor-cell { border-right: none; }
}
```

> **`dp-num` 是硬要求**：5 个数字全部用 `className="dp-num"`（Roboto Mono + `tabular-nums`）。理由：这是本站的数字签名，且当数字从 1 位变 2 位时**格宽不变、标签不跳**（`tabular-nums` 的核心价值）。**`smoke.cjs` 已有先例断言（第 440 行「状态摘要计数使用 dp-num 等宽数字」），本次照搬。**

### D.5 裁决：可下钻——**用「点格子 → 过滤下方列表」，不进路由**

**裁决细则**：

| 项 | 值 |
|---|---|
| 交互 | 点格 → 该格 `aria-pressed="true"` + 列表按条件过滤；再点同一格 → 取消过滤（回到全量） |
| 状态载体 | **`useState` 组件内状态**（`const [floorFilter, setFloorFilter] = useState(null)`） |
| **路由** | **不进路由**。URL 不变化。 |
| 单选 | **单选**（同时只能激活一个过滤）。理由：多选会让「已选条件」的显示复杂化，且 5 格里「已完成」与「异常告警」多选无意义 |
| 视觉反馈 | 激活格：`background: c.brandSubtle` + `box-shadow: inset 0 -2px 0 c.brand`（底部 2px 品牌蓝条，是「当前筛选」的**形状化**表达，不用颜色涂满） |
| 列表标题 | 过滤时改为「需求列表 · 待处理 3 条」+ 右侧「✕ 清除筛选」文字按钮（`type="link"`） |
| 空结果 | 用既有 `PageEmpty`（`components/ui`），文案「该状态下暂无需求」+「清除筛选」按钮 |

**为什么不进路由**（与 §E.3 的二级页路由形成对照，理由必须一致）：
**判据 = 该状态是否需要被分享/收藏/刷新后保留。** 楼层过滤是**浏览时的临时视角**（用户点一下看看、看完就退出），不是「我要给同事发个链接让他看待处理的需求」。而 `#/demand/new`（新增需求表单）是**明确的目标状态**（可以分享「去这里提交」）。**同一判据下两个不同结论，这正是路由设计应有的样子。**

**放弃了什么**：
- 放弃了 `#/demand?status=pending` 的可分享链接。**理由：hash 路由（自写 20 行）不支持 query string，要支持就得改 `router.js` 的解析逻辑 —— 成本大于收益。**
- 放弃了「点『已完成』展开完成明细」。**理由：已完成项无需跟进。**

### D.6 回归影响（§D 部分）

| 断言 | 处理 |
|---|---|
| `smoke.cjs` 415–463 行（首页 `.dp-demand-entry` 区块） | **基本保留**（首页大卡不动，只改跳转目标 hash）。但 `#/home` 与 `#/demand` 不同屏，故 `.dp-demand-entry` 仍只在首页 ✓ |
| `smoke.cjs` 266 行 route `#/workspace/demand` 的 5 项特征文案 | **改为新 route `#/demand`**，特征文案改：`['业务需求', '待处理', '进行中', '已完成', '异常告警', '新增需求', '责任人']` |
| 新增断言建议 | ① `#/demand` 楼层 5 格存在（`.dp-floor-cell` 数 = 5）；② **楼层内零语义色像素**（遍历 `[style]` 查 `#e8890c/#1e8e4e/#e3262f` 等，复用 709 行的 `semColors` 数组手法）；③ 5 个数字均带 `.dp-num`；④ 点「待处理」格后列表行数变化且出现「清除筛选」 |

---

## 6. §E 「新增需求」二级页：表单 + 内嵌 agent

### E.1 裁决：「内嵌」到什么程度 —— **2 级半：字段级就地建议 + 右栏独立协作卡**

**四个等级的对比与裁决**：

| 等级 | 做法 | 裁决 | 理由 |
|---|---|---|---|
| **0 级** | 只有右栏独立卡（现状） | ❌ **否决** | 用户明确要求「嵌入到表单控件」—— 0 级没做这件事。且右栏卡与字段的距离是「视线要跨越半个屏幕去寻找对应关系」，对「我这句话该怎么写」的即时问题帮助弱。 |
| **1 级** | 字段旁只放挂点图标，点击才在右栏卡里给建议 | ⚠️ 接近但不做 | 只解决了「知道该问什么」，没解决「答案在哪儿」。 |
| **2 级** | 每个关键字段旁一个小 agent 图标，**点击后就地在该字段下方展开一行建议**（不跳右栏） | ✅ **采纳为主形态** | 「就地」是关键：用户在光标所在处得到回答，**视线移动为零**。 |
| **3 级** | agent **替换**控件本身（如自动填充、改写字段、按钮变成 agent 对话） | ❌ **否决** | 见下 |

**级 3 为何否决（这条要说透）**：agent 若**写进**控件（如「帮你把这段现状改写得更清楚」一键替换），会与本页最重要的既有裁决冲突：
- `DemandView` 的 D1 维度判定「现状是否把方案当现象」是**纯前端规则**（`hasSolutionWord` / `hasPhenomenonWord`），它**鼓励用户自己把话说清**，而 `agentAdvice` 的设计原则写得极明确：**「协作者语气：先肯定已填内容 → 只给一条 → 说明『不填也能提交』」**，且「铁律：任何时刻只有一条待改建议」。
- 若 agent 能**代写**，用户会失去「把问题想清楚」的过程，而这个过程正是本页存在的理由（入口页文案：「描述你遇到的现象就行，先不用想怎么解决」—— 这句在**训练用户区分现象与方案**）。
- **裁决：agent 只建议、绝不代笔。** 这是本页的立场，写进红线。

**2 级的具体实现（施工级）**：

**① 哪些字段挂 `.dp-field-agent`？（明确清单，不是"关键字段"这种模糊表述）**

| 字段 | 挂 agent 图标 | 就地建议内容（复用/扩展现有 `agentAdvice` 语料） | 优先级 |
|---|---|---|---|
| 需求标题 | ✅ | 「一句话说清谁在什么场景下遇到什么」+ 标题太白话时提示「标题里带上对象和场景」 | 高 |
| 现状 / 遇到的问题 | ✅ | **D1 命中方案词时唯一一条建议**（现 `agentAdvice` 的优先级 ①，直接搬） | **最高** |
| 期望结果 | ✅ | 「写希望达到什么，而不是加什么按钮」 | 高 |
| 验收 / 成功标准 | ✅ | 「建议句式『当……时，视为完成』。写不出真的可以跳过」 | 中 |
| 影响范围与量级 | ✅（在 `ScaleChips` 组旁） | 「量级怎么估」快捷问题（现有 `BrdAssistantCard` 的话题之一） | 中 |
| 涉及系统 / 入口 | ✅ | 说明「说不清就选『说不清，帮我定位』」 | 低（已有 hint） |
| 需求类型 / 期望完成时间 / 用途与期限 / 联系方式 | ❌ **不挂** | — | — |

**为什么不给每个字段都挂**：图标一多就变成噪音，且会稀释「有建议时才出现」的信号价值。**裁决：7 个字段里挂 6 个，两个纯选择/日期字段不挂。**

**② `.dp-field-agent` 的视觉与交互**：

```jsx
// 挂在 <FieldLabel> 内部，与「必填」标记同一行右侧
<span style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
  <span style={{ fontSize:14, fontWeight:500, color:c.ink }}>{text}</span>
  {required ? <span style={{ fontSize:12, color:c.text3 }}>必填</span> : null}
  <FieldAgent topic={fieldKey} />   {/* ← 新增 */}
</span>
```

| 属性 | 值 |
|---|---|
| 形态 | `？` 或 `RobotOutlined` 小图标按钮，**16px 图标 + 24px 点击区**（不满足 44px 最小点击目标 —— **豁免**，因为它不是主要操作，且与「必填」文字同行，放大点击区会破坏行高；用 `.dp-chip` 的 22px 高度作为上限参考） |
| 颜色 | 静止 `c.text3`；hover `c.brand`（**精确对齐「低权重辅助」的语义**） |
| 建议展开位置 | **该字段控件下方，紧贴**（`margin-top: 8px`），一行 `c.text2` 13px 文字 + 左侧 2px `c.brandBorder` 竖线（引用块样式） |
| 展开后的关闭 | 建议行右侧一个小 ✕，或再次点击图标收起 |
| 同一时刻 | **只允许一个字段的建议展开**（与 `agentAdvice` 的「任何时刻只有一条建议」铁律一致） |
| 无建议时 | 图标仍可见，点击后给「这个字段先写现状就行」这类引导（**不做禁用态** —— 禁用会让人不知道理由） |
| 无障碍 | `aria-label="打开「现状」字段的填写建议"`、`aria-expanded`、`aria-controls` |
| 字体 | 建议文字**不用 `dp-num`**（是中文散文，不是数字） |

**③ 与右栏 `BrdAssistantCard` 的关系（必须说清，否则会出现双份建议）**：

| | `BrdAssistantCard`（右栏） | `.dp-field-agent`（字段旁） |
|---|---|---|
| 触发 | 常驻（随表单实时更新） | 点击才展开 |
| 内容 | **全局一条**（最该改的那一项，`agentAdvice()` 的输出） | **该字段专属**（如 D1 命中的具体说明） |
| 作用 | 告诉用户「当前最该动哪里」 | 告诉用户「这一格怎么填」 |
| 关系 | **主**（战略） | **辅**（战术） |

**裁决：两者都保留，且内容不重复。** 精确的防重规则：
- `agentAdvice()` 返回的**那一条建议**只出现在右栏卡；字段旁展开的建议若与之**同指一个字段**，则字段旁显示 **`「这条建议已高亮在右侧协作卡里 →」`**（一行文字 + 箭头），**不重复长文本**。
- 理由：重复会让人以为系统在重复啰嗦，而「已高亮在右侧」既避免重复又引导视线到主建议。

**放弃了什么**：
- 放弃了 3 级（agent 代写）。**理由见上，这是本页的核心立场。**
- 放弃了「每个字段都挂图标」的完整覆盖（10 个字段全挂）。**代价：需求类型/期限字段没有就地帮助。** 理由：它们是选择器/日期控件，语义自明，挂图标是噪音。
- 放弃了「用 `Tooltip` 承载字段建议」。**理由：Tooltip 是瞬时的、hover 触发、无法选中复制文本，而「写作建议」用户需要能读能参照。** 用可展开的行内块。

### E.2 裁决：一级页 / 二级页分工

**一级页 `#/demand`（业务需求）只留三件：**

1. **需求状态楼层**（§D.1）
2. **需求列表**（现有 `DemandRecentList` 的完整版，**不再 `slice(0,6)`**，全量 6 条 + 后续新增）
3. **显著的新增入口** —— **两个位置，同一功能**：
   - **页头右侧的主按钮**：`<Button type="primary" size="large" icon={<PlusOutlined/>}>新增需求</Button>`（`type="primary"` 无 `ghost` —— **与「申请权限」按钮的 `primary ghost` 区分开**，因为本页主行动是新增）
   - **列表上方的整行入口**（可选，若列表为空则必须）：一行 `c.brandSubtle` 底的虚线框，居中「+ 新增需求」，`c.brandBorder` 虚线描边
   - **裁决：两个都做，但页头按钮是主形态。** 理由：① 页头右侧是本站「页级主行动」的既定位置（`Workspace` 页头就有这个位置）；② 列表上方的入口在**列表为空或很长时**有价值（空的时候按钮不能是唯一的，否则会很孤单）。

**现有 `DemandView` 的拆解（精确到每一块去哪）**：

| 现 `DemandView` 的部分 | 去向 |
|---|---|
| 页头 `h1 提交需求` + 说明 | **改为二级页页头**，`h1` 文案改「新增需求」 |
| `Segmented` 档位分流器 | **跟随表单去二级页**（它是表单的一部分） |
| 轻量档说明条 `.dp-demand-light-note` | 跟随表单 |
| 左栏 `Panel.dp-demand-form-col`（全部字段） | **跟随表单去二级页** |
| 右栏 `.dp-demand-side` → `Panel[data-role="promise"]` 受理承诺卡 | ❌ **留在二级页**（它是「提交前」的承诺，列表页不需要重复看承诺） |
| 右栏 → `.dp-demand-assistant`（`BrdAssistantCard`） | **跟随表单** |
| 右栏 → `Panel[data-role="recent"]` 公开列表 | **改造成一级页的「需求列表」**（从 `slice(0,6)` 改为全量） |
| `CompletenessBar` / `ScaleChips` / `SystemsField` | 跟随表单 |
| `submit()` 的 `setRows` | **改由一级页持有 `rows`** 并传给二级页（见 E.3 状态裁决） |

**⚠️ 关键实现裁决（`rows` 状态的归属）**：
现 `DemandView` 自己 `useState(demandHistory)`。拆页后**必须把 `rows` 提到一级页组件**，二级页通过 props 拿到 `rows` + `onAdd`。**理由：两个页面共享同一份列表数据；若各自持有状态，从二级页提交后返回一级页，新增的条目会消失。** 这是拆页最容易踩的坑，写进红线。

**放弃了什么**：
- 放弃了「一级页保留一个紧凑的提交框」（不跳页直接提交 4 项）。**理由：用户明确要求「新增需求的入口在页面显著为主出现，点击新增需求后……使用表单 + 嵌入 agent 的交互」—— 一个跳转、一个独立表单页，是用户的原话结构。**
- 放弃了在一级页展示 `CompletenessBar`（列表页评分）。**理由：列表页是「看别人提了什么」，评分是「我在写」的辅助，混在一起会让评分变成对他人的评价 —— 直接违反「禁止跨人比较」。**

### E.3 裁决：路由设计与返回状态

**路由草案**：

```js
// router.js —— 路由段说明
//  #/demand            → 业务需求列表（一级栏目）
//  #/demand/new        → 新增需求（二级页，表单 + 内嵌 agent）

// App.jsx renderRoute 新增分支
case 'demand':
  return route.sub === 'new' ? <DemandNew onAdd={...} rows={rows} /> : <DemandList rows={rows} />;
```

**裁决细节**：

| 项 | 裁决 | 理由 |
|---|---|---|
| 一级路径 | `#/demand` | 与 `NAV` 的 `path` 一致 ✓ |
| 二级路径 | `#/demand/new` | `/new` 是「创建」的既定语义，比 `/submit` 更准（提交只是创建的一步） |
| 编辑态路径 | **本次不做** | 原型无编辑需求；若将来做，用 `#/demand/edit/<id>`（`router.js` 的 `{seg, sub, id}` 三段结构已天然支持） |
| 一级页页内过滤 | **不进路由**（§D.5） | 临时视角 vs 目标状态，判据见 §D.5 |
| **返回按钮** | 二级页页头左侧 `← 返回业务需求`（`type="link"` + `ArrowLeftOutlined`），`go('#/demand')` | 顶部导航已高亮「业务需求」，返回是「次级导航」，用文字链接而非按钮 |

**「返回后状态是否保留」—— 分三种情况，逐一裁决：**

| 场景 | 裁决 | 实现 |
|---|---|---|
| **用户在 `#/demand/new` 写了半截，误点「返回」** | ✅ **必须保留草稿** | 表单受控状态 `v` **提升到 `App.jsx` 或一级页**（作为 `draft` state），切页不销毁 |
| **用户从 `#/demand/new` 跳去别的导航（如知识中心），再回来** | ✅ **保留草稿**（同上，因为 `v` 不随页面卸载销毁） | 同上 |
| **提交成功** | ❌ **清空草稿** | `setV({ title:'', type:undefined, systems:[] })`（与现有 `submit()` 末尾一致） |
| **刷新页面（file:// 下 F5）** | ❌ 草稿丢失 | **裁决：接受丢失，不做 localStorage 草稿。** 理由：`file://` 不透明源下 `localStorage` 会抛 `SecurityError`（`smoke.cjs` 第 1125 行专门覆盖此场景），草稿持久化会引入一个新的失败面。**代价：误刷新丢草稿。** |

**受控状态提升的具体做法（施工照做）**：
```jsx
// App.jsx —— draft 提到 shell 层，与 agentOpen 同级
const [demandDraft, setDemandDraft] = useState({ title:'', type:undefined, systems:[] });
const [demandRows, setDemandRows] = useState(demandHistory);
// renderRoute 时透传：<DemandNew draft={demandDraft} setDraft={setDemandDraft} rows={demandRows} onAdd={...} />
```
> **⚠️ 注意**：`App.jsx` 的 `renderRoute(route, onOpenAgent)` 目前是一个**模块级函数**（第 87 行），拿不到组件内 state。**必须改为在组件内调用（或把 state 通过参数传入）**。这是一个具体的重构点，容易漏。**裁决：把 `renderRoute` 改为 `App` 组件内的 `const renderRoute = (route) => {...}`**（闭包捕获 state），并把传给它的 `onOpenAgent` 一并闭包捕获。

**放弃了什么**：
- 放弃了「返回时把表单重置」（更简单的实现）。**理由：用户写完 6 个字段误触返回，全部丢失是不可接受的体验。**
- 放弃了「`localStorage` 草稿持久化」。**理由（已述）：`file://` 不透明源限制 + 新增失败面。**
- 放弃了 `#/demand/new` 的浏览器后退键「确认离开」拦截。**理由：hash 路由下 `beforeunload`/`hashchange` 拦截的用户体验很差（弹窗打断），且草稿已保留，无丢失风险。**

### E.4 裁决：两个 agent 入口的职责划分（**必须明确，否则用户困惑**）

**这是本次最容易产生「两个一样的东西」的地方。**

**裁决：职责二分，用「上下文有无」作为唯一判据。**

| | **悬浮 doodle**（全局常驻） | **内嵌字段 agent**（仅 `#/demand/new`） |
|---|---|---|
| **上下文** | **无表单上下文** | **知道当前表单填了什么** |
| **能回答什么** | 跨站的流程与规范问题（SSO、权限、库存…）+ **门户反馈登记** | 「这一格该怎么填」「我的话有什么问题」 |
| **典型交互** | 「新系统接入 SSO 的流程是什么？」「我提个建议」 | 点「现状」旁的图标 → 「『加个导出按钮』更像解决办法，挪到期望结果里」 |
| **面板/形态** | 右下角 **380×560 轻面板**（§B.4） | 字段下方**一行内联建议**（§E.1） |
| **是否同时存在** | ❌ **`#/demand/new` 页面上悬浮 doodle 隐藏** | ❌ 其他页面无字段 agent |
| **谁更强** | 知识域宽 | 表单域深 |

**关键裁决：在 `#/demand/new` 页面上隐藏悬浮 doodle。**

**理由（三层，缺一不可）**：
1. **避免「两个 agent 同屏」的认知负担**：用户会问「我有两个助手？它们一样吗？我该问谁？」—— 这是**必然而非可能**的困惑。
2. **保证「随时可用」不被打折**：用户在 `#/demand/new` 页面想问 SSO 流程怎么办？字段 agent 答不了跨站问题。**解法：二级页右栏的 `BrdAssistantCard` 保留「可以这样问」的快捷问题（现有能力，`smoke.cjs` 第 778 行断言了「量级怎么估」这个 chip）**，用户仍能在页内问跨站问题。**用「面板内已有的对话入口」替代悬浮 doodle，能力不丢失。**
3. **物理必要性**：`#/demand/new` 的右栏底部**已经**是 `BrdAssistantCard`，右下角再叠一个 doodle，两者在同一区域（右下），几何上会打架。**这是硬约束。**

**「隐藏 doodle」的精确实现（不是卸载，是位移）**：

```jsx
// App.jsx
const route = useHashRoute();
const isDemandNew = route.seg === 'demand' && route.sub === 'new';
...
{!isDemandNew ? <FloatAgent ... /> : null}
```
**裁决：条件卸载（`? :` null）而不是 CSS 隐藏。** 理由：① 卸载后 Tab 顺序里不会有隐藏元素（CSS 隐藏的按钮若未加 `visibility:hidden` 仍在 Tab 序列里 —— 无障碍陷阱）；② 本组件无状态可失（面板状态 `agentOpen` 在 `App` 层）。**若用户此时面板是打开的，需要先 `setAgentOpen(false)`** —— 写进实现要求。

**冲突兜底：如果用户在 `#/demand/new` 时面板恰好打开？**
裁决：进入 `#/demand/new` 时**强制关闭全局面板**（`useEffect(() => { if (isDemandNew) setAgentOpen(false) }, [isDemandNew])`）。理由：同屏两个对话入口 + 一个带上下文的形式，只会让用户不知道自己在和谁说话。

**放弃了什么**：
- 放弃了「两个 agent 合成一个、字段 agent 只在对话里引导」的方案（更"统一"）。**理由：那会退化成 0/1 级，用户要的「嵌入到表单控件」就落空了。**
- 放弃了「二级页保留 doodle 但缩小/半透明」。**理由：仍在右下，仍与 `BrdAssistantCard` 打架，且半透明会让人以为它是禁用的。**
- 放弃了「字段 agent 用与 doodle 不同的图标以示区分」。**实际裁决：用同一个 `RobotOutlined`/`MessageOutlined` 家族图标，靠「位置 + 形态」区分（浮窗 vs 行内行），而不是靠图标 —— 图标不同会让人以为它们是两个不同的产品。**

### E.5 二级页布局（`.dp-g-spec` 复用与否）

**裁决：复用 `.dp-g-spec`（1.5fr : 1fr），但不复用 `.dp-demand-side` 的 `order` 重排语义（要改 order 编号）。**

```jsx
<div className="dp-grid dp-g-spec" style={{ gap: 16, alignItems: 'start' }}>
  <Panel data-role="form" className="dp-demand-form-col">…表单（含字段 agent）…</Panel>
  <div className="dp-demand-side">
    <Panel data-role="promise" className="dp-demand-promise">…受理承诺…</Panel>
    {isBrd ? <div className="dp-demand-assistant" data-role="assistant"><BrdAssistantCard/></div> : null}
  </div>
</div>
```

**注意：二级页不再有 `[data-role="recent"]`（公开列表已留在一级页）**，因此 ≤900px 的 `order` 只需 3 档（承诺卡 1 → 助手 2 → 表单 3），**红线里必须写明这一点**：`smoke.cjs` 第 548 行的 `orderHits === 4` 断言**会变红**（因为 `dp-demand-recent{order:4}` 在二级页不存在）。

**裁决：`global.css` 的 `@media(max-width:900px)` 块保留 4 条 order 声明（一级页的列表仍需要它）**，但 `smoke.cjs` 的断言必须**改挂到一级页**，或改为「≥3 条命中」。**推荐：把顺序断言拆成两条 —— 一级页断言 `dp-demand-recent{order:4}` 存在（在 CSS 里），二级页断言 DOM 顺序。** 具体见红线清单。

**放弃了什么**：放弃了「二级页单栏全宽表单」（表单更宽更好填）。**理由：右栏的受理承诺卡 + `BrdAssistantCard` 是产品判据（`smoke.cjs` 第 758 行「完整档右栏含 BRD 协作助手内联卡」），必须保留。**

---

## 7. §F 红线清单（可直接当 checklist 用）

### F.1 五条必踩的实现陷阱（血泪教训，逐条写死）

| # | 陷阱 | 红线（必须照做） | 反面教材 / 症状 |
|---|---|---|---|
| **1** | **内联 `display` 压过媒体查询** | **凡涉及响应式重排的容器，桌面态布局必须用 CSS 类表达，禁止在 JSX 写内联 `display`。** 本次新增的 `.dp-floor`（5→2→1 列）、`.dp-agent-panel`（380 宽 → 全宽）两个容器**都在此列** | 上轮 `.dp-demand-side` 挂了内联 `style={{display:'flex'}}`，导致 `@media(max-width:900px){display:contents}` **完全失效**，窄屏布局静默错乱（用户先看到「表单 → 承诺卡 → 列表」，与 spec 相反）。`smoke.cjs` 第 523 行专门有一条断言查「容器上不得有内联 display」 |
| **2** | **`getContainer={false}`** | **外层包了 `Watermark` 且跑 `file://`，任何浮层（Drawer / Modal / Popover / Tooltip / Select 下拉）必须 `getContainer={false}`**。新 `AgentPanel` 若做成纯 `div` 则天然满足；但**面板内**新增的 `Select`（反馈类型）**必须显式写 `getContainer={false}`** | 不写会挂到 `document.body`，在 `file://` 下 antd 的 `getPopupContainer` 计算依赖的定位祖先丢失 → 下拉跑到屏幕左上角 |
| **3** | **`space` 是数字不是字符串** | `theme.js` 的 `TOKENS.space.base = 16`（**数字**）。**禁止 `c.space.base + 'px'` 之外的字符串拼接** —— 正确写法就是 `c.space.base + 'px'`；**禁止**直接把 `c.space.base` 传给需要长度的 CSS 属性（会变 `16` 无单位） | 传 `padding: c.space.base` → 无效 CSS `padding:16`（浏览器丢弃）；或用 `c.space.base * 1.5 + 'px'` 这种混算（可行但要小心 NaN） |
| **4** | **表单容器必须挂 `className="dp-form"`** | **所有承载 antd 输入控件的容器必须挂 `.dp-form`**（`global.css` 第 95–101 行的 `!important` 规则靠它生效）。本次两处新增：① **Agent 面板内反馈表单**；② 二级页表单区（沿用现有） | 不挂 → `global.css` 的 `.ant-input{border-radius:999px}` 生效 → **所有输入框变胶囊圆角**，与「控件 6px」的圆角规范冲突。`smoke.cjs` 第 479 行有断言 `doc.querySelector('.dp-form')` |
| **5** | **Drawer/Modal 关闭后 DOM 仍常驻** | **断言页面文案前必须剔除残留子树。** 现 `smoke.cjs` 的 `pageText()` 只剔除 `.ant-drawer` → **本次必须同步改为剔除 `.dp-agent-panel`**（若 `AgentPanel` 用 `data-open=false` 隐藏而非卸载）。**新组件设计裁决：`AgentPanel` 用 `data-open` 保留 DOM（保留对话历史）→ 必须登记到 `pageText()` 的剔除列表。** 同时裁决：**antd `Modal` 类新组件优先用 `destroyOnHidden`**（如权限申请 Modal 已有） | 面板里的「用途与期限」「说不清，帮我定位」「资料完整度」等词污染全页断言 → **假通过**。历史教训：`smoke.cjs` 第 8–12 行注释记录了「把 chip 的 label 改掉后 smoke 仍 81/81 全绿」。**本次新增的反馈表单里会出现「信息架构 / 导航」等词，污染风险更高** |

### F.2 颜色红线

| # | 规则 |
|---|---|
| C1 | **组件里禁止硬编码颜色**，一律 `const c = useT()`（`theme.js` 顶部注释的「唯一事实来源原则」）。**CSS 层（`global.css`）允许字面量** —— 与现存写法一致，不新增 CSS 变量体系（除已有的 `--dp-font-mono`） |
| C2 | **palette 不可改**：brand `#3643BA`、ink `#000F17`、yellow `#FFCD4E`（**仅小面积标记**）、text2 `#616161`、text3 `#667085`、textDisabled `#B3B7B9`（**2.04:1，仅装饰/禁用，绝不承载文字**）、page `#F5F4F5`、surface `#FFFFFF`、border `#E1E0DF` |
| C3 | **语义色铁律**：红/黄/绿**只允许**出现在「稳定性状态」区（`#/ops`）。**「业务需求」整页（含楼层）不得出现任何红/黄/绿像素。**「异常告警」用**品牌蓝图标 + 中性数字**（§D.3） |
| C4 | **状态计数不得用语义色**：待处理/进行中/已完成/本月新增 → **`c.text3` 标签 + `c.ink` 数字**。**特别是不要复用 `demandStatusMap` 的 `info`（#1C7ED6 蓝）与 `success`（#1E8E4E 绿）** —— 前者会与品牌蓝撞车，后者是绩效评价色 |
| C5 | **品牌蓝实心是稀缺资源**：全站实心品牌蓝只有「当前激活导航项」与 `.dp-bubble--user`。**悬浮 doodle 不得使用实心品牌蓝**（§B.1） |
| C6 | **yellow 只做小面积标记**：通知 Badge（现状）、置顶/里程碑/NEW。**不得用于 doodle、不得用于楼层、不得用于反馈提示点** |
| C7 | **对比度底线**：正文/数字 ≥ 4.5:1；非文本（图标、边框、焦点环）≥ 3:1。**⚠️ 特别提醒：`#FFCD4E` 在白底只有 1.51:1 → 白底上的焦点环必须用 `#3643BA`（8.53:1）**（§B.7） |
| C8 | **颜色不得作为唯一信息载体**：doodle 提示点必须同时有 `aria-label`；「异常告警」必须同时有图标 + 文案 |

### F.3 形状 / 间距 / 数字红线

| # | 规则 |
|---|---|
| S1 | **圆角四档**：胶囊 `999px`（按钮 / Tag / chip / Segmented / 搜索框 / **doodle**）、卡片 `8px`（`.dp-card` / Panel）、控件 `6px`（`.dp-form` 内的 input / select / textarea）、浮层 `12px`（Modal / **AgentPanel**） |
| S2 | **`.dp-form` 内输入框必须 6px**（靠 `.dp-form` 类生效，见 F.1 #4）。**反馈表单与二级页表单都必须挂 `.dp-form`** |
| S3 | **间距用 8pt 栅格**：`c.space = { xs:4, sm:8, md:12, base:16, lg:24, xl:32, xxl:48, huge:64 }`。**不要出现 10px / 14px 这类非栅格值**（既有 CSS 里 `gap:10px`、`padding:0 14px` 是历史遗留，**新代码不要跟随**） |
| S4 | **数字一律 `className="dp-num"`**（Roboto Mono + `tabular-nums`）：楼层 5 个数字、需求编号 REQ-2026-xxx、反馈编号 FB-2026-xxx、日期、字数统计、计数器。**`.dp-mono` 用于非数字的等宽文本（如邮箱、代码）** |
| S5 | **禁止用字号/字重做「大数字」的替代**：楼层数字 28px / 500 字重，标签 12px / 400。**这是唯一允许出现 >24px 数字的地方（页面 `h1` 是 24px）** |
| S6 | **卡片静止态只有 1px 边框、无阴影**，hover 才抬升（`.dp-card--hover`）。**浮层（doodle / AgentPanel）例外 —— 它们必须常驻阴影**（`c.shadowFloating`），因为它们悬浮在内容之上必须有分离感 |

### F.4 file:// 约束红线

| # | 规则 |
|---|---|
| F1 | **IIFE 打包、无 `type="module"`、无 `crossorigin`、零外部请求**（字体自托管在 `assets/fonts/`，见 `global.css` 的 `@font-face`）。**新增任何依赖都要先确认它是纯 ESM→IIFE 可打包的** |
| F2 | **不新增网络请求**：agent 保持脚本化关键词匹配（`agentReplies`），**不接任何 API**；不引入 CDN 字体/图标/图片 |
| F3 | **`localStorage` 必须容错**：`file://` 是不透明源，`localStorage` 访问会抛 `SecurityError`。**一切读写走 `portal/src/store.js`（已有兜底）**，且**新代码的 `store.set` 必须在 `try/catch` 内**（doodle 提示点的 `dp_agent_hint_seen` 属此列）。`smoke.cjs` 第 1125–1141 行专门验证此场景 |
| F4 | **浮层 `getContainer={false}`**（见 F.1 #2） |
| F5 | **不依赖 `window.location` 的 pathname**（只在 `file://` 下会是本地路径）。路由只用 `hash`（现有 `router.js` 的约定） |

### F.5 文案红线（含 `smoke.cjs` 契约）

| # | 规则 |
|---|---|
| T1 | **禁止出现「请到工作台「需求提交」提交」这一句式**（`smoke.cjs` 第 806 行的「不得出现」断言）。**新文案涉及时一律用「顶部导航『业务需求』」+「新增需求」** |
| T2 | **反馈不得声称同步到需求历史**。确切文案：`登记后由门户 Owner 受理，与业务需求分开跟进。本原型不真实发送。`（§C.3 ① ） |
| T3 | **`agentReplies` 的 sso / 权限两条必须改写**为指向「业务需求 + 新增需求」（§C.3 ⑤ ），**且 `smoke.cjs` 第 818 行的期望值同步改** |
| T4 | **`TOUR_STEPS[0]` 的「五个主频道」必须改「七个主频道」**（§B.7） |
| T5 | **披露口径统一**：agent 面板保留「脚本化原型」胶囊；页脚保留「数据均为示意数据 · 非真实运行值」（`smoke.cjs` 第 1115 行断言）；**楼层旁新增一行「计数为示意数据 · 状态色仅用于列表内的单条标记」** |
| T6 | **不出现「得分 / 扣分 / 满分 / 分数」**（`smoke.cjs` 第 735 行断言）——新增的字段级 agent 建议与楼层说明都不得引入这些词 |
| T7 | **`#/demand/new` 页的字段 agent 建议不得出现「提交失败」**（沿用 `agentAdvice` ③ 的裁决：被拦时不说失败） |

### F.6 无障碍红线

| # | 规则 |
|---|---|
| A1 | **可点元素必须是 `<button type="button">` 或带 `role="button"` + `tabIndex={0}` + Enter/Space 处理**：doodle（`button`）、楼层 5 格（`role="button"` + `tabIndex={0}` + `aria-pressed`）、字段 agent 图标（`button`） |
| A2 | **焦点环必须可见**：` :focus-visible { outline: 2px solid …; outline-offset: 2px }`。**浅底用 `#3643BA`，深墨底（顶栏）用 `#FFCD4E`**（§B.7 的对比度裁决） |
| A3 | **焦点顺序**：doodle 在 DOM 中位于 `<footer>` 之后 → Tab 序列末尾，**不打断主内容阅读流** |
| A4 | **Esc 关闭面板并归还焦点**到 doodle（`doodleRef.current.focus()`） |
| A5 | **`prefers-reduced-motion: reduce`** 下取消 doodle 与面板的全部 `transition` / `transform` |
| A6 | **`aria-label` 用确切动作**：`打开 Agent for Digital`（对齐既有 `打开全局搜索` 句式），**不要用「提问」「帮助」等模糊词** |
| A7 | **面板 = `role="dialog"` + `aria-modal="false"`**（无遮罩，非模态；声明 `true` 会错误锁死屏幕阅读器的背景导航能力） |
| A8 | **列表行键盘可达**（沿用 `.dp-row[role="button"][tabindex="0"]` 范式，`smoke.cjs` 第 868 行断言）—— 一级页需求列表沿用 `DemandRecentList` 的现有实现即可 |
| A9 | **鼠标点击不留焦点环 / 键盘聚焦可见**（`onMouseDown` 标记指针交互，`onFocus` 读取标记；`smoke.cjs` 第 605–640 行 P2-2 断言）。**楼层格与字段 agent 图标若复用量级胶囊的实现，须同样处理** |
| A10 | **点击目标 ≥ 44×44px**（WCAG 2.5.5）：doodle 52/48 ✓、楼层格 ~70×70 ✓；**字段 agent 图标 24px → 已知豁免**（§E.1 说明理由），**但必须保证它有 `padding` 撑到 ≥24×24 且周围无其他可点元素紧贴** |

### F.7 测试契约红线（**改动必同步，否则构建正确而测试变红**）

| # | 断言 | 现位置 | 必须改成 |
|---|---|---|---|
| E1 | 一级导航数量 `=== 5` | 215、921 行 | `=== 7` |
| E2 | route `#/workspace/demand` | 266、302 行 | `#/demand`，高亮 `业务需求` |
| E3 | `#/workspace` 特征文案含 `组织速查/需求提交` | 263 行 | 删这两项（已升为一级栏目） |
| E4 | Agent 断言用 `.ant-drawer` / `.ant-drawer-close` / `.ant-drawer-open` | 392、403、406、763 行 | 改 `.dp-agent-panel[data-open="true"]` / `.dp-agent-panel-close` |
| E5 | **`pageText()` 剔除 `.ant-drawer`** | 160–165 行 | **改剔除 `.dp-agent-panel`** ← **P0，漏了必然假通过** |
| E6 | 首页大卡跳转 `=== '#/workspace/demand'` | 453 行 | `=== '#/demand/new'` |
| E7 | SSO 回复须含 `首页「提交需求」大卡` + `工作台「需求提交」` | 818 行 | 含 `业务需求` + `新增需求` |
| E8 | `P0-1` 三锚点 `promise/form/recent` + `order` 四条 | 515–566 行 | 拆为：一级页（`.dp-demand-recent` 存在 + CSS 4 条 order）+ 二级页（DOM 顺序 + 3 条 order 生效） |
| E9 | 需求提交页公开列表 `≥6 行` | 483 行 | 挂到 `#/demand`（一级页） |
| E10 | `P2-2` 量级胶囊焦点环 | 605 行 | 挂到 `#/demand/new` |
| E11 | 新增（建议） | — | ① `#/demand` 楼层 5 格；② 楼层零语义色像素；③ 5 个 `.dp-num`；④ 点格过滤生效；⑤ doodle 在 `#/demand/new` **不渲染**；⑥ 反馈意图 → 「登记为反馈」按钮出现 |
| E12 | 零 `console.error` / 零 React+antd warning | 1119 行 | **保持 —— 因此 `TopBar.jsx` 删反馈后必须清理未使用的 import**（否则构建可能产生 warning） |

---

## 8. 施工顺序建议（依赖关系，避免返工）

```
① theme.js            —— 无改动（除非要给 shadowFloating 等加别名）✓ 先确认
② router.js           —— NAV 7 项 + NAV_OF 映射（A.5/A.4）           ← 一切的地基
③ global.css          —— 顶栏 5 档（A.3）+ .dp-floor（D.4）+ .dp-float-agent（B.2）+ .dp-agent-panel（B.4）
④ AgentPanel.jsx      —— 由 AgentDrawer 改造（B.4 + C.1）             ← 依赖 ③
⑤ FloatAgent          —— 新组件（B.1/B.2/B.5/B.6/B.7）                ← 依赖 ③
⑥ TopBar.jsx          —— 删 agent 按钮 + 删反馈 Modal（A.1.b + C.4）  ← 依赖 ②④⑤ 就绪（避免中间态页面缺入口）
⑦ App.jsx             —— 挂 FloatAgent（B.3 结构）+ renderRoute 闭包化（E.3）+ draft 提升 + TOUR 文案（T4）
⑧ DemandList.jsx      —— 一级页（D.1/D.4/D.5 + E.2）
⑨ DemandNew.jsx       —— 二级页（E.1/E.2/E.5 + E.3）
⑩ Workspace.jsx       —— 退回纯工具导航（移除两个 Tab）+ 权限 Modal 文案（C.3 ⑦）
⑪ Home.jsx            —— 大卡跳转改 #/demand/new
⑫ mock.js             —— agentReplies 改写 + agentFallback 增补 + feedbackKinds + 反馈意图（C.1/C.3）
⑬ tests/smoke.cjs     —— 按 F.7 逐条改（**与 ② – ⑫ 同步，不要最后才改**）
```

**⚠️ 顺序里的唯一硬依赖**：**⑥（删旧入口）必须晚于 ④⑤⑦（新入口就绪）**。否则中间态会出现「Agent 完全没有入口」的构建，若此时跑 smoke 会得到一堆无意义的红。

---

## 9. 一页速查（打印出来贴在屏幕边）

```
导航       5 → 7 项：[首页][信息中心][监控运营][知识中心][组织速查][业务需求][工作台]
           padding: 0 11px    nav 宽 706px
分档       T1 ≥1312 / T2 1164–1311 / T3 941–1163 / T4 768–940 / T5 ≤767
           （原 1272 / 1012 作废；T4 需 logo 只留符号）
牺牲顺序   logo副标题 → 搜索文案 → 导航文字 → 手机折叠（agent 文案随按钮一起删除）

doodle     52px 白底 + 1.5px 品牌蓝边 + 品牌蓝 MessageOutlined
           fixed right:24 bottom:24  z-index:900（高于 Watermark 9）
           点击 → 右下 380×560 轻面板（12px 圆角，无遮罩，z-index:950）
           提示点 8px 品牌蓝圆点（无数字，一次性）
           ≤767: 48px / right:16 bottom:16；内容区 pb 88
           焦点环 白底用#3643BA、深底用#FFCD4E；Esc 关闭 + 归还焦点

反馈       TopBar Modal 整个删除 → Agent 的结构化能力
           四选项保留为内联 Select；内容预填用户原话
           文案「登记后由门户 Owner 受理，与业务需求分开跟进。本原型不真实发送。」

业务需求   楼层 5 格：待处理 / 进行中 / 已完成 / 异常告警 / 本月新增
           计数一律 c.ink 数字 + c.text3 标签 —— 零语义色
           「异常告警」= 品牌蓝图标 + 中性数字（R1 SLA超期>3天 / R2 承诺≤3天 / R3 阻塞词 / R4 inprogress>21天）
           点格 → useState 过滤列表（不进路由）

新增需求   一级页 = 楼层 + 全量列表 + 显著「新增需求」主按钮
           二级页 #/demand/new = 表单 + 字段级 agent（6 个字段挂 .dp-field-agent）
           复用 .dp-g-spec；rows 提到 App 层；draft 保留、提交后清空
           #/demand/new 上**不渲染**悬浮 doodle

红线       ① 不写内联 display  ② getContainer={false}  ③ space 是数字
           ④ 表单挂 .dp-form  ⑤ pageText() 剔除 .dp-agent-panel
```


