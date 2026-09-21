# Digital 公告栏（Digital Bulletin）· v0.6 发布说明

> 版本：v0.6
> 日期：2026-09-21
> 上一版：v0.4.3（commit `9e5dc77`）
> 交付形态：`portal/dist/` 可直接双击 `file://` 打开；线上分享链接见发布记录
> 站点名：**Digital 公告栏**（英文 **Digital Bulletin**），原名「Decathlon Digital · 部门门户」

---

## 1. 为什么有 v0.6

用户指令（原文）：

> 这个站点应用以后统叫 digital 公告栏，英文是 digital bulletin，站点上的名称、图标之类的做一些对应调整，
> 完成后把当前版本发布成 workbuddy 应用，并送到 github 作为 0.6 版本 release

因此本次有两条线：

1. **品牌层**：改名 + 图标对应调整（本文 §2、§3）；
2. **发布层**：发布为 WorkBuddy 应用 + 推送 GitHub 并出 v0.6 release（本文 §6）。

> ⚠️ 版本史补记：`v0.5` / `v0.5.1` 两次迭代此前**只提交、未打 tag**，
> 因此 v0.6 是**第一个包含它们**的 release。§4、§5 一并列出，避免这两轮改动在版本史上凭空出现。

---

## 2. 更名的落点：一个权威来源 + 一条守卫门

站点名有两个落点，处理方式不同：

| 落点 | 位置 | 处理 |
|---|---|---|
| 顶栏字标 / 副标、页脚、AgentPanel 底部、ArticleDetail 页脚 | `src/data/mock.js` 的 `META.portalName` / `portalNameEn` | **唯一权威来源**，改一处即全站同步 |
| 浏览器标题 | `index.html` 的 `<title>` | 静态 HTML，**读不到 META**，只能手改 |
| 站点图标 | `index.html` 的 `<link rel="icon">` | 同上 |

第二、三行是本次唯一的结构性隐患：改名时极易只改一处。故**新增 smoke 门把二者钉在一起**：

- `<title>` 必须 `=== META.portalName · META.portalNameEn`
  （只改 META → 红；只改 `<title>` → 同一门也红）；
- 站点图标必须已内联进 `dist/index.html`（`rel="icon"` + `data:image/svg+xml`）。

### 具体改动

| 位置 | 改前 | 改后 |
|---|---|---|
| 顶栏字标 | `DECATHLON Digital`（硬编码） | `Digital 公告栏`（**读 META**，两段式配色按首个空格分段，不再硬编码词位置） |
| 顶栏副标 `.dp-logo-sub` | `中国 · 部门门户` | `Digital Bulletin` |
| 浏览器标题 | `Decathlon Digital · 部门门户` | `Digital 公告栏 · Digital Bulletin` |
| 欢迎引导首步 | `欢迎来到 Digital 门户` | `欢迎来到 ${META.portalName}` |
| `package.json` 描述 | `…Digital 部门内部门户…` | `…Digital 公告栏（Digital Bulletin）…` |

顶栏字标**改窄了**（约 130px → 105px），对顶栏溢出预算是正向变化。

### 刻意不改的部分（取舍）

- **作为普通名词的「门户」文案保留**：Ops 页「无法在门户内解决」、AgentPanel 的「门户 Owner」、
  News/ArticleDetail 的「门户定位为…」。它们指的是「内部门户」这个**产品类别**，不是站点品牌名；
  全部替换会把叙述文案改成不自然的说法。若需要全站统一措辞，请单独提一次。
- `META.department`（`Decathlon China · Digital 部门`）与 `META.watermark`
  （`Decathlon Digital · 内部资料 · 请勿外传`）保留 —— 它们是**部门/密级标识**，非站点名。
- mock 数据里的技能标签名「内部门户」保留（是标签，不是站点名）。

---

## 3. 图标：从「同心圆 + 准星」到「公告栏」

原 `BrandSymbol` 是同心圆 + 十字准星 + 中心点 —— 一个抽象准星，与「公告栏」**没有任何语义对应**。

新图形（同一套 1.5px 单色描边语言）：

```
圆角板面 + 顶部挂条 + 两颗图钉 + 两行公告正文
```

- 挂条把板面分成「栏头 / 正文」两段；
- 图钉压在板面上沿，是「公告栏」最有辨识度的一笔；
- `muted` 的落点随图形调整：旧图有外圆可单独淡化，新图改为对整个 `<svg>` 施加 `opacity`。

### ★ 一处「看了渲染才改出来」的修正

图钉半径初版写 `r=2`，**放大截图后发现它完全融进上边框**，30px 下根本看不出「被钉住」——
于是把 `r` 提到 `3` 并重新渲染复核（favicon 同步 2.5 → 4）。
这是本项目「只信渲染结果」纪律的一次直接产出：`svgRects=5` 之类的结构断言全绿，
但**图标到底像不像公告栏，只有眼睛能判**。

### favicon

新增站点图标，与 `BrandSymbol` 同一套图形，但**内联 data URI** 而非外链 `.svg` 文件：
交付物必须能在 `file://` 下**零外部请求**打开，多一个图标文件就多一处 404 风险。
图标尺寸下描边由 1.5 加到 3，否则 16px 渲染会糊。

---

## 4. v0.5 · 员工主页（此前未发布）

- **技能标签与个人信息糅合成一个楼层**：单张 Panel 两带（身份 / 技能标签 + 合规脚注），
  1px 实线分隔，`padding` 24/28 → 18/22；省掉约 55px 纯结构开销，标签流拿到通栏满宽。
- **标签卡轻量化**：标签高 22→20px、成熟度档位条高 6→5px、卡 `padding` 10/12→8/10、
  分组名与档位行并成一行、移除外层 `Panel`/`PanelHead`。
  实测卡高 **70.5 → 54.5px（−22.7%）**。
- **「近期工作内容」独占通栏楼层 = 未来 8 周资源占用甘特**：
  `minmax(180px,240px) + repeat(8, minmax(44px,1fr))`、`column-gap:0`、
  `min-width:512px` + 内部横向滚动；表头 8 周（周次 + 起始日 + 「本周」标记）；
  行首两行（任务名 / 状态位 + 单号 + 项目 + 交付日）；底部「总占用」行三档填色 + 居中计数数字。
- 数据层新增 `OCCUPANCY_WEEKS` / `OCCUPANCY_TIER_THRESHOLDS{mid:2,high:3}` /
  `occupancyTierOf()` / `getPersonOccupancy()`；`JIRA_ISSUES` 30 → 41 条（每条新增 `start`）。
- **零新色值**：6 个 `--dp-gantt-*` 全部是现有设计令牌的别名。

---

## 5. v0.5.1 · 返修（此前未发布）

| 级别 | 缺陷 | 处置 |
|---|---|---|
| P0 | `.dp-gantt-cell` 基底 `border-radius: 4px`，而 CSS 无任何把中间格圆角置 0 的规则 → 一条 4 周色带渲成**首尾相接的药丸**（每接头上下各凹 4px），空槽 28px 左竖线沿圆角内收出现缺口 | 基底改 `0`，圆角交回 `.is-band-start` / `.is-band-end` |
| P0（测试） | 同一处错误让几何门 `bandRadiusOk` 在基线上**恒假** → 4 条走几何门的变异「全都变红」却与注入内容无关（**空转断言**） | 修复后探针 `ok=false → true`；新增 M19（把圆角改回去）证明它是**活门**，而不是从「恒假装饰」翻成「恒真装饰」 |
| P1 | 图例漏解释任务条主色 `--dp-gantt-bar`（对白底 7.87:1，比最高档 3.99:1 **深一倍**，却是整屏面积最大的色块）→ 极易被读成「占用 = 高」 | 图例改为分「任务行 / 总占用行」两组，补第 4 个色块 |
| P1 | 整段早于窗口开始日的在办任务渲成「有任务名、8 格全空」的一行，且污染楼层头计数 | 只渲染与窗口有交集的行；**明示**排除条数（不静默丢弃，也不把 `due` 硬拉进窗口虚构占用） |
| P1（测试） | M7 变异的是已无消费者的 `getPersonWork` → **恒不变红** | 补数据层门（窗口内未完结任务守恒，用 `total` 而非被 `slice(0,5)` 截断的 `items`）+ 新增 M24 打真正的活路径 |

---

## 6. 发布

### 6.1 GitHub
- 仓库：`https://github.com/lunchwu-dev/cn-digital-hub`
- tag `v0.6` + release（见本页头部链接）
- 仓库门面（README）顺带修正：
  - 版本徽章原本指向 `github.com/lunchwu-dev/github`（**该仓库不存在**）→ 改为 `cn-digital-hub`；
  - 徽章版本 `v0.1` → `v0.6`；标题改为以「Digital 公告栏（Digital Bulletin）」开头。

### 6.2 WorkBuddy 应用 —— ⚠️ 本次未能发布

**发布未完成，原因如实说明：本次会话的工具注册表里没有 `workbuddy_sites_deploy`**，
调用直接返回：

```
Tool "workbuddy_sites_deploy" is not available in the current environment or configuration.
```

这与 2026-09-19 那次排查的结论一致（见 `.workbuddy/memory/2026-09-17.md`「门户 demo 发布公网」一节）：
该内建工具**并非每个会话都注册**。因此：

- **未产出新的公网分享链接，也没有沿用旧链接冒充已更新** —— 线上仍停留在更名前的版本；
- 发布所需的目录**已就绪并已核验与 `portal/dist` 逐字节一致**：
  `<工作区>/portal-site/`（`index.html` + `assets/`，`language: static` + `entryHtml: index.html`）。
  在一个注册了该工具的会话里，对它执行一次发布即可上线，无需再改任何文件。
- 也可以在 WorkBuddy 客户端里用「发布为应用」直接发布该目录。

> 历史链接（更名前，内容为 v0.4.3 及更早）：
> `https://digital-dept-portal.app.workbuddy.host/`（appId `wbapp_JyreszJ2KfmRaVfs76m2z5`）
> 备用同内容链接：`https://decathlon-digital-hub.app.workbuddy.host/`（appId `wbapp_kESzWqllYl3j3Ch5mSwhfH`）
> 两条链接对应同一个站点的两次发布，**建议保留主链接，另一条可下线**。

---

## 7. 验证记录

| 层 | 结果 |
|---|---|
| jsdom 冒烟 | **209 / 209 通过**（含新增的「站点名双处同源」与「图标已内联」两门） |
| 真实 Chrome 几何 + 截图 | **30 张，全部通过**（1440/1920/1280/1024/900/768/375 各档） |
| 变异自证 | **23 条全部按预期变红**，收尾 sha256 全部回到基线 |
| 品牌区人工复核 | 放大 4× 裁切顶栏，确认图标读得出「被钉住的公告板」、字标与副标正确 |

关键实测值：

- 顶栏品牌区：`logoText = "Digital 公告栏\nDigital Bulletin"`、图标渲染宽 30px、
  图形子节点 5 个、`document.title = "Digital 公告栏 · Digital Bulletin"`、favicon 存在；
- 甘特 1440：表头 9 格、周列 `118/118`（宽比 1.000）、任务列 `240px` 更宽；
- 甘特 375：栅格守 `min-width:512px`、滚动容器 `512 > 309` 真溢出、页面本体不横向溢出；
- 三档填充（陈思远 1440）：`t-low → rgb(220,224,244)`、`t-mid → rgb(169,178,230)`、
  `t-high → rgb(107,120,212)`，与格内数字、档位 class **逐格对拍**。

交付物 `portal/dist/` 为干净重建，可直接双击打开（IIFE、无 `type="module"`、零外部请求）。
