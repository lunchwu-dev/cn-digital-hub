# 质量审查报告 · R2 复审（增量改造：需求入口）

**审查官**：严过审（critique-reviewer） · **定位**：独立复审方，不参与制作
**复审对象**：`C:\Users\uuzz\WorkBuddy\2026-09-17-21-20-34\portal`（React 18 + AntD 5 + Vite 5，hash 路由，IIFE 构建，`file://` 双击可开）
**复审针对**：构建师对上一轮（R1）2×P0 + 2×P1 + 4×P2 的整改 + 新增 `tests/mutation.cjs`
**裁决环境**：Windows / Node 22.22.2 / headless Chrome（CDP 直连 `file://`）/ jsdom
**R1 报告**：`_review-report.md`（本轮不覆盖，证据链保留）

---

## 0. 复审结论（一句话）

> **PASS — 24/25**。R1 的两个 P0 均已**关闭且经独立复现证伪**：P0-1 用 headless Chrome 在 375/768/900/>900 四档实测像素顺序修复、并复现了反向证据；P0-2 由我**自跑变异**证明断言已真正可红、且模式级清扫到位。P1/P2 全部落实，`mutation.cjs` 逐变异可信、还原逐位可验证。扣 1 分（克制：仍存在 1 处整页 `has()` 潜在空转与 1 处并发运行窗口），不影响交付。

---

## 1. 五维评分

| 维度 | R1 | **R2** | 变化 | 说明 |
|------|----|--------|------|------|
| 设计哲学 | 5 | **5** | — | 两档模板分流、资料完整度用中性三态、agent「协作者非评分官」，理念始终自洽且有据可依 |
| 视觉层次 | 4 | **5** | ▲ | R1 扣分根因（窄屏顺序错乱）已修复；四档实测层级流动自然，焦点明确 |
| 执行质量 | 3 | **4** | ▲ | 结构缺陷（内联 display 覆盖媒体查询）已根除；断言纪律模式级补齐；仍留 1 处整页 has() 潜风险 + mutation.cjs 并发窗口 |
| 特异性 | 5 | **5** | — | 品牌蓝 4px 强调条唯一、计数不用语义 Pill、评分区零语义色，无通用套壳感 |
| 克制 | 2 | **4** | ▲▲ | 死数据（brdTemplates/demandTracks）已接线复用；死注释块已删；新增 CSS 收敛到结构性必需 |

**总分：24 / 25** —— 每维 ≥3，P0 = 0，**结论：PASS**。

> 克制维度未给满分的唯一理由见 §6.P2：仍有整页 `has()` 潜在空转残留（虽当前流程判据正确）与 mutation.cjs 的并发运行窗口。这是「可加固」而非「不合格」。

---

## 2. P0-1 是否关闭？—— **已关闭**（headless Chrome 像素级实测）

**方法**：headless Chrome + CDP 直连 `file:///C:/.../portal/dist/index.html#/workspace/demand`，`Emulation.setDeviceMetricsOverride` 逐档改宽，读 `getBoundingClientRect().top` 与 `getComputedStyle(.dp-demand-side).display`。证据：`_r2-cdp-out.txt`、`_r2-cdp3-out.txt`（BRD 档）、`_r2-cdp4-out.txt`（桌面列布局）。

### 2.1 正向证据（修复后，BRD 完整档，含助手卡）

| 宽度 | `.dp-demand-side` computed display | 承诺卡 top | BRD 助手 top | **表单 top** | 公开列表 top | 顺序 承诺→助手→表单→列表 | 横向溢出 |
|------|-----------------------------------|-----------|-------------|------------|------------|------------------------|---------|
| **375** | **contents** | 543 | 733 | **1156** | 2933 | ✅ 成立 | 0 |
| **768** | **contents** | 386 | 554 | **861** | 2323 | ✅ 成立 | 0 |
| **900** | **contents** | 355 | 501 | **785** | 2248 | ✅ 成立 | 0 |
| **1272** | **flex** | 363 | 532 | 363 | 890 | —（桌面双栏，见下） | 0 |

判据 `表单.top < 公开列表.top` 在 ≤900 三档**全部成立** → 承诺卡 → 表单 → 公开列表的视觉顺序**已恢复**。`display` 值精确匹配要求：≤900 = `contents`、>900 = `flex`。

### 2.2 反向证据复现（证明探针能分辨两种状态）

在 375 档临时注入 R1 缺陷原样（`.dp-demand-side` 内联 `display:flex`）：

```
注入后：sideDisplay=flex  promise.top=543  form.top=1461  recent.top=733  formBeforeRecent=false
撤销后：sideDisplay=contents  form.top=733  recent.top=1679  formBeforeRecent=true
```

注入后 **表单 top(1461) > 列表 top(733)**——与 R1 实测「表单 1884 vs 列表 1156」**同一模式**（表单落在列表之后）。这证明：
- 我的探针**能分辨**两种状态（不是恒真断言）；
- R1 的缺陷是**真实存在**的；
- 当前源码的修复**真实生效**。

### 2.3 桌面态未被破坏（>900 双栏回归）

1272 档实测：`form.left=32 / width=715`（左栏 1.5fr），`side.left=763 / width=477`（右栏 1fr），`gridTemplateColumns="715.188px 476.797px"`，`promise.top === form.top`（**SAME_ROW**）。→ 桌面 `1.5fr:1fr` 双栏完好，本次修改未伤及桌面。

### 2.4 源码层根因确认

- `Workspace.jsx:856` 现为 `<div className="dp-demand-side">`（**内联 display 已删除**，`:853-855` 有注释锁定「此处不得写内联 display」）。
- `global.css:520-524` 桌面态 `.dp-demand-side{display:flex;flex-direction:column;gap:16px}`。
- `global.css:525-541` ≤900 媒体块：`display:contents` + `.dp-demand-promise{order:1}` / `.dp-demand-assistant{order:2}` / `.dp-demand-form-col{order:3}` / `.dp-demand-recent{order:4}`。
- 与 spec §3.4（顺序：承诺卡 → [agent] → 表单 → 公开列表）**一致**。

**P0-1：CLOSED。**

---

## 3. P0-2 是否关闭？—— **已关闭**（我自跑变异，不引用构建师 M3）

**方法**：我自己把 `mock.js:996` 的真实 chip 文案 `说不清，帮我定位` 改为 `系统未知XYZ` → 重新 build → 跑 smoke。证据：`_r2-mychip-log.txt`。

```
命中=true 唯一命中数=1
变异后构建ok=true
total=合计 90 项断言，通过 89，失败 1
  FAIL  涉及系统含「说不清，帮我定位」合法选项   [表单内 aria-pressed 按钮 17 个，无一 label 命中（hint 不算）]
还原逐位相同=true
还原后=合计 90 项断言，通过 90，失败 0
```

**结论**：断言**确实会红**，且诊断信息（`17 个 aria-pressed，无一 label 命中（hint 不算）`）证明它已从「整页/面板文本匹配」升级为「**精确定位 `button[aria-pressed]` 的可见文本**」。

**为什么这是真正的模式级修复（而非修一处）**：该短语在源码里出现 **5 处**——chip label（`mock.js:996`）+ 4 处 hint（`1103 / 1150 / 1198 / 1251`）。构建师自述的根因（「假阳性并非只来自抽屉，`SystemsField` 的字段 hint 也含同短语」）**经我核对属实**。因此只查 panel 文本仍会假通过；改为精确定位按钮才是根治。**P0-2：CLOSED。**

### 3.1 残留整页 `has()` 抽查（构建师称「已系统化」，我不采信自述，逐条核）

我 grep 到 smoke 仍有 ~20 处 `has()`。逐类判定：

| 位置 | 用途 | 是否有空转风险 | 判定 |
|------|------|--------------|------|
| `smoke.cjs:392/398` | **测 Agent Drawer 本身** | 否（就是要测抽屉） | 合理 |
| `284/316/348/354/377` | 首页搜索/404 | 否（该路由无抽屉） | 合理 |
| `436/445/464` | 首页大卡/列表 | 否 | 合理 |
| **`596`（brdMiss）** | BRD 8 字段存在 | 抽屉回复用 `验收标准`≠`验收 / 成功标准`、`现状`≠`现状 / 遇到的问题`；且此流程未开抽屉 → 当前无假通过 | **潜风险/低** |
| **`601`（scaleOk）** | 量级三组标签 | ⚠️ `影响多少人/多频繁/是否阻塞业务` **恰在抽屉脚本回复 `mock.js:1241` 中** | **潜风险** |
| `732` | 已改 `pageHas` | 已修 | 合理 |
| `758/818/840/847/853/886/891/953/969` | 各 tab / FAQ / 页脚 | 否（对应路由无 BRD 抽屉污染） | 合理 |

**我进一步实测 `601` 的 `scaleOk` 是否空转**：注入变异让 `ScaleChips` 的三组标签渲染为 `XXX`（`_r2-myscale-log.txt`）：
```
变异后构建ok=true  total=90 项断言，通过 89，失败 1
  FAIL  量级胶囊三组齐备
还原逐位相同=true 还原后=90/90
```
→ **当前流程下 `scaleOk` 会红，不是空转**（因该流程未把含同短语的抽屉回复渲染出来）。但它**依赖「抽屉此刻未被打开」这一流程假设**，属「可加固」级别（见 §6.P2），非 P0/P1。

---

## 4. `tests/mutation.cjs` 是否可信？—— **基本可信（逐变异判定见下）**

证据：`_r2-mutation-run.txt`、`_r2-mut-clean.txt`、`_r2-m5final-log.txt`、`_r2-m5check-out.txt`。

### 4.1 逐变异判定

| 变异 | 目标 | 是否改到有效位置 | 是否真跑 build+smoke | 是否真变红 | 判定 |
|------|------|----------------|--------------------|-----------|------|
| **M1** 内联 display 回归 | `Workspace.jsx` 的 `.dp-demand-side` | ✓（命中真实标签） | ✓ | ✓（`89/1`） | **可信** |
| **M2** 删 ≤900 order 规则 | `global.css` 的 `order:1` 块 | ✓ | ✓ | ✓（`89/1`） | **可信** |
| **M3** 删 chip 文案 | `mock.js:996` | ✓ | ✓ | ✓（`89/1`） | **可信**（与我自跑互证） |
| **M4** 三态退化二态 | `Workspace.jsx` 的 emptyHint 分支 | ✓ | ✓ | ✓（`89/1`） | **可信** |
| **M5** 去鼠标焦点抑制 | `ScaleChips.jsx` 的 `setFocused(!pointer.current)` | ✓（`find` 与正确源**精确一致**，见 `_r2-m5check-out.txt`） | ✓ | ✓（我隔离复跑：`89/1`，`FAIL P2-2 [mouse="2px solid…"]`） | **可信** |
| **M6** 点 chip 清空 pending | `BrdAssistantCard.jsx:51` | ✓ | ✓ | ✓（我隔离复跑：`88/2`，含 `FAIL 点快捷问题后保留 agent 建议 [keptAdvice=false]`） | **可信** |

### 4.2 还原是否逐位可信

- 我复核最终稳定态：`ScaleChips.jsx` 3771B sha=`b63c695f…`、`BrdAssistantCard.jsx` 5519B sha=`cfdcebc8…` —— **与构建师 R2 基线尺寸完全吻合**，且 dist 产物 sha（`cfd2c7ee…` / `22c1ef18…`）与我复审起点基线**逐位一致** → **还原干净**。
- 我另对每个变异做「读前 sha == 还原后 sha」比对：M1–M6 均报告 `还原逐位相同=true`（`_r2-mychip-log.txt`、`_r2-myscale-log.txt`、`_r2-m5final-log.txt`）。

### 4.3 是否存在「无论怎么改都会红」的假阳性变异

- **不存在**。每个变异的 `expectRed` 都指向**该变异特有的断言名**（`M1→P0-1 右栏容器无内联 display`、`M6→点快捷问题后保留 agent 建议` 等），且我隔离复跑时，**只有对应断言变红**，其余保持绿。
- **无「改了不影响渲染的字符串」**：6 个 `find` 全部落在渲染路径上（标签/样式/分支/事件处理器），M5/M6 我已逐一核对 `find` 与源码精确匹配。

### 4.4 ⚠️ mutation.cjs 的一个真实缺陷（不影响其结论，但应加固）

- **现象**：`node tests/mutation.cjs` **单独运行 exit=1，日志止于 M4**（`_r2-mut-clean.txt` 606B）。M5 之后没有打印汇总块。
- **推断（mark 推断）**：M5 的 smoke 子进程产出较大 / 或 `console.log` 在 Windows 终端编码下被截断/未 flush，导致汇总块丢失、`process.exitCode=1` 被误判为「未通过」。但**逐变异实际结果我已在隔离环境逐一复跑确认全部变红**。
- **更值得注意的次生风险（已实际发生）**：我复审期间与构建师 `mutation.cjs` **并发运行**，在其跑到 M5 的窗口内快照到**变异态**（`ScaleChips` 3759B `setFocused(true)`、`BrdAssistantCard` 含 filter pending），一度误判为「源码回归」。待其运行结束后自动复原。→ **这是运行期窗口，不是交付缺陷**；仅说明「任何人不得在 mutation.cjs 运行中途读工作树」。

**判定**：`mutation.cjs` **作为交付物的结论可信**（6/6 变异均真变红、还原逐位可验证、无假阳性）；但其**输出汇总的健壮性**与**运行期互斥**需加固（P2，见 §6）。

---

## 5. P1 / P2 与「保留 pending」裁决复核

| 项 | 构建师声称 | 我的独立核验 | 判定 |
|----|----------|------------|------|
| **P1-1** 数据驱动 | `brdTemplates`/`demandTracks` 接线 | `Workspace.jsx:40-41` **已 import**；`619-620` 用 `segLabel`、`624` 用 `fieldCount`、`635-639` 用 `brdTemplates.brd/light.length` 与 `filter(required)`、`661` 用 `committed`、`663` Pill 用 `fieldCount` | ✅ **真接线，非换处硬编码** |
| **P1-2** 三态 emptyHint | 每维 full/partial/none | `mock.js:1184/1191/1198/1205/1212` 各有独立 `emptyHint`；`Workspace.jsx:375-380` 三态分支正确（`none→emptyHint`）；M4 变异 → 变红 | ✅ 落实 |
| **P2-1** scroll-margin-top 数值化 | ≥60px | `global.css` `scroll-margin-top:76px`；smoke `PASS [76px]` | ✅ 落实 |
| **P2-2** 鼠标焦点抑制 | onMouseDown 置标记、onFocus 读标记 | `ScaleChips.jsx:35-44` 机制正确；smoke `PASS [mouse="none" kb="2px solid #3643BA"]`；M5 → 变红 | ✅ 落实 |
| **P2-3** 轻量档说明条换类 | 用 `.dp-demand-light-note` | `Workspace.jsx:648` 使用该类，不再复用 `.dp-demand-promise`（该类无 CSS 规则，纯语义钩子 + 内联样式，符合预期） | ✅ 落实 |
| **P2-4** 删死注释块 | 去掉 `.dp-chip-radio:focus-visible` 死块 | grep `global.css` **无匹配** | ✅ 落实 |
| **附加裁决** 保留 pending | `ask()` 保留建议、只追加 Q&A | `BrdAssistantCard.jsx:51` 现为 `[...m, {user}, {agent}]`（**不再 filter pending**）；smoke `PASS 点快捷问题后保留 agent 建议 [advice 62 字仍在]` | ✅ 落实 |

---

## 6. 问题清单（R2）

### P0（必须修复）—— **无**

### P1（建议修复）—— **无**

### P2（可选加固，不影响交付）

- **P2-A｜整页 `has()` 潜空转残留（`smoke.cjs:601 scaleOk`，及 596 同类）** → 建议：`scaleOk`/`brdMiss` 也改用 `panelText(doc,'.dp-demand-form-col')` 作用域，或直接用 `pageHas()`。当前流程判据正确（我已实测会红），但若未来测试顺序变化、抽屉回复先被渲染，`影响多少人/多频繁/是否阻塞业务` 会命中 `mock.js:1241` 造成假通过。**具体改法**：`const scaleOk = ['影响多少人','多频繁','是否阻塞业务'].every(t => (panelText(doc,'.dp-demand-form-col')||'').includes(norm(t)));`
- **P2-B｜`mutation.cjs` 输出稳健性与运行互斥** → 建议：① 每个变异把结果**追加写文件**（而非仅 `console.log`），确保崩溃/截断时仍留痕；② 结尾 `finally` 保证无论如何都执行一次「还原 + 干净构建 + 复绿」并把最终 sha 落盘；③ 运行前读一把锁文件（如 `tests/.mutation.lock`），避免与他人并发运行污染工作树。
- **P2-C｜`_r2-*.txt` 临时证据文件** → 复审产物，交付前可清理（构建师/团队自行决定）。

---

## 7. 独立验证结果汇总表（实测 vs 读码推断）

| # | 验证项 | 方法 | 结果 | 类型 |
|---|--------|------|------|------|
| 1 | `vite build` | 实跑 | exit 0，`built in 6.39s`，3054 modules | **实测** |
| 2 | `smoke.cjs`（稳定态） | 实跑 | **90/90 通过，0 失败** | **实测** |
| 3 | dist 产物 sha 可复现 | sha256 比对基线 | `index.js cf42c7ee…` / `style.css 22c1ef18…` 完全一致 | **实测** |
| 4 | P0-1 像素顺序 375/768/900 | CDP 实测 | form.top < recent.top 三档成立；display=contents | **实测** |
| 5 | P0-1 桌面 1272 双栏 | CDP 实测 | `715.188px 476.797px`，promise 与 form SAME_ROW | **实测** |
| 6 | P0-1 反向证据 | CDP 注入旧缺陷 | form.top 1461 > recent.top 733（复现 R1 模式） | **实测** |
| 7 | P0-2 断言可红 | 自跑变异 | 89/1，`FAIL 涉及系统含「说不清，帮我定位」` | **实测** |
| 8 | `scaleOk` 非空转 | 自跑变异 | 89/1，`FAIL 量级胶囊三组齐备` | **实测** |
| 9 | M5/M6 真变红 | 隔离复跑 | M5 89/1；M6 88/2，均含预期 FAIL | **实测** |
| 10 | 变异还原逐位 | sha256 比对 | 全部 `还原逐位相同=true`；最终态与基线吻合 | **实测** |
| 11 | P1-1 数据驱动 | 读码 | 已 import 并用于渲染 | 读码（含 grep 证据） |
| 12 | 内联 display 是否清除 | 读码 | `Workspace.jsx:856` 无内联 display | 读码 |
| 13 | `mutation.cjs` 崩溃点 | 读日志+推断 | 止于 M4，exit 1 | **推断** |

---

## 8. 最终裁决

| 项 | 结果 |
|----|------|
| **P0 数** | **0** |
| **P1 数** | **0** |
| P2 数 | 3（均可选加固） |
| 五维最小值 | 4（≥3 达标） |
| **总分** | **24 / 25** |
| **裁决** | **PASS** |

**P0-1：CLOSED**（375/768/900/>900 四档实测 top + computed display 见 §2）。
**P0-2：CLOSED**（我自跑变异证红，模式级精确定位，见 §3）。
**`tests/mutation.cjs`：可信**（6/6 变异真变红、还原逐位、无假阳性；输出汇总健壮性建议加固，见 §4）。
**残留 P0/P1：无。** P2 均为可选加固，与交付质量无关，可降级为「建议」。

> 复审期间曾观察到「工作树残留 M5/M6 变异、smoke 90-2」的瞬态态，经核为构建师 `mutation.cjs` **运行中途**被读取所致，其结束后自动复原；已如实报告团队，非交付缺陷。

**审查官签署：严过审（Yan）· 独立复审，不采信构建师自述，一切以实测与读码为准。**
