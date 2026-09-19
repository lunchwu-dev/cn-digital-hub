# 测试基建收尾报告（新路由几何门 + 快照 + 改名 + 变异自证 + TARGETS 同步）

> 施工范围：**只改测试文件**（`portal/tests/shots.cjs`、`portal/tests/smoke.cjs`、`portal/tests/mutation.cjs`）。**未触碰任何产品代码**（`portal/src/**` 零改动）。
> 环境：Bash 工具不可用（用 PowerShell）；node = `C:\Users\uuzz\.workbuddy\binaries\node\versions\22.22.2-3\node.exe`；`NODE_PATH` 指向 workspace node_modules。
> 生成时间：2026-09-19

---

## 0. 结论速览

| 项 | 结果 |
|----|------|
| `shots.cjs` 退出码 | **0**（含新几何门，`[OK] 断言1–4 全部通过`）|
| 新路由 `#/org` / `#/demand` / `#/demand/new` 是否进入真实几何测量通道 | **是**（`SCAN_ROUTES` 11 宽 × 10 路由 = 110 格）|
| `#/demand/new` 表单顺序真实几何门 | **已落地并通过**，900/1280/375 三档 top/left 实测值见 §3 |
| 文本门改名（样式表规则级 vs 实测） | **已完成**，断言名含「样式表规则级检查，非实测」|
| 几何门变异自证 | **红→绿 已证**，EXIT=1→EXIT=0（§4）|
| 全量 smoke | **152 项断言，通过 152，失败 0，退出 0**（改名不改计数）|
| `mutation.cjs` TARGETS sha 同步 | **已同步**（§5）|
| dist 交付物（还原后重建）| sha256[:16] 与复验值**逐字节一致**（§6）|

---

## 1. 变更清单（文件级）

### 1.1 `portal/tests/shots.cjs`

**(a) 新增 BRD 档点击助手 `CLICK_BRD`（约 :129）**

```js
// 切到「功能 / 系统」（BRD 完整档）：只有完整档才渲染 .dp-demand-assistant，几何门依赖它。
const CLICK_BRD = `(()=>{const it=Array.from(document.querySelectorAll('.ant-segmented-item')).find(x=>/功能 \\/ 系统/.test(x.textContent));if(it)it.click();return !!it})()`;
```

> 关键：`#/demand/new` 默认落在「权限 / 其他（4 项）」轻量档，该档**不渲染** `.dp-demand-assistant`。必须先点「功能 / 系统（8 项）」档，助手卡才会出现，几何门才量得到三张卡。

**(b) `SCAN_ROUTES` 新增 3 条路由（:186-198）**

```js
// 站点重构后升为一级栏目的三条：必须在「唯一能做真实几何测量」的通道里被量过。
{ name: 'org', hash: '#/org' },
{ name: 'demand', hash: '#/demand' },
{ name: 'demand-new', hash: '#/demand/new' },
```

覆盖 11 个宽度档（375/414/768/900/1024/1152/1240/1280/1366/1440/1920）× 10 路由 = **110 格**溢出回归（原为 8 路由 = 88 格）。

**(c) `SHOTS` 新增 7 张（:167-179）**

| name | hash | w×h | 备注 |
|------|------|-----|------|
| `22-demand-1440` | `#/demand` | 1440×1400 | 楼层一行 |
| `23-demand-375`  | `#/demand` | 375×1700 | mobile，窄屏换行 |
| `24-demandnew-900` | `#/demand/new` | 900×2400 | `pre:CLICK_BRD`, settle 800 —— **单列顺序档** |
| `25-demandnew-1280` | `#/demand/new` | 1280×2000 | `pre:CLICK_BRD` —— **双栏档** |
| `26-demandnew-375` | `#/demand/new` | 375×2600 | mobile + `pre:CLICK_BRD` |
| `27-org-1440` | `#/org` | 1440×1500 | |
| `28-org-768`  | `#/org` | 768×1700 | |

> `#/demand/new` 按规范刻意卸载右下角 doodle：既有 `assert 1b`（:446）已是「量不到 `.dp-float-agent` 不算失败」，故该页 3 张不触发 doodle 越界红。

**(d) `MEASURE` 新增 `specGeom`（:92-101）**

```js
const G = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
const specGeom = document.querySelector('.dp-g-spec') ? {
  form: G('.dp-demand-form-col'),
  side: G('.dp-demand-side'),
  promise: G('.dp-demand-promise'),
  assistant: G('.dp-demand-assistant'),
} : null;
```

**(e) ★ 新增断言 1c：`#/demand/new` 表单顺序真实几何门（:453-500 附近）**

用 `getBoundingClientRect()` 实测 top/left，而不是在样式表里找 `order:n`：

- **900 档（`24-demandnew-900`）**：`promise.top < assistant.top < form.top` 且三者 `left` **相同**（单列）。
- **1280 档（`25-demandnew-1280`）**：`form.left !== assistant.left`（双栏）且右栏内 `promise.top < assistant.top`。
- **375 档（`26-demandnew-375`）**：同 900，单列 + `promise.top < assistant.top`。
- **哨兵**：`report` 中必须有 `#/demand/new` 真的量到 `specGeom`，否则报「页面可能没渲染」（防 URL 拼错量到空页）。

**(f) 输出段新增几何实测值打印（人读，:588-599）** + `[OK]` 文案更新。

### 1.2 `portal/tests/smoke.cjs` —— 文本门改名（:1046 / :1048）

```diff
- ok('P0-1 ≤900px 媒体块含 display:contents + 三张卡 order 1..3');
+ // 注意：jsdom 没有布局引擎，本条只能证明「样式表里写了 order」，不能证明「渲染出来真的是这个顺序」。
+ // 真实几何（getBoundingClientRect 实测 top/left）由 tests/shots.cjs 的断言1c 在 headless Chrome 里证明。
+ ok('P0-1 ≤900px 媒体块含 display:contents + 三张卡 order 1..3（样式表规则级检查，非实测）');

- fail('P0-1 ≤900px 媒体块完整', `block=${!!mediaBlock} orderHits=${orderHits}/3`);
+ fail('P0-1 ≤900px 媒体块完整（样式表规则级检查，非实测）', `block=${!!mediaBlock} orderHits=${orderHits}/3`);
```

- **动机**：jsdom 无布局引擎，这条断言只能读 CSS 文本，读不出渲染顺序。原名「媒体块含…order 1..3」听起来像实测，会让人误以为顺序已被几何证明。改名后语义诚实：**文本门 = 规则级**；**几何门 = shots 断言1c 实测**。
- **计数不变**：仅改断言名字符串，`results.length` 不变 → smoke 仍 **152** 项。
- 与 `mutation.cjs` M2 兼容：M2 `expectRed: 'P0-1 ≤900px 媒体块完整'` 是子串匹配，改名后仍是 `fail` 文案的前缀，变异仍能命中。

### 1.3 `portal/tests/mutation.cjs` —— TARGETS sha 同步（§5）

---

## 2. `shots.cjs` 运行结果（还原后重建的干净 dist）

```
[哨兵] 页面已渲染：.dp-topbar ✓ / .dp-shell ✓ / innerText=1939 字符 / DOM 节点=612

================ 连续扫描形态带（desktop #/home）================
   375– 422  topbarH=99 navText=✗
   423–1163  topbarH=61 navText=✗
  1164–1920  topbarH=61 navText=✓
  各 tier 起点余量（内容宽 − 内容 − 2×gap，要求 ≥16）：
    @ 768  内容宽=736  used=426  余量=310  navText=false
    @1164  内容宽=1100 used=1007 余量=93   navText=true
    @1312  内容宽=1216 used=1155 余量=61   navText=true
    @1920  内容宽=1216 used=1155 余量=61   navText=true
  路由抽点 110 格，连续扫描 1546×2 档

[OK] 断言1–4 全部通过（含 #/demand/new 表单顺序真实几何门 900/1280/375；无空数据 / 无溢出 / 顶栏高恒等且单调 / 内容不超宽 / navText 上区间且 ≥1164 可见）

EXIT=0
```

路由抽点由 88 → **110 格**，证明三条新路由进入了真实几何通道。

---

## 3. ★ 新几何门实测值（getBoundingClientRect，headless Chrome 真实布局）

```
#/demand/new 表单顺序几何实测（getBoundingClientRect）：
  24-demandnew-900  (900×2400)   promise[top=243  left=16  w=868]  assistant[top=389  left=16  w=868]  form[top=673  left=16  w=868]  side[top=0  left=0  w=0]
  25-demandnew-1280 (1280×2000)  promise[top=251  left=768 w=480]  assistant[top=419  left=768 w=480]  form[top=251  left=32  w=720]  side[top=251 left=768 w=480]
  26-demandnew-375  (375×2600)   promise[top=354  left=16  w=343]  assistant[top=544  left=16  w=343]  form[top=967  left=16  w=343]  side[top=0  left=0  w=0]
```

**判读：**

- **900 档 → 单列**：三张卡 `left` 全 = 16（同一列）；`promise.top(243) < assistant.top(389) < form.top(673)` ✓
  即：媒体块 `display:contents` 拆掉右栏 + `order:1/2/3` 重排真的生效，渲染顺序 = 承诺卡 → 助手卡 → 表单。
- **1280 档 → 双栏**：`form.left=32` ≠ 右栏 `left=768`；右栏内 `promise.top(251) < assistant.top(419)` ✓
- **375 档 → 单列**：`left` 全 = 16，`promise.top(354) < assistant.top(544) < form.top(967)` ✓

> 注意 900 档 `side[top=0 left=0 w=0]`：`display:contents` 后 `.dp-demand-side` 自身盒子被移除（宽高为 0），这正是单列的成因；几何门因此改为断言三张**卡**的 left 一致，而非断言 side 存在。

---

## 4. ★ 几何门变异自证（scramble → 红 → 还原 → 绿）

### 4.1 变异手法

临时把 `global.css` 的 `@media (max-width:900px)` 内 `.dp-demand-*` 的 order **对调**（promise 1→3、form 3→1，assistant 保持 2），使渲染顺序变为 **form → assistant → promise**（违反 `promise<assistant<form`）：

```css
/* 变异后（临时） */
.dp-demand-promise   { order: 3; }
.dp-demand-assistant { order: 2; }
.dp-demand-form-col  { order: 1; }
```

`src/global.css` 变异前 sha256（= TARGETS 基线）= `2074979CC4A6E8FB9DCB982D7C3C7B3F30A62115C4C268258ACA8EBEE3E4B33D`。

### 4.2 变异后重跑 `shots.cjs` → **RED**

```
  24-demandnew-900  promise[top=2002 left=16 w=868]  assistant[top=1718 left=16 w=868]  form[top=243 left=16 w=868]
  26-demandnew-375  promise[top=2566 left=16 w=343]  assistant[top=2143 left=16 w=343]  form[top=354 left=16 w=343]

[FAIL]
  - 断言1c 表单顺序 24-demandnew-900：promise.top=2002 应 < assistant.top=1718
  - 断言1c 表单顺序 24-demandnew-900：assistant.top=1718 应 < form.top=243
  - 断言1c 窄屏顺序 26-demandnew-375：promise.top=2566 应 < assistant.top=2143

EXIT=1
```

> **强证据**：1280 档**保持正确**（promise 251 < assistant 419，form.left 32 ≠ 768）——因为媒体块只作用于 ≤900px。这恰恰证明几何门测的是**该断点下的真实布局**，而不是「元素在不在」的伪判据。三条红色精确落在 900/375 两档，无一误报。

### 4.3 还原 → **GREEN**

还原 `global.css` 后 sha256 复核 = `2074979CC4A6E8FB9DCB982D7C3C7B3F30A62115C4C268258ACA8EBEE3E4B33D`（与变异前**逐字节一致**）。重建 dist 后重跑：

```
  24-demandnew-900  promise[top=243 left=16 w=868]  assistant[top=389 left=16 w=868]  form[top=673 left=16 w=868]
[OK] 断言1–4 全部通过（含 #/demand/new 表单顺序真实几何门 900/1280/375 …）
EXIT=0
```

**红→绿闭环完成。**

---

## 5. `mutation.cjs` TARGETS sha 同步

`node tests/mutation.cjs --print-sha` 输出（本轮施工后）：

```js
'src/pages/Workspace.jsx': 'C20F4CA5976D082192F977BB0B29B3D7CE8413BA26B7611D13901D00B0CEECC1',
'src/data/mock.js': 'B375CB23F13BE6E98EBFF148986B83F6B21F194BE9080E783D8A34FC883735A8',
'src/global.css': '2074979CC4A6E8FB9DCB982D7C3C7B3F30A62115C4C268258ACA8EBEE3E4B33D',
'src/components/demand/ScaleChips.jsx': 'B63C695F6A21AD633E7EF7B52025E03C41AD5971661C2C488CA202D87A2BECF1',
'src/components/demand/BrdAssistantCard.jsx': 'CFDCEBC83DDADDF331DC748AB07256B28E6803F9E431D859E69C187C2A7BC2E6',
```

已**原样写入** `mutation.cjs` 的 `TARGETS`（:91-97）。前三个文件因合并施工被有意修改（旧基线 `E55C…`/`14AB…`/`54DA…` 已过期），后两个未变。同步后 `mutation.cjs` 的洁净校验可正常启动（不再因 sha 不符拒绝）。

---

## 6. 全量 smoke（改名后计数不变）

```
合计 152 项断言，通过 152，失败 0
EXIT=0
```

- 断言名含「样式表规则级检查，非实测」的文本门（`P0-1 ≤900px 媒体块含…`）仍在结果集中，仅文案变更；`results.length = 152` **不变**。
- `#/demand` 已出现在路由逐条断言列表中（新栏目并入 smoke 路由覆盖）。

---

## 7. dist 交付物完整性（还原后重建）

| 文件 | sha256[:16] | 与复验值比对 |
|------|-------------|--------------|
| `dist/assets/index.js` | `C97F577ADA9E497D` | **一致** |
| `dist/assets/style.css` | `A6522A071E886761` | **一致** |
| `dist/index.html` | `D31E7E3B55BD0204` | **一致** |

- `dist/index.html` mtime = 2026-09-19 23:26:23 **晚于** `src/global.css` mtime = 2026-09-19 18:12:08（dist 非陈旧）。
- 变异→还原→重建后，三个产物 sha256 与 team-lead 独立复验值**逐字节相同**——证明本轮测试基建施工**未污染交付物**，且该 dist 仍是可提交状态。

---

## 8. 环境备忘（复现用）

1. **Bash 不可用** → 全程 PowerShell。
2. **PowerShell stdout 吞输出** → 用 `[System.IO.File]::WriteAllText(path, text, UTF8NoBOM)` 落盘再 Read；`*>` 重定向会写 UTF-16 导致乱码。
3. **`Remove-Item` 报 `SAFE_DELETE_FAIL_CLOSED` 但文件其实已删**（已知怪癖）。
4. **node 路径**：`C:\Users\uuzz\.workbuddy\binaries\node\versions\22.22.2-3\node.exe`；`NODE_PATH=C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules`。
5. `shots.cjs` 位于 `portal/tests/`，其 `path.resolve(__dirname,'..','dist')` 解析正确；写在 `portal/` 根的一次性脚本需用 `path.resolve(__dirname,'dist')`。

---

## 9. 未落地项 / 风险

- **无**。本任务（测试基建）全部 6 步落地。产品代码零改动，交付物 sha 不变。
- 非本任务范围的临时脚本（`portal/_*.cjs`、`portal/_*.txt` 等）为**前序会话遗留**，未纳入本次清理（避免误删其他工作线证据）。
