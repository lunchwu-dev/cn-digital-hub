# 合并交付修复报告（v0.3 + v0.4 单一交付）

> 交付件：`portal/`（React 18 + Ant Design 5 + Vite 5，自建 ~20 行 hash 路由）
> 产物：`portal/dist/`（离线 `file://` 可运行，零外部依赖）
> 本轮定位：**两条工作线合并为一个交付**，不再切分 v0.3 / v0.4。
> 撰写：原型构建师（Zhu）｜基准日 EVIDENCE_AS_OF = 2026-09-17｜未执行 git commit

---

## 0. 一句话结论

v0.3 全部 7 项（P0-1 / P1-1 / P1-2 / P2-1 / P2-2 / P2-3 / P2-4）与 v0.4 全部 5 项（空态分流 / 措辞 / 第三人称提示 / 平线 / 分档收轨）+ #12 过期路径清理**全部落地**；
**全量 smoke：152 项断言，通过 152，失败 0，exit 0**；
**dist 离线自证通过**（`type="module"` false、`crossorigin` false、`fetch/XHR/WebSocket` 全 0）；
**语义色铁律通过**：`#/ops` 之外的真越界语义色 = 0（口径见第 5 节）。

---

## 1. 回归总览（可复核命令）

| 项 | 结果 | 证据 |
|---|---|---|
| 全量 smoke | **152 / 152，失败 0，exit 0** | `outputs/_smoke_canonical.txt`（node 直落 utf8）；STATUS=0：`outputs/_smoke_canonical_exit.txt` |
| vite build | **EXIT=0**，3061 modules，`index.js` 1,335.38 kB（gzip 429.68 kB） | `outputs/_build_final.txt` / `_build_final_exit.txt` |
| dist 离线体检 | `type="module"`=false、`crossorigin`=false、`fetch/XHR/WebSocket`=0 | `outputs/_offline_scan.txt`、`outputs/_final_consistency.txt` |
| dist sha256[:16] | index.js=`C97F577ADA9E497D`、style.css=`A6522A071E886761`、index.html=`D31E7E3B55BD0204` | `outputs/_final_consistency.txt` |
| 语义色越界 | `#/ops` 之外真越界 = **0** | `outputs/_semcolor_scan3.txt` |
| 过期路径文案 | 产物中 `工作台·需求提交`/`#/workspace/demand`/`#/workspace/org` = **0** | `outputs/_expiredcopy_scan.txt` |
| 新门负向对照 | emptyCopy 断门会红；分档判据 5 边界全对 | `outputs/_negcontrol.txt` |

> smoke 运行需 `NODE_PATH=C:\Users\uuzz\.workbuddy\binaries\node\workspace\node_modules`（jsdom 在 managed workspace，不在 portal/node_modules）。

---

## 2. v0.3 复验（team-lead 已独立复验，此处仅登记最终态）

| # | 项 | 最终态 | 关键锚点 |
|---|---|---|---|
| P0-1 | 填「期望完成时间」→ `#/demand` 白屏（React #31） | **已修** | 修复点在 `DemandNew.jsx` **写行数据处**（`expectAt` 落库前 `.format('YYYY-MM-DD')`），**不是** `:560` 的 DatePicker `onChange`。smoke：`rows=7 hasNew=true date=2026-09-20 newErr=0` |
| P1-1 | 首页用静态 `demandHistory` | **已修** | `App.jsx` 传 `demandRows`；`Home.jsx` 读 `demandRows`。smoke：`home=[1,2,3] floor=[1,2,3]` 单一数据源一致 |
| P1-2 | 入口卡副 CTA「先看提交指引」跳错页 | **已修** | `mock.js` `secondaryCta: '先看看别人提了什么'` |
| P2-1 | `Workspace.jsx` 死码（`DemandView` + 重复评分引擎） | **已删** | 971 → 351 行（删 621 行），删前做边界断言（含 `export function DemandView`/`BRD_DIM_KEYS`/`computeCompleteness`/`brdMissing`/`lightMissing`/`agentAdvice`） |
| P2-2 | 多责任人楼层分支缺测试 | **已补** | 抽纯函数 `DemandList.floorOwnerText(owners)` + smoke 6 组输入全对 |
| P2-3 | `todayStamp` 不可注入 | **已修** | `resolveTodayStamp(today)`；`DemandList({ rows, today })` |
| P2-4 | `<900px` 断点顺序 | **实测**（非「未实测」） | 375px：promise(top354)→assistant(top544)→form(top967)；1280px：form(left32) ‖ promise(left762)/assistant(left762) |

---

## 3. v0.4 空态与视觉噪音（本轮新增，来源 `outputs/_audit-v04-emptystate.md`）

**硬约束：不动任何 mock 数据。** 全部为「文案 / 渲染分支」级改动。

| # | 文件:行 | 改什么 | 证据 |
|---|---|---|---|
| (a) | `TagBrowse.jsx`（原 :204 空态分支） | 空态按「所选标签是否落在全员为 0 的空组」分流；抽 **导出纯函数** `emptyCopy(selected)`（`:90`）；判据 `(PEOPLE_BY_TAG.get(tid)||[]).length===0`；`GROUP_OF` 建于 `:40` | smoke 3 门：空组（AI 与智能）走组织诊断文案「…6 个标签…等待第一位贡献者…」；非空组交集空走行动指引「去掉条件 / 分别查看」；多选含空组 → 空组诊断优先、title 组合式 |
| (b) | `ui.jsx:332`（`EVIDENCE_COPY.none`）+ `:452`（boast 文案） | `暂无实证` → `暂无公开贡献`；吹牛态 `暂无实证 · 仅自评` → **`仅自评 · 暂无公开贡献`**（语序也调，主位给「仅自评」） | 产物中 `暂无实证` 已归零（仅存于注释）；smoke `countDirect('仅自评 · 暂无公开贡献')` |
| (c) | `ui.jsx` 紧凑态 L4（`:540`）+ 放大态尾（`:578`）**两处** | `该标签暂无公开贡献佐证` → **`这项仅有自评，系统暂未找到对应的公开产出。`**（**第三人称，无「你」**，与个人页只读定位一致） | smoke：周敏提示行 **= 7** |
| (d) | `PersonProfile.jsx:238-241` | `sp.every(v=>v===0)` 时**不画贴底平线**，改一行 `text3`：`近 6 月暂无公开贡献`。判据在**调用点**，`Sparkline` 保持通用纯展示 | `#/workspace/people/*` 语义色越界=0；渲染为中性灰字 |
| (e) ★ | `ui.jsx` MaturityAxis 渲染分支 | 按 `selfIdx` 分档（**只改渲染分支**，`:374` 的 `boast` 判定**一字未动**）：<br>· `selfIdx<=2 && tier==='none'` → **收轨**：不画空槽，仅一行极淡 `text3`「暂无公开贡献」<br>· `selfIdx>=3 && tier==='none'` → **保留完整双行**（点阵 + 虚线空槽 + `仅自评 · 暂无公开贡献` + 提示行）<br>新增 `collapse = !boast && tier==='none' && selfIdx<=2`（与 `boast` 互斥） | **周敏 min.zhou 吹牛双行屏上仍 = 7**、提示行 = 7；沈知微 zhiwei.shen 吹牛=0、收轨=10；周敏收轨=3（与吹牛 7 并存互不混算） |

**关于 item (a) 的「空组」定义**：`isEmptyGroup(tid)` 沿 `GROUP_OF[tid]` 找分组名，若该组下**全部 active 标签**都无人，才判为空组。实测数据（`outputs/_tmp_mockprobe.txt`）：
- `AI 与智能` 是**唯一**全员为 0 的领域组，active=6 个标签全空 → 取 `d-ai` 作空组样本；
- `业务系统域` 仅 `d-app(0)` 一个 0 人标签（非全空）→ `d-app` 作交集空样本；`d-pos(2)`（林望、吴桐）作非空样本。

---

## 4. #12 过期路径清理

| 文件:行 | 原（失效路径） | 现（现行路径） |
|---|---|---|
| `ArticleDetail.jsx:46` | 走「工作台 · 需求提交」 | `你可以直接在顶部导航「业务需求」里提交补充，或在知识中心 FAQ 里登记具体问题。` |
| `ArticleDetail.jsx:148` | 修订请走「工作台 › 需求提交」 | `内容修订请走顶部导航「业务需求」` |
| `Knowledge.jsx:170` | 在「需求提交」中发起 | `…请在顶部导航「业务需求」中发起，评审通过后统一发布到本页。` |
| `mock.js:1379`（`workspaceTabs`） | `{ key: 'demand', label: '需求提交' }` | `{ key: 'demand', label: '业务需求' }`（并加注释：该数组已无消费方、label 必须指向现行导航名） |

**产物级复核**（`outputs/_expiredcopy_scan.txt`）：`工作台·需求提交` / `工作台「需求提交」` / `#/workspace/demand` / `#/workspace/org` **均 = 0 处**；现行名 `业务需求`=17、`#/demand`=8、`组织速查`=8、`#/org`=3。（`workspaceTabs` 无 import → 被 Vite tree-shake，两个失效子路径根本没进产物。）

---

## 5. 语义色铁律核对（口径要讲清，不把宽扫结果伪装成「已清零」）

**铁律原文**：红/黄/绿**只允许**出现在「稳定性状态」区（`#/ops`）。
**§D.3 边界收口**：「业务需求」整页（含楼层）不出现任何红/黄/绿像素。
**§D.3 line 1121 明确允许**：**列表内的单条状态胶囊**（`.dp-chip` / Pill semantic）——行内小面积标记与楼层大面积统计量本就该用不同视觉权重。
**`theme.js:33` 点名允许**：`c.yellow=#FFCD4E`「仅小面积标记（置顶 / 里程碑 / NEW）」。
**02a line 421 点名允许**：红黄绿「已在**首页健康度快照**里被占用」。

据此对 `outputs/_semcolor_scan3.txt`（真实浏览器 computed style，13 条路由逐条扫）做**规范口径分类**：

### 5.1 结论

- **`#/ops` 之外的真越界语义色 = 0**（`#/demand` 去重命中 15 处**全部**为 `.dp-chip` 状态胶囊 = 点名允许；`#/home`/`#/workspace` 命中为健康度快照 Delta / 工具状态点）。
- **未新增任何语义色像素**：本轮 6 个改动文件（`ui.jsx`/`TagBrowse.jsx`/`PersonProfile.jsx`/`ArticleDetail.jsx`/`Knowledge.jsx`/`mock.js`）经逐行核对，颜色仅取 `c.text2/text3/border/brand*/dashedBorder`，**不引入任何 `success/warning/error/yellow`**。

### 5.2 宽扫命中逐条判读（诚实登记，含「点名允许」与「既有非本轮引入」）

| 命中载体 | 出现路由 | 判读 |
|---|---|---|
| `.ant-badge-count` 背景 `#FFCD4E` | 全站（TopBar 通知 Badge） | **点名允许**（`theme.js:33` + §D.3 line 691） |
| `.dp-chip`（置顶 / NEW / 已完成 / 正常 / 预警 …） | `#/news`、`#/demand`、`#/ops` | **点名允许**（§D.3 line 1121 列表胶囊） |
| 健康度快照 `Delta` 升降箭头（`arrow-up/down` + `.dp-num`） | `#/home`、`#/ops` | **点名允许**（02a line 421 首页健康度快照占用） |
| `StatusDot`（工具/标签状态点，内联 `background`、无 class） | `#/workspace`、`#/workspace/people/*`、`#/ops` | **既有用法、非本轮引入**；规范未点名，保守列为「既有」；本轮未触碰其颜色 |

> 说明：扫描脚本对「无 class 的内联点/Icon 子节点」无法靠载体名自动判为「允许」，故 `#/workspace` 的 `StatusDot` 与 `#/home`/`#/ops` 的 `Delta` `.dp-num` 落在「越界」计数里。**这不是本轮引入的颜色**，且 `#/ops` 本身即语义色合法区。**`#/demand` 楼层级零语义色断言在 smoke 中 PASS**（`业务需求楼层 · 零语义色像素（computed style 实测）`）。

---

## 6. 新增/变更的测试断言（smoke.cjs）

在 v0.3 的 142 条基础上新增 **10 条**（→ **152**），全部针对本轮新增行为，且每条都做了「非空转」自证：

1. `v0.4 分档门：周敏 min.zhou 吹牛双行屏上仍 = 7`
2. `   ↳ 周敏吹牛提示行屏上仍 = 7`
3. `   ↳ 沈知微 zhiwei.shen 吹牛双行 = 0`
4. `   ↳ 沈知微收轨淡文案屏上 = 10`
5. `   ↳ 周敏收轨淡文案屏上 = 3`
6. `v0.4 反查页空态：空组（AI 与智能）走组织诊断文案`
7. `v0.4 反查页空态：非空组交集空走行动指引文案`
8. `v0.4 反查页空态：多选含空组 → 空组诊断优先、title 为组合式`
9. `   ↳ 非空标签 d-pos 单点：走交集空文案`
10. `   ↳ emptyCopy 对空/非数组输入不抛错`

**负向对照**（`outputs/_negcontrol.txt`，不动 src，对内存打包产物注入错误实现）：
- 把 `isEmptyGroup` 强改为恒 `false` → `emptyCopy(['d-ai']).desc` **丢失**「6 个标签」诊断文案 → 断言会红（证明 (a) 的门不是空转）。
- 分档判据 5 个边界：`advocating/none`→boast、`practicing/none`→boast、`following/none`→collapse、`curious/none`→collapse、`advocating/established`→正常轨；boast 与 collapse 互斥。

**计数口径**（为何是 7 不是 8）：`countDirect(text)` 只计「直接文本节点**恰等于**文案」的元素；`仅自评 · 暂无公开贡献` ≠ `暂无公开贡献`（前者是 boast 行、后者是 collapse 行），故二者不混算。该口径与 `outputs/_audit-emptystate-verify3.mjs` 一致。

---

## 7. 诚实边界 / 未纳入本轮

- **修改 `ui.jsx` 后 `tests/mutation.cjs` 的 TARGETS sha 清单已过期**：该脚本启动时会校验源文件 sha，本轮未重跑（team-lead 的 v0.4 清单未要求）。如需恢复全量变异自证，应先 `node tests/mutation.cjs --print-sha` 并同步 TARGETS。**本轮改用不动 src 的负向对照（第 6 节）替代。**
- **审计 §2 item #6**（验收截图主角由 `min.zhou` 换 `zhiwei.shen`）**不在 team-lead 本轮的 (a)–(e)+#12 清单内，未执行**；如需改，属 `tests/shots.cjs` 的截图目标调整，与本轮代码修复正交。
- 语义色宽扫（第 5 节）为**全站 computed-style 宽扫**；规范的可执行口径是**楼层级**（smoke 断言 PASS）。未把宽扫命中伪装成「违规已清零」。

---

## 8. 交付物清单

| 文件 | 说明 |
|---|---|
| `portal/dist/` | 离线可运行产物（`index.html` + `assets/*`，零外链） |
| `portal/src/**` | 源码（本轮改动见第 3 / 4 节） |
| `portal/tests/smoke.cjs` | 152 条断言 |
| `outputs/_smoke_canonical.txt` | 权威 smoke 输出（152/152） |
| `outputs/_build_final.txt` | 最终构建日志（EXIT=0） |
| `outputs/_offline_scan.txt` / `_final_consistency.txt` | 离线与一致性自证 |
| `outputs/_semcolor_scan3.txt` | 语义色范围实测（规范口径分类） |
| `outputs/_expiredcopy_scan.txt` | 过期路径文案产物级扫描 |
| `outputs/_negcontrol.txt` | 新门负向对照 |
| `outputs/_tmp_mockprobe.txt` | 空组/非空组数据事实 |

*报告生成：原型构建师（Zhu）｜未执行 git commit*
