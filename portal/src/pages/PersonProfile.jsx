/**
 * 员工个人主页 —— 路由 #/workspace/people/:id
 * ------------------------------------------------------------------
 * v0.5 版面（**四个楼层**，自上而下）：
 *   楼层 1  糅合层：上带 = 头像 + 个人信息 ／ 1px 实线 ／ 下带 = 技能标签
 *           —— 单张 Panel（`.dp-person-head.dp-floor-merged`），两带各自管 padding
 *   楼层 2  近期工作内容（**独占通栏**）—— 未来 8 周资源占用甘特 `.dp-gantt`
 *   楼层 3  近期知识贡献（**独占通栏**）
 *   楼层 4  = 无（原 `.dp-g-duo` 等宽两栏已废弃、从 DOM 移除）
 * 栅格：`.dp-g-duo`（1fr/1fr）与 v0.4.2 的 `.dp-g-profile`（1.85fr/1fr）均已无使用点
 *   （定义保留在 global.css 以稳住 mutation TARGETS sha，见其考古注释）。
 *
 * 只读的第三人称视图：无编辑入口、无「这是我的页面」暗示；
 *   同事可对标签点赞表示认可（读侧社交信号，不改动被访者资料）。
 *
 * v0.4.1 删除：能力分布概览（Sparkline）、协作触点（负责的工具）。
 * v0.4.2 删除：主标签概念整体退场。
 * v0.4.3 新增：近期工作内容（Jira，前瞻态，列表 + 5 条截断）；技能标签升为独立楼层 2。
 * v0.5 删除：Jira 任务列表（WorkItem，`padding:10px 12px` 特征串）——被 8 周甘特取代。
 * v0.5 新增：楼层糅合、轻量化标签卡（由 ui.jsx TagMatrix 承担）、8 周资源占用甘特。
 * v0.5 关键裁定（**偏离 v05-design-tokens.md §0-5**）：
 *   逾期但未完结的任务**照常进甘特**，渲染为普通行——无逾期色、无图标、无「逾期」二字。
 *   理由：仍在办的任务**确实在占用这个人**；把它藏掉会让 W1 的占用被低估，
 *   而这恰恰是资源甘特最不该错的地方。用户原话是「哪些事项对该员工有占用」。
 *   配套约束：本视图屏幕正文**零判词**，`逾期` 二字不得出现（见下方 GanttRowHead 注释）。
 *
 * v0.5.1（独立评审后返修，3 处）：
 *   ① 图例补上**任务条主色** `--dp-gantt-bar`（原来只解释了总占用行的三档）。
 *      它是整屏面积最大、且比最高档更深的色块（7.87:1 vs 3.99:1），不解释就会被读成「高」。
 *   ② 只渲染 `occ.inWindow`（与 8 周有交集的行），零交集的行不再渲成「8 格全空」；
 *      排除条数由 `OutsideNote` 明示，**不静默丢弃**。与上面「逾期照常进甘特」不冲突：
 *      那条管的是「区间与窗口有交集」的逾期任务（如 DS-3080）；此处排除的是
 *      「不占用任何一周」的任务，藏掉它不会让任何一周的占用被低估。
 *   ③ extra 计数由 `rows.length`（全量在办）改为 `inWindow.length`，文案随之由
 *      「项在办」改「项占用」——陈思远全量在办 9 条但只有 8 条占用窗口，
 *      沿用「9 项在办」会和表内行数对不上。
 */
import React from 'react';
import { Breadcrumb, Button } from 'antd';
import { getPersonProfile, WORK_WINDOW_AS_OF, OCCUPANCY_TIER_THRESHOLDS, TAG_BY_ID } from '../data/mock';
import { useT } from '../theme';
import {
  Panel,
  PanelHead,
  InitialAvatar,
  TagChip,
  TagMatrix,
  WorkStatusPill,
  PageEmpty,
} from '../components/ui';
import { go } from '../router';

/** 证据类型 → 展示名（中性为主，不与运行状态语义色争抢） */
const KIND_META = {
  bestPractice: { label: '最佳实践' },
  article: { label: '最佳实践' },
  projectUpdate: { label: '项目动态' },
  announcement: { label: '公告与决议' },
  release: { label: '产品 Release' },
};

/** 单条证据条目（右栏）：标题 + 元信息 + 「→ 标签名」联动标注（第二行，整块不可点） */
function ContributionItem({ item, isLast }) {
  const c = useT();
  const meta = KIND_META[item.kind] || { label: '贡献' };
  const tags = (item.tagIds || []).map((id) => TAG_BY_ID[id]).filter(Boolean);
  const open = () => item.path && go(item.path);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      style={{
        padding: '10px 12px',
        borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <TagChip label={meta.label} />
        <span className="dp-num" style={{ fontSize: 11, color: c.text3 }}>
          {item.date}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{item.title}</div>
      {/* 第二行：→ 标签名（联动标注，说明不是入口，故整块不可点） */}
      {tags.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {tags.map((t) => (
            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: c.text3 }}>→</span>
              <TagChip label={t.label} />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   v0.5 · 8 周资源占用甘特（楼层 2 的全部子件）
   --------------------------------------------------------------------------
   读法：行 = 任务，列 = 8 周，格 = 该任务本周是否在办（start/due 与周窗**有交集**即算）。
   跨周任务连成一条**连续色带**（首末格圆角、中间格 0 圆角、column-gap:0）。

   ★ 纪律（team-lead 加严，逐条对应 smoke 门禁）：
     ① blocked 任务整行照常渲染（单号 / 任务名 / 项目 / 交付日都在），只是状态位留空
        （WorkStatusPill 返回 null）——绝不因状态位为空而吞掉整行；
     ② **逾期不标记**：交付日恒用 c.text3，既不染红也不用任何 warning 色，更不出现「逾期」二字。
        逾期任务照常占格（它确实还在占用这个人），但**本视图不对此作任何价值判断**；
     ③ 整块**不可点**：无 role / 无 tabIndex / 无 cursor:pointer / 无 <a href>；
     ④ **数字是主通道**：三档品牌蓝的浅端对比度只有 1.31:1（对白底），单靠颜色分不出三档，
        尤其对色盲用户。故总占用行**每格必须显示计数数字**（≥4.87:1，达正文 AA），
        深浅只是辅助通道。这是本视图可访问性的全部依据，不许退化成「纯色块热力图」。
   ========================================================================== */

/** 表头一格：两行（W1 / 09-14）。本周（含 WORK_WINDOW_AS_OF 的那一周）加品牌蓝下沿 +「本周」。 */
function GanttHeadCell({ week, isCurrent }) {
  const c = useT();
  return (
    <div
      className="dp-gantt-head"
      style={isCurrent ? { borderBottom: `2px solid ${c.brand}` } : undefined}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: c.text2, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
        {week.label}
        {isCurrent ? <span style={{ fontSize: 11, color: c.brand, marginLeft: 4 }}>本周</span> : null}
      </span>
      <span className="dp-num" style={{ fontSize: 11, color: c.text3, lineHeight: 1.3 }}>
        {week.start.slice(5).replace('-', '/')}
      </span>
    </div>
  );
}

/**
 * 任务行首格（占第 1 列，两行）：
 *   行 1：任务名（13px/500，单行 ellipsis + title 兜底）
 *   行 2：状态 Pill + 单号 + 项目 ｜ 右端交付日
 * 为什么两行而不是一行：行首列最小 160px，四个信息挤一行会把任务名压到约 3.6 字，不可读。
 * ⚠️ 项目保留在行 2（11px，可 ellipsis）：甘特行没有项目上下文就只剩单号，
 *   对「这是哪个坑的事」没有帮助。title 上也再挂一份，窄屏截断时可悬停读全。
 */
function GanttRowHead({ row }) {
  const c = useT();
  return (
    <div className="dp-gantt-rowhead">
      <div
        title={`${row.title} · ${row.project}`}
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: c.ink,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, minWidth: 0 }}>
        {/* blocked → null：状态位留空，但整行照常渲染 */}
        <WorkStatusPill status={row.status} />
        <span className="dp-num" style={{ fontSize: 11, color: c.text3, flex: '0 0 auto', letterSpacing: 0 }}>
          {row.key}
        </span>
        <span
          style={{
            fontSize: 11,
            color: c.text3,
            flex: '1 1 auto',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.project}
        </span>
        {/* 交付日恒 c.text3 —— 逾期不换色（见文件头纪律 ②） */}
        <span className="dp-num" style={{ fontSize: 11, color: c.text3, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
          {row.due}
        </span>
      </div>
    </div>
  );
}

/** 任务行的 8 个周格。占用格打 is-on；色带首/末格打 is-band-start / is-band-end。 */
function GanttCells({ weekIdx }) {
  const first = weekIdx[0];
  const last = weekIdx[weekIdx.length - 1];
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const on = weekIdx.indexOf(i) >= 0;
        const cls = [
          'dp-gantt-cell',
          on ? 'is-on' : '',
          on && i === first ? 'is-band-start' : '',
          on && i === last ? 'is-band-end' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return <div key={i} className={cls} />;
      })}
    </>
  );
}

/** 总占用行：行首格 + 8 格（按档填色 + 居中计数；空槽不显示数字）。 */
function GanttTotalRow({ totals }) {
  const c = useT();
  return (
    <>
      <div className="dp-gantt-rowhead">
        <div style={{ fontSize: 11, color: c.text2, lineHeight: 1.5 }}>总占用</div>
      </div>
      {totals.map((t) => {
        const cls = ['dp-gantt-total', t.tier ? 't-' + t.tier : ''].filter(Boolean).join(' ');
        return (
          <div key={t.i} className={cls}>
            {t.count > 0 ? (
              <span className="dp-num" style={{ fontSize: 12, fontWeight: 500, color: c.ink }}>
                {t.count}
              </span>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/**
 * v0.5.1 新增：被排除行的**明示**条（不静默丢弃）。
 *   背景（独立评审 Q2-P1 + 数据实测）：全量在办任务里有 2 条整段都在窗口开始日之前
 *   （siyuan.chen 的 MEM-2160、jia.he 的 SRE-860），weekIdx = []。
 *   处置：甘特只渲染与这 8 周有交集的行；但**必须**把排除条数写在屏上——
 *   否则等于悄悄吞掉一条在办任务，而「藏掉占用」正是资源视图最不可接受的失败方式。
 *   措辞只陈述事实（区间结束日早于窗口开始日），不作任何价值判断、不出现判词。
 */
function OutsideNote({ outside, windowStart }) {
  if (!(outside > 0)) return null;
  return (
    <div>
      另有 {outside} 项在办任务的区间结束于窗口开始日（{windowStart}）之前，未占用这 8 周中的任何一周，故未列入上表。
    </div>
  );
}

/**
 * 图例。
 * ★ v0.5.1 修（独立评审 P1，色值已逐一复算）：**必须同时解释两种填充**——
 *   任务行的色带 + 总占用行的三档。原版只列 l1/l2/l3，漏掉了任务条主色
 *   `--dp-gantt-bar`（#3643ba，对白底 **7.87:1**）：它是整屏面积最大、且比最高档 l3
 *   （#6b78d4，3.99:1）**深一倍**的色块 —— 读者极易把「任务在办」误读成「占用=高」。
 *   图例不解释主色，就是图例失职。
 * ★ 每个色块**必须**各带文字标签：三档浅蓝单靠颜色分不出来（l1 对白底仅 1.31:1），
 *   数字才是主通道（见文件头纪律 ④）；色块不得独立承载语义。
 * ★ 阈值不手写：文案由 OCCUPANCY_TIER_THRESHOLDS 拼出，避免「数据层改了阈值、
 *   图例继续撒谎」的漂移（评审 Q3-P2）。
 * ★ 两个 class 是 smoke 门⑫ 的稳定锚点（`dp-gantt-legend` / `dp-gantt-sw`）——
 *   旧门靠「textContent 以『周占用强度：』开头」找图例，文案一改就失锚。
 */
function GanttLegend({ outside, windowStart }) {
  const c = useT();
  const T = OCCUPANCY_TIER_THRESHOLDS; // { mid: 2, high: 3 }
  const sw = (key) => (
    <span
      className="dp-gantt-sw"
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: 3,
        background: `var(--dp-gantt-${key})`,
      }}
    />
  );
  const tiers = [
    ['l1', '轻（1 项）'],
    ['l2', `中（${T.mid} 项）`],
    ['l3', `高（≥${T.high} 项）`],
  ];
  return (
    <div className="dp-gantt-legend" style={{ padding: '8px 16px 0', fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <span>任务行：</span>
        {sw('bar')}
        <span>该周在办</span>
        <span style={{ margin: '0 8px' }}>·</span>
        <span>总占用行：</span>
        {tiers.map(([key, label], k) => (
          <React.Fragment key={key}>
            {k > 0 ? <span>／</span> : null}
            {sw(key)}
            <span>{label}</span>
          </React.Fragment>
        ))}
        <span>，格内数字 = 该周在办任务数。</span>
      </div>
      <OutsideNote outside={outside} windowStart={windowStart} />
    </div>
  );
}

/** 楼层 2 主体：8 周甘特（或空态）。 */
function OccupancyGantt({ occ }) {
  const c = useT();
  const windowStart = occ.weeks[0] ? occ.weeks[0].start : WORK_WINDOW_AS_OF;
  // v0.5.1：只渲染**与这 8 周有交集**的行（occ.inWindow）。零交集的行会渲成
  //   「有任务名、8 格全空」，既像渲染 bug，又让楼层头的计数虚高（评审 Q2-P1）。
  //   排除不等于丢弃——条数由图例下方的 OutsideNote 明示。
  const rows = occ.inWindow;
  if (!rows.length) {
    return (
      <div style={{ padding: '20px 16px', fontSize: 13, color: c.text3, lineHeight: 1.7 }}>
        未来 8 周暂无在办任务占用。任务数据来自 Jira 的负责人字段，仅作协作参考。
        <OutsideNote outside={occ.outside} windowStart={windowStart} />
      </div>
    );
  }
  // 本周 = 含 WORK_WINDOW_AS_OF 的那一周（'2026-09-17' 落在 W1）。**不读系统时间**。
  const curIdx = occ.weeks.findIndex((w) => w.start <= WORK_WINDOW_AS_OF && WORK_WINDOW_AS_OF <= w.end);
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <div className="dp-gantt-scroll">
        <div className="dp-gantt">
          {/* 表头：左上角空位 + 8 个周格 */}
          <div className="dp-gantt-head" style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: c.text2 }}>任务</span>
          </div>
          {occ.weeks.map((w) => (
            <GanttHeadCell key={w.i} week={w} isCurrent={w.i === curIdx} />
          ))}
          {/* 任务行：一行 = 一条任务，「不截断」（所有与窗口有交集的在办任务都上屏） */}
          {rows.map((row) => (
            <React.Fragment key={row.key}>
              <GanttRowHead row={row} />
              <GanttCells weekIdx={row.weekIdx} />
            </React.Fragment>
          ))}
          {/* 任务区 与 总占用行 的水平分隔 */}
          <div className="dp-gantt-sep" />
          <GanttTotalRow totals={occ.totals} />
        </div>
      </div>
      <GanttLegend outside={occ.outside} windowStart={windowStart} />
    </div>
  );
}

export default function PersonProfile({ id }) {
  const c = useT();
  const profile = getPersonProfile(id);

  if (!profile.person) {
    return (
      <div className="dp-shell">
        <PageEmpty
          title="没有找到这位成员"
          desc={`成员「${id || '未知'}」不存在，可能已离开部门或链接已失效。可回到组织速查按姓名与技能标签检索。`}
          extra={
            <>
              <Button type="primary" onClick={() => go('#/org')}>
                去组织速查
              </Button>
              <Button onClick={() => go('#/workspace/tags')}>浏览全部标签</Button>
            </>
          }
        />
      </div>
    );
  }

  const { person, tags, contributions, occupancy } = profile;
  const recentContribs = contributions.slice();
  // v0.5：工作楼层由「Jira 列表（当前至未来 1 个月，截断 5 条）」改为「8 周资源占用甘特（不截断）」。
  //   数据来自 profile.occupancy（= getPersonOccupancy(personId)）。`profile.work` 仍在返回里保留
  //   （口径归档），但本页不再使用 —— 见 mock.js getPersonProfile 的返回注释。
  const occ = occupancy;

  return (
    <div className="dp-shell">
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => go('#/home')}>
                首页
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => go('#/org')}>
                组织速查
              </Button>
            ),
          },
          { title: <span style={{ color: c.ink }}>{person.name}</span> },
        ]}
      />

      {/* 楼层 1+2 · 糅合层：上带 = 身份，1px 实线，下带 = 技能标签。
          单张 Panel —— 原来「hero Panel + 20px 楼层间隙 + 标签 Panel + PanelHead 标题条」
          合计约 55px 的纯结构开销被消掉，标签流同时拿到通栏满宽。
          padding 归零由 .dp-floor-merged 管，两带各自给 padding（避免双重内边距）。 */}
      <Panel className="dp-person-head dp-floor-merged">
        {/* 上带 · 身份（内容与字号相对 v0.4.3 一律不变，只把外层 24/28 收到 18/22） */}
        <div
          className="dp-person-head-main"
          style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', minWidth: 0 }}
        >
          <InitialAvatar name={person.name} size={64} fontSize={23} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: c.ink, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {person.name}
            </div>
            <div style={{ fontSize: 14, color: c.text2, lineHeight: 1.5, marginTop: 6 }}>
              {person.dept} · {person.role}
            </div>
            <div style={{ fontSize: 13, color: c.text3, lineHeight: 1.5, marginTop: 3 }}>
              {person.location} · <span className="dp-mono">{person.email}</span>
            </div>
          </div>
        </div>

        {/* 下带 · 技能标签 + 合规脚注 */}
        <div className="dp-floor-tags" style={{ borderTop: `1px solid ${c.border}`, padding: '14px 22px 18px' }}>
          <TagMatrix
            tags={tags}
            empty={tags.length === 0}
            onTagClick={(tagId) => go('#/workspace/tags/' + tagId)}
          />
          {/* 合规声明：并入技能标签楼层下方作脚注。
              红线：`不作为绩效评价` 必须逐字保留（该板块紧邻姓名，这是全站铁律的书面锚点）。 */}
          <div style={{ marginTop: 10, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
            本页为只读视图（同事可对标签点赞表示认可）· 技能标签来自系统数据抽取与公司人才盘点，由系统自动生成，无需本人登记，也不作为绩效评价。
          </div>
        </div>
      </Panel>

      {/* 楼层 3 · 近期工作内容（**独占通栏**）—— 未来 8 周资源占用甘特 */}
      <Panel className="dp-floor-work" style={{ overflow: 'hidden', marginTop: 20 }}>
        <PanelHead
          title="近期工作内容"
          desc="来自 Jira 的负责人字段 · 未来 8 周资源占用"
          extra={
            <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
              {occ.inWindow.length} 项占用
            </span>
          }
        />
        <OccupancyGantt occ={occ} />
        {/* 数据来源脚注：语气与技能标签的来源说明一致 */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.border}`, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
          任务来自 Jira 的负责人字段，仅作协作参考，不作为绩效评价。
        </div>
      </Panel>

      {/* 楼层 4 · 近期知识贡献（**独占通栏**，v0.5 起不再与工作内容共用双栏） */}
      <Panel className="dp-floor-contrib" style={{ overflow: 'hidden', marginTop: 20 }}>
        <PanelHead
          title="近期知识贡献"
          desc="每条都标注它喂养了哪个标签"
          extra={
            <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
              {recentContribs.length} 条
            </span>
          }
        />
        {recentContribs.length ? (
          <div>
            {recentContribs.map((item, i) => (
              <ContributionItem key={item.key} item={item} isLast={i === recentContribs.length - 1} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px 16px', fontSize: 13, color: c.text3, lineHeight: 1.7 }}>
            暂无近期知识贡献。技能标签的档位来自最佳实践、文章、项目动态、公告与 Release 的署名，
            以及人才盘点结果，由系统自动核算。
          </div>
        )}
      </Panel>
    </div>
  );
}
