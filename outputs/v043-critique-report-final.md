# v0.4.3 最终树 — 独立质量复核报告（Phase 4 复审 · 攻盲区）

**审查官**：质量审查官 · 严过审（Yan）
**复核对象**：v0.4.3 返修后的最终工作树（HEAD=`36347c2`，未 commit）
**复核日期**：2026-09-20
**方法**：不复跑构建师跑过的命令；只攻其自证盲区；每条结论附可复现命令 + 原始输出摘录；全程只读注入并逐字节还原（附 sha256 自证）。

---

## 一、总裁决

# **FAIL**

- **1×P0（新，阻断）**：`mutation.cjs` 的「smoke 启动失败 / 工作树被污染」分流修复**不存在** —— 属**假修**。team-lead 在 §三-4 已预置判据：「若 A 情形仍报『工作树可能已被污染』，即为假修，直接判 FAIL」。该判据**已被复现命中**。
- **1×P1（新）**：M13 几何门的 `ratio`（等宽比）子断言**对 M13 自身注入是装饰性的**——它在单列注入下恒为 `inBand=true`，永远不可能独立致红。运行器只看 `gm.ok`，不区分子断言，故「等宽」这半个语义**从未被真正测过**。
- 上轮 P1-1（shots 1c flaky）/ P1-2 / P2-1 / P2-2 / P2-3 经复核**已闭合**（详见 §五）。
- team-lead 关于「P0 = NODE_PATH 未导出致 smoke 崩溃」的归因**部分成立**，但「TARGETS 当时就已 = 430E8913、无漂移」一句与我的原始存档**事实冲突**（详见 §二）。

**5 维度评分：21/25**（与上轮持平；新增 P0 用于「假修」而非设计本身）

| 维度 | 评分 | 说明 |
|------|------|------|
| 设计哲学 | 5/5 | 楼层重排 / Jira 卡 / 横排标签的意图清晰、自洽，非堆砌 |
| 视觉层次 | 4/5 | 三楼层顺序与焦点得当；扣分因 M13 的「等宽」语义实际未被守 |
| 执行质量 | 4/5 | 源码/数据层洁净、构建 0、smoke 194、TARGETS 一致；扣分在**测试自证的可信度**（假修 + 装饰断言） |
| 特异性 | 5/5 | 迪卡侬业务语汇（价签/POS/自助结账）密度高，不会被误认为通用模板 |
| 克制 | 3/5 | 设计层面克制；但「测试自证」层出现两处不可信自证（P0 假修 + P2 装饰断言），属"自证噪音" |

---

## 二、P0 争议的真相核对（关于上一轮我的 FAIL）

team-lead 交办称我上轮 P0 不成立，并给了 NODE_PATH 归因。我把**双方证据**并排放：

**事实 A（我的原始存档，未删）**：`outputs/_y_mut_probe_clean.txt` 明确打印了 **preflight sha-mismatch 路径**：

```
src/components/ui.jsx 期望 sha=08B2BA6B3BA192BC6ACF5257DE37C31A2265DF52E5CE55758A5085BC121DA3B6
                      实际 sha=430E8913062917AE7F34A053950AA19A2148F76FA6240D8AF45993FDFEC986E7
```

这是 `mutation.cjs:419` 的 `❌ 工作树已被污染，拒绝启动` 分支，输出里**带期望/实际 sha**。故「TARGETS.ui.jsx 当时就已经是 430E8913」**与我实测输出不符**——当时 TARGETS 里写的是 `08B2BA6B`。

**事实 B（team-lead 的归因，也真实）**：清空 `NODE_PATH` 跑 `mutation.cjs`，末行确为：

```
❌ 基线 smoke 未全绿（(no total)），工作树可能已被污染，拒绝启动。
```

（我本轮 `outputs/_y3_mut_nonp.out.txt` **独立复现**了这条。）

**结论**：当时存在**两条独立的 exit-1 路径**——①preflight sha 漂移；②NODE_PATH 缺失致 smoke 崩溃被误报为「工作树被污染」。team-lead 看到的可能是②，我存档的是①。**两者都真实**。构建师在 #41 把 TARGETS.ui.jsx 同步到 `430E8913`（现 7/7 与工作区逐字节一致，我本轮 `_y3_sha.out.txt` 复核 OK），**①已消**。**但②（错误归因文本）至今未修** —— 即本报告 P0。

> 说明：我认可 team-lead「P0 已不成立」的**当前状态**（sha 已同步），但**不认**「当时就已同步、是我被误导」这一表述——我的原始输出不是幻觉。此处关乎审计可追溯性，特此留证。

---

## 三、§三 逐项复核（命令 + 原始输出）

### §三-4（★最高优先级）`mutation.cjs` 新分流逻辑 —— **假修，命中 FAIL 判据**

**静态证据（源码级）**：对本文件全文检索 6 个关键串：

```
grep -n "未能启动|NODE_PATH|MODULE_NOT_FOUND|jsdom|启动失败" portal/tests/mutation.cjs
→ No matches found
grep -n "工作树可能已被污染" portal/tests/mutation.cjs
→ 456: console.error('❌ 基线 smoke 未全绿（' + s0.total + '），工作树可能已被污染，拒绝启动。');
```

- `smoke()`（250-255）**未改**：`return {... fail: total[3]?Number(total[3]):null, total: total[0]||'(no total)'}` —— 无「失败种类」返回。
- 基线判定（454-459）**未改**：`if (s0.fail === null || s0.fail !== 0)` → 打印「工作树可能已被污染」。
- 全文**不存在** `未能启动 / NODE_PATH / MODULE_NOT_FOUND / jsdom` 任何一处。构建师 §三-4 声称的「MODULE_NOT_FOUND → 报 smoke 未能启动 + 检查 NODE_PATH」**在代码中不存在**。
- 另发现 `MUTATION_SELFTEST_CRASH`（481-506）——那是**崩溃自愈钩子**，与「启动失败分流」无关，不能替代。

**动态证据（team-lead A 情形）**：清空 NODE_PATH 跑 `mutation.cjs`：

```
$env:NODE_PATH=''; node portal/tests/mutation.cjs
exit_status=1
[i] 基线构建…
❌ 基线 smoke 未全绿（(no total)），工作树可能已被污染，拒绝启动。
```

- **不含** jsdom/启动失败字样；**含**「工作树可能已被污染」。

**裁定**：命中 team-lead 预置判据「A 情形仍报『工作树可能已被污染』→ 假修 → 直接判 FAIL」。**P0 成立。**

### §三-1 手动注入交叉核验（≥3 条，含 M13 几何门 + 1 条 src/ 注入）

全部**逐字节还原**，附 sha 自证。

**(a) M13 几何门（`src/global.css`，注入单列）** —— `outputs/_y3_m13.out.txt`：

```
file=src/global.css beforeSha=D9AC2F10... findHits=1
build exit=0
geom probe exit=2 (2=红)
GEOM_JSON={"ok":false,
  "cols":[{"left":112,"top":527,"w":1216},{"left":112,"top":999,"w":1216}],
  "ratio":1,"gridW":1216,"cols0":"1216px",
  "verdict":"cols=[w1216/left112, w1216/left112] ratio=1.000 leftDiff=false inBand=true"}
restored afterSha=D9AC2F10... match=true
```

**「装饰性断言」分析（team-lead 点名的高危模式）——成立：**

- 单列注入后，`.dp-g-duo` **仍有 2 个子节点**（`top` 527 与 999——竖向堆叠），二者 `left` 均 112、`w` 均 1216。
- 探针算式（`_geom_duo.cjs:116-120`）：`ratio = max(w)/min(w) = 1216/1216 = 1.000` → `inBand = 1.000∈[0.92,1.08] = **true**`。
- `ok = leftDiff && inBand = false && true = false` → 红。**红只由 `leftDiff=false` 触发；`ratio/inBand` 在此恒为真，永不独立致红。**
- 运行器 `mutation.cjs:519` 只判 `if (gm.ok === false)`，**不区分子断言** → 「等宽(1fr:1fr)」这半个语义**从未被真正验证过**；只要两列 `left` 不同、即便宽度比 1.9:1（严重不等宽）也会判"红通过"。

**这一点我判 P1**：M13 声称覆盖「等宽双栏」，但实际只覆盖「左右双栏（不等宽也过）」。正确修法：新增一条独立变异（如把 `minmax(0,1fr) minmax(0,1fr)` 改成 `minmax(0,1.4fr) minmax(0,1fr)`），它**只会**让 `inBand=false` 而 `leftDiff=true`，从而**单独钉住等宽语义**。或在探针 exit 码/verdict 里区分「leftDiff 失败」与「ratio 失败」，并在 MUTATIONS 里显式断言 `verdict` 含 `leftDiff=false`。

**(b) M7（`src/data/mock.js`，数据层注入 blocked 过滤）** —— `outputs/_y3_inject2.out.txt`：

```
file=src/data/mock.js beforeSha=027243E3... findHits=1
build exit=0
smoke exit=1 summary=合计 194 项断言，通过 192，失败 2
FAIL  v0.4.3 blocked 整行仍渲染   [未找到 DS-3121 所在行（blocked 行可能被整行吞掉）]
FAIL  v0.4.3 工作行上限/extra（周敏）
restored afterSha=027243E3... match=true
```

→ **命中目标断言、且原因即为预期的「blocked 行被吞」**。红得其所。✅

**(c) M2（`src/global.css`，order 规则删除）** —— 同上文件：

```
file=src/global.css beforeSha=D9AC2F10... findHits=1
build exit=0
smoke exit=1 summary=合计 194 项断言，通过 190，失败 4
FAIL  P0-1 ≤900px 媒体块完整（样式表规则级检查，非实测）   [block=true orderHits=2/3]
restored afterSha=D9AC2F10... match=true
```

→ 命中目标断言。✅（注意：此为**文本门**变异，运行器自述"非实测"——与 M13 的几何门形成对照。）

**三条注入全部还原，sha 逐字节回基线。**

### §三-5 shots.cjs 1c「非静默」验证（防「重试到绿」）—— **实测通过**

**机制读码**（`shots.cjs:361-391`）：`waitSel` 声明时轮询 `MAX_ATTEMPTS=10 × STEP_MS=300ms`，每轮补点 `CLICK_BRD`；超时 → `preFailures.push('[pre 存在性超时] ...')`；`preFailures` 在断言阶段（`:492`）**并入 `failures`**；`failures.length` → `[FAIL]` + `process.exitCode=1`（`:725-728`）。代码链路**确为确定性失败**，无静默/重试到绿路径。

**破坏性实测**（使 `.dp-demand-assistant` 永不渲染 → 注入 `{isBrd ? (`→`{false ? (`），以 shots 同口径 3s 轮询：

```
§三-5 probe: DemandNew beforeSha=135AB61F... findHits=1
build exit=0
pre(CLICK_BRD) hit=true
waitSel found=false waited=3000ms / limit=3000ms
diagnostic: seg="功能 / 系统（8 项）" .dp-g-spec rendered=true
=> preFailures branch would FIRE (deterministic FAIL, non-silent)
restored afterSha=135AB61F... match=true
```

**关键**：BRD 已正确点中（`pre hit=true`）、分段已切到「功能 / 系统（8 项）」、`.dp-g-spec` 已渲染——**页面完全健康，唯独目标元素缺席**，仍判 `found=false` 超时。证明该门是**真前置条件门**（而非路由 artifact），超时**确定性 FAIL**、**非静默 pass**、**非重试到绿**。✅ **P1-1 修复成立。**

### §三-2 `.gitignore` 洞 —— **确认，团队-lead 正确**

```
git check-ignore -v portal/_v043_mockbundle_gid.mjs      → exit 1（未忽略）
git check-ignore -v portal/_v043_mockbundle_groups.mjs   → exit 1（未忽略）
git check-ignore -v portal/_v043_mockbundle_nonecount.mjs→ exit 1（未忽略）
git check-ignore -v portal/_anything.cjs                 → exit 0  .gitignore:80:/portal/_*.cjs
```

`.gitignore` 第 103-106 行仅覆盖 `/portal/_*.cjs | *.js | *.txt | *.json`，**缺 `*.mjs`**；而平行的 tests 块（116-117）**同时**有 `_*.cjs` 与 `_*.mjs`。故 portal 块纯属漏了一行。

**根因修法**（一行，根锚定）：
```diff
 /portal/_*.cjs
 /portal/_*.js
+/portal/_*.mjs
 /portal/_*.txt
 /portal/_*.json
```

### §三-3 未跟踪文件分类 —— **确认，无例外**

`git ls-files --others --exclude-standard`（全仓）恰为 9 项：

| 文件 | 归属 | 应否入库 |
|---|---|---|
| `outputs/v042-design-tokens.md` / `v042-implementation-report.md` | 规范/报告 | ✅ 应 commit |
| `outputs/v043-critique-report.md` / `v043-design-tokens.md` / `v043-implementation-report.md` / `v043-requirements.md` | 规范/报告 | ✅ 应 commit |
| `portal/_v043_mockbundle_{gid,groups,nonecount}.mjs` | 临时 bundle | ❌ 不应（且当前**未被忽略**，见 §三-2） |

**反例排查**：`portal/` 下未跟踪**仅**这 3 个 `.mjs`；`outputs/` 下未跟踪**仅**这 6 个 `.md`；`git status --porcelain` 无第 10 项 `??`。**无例外。** ✅

### §三-6 关闭上轮 P1/P2

- **P2-1（报告数字）** ✅：权威 194（报告头行、§11.4、§12.6 一致）；191/192 均就地标 ⚠️「返修前记录」+ 指向 §11.4。§12.3 附全文自查，无陈旧数字冒充当前值。
- **P2-2（`mutation-geom.cjs` 误名）** ✅：报告**全文无** `mutation-geom.cjs`；实际探针 `tests/_geom_duo.cjs` 在 §10.2/§11.4/§12.4 口径一致。该误名仅存于口头简写。
- **P2-3（`d-esl` aliases）** ✅：`mock.js:898` = `aliases:['价签','设备']`，**有意为之且有依据**——吴桐 tags 含自由串「设备」（`mock.js:1685`），缺此 alias 会被 `resolveTagIds` 静默丢弃（违反规范 R1）。目标文件未误改。

---

## 四、问题清单（P0/P1/P2）

#### P0 — 必须修复（阻断）
1. **`mutation.cjs` 启动失败分流为假修。** 清空 `NODE_PATH` 时，`smoke()` 因 jsdom 缺失崩溃、无汇总行 → `s0.fail===null` → 落入 `:455` 分支，**误报为「基线 smoke 未全绿，工作树可能已被污染」**，掩盖真实根因（环境缺失）。构建师声称已修，**源码中无该修复**。
   → **修复建议**：`smoke()` 返回失败种类（如解析 `out` 中 `MODULE_NOT_FOUND`/jsdom 或空汇总行 → `kind:'startup'`），`baseline` 分支据此分流：`kind==='startup'` → 打印「smoke 未能启动（疑似 NODE_PATH 未导出 / jsdom 缺失），**不是工作树污染**」；仅当 smoke 真跑起来但全绿失败时才报「工作树可能已被污染」。

#### P1 — 建议修复
1. **M13 的 `ratio`/`inBand` 子断言对 M13 自身注入是装饰性的。** 单列注入下 `ratio=1.000 → inBand=true`，红只由 `leftDiff=false` 触发；运行器只看 `gm.ok`，不区分子断言。「等宽双栏」的**等宽**语义从未被真正覆盖（不等宽也能判"红通过"）。
   → **修复建议**：新增一条独立变异（如 `1fr/1fr`→`1.4fr/1fr`），它**只**令 `inBand=false` 而 `leftDiff=true`，从而单独钉住等宽语义；或在 `_geom_duo.cjs` verdict/exit 中区分「leftDiff 失败」与「ratio 失败」，并在 MUTATIONS 中断言 `verdict` 含 `leftDiff=false`。

#### P2 — 可选优化
1. 探针 `_geom_duo.cjs` 与 `shots.cjs` 的 1d 口径重复实现（两处 ratio 计算逻辑），建议抽公共函数以防未来口径漂移。
2. `portal/_v043_mockbundle_*.mjs` 修完 §三-2 的 ignore 后应删除（当前仍物理存在）。
3. 报告 §2/§3/§4 的历史数字虽已带警示，但读者仍易误读；建议将历史表折叠或统一迁到「附·演进记录」。

---

## 五、复核后状态与自证

- **最终树 sha 一致性**：7/7 TARGETS 与工作区**逐字节一致**（`outputs/_y3_sha.out.txt`）；**HEAD=`36347c2`，未 commit**。
- **本次复核全部注入均已还原**：DemandNew.jsx / global.css / mock.js / BrdAssistantCard.jsx，每条附 `restored afterSha=... match=true`。
- **复核过程曾两次因我并发跑多个注入任务导致工作树短暂被污染**（DemandNew.jsx / BrdAssistantCard.jsx），已分别用「反注入」与 `tests/.mutation-backup/*.bak` 还原至基线 sha，并最终 7/7 复验 OK。**我未对任何业务文件做**（除瞬时注入-还原外）**持久改动。**

### 复现命令清单
```powershell
# §三-4 A：清空 NODE_PATH（预期：仍报「工作树可能已被污染」）
$env:NODE_PATH=''; & $NODE portal/tests/mutation.cjs
# §三-1 M13 单列注入 → 几何探针
& $NODE portal/tests/_geom_duo.cjs    # 变异后 exit=2，GEOM_JSON.verdict 见上
# §三-2 / §三-3
git check-ignore -v portal/_v043_mockbundle_gid.mjs
git ls-files --others --exclude-standard
```
（`$NODE=C:\Users\uuzz\.workbuddy\binaries\node\versions\22.22.2-3\node.exe`）

---

## 六、放行意见

**不予放行。** 阻断项为 **P0「假修」**：构建师在 §三-4 声称修好的启动失败分流，**在最终树源码中并不存在**，且已被 team-lead 预设判据命中。请构建师先落地真实分流（区分 `startup` 与 `worktree-polluted`），并建议同时处理 **P1（M13 等宽语义装饰断言）** 后再送复。上轮 P1-1/P1-2/P2 已闭合，其余设计维度质量高（21/25），距放行只差这两处**测试自证可信度**的修补。
