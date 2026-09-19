# P4 质量审查报告 · 员工个人主页 + 统一 Digital 标签体系

> 质量审查官：严过审（Yan）　｜　主理人：画统筹
> 审查对象：`portal/` 本次新增/修改文件（PersonProfile / TagBrowse / ui.jsx 三件套 / theme.js / global.css / mock.js / router.js / App.jsx / Workspace.jsx / GlobalSearch.jsx）
> 事实来源：`outputs/p1-requirements.md`、`outputs/p2-design-system.md`、`portal/README.md`
> 审查方法：**逐文件读源码 + 独立运行证据解算器推演**（不采信实现者报告）。独立脚本 `portal/tests/_audit-reviewer.mjs`（另见文末「复现方式」）。
> **声明：本次审查对「已通过的测试」保持怀疑，并额外报告了测试盲区。**

---

## 一、5 维评分表

| 维度 | 评分 | 说明 |
|------|------|------|
| **设计哲学一致性** | **5/5** | 双轴不合成、实证度单色阶、不排名——三条核心决策在代码里都能找到对应实现，不是口号。形状语汇（圆点阵 vs 分段胶囊）被忠实落地为「物理上不可相加」。 |
| **信息层次** | **4/5** | 页头（认人）→ 标签矩阵（主角）→ 贡献列表（佐证）的优先级与需求 E.1 完全一致；`dp-g-article` 双栏、领域轴在上、主标签右对齐均到位。扣分点：右栏「协作触点」为空时仍渲染一个带 `FileTextOutlined` 图标的 Panel 占位，属于「为填满布局而存在」的模块。 |
| **执行精度** | **4/5** | 尺寸（点 7/11px、gap 4/6px、总宽 40/62px、条 6×64/8×160px）与规范**逐项相符**；段间缝 2px/3px 正确；零硬编码色在组件层成立。扣分点：两处边界 bug（`parseOwnerName` 尾分隔符、alias 唯一性破口）与一处 4 等分之外的「自评/实证索引」语义隐患（详见 P1-2）。 |
| **特异性** | **5/5** | ◈/◇/◆ 几何前缀、四档单色阶 `#DCE0F4→#A9B2E6→#6B78D4→#3643BA`、吹牛态虚线空槽——这套标签语汇在本门户之外认不出来，且完全复用既有品牌资产（零新色相）。 |
| **克制** | **4/5** | 没有紫渐变、没有 emoji 图标、没有插画、没有排行榜、没有分数暴露；空态自建不用 `Result`。「吹牛态」标记被**过度使用**（见 P1-1），使一个本该稀缺的诚实标记变成了大面积视觉噪音——这是本次最主要的克制失分。 |

**总分：22/25 —— 每个维度均 ≥3，超过通过线。**
**门控结论：P0 = 0，P1 = 4，P2 = 6 → 按框架属「通过」。**

---

## 二、逐项审查发现（8 点，均附文件 + 行号 + 代码片段）

### 点 1 · 「不是绩效分」语义边界 —— **守住，且做得比预期更彻底**

**1.1 实证度 4 档配色 = 单色阶，无红黄绿。** ✅
`portal/src/theme.js:72-74`
```js
brandStep1: '#DCE0F4', // 实证度 none 档填充 + 已选 chip 加深底
brandStep2: '#A9B2E6', // 实证度 emerging
brandStep3: '#6B78D4', // 实证度 established
```
最高档直接复用 `c.brand`（`ui.jsx:385`）：
```js
const fillColor = [c.brandStep1, c.brandStep2, c.brandStep3, c.brand][tierIdx] || c.brand;
```
`success/warning/error` 三色在 `ui.jsx` 的标签体系段（314–950 行）**一次未出现**。**无红黄绿，通过。**

**1.2 TagBrowse 结果列表按姓名排序，非按实证度。** ✅
`portal/src/pages/TagBrowse.jsx:73`
```js
return Array.from(set).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
```
且在 `PanelHead.desc` 主动声明（`TagBrowse.jsx:170` / `:233`）：「按姓名排序」「不做任何基于贡献度的排序」。**独立运行验证**：`peopleWithTag('c-product')` 返回 `["周敏","陈思远","刘倩"]`（按姓名，非按实证）。**通过。**

**1.3 无「两个人成熟度并排可比」的形态。** ✅
`TagBrowse.jsx:148-152` 明确注释并实现「结果行不显示成熟度」：
```js
// 结果行不得显示成熟度档位文案（反查页职责是找人，不是判断人）
```
去全部渲染路径后确认：`MaturityAxis` **只在** `PersonProfile`（单人）与 `TagMatrix`（同一人的多标签）中出现，**不存在跨人横向比较的形态**。**通过。**

**1.4 MaturityAxis 填充比例 = 4 等分，不是按分数比例。** ✅ **（重点核实项，结论正确）**
`portal/src/components/ui.jsx:436-446`
```js
{[1, 2, 3, 4].map((lv) => (
  <span key={lv} style={{
    flex: '1 1 0',            // ← 4 段等分，等宽
    height: '100%',
    borderRadius: 999,
    background: lv <= evIdx ? fillColor : c.border,
  }} />
))}
```
`flex: '1 1 0'` 是等分布局，**未使用 `recentScore` 计算任何宽度**。**通过。** （`recentScore` 存在于数据层但从未进入渲染。）

**1.5 加权分数未暴露给用户。** ✅
独立脚本确认 `getPersonProfile` 返回的对象**含** `recentScore`（数据层字段，`mock.js:1281`），但全量搜索 JSX 后确认：**任何组件都没有渲染 `recentScore`**。UI 只出现「N 条」（条数）与「近 12 月 K 条」（时间窗），符合 D.2 第 3 条。**通过。**

---

### 点 2 · 两轴「不可相加」—— **忠实落地**

**2.1 自评 = 圆形点阵。** ✅
`ui.jsx:388-408`
```js
const on = lv <= selfIdx;
background: on ? c.brand : 'transparent',
border: on ? 'none' : `1.5px solid ${c.brandBorder}`,
```
已达实心 `c.brand`、未达空心 + 1.5px `c.brandBorder`——与规范 B.1 **逐字相符**。

**2.2 实证 = 4 段等分胶囊条。** ✅
`ui.jsx:427-447`：`borderRadius: 999`、`gap: segGap`（2px/3px）、4 段。圆角、缝宽、段数全部正确。

**2.3 两轴视觉可区分（蓝 vs 灰 + ◈ vs ◇）。** ✅
`ui.jsx:340`
```js
const AXIS_GLYPH = { domain: '◈', capability: '◇' };
```
`ui.jsx:582-584`
```js
const axisBg = isDomain ? c.brandSubtle : c.page;
const axisBorder = isDomain ? c.brandBorder : c.border;
const axisColor = isDomain ? c.brand : c.text2;
```
`TagMatrix` 卡片标题也用同一 glyph（`ui.jsx:886`）：`{AXIS_GLYPH[t.tag.axis]} {t.tag.label}`。**通过。**

**2.4 没有把两轴合成一个综合分。** ✅ 全量搜索无 `(selfRating + evidence)`、无综合分变量、无加权求和进入 UI。**通过。**

---

### 点 3 · 双轴成熟度的边界情况

**3.1 吹牛态（自评 ≥practicing 且实证 none）：显示「暂无实证 · 仅自评」+「该标签暂无公开贡献佐证」；点阵不灰化/不加删除线。** ✅
`ui.jsx:374`
```js
const boast = selfIdx >= 3 && evidenceTier === 'none';
```
`ui.jsx:450-451`：`evidenceCopy = boast ? '暂无实证 · 仅自评' : ...`，颜色 `c.text3`。
`ui.jsx:413-425`：轨迹改虚线空槽 `border: 1px dashed c.dashedBorder; background: transparent`。
`ui.jsx:505-518`：L4 提示行「该标签暂无公开贡献佐证」，`fontSize: 11, color: c.text3`。
点阵渲染路径（388-408）**不接收 boast 参数**，即点阵在吹牛态下与常态**完全相同**——**没有灰化、没有删除线、没有降透明度**。规范 B.4「不为用户自评道歉」被忠实执行。**通过（这是本次执行精度的一个亮点）。**

**3.2 反例：只自评 curious/following 且实证 0 的人不应被标记。** ✅ **（重点核实项）**
`selfIdx >= 3` 的守卫正确。独立脚本逐人验证：
```
周敏: 低自评空实证(不应标记)=内容运营(following),产品设计(following),视觉表达(following)
```
这些 `following` 标签 **未** 进入吹牛态列表。**阈值判定正确，通过。**

**3.3 空态用自建 PageEmpty，非 antd Result。** ✅
`ui.jsx:806-816`
```js
if (empty || tags.length === 0) {
  return (<Panel><PageEmpty compact title="暂无标签" desc="..." /></Panel>);
}
```
`PageEmpty` 为自建组件（`ui.jsx:959`）。**通过。**

---

### 点 4 · 闭环验收联动 —— **真实成立（独立推演确认）**

**独立验证方法**：不采信实现者断言，直接 import `mock.js` 后对 10 人逐一推演「每个 `evidenceTier !== 'none'` 的标签，其 `contributions.filter(e => e.tagIds.includes(tag.id))` 是否 ≥1」。

**结果**（脚本输出原文）：
```
[沈知微 / zhiwei.shen] ... ✓ 数据平台 tier=authoritative score=7 → 命中 3 条
[何嘉 / jia.he]        ... ✓ SSO 统一身份 tier=established score=3 → 命中 1 条
[郑远 / yuan.zheng]    ... ✓ 供应链数字化 tier=established score=5 → 命中 2 条
...
闭环失败数: 0
```
**闭环在所有 10 人、所有 13 个「实证档位 ≥1」的标签上独立复现成功，失败数 0。通过。**

**关于 min.zhou（周敏）是否「解算器算出分数但映射不到标签」的静默失败 —— 不存在。**
```
周敏/min.zhou: 有实证标签 0/8 → 无
  设计系统 self=advocating tier=none score=0 feeding=0 ...
  全部贡献条目: (空)
```
她的**贡献条目数为 0**（不是「有分数但没映射」），因此 8 个标签的 `recentScore` 全为 0、`evidenceTier` 全为 `none`，`feeding` 全为 0。**数据自洽，无静默失败。** 她是被规范 D.3/C.4 明确设计为「纯吹牛态示例」的样本，符合预期。

**⚠️ 但审查发现一处「测试盲区」（非实现 bug）**：`smoke.cjs:1099-1107` 的闭环断言逻辑偏弱：
```js
const tierPositive = pageHas(doc, '有稳定的产出') || pageHas(doc, '有初步产出') || pageHas(doc, '有沉淀与影响力');
const hasArrow = pageHas(doc, '→');
if (!tierPositive || hasArrow) { ok(...) } else { fail(...) }
```
这是**页面级存在性检查**，不是**逐标签闭环检查**。若某人只有标签 A 有实证却缺 A 的箭头、而标签 B（也有实证）的箭头存在，断言仍会通过。建议后续加固为「对每个正档位标签名，检查其对应 → 标注存在」（见 P2-3）。

---

### 点 5 · 两个数据层坑

**5.1 owner 格式不统一 —— 解析器正确，但有一个边界漏洞（P1-2）。**
`mock.js:1107-1115`
```js
export function parseOwnerName(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.includes('·')) {
    const parts = s.split('·');
    return parts[parts.length - 1].trim();   // 取最后一段
  }
  return s;
}
```
**独立边界测试结果**：
```
"郑远" → "郑远"                          ✓ 裸名
"会员增长组 · 陈思远" → "陈思远"           ✓ 组·名
" 门店数字化组 · 林望 " → "林望"           ✓ 前后空格
"A · B · 陈思远" → "陈思远"               ✓ 多分隔符（取末段）
"SRE 组 · 何嘉" → "何嘉"                  ✓
"· 何嘉" → "何嘉"                         ✓ 前导分隔符
"何嘉 ·" → ""                            ❌ 尾分隔符 → 空串（静默失败）
"组名没有人名" → "组名没有人名"            ⚠️ 无「·」时原样返回组名，会被当作人名去匹配
```
**漏洞**：`"何嘉 ·"`（尾分隔符）返回**空串**，静默失败；`"组名没有人名"` 返回组名本身。当前 mock 数据里**不存在**这两种输入（已核实 `announcements`/`projectUpdates`/`releaseNotes` 的 owner 均为「组 · 姓名」或裸名），所以**不构成线上 bug**，但解析器不够健壮。属 P1（防御性修复）。

**5.2 幽灵贡献者「周立」—— 确实未产生个人主页，也未污染任何人。** ✅
`mock.js:265-274`（`releaseNotes` 中 `owner: '周立'`，v2.9.0）。
`mock.js:1250`：`orgPeople.find((p) => personId(p.email) === key)` → `personId('zhou.li')` 在 `orgPeople` 中无匹配。
**独立验证**：
```
getPersonProfile("zhou.li") → person: null
周立泄漏到个人页的次数: 0
orgPeople 含周立? false
```
**通过。** 且 `getPersonProfile` 早退（`mock.js:1251`）返回空 profile，不会抛错。

**⚠️ 但发现一处数据自洽性瑕疵（P2-1）**：周立的记录 `date: '2026-09-30'` 是**未来日期**（晚于 `EVIDENCE_AS_OF = '2026-09-17'`），且 `status: 'planned'`。当前因 `withinWindow` 的 `d <= asOf` 守卫（`mock.js:1123`）被排除，但它是一颗**哑弹**：`collectEvidence` 从不检查 `status`，即「**planned（未发布）的 Release 会被当作实证**」。若未来某条 planned Release 的 owner 是真人员，就会凭空产生实证。建议在 `collectEvidence` 里跳过 `status !== 'released'`。

---

### 点 6 · 设计规范忠实度 —— **逐项核对，绝大部分精确，3 处「实现了但不可达」**

**6.1 MaturityAxis 尺寸。** ✅ 逐项相符
`ui.jsx:377-382`
```js
const dotSize = expanded ? 11 : 7;      // 规范 7px / 11px  ✓
const dotGap  = expanded ? 6 : 4;       // 规范 4px / 6px   ✓
const trackH  = expanded ? 8 : 6;       // 规范 6px / 8px   ✓
const trackW  = expanded ? 160 : 64;    // 规范 64px / 160px ✓
const segGap  = expanded ? 3 : 2;       // 规范 2px / 3px   ✓
```
点阵总宽由 `dotSize*4 + dotGap*3` 自然得出 40px / 62px，与规范一致。

**6.2 TagChip 五态是否都实现。** ⚠️ **五态在组件内都实现了，但「已停用 / 已合并」在应用内不可达（P1-4）**
`ui.jsx` 内分支：`merged`(617)、`deprecated`(645)、`disabled`(686)、`primary`(709)、`selected`(738)、`active`(768)——**五态 + 更多都在**。
**但**：全量搜索所有 JSX 调用点后确认，**没有任何页面传入 `status="deprecated"` 或 `status="merged"`**：
- `TagBrowse.jsx:52` 显式过滤掉：`t.status !== 'deprecated' && t.status !== 'merged'`
- `TagBrowse.jsx:58`：`t.status === 'active'`
- `PersonProfile.jsx:85/97`、`TagBrowse.jsx:115/146/216`：均未传 `status`

因此 `d-ai-stack`（deprecated）与 `d-agent-framework`（merged, mergedInto `d-agent`）这两个词**永远不会被渲染**。规范 C.4 的「已合并必须永远可见」这条要求**在运行中的应用里无法核验**。属 P1-4（规范与实现脱节，非崩溃性）。

**6.3 已合并「原『旧名』」角标是否永远可见。** ⚠️ **实现上永远可见，但引号字符与规范不符，且整体不可达**
`ui.jsx:637`
```js
原「{originLabel}」     // ← 实现用 「」（U+300C/U+300D）
```
规范 C.4 与 G.4 均写 **`原『旧名』`**（U+300E/U+300F 双角引号）。属字符级偏差（P2-4）。另外 `originLabel` 从未被传入（`_audit` 确认），角标分支不可达。

**6.4 TagMatrix 单 Panel 双分区、领域轴在上。** ✅
`ui.jsx:922-938`
```js
<Panel>
  <PanelHead title="标签" desc={`领域标签 ${domain.length} · 能力标签 ${capability.length}`} .../>
  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
    {axisBlock('domain', '领域轴', domain)}      // ← 领域轴在上 ✓
    {axisBlock('capability', '能力类型轴', capability)}
  </div>
</Panel>
```
**单 Panel、双分区、领域轴在上、分区间距 20px（大于卡间 12px）——全部符合。通过。**

**6.5 某轴无标签时分区保留（标题条 + 「暂无领域标签」）。** ✅
`ui.jsx:904-920`
```js
{list.length === 0 ? (
  <div style={{ fontSize: 12, color: c.text3, padding: '2px 2px' }}>
    {key === 'domain' ? '暂无领域标签' : '暂无能力标签'}
  </div>
) : (...)}
```
标题条在 `axisBlock` 内无条件渲染（`:907`）。**通过。**

**6.6 标签数量悬殊版式不塌（align-items: start，不补占位卡）。** ✅
`ui.jsx:914`
```js
<div className="dp-grid dp-g3 dp-grid--tight" style={{ alignItems: 'start' }}>
```
`list.map(tagCard)` 直接映射，**无任何占位卡或「+ 添加」卡**。**通过。**
（`.dp-grid--tight { gap: 12px }` 定义在 `global.css:449-451`，未改 `.dp-grid` 默认 16px ✓）

**6.7 标签名强制单行（nowrap + ellipsis）。** ✅
`ui.jsx:880-882`
```js
whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
```
**通过。**

---

### 点 7 · 与既有铁律的冲突

**7.1 零硬编码颜色（组件层）。** ✅
在 `ui.jsx` 全量搜索 `#[0-9A-Fa-f]{3,6}`：**0 命中**。所有颜色取自 `useT()`。字面色值只出现在 `theme.js` 与 `global.css`（README:94 明确允许这两处）。**通过。**

**7.2 胶囊圆角签名（999/8/6）。** ✅
`TagChip` 999px（`:594`）；标签卡 `Panel` 用 `.dp-card` = 8px；分区标题条 `borderRadius: 6`（`ui.jsx:834`）；实证条 999px（规范 B.2 已论证其为「标签组成部分」）。**未引入新圆角值。通过。**
（一处旁观：`PersonProfile.jsx:192` 主标签小卡 `borderRadius: 8` ✓ 卡片级；`:193` `background: c.surface` ✓）

**7.3 卡片静止 1px 无阴影，阴影只两档。** ✅
`Panel`（`ui.jsx:83`）静止为 `.dp-card`（1px border，无阴影），hover 才加 `.dp-card--hover`。新代码中唯一的 `box-shadow` 是 `ui.jsx:752` 的 `inset` 内阴影（「已选」chip 环），**非抬升语义**，不占用两档外阴影名额——与规范 F 表第 3 条判断一致。**未新增阴影值。通过。**

**7.4 品牌黄 `#FFCD4E` 未误用于主标签。** ✅
主标签用 `border: 1.5px solid ${c.brand}`（`ui.jsx:722`），**未使用 `c.yellow`**。标签体系段内 `yellow` 零出现。**通过。**

**7.5 等宽数字只用于数字，未误用于中文标签名。** ✅
全量核查 `dp-num`/`dp-mono` 的使用点：均落在日期、计数、百分比、编号、邮箱、字号提示等**纯数字/技术串**上。**标签名一律走默认 `fontSans`**（`ui.jsx:886` 无 `dp-mono`/`dp-num` 类）。**通过，且纪律保持良好。**

**7.6 键盘可达性（role + tabindex + Enter/Space + :focus-visible）。** ✅
- 标签卡：`ui.jsx:855-864` 有 `role`/`tabIndex`/`onKeyDown`(Enter/Space)
- 反查结果行：`TagBrowse.jsx:194-202` 同上
- 组织速查行：`Workspace.jsx:301-313` `onRow` 绑 `role: 'button'` + `tabIndex: 0` + Enter/Space ✓
- `:focus-visible` 复用既有 `.dp-card[role='button']:focus-visible` / `.dp-row:focus-visible`（`global.css:694` 附近），**未新造焦点环**。
**通过。**

**7.7 空态避开 antd Result。** ✅ 全量搜索无 `Result` 组件引用；`smoke.cjs:413-417` 的反插画断言保持有效。**通过。**

---

### 点 8 · Anti-Slop 检测

| 检测项 | 结论 |
|--------|------|
| 为填不满布局而加内容（占位卡/无意义装饰） | ⚠️ **一处**：`PersonProfile.jsx:309-318` 当 `myTools` 为空时，仍渲染一个含 `FileTextOutlined` 图标的「协作触点」Panel 来说「暂无」。这属于「为了补全右栏而存在的空模块」。建议整块 `null`（右栏只剩一个贡献 Panel 完全可接受）。 |
| 与上一版重复的冗余模块 | ✅ 未发现重复。 |
| 视觉噪音（过多颜色/分隔线/层级） | ⚠️ **吹牛态标记泛滥**（见 P1-1）：全部门 13 个「有实证标签」对约 43 个「吹牛态标签」，吹牛标记出现频率是正面标记的 3 倍以上，使「诚实标记」沦为背景噪音。 |
| 文案具体性（无「提升效率/赋能」空话） | ✅ 抽查全部新文案：`「该标签暂无公开贡献佐证」`、`「选一个或多个标签，结果会显示同时相关的人」`、`「结果按姓名排序，不做任何基于贡献度的排序」`——**具体、无空话**。 |
| 占位文案（「敬请期待」「即将上线」） | ✅ 全量搜索 0 命中。 |
| 通用 emoji 替代图标 | ✅ 无 emoji；用 Unicode 几何符 ◈◇◆→×（非 emoji，符合规范）。 |
| 紫色/彩虹渐变、圆角卡+左侧彩条等 AI 套路 | ✅ 0 命中。 |

---

## 三、Anti-Slop 门控结果

| 级别 | 数量 | 判定 |
|------|------|------|
| **P0 阻断** | **0** | ✅ 无紫色渐变、无编造数据、无 emoji 图标、无 AI 套路卡、无破碎布局、无对比度不达标、有响应式 |
| **P1 影响品质** | **4** | 见下 |
| **P2 可选优化** | **6** | 见下 |

**门控通过（P0=0，P1=4 ≤ 阈值外的宽容，但建议修复）。**

---

## 四、必修问题清单

### P0 —— 阻塞交付
**无。**

---

### P1 —— 建议修复（影响品质）

**P1-1 · 「吹牛态」标记严重泛滥，诚实标记退化为视觉噪音。**
- **证据**：`mock.js:986-1088` 的 `personTags`；独立脚本输出：
  ```
  何嘉/jia.he: 吹牛态=CI/CD,可观测性,Grafana,稳定性工程,可靠性设计,系统架构,跨团队协同 (7 个)
  孙玥/yue.sun: 吹牛态=内容运营,知识沉淀,跨部门协同,内部门户,内容撰写,干系人沟通 (6 个)
  ...
  ```
  全部门共 **43 个吹牛态标签 / 约 78 个标签**。规范 `p1-requirements.md:139` 与 `mock.js:984` 只声明「刻意保留**两位**吹牛态」。
- **影响**：当一半以上的标签都挂着「暂无实证 · 仅自评」虚线槽 + 「该标签暂无公开贡献佐证」提示行时，(a) 页面被虚线模板和灰字刷屏，Anti-Slop 意义上的视觉噪音；(b) 语义上把「吹牛指控」施加到了**几乎所有人**头上，与规范 D.3「让吹牛在视觉上有成本」的**稀缺性前提**自相矛盾——人人都是吹牛者等于没人被标记；(c) 对真实用户是不当的负面暗示。
- **修复建议（二选一）**：
  1. **调数据**（推荐）：把 `personTags` 中每人 `practicing/advocating` 且无证据的标签，改为 `curious/following`，只保留 `min.zhou` + 1 位作为吹牛态样本，使吹牛态落到规范原意的「2 位」。
  2. **调机制**：若业务上确实要表达「自评高于实证是常态」，则应把大面积的「暂无实证 · 仅自评」从**虚线 + 提示行**（强提示）降级为**中性档位文案**（弱提示），仅在「自评最高档 advocating 且实证 0」时才启用虚线空槽（即把 `selfIdx >= 4` 作为强标记阈值，`== 3` 用弱标记）。

**P1-2 · `parseOwnerName` 尾分隔符返回空串（静默失败）。**
- **证据**：`mock.js:1107-1115`；独立测试 `parseOwnerName("何嘉 ·") → ""`。
- **影响**：当前 mock 数据无此输入，不构成线上 bug；但解析器对「组 · 姓名」的健壮性依赖数据恰好规整，一旦数据侧出现尾分隔符或多空格，实证度会**静默归零**（影响的是「谁懂什么」的准确性，正是本模块的核心价值）。
- **修复建议**：
  ```js
  export function parseOwnerName(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (s.includes('·')) {
      // 过滤空段，取最后一个非空段
      const parts = s.split('·').map((x) => x.trim()).filter(Boolean);
      return parts.length ? parts[parts.length - 1] : '';
    }
    return s;
  }
  ```
  并建议补一条单测：`parseOwnerName('何嘉 ·')`、`parseOwnerName('· 何嘉')`、`parseOwnerName('A · B · C')`。

**P1-3 · `collectEvidence` 不检查 `status`，「planned（未发布）的 Release」会被计入实证。**
- **证据**：`mock.js:1210-1221`，`releaseNotes` 循环只取 `owner/date/system`，**未读 `r.status`**。数据里 `mock.js:266-273` 的 `v2.9.0` 正是 `status: 'planned'`。
- **影响**：当前因 owner 是幽灵「周立」+ 未来日期被双重排除，未显形。但它是一条**语义破口**：把「计划中」的发布算作「已完成的知识贡献」，与 D.2「实证度 = 已发生的佐证充分度」相悖。若未来某条 planned Release 归属真实成员（且日期落在窗口内），会产生虚假实证。
- **修复建议**：`mock.js:1211` 循环体内加守卫：
  ```js
  releaseNotes.forEach((r) => {
    if (r.status && r.status !== 'released') return; // planned 不算实证
    ...
  });
  ```
  （同时把 `v2.9.0` 的 `date` 改为窗口内的真实历史日期，或明确保留在「计划」区不计分。）

**P1-4 · TagChip 的 `deprecated` / `merged` 两态在应用内不可达，规范 C.4 要求无法核验。**
- **证据**：`TagBrowse.jsx:52`（`t.status !== 'deprecated' && t.status !== 'merged'`）、`:58`（`t.status === 'active'`）；全部 `TagChip` 调用点不传 `status`。词表里 `d-ai-stack`（deprecated）、`d-agent-framework`（merged）永不渲染。
- **影响**：规范 `p2-design-system.md:355` 明确「合并必须**永远**可见（可审计性）」——这条是本次标签生命周期管理的核心可审计承诺，但交付物里**没有任何界面证据**能证明它工作。
- **修复建议**：在 `TagBrowse` 筛选器下方新增一个**「词表演进」/「已归档标签」折叠区**（或标签详情页），专门渲染 deprecated / merged 词（含「原『旧名』」角标），使 C.4 五态在 UI 中真实可达、可验收。若产品上确实不打算暴露，则应在 `p2-design-system.md` 中**显式标注这两态为「内部机制态，不对用户暴露」**，避免规范与实现长期脱节。

---

### P2 —— 可选优化（可延后）

- **P2-1 · 未来日期的数据自洽性**：`mock.js:268` `v2.9.0` 的 `date: '2026-09-30'` 晚于 `EVIDENCE_AS_OF='2026-09-17'`。建议改为历史日期或移除，避免「基准日之后的数据存在」这类边界混淆。
- **P2-2 · `TagArrow` 组件（`ui.jsx:942`）已导出但从未被使用**：`PersonProfile.jsx:95-98` 内联了等价的箭头结构，未复用 `TagArrow`。建议要么复用（保证 C.5 规格单点维护），要么删除该导出（避免死代码）。
- **P2-3 · 加固闭环断言的严格度**：`smoke.cjs:1099-1107` 目前是页面级存在性检查。建议改为逐标签检查：对页面上每个出现的正档位标签名，断言「贡献列表中存在含该标签名的 → 标注」，避免「A 缺箭头被 B 的箭头掩盖」。
- **P2-4 · 已合并角标引号字符与规范不符**：`ui.jsx:637` 用 `原「{originLabel}」`，规范 C.4/G.4 为 `原『旧名』`（双角引号）。建议统一为 `『』`。
- **P2-5 · `MaturityAxis` 的 `extraText`（hover 原地追加「 · 近 12 月 N 条」）规格未接入**：`ui.jsx:364/501` 已实现，但无调用方传入（`PersonProfile.jsx:203-211` / `TagMatrix` 均未传）。规范 B.6 的 hover 行为在应用内不可见。建议接入或在规范中标注为「预留」。
- **P2-6 · 右栏「协作触点」空态不该渲染占位 Panel**（Anti-Slop）：`PersonProfile.jsx:309-318`。建议直接 `return null`，让右栏在无工具时只剩贡献列表。

---

## 五、结论

> **判定：PASS**（每维 ≥3 分，P0 = 0）
>
> 本次产出**达到品牌级水准**：双轴不合成、单色阶、不排名三条核心决策被忠实落地到代码与形状语汇层；闭环约束经**独立推演**在全部 10 人、13 个正档位标签上成立；幽灵贡献者与零硬编码色两条数据/工程铁律守得很干净。
>
> **但建议在下一轮修订中修掉 4 条 P1**，其中 **P1-1（吹牛态泛滥）** 是唯一影响「设计哲学一致性」观感的问题——它不破坏机制的正确性，却破坏了机制**稀缺性**这一设计前提；**P1-4（deprecated/merged 不可达）** 则使规范的一条硬承诺失去可验收性。二者都不是崩溃性缺陷，属「完成度」问题，故不触发 REVISE。
>
> **给原型构建师的修订要求（按优先级）**：① 收敛 `personTags` 中的吹牛态至规范原意的 2 人（P1-1）；② `parseOwnerName` 过滤空段 + 补单测（P1-2）；③ `collectEvidence` 跳过 `status !== 'released'` 的 Release（P1-3）；④ 给 deprecated/merged 词一个可达的渲染出口，或在规范中标注其为内部态（P1-4）。

---

## 附录 · 复现方式

独立审查脚本：`portal/tests/_audit-reviewer.mjs`
```bash
cd portal && node tests/_audit-reviewer.mjs   # 输出同时写入 tests/_audit-clean.txt（UTF-8）
```
脚本不 import 任何 React，直接 import `src/data/mock.js`，因此解算结果的推演**与页面渲染解耦**——断言的是数据层事实，而非 DOM 表象。审查全程未修改任何被审代码。
