# 双向需求覆盖验收矩阵（合并交付 v0.3+v0.4）

> 审查角色：质量审查官 严过审（critique-reviewer） · 任务 #19
> 审查对象：合并后的单一交付（不再切 v0.3/v0.4）
> 生成时间：2026-09-17
> 判定纪律：**所有数字由本审查官独立复算**；未找到证据的项一律写「未验证」，不因「代码里像是有」就判满足。
> **本报告不改任何产品代码**（仅新增 `outputs/` 下的审查产物）。

---

## 0. 权威基线（本审查官亲跑，非采信自述）

| 证据 | 命令 | 结果 |
|---|---|---|
| 构建 | `vite build` | exit 0 |
| 冒烟（jsdom，产品 bundle 内联 CSS 真渲染） | `node portal/tests/smoke.cjs` | **合计 152 项断言，通过 152，失败 0，exit 0** |
| 实测几何（Headless Chrome CDP） | `node portal/tests/shots.cjs` | exit 0 |

> ⚠️ 更正：派单信息里写「smoke 142 条」。**实测为 152 条**——B 线空态/标签反查相关断言在 142 之后又追加了 10 条。本报告一律以 **152** 为准。

P0-1 白屏回归（合并前主门）：
`PASS  P0-1 填期望完成时间→提交→一级页列表可见该行（零 React 错误）   [rows=7 hasNew=true date=2026-09-20 newErr=0]`
`PASS  P0-1 数据层对照：expectAt=字符串时 DemandList 渲染 1 行且零报错   [rows=1]`
修复落盘位置：`portal/src/pages/DemandNew.jsx:357`（写行数据时 `.format('YYYY-MM-DD')`），`:566` onChange 仍存 dayjs 对象（回填需要，正确）。

---

## 1. A 组 · 用户原始 7 条需求（硬验收依据）

判定口径：**满足** = 有代码/断言级证据且覆盖该需求语义；**部分满足** = 主体达成但有明确缺口；**未满足** = 无证据或证据不支持。

| # | 用户需求（原文语义） | 判定 | 可核验证据（文件:行 / 断言名） | 缺口 |
|---|---|---|---|---|
| A1 | 工作台只保留工具导航职能 | **满足** | `pages/Workspace.jsx:292` 默认导出的 `Workspace` 仅渲染工具分组；旧 `DemandView` 死代码已删（`Workspace.jsx:5-6` 仅存注释）；smoke `路由 #/workspace → 工作台 [6 项特征文案全部命中]`（工具分组/申请权限/Grafana/门店设备管理后台 等） | 无 |
| A2 | 组织速查、业务需求提级为顶部导航一级栏目 | **满足**（导航语义） | `router.js:13` `{key:'org',path:'#/org',label:'组织速查'}`、`:14` `{key:'demand',path:'#/demand',label:'业务需求'}`；`NAV_OF:25/34/35/36` 映射；smoke `PASS 一级导航 7 项（无侧边栏）`、`路由 #/demand → 业务需求（一级栏目）`、`#/org` 块（smoke:1511 成员行可点、:1539 高亮=组织速查） | 见 §3「无法验证」：`#/org`/`#/demand` **无真实几何覆盖**（响应式是否正常全靠规则级） |
| A3 | agent for digital 从顶部移除 → 右下角悬浮 doodle | **满足** | `components/TopBar.jsx:109` 右侧仅剩搜索 pill + 通知（Agent/反馈按钮已移除）；`components/FloatAgent.jsx` 52px 悬浮按钮（brand-blue 边框/图标，aria-label/expanded/haspopup/controls）；`App.jsx:270-290` FloatAgent 挂载 | 部分覆盖：`shots.cjs:416-421` 有「视口内 + 不与顶栏相交」真实几何断言，但仅对**量到 .dp-float-agent 的截图**生效；`#/demand/new` 按 spec 刻意卸载 doodle（shots.cjs:415 注释） |
| A4 | 站点反馈融合进 agent | **满足** | `components/AgentPanel.jsx`：`replyFor` 先匹配 `agentFeedbacksIntent.match` → `{action:'feedback'}`；`FeedbackBubble`（内联 type Select `getContainer={false}` + TextArea）；显式「提个反馈」chip（`AgentPanel.jsx:332`，**不依赖关键词**）；smoke 反馈相关断言通过 | 无（反馈为面板内联动，非独立入口 → 与「融合」语义一致） |
| A5 | 需求提交页展示当前业务需求列表 | **满足**（语义已迁移） | 决策：公开列表已从二级页**移出**至一级页 `#/demand`（`global.css:556` 注释、`DemandNew` 无 recent 块）。当前业务需求列表由 `pages/DemandList.jsx`（`#/demand`）承载，smoke `#/demand ... 7 项特征文案全部命中` + `P0-1 提交后列表可见该行` | ⚠️ **语义偏移**：用户原话是「需求**提交页**」；实现把列表放到了**一级列表页**，二级表单页（`#/demand/new`）**不再展示列表**。若按字面需求验收应为「部分满足」；按合并后的合理信息架构则为满足。**需用户确认是否接受此偏移** |
| A6 | 需求页顶部用「状态楼层」展示各状态节点数量、异常告警待跟进事项及责任人 | **满足** | `pages/DemandList.jsx` `buildFloor`(`:126-154`) 生成 5 格（待处理/进行中/已完成/异常告警/本月新增）；`isAlert` R1-R4(`:76-86`)、`BLOCK_WORDS` 含「确认库范围」(`:73`)、`floorOwnerText`(`:112`)；smoke `状态楼层 5 格`、`「新增需求」入口显著`、`楼层 · 零语义色像素（computed style 实测）`、`P1-1 首页计数===需求页楼层`。**独立复算**：待处理1/进行中2/已完成3/异常告警1/本月新增4 | 异常告警责任人=顾一鸣（REQ-2026-0921，R3 命中「确认库范围」），与复算一致 ✅ |
| A7 | 新增需求入口显著 → 二级页面（表单 + 嵌入表单控件的 agent） | **满足** | 一级页「新增需求」页头主按钮 + 列表上方整行（smoke `「新增需求」入口显著（页头主按钮 + 列表上方整行）`）；首页入口点击 → `#/demand/new`（smoke:745）；二级页 `.dp-g-spec` 栅格（左表单+右引导，smoke:955）；`DemandNew.jsx` FieldAgent 挂 6 个字段（title/current/expected/scale/acceptance/systems） | 第 6 个字段「期望完成时间」无 field agent——属设计取舍，非需求缺口 |

**A 组小结：满足 6 · 部分满足 1（A5 语义偏移）· 未满足 0。**

---

## 2. B 组 · 第二条工作线（标签体系 / 个人主页 / 标签反查 / 空态）

| # | 需求 | 判定 | 可核验证据 | 缺口 |
|---|---|---|---|---|
| B1 | 标签体系（词表 + 分组 + 状态） | **满足** | `data/mock.js:807-923` TAG_DICT **72** 词；`DOMAIN_GROUPS` 5 组(`:932-938`)、`CAP_GROUPS` 4 组(`:940`)。**独立复算**：active 69 = domain 45 + capability 24；deprecated 2；merged 1 | 无（结构完整） |
| B2 | 个人主页（PersonProfile） | **满足**（含已知 UI 计数坑） | `pages/PersonProfile.jsx`；缺成员时 `PageEmpty`(`:113`)。smoke `#/workspace/people/min.zhou` 导航高亮=组织速查(`:1539`) | 跨线已知坑（critique-reviewer-2 提示）：同一标签在页头 expanded 与矩阵 compact 各出现一次 → **页面文案计数需去重**，非缺陷但影响验收计数 |
| B3 | 标签反查页（TagBrowse） | **满足**（1 组空组） | `pages/TagBrowse.jsx`：`PEOPLE_BY_TAG` 本地派生(`:26-36`)、`GROUP_OF`(`:40-44`)、`isEmptyGroup`(`:80-88`)、`emptyCopy`(`:90-112` 导出纯函数)；smoke 标签反查块(`:1637-1730`)。**独立复算**：PEOPLE_BY_TAG 覆盖 50/72 词；领域轴覆盖 AI0/业务系统5/数据3/平台2/组织3 人 | **「AI 与智能」域 = 0 人**（`isEmptyGroup=true`，6 个 active 标签全员为空）。空态文案已由 `emptyCopy` 设计（空组诊断 + 交集空行动指引），但**这是内容数据缺口**，非渲染缺陷 |
| B4 | 空态设计（空组 / 交集空 / 缺成员） | **部分满足** | `emptyCopy(selected)` 纯函数（TagBrowse.jsx:90-112）+ smoke 纯函数探针(`:444-463, 1868-1929`)；`PageEmpty`（PersonProfile:113）。B 线 smoke 断言多为 **纯函数探针 + DOM 文案断言**，**未走完整 E2E 交互** | 1) 缺「空组→有内容」的交互级 E2E（仅纯函数级）；2) AI 域空组是数据层空，非 UI 空态 |

**B 组小结：满足 3 · 部分满足 1（B4）· 未满足 0。**
> 说明：B3 判定「满足」是就「页面功能存在且空态有设计」而言；**「AI 与智能」0 人**记为内容数据缺口，归入 §4 待办。

---

## 3. ⚠️「规则级证明冒充实测」— 重点风险（team-lead 特别点名）

**这是本次验收最需要上报的方法性问题，不是代码 bug，而是「测试可信度」问题。**

### 3.1 真实几何通道（shots.cjs）**完全没有覆盖两个新一级栏目**

`portal/tests/shots.cjs` 是**唯一**能拿到真实 `getBoundingClientRect` 的通道（jsdom 几何恒为 0）。其路由清单：

- 命名截图 SHOTS（`:120-153`）：home/news/ops/notfound/knowledge/deeplink/workspace/person/tags —— **无 #/org、无 #/demand、无 #/demand/new**
- 路由抽点 SCAN_ROUTES（`:160-168`）：home/news/ops/knowledge/workspace/people/tags —— **同样无 #/org、无 #/demand**
- 连续扫描 sweep：仅 `#/home`

**结论**：需求 A2/A5/A6/A7 的**响应式正确性**（窄屏是否溢出、状态楼层是否正常换行、二级页表单是否重排）**没有任何真实浏览器几何证据**，目前**只有 jsdom 规则级断言**。→ 见 §4。

### 3.2 ≤900px 需求表单卡片顺序 = 「CSS 文本正则」冒充「视觉顺序」

smoke 断言（`:1037-1047`）：

```
const mediaBlock = cssText.match(/@media\s*\(max-width:\s*900px\)\s*\{\s*\.dp-demand-side\{display:contents\}[\s\S]*?\.dp-demand-form-col\{order:3\}\s*\}/)
... ok('P0-1 ≤900px 媒体块含 display:contents + 三张卡 order 1..3')
```

该断言**只验证样式表文本里存在 `order:1/2/3` 三条规则**，并**没有**验证：
1. 在 ≤900px 下这三条 order 真的生效（jsdom **不算媒体查询**，`getComputedStyle` 拿不到媒体块内规则）；
2. 视觉顺序真的变成「承诺卡→BRD 助手→表单」；
3. `.dp-demand-side{display:contents}` 真的让父栅格把卡片当独立子项（这正是 `global.css:578-584` 注释自陈的关键前提）。

`global.css:563-576` 确实写了 `order:1/2/3`，规则本身正确；但「**规则存在**」被当作「**顺序正确**」发布，属典型的**规则级证明冒充实测**。
→ 见 §4（未验证）。

> 正面例子（对照组）：同文件 `:850-878` 的「楼层零语义色」断言用的是 `win.getComputedStyle` **实测渲染值**（且锁 `.dp-floor` 子树），是**真证据**。两者形成鲜明对比：同一套测试里既有实测门，也有文本门——验收时必须逐条区分，不能一律采信「smoke 全绿」。

---

## 4. 「我无法验证的项」清单（附原因）

> 这些项**不是「失败」**，而是**现有证据不足以判定**。凡未在此列的 A/B 判定，均有 §1/§2 所列文件:行 或断言名支撑。

| 编号 | 无法验证的命题 | 原因（为什么现有证据不够） |
|---|---|---|
| U1 | `#/org`（组织速查一级栏目）在真实浏览器的**响应式布局正确**（不溢出、不断裂） | shots.cjs 的 SHOTS / SCAN_ROUTES **均不含 #/org**；jsdom 无媒体查询 → 只有规则级 |
| U2 | `#/demand`（业务需求一级栏目，含状态楼层）真实几何：楼层 5 格在窄屏是否合理换行、`.dp-floor-cell` 宽度 | 同上，shots.cjs 无 #/demand；jsdom `offsetWidth=0`，换行行为不可测 |
| U3 | `#/demand/new` 二级页在 ≤900px 的**视觉顺序** = 承诺卡→BRD 助手→表单 | §3.2：仅有 CSS 文本正则断言；jsdom 不算媒体查询；shots.cjs 刻意不扫该路由（shots.cjs:415） |
| U4 | `#/demand/new` 上悬浮 doodle「按 spec 刻意卸载」是否真的没出现 | 该页不在 shots.cjs 任何清单内 → 「卸载」是 spec 声明 + 代码 gate（App.jsx:270-290 `!isDemandNew`），**无渲染级断言**证明面板/按钮均未渲染 |
| U5 | 顶栏 7 项在 1164–1311 等中间档的**真实像素**行为 | shots.cjs 断言覆盖的是 home 等老路由；**含 7 项新导航的顶栏高/不溢出**在 #/org、#/demand 上无真实测量（老路由顶栏同为 7 项，可间接佐证，**但不能直接外推**） |
| U6 | 标签反查「空组→有内容」的**交互级** E2E（点标签后列表真的从空变有） | smoke 的相关断言是**纯函数探针**（emptyCopy 直接调用）+ DOM 文案，**未走点击→重渲染**全链路 |
| U7 | `#/demand/new` 内嵌 agent 面板在窄屏的真实几何（是否遮挡表单） | 同 U4，该路由无真实几何覆盖 |
| U8 | 合并交付对**真实双击 file:// 打开**的最终自检 | 本审查官可复现的通道是 jsdom + CDP(localhost file serve)；**「用户双击 dist/index.html」** 属最终人工验收，测试通道无法等价断言（详见既有 `_audit-v03.md`） |

**建议**：把 `#/org`、`#/demand`、`#/demand/new` 三条路由补进 `shots.cjs` 的 `SCAN_ROUTES`（至少 375/768/900/1280 四档），即可把 U1–U5、U7 从「未验证」升级为「已实测几何」。这是**测试基建缺口**，非产品缺陷。

---

## 5. 汇总计数（回应派单要求）

| 分组 | 满足 | 部分满足 | 未满足 | 合计 |
|---|---|---|---|---|
| A 组（用户原始 7 条） | 6 | 1（A5 语义偏移） | 0 | 7 |
| B 组（第二条线） | 3 | 1（B4 空态） | 0 | 4 |
| **合计** | **9** | **2** | **0** | **11** |

**无法验证项：8 条（U1–U8）**，其中 U1–U5、U7 属同一根因——**shots.cjs 未覆盖新增路由**。

---

## 6. 最严重的缺口（Top 1）

**「新一级栏目（#/org、#/demand）与二级页（#/demand/new）零真实几何覆盖 + ≤900px 表单顺序用 CSS 文本正则冒充实测」。**

- 影响面：A2（一级栏目）、A5（列表）、A6（状态楼层）、A7（新增入口/二级页）**四条**用户需求的「响应式正确性」全部落在这条。
- 为何严重：用户这次的核心诉求正是「**通过测试确保**合并后方案满足需求」；而当前「smoke 152 全绿」里有若干条是**文本门**（验证 CSS 源码含某字符串），**不等于**渲染正确。若仅凭「全绿」发布，等于把「规则写好」当成了「页面正确」。
- 风险等级：**P1（测试可信度）/ 对产品本身 P2**——代码看起来是对的（`global.css:563-576` 规则齐备、`router.js` 导航齐备），但**证明链断裂**：没有任何一步在真实引擎里量过新路由。
- 修复方向（**属于测试基建，非产品代码**）：`shots.cjs` `SCAN_ROUTES` 补 `#/org`、`#/demand`、`#/demand/new`，宽度档 375/768/900/1280；并把 ≤900px 表单顺序从「文本正则」升级为「在 900 档截图里按 `getBoundingClientRect().top` 比序」。

## 7. 次级缺口

- **P1 · A5 语义偏移**：用户说「需求**提交页**展示列表」，实现把列表放到**一级列表页**、二级表单页不再展示。需用户确认接受。
- **P1 · B3/B4 内容数据缺口**：「AI 与智能」域 0 人（6 个 active 标签全空），空态已设计但内容空——demo 可接受，但若以「标签体系可用」验收需补数据。
- **P2 · A7 日期字段无 field agent**：6 个字段中「期望完成时间」无内嵌 agent，属设计取舍，记录备查。

---

## 附：本审查官复算数字与既有报告差异

| 数字 | 既有报告值 | 本审查官复算 | 说明 |
|---|---|---|---|
| smoke 断言总数 | 142（派单信息） | **152** | 142 之后追加了 10 条 B 线断言 |
| 状态楼层「待处理」 | spec 表曾写 3 | **1** | spec 错误，源数据 `demandHistory` pending=1 |
| 状态楼层「进行中」 | spec 表曾写 2 | **2** | 一致 |
| 异常告警 | — | **1（REQ-2026-0921 顾一鸣，R3）** | 命中「确认库范围」阻断词 |
| TAG_DICT | — | **72（69 active / 2 deprecated / 1 merged）** | 独立复算 |
| AI 与智能域人数 | — | **0（isEmptyGroup=true）** | 与 critique-reviewer-2 结论一致 |
| PEOPLE_BY_TAG 覆盖 | — | **50/72 词** | 独立复算 |

> 纪律声明：以上所有数字均由本审查官运行 `_acc-recompute.cjs` / `_acc-floor.cjs` / `smoke.cjs` 亲自得出，**未采信任何既有审计报告的结论**（含 p4 已知错误）。
