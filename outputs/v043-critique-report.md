# v0.4.3 独立质量审查报告（Phase 4）

> 审查官：质量审查官 · 严过审（Yan） · 团队：design-engine-v03-v04 · 任务：#40
> 审查对象：v0.4.3（含此前从未独立审查的 v0.4.2 遗留项）
> 审查方式：**独立复算**——不采信构建师 `prototype-builder-v041` 的任何数字，全部自量。
> 审查时刻工作树状态：HEAD=`36347c2`(v0.4.1)，v0.4.2/v0.4.3 全部未 commit；§11「档位条悬停 title」#38/#39 **仍在进行中**。
> 环境：Bash 工具不可用（exit 127）→ 全程 PowerShell + 文件重定向 + Node `.cjs/.mjs` 探针；PowerShell stdout 被吞 → 一律写文件再读。

---

## 0. 裁决

**结论：需修正（FAIL）——1×P0 + 2×P1 + 3×P2。**

**P0 不是构建师的产品缺陷，而是「当前工作树的变异自证已经跑不起来」**：`src/components/ui.jsx` 被 §11（悬停 title，任务 #38/#39，尚未收尾）修改，但 `mutation.cjs` 的 `TARGETS` sha 未同步，导致 `node tests/mutation.cjs` **启动即被洁净校验拒绝（exit 1，不写任何文件）**。因此构建师报告里「mutation 12 条全真红」在当前树上**不可复现**——那是 §11 之前的旧状态。这是「名义通过 ≠ 实际可跑」的又一次实例，正是本项目反复栽的坑。

5 维度均 ≥3，总分 **21/25**，但**存在阻断发布的 P0（测试基建处于不可运行态）**，故裁决为需修正。

| 维度 | 评分 | 说明 |
|------|------|------|
| 设计哲学 | 4/5 | 方向清晰：前瞻(工作)/回顾(贡献)平级双栏、标签升为独立楼层、blocked 不显负面态——每个决定都有理由且与「不作绩效评价」铁律一致。 |
| 视觉层次 | 4/5 | 三楼层 hero→标签→工作/贡献 层级明确，1fr/1fr 等宽体现「无主次」。扣分：标签横排卡内 11px 分组名小字在 132px 窄卡下信息密度略高。 |
| 执行质量 | 4/5 | 数据层零运行时日期/随机；DOM 几何实测全对；file:// 六项全过。扣分：测试基建 sha 漂移(P0) + shots 375 档 flaky(P2)。 |
| 特异性 | 4/5 | 克制品格、等宽数字、语义色纪律、4 段档位条识别度高，不会被误认为通用模板。 |
| 克制 | 5/5 | 图标零新增、blocked 留空而非加红、逾期只染日期数字不动整行——克制到位。 |

---

## 1. 逐项独立验证（A–I）

### A. 数据层越界改动审计（对比 `git show 36347c2`）— ✅ 干净

自写 `_y_audit.mjs`（动态 import HEAD 版 mock.js 与工作区版，逐字段比对）：

| 项 | HEAD(36347c2) | 工作区 | 结论 |
|---|---|---|---|
| `EVIDENCE_AS_OF` | `2026-09-17` | `2026-09-17` | ✅ 一致 |
| `SKILL_GROUPS` | 7 组 | 7 组 | ✅ 逐字一致 |
| `orgPeople` | 10 人 | 10 人 | ✅ 零增删 |
| `TAG_DICT` **id 集合** | 72 | 72 | ✅ 零增删 |
| `personTags` 人数 | 10 | 10 | ✅ 零增删 |
| `personTags` **标签实例总数** | 79 | 79 | ✅ 零增删 |
| 逐人标签键集合不一致 | — | **无** | ✅ |
| `min.zhou` 标签数 | 8 | **8** | ✅ 已恢复（§10.1 的误删已修） |

**结论**：team-lead 的独立结论（personTags 零增删、79=79、TAG_DICT 72 一致、orgPeople/SKILL_GROUPS/EVIDENCE_AS_OF 一致）**被我独立复算确认**。构建师 §10.1 承认的越界误删**确实已恢复**，且恢复位置与历史一致。

**一处需备案（非缺陷）**：`TAG_DICT` 的 **id** 未变，但 `d-esl` 的 `aliases` 由 `['价签']` 变为 `['价签','设备']`（v0.4.2 配合 `ALIAS_TO_TAG`/`resolveTagIds` 重构，用于修 `orgPeople[].tags` 中文 label 解析）。该改动属 **v0.4.2 主题范围内、已在文档披露**，不算静默篡改；仅在此备案。

### B. 「当前至未来 1 个月」可复现性 — ✅ 满足

- `WORK_WINDOW_AS_OF = EVIDENCE_AS_OF`（='2026-09-17'）、`WORK_WINDOW_END = '2026-10-17'` **均为硬编码字符串**，无运行时加月份。
- `JIRA_ISSUES`（30 条）**全静态字面量**；`getPersonWork` 只用字符串比较，**函数体内无 `new Date()` / `Math.random()`**。
- 全仓 `new Date()` 仅出现在：`mock.js:1166-1167`（解析**固定常量** EVIDENCE_AS_OF，确定性）、`DemandList.jsx:57/36`（v0.3 遗留的 `today` prop 缺省回退，**非 v0.4.3 代码**）、`News.jsx:30`、`Ops.jsx:23`（无关页面，v0.3 遗留）。
- `Math.random` 全仓 0 处（仅注释里出现「绝不用 Math.random」）。

**结论**：v0.4.3 的「未来 1 个月」窗口**完全可复现**。`DemandList.jsx:57` 的 `new Date()` 是 v0.3 遗留的潜在漂移点，但**与本次 work 窗口无关**，出界不判。

### C. blocked 整行渲染且无状态 Pill — ✅ 实测通过（真实 Chrome DOM）

自写 CDP 探针加载 `#/workspace/people/min.zhou`（1440 视口），实测 DS-3121 行：
- 行文本 = `DS-3121 设计规范文档站改版 设计系统 2026-10-09` → **单号 / 任务名 / 项目 / 日期全在**（整行未被吞）。
- `hasPill = false` → **该行无「待办/进行中/待评审」任一状态 Pill 文案**。
- 代码层佐证：`ui.jsx` `WORK_STATUS.blocked = null`，`WorkStatusPill` 未知/blocked 返回 `null`；`PersonProfile.jsx` 的 `WorkItem` 始终渲染 key/title/project/due，仅 `<WorkStatusPill>` 位留空。

### D. 逾期只染日期数字、不染整行 — ✅ 实测通过（真实 Chrome DOM）

实测 DS-3080（`due=2026-09-15 < AS_OF`）行：
- 日期元素 `color = rgb(138, 82, 0)` = `#8A5200` = `c.warningText` ✅
- 行背景 `backgroundColor = rgba(0, 0, 0, 0)`（透明）✅
- 行文本**不含「逾期」字样** ✅
- 行内**无背景色 span / 无图标**（实测 DOM 仅文本子节点）✅

### E. 三楼层顺序 + 横排标签 + 等宽双栏 — ✅ 实测通过

真实 Chrome 1440 视口，`.dp-shell` 直接子节点顺序实测：
```
[ant-breadcrumb, dp-card dp-person-head, dp-floor-tags, dp-grid dp-g-duo]
```
- **楼层顺序 = hero → 技能标签楼层 → 工作/贡献双栏**，`.dp-floor-tags` **紧邻 hero 之后** ✅（满足用户指令 3「紧接着员工个人信息楼层展示」）
- `.dp-tag-floor` 存在，**周敏 8 张标签卡**（分组已去，横向 flex-wrap）✅
- `.dp-g-duo` 子列实测 `[dp-floor-work, dp-floor-contrib]` = **2 栏**；几何（见 F）：`列1[左112,宽596] 列2[左732,宽596] 宽比1.000` ✅
- 「模块级 Panel = 4」：`smoke.cjs` 门② 实测口径（排除 `.dp-tag-floor` 内卡 + 排除嵌套卡）= **4**，我在整轮 smoke（194/194）中见其 PASS。

### F. M13 到底挂什么门 — ✅ **真几何门**（已注入实测）

- `mutation.cjs` M13 定义：`gate:'geom-duo'`，`expectRed='v0.4.3 门1d .dp-g-duo 等宽双栏（几何实测）'`。
- **注意：team-lead 交办里说的 `portal/tests/mutation-geom.cjs` 不存在**；实际几何探针是 **`portal/tests/_geom_duo.cjs`**（5977B）。
- 读 `_geom_duo.cjs`：真实 Chrome + CDP，`Emulation.setDeviceMetricsOverride` 1440，导航个人主页，`getBoundingClientRect` 量 `.dp-g-duo` 两个直接子列 → 判 `ok = leftDiff && ratio∈[0.92,1.08]`；**exit 2 表示红**。
- **基线实测**（未变异）：`GEOM_JSON={"ok":true,"cols":[{"left":112,"w":596},{"left":732,"w":596}],"ratio":1,"gridW":1216,"cols0":"596px 596px"}` → exit 0。
- **注入 M13 实测**（`.dp-g-duo` 1fr/1fr → 1fr，自写 `_y_m13.cjs`：备份→注入→build(exit0)→跑探针→还原）：
  `GEOM_JSON={"ok":false,"cols":[{"left":112,"top":527,"w":1216},{"left":112,"top":999,"w":1216}],"ratio":1,"cols0":"1216px","leftDiff":false}` → **exit 2（真红）**。
  **两列退化为单列**（left 相同=112、第二列掉到 top=999），门依据的是**真实渲染宽度/位置**，**非文本匹配**。
- 还原后 sha 复核 = `D9AC2F10…E06D14`（与 TARGETS 一致），clean rebuild 完成，无污染。

**12 条变异 gate 性质分类**（读 `mutation.cjs` + `_findcheck.cjs` + §10.3）：
- **真实测门（读 DOM/几何/数据返回值）11 条**：M1(DOM 属性)、M3(DOM 文案)、M4(DOM hint)、M5(DOM 焦点态)、M6(DOM 消息)、M7(DOM 任务行)、M8(DOM 卡数)、M10(数据函数返回)、M11(DOM→路由)、M12(DOM 卡数)、**M13(CDP 几何)**。
- **文本门 1 条**：**M2**（读 global.css 的 `≤900px order` 规则文本）。构建师 §10.3 已**主动承认**。其辩护理由「同一不变量由 shots 断言 1c 几何独立守住」——**本次首轮 shots 断言 1c 实际变红**（见 P2），故该辩护**当前不成立**（详见 §3）。
- `findcheck` 独立复跑：**12 条 find 全部 hits=1，异常 0**（含 M12 锚点 `// 设计系统负责人…\n 'd-design-system': true,`）。M9 确认已删除（现为 M1–M8,M10–M13）。

### G. smoke「文本门冒充实测门」全扫 — 基本合格，1 处提示

- v0.4.3 新增门绝大多数读 **DOM**（`.dp-tag-floor` 卡数、楼层顺序、blocked 行、逾期颜色 `getComputedStyle`、档位条 title `getAttribute('title')`、不可点检查）→ 真实测。
- **1 处规则级文本门**：`smoke.cjs:2546` 的 `v0.4.3 .dp-g-duo 栅格` 读 CSS 正则（`duoGrid`）。**它不是任何变异的目标**，且已有 **M13 几何门 + shots 断言 1d** 双重覆盖同一不变量 → 属「文本门 + 独立实测门」的补充结构，可接受，仅提示。
- 档位条 title 门（1938-1981）读 `getAttribute('title')`（非 `textContent`）→ **真实测**，与「上屏 0 命中」门互补不冲突，设计正确。

### H. 残留物核查 — ⚠️ 有未报残留

- **构建师 §8 只报了 1 个**：`tests/_smoke_floorowner_25380_1789866674714.cjs`（41686B，smoke 运行期 esbuild 临时 bundle 残留）。
- **实际另有未报残留**（`git status` + 文件扫描确认）：
  - `portal/_v043_mockbundle_gid.mjs`、`_v043_mockbundle_groups.mjs`、`_v043_mockbundle_nonecount.mjs`
  - 根目录 `_tmp_noop.mjs`
  - `portal/` 根下 11 个 `_probe_v043_*.cjs`（构建师自己的诊断脚本，未清理）
- `.dp-grid--tight`：**仅存于注释**（global.css:461/464、ui.jsx:744 的历史说明），无活使用点 ✅
- `.dp-g-profile`：**仅存于注释 + 定义**（global.css:422/426/453、PersonProfile.jsx:8 考古说明），DOM 0 命中（实测）✅
- 过期归因词（`axis`/`主标签`/`PRIMARY_GLYPH`/`primaryTags`/`SELF_RATINGS`/`selfRating`/`MaturityAxis`）：**src 中仅注释提及，无活定义/使用** ✅

### I. file:// 约束（当前 dist）— ✅ 六项全过

自跑 `_fileproto_r.cjs`（对我**独立重建**的 dist）：
| 项 | 结果 |
|---|---|
| ① 无 `type="module"` | html=0 / js=0 ✅ |
| ② 无 `crossorigin` 属性 | html=0 ✅ |
| ③ 无 `importmap` | html=0 / js=0 ✅ |
| ④ IIFE 包裹 | `(function(){"use strict";…` ✅ |
| ⑤ 零外部请求 | html `http(s)`=0；js 19 处全为 W3C 命名空间串 ✅ |
| ⑥ `fetch(` / `XMLHttpRequest` | **0 / 0** ✅ |

---

## 2. 回归实测（我自己的数字）

| 项 | 我的实测 | 构建师报告 | 一致性 |
|---|---|---|---|
| build | `BUILD_EXIT=0` | EXIT=0 | ✅ |
| **smoke** | **194 条断言 / 194 通过 / 0 失败**（`SMOKE_EXIT=0`） | 报告§0 写 192、§10.4 写 192 | ⚠️ 我 194 > 192（§11 悬停 title 新增 2 门），数量小差异，非缺陷 |
| **shots** | 首轮 **FAIL**（26-demandnew-375 未量到 specGeom）；**复跑 PASS**（`SHOTS_EXIT=0`，断言1–4 全过，6m39s） | "断言1–4 全绿" | ⚠️ 首轮 flaky，见 P2 |
| shots 几何 1d | `18-person-1440 列1[w=596 left=112] 列2[w=596 left=732] 宽比=1.000`；`19-person-768` 单列(left=16/16) | 同 | ✅ 完全一致 |
| **mutation** | **无法运行**：`ui.jsx` sha 漂移（期望 `08B2BA6B…`，实际 `430E8913…`）→ 启动即拒绝 | "12/12 真红" | ❌ **不可复现**，见 P0 |
| M13 几何门 | **注入后真红**（cols 退化单列，exit 2） | 同 | ✅ 独立确认 |
| findcheck | 12/12 hits=1 | 12/12 | ✅ |
| file:// | 六项全过 | 四项+2 | ✅ |

---

## 3. 问题清单

### P0（必须修复 · 阻断发布）

**P0-1 `mutation.cjs` 因 `TARGETS` sha 漂移而无法启动，变异自证整体不可运行。**
- 证据：`node tests/mutation.cjs` 输出 `TARGETS 清单与工作区 sha256 不一致`，报 `src/components/ui.jsx` 期望 `08B2BA6B…`、实际 `430E8913…`，**exit 1，不写任何文件**。
- 根因：任务 #38/#39（§11「档位条悬停 title」）改了 `ui.jsx`（新增 `title={copy}`），但 **`TARGETS` 未用 `--print-sha` 同步**；该任务尚未收尾，TARGETS 处于断裂态。
- 影响：构建师报告「mutation 12 条全真红」**在当前树上不可复现**；任何依赖 `mutation.cjs` 的洁净度保证失效；若此时有人强行绕过 sha 校验跑变异，将在**未知脏树**上变更（正是本项目多次栽的坑）。
- **修复建议**：完成 #38/#39 后，运行 `node tests/mutation.cjs --print-sha` 并用输出**更新 `mutation.cjs` 的 `TARGETS['src/components/ui.jsx']`**，然后跑一次全量 mutation 确认 12/12 真红且收尾 sha 回基线。**在此之前不得宣称「变异全绿」。**

### P1（建议修复 · 影响品质/可信度）

**P1-1 `shots.cjs` 断言 1c 的 `26-demandnew-375` 档存在 flaky（首轮实测变红）。**
- 证据：首轮 `SHOTS_EXIT=1`，失败行 `断言1c 表单顺序 26-demandnew-375：promise/assistant 的 left/top 未量到`（`specGeom` 为空）；**同一 dist 复跑即 PASS**（该档实测 `promise[top=354 left=16] assistant[top=544 left=16] form[top=967 left=16]`）。
- 根因推测：该档 `mobile:true, pre:CLICK_BRD`，375 视口下 `CLICK_BRD`（点「功能/系统」分段）偶发未生效 → BRD 分支未渲染 → `.dp-g-spec` 缺失。
- 影响：① 使「mutation M2 的文本门由 shots 1c 实测兜底」的辩护**时灵时不灵**；② CI/评审会随机见红，误导。
- **修复建议**：在该档 `pre` 脚本后加**存在性重试/断言**（如点击后 `await` 到 `.dp-demand-assistant` 出现再测量，最多重试 2 次），或把 `settle` 从 800ms 提高并对 `CLICK_BRD` 返回值(`!!it`)做校验；确保「未渲染」与「渲染顺序错」在失败信息里可区分。

**P1-2 残留物未清理完毕（构建师 §8 漏报）。**
- 证据：除已报的 `_smoke_floorowner_…cjs` 外，另有 `portal/_v043_mockbundle_{gid,groups,nonecount}.mjs`、根 `_tmp_noop.mjs`、`portal/_probe_v043_*.cjs`（11 个）残留。
- **修复建议**：交付前用 `git status --porcelain` 清点，删除上述临时文件；`_geom_duo.cjs`/`_findcheck.cjs` 作为**正式测试工具保留**（应在报告中列为测试资产，而非残留）。

### P2（可选优化）

- **P2-1 `mutation.cjs` M2 仍为文本门**：构建师已主动承认并给出「shots 1c 几何独立覆盖」的辩护；但该辩护依赖的 shots 1c 存在 flaky（P1-1）。建议参照 §10.2 的探针模式，为 M2 也补一条几何门，或先修好 shots 1c 的稳定性。**（诚实性上，构建师已达标——主动披露，不惩罚。）**
- **P2-2 smoke 断言总数与报告不符**（我 194 vs 报告 192）：因 §11 新增 2 门未回填 smoke 注释/报告。建议收尾时统一数字。
- **P2-3 `.dp-tag-floor` 窄卡信息密度**：132px 卡内「标签名 + 点赞 + 11px 分组名 + 4 段档位条」四行，横排时视觉略密。可考虑分组名小字降为 10px 或与档位条同行，但不强制。

---

## 4. 证伪尝试（主动打假，均未推翻）

1. **试图证明 M13 是文本门** → 失败：注入后几何探针真实变红（leftDiff=false，实际宽度数字），**确为几何门**。
2. **试图证明数据层被二次篡改** → 失败：79=79、逐人键集合零差异、min.zhou=8。
3. **试图证明 blocked 行被吞** → 失败：DS-3121 整行四要素齐全、无状态 Pill。
4. **试图证明逾期染了整行** → 失败：行背景透明、无「逾期」字样、仅日期数字 `#8A5200`。
5. **试图证明「未来 1 个月」会漂移** → 失败：窗口端点为硬编码字符串、数据全静态、函数无 runtime date。
6. **试图证明 file:// 有外部请求** → 失败：fetch/XHR=0，js 内 http(s) 全为命名空间串。
7. **试图证明楼层顺序错** → 失败：`[breadcrumb, hero, dp-floor-tags, dp-g-duo]` 实测正确。

## 5. 未能独立验证的部分（诚实声明）

- **完整 12 条变异「逐条真红」**：因 P0（sha 漂移）无法整轮运行；我只**独立复现了 M13** 的真红，其余 11 条依赖构建师 §10.4 记录 + findcheck + 我对断言性质的静态分类。**修 P0 后须由他人整轮复跑。**
- **shots 首轮 flaky 的精确触发概率**：只跑了 2 次（1 红 1 绿），样本不足以给概率；确认为「非确定性」。
- 我重建了 `dist/`（并在 M13 注入后 clean rebuild 还原）；**未改动 `portal/src/` 任何文件**，注入的 `global.css` 已按 sha 校验还原（`D9AC2F10…E06D14`）。

## 6. 三楼层顺序 / 三条用户指令对照

| 用户指令 | 结论 |
|---|---|
| ① 主页新增「近期工作内容」（基于 Jira，任务名 + 预期交付时间，当前至未来 1 个月） | ✅ 满足：独立 `JIRA_ISSUES` 表 + `getPersonWork` + 固定窗口；行含单号/任务名/项目/预期交付；空态中性。 |
| ② 近期工作内容 + 近期知识贡献 放同一楼层 | ✅ 满足：`.dp-g-duo` 等宽双栏同层（实测 2 栏）。 |
| ③ 技能标签不用分组、横向楼层、紧接着个人信息楼层 | ✅ 满足：`.dp-tag-floor` flex-wrap 横排（无分组标题条，仅保留卡内 11px 组名小字）；实测紧邻 hero 之后。 |

---

*报告生成：独立复算，所有数字来自本审查官自跑的探针 / jest 探针 / CDP 几何 / git 比对，未采信构建师任何未经复现的声明。*
