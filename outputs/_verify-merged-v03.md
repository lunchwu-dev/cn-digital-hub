# 独立复验报告 — 合并方案 v0.3「测试可信度」审查

> 审查人：质量审查官 严过审（critique-reviewer-3）
> 结论口径：**只认我自己亲跑出来的证据**；凡未亲自验证者一律标注「未验证」。
> 本报告不改任何产品代码，仅新增本文件于 `outputs/`。

---

## 0. 环境与工具

- Bash 工具在本机损坏（`ls`/`cd`/`dirname` 均 exit 127）→ 全程改用 **PowerShell**。
- PowerShell stdout 被宿主吞掉 → 所有命令输出重定向到文件后用 Read 读取。
- 子进程（node）输出经 Windows 管道后被宿主 **UTF-16LE(BOM `fffe`)** 编码 → 一律用 node 脚本按 `utf16le` 解码后 `fs.writeFileSync(...,'utf8')` 落盘再读。
- node：`C:\Users\uuzz\.workbuddy\binaries\node\versions\22.22.2-3\node.exe`
- `$env:NODE_PATH = "C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules"`
- Chrome：`C:\Program Files\Google\Chrome\Application\chrome.exe`（存在）；`portal/dist/index.html` 存在。

---

## 1. 权威基线（我亲跑）

| 命令 | 结果 | exit | 证据文件 |
|------|------|------|----------|
| `node tests/smoke.cjs`（cwd=portal） | **合计 152 项断言，通过 152，失败 0** | **0** | `outputs/_v3_smoke_utf8.txt`（解码后第 106 行）/`_v3_smoke_exit.txt` |
| `node tests/shots.cjs`（cwd=portal） | `[OK] 断言1–4 全部通过`（含几何门 900/1280/375） | **0** | `outputs/_v3_shots_ascii.txt`/`_v3_shots_exit.txt` |
| `node _v3_sha.cjs`（比对 5 个 TARGETS sha256） | **MISMATCH_COUNT=0**（5/5 命中） | 0 | `outputs/_v3_sha_out.txt` |
| `node _v3_find.cjs`（比对 6 条变异 find 串是否命中源码） | **4 HIT / 2 MISS** | 0 | `outputs/_v3_find_out.txt` |
| `node tests/mutation.cjs` | **未跑全量**（原因见 §5：M1/M4 目标已迁址，全量跑无意义且会写盘；改为静态+sha 分析） | — | — |

### 断言总数（权威）
- **smoke.cjs = 152 条**（我亲跑汇总行即为 `152/152/0`；不是 142，也不是此前报告口径的近似值）。
- 结论：**此前「142」的派单数字是错的；「152」可信**。我实测吻合。
- shots.cjs 断言为「1 组哨兵 + 断言1/1b/1c/2a/2b/3/4a/4b/4c」的**连续扫描门**（非 `results` 计数式），exit 0 表示全部通过。

---

## 2. 断言成色分类表

分三类：**实测门**（读渲染结果）/ **文本门**（读源码文本或 CSS 规则文本）/ **纯函数探针**（直接调导出纯函数）。

### 2.1 实测门（读渲染 DOM / computed style / 真实几何）
> 这些都是真证据：读的是运行时渲染出的 DOM 结构、`getComputedStyle`、或（shots 通道）`getBoundingClientRect`。

| 断言名 | 机制 | smoke.cjs:行 |
|--------|------|--------------|
| React 挂载成功 | `#root.children.length` + body 文本长度 | 483 |
| 深色顶栏已渲染 | `querySelector('.dp-topbar')` | 489 |
| 一级导航 7 项 | `querySelectorAll('.dp-nav-item').length===7` | 492 |
| 路由 #/* 特征文案（7 条） | 真实导航 + 真实 DOM 文本 | 552-584 |
| 加载态 Skeleton 出现→消失 | 真实 `.ant-skeleton` 在/不在 | 556-560 |
| 「变更类型」胶囊为中性灰 | `typePill.getAttribute('style')` 读内联色值（**近似实测**，读的是渲染元素属性） | 601-607 |
| 搜索命中 / 分组 / 空态 / Modal 开关 | 真实交互 + DOM 文本 | 612-652 |
| 未知路由 → 404 空态 | 真实导航 + `.dp-empty` | 657-671 |
| Agent 面板打开/回复/关闭 | 真实点击 + `.dp-agent-panel[data-open]` | 676-702 |
| 首页入口大卡 / 按钮 / 计数 / 跳转 | 真实 DOM + 真实点击跳转 | 711-757 |
| 业务需求一级页 楼层 5 格 / 列表 ≥6 / 新增入口 | 真实 DOM 计数 | 768-802 |
| 异常告警格「责任人」 | `getComputedStyle(owner).fontSize/color` **实测** | 814-838 |
| 业务需求楼层零语义色 | `getComputedStyle` 逐元素读 color/bg（**明确弃用仅扫 inline style**） | 850-878 |
| P1-1 首页计数 === 需求页楼层 | 跨路由真实读 DOM 文本比对 | 922-945 |
| 新增需求页 .dp-g-spec / .dp-form / 返回入口 | 真实 DOM | 954-964 |
| P0-1 右栏无内联 display（C） | `side.getAttribute('style')` 读渲染元素 | 1008-1013 |
| P0-1 DOM 顺序 A | 真实 DOM 子节点顺序 | 1016-1031 |
| P0-1 三锚点齐备 D | 真实 DOM 存在性 | 1059-1060 |
| 轻量档/完整档字段集、量级胶囊、切档 | 真实点击 + 真实 DOM | 1065-1146 |
| P2-2 胶囊焦点环 mouse/kb | 真实 focusin/focusout + `chip.style.outline` | 1108-1135 |
| 涉及系统「说不清」chip | 精确定位到 `button[aria-pressed]` | 1215-1229 |
| 完成度上升 / 三态 emptyHint / 展开明细 D1–D5 | 真实 setNativeValue + 真实 DOM | 1241-1311 |
| 点快捷问题保留 agent 建议 | 真实点击 + 真实 DOM 气泡 | 1328-1353 |
| FAQ 待补队列闭环 / 键盘可达 .dp-row | 真实交互 + DOM 属性 | 1455-1492 |
| 组织速查行→个人主页路由 | 真实点击 + `location.hash` | 1515-1527 |
| 个人主页渲染 / 标签矩阵 / 圆点 / legacy chip / 逐标签闭环 | 真实导航 + `getComputedStyle`（dashed/3px） | 1532-1637 |
| 反查页渲染 / chip 组 / 空态 / 结果行 / 归档区 deprecated+merged chip | 真实交互 + `getComputedStyle` | 1642-1733 |
| 全局搜索人员分组 | 真实交互 | 1737-1764 |
| v0.4 分档门（周敏吹牛双行=7 等） | **逐文本节点计数**（真实渲染） | 1832-1866 |
| P1-3/P1-4 守卫（读 MOCK 数据集合断言不变量） | 读 MOCK 真实数据（数据层，非渲染，但属真实运行态） | 1939-1982 |
| 栅格居中 / 锚点偏移 / 焦点环（**读 CSS 源文本**） | ⚠️ **文本门**（见 2.2） | 2004-2022 |
| P95 单色 / 单位 ms / 装饰色文字 / 页脚披露 | 真实 DOM 属性 `rect[fill]` / `svg text[fill]` | 2032-2057 |
| 零 console.error / 无未处理 rejection | 真实 VirtualConsole 采集 | 2060-2064 |
| 不透明源 localStorage 抛错仍挂载 | 独立 boot 实例 | 2067-2082 |
| **P0-1 填期望完成时间→提交→列表可见** | **独立 JSDOM 全交互链路** | 2115-2153 |
| 断言1 连续溢出 / 1b doodle 几何 / **1c 表单顺序几何** / 2a 顶栏高等值 / 2b 单调 / 3 内容不变式 / 4 navText 区间 | shots.cjs **真实 Chrome + `getBoundingClientRect`** | shots.cjs:432-562 |

### 2.2 文本门（读源码/CSS 规则文本，**不等于渲染正确**）
| 断言名 | 读的是什么 | 行 | 是否已标注 |
|--------|-----------|----|-----------|
| **P0-1 ≤900px 媒体块含 display:contents + order 1..3** | `style.css` 正则匹配媒体块文本 + `order:1/2/3` 子串计数 | smoke.cjs:1037-1049 | ✅ **已改名**：断言名含「（样式表规则级检查，非实测）」（:1046/:1048） |
| P0-1 桌面态 flex 类规则存在 | `style.css` 正则 | :1052-1056 | ⚠️ 未显式标注（但语义即「类规则存在」） |
| .dp-shell/.dp-container 同为居中栅格 | `style.css` 正则 | :2004-2007 | ⚠️ 未标注（但 shots.cjs 用真实 `left` 独立复验对齐） |
| 锚点 scroll-margin-top ≥60px | `style.css` 正则取数值 | :2013-2016 | ⚠️ 未标注（读的是规则文本，非渲染） |
| 可点卡片/列表行有 :focus-visible | `style.css` 正则 | :2020-2023 | ⚠️ 未标注（规则级） |

> 说明：后四条是「规则存在性」断言，其本质就是文本门。它们**未被逐个改名**，但其中「居中对齐」已被 shots.cjs 的真实几何覆盖；`:focus-visible`/`scroll-margin-top`/`display:flex` 的真实效果**未在渲染层被独立验证**（属残留文本门，见 §6）。

### 2.3 纯函数探针（不经渲染，逻辑正确）
| 断言名 | 探针 | 行 |
|--------|------|-----|
| P2-2 状态楼层「多责任人」分支全覆盖（6 组） | `floorOwnerText`（esbuild 打包 DemandList.jsx 导出） | :888-909 |
| §E.1③ adviceTopic 三例 | `adviceTopic`（打包 DemandNew.jsx 导出） | :1158-1207 |
| v0.4 反查页空态 emptyCopy 四例 + 健壮性 | `emptyCopy`（打包 TagBrowse.jsx 导出） | :1881-1932 |
| P1-2 parseOwnerName 边界 | `MOCK.parseOwnerName` | :1798-1811 |
| P1-1 吹牛态收敛（遍历 personTags） | `MOCK.getPersonProfile` | :1773-1795 |

### 2.4 关于「文本门冒充实测门」的复发检查
- 逐条核对后：**上轮被点名的 ≤900px 媒体块断言现已改名**，断言名明确写「样式表规则级检查，非实测」(smoke.cjs:1046/1048)。✅ 已修复。
- 未发现**新的**「用正则 match 样式表却伪装成实测」的断言。
- 残留的 4 条文本门（§2.2 后四条）应理解为「规则存在性检查」，不属于伪装，但**其真实渲染效果未被独立验证**（已计为剩余风险）。

---

## 3. 几何门（assertion 1c）是否可能「永远为绿」？

**明确结论：不会恒绿。它是真几何门，且有一条「缺图即红」的 fail-loud 哨兵。**

### 3.1 是否真的用 `getBoundingClientRect().top/.left` 比较？
是。核心在 `MEASURE` 的 `G()`（shots.cjs:95）：
```
const G = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), w: ..., h: ... }; };
```
断言处（shots.cjs:470-506）读 `specGeom.promise/assistant/form` 的 `.top/.left` 做严格比较：
- :478 `if (!(promise.top < assistant.top)) failures.push(...)`
- :479 `if (!(assistant.top < form.top)) failures.push(...)`
- :480/:491/:503 比对 left 相等/不等。

### 3.2 SCAN_ROUTES 覆盖 + 档位/采样格
- `SCAN_ROUTES`（shots.cjs:186-198）**含全部三条新路由**：`#/org`（:195）、`#/demand`（:196）、`#/demand/new`（:197）。
- `SCAN_WIDTHS`（:185）= 11 个档位：`375,414,768,900,1024,1152,1240,1280,1366,1440,1920`。
- **10 路由 × 11 宽度 = 110 个采样格**。我解析 `report.json` 实测 `routeScan_cells=110`，routes 含 `org,demand,demand-new`，`routeScan_bad=0`（零溢出）。

### 3.3 会否因「三个矩形全 null/undefined 而跳过比较」→ 恒绿？
**不会。** 依据：
1. `G()` 找不到元素返回 `null` → 该字段为 null → `geq()`（:462 `typeof a==='number' && typeof b==='number'`）为 false → **`have=false` → `failures.push(...)`（变红）**，不是跳过。三个块（:471/:484/:496）都是「`!have` 就 push 失败」。
2. 另有独立哨兵（:508-510）：若无任何 `#/demand/new` 截图量到 `specGeom` → **push 失败**。
3. 退化的「全 0 矩形」若发生，`promise.top < assistant.top` 即 `0<0`=false → **变红**，不会绿。
4. **实跑反证**：本次 shots.cjs exit 0，且 `report.json` 中三张截图 `specGeom=YES`，实测值为：
   - `24-demandnew-900`：promise[top=243,left=16] assistant[top=389,left=16] form[top=673,left=16]
   - `25-demandnew-1280`：promise[top=251,left=768] assistant[top=419,left=768] form[top=251,left=32]（form.left≠side.left）
   - `26-demandnew-375`：promise[top=354,left=16] assistant[top=544,left=16] form[top=967,left=16]
   矩形均为**非零、跨档不同**的真实值，且顺序约束真实成立 → 说明这条门**确实在量真实渲染**，非空转。

> 残余注意（非「恒绿」，但影响强度）：该门依赖前置步骤 `CLICK_BRD`（点「功能 / 系统」档）成功，否则 `.dp-demand-assistant` 不渲染 → `have=false` → 变红。即「前置失败 = 报红」，属 fail-loud，可接受。

---

## 4. P0-1 回归门是否真走交互链路？

**明确结论：是，真正走了端到端交互链路（填值 → 触发提交 → 重渲染列表），不是仅调数据层。**

代码证据（`probeDemandExpectAtPath()`，smoke.cjs:259-356）：
- :272 **另起独立 `new JSDOM(html)`**，内联执行同一份 `dist` 产物（隔离于主 ctx）。
- :299 `await navigate(pwin, '#/demand/new')` —— 真实进二级页。
- :304 真实点击 `.ant-segmented-item`「功能 / 系统」切完整档。
- :312-315 `setNativeValue(...)` 给真实 `input.ant-input` / 两个 `textarea` 写值（内部 `dispatchEvent(new Event('input',{bubbles:true}))`，:220-226）。
- :318-322 真实点击 4 个 `button[aria-pressed]` 单选胶囊。
- :327-328 **关键**：`setNativeValue(dateInput,'2026-09-20')` + `dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))` 触发 antd DatePicker 的受控 onChange。
- :334-336 真实点击「提交需求」按钮，并断言出现 `.ant-message-notice-content` 含「已提交」。
- :339-342 导航回 `#/demand`，读 `querySelectorAll('.dp-row').length` 与 body 文本是否含新标题。
- :343-344 统计「新增 React 错误数」。

断言判定（:2123-2151）：要求 `rowsAfter>0 && hasNewTitle && newReactErrors===0 && submitted` 全部成立。
- 本次实跑：`rows=7 hasNew=true date=2026-09-20 newErr=0` → **PASS**。

对照产品代码：修复点在 **`portal/src/pages/DemandNew.jsx:357`**
```
expectAt: v.expectAt ? (v.expectAt.format ? v.expectAt.format('YYYY-MM-DD') : v.expectAt) : undefined,
```
（DatePicker onChange 在 `:566` `set({ expectAt: d })` 存 dayjs 对象，提交时 `:357` format 成字符串。）
且 smoke 另有一条数据层对照（:2142-2151）证实 `DemandList` 对字符串输入渲染 1 行、零 error。

> ⚠️ 注意与 §5 联动：本回归门**真走交互**，但 mutation.cjs 里用于「自证它会变红」的 **M1/M4 变异已因代码迁址而失效**（见下节）。也就是说：**门是真的，但「证明这扇门会咬人」的自证机制当前是断的。**

---

## 5. 变异套件（mutation.cjs）可信度

### 5.1 TARGETS 基线 vs 当前磁盘
- TARGETS 列 **5 个文件**（mutation.cjs:91-97）。
- 我用 node 亲算 sha256 比对（`outputs/_v3_sha_out.txt`）：**5/5 全 MATCH，MISMATCH_COUNT=0**。
- 即：**这 5 个文件的 sha 基线与当前磁盘一致**。

### 5.2 MUTATIONS 是否每条都指定「期望变红的断言子串」(expectRed)？
- **6 条变异全部都有 `expectRed`**（M1:106、M2:113、M3:120、M4:127、M5:134、M6:141）。无「只改代码不验红」的空缺。
- 机制上 mutation.cjs 会用 `lines.find(l => l.startsWith('FAIL') && l.includes(m.expectRed))`（:411）判定，找不到即 `ok:false`。

### 5.3 「永远不会红 / 空转」变异设计 —— **发现 2 处严重问题**
我逐条把 `MUTATIONS[i].find` 拿去在当前源码里查找（`outputs/_v3_find_out.txt`）：

| 变异 | 目标文件 | find 命中源码? | 判定 |
|------|---------|---------------|------|
| M1 P0-1 内联 display 回归 | `src/pages/Workspace.jsx` | **MISS（0 次）** | ⚠️ **失效** |
| M2 P0-1 ≤900 顺序规则删除 | `src/global.css` | HIT(1) | 有效 |
| M3 P0-2「说不清」chip 文案 | `src/data/mock.js` | HIT(1) | 有效 |
| M4 P1-2 三态退二态 | `src/pages/Workspace.jsx` | **MISS（0 次）** | ⚠️ **失效** |
| M5 P2-2 去鼠标焦点抑制 | `src/components/demand/ScaleChips.jsx` | HIT(1) | 有效 |
| M6 保留建议 | `src/components/demand/BrdAssistantCard.jsx` | HIT(1) | 有效 |

**根因（我进一步验证）**：A 线重构时，需求表单整块代码已从 `Workspace.jsx` **迁址到 `DemandNew.jsx`**：
- `Workspace.jsx:5-11` 头部注释明写：「原地删除重构前遗留的死代码 `DemandView`（约 620 行…）…『需求提交』已拆为一级页 #/demand + 二级页 #/demand/new」。
- M1 要找的 `<div className="dp-demand-side">` 现在位于 **`DemandNew.jsx:682`**。
- M4 要找的 8 空格缩进三目 `? i.partialHint\n : i.emptyHint || i.partialHint,` 已不存在；现形态是 `DemandNew.jsx:123` 的**单行三目** `i.state === 'full' ? i.fullHint : i.state === 'partial' ? i.partialHint : i.emptyHint || i.partialHint,`。
- **且 `DemandNew.jsx` 未被列入 TARGETS 的 5 个文件** → 其 sha 基线缺位。

**后果链**：
- M1/M4 变异 `mutatedText === originalText` → 命中 mutation.cjs:363-367 的「变异未命中」分支 → `results.push({ok:false, note:'变异未命中源码'})` → 汇总 `bad>0` → **进程 exit 1**。
- 因此该套件**不会「假绿」**（它是自曝其短的），但：
  1. **P0-1 内联 display 回归** 与 **P1-2 三态退二态** 这两条**关键守卫的自证已实际失效**——这两条缺陷若真复发，smoke 里对应断言（:1010「无内联 display」、:1303「独立 emptyHint」）**是否还能变红，目前没有有效证据**。
  2. 若有人「顺手」把失效的 M1/M4 从列表删除以让套件变绿，则这两条守卫将**彻底失去自证**。
  3. TARGETS 未覆盖 `DemandNew.jsx`，故「洁净锚点」也漏掉了真正承载被变异代码的文件。

> 判断：**变异套件当前不可信**——不是因为会假绿，而是因为它的**关键两条自证已经空转（find 不命中），却仍以「P0-1 / P1-2 已被自证」的口径存在**。这与上轮「文本门冒充实测门」是同一类病：**名义覆盖 ≠ 实际覆盖**。

---

## 6. 剩余风险与未验证项

1. **M1/M4 变异失效（P0，测试基建）**：`Workspace.jsx` 已无目标代码，find 不命中 → 这两条守卫无有效自证；`DemandNew.jsx` 未入 TARGETS。（证据：`_v3_find_out.txt`、`Workspace.jsx:5-11`、`DemandNew.jsx:123/682`。）
2. **mutation.cjs 全量未亲跑**：因 M1/M4 必然「未命中」导致 exit 1，且该脚本会改写 `src/`、重构建、跑 6 轮 smoke（耗时且写盘），我只做了**静态 sha + find 命中分析**。**「其余 4 条变异是否真能按 expectRed 变红」——未验证。**
3. **残留文本门未独立验证渲染效果（P2）**：`scroll-margin-top` / `:focus-visible` / `.dp-demand-side{display:flex}` / `.dp-shell` 居中 四条为 CSS 规则文本断言；其中聚焦环与锚点偏移的**真实浏览器效果未被独立断言**（居中已由 shots.cjs 真实 left 覆盖）。
4. **shots.cjs 的「路由抽点」只断言横向溢出**：110 格只验 `scrollWidth<=clientWidth`，未逐格验内容正确性（内容正确性由 smoke 覆盖，属分工，可接受）。
5. **P1-3/P1-4 等数据层断言依赖 `MOCK` 打包**：若 esbuild 打包失败会走 `fail` 分支（fail-loud），可接受；但**其「真实数据」路径未被独立第三方数据源交叉验证**（属设计取舍）。

---

## 7. 一句话结论

> **部分支持，但不足以采信「测试已验证合并方案满足两大任务全部需求」。**
>
> 支持的部分很硬：我亲跑 smoke **152/152/0（exit 0）**、shots **全绿（exit 0）**、几何门断言1c 用**真实 Chrome `getBoundingClientRect`** 量到非零且顺序正确的三组矩形（**不可能恒绿**，且有缺图即红的哨兵），三条新路由 `#/org`、`#/demand`、`#/demand/new` 确已进入 110 格抽点与 28 张截图，P0-1 回归门**确走真实交互链路**（`rows=7 hasNew=true date=2026-09-20 newErr=0`），且上轮点名的「文本门冒充实测门」那条**已改名标注**、5 个 TARGETS sha **全部一致**。
>
> **但不能完整采信的关键缺口**：变异自证套件里 **M1（P0-1 内联 display）与 M4（P1-2 三态）的 find 串已因代码迁址而 0 命中**——即「证明关键守卫会咬人」的自证实际**失效**，且承载被变异代码的 `DemandNew.jsx` **未纳入 sha 基线**。这正是「名义覆盖 ≠ 实际覆盖」的同一类病。
>
> **建议**：在合并提交前，把 M1/M4 的 `file` 改为 `src/pages/DemandNew.jsx` 并同步 `find` 串与 TARGETS sha（用 `--print-sha`），再**实跑一次全量 mutation.cjs** 拿到 6/6（或至少 M1/M3/M4/M5/M6）真变红的证据后，v0.3 的「测试已验证」结论方可采信。

---

### 附录：本次新增的证据文件（均在 `outputs/`）
- `_v3_smoke_utf8.txt` / `_v3_smoke_meta.txt` / `_v3_smoke_exit.txt`（smoke 原始+解码+exit）
- `_v3_shots_ascii.txt` / `_v3_shots_exit.txt`（shots 解码+exit）
- `_v3_sha_out.txt`（5 TARGETS sha 比对）、`_v3_find_out.txt`（6 变异 find 命中）
- `_v3_rpt2_out.txt`（report.json 路由覆盖/采样格）
- `_v3_names_out.txt`（smoke 断言名全量清单，含行号）

---

## 8. 定向复验（修复后裁定）

> 触发：team-lead 已按 §5.3 的 M1/M4 失效问题施工修复，要求我**独立核验修复点**并给出最终裁定。
> 本节所有结论均来自我本次亲跑，未采信施工方自述。

### 8.1 M1/M4 的 `file`/`find`/`repl`/`expectRed` 是否改指正确、expectRed 未弱化？
我直接读当前 `portal/tests/mutation.cjs`（:102-145）：

| 变异 | file | find | repl | expectRed | 判定 |
|------|------|------|------|-----------|------|
| M1 | **`src/pages/DemandNew.jsx`**（:105） | `<div className="dp-demand-side">`（:106） | 注入 `style={{ display:'flex', flexDirection:'column', gap:16 }}`（:107） | `P0-1 右栏容器无内联 display`（:108） | ✅ 改指正确 |
| M4 | **`src/pages/DemandNew.jsx`**（:126） | 单行 4 空格缩进三目 `    hint: i.state === 'full' ? … : i.emptyHint || i.partialHint,`（:127） | 末段 `i.emptyHint || i.partialHint` → `i.partialHint`（:128） | `P1-2 未填「验收标准」用独立 emptyHint`（:129） | ✅ 改指正确 |

- **expectRed 未弱化**：两条仍是**完整、具体**的断言名（非降级为宽泛子串）；M2/M3/M5/M6 的四条 expectRed 亦与 §5.2 一致、未改动。
- M4 的 repl 只改「三态归二态」的**空态分支**（`full`/`partial` 两分支原封不动），语义与「退化为二态」一致，未引入无关改动。

### 8.2 6 文件 sha256 亲算 vs 新 TARGETS + DemandNew.jsx 是否入列
我用 node 直接**从当前 `mutation.cjs` 解析出 TARGETS**（不手抄），再对磁盘文件逐个算 sha256（`outputs/_v3b_check_out.txt`）：

- `TARGETS_COUNT=6`，**`MISMATCH_COUNT=0`** → **6/6 全 MATCH**。
- `src/pages/DemandNew.jsx` **确已入列**（:94），其 sha = `135AB61F269C16D291AEC7A56F3851B409492FCCFB63C06BE181FD7CBE4CF8A5` —— 与 team-lead 所述**逐字符一致**。
- 其余 5 文件 sha 与 §5.1 基线一致（Workspace.jsx 仍是原基线 `C20F4CA…CECC1`，未被动过）。

### 8.3 每条变异 `find` 在目标文件的命中次数
用 node 解析 `MUTATIONS`（同时支持 `'`/`"` 两种引号并正确反转义 `\n` 等），逐条 `split(find).length-1`（`outputs/_v3b_find2_out.txt`）：

```
OK(1)  M1 … DemandNew.jsx        OK(1)  M2 … global.css
OK(1)  M3 … mock.js              OK(1)  M4 … DemandNew.jsx
OK(1)  M5 … ScaleChips.jsx       OK(1)  M6 … BrdAssistantCard.jsx
count==1: 6/6  bad=0
```

**结论：6/6 各恰好 1 次命中**（无 0 命中、无 >1 命中的不确定替换）。
> 过程诚实说明：我第一版解析脚本因未正确反转义 `\n`（M2 误报 0）、第二版因只认单引号（M3/M4/M6 误报 0）各出一版误报；第三版同时支持两种引号并反转义后得 **6/6**。误报是我解析器缺陷，非源码问题——已在 `_v3b_check_out.txt`/`_v3b_find_out.txt` 保留痕迹。

### 8.4 核验 `outputs/_mutation-run.txt`
读该日志（`_mutation-run.txt`）：
- **基线洁净**：`合计 152 项断言，通过 152，失败 0`。
- **6 条全部「按预期变红」**，且每条都**恰好 1 条断言红**：`通过 151，失败 1`（即 152/151/1）——不是「红一片」，而是精准命中 expectRed。
- **收尾**：`还原后：合计 152 项断言，通过 152，失败 0`；`变异 6 个，自证通过 6，未通过 0`；`✅ 收尾校验：全部目标文件 sha256 = 基线，工作树洁净`；wrapper `status=0`。
- 时间戳佐证（`_v3b_mtimes.txt`）：`DemandNew.jsx` mtime（00:02:38）落在 `mutation.cjs` 改动（23:58:16）之后、日志（00:04:58）之前 —— 与「变异写入→还原」会刷新该文件 mtime 的行为一致。
> 说明：日志为施工方产出，我**不将其作为唯一证据**；下述 8.5/8.6 是我为它做的独立旁证。

### 8.5 产品源码零改动 + lock/backup 自清（独立核验）
- 6 个被变异文件 sha256 **全部等于各自基线**（§8.2，MISMATCH=0）→ **零漂移、源码已精确归位**。
- `portal/tests/.mutation.lock` → **不存在**（False）；`portal/tests/.mutation-backup/` → **不存在**（False）；tests 目录内无残留 `.bak`（`_v3b_residue.txt`）→ **收尾自清成功**。

### 8.6 ★ 反向检验：M1 是否**真能**让「P0-1 右栏容器无内联 display」变红？（因果链）
**结论：成立，且我已独立复现因果链（不靠日志）。** 证据（`_v3b_causal2_out.txt`，用 portal 自带的 React 18.3.1 + jsdom 实跑）：

1. **断言读什么**（`smoke.cjs:1008-1013`）：
   ```js
   const inlineStyle = side ? side.getAttribute('style') || '' : '';
   if (side && !/display\s*:/.test(inlineStyle)) { ok('P0-1 右栏容器无内联 display…'); }
   else { fail('P0-1 右栏容器无内联 display', `inline="${inlineStyle}"`); }
   ```
   —— 它读的是 `side`（`.dp-demand-side` 元素）的**内联 `style` 属性字符串**，用 `/display\s*:/` 判是否含内联 display。
2. **M1 注入的样式经 React 真实序列化结果**：
   ```
   React serialized (M1 repl)  -> <div class="dp-demand-side" style="display:flex;flex-direction:column;gap:16px"></div>
   ```
3. **把 React 输出喂回同一断言谓词**：
   ```
   Predicate on M1 output      -> {"branch":"fail(红)","inlineStyle":"display:flex;flex-direction:column;gap:16px"}
   Predicate on pristine       -> {"branch":"ok(绿)","inlineStyle":""}
   ```
   —— 原始态（无内联）→ 绿；M1 注入态 → 红。**变异注入的内联 display 确实会触发该断言变红**，因果链闭环。
4. 另在纯 jsdom 手工构造态复现（`_v3b_causal_out.txt`）：`CaseA(no inline)→ok(绿)`；`CaseB(style="display: flex; …")→fail(红)`，结论一致。
   —— 因此「M1 是一条**会咬人**的有效变异守卫」，不是空转。（M4 同理：M4 让空态落到 `partialHint`，会命中 `smoke.cjs:1298-1307` 的 `hasPartialD4 && !hasEmptyD4` 判据 → 红。）

### 8.7 本次定向复验更新后的风险清单
- 原 §6 第 1、2 条（M1/M4 失效、mutation 全量未亲跑）——**已消除**：M1/M4 已改指并 6/6 命中；全量日志 6/6 按预期变红、收尾归位，且我以 8.5/8.6 独立旁证。
- **仍存的残余（非阻断）**：
  1. §6 第 3 条**不变**：`scroll-margin-top` / `:focus-visible` / `.dp-demand-side{display:flex}` / `.dp-shell` 居中等 4 条 CSS 规则文本门，其**真实渲染效果未被独立断言**（居中已由 shots 覆盖；其余为 P2 级规则存在性检查）。
  2. §6 第 5 条**不变**：P1-3/P1-4 等数据层断言依赖打包 `MOCK`，未经第三方数据源交叉验证（设计取舍）。
  3. 我**未亲跑**全量 `mutation.cjs`（遵守「不改任何文件」约束，且该脚本会写 src/ 并重构建）；8.4 的日志以 8.2/8.3/8.5/8.6 四条独立证据旁证，但**「6 条各自在真机上完整跑通」这一点，其直接证据仍是施工方日志**——我已把可独立验证的部分（sha、find 命中、因果链、残留自清）全部亲自核到，无法独立复现的仅「mutation.cjs 自身执行流程」一环。

### 8.8 更新后的一句话裁定

> **支持采信。**（相比 §7 由「部分支持/不足以采信」**上调**）
>
> 修复点经我独立核验全部成立：M1/M4 的 `file`/`find`/`repl`/`expectRed` 四条字段均正确改指且**未弱化**；`DemandNew.jsx` 已入 TARGETS 且 6 个文件 sha256 **6/6 全 MATCH**；6 条变异 `find` **6/6 各恰好命中 1 次**；全量日志显示 **6/6 按预期变红、每条恰好 1 条断言红（152/151/1）、收尾 sha 归位且工作树洁净**；`lock`/`backup` 已自清、产品源码零漂移。**核心目的达成**：M1 的因果链我已用 React 18.3.1 实跑复现——注入的内联 `display` 确会让 `P0-1 右栏容器无内联 display` 变红，该守卫**真会咬人**，空转风险消除。
>
> 唯一保留说明：全量 mutation 的**执行流程本身**仍以施工方日志为直接证据（我未亲跑以求零改动），但其可独立验证的全部外围（sha/find/因果/残留）我已亲自核到，未见任何矛盾。故：**v0.3「测试已验证合并方案满足两大任务需求」的结论，当前证据支持采信**；上轮 §6 的 P0 级风险（M1/M4 失效）已闭环关闭，仅余 P2 级「4 条 CSS 文本门未验渲染效果」等非阻断项。
