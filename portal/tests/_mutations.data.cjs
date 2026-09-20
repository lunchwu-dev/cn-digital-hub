/**
 * _mutations.data.cjs —— 变异清单（MUTATIONS）+ 基线 sha256（TARGETS）的**单一事实源**
 * ==================================================================================
 * 本模块从 tests/mutation.cjs 的内联字面量**原样抽出**，供两处消费：
 *   1. tests/mutation.cjs        —— 原 node 编排器（本机因「node 进程内 spawn 子进程 EBUSY」
 *                                   实际跑不起来，保留作参考 / 分解读入口）。
 *   2. tests/mutation.sh         —— 新的 Bash 编排器（把 spawn 编排层从 node 内搬到 Bash）。
 *
 * ⚠️ sha256 值是**硬基线**，一个字符都不许改；它们与 TARGETS 一同来自原 mutation.cjs。
 *   维护方式：有意修改下列源文件后，跑 `node tests/mutation.cjs --print-sha`（只读），
 *   把输出的 sha 行同步更新到本文件。
 */
'use strict';

/* ------------------------------------------------------------------ *
 * 被变异文件清单 + 已知 good 的 sha256 基线
 * ------------------------------------------------------------------
 * 这份基线是「洁净工作树」的确定性锚点：只有全部一致才允许开跑。
 * 注：MUTATIONS 实际涉及 7 个文件（DemandNew / global.css / mock / ScaleChips /
 *     BrdAssistantCard / ui / PersonProfile），TARGETS 额外含 Workspace.jsx。
 *     快照 / 还原必须覆盖 MUTATIONS 引用到的**全部**文件，否则会污染工作树。
 * ------------------------------------------------------------------ */
const TARGETS = {
  'src/pages/Workspace.jsx': 'F449B1E5E7FD2273414DF81B4F098F8C09DC8933C524F2CCE5FA2D9BE04B0431',
  'src/pages/DemandNew.jsx': '135AB61F269C16D291AEC7A56F3851B409492FCCFB63C06BE181FD7CBE4CF8A5',
  'src/data/mock.js': '15BB8CCE2B776D5B2DD9934144D473234F0E8947AB0C385926E29A5137308231',
  'src/global.css': '6AADD4F8F14A3C27BEA15ABEA5E43AECCD0ED91A5DEC5A3FC5DF39E3FD6EF813',
  'src/components/demand/ScaleChips.jsx': 'B63C695F6A21AD633E7EF7B52025E03C41AD5971661C2C488CA202D87A2BECF1',
  'src/components/demand/BrdAssistantCard.jsx': 'CFDCEBC83DDADDF331DC748AB07256B28E6803F9E431D859E69C187C2A7BC2E6',
  'src/components/ui.jsx': '7DBCE2DBACEB3F3486881D684BF892107ED3EE558F9A17ED9B15F5E55E285D7A',
  // v0.5 新增（见 --print-sha 列表里的说明）
  // v0.5.1 起更新：mock.js / global.css / PersonProfile.jsx 三个文件因 v0.5.1 返修而重算
  //   （mock.js 加 rows/inWindow/outside 分区；global.css 修 .dp-gantt-cell 基底圆角
  //   4px→0；PersonProfile.jsx 图例补任务条主色 + 零交出行处置 + extra 文案）。
  'src/pages/PersonProfile.jsx': '5B14720BCE9E84B44C6D84E3BA1E0145779CDB534EA7341E56C0985D3B609266',
};

/* 每个变异：file + 精确 find/replace + 期望变红的断言子串 */
const MUTATIONS = [
  {
    id: 'M1 P0-1 内联 display 回归',
    file: 'src/pages/DemandNew.jsx',
    find: '<div className="dp-demand-side">',
    repl: '<div className="dp-demand-side" style={{ display: \'flex\', flexDirection: \'column\', gap: 16 }}>',
    expectRed: 'P0-1 右栏容器无内联 display',
  },
  {
    id: 'M2 P0-1 ≤900 顺序规则删除',
    file: 'src/global.css',
    find: '  .dp-demand-promise {\n    order: 1;\n  }\n',
    repl: '',
    expectRed: 'P0-1 ≤900px 媒体块完整', // 变异后 orderHits<4，走 fail 分支
  },
  {
    id: 'M3 P0-2 「说不清」chip 文案删除',
    file: 'src/data/mock.js',
    find: "{ value: DEMAND_UNSURE, label: '说不清，帮我定位' },",
    repl: "{ value: DEMAND_UNSURE, label: '系统不详' },",
    expectRed: '涉及系统含「说不清，帮我定位」合法选项',
  },
  {
    id: 'M4 P1-2 三态提示退化为二态',
    file: 'src/pages/DemandNew.jsx',
    find: "    hint: i.state === 'full' ? i.fullHint : i.state === 'partial' ? i.partialHint : i.emptyHint || i.partialHint,",
    repl: "    hint: i.state === 'full' ? i.fullHint : i.state === 'partial' ? i.partialHint : i.partialHint,",
    expectRed: 'P1-2 未填「验收标准」用独立 emptyHint',
  },
  {
    id: 'M5 P2-2 去掉鼠标焦点抑制',
    file: 'src/components/demand/ScaleChips.jsx',
    find: '        setFocused(!pointer.current);',
    repl: '        setFocused(true);',
    expectRed: 'P2-2 胶囊焦点环行为', // 变异后 mouse 也变 2px，走 fail 分支
  },
  {
    id: 'M6 保留建议：点 chip 时清空 pending',
    file: 'src/components/demand/BrdAssistantCard.jsx',
    find: "    setMessages((m) => [...m, { role: 'user', text: p }, { role: 'agent', text: hit ? hit.text : brdAgentIntro }]);",
    repl: "    setMessages((m) => [...m.filter((x) => !x.pending), { role: 'user', text: p }, { role: 'agent', text: hit ? hit.text : brdAgentIntro }]);",
    expectRed: '点快捷问题后保留 agent 建议',
  },

  /* ===== 以下 M7/M8/M12 于 v0.4.3 **重定向** =====
     v0.4.3 去掉了 v0.4.1 的分组结构（groupBar / buckets / 「N 组 · 共 M 个标签」口径），
     原 M7/M8/M12 的 find/expectRed 随之失效（空转变异风险）。按 team-lead「清理失效旧归因」
     要求，将它们重定向到 v0.4.3 的**活不变量**（Jira 工作楼层 / 横排标签楼层）。
     每个 find 串在目标文件里**恰好命中 1 次**（已用脚本逐一核验，见交付报告）。 */
  {
    id: 'M7 v0.4.3 getPersonWork 过滤掉 blocked（blocked 行被整行吞掉）',
    file: 'src/data/mock.js',
    // 在未完结过滤器上再加 `&& i.status !== 'blocked'` → 周敏的 DS-3121（blocked 样本）整条从
    // 工作列表消失 → smoke「v0.4.3 blocked 任务整行仍渲染」门找不到 DS-3121 行 → 变红。
    // 这正是规范 §5 铁律「blocked 不上屏但整行照常渲染」的反向守卫。
    find: "  const open = JIRA_ISSUES.filter((i) => i.assigneeId === key && i.status !== 'done');",
    repl: "  const open = JIRA_ISSUES.filter((i) => i.assigneeId === key && i.status !== 'done' && i.status !== 'blocked');",
    expectRed: 'v0.4.3 blocked 整行仍渲染',
  },
  {
    id: 'M8 v0.4.3 技能标签楼层去掉 .dp-tag-floor 横排容器',
    file: 'src/components/ui.jsx',
    // 把 .dp-tag-floor 容器改名 → 标签卡直接挂在普通 div 下：
    //   ①「标签矩阵使用 .dp-tag-floor」门失配；②「标签卡数量」门（.dp-tag-floor .dp-card = 8）读到 0；
    //   ③ 结构判档门读不到卡。三重变红。
    find: '<div className="dp-tag-floor">{tags.map(tagCard)}</div>',
    repl: '<div className="dp-tag-grid">{tags.map(tagCard)}</div>',
    expectRed: 'v0.4.3 标签卡数量',
  },

  /* ===== 以下 M10–M12 为 v0.4.2（删主标签 + 拆双轨成熟度 + 加点赞）新增覆盖 =====
     本轮真改动（SystemTier / TagLike / baseLikesOf / personTags 值改造）此前零变异覆盖。
     每个 find 串在目标文件里**恰好命中 1 次**（已用脚本逐一核验，证据见交付报告），
     且执行后真让对应 v0.4.2 断言变红。 */
  {
    id: 'M10 v0.4.2 点赞基线取模 2 → 7（计数越界，值域破坏）',
    file: 'src/data/mock.js',
    // baseLikesOf 内唯一一行取模（mock.js 全文件仅此处出现 `h %`）。
    // 改成 % 7 → 基线计数落到 {0..6} 而非 {0,1}：
    //   ①「点赞基线确定性」门（baseLikesOf('min.zhou','c-visual') === 1 期望落空）；
    //   ②「likes 值域 {0,1}」字段契约门变红。
    find: '  return h % 2;',
    repl: '  return h % 7;',
    expectRed: 'v0.4.2 点赞基线确定性',
  },
  {
    id: 'M11 v0.4.2 TagLike 去掉 onClick 的 e.stopPropagation()（点赞误触跳转）',
    file: 'src/components/ui.jsx',
    // ⚠️「e.stopPropagation();」在 ui.jsx 有 2 处（TagLike 的 onClick 与 onKeyDown），
    //   故 find 必须带上下文（onClick 分支特有的下一行 setLiked）才能唯一命中。
    // 删掉后：点赞冒泡到父级标签卡 role=button onClick → go('#/workspace/tags/'+id)
    //   → 路由跳到反查页 → 「点赞点击 +1 且未跳转」门变红。
    find: '        e.stopPropagation();\n        setLiked((v) => !v);',
    repl: '        setLiked((v) => !v);',
    expectRed: 'v0.4.2 门⑦ 点赞点击',
  },
  {
    id: 'M12 v0.4.3 personTags 少一个 key（周敏标签 8 → 7，标签卡数量门变红）',
    file: 'src/data/mock.js',
    // 删除周敏的一个标签行（用注释行做唯一锚点，保证 find 唯一命中）：
    //   周敏标签数 8 → 7，smoke「v0.4.3 标签卡数量与内部分组名小字（周敏 8 张）」门读到 7 → 变红。
    //   同时「v0.4.3 TagMatrix desc = 共 8 个标签」门失配（desc 变「共 7 个标签」）→ 双门变红。
    // 注：v0.4.3 返修后周敏首个标签为 'd-design-system'（此前被误删、现已恢复），故 find 锚其下。
    find: "    // 设计系统负责人：标签更新于 2026-09-16\n    'd-design-system': true,",
    repl: '    // 设计系统负责人：标签更新于 2026-09-16',
    expectRed: 'v0.4.3 标签卡数量',
  },

  /* ===== M13 ~ M18：v0.5（糅合楼层 + 轻量化标签卡 + 8 周资源占用甘特）=====
     v0.4.3 的 M13/M14 锚定 `.dp-g-duo` 两栏几何；v0.5 起 `.dp-g-duo` 已从 DOM 移除
     （工作/贡献各自独占通栏），原几何门**失去被测量对象**。处理方式：
       **换锚点，不删门** —— 几何实测能力整体迁移到甘特（`gate:'geom-gantt'`，
       探针 tests/_geom_gantt.cjs，真实 Chrome + CDP）。
     新几何门守 7 条子断言（notStacked / widthsEqual / bandColor / bandRadius /
       bandGap / tierFill / noOverflow），每条都有独立变异证伪，见下。

     ⚠️ 教训沿用（v0.4.3 的 M14 就是为此而生）：**一个变异只能有一个「应该红」的理由**。
       若某条几何断言在变异后仍恒真，它就是**装饰性断言**，必须补门或换门，
       而不是靠别的子断言把它「兜红」。 */

  /* M13 · 栅格塌陷：.dp-gantt 的 display:grid → block
     8 个周格会被拉成整行宽（每格 = 容器宽），任务列不再比周格宽 → notStacked=false。
     期望：几何门仅靠 notStacked 变红（widthsEqual 仍为真——都等宽）。 */
  {
    id: 'M13 v0.5 甘特栅格塌陷（.dp-gantt display:grid → block，未塌成单列被破坏）',
    file: 'src/global.css',
    find: '.dp-gantt {\n  display: grid;',
    repl: '.dp-gantt {\n  display: block;',
    gate: 'geom-gantt',
    expectRed: 'v0.5 门 .dp-gantt 未被塌成单列（几何实测 notStacked）',
  },

  /* M14 · 周列不等宽：repeat(8, 1fr) → repeat(7, 1fr) + 末列固定 240px
     两列都还在、任务列仍更宽（notStacked=true），但 8 周列宽度比越出 ≤8% →
     widthsEqual=false。期望**只靠 widthsEqual** 变红（notStacked 为 true）。
     必须与 M13 独立：两条各守一个子断言，缺一不可。 */
  {
    id: 'M14 v0.5 甘特 8 周列等宽性破坏（repeat(8,1fr) → repeat(7,1fr)+240px）',
    file: 'src/global.css',
    find: '  grid-template-columns: minmax(180px, 240px) repeat(8, minmax(44px, 1fr));',
    repl: '  grid-template-columns: minmax(180px, 240px) repeat(7, minmax(44px, 1fr)) 240px;',
    gate: 'geom-gantt',
    expectRed: 'v0.5 门 .dp-gantt 8 周列等分（几何实测 widthsEqual）',
  },

  /* M15 · 色带被切开：column-gap 0 → 8px
     ★ 这条最容易漏：column-gap 非 0 **既不影响宽度相等、也不影响颜色、也不影响圆角**，
       它只让相邻两格之间多出一道 8px 的缝 —— 色带从「一条带」变成「两段」。
       故必须单独量「下一格 left 是否等于上一格 right」。期望只靠 bandGap 变红。 */
  {
    id: 'M15 v0.5 甘特跨周色带被切开（.dp-gantt column-gap:0 → 8px）',
    file: 'src/global.css',
    find: '  column-gap: 0;\n  row-gap: 4px;\n  align-items: center;\n  min-width: 512px;',
    repl: '  column-gap: 8px;\n  row-gap: 4px;\n  align-items: center;\n  min-width: 512px;',
    gate: 'geom-gantt',
    expectRed: 'v0.5 门 色带无缝（几何实测 bandGap）',
  },

  /* M16 · 任务条色被换掉：.dp-gantt-cell.is-on 的填充 --dp-gantt-bar → --dp-gantt-l1
     var() 在 jsdom 下不解析，故 smoke 测不到色值；这条**只有真实 Chrome 探针**能证伪。
     期望只靠 bandColor 变红。 */
  {
    id: 'M16 v0.5 甘特任务条色错配（.is-on 填充 --dp-gantt-bar → --dp-gantt-l1）',
    file: 'src/global.css',
    find: '  background: var(--dp-gantt-bar);',
    repl: '  background: var(--dp-gantt-l1);',
    gate: 'geom-gantt',
    expectRed: 'v0.5 门 色带填充色 = c.brand（几何实测 bandColor）',
  },

  /* M17 · 三档阈值失效：{mid:2,high:3} → {mid:9,high:99}
     所有非零计数都掉进 'low' 档 → 「计数 → 档位」映射失效。
     两个通道同时变红（互为印证）：
       ① smoke 门⑪ 的「档位填充 class 与计数同源」；
       ② 几何门的 tierFill（档位填充色不再等于期望色阶）。
     本条走 smoke（gate 缺省），故 expectRed 指向 smoke 的断言名。 */
  {
    id: 'M17 v0.5 甘特三档阈值失效（OCCUPANCY_TIER_THRESHOLDS mid:2/high:3 → 9/99）',
    file: 'src/data/mock.js',
    find: 'export const OCCUPANCY_TIER_THRESHOLDS = { mid: 2, high: 3 };',
    repl: 'export const OCCUPANCY_TIER_THRESHOLDS = { mid: 9, high: 99 };',
    expectRed: 'v0.5 档位填充 class 与计数同源',
  },

  /* M18 · 格内计数数字消失：总占用行的数字渲染守卫恒 false
     ★ 这条守的是本视图**唯一的可访问性通道**：三档浅端对比度只有 1.20:1，
       全靠「格内数字」（≥4.87:1）才能读出档位。数字一旦消失，色盲用户就零信息。
     期望：smoke 门⑪ 的「有占用的格必有数字 / 无占用的格必无数字」变红。 */
  {
    id: 'M18 v0.5 甘特总占用行计数数字消失（t.count > 0 守卫恒 false）',
    file: 'src/pages/PersonProfile.jsx',
    find: '{t.count > 0 ? (',
    repl: '{false ? (',
    expectRed: 'v0.5 总占用行与可见行严格一致',
  },

  /* ============ v0.5.1 追加：为「返修时新增/首次变活」的门各配一条证伪 ============
     为什么要追加（这是本轮最重要的一条纪律）：
       几何门的子断言 bandRadiusOk 在 TARGETS 基线上**恒假**（.dp-gantt-cell 基底圆角
       原写 4px，而探针期望中间格左上圆角 0px，CSS 里没有任何把中间格圆角置 0 的规则）。
       后果有两层：① 一条 4 周色带被渲成一排首尾相接的「药丸」，用户选定的「连续色带」
       被无声破坏；② 4 条走 geom-gantt 的变异会**因为 bandRadiusOk 恒假而全都「红」**
       —— 红得不明不白，属空转断言。v0.5.1 已把基底圆角改为 0，探针实测 ok=true、
       bandStartR=4px / bandEndLeftR=0px。于是必须立刻给 bandRadiusOk 补一条**能把
       它打回 false** 的变异（M19），否则它就从「恒假装饰」翻转成「恒真装饰」。 */

  /* M19 · 色带圆角回归：.dp-gantt-cell 基底圆角 0 → 4px（= 把 v0.5.1 的修复原样撤回）
     中间格重新四角全圆 → 色带被切成若干药丸 → bandRadiusOk=false（bandEndLeftR 变回 4px）。
     期望：几何门**只靠 bandRadiusOk** 变红（宽度、颜色、间隙、档位色全都不受影响）。 */
  {
    id: 'M19 v0.5.1 色带中间格圆角回归（.dp-gantt-cell border-radius:0 → 4px）',
    file: 'src/global.css',
    find: 'border-radius: 0;',
    repl: 'border-radius: 4px;',
    gate: 'geom-gantt',
    expectRed: 'v0.5 门 色带两端圆角（几何实测 bandRadius）',
  },

  /* M20 · 零交出行重新上表：只渲染 inWindow → 退回渲染全量 rows
     陈思远会重新渲出 9 行，其中 1 行有任务名但 8 格全空（评审认定的 P1）→
     「8 项占用 / 8 行」与「零交出行不上表且不静默丢弃」同时变红。
     期望：smoke 变红，且归因写明 8格全空行=1 / MEM-2160 又出现在表内。 */
  {
    id: 'M20 v0.5.1 零交出行重新上表（渲染 inWindow → 退回全量 rows）',
    file: 'src/pages/PersonProfile.jsx',
    find: 'const rows = occ.inWindow;',
    repl: 'const rows = occ.rows;',
    expectRed: 'v0.5.1 零交出行处置',
  },

  /* M21 · 排除说明被吞：OutsideNote 恒返回 null（条数不再明示）
     行数不变（仍是 8 行、仍无全空行），但「另有 N 项…未列入上表」从屏上消失 →
     等于悄悄吞掉一条在办任务。「不静默丢弃」这条承诺就是靠这一门守住的。 */
  {
    id: 'M21 v0.5.1 零交出行被静默丢弃（OutsideNote 恒 null，条数不明示）',
    file: 'src/pages/PersonProfile.jsx',
    find: 'if (!(outside > 0)) return null;',
    repl: 'if (true) return null;',
    expectRed: 'v0.5.1 零交出行处置',
  },

  /* M22 · 图例漏掉任务条主色：第 4 个色块（bar）被抽掉
     文案仍在（「任务行：…该周在办」不会消失），只有**色块**少一个 →
     门⑫ 必须靠「色块数 / 填充源集合」判红，而不是靠文案。
     这条同时是对评审 P1-1 的回归门：图例不解释主色（7.87:1，比最高档还深一倍）时立刻红。 */
  {
    id: 'M22 v0.5.1 图例漏掉任务条主色（第 4 个色块 bar 被抽掉）',
    file: 'src/pages/PersonProfile.jsx',
    find: "{sw('bar')}",
    repl: '{null}',
    expectRed: 'v0.5.1 图例/颜色不单独承载信息',
  },

  /* M23 · 分区不变量被破坏：inWindow 不再是「有交集」的严格子集（直接等于 rows）
     inWindow=9 / outside=0 → 分区不再排除任何行，「分区不影响 totals」这一不变量失守。
     期望：数据层不变量门变红（两侧独立求和结果不再与 rows=9/inWindow=8 的指纹相符）。 */
  {
    id: 'M23 v0.5.1 分区不变量被破坏（inWindow 直接等于 rows，不再按 weekIdx 过滤）',
    file: 'src/data/mock.js',
    find: 'const inWindow = rows.filter((r) => r.weekIdx.length > 0);',
    repl: 'const inWindow = rows;',
    expectRed: '分区不变量',
  },

  /* M24 · v0.5 活路径上的「blocked 整行仍渲染」回归
     ★ 背景（首轮实测暴露）：M7 原本守这条规则，但它改的是 getPersonWork ——
       v0.5 换甘特后 getPersonWork 已无页面消费者，M7 因此**恒不变红**（空转）。
       真正喂甘特的是 getPersonOccupancy，所以这条规则必须有一条打在这里的变异。
       把它的未完结过滤再加 `&& i.status !== 'blocked'` → 周敏 DS-3121（唯一的 blocked
       样本）从甘特消失 → smoke 门⑦「v0.5 blocked 整行仍渲染」找不到该行 → 变红。 */
  {
    id: 'M24 v0.5 blocked 任务从甘特消失（getPersonOccupancy 额外过滤掉 blocked）',
    file: 'src/data/mock.js',
    find: "  const mine = JIRA_ISSUES.filter((i) => i.assigneeId === key && i.status !== 'done');",
    repl: "  const mine = JIRA_ISSUES.filter((i) => i.assigneeId === key && i.status !== 'done' && i.status !== 'blocked');",
    expectRed: 'v0.5 blocked 整行仍渲染',
  },
];

module.exports = { TARGETS, MUTATIONS };
