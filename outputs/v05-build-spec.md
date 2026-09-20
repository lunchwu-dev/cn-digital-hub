# v0.5 施工契约（team-lead 签发 · 唯一有效施工依据）

> 仓库：`C:\Users\uuzz\WorkBuddy\2026-09-17-21-20-34`（前端在 `portal/`）
> 施工方：prototype-builder-v041 ｜ 评审方：critique-reviewer-v041
> **本文件优先级高于 `outputs/v05-design-tokens.md`**：凡两者冲突，以本文件为准（冲突点见 §0）。

---

## 0. 对设计令牌规范的两处**有意偏离**（施工方必须按本文件做，不得按规范做）

| # | `v05-design-tokens.md` 的说法 | **本文件裁定** | 理由 |
|---|------------------------------|---------------|------|
| 1 | §0-5 / §5：「**逾期任务不进甘特**」「本视图不含逾期任务」 | **反转为：逾期但未完结的任务照常进甘特**，渲染成普通行——**无任何逾期色、无图标、无「逾期」二字**。`rows[].overdue` 保留为数据字段但**不参与任何视觉**。 | 逾期仍在办的任务**确实在占用这个人**。把它藏掉会让 W1 的占用被低估——这恰恰是资源甘特最不该错的地方。用户原话是「哪些事项对该员工有占用」。 |
| 2 | §1.1 下带 meta 行 = 「技能标签 · 共 N 个 · 按技能领域排序」 | **补回被丢的信息**：meta = `技能标签 · 共 N 个 · 按技能领域排序 · 近 12 月记录 M 条`（M = Σ recentCount，即原 PanelHead 的 extra）。 | 原 PanelHead 的 extra「近 12 月记录 N 条」是有信息量的读数，不该因去 PanelHead 而消失。 |

**另：本文件对 §6.2「浅端不可辨」的裁定** —— 采纳其结论：**格内数字是主通道**（≥4.87:1），深浅是辅助通道，图例色块必须带文字标签。**但「三档 fill 均 ≥3:1」不作为本轮门禁**（已书面认定为已知不达标项）。

---

## 1. 数据层：**已完成，施工方不得修改 `src/data/mock.js`**

team-lead 已改完并实测通过（见 `portal/_lead_v05_verify.txt`）：

- `JIRA_ISSUES` 41 条，**全部带 `start`**（`'YYYY-MM-DD'` 字面量，无运行时日期计算）。
- `OCCUPANCY_WEEKS`：8 周，W1 `2026-09-14`（周一）→ W8 结束 `2026-11-08`。
- `OCCUPANCY_TIER_THRESHOLDS = { mid: 2, high: 3 }`
- `occupancyTierOf(count)` → `0→null / 1→'low' / 2→'mid' / ≥3→'high'`
- `getPersonOccupancy(personIdOrEmail)` → `{ personId, weeks, rows, totals }`
  - `rows[]` = **全部**该人 `status !== 'done'` 的 issue（**不截断**、**不过滤逾期**），字段：
    `{ key, title, status, priority, start, due, weekIdx: number[], overdue: boolean }`
  - `totals[]` = `[{ i, count, tier }]`，`count` = 该周被多少条 row 覆盖（区间**有交集**即算）
  - 排序：`due ↑ → priority(P0<P1<P2) ↓ → key ↑`（全序，确定性）
  - `weekIdx` 由 `start`/`due` 与周窗逐周求交集得出；**跨周任务必须有多个 idx**（这是「连续色带」的数据来源）。

**已实测的基准（施工方不得覆盖，只可引用）**：

```
min.zhou     rows=7  weekIdx 覆盖 → W1:2 W2:2 W3:2 W4:2 W5:0 W6:1 W7:0 W8:1
siyuan.chen  rows=9  totals 计数   → W1:1 W2:2 W3:3 W4:2 W5:2 W6:1 W7:0 W8:1   （W3 = 3 → 'high'）
zhiwei.shen / yiming.gu  rows=0（空态样本，必须走到空态分支）
```

---

## 2. 施工文件清单（7 个文件，逐条给死）

### 2.1 `src/global.css` —— 追加，不删不改既有规则

**(a) `:root` 新增 6 个别名变量**（值 = 现有 token 的别名，**零新色值**）：

```css
--dp-gantt-slot: #f5f4f5;   /* = c.page       空槽 */
--dp-gantt-l1:   #dce0f4;   /* = c.brandStep1 轻（1 项） */
--dp-gantt-l2:   #a9b2e6;   /* = c.brandStep2 中（2 项） */
--dp-gantt-l3:   #6b78d4;   /* = c.brandStep3 高（≥3 项） */
--dp-gantt-bar:  #3643ba;   /* = c.brand      任务行占用条 */
--dp-gantt-line: #e1e0df;   /* = c.border     格线 */
```

**(b) 结构性 class（新增）**：

| class | 关键规则 |
|-------|---------|
| `.dp-gantt-scroll` | `overflow-x:auto; min-width:0` ← **横向滚动只许发生在这里**（`body`/`.dp-shell` 不得横向溢出） |
| `.dp-gantt` | `display:grid; grid-template-columns: minmax(180px,240px) repeat(8, minmax(44px,1fr)); column-gap:0; row-gap:4px; align-items:center; min-width:512px` |
| `@media (max-width:1200px)` | `.dp-gantt{ grid-template-columns: minmax(160px,180px) repeat(8, minmax(44px,1fr)) }` |
| `@media (max-width:900px)` | `.dp-gantt{ grid-template-columns: minmax(160px,160px) repeat(8, minmax(44px,1fr)) }` |
| `.dp-gantt-head` | 高 34px（两行：`W1` 12px/500/`c.text2` + `09/14` 11px `.dp-num`/`c.text3`）；每格 `box-shadow: inset 1px 0 0 var(--dp-gantt-line)` |
| `.dp-gantt-rowhead` | `position:sticky; left:0; z-index:1; background:#ffffff`（**background 必须给**，否则滚动穿透） |
| `.dp-gantt-cell` | 高 28px；`border-radius:4px`；**空槽格** `box-shadow: inset 1px 0 0 var(--dp-gantt-line)` |
| `.dp-gantt-cell.is-on` | `background: var(--dp-gantt-bar); box-shadow: none`（**占用格无左竖线** → 色带连续） |
| `.is-band-start` / `.is-band-end` | **仅两端格**给 4px 圆角（首格左上/左下，末格右上/右下）；**中间格 `border-radius:0`**；单周任务同时带 start+end → 四角全圆 |
| `.dp-gantt-total` | 行首格 11px/`c.text2`；8 格按档填 `--dp-gantt-l1/l2/l3`（空槽 `--dp-gantt-slot`）；每格 `box-shadow: inset 1px 0 0 var(--dp-gantt-line)`；上方 `border-top:1px solid var(--dp-gantt-line)` |
| `.dp-floor-merged` | 挂在既有 `.dp-person-head` 上：`padding:0`（两带各自管 padding） |

**三档填色 class 约定**（供 JSX 打 class，档位映射收口在 CSS）：

```css
.dp-gantt-total .t-low  { background: var(--dp-gantt-l1); }
.dp-gantt-total .t-mid  { background: var(--dp-gantt-l2); }
.dp-gantt-total .t-high { background: var(--dp-gantt-l3); }
```
（空槽不给 class，走 `.dp-gantt-total` 基底 `background: var(--dp-gantt-slot)`。）

**❗保留 `.dp-g-duo` 的既有定义**（定义不删、仅移出 DOM 使用点——本仓库既有「考古定义保留」惯例，`smoke.cjs` 门③b 会查它）。

### 2.2 `src/components/ui.jsx`

1. **`TagLike`（`:450` 起）**：把函数体里那个 `height: 22`（约 `:486`）改成 **`height: 20`**。
   ⚠️ 文件里另有 5 处 `height: 22`（`:601/:638/:665/:692/:734`，属 Pill 等），**一个都不许动**。改前先数：`grep -c 'height: 22' src/components/ui.jsx` 应得 6，改后应得 5。
2. **`TagMatrix`（`:754` 起）**：
   - **去掉外层 `<Panel>` 与 `<PanelHead>`**（否则糅合层会 Panel 套 Panel、双边框）。根节点改为 `<div className="dp-tag-floor" style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'stretch'}}>`。
   - 新增一个 `meta` 渲染（在 `.dp-tag-floor` **之上**，同为 TagMatrix 根 div 之前或之内皆可，但必须**在 `.dp-floor-tags` 内**）：
     单行 `12px / c.text3 / lineHeight 1.6 / marginBottom 10`，文案逐字：
     `技能标签 · 共 ${tags.length} 个 · 按技能领域排序 · 近 12 月记录 ${recentTotal} 条`
     （**不加粗、不做标题、不复用 16px**——楼层主标题是姓名。）
   - `empty` 分支：保留 `PageEmpty`，但**同样不要外层 Panel**（`PageEmpty` 自带容器即可）。
   - **卡片 `<Panel>` 保留**（`.dp-card` 是标签卡的形状签名），只改内部：
     - `padding: '10px 12px'` → **`'8px 10px'`**
     - `minWidth: 132` → **保持 132（红线）**
     - `flex: '0 1 auto'` → **保持**
     - 标签名 `lineHeight: 1.4` → **`1.35`**（字号仍 13、`title` 兜底仍在）
     - **分组名行与档位行合并为一行**（见下）
   - **合并行的规格（不可拆，这是「−22%」能成立的前置条件）**：
     ```jsx
     <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
       <span style={{ flex:'0 0 auto' }}><SystemTier tier={t.evidenceTier} count={t.recentCount} showCopy={false} /></span>
       <div style={{ flex:'0 0 auto', fontSize:11, color:c.text3, lineHeight:1.5, whiteSpace:'nowrap' }}>
         {t.tag.group}
       </div>
     </div>
     ```
     - **档位条在左、分组名在右**（视觉：先读档位、再读类目）。
     - 分组名**必须是 `<div>`** 且 **inline style 含 `font-size: 11px`** —— `smoke.cjs:1786` 的门⑤用 `card.querySelectorAll('div')` 找 11px 元素，改成 `<span>` 会直接红。
     - **两侧一律 `flex:0 0 auto`**，**不设 `maxWidth`** —— 卡片按内容撑宽，5 字组名不被挤断（代价：有效最小卡宽 132 → 约 145px，每行由约 9 张降到约 8 张，**这是取舍不是 bug**）。
     - 档位条 `width:64` 由 `SystemTier` 内部给出 → **`SystemTier` 本体只改档位条 `height: 6` → `5`**，`width:64` 与 4 段结构**一个都不许动**（门 :1593 数 `border-radius:999` 的段，须 ≥ 4×卡数）。
   - **`showCopy={false}` 必须保持**（档位文案不上屏；悬停 `title` 兜底必须保持 —— 门 :1950 直接读 `getAttribute('title')`）。

### 2.3 `src/pages/PersonProfile.jsx` —— 楼层重排

**目标 DOM 骨架（`.dp-shell` 直接子节点 = 4 个）**：

```
.dp-shell
├─ Breadcrumb                                    ← 不变
├─ Panel.dp-card.dp-person-head.dp-floor-merged  ← 楼层 1+2 糅合（1 张卡）
│   ├─ div.dp-person-head-main   style: padding 18px 22px; display:flex; alignItems:center; gap:18
│   │    [InitialAvatar 64/23] 姓名24 / 组别·职务 / 地点·邮箱     ← 内容与字号全不变
│   └─ div.dp-floor-tags         style: borderTop 1px solid c.border; padding 14px 22px 18px
│        TagMatrix（含 meta 行 + .dp-tag-floor 卡片流）
│        合规脚注 div  marginTop:10, fontSize:12, color:c.text3, lineHeight:1.7
├─ Panel.dp-card.dp-floor-work                   ← 楼层 3：近期工作内容（**独占通栏**）
└─ Panel.dp-card.dp-floor-contrib                ← 楼层 4：近期知识贡献（**独占通栏**）
```

硬约束：

1. **`.dp-g-duo` 从 DOM 中彻底移除**；`.dp-floor-work` / `.dp-floor-contrib` 各自是**独立通栏 Panel**，不再共享一层。
2. 三个类名 **`.dp-person-head` / `.dp-person-head-main` / `.dp-floor-tags` / `.dp-tag-floor` / `.dp-floor-work` / `.dp-floor-contrib` 一律不改名**（多处测试引用）。
3. 两带之间是 **`1px solid c.border` 分割线**（不是留白，也不是两个 Panel 的间隙）。
4. **删除 `WorkItem` 组件**（旧列表行），改为甘特渲染；`padding: '10px 12px'` 这一特征串在本文件应**归零**。
5. `getPersonOccupancy` 从 `../data/mock` **新增 import**；`work` / `workItems` / `workTotal` 不再使用（`getPersonProfile` 仍返回 `work`，不动 mock.js）。

**楼层 3（甘特）逐项规格**：

| 部位 | 规格 |
|------|------|
| PanelHead title | `近期工作内容` |
| PanelHead desc | `来自 Jira 的负责人字段 · 未来 8 周资源占用` |
| PanelHead extra | `${occ.rows.length} 项在办`（`.dp-num`，12px，`c.text3`）；**不写「显示近 N」**（甘特不截断） |
| 容器 | `<div className="dp-gantt-scroll"><div className="dp-gantt">…</div></div>`，`padding: '12px 16px 0'` |
| 表头行 | 首格（`.dp-gantt-head`）文本 `任务`（11px / `c.text2`）；其后 8 格：上行 `W1`…`W8`（12px/500/`c.text2`），下行 `09/14`…`11/02`（11px `.dp-num`/`c.text3`） |
| 本周标示 | **W1** 格加 `borderBottom: '2px solid ' + c.brand`，并在 `W1` 后附 `<span style={{fontSize:11,color:c.brand}}>本周</span>`。**只用品牌蓝**，不得出现红/橙/任何「落后/预警」语汇。 |
| 任务行（每条 `occ.rows[i]`） | 行首格 `.dp-gantt-rowhead` 两行：<br>行 1：`title` 13px/500/`c.ink`，单行 ellipsis + `title` 属性兜底<br>行 2：`<WorkStatusPill status/>` + `key`（11px `.dp-num`/`c.text3`）+ 右端 `due`（11px `.dp-num`/`c.text3`，**恒为 text3，不得因 overdue 变色**）<br>8 个周格：`weekIdx.includes(i)` → `.dp-gantt-cell.is-on`；`i === weekIdx[0]` → `+is-band-start`；`i === weekIdx[weekIdx.length-1]` → `+is-band-end`；否则空槽 `.dp-gantt-cell` |
| 任务条 | 填充 = `var(--dp-gantt-bar)`（经 `.is-on`），高 28px，行内垂直居中（`align-items:center` 已给） |
| 总占用行 | 行首格 `.dp-gantt-rowhead` + `.dp-gantt-total` 风格，文本 `总占用`（11px/`c.text2`）；8 格按 `totals[i].tier` 打 class `t-low`/`t-mid`/`t-high`（`null` 不打），格内居中数字 `12px/500/.dp-num/c.ink`，**空槽不显示数字** |
| 图例 | 总占用行下一行 12px/`c.text3`：三个 12×12（圆角 3）色块（分别 `--dp-gantt-l1/l2/l3`，**每块带文字**）+ 文案逐字 `周占用强度：轻（1 项）／中（2 项）／高（≥3 项）；格内数字为该周在办任务数。` |
| 空态（`occ.rows.length === 0`） | 逐字：`未来 8 周暂无在办任务占用。任务数据来自 Jira 的负责人字段，仅作协作参考。`（`padding:'20px 16px'; fontSize:13; color:c.text3; lineHeight:1.7`） |
| 脚注 | `padding:'10px 16px'; borderTop:1px solid c.border; fontSize:12; color:c.text3; lineHeight:1.7`，文案逐字：`任务来自 Jira 的负责人字段，仅作协作参考，不作为绩效评价。` |

**零判词红线（屏幕正文逐词 grep 必须 0 命中）**：
`忙` `空闲` `闲置` `清闲` `饱和` `满载` `超载` `过载` `压满` `绩效`（**例外：脚注里的「不作为绩效评价」是既有铁律文案，必须保留**）`考核` `评价`（同上例外位）`评级` `负载高` `负载低` `工作量` `落后` `逾期` `满负荷` `未充分利用`

> 注意：`逾期` 二字在本轮**任何屏幕正文中都不得出现**（这是 §0 偏离 #1 的配套约束：逾期任务照常渲染，但**不标记**）。

**不可点**：甘特行/任务条**不得**有 `role` / `tabIndex` / `cursor:pointer` / `<a href>`。

### 2.4 `tests/smoke.cjs` —— 门禁**重锚**（只许改锚点，不许删门、不许放松）

> **红线**：每一道被改的门都必须**保持或提高**原有的证伪能力。若某门在 v0.5 语境下已无意义，必须**换成等价强度的新门**并在报告里写明「旧语义 → 新语义」。

| 门 | 现锚点 | v0.5 新语义（必须实现） |
|----|--------|------------------------|
| ② 模块级 Panel 数 | `=== 4`（`:1740`） | **`=== 3`**（糅合层 1 + 工作 1 + 贡献 1）。**必须重新 dump DOM 复核**，不许直接改数字糊过去；报告里给出实得值。 |
| ③ 楼层顺序 | `hero → .dp-floor-tags → .dp-g-duo`（`:1750-1768`） | 改为：`.dp-shell` 直接子节点顺序 = `[Breadcrumb, .dp-person-head.dp-floor-merged, .dp-floor-work, .dp-floor-contrib]`；且 **`.dp-floor-tags` 必须存在于 `.dp-person-head` 之内**（糅合门，取代原「独立于 duo 之外」）；**`.dp-g-duo` DOM 0 命中**。 |
| ④ 无分组标题条 | `.dp-tag-floor` 内无 `height:32px` div | 不变（保留）。 |
| ⑤ 标签卡数 / 11px 组名 | 8 卡 / 8 带组名（`:1785`） | 保持 8/8。**追加**：每卡内 `.dp-tag-floor .dp-card` 的 `div` 中，含 `font-size: 11px` 的那个必须与档位条**同一父 flex 行**（即该 11px div 的 `parentElement` 内含 `width:64px` 的档位条）；并断言卡片 `padding` 为 `8px 10px`、标签名 `line-height` 为 `1.35`。 |
| ⑥ Panel 存在 + desc | desc = `来自 Jira 的负责人字段 · 当前至未来 1 个月`（`:1805`） | desc 改 `来自 Jira 的负责人字段 · 未来 8 周资源占用`；title 仍 `近期工作内容`。 |
| ⑥b 任务行上限 5 + extra 分档（`:1815-1837`） | 数 `padding: 10px 12px` 行 | **整段替换**为甘特门：<br>· `.dp-gantt` 存在于 `.dp-floor-work` 内；<br>· 表头 8 个周格，文本依序含 `W1..W8` 与 `09/14…11/02`；<br>· **min.zhou：任务行数 === 7**（**不是 5** —— 不截断，且逾期任务也在内），extra 文本含 `7 项在办`；<br>· **siyuan.chen：任务行数 === 9**，extra 含 `9 项在办`（切页验证，证伪硬编码 7）。 |
| ⑦ blocked 整行照常渲染（`:1848`） | 找含 `DS-3121` 的行 | 改锚 `.dp-gantt-rowhead`：`DS-3121` 在行首格内 + 含任务名 `设计规范文档站改版` + **不含** `待办/进行中/待评审`（状态位留空）。 |
| ⑧ 逾期仅日期染色（`:1874`） | `DS-3080` 日期色 = warningText | **语义反转**：`DS-3080` **必须出现在甘特中**（行首格含该单号与任务名），且其 `due` 文本色 = `c.text3`（`rgb(156,163,175)` 附近，**不得**是 `rgb(138,82,0)`/`rgb(232,137,12)`），**且整个 `.dp-floor-work` 内 `.dp-num` 无一为 warning 色**。这同时锁死「逾期照常渲染但不标记」与「旧染色逻辑未被残留」。 |
| ⑨ 任务行不可点（`:1902`） | 数 `padding:10px 12px` 行 | 改锚 `.dp-gantt-rowhead` + `.dp-gantt-cell`：都无 `role`/`tabindex`/`cursor:pointer`，`.dp-floor-work` 内无 `a[href]`。 |
| **新增 ⑩ 色带连续性** | — | min.zhou 的 `DS-3102`（weekIdx `[0,1]`）：W1、W2 两格的 `getComputedStyle().backgroundColor` 均 = `rgb(54,67,186)`（`c.brand`）；W1 格带 `is-band-start`、W2 格带 `is-band-end`；两格 `borderTopLeftRadius` W1 为 `4px`、W2 为 `0px`。这测「跨周色带」是否真的连成一条。 |
| **新增 ⑪ 总占用与可见行严格一致** | — | 读 DOM：总占用行 8 格的数字串 ↔ 用 `getPersonOccupancy('min.zhou')` 现算的 `totals[].count` 逐位相等（`[2,2,2,2,0,1,0,1]`）；并断言 `rows.length === 渲染出的任务行数`。 |
| **新增 ⑫ 三档可辨·非纯色块** | — | 总占用行 8 格：**每一格 `count>0` 必须含可见数字文本**；`count===0` 必须**无数字**；图例必须同时含 `轻`/`中`/`高` 三字与三个色块（色块 `width:12px` 且 `getComputedStyle().backgroundColor` 三值互不相同）。这条是本轮可访问性的**唯一依托**（§0 已声明 fill 对比度不达标），**不许弱化**。 |
| ③b CSS 规则门（`:2545`） | 查 `.dp-g-duo{...1fr 1fr}` 定义 + ≤900 塌缩 | 保留原断言（`.dp-g-duo` 定义与 `.dp-g-profile` 考古定义仍在、`.dp-g-article` 未污染），**追加** `.dp-gantt` 的 `grid-template-columns` 含 `repeat(8` 且含两档断点。 |

**门数**：v0.4.3 基线为 **194 项断言 / 194 通过 / 0 失败**。施工后断言总数**应 ≥ 194**（新增 ⑩⑪⑫ 会拉高），**失败必须为 0**。报告里给出**改后的确切三项数字**。

### 2.5 `tests/mutation.cjs` —— 变异集重锚 + 基线重建

1. **`TARGETS`**：本轮动了 `src/global.css` 与 `src/components/ui.jsx`（`mock.js` team-lead 已重锚，施工方**不要碰**）。改完源码后跑
   `node tests/mutation.cjs --print-sha`，把 `src/global.css`、`src/components/ui.jsx` 两行原样同步。**其余 5 行必须逐字不变**。
2. **M13 / M14 必须替换**（它们锚定 `.dp-g-duo` 两栏几何，v0.5 已无该 DOM → 会空转）：
   - 新建 `tests/_geom_gantt.cjs`：**照抄 `tests/_geom_duo.cjs` 的结构与采集口径**（真实 Chrome + CDP、`file://` 产物、Node 22 全局 `WebSocket`——**绝不用 `ws` 包**、`Runtime.evaluate` 取值路径是 `r.result.result.value`），改为量 **1440 视口下 `.dp-gantt-head` 内 8 个周格的实际渲染宽度**，裁据：
     ```
     8 格宽度两两相对偏差 ≤ 8%  → 视为等分（inBand）
     且首格（任务列）宽度 > 周格宽度 × 1.2 → 视为栅格生效（未塌成单列）
     ```
     外加一条 **`body`/`documentElement` 无横向溢出**（`scrollWidth <= clientWidth + 1`）——顺带守住「滚动只在 .dp-gantt-scroll 内」。
   - 变异 M13：把 `.dp-gantt` 的 `display:grid` 打掉（改 `display:block`）→ 8 格堆叠 → 几何门必须变红。
   - 变异 M14：把 `repeat(8, minmax(44px,1fr))` 改成 `repeat(8, minmax(44px,1fr))` 之外的自定义项，例如把**最后一列**单独拉宽 → 宽度不等 → 几何门必须变红。
     （实现方式你定，但**必须证明该变异只靠这条几何门变红**，即报告里给出 redBy。）
   - `mutation.cjs` 里把 `geomDuo()` 换成 `geomGantt()`（调 `tests/_geom_gantt.cjs`），`gate:'geom-duo'` 全部改 `'geom-gantt'`。
3. **新增 2 条文本/数据门变异**（自证门⑪⑫不是空转）：
   - 对 `src/global.css`：把 `.dp-gantt-cell.is-on { background: var(--dp-gantt-bar) }` 的值改成 `--dp-gantt-l1` → 门⑩（色带色 = `rgb(54,67,186)`）应变红。
   - 对 `src/data/mock.js`：把 `OCCUPANCY_TIER_THRESHOLDS = { mid: 2, high: 3 }` 改成 `{ mid: 9, high: 99 }` → 门⑪（tier 与 count 映射）或门⑫（三档可辨）应变红；若两门都不红，**说明门⑪⑫是装饰性断言，必须回去加强门本身**。
   - ⚠️ 每个 `find` 串在源文件中必须**恰好命中 1 次**（`mutation.cjs` 有此硬校验），命中 0 或 ≥2 次一律失败。
4. **变异总量**：v0.4.3 为 13 条全红。v0.5 施工后条数**只增不减**，且**全部必须变红**（报告里列出每条 `id / 断言名 / 是否红 / redBy`）。

### 2.6 `tests/shots.cjs` —— 断言 1d 重锚

`:102-110` 的采集函数与 `:581-620` 的断言 1d 锚定 `.dp-g-duo` 两列几何，v0.5 已无该 DOM。
改为量 **`.dp-gantt` 的几何**：1440 下 8 个周格宽度等分（相对偏差 ≤8%）、且任务列明显更宽；768 下 `.dp-gantt-scroll` 应出现横向滚动（`.dp-gantt.scrollWidth > .dp-gantt-scroll.clientWidth`）而 **`document.documentElement.scrollWidth <= clientWidth + 1`**（页面本身不超宽）。
其余断言（1a–1c、2–4）**不动**。

### 2.7 离线交付约束（硬约束，破一条即不算完成）

- 产物 `dist/index.html` 必须能**双击直接打开**（`file://`）：IIFE、无 `type="module"`、无 `crossorigin`、无 `importmap`、**零外部网络请求**。
- 施工后必须跑一次 `vite build` 并确认输出含 `built in`，且重建不产生 `git status` 差异（**可复现构建**）。

---

## 3. 施工方自证清单（缺一项不算交付）

1. `vite build` 成功，贴 `built in Xs` 与 `dist/assets/index.js` 体积。
2. `node tests/smoke.cjs` → 贴**合计 N 项断言，通过 P，失败 0** 三数（N ≥ 194）。
3. `node tests/mutation.cjs` → 贴**全部条目**的 `id / 断言名 / 红 or 绿 / redBy`，并贴汇总行；**必须全红**。
4. `node tests/shots.cjs` → 贴 1d 的新结果（1440/768）。
5. **DOM dump 证据**：`.dp-shell` 直接子节点的 `className` 数组（证明 4 个且顺序正确）+ 模块级 `.dp-card` 实得数（证明 3）。
6. **零判词 grep**：贴出 §2.3 禁用词表在**构建产物**（`dist/assets/index.js`）中的命中数（须为 0，`不作为绩效评价` 除外——该串是既有铁律，需单独列出证明未误伤）。
7. **改动的门清单**：逐条 `旧锚点 → 新锚点 → 为什么证伪能力没下降`。
8. **偏离契约处**：凡有，逐条列出并说明。
9. 提交：`git add -A && git commit` 到 `main`，**贴 commit hash**。

---

## 4. 明确**不要做**的事

- ❌ 不要修改 `src/data/mock.js`（team-lead 已完成）。
- ❌ 不要把 `.dp-gantt` 做成「只有底色没有数字」的色块热力图。
- ❌ 不要引入任何红/橙/黄/绿的语义色。
- ❌ 不要删掉任何 `smoke.cjs` 的门；只许**重锚**或**换成等价强度**。
- ❌ 不要改 `global.css` 里 `.dp-g-duo` / `.dp-g-profile` / `.dp-g-article` 的既有定义。
- ❌ 不要动 `TagLike` 之外任何 `height: 22`。
- ❌ 不要重命名 §2.3 列出的既有 class。
