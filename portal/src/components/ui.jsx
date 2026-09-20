/**
 * 通用 UI 原子组件
 * 约束：零硬编码颜色，全部经 useT() 取令牌。
 */
import React from 'react';
import { Flex } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useT, SEMANTIC } from '../theme';
import { ICONS } from './icons';

/** 语义 / 中性 胶囊徽标 */
export function Pill({ semantic = 'neutral', children, style, dot = false }) {
  const c = useT();
  const s = SEMANTIC[semantic] || SEMANTIC.neutral;
  return (
    <span
      className="dp-chip"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontWeight: 500,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: s.color,
            display: 'inline-block',
            flex: '0 0 auto',
          }}
        />
      )}
      {children}
    </span>
  );
}

/** 中性浅底频道标签（信息中心列表用） */
export function ChannelTag({ children }) {
  const c = useT();
  return (
    <span
      className="dp-chip"
      style={{
        background: c.page,
        border: `1px solid ${c.border}`,
        color: c.text2,
      }}
    >
      {children}
    </span>
  );
}

/** 品牌黄小面积标记（置顶 / 里程碑 / NEW） */
export function YellowMark({ children, title }) {
  const c = useT();
  return (
    <span
      className="dp-chip"
      title={title}
      style={{
        background: c.yellow,
        color: c.ink,
        fontWeight: 500,
        border: `1px solid ${c.yellow}`,
      }}
    >
      {children}
    </span>
  );
}

/** 白色内容面板：静止仅 1px 边框，无阴影；hover 可选抬升 */
export function Panel({ children, hover = false, style, bodyStyle, className = '', ...rest }) {
  const c = useT();
  return (
    <div
      className={`dp-card ${hover ? 'dp-card--hover' : ''} ${className}`}
      style={{ border: `1px solid ${c.border}`, ...style }}
      {...rest}
    >
      {bodyStyle ? <div style={bodyStyle}>{children}</div> : children}
    </div>
  );
}

/** 面板头部：标题 + 右上操作区 */
export function PanelHead({ title, desc, extra, dense = false }) {
  const c = useT();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: dense ? '12px 16px' : '14px 16px',
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>{desc}</div>}
      </div>
      {extra ? <div style={{ flex: '0 0 auto' }}>{extra}</div> : null}
    </div>
  );
}

/** 区块标题（页面内分区） */
export function SectionTitle({ title, desc, extra }) {
  const c = useT();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        {desc && <span style={{ fontSize: 13, color: c.text3 }}>{desc}</span>}
      </div>
      {extra}
    </div>
  );
}

/** 环比增量（文字级，不用彩色底） */
export function Delta({ value, unit, label, higherIsBetter = true, noise }) {
  const c = useT();
  const up = value > 0;
  const good = up === higherIsBetter;
  // 噪声区间内的微小波动用中性灰：否则「可用性 −0.02%」会被涂成和「库存与供应链 异常」同款红，
  // 很快就会教会大家无视红色。百分点类默认噪声带 0.1（可用 noise 显式覆盖）。
  const band = typeof noise === 'number' ? noise : unit === '%' ? 0.1 : 0;
  const color = value === 0 || Math.abs(value) <= band ? c.text3 : good ? c.successText : c.errorText;
  const Icon = up ? ArrowUpOutlined : ArrowDownOutlined;
  return (
    <span style={{ fontSize: 12, color: c.text3, whiteSpace: 'nowrap' }}>
      <Icon style={{ fontSize: 10, color, marginRight: 3 }} />
      <span className="dp-num" style={{ color, fontWeight: 500 }}>
        {Math.abs(value)}
        {unit}
      </span>
      {label ? <span style={{ marginLeft: 6 }}>{label}</span> : null}
    </span>
  );
}

/** 指标卡（首页 + 监控运营共用规格） */
export function KpiTile({ item, showStatus = false, dense = false }) {
  const c = useT();
  return (
    <Panel hover style={{ padding: dense ? '14px 16px' : '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: c.text2 }}>{item.label}</span>
        {showStatus && item.status ? <Pill semantic={item.status} dot>{statusLabel(item.status)}</Pill> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
        <span
          className="dp-num"
          style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.15, color: c.ink, letterSpacing: '-0.02em' }}
        >
          {item.value}
        </span>
        <span className="dp-mono" style={{ fontSize: 13, color: c.text3 }}>
          {item.unit}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 10,
          minHeight: 22,
        }}
      >
        <Delta
          value={item.delta}
          unit={item.deltaUnit || ''}
          label={item.deltaLabel}
          higherIsBetter={item.higherIsBetter}
        />
        {item.spark ? <Sparkline data={item.spark} /> : null}
      </div>
      {(item.threshold || item.note) && (
        <div style={{ marginTop: 10, fontSize: 12, color: c.text3, borderTop: `1px solid ${c.border}`, paddingTop: 8 }}>
          {item.threshold || item.note}
        </div>
      )}
    </Panel>
  );
}

export function statusLabel(s) {
  return { success: '正常', warning: '预警', error: '异常', info: '提示' }[s] || s;
}

/** 微型趋势线（KPI 卡内） */
export function Sparkline({ data, width = 64, height = 22, color }) {
  const c = useT();
  const stroke = color || c.brand;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 内容负责人 / 最后更新（防荒废机制，必须有） */
export function ContentMeta({ owner, updated, note, style }) {
  const c = useT();
  return (
    <Flex gap={16} wrap="wrap" align="center" style={{ fontSize: 12, color: c.text3, ...style }}>
      <span>
        内容负责人：<span style={{ color: c.text2 }}>{owner}</span>
      </span>
      <span>
        最后更新：<span className="dp-num" style={{ color: c.text2 }}>{updated}</span>
      </span>
      {note ? <span>{note}</span> : null}
    </Flex>
  );
}

/** 空态：仅页头/空态使用品牌几何符号 */
export function BrandSymbol({ size = 40, color, muted = false }) {
  const c = useT();
  const stroke = color || (muted ? c.textDisabled : c.brand);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke={stroke} strokeWidth="1.5" opacity={muted ? 0.5 : 0.25} />
      <circle cx="24" cy="24" r="12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill={stroke} />
    </svg>
  );
}

/** 首字母头像（中性灰底，无头像菜单 / 无已读态）
    fontSize 可选：默认 null → 走既有 size<=28?12:14 推导（向后兼容，不改既有调用）。
    56px 大尺寸下既有推导会得 14px 偏小，个人页页头传 fontSize={20}。 */
export function InitialAvatar({ name, size = 32, fontSize = null }) {
  const c = useT();
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: c.page,
        border: `1px solid ${c.border}`,
        color: c.text2,
        fontSize: fontSize != null ? fontSize : size <= 28 ? 12 : 14,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      {name ? name.slice(0, 1) : '—'}
    </span>
  );
}

/** 状态点 */
export function StatusDot({ semantic = 'neutral', size = 8 }) {
  const s = SEMANTIC[semantic] || SEMANTIC.neutral;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: s.color,
        display: 'inline-block',
        flex: '0 0 auto',
      }}
    />
  );
}

/* ==========================================================================
   标签体系：TagChip / SystemTier / TagLike / TagMatrix
   规范来源：outputs/v042-design-tokens.md §1 / §3 / §4。
   约束：零硬编码色值（一律 useT() 取 token）。
   v0.4.2：主标签概念退场、自评轨整体退场（单一系统轨）、标签可被同事点赞。
   ========================================================================== */

/**
 * 系统档位 4 档文案（v0.4.2）。
 * 语义域统一落在「系统记录 / 沉淀」——**全程无「擅长/精通/掌握」，也无「贡献 / 产出」**
 * 这类成果评价词（用户第 2、3 条：标签仅来自系统抽取 + 人才盘点，不作能力评价）。
 * 旧文案「暂无公开贡献 / 有初步产出 / 有稳定的产出 / 有沉淀与影响力」已废弃。
 *
 * v0.4.3 用途更新（重要）：
 *   TIER_COPY 的定位由「**上屏文案**」改为「**悬停提示（title）文案** + **档位语义的单一事实来源**」。
 *   原因：SystemTier 在个人主页横排标签卡的唯一使用点（ui.jsx `showCopy={false}`）不显示文案
 *   （132px 窄卡装不下），全站当前调用点均传 false ⇒ 文案不再上屏。
 *   用户决策：**加悬停提示兜底**——档位条带原生 `title`，hover 即读该档位中文语义，不占屏效但可读。
 *   故 TIER_COPY **不可删**（它是 title 的数据源，且是「none/emerging/established/authoritative」
 *   四档中文语义的唯一权威定义）。
 */
const TIER_COPY = {
  none: '暂无系统记录',
  emerging: '有初步记录',
  established: '有稳定记录',
  authoritative: '有沉淀与影响',
};
const TIER_ORDER = ['none', 'emerging', 'established', 'authoritative'];

/**
 * SystemTier —— 系统档位条（v0.4.2 单一系统轨）
 * ------------------------------------------------------------------
 * 唯一形态：4 段等分胶囊条（25/50/75/100%），**不按分数比例**——
 *   按比例会造出「绩效分」的横向比较读法，既有决策保留。
 * 档位只来自系统派生（系统数据抽取 + 人才盘点）；无自评轨、无点阵、无吹牛态、无收轨态。
 *
 * props:
 *   tier      'none'|'emerging'|'established'|'authoritative'（默认 none）
 *   count     近 12 月系统记录条数（可选；>0 才渲染计数，避免与「暂无系统记录」重复否定）
 *   showCopy  是否显示档位文案（默认 true）。
 *             ⚠️ 当前全站调用点**均传 false**（仅 ui.jsx TagMatrix 一处调用）——文案不上屏，
 *             语义改由 ①档位条 4 段结构 ②档位条 title 悬停提示 双通道表达。
 *             该参数保留：反查页未来若接入（宽卡场景）可传 true 恢复上屏文案。
 *
 * v0.4.3 新增：档位条容器带原生 `title={copy}`（悬停提示兜底）。
 *   选择：**无论 showCopy 真假都加 title**（而非只在不显示文案时加）。理由：
 *     ① 原生 tooltip 零成本；文案在屏时 title 只是复述（不冲突、不重复占位）；
 *     ② 去掉条件分支 → 更少状态组合、更易维护；
 *     ③ 与标签名 `title` 的既有做法一致（窄卡截断补偿的统一手感）。
 *   title 挂在 bar 的 `<span>` 上（width:64px = 4 段总宽），悬停命中面即「整条胶囊」。
 */
export function SystemTier({ tier = 'none', count, showCopy = true }) {
  const c = useT();

  const tierIdx = Math.max(0, TIER_ORDER.indexOf(tier));
  // 4 档填充色（品牌蓝单色阶）；空槽用 c.border（读起来像「凹槽」而不是「占位」）。
  const fillColor = [c.brandStep1, c.brandStep2, c.brandStep3, c.brand][tierIdx] || c.brand;
  // none 档不点亮任何段 → 四段全是 c.border 空槽，照常渲染（83.5% 实例是 none，
  // 「统一的空槽」才是不喧哗的默认态；换成虚线条/隐藏反而满屏噪音）。
  const evIdx = tierIdx + 1;

  // 文案色：none 档用 c.text3（比 emerging 以上更淡一档），形成「低档位更安静」的自然降序。
  const copyColor = tier === 'none' ? c.text3 : c.text2;
  const copy = TIER_COPY[tier] || TIER_COPY.none;

  return (
    <div>
      {/* L1 档位条：4 段等分，段间透明缝。
          title 挂在 bar 容器本身（width:64 = 四段总宽）→ 悬停命中「整条胶囊」，读该档位中文语义。
          这是 v0.4.3「档位文案不上屏但在屏可读」的兜底通道（见 TIER_COPY 注释）。 */}
      <span
        title={copy}
        style={{ display: 'inline-flex', width: 64, height: 5, gap: 2, flex: '0 0 auto' }}
      >
        {[1, 2, 3, 4].map((lv) => (
          <span
            key={lv}
            style={{
              flex: '1 1 0',
              height: '100%',
              borderRadius: 999,
              background: lv <= evIdx ? fillColor : c.border,
            }}
          />
        ))}
      </span>
      {/* L2 档位文案 +（可选）近 12 月计数 */}
      {showCopy ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 12,
              color: copyColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {copy}
          </span>
          {typeof count === 'number' && count > 0 ? (
            <span className="dp-num" style={{ fontSize: 12, color: c.text3, flex: '0 0 auto' }}>
              近 12 月 {count} 条
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * TagLike —— 标签点赞（同事之间的认可动作）
 * ------------------------------------------------------------------
 * 定位：读侧社交信号。点赞不改动被访者的任何字段，也不进入被访者资料；
 *       它只表达「浏览者认可这个标签」。计数 = 确定性基线(mock) + 本 session 的 +1。
 *
 * 【为什么「点赞」不违反「只读第三人称视图」】
 *   本页「只读」约束的原文（历史）是「无编辑入口、无关注、无『这是我的页面』暗示」，
 *   它约束两件事：① 不能让浏览者编辑**被访者的**数据；② 不能制造归属暗示。
 *   点赞两条都不触碰：不写入被访者任何字段；点赞者是浏览者而非页主。
 *   ⚠️ 「无关注」这一条**已被 v0.4.2 推翻**（用户明确要求点赞），故 PersonProfile.jsx
 *      文档头注释已同步改写，避免后续维护者依据旧注释判定点赞违规。
 *
 * 【状态不持久化 —— 刻意设计】
 *   liked 是本地 useState，刷新归 false。本项目零后端（file:// 双击可用、零外部请求），
 *   没有可信的持久化位置。**这不是「状态丢失 bug」，是显式裁定**（规范 §4.2 / §8 R2）。
 *
 * 【图标纪律】只用 LikeOutlined（Outlined 线性系列）。**不用 LikeFilled**——
 *   项目图标纪律禁止实心面版图标（见 icons.jsx 头注）。「已点赞」靠
 *   ①图标色 & 计数色 → c.brand；②胶囊底 → c.brandSubtle；两者区分状态，不靠线↔面切换。
 *
 * props: baseLikes(number, 确定性基线计数) / label(string, 所属标签名, 组装 aria-label) / size(number)
 */
export function TagLike({ baseLikes = 0, label = '', size = 14 }) {
  const c = useT();
  const [liked, setLiked] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const count = baseLikes + (liked ? 1 : 0);

  // 已点赞：brand 字/图标 + brandSubtle 胶囊底；未点赞 hover：brand 字 + page 底；静止：text3 字。
  const fg = liked || hover ? c.brand : c.text3;
  const bg = liked ? c.brandSubtle : hover ? c.page : 'transparent';
  const Icon = ICONS.LikeOutlined;

  return (
    <button
      type="button"
      className="dp-like"
      aria-pressed={liked ? 'true' : 'false'}
      aria-label={liked ? `取消认可「${label}」` : `认可「${label}」`}
      onClick={(e) => {
        // ★ 必须：父级标签卡 role=button onClick → go('#/workspace/tags/'+id)，
        //   不阻断冒泡则点赞会连带跳转反查页。
        e.stopPropagation();
        setLiked((v) => !v);
      }}
      onKeyDown={(e) => {
        // ★ 必须：父级标签卡 role=button onKeyDown 也监听 Enter/Space → 跳反查页。
        //   原生 <button> 会自行把 Enter/Space 转成 click，故本处**不自行 toggle**
        //   （规范 §4.6 条文 2：重复处理会导致一次 Enter 触发两次 toggle），
        //   只阻断冒泡，避免键盘操作点赞时连带跳转。
        e.stopPropagation();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        // v0.5 轻量化：22 → 20（点赞高度决定卡片第二行行高，是 −22% 的主要来源之一）。
        //   图标 size / 左右 padding 均不动 —— 保住点击热区（≥20px 高 · 0 7px 内边距）。
        height: 20,
        padding: '0 7px',
        borderRadius: 999,
        border: 'none',
        background: bg,
        color: fg,
        fontSize: 12,
        lineHeight: 1,
        fontFamily: 'inherit',
        cursor: 'pointer',
        flex: '0 0 auto',
        transition: 'background-color .12s ease, color .12s ease',
      }}
    >
      <Icon style={{ fontSize: size }} />
      {/* 计数外包 aria-hidden，让 aria-label 独占语义（避免读屏把「2」与「认可」割裂朗读）；
          计数为 0 时仍显示 0 —— 「0 人认可」是有意义的事实，且隐藏会导致卡片布局跳动。 */}
      <span className="dp-num" aria-hidden="true">
        {count}
      </span>
    </button>
  );
}

/**
 * TagChip —— 标签胶囊（v0.4.1 单树：无轴语义；v0.4.2：无主标签语义）
 * 不复用 Pill：Pill 的 semantic 绑定「运行状态」语义域，硬塞语义会耦合两套语义系统。
 * 复用既有 .dp-chip 类与 ChannelTag 的中性画法。
 *
 * props: label / status('active'|'deprecated'|'merged')
 *        originLabel（merged 用，显示「原『旧名』」）/ selected / disabled / onClick
 *        单行裁剪由调用方在容器上控制（TagMatrix 内卡片强制单行）
 *
 * 配色纪律：默认态统一中性（c.page/c.border/c.text2/400）；
 * 品牌蓝只出现在「用户主动表达态度」的场景 —— selected（已选）、hover。
 * v0.4.2 主标签退场后 **primary 分支与 branchSubtle 底已删**，品牌蓝在本组件内仅服务于 selected。
 */
export function TagChip({
  label,
  status = 'active',
  originLabel,
  selected = false,
  disabled = false,
  onClick,
  style,
}) {
  const c = useT();

  const clickable = typeof onClick === 'function' && !disabled;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    maxWidth: '100%',
    ...style,
  };

  const onKey = (e) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  // 复用设计系统 .dp-chip 形态（22px 高 / 0 10px 内距 / 999px 圆角 / 12px 字 /
  // gap 4px）——该 class 只含结构属性、不含任何颜色字面量，颜色一律走上面的 token。
  // 所有分支（merged 除外，其内层 TagChip 自带）在根节点挂 className="dp-chip"。

  // —— 已合并：渲染 target 的 active chip + 紧跟「原『旧名』」角标（永远可见）——
  if (status === 'merged') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: '100%' }}>
        <TagChip label={label} selected={selected} disabled={disabled} onClick={onClick} />
        {originLabel ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 18,
              padding: '0 8px',
              borderRadius: 999,
              background: c.page,
              border: `1px solid ${c.border}`,
              color: c.text3,
              fontSize: 11,
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
          >
            原「{originLabel}」
          </span>
        ) : null}
      </span>
    );
  }

  // —— 已停用：虚线描边 + 无前缀 + 后缀「已停用」+ 左端 3px 中性竖条 ——
  if (status === 'deprecated') {
    return (
      <span
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onClick : undefined}
        onKeyDown={onKey}
        className="dp-chip"
        style={{
          ...base,
          height: 22,
          padding: '0 10px',
          paddingLeft: 7,
          background: c.page,
          border: `1px dashed ${c.dashedBorder}`,
          borderLeft: `3px solid ${c.dashedBorder}`,
          color: c.text3,
          fontWeight: 400,
          overflow: 'hidden',
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginLeft: 4,
            paddingLeft: 5,
            borderLeft: `1px solid ${c.border}`,
            fontSize: 10,
            flex: '0 0 auto',
          }}
        >
          已停用
        </span>
      </span>
    );
  }

  // —— disabled：中性灰底 + 实线描边 + textDisabled 字（禁用态装饰，非正文）——
  if (disabled) {
    return (
      <span
        className="dp-chip"
        style={{
          ...base,
          height: 22,
          padding: '0 10px',
          background: c.page,
          border: `1px solid ${c.border}`,
          color: c.textDisabled,
          fontWeight: 400,
          cursor: 'not-allowed',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </span>
    );
  }

  // —— 已选：brandStep1 底 + brandBorder 边 + inset brand 环 + 后端 × 移除符 ——
  //    v0.4.2：删去 ◈ 字形前缀（主标签退场，字形失去所指）。
  if (selected) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKey}
        className="dp-chip"
        style={{
          ...base,
          height: 22,
          padding: '0 10px',
          background: c.brandStep1,
          border: `1px solid ${c.brandBorder}`,
          boxShadow: `inset 0 0 0 1.5px ${c.brand}`,
          color: c.brand,
          fontWeight: 500,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ marginLeft: 2, fontSize: 12, color: c.text3, flex: '0 0 auto' }}>×</span>
      </span>
    );
  }

  // —— active（默认）：统一中性底，无字形前缀 ——
  return (
    <span
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={onKey}
      className="dp-chip"
      style={{
        ...base,
        height: 22,
        padding: '0 10px',
        background: c.page,
        border: `1px solid ${c.border}`,
        color: c.text2,
        fontWeight: 400,
        cursor: clickable ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </span>
  );
}

/**
 * WorkStatusPill —— Jira 任务状态徽标（v0.4.3「近期工作内容」）
 * ------------------------------------------------------------------
 * 收口「status 枚举 → 上屏中文 + Pill semantic」，禁止在卡片里散写三元。
 * 4 态数据 → 3 态视觉：**blocked 不上屏**（返回 null），见下。
 *
 * 【为什么 blocked 不上屏（设计系统专家的核心取舍，我方认同并落地）】
 *   ① 它是唯一「负面」态，出现在个人主页这个语境（人名正上方）会被读成人格判断
 *      （「这个人卡住了」），触碰全站铁律「不作为绩效评价」的软边界；
 *   ② 对「他在做什么 / 什么时候好」两个同事真正关心的问题零贡献；
 *   ③ 与 todo/inprogress/review 不同质（那是流程进度轴，blocked 是轴的断裂）。
 *   → 留空 = 「该状态不适合在此语境展示」，诚实且无伤害。
 *
 * 【纪律】纯文字 Pill：**不传 dot**（点阵已被 StatusDot 服务状态占用）、**不加图标**。
 * 未知 status 兜底 → null（不猜、不显红）。
 */
const WORK_STATUS = {
  todo: { copy: '待办', semantic: 'neutral' },
  inprogress: { copy: '进行中', semantic: 'info' },
  review: { copy: '待评审', semantic: 'warning' },
  blocked: null, // ★ 不上屏
};

export function WorkStatusPill({ status }) {
  const m = WORK_STATUS[status];
  if (!m) return null;
  return (
    <Pill semantic={m.semantic} style={{ height: 22, flex: '0 0 auto' }}>
      {m.copy}
    </Pill>
  );
}

/**
 * TagMatrix —— 技能标签横向流式楼层（v0.5）
 * ------------------------------------------------------------------
 * v0.4.2 → v0.4.3 变化：**去分组结构**（用户「技能标签卡片不用分组展示」）。
 *   删：groupBar（32px 标题条）、buckets 分段、组内 `.dp-grid.dp-g3.dp-grid--tight`。
 *   改为：单个 `.dp-tag-floor` flex-wrap 容器直接平铺全部标签卡。
 *   **保留卡内 11px 分组名小字**——它是横排唯一的「类目上下文」与「排序可见性」
 *   来源（横排顺序仍按 SKILL_GROUPS 组序，保留小字用户才懂「为何这几个挨在一起」）。
 *   排序由数据层 getPersonProfile 给出（组序 → 档位降序 → 词表索引），此处**不重排**。
 *
 * v0.4.3 → v0.5 变化（两件，用户「技能标签是不是可以和个人信息糅合成一个大的楼层，
 *   标签及成熟度的卡片可以再轻量化一些」）：
 *   ① **不自带 Panel / PanelHead** —— 本组件现在只渲染「糅合楼层下带」的内容，
 *      由 PersonProfile 把它放进 `.dp-person-head.dp-floor-merged` 内。外层自带 Panel 会
 *      造成 Panel 套 Panel（双边框 + 双内边距）；标题条（16px）也去掉，改一行 12px meta
 *      —— 楼层主标题是姓名，再给标签一个标题＝凭空造第二主标题。
 *   ② **卡片减重 −22.7%**（70.5 → 54.5px）：padding 10/12→8/10、标签名 lh 1.4→1.35、
 *      点赞高 22→20（TagLike）、档位条高 6→5（SystemTier）、**分组名行与档位行合并为一行**。
 *      合并行的「双侧 flex:0 0 auto + 不设 maxWidth」是减重能成立的前置条件，见卡内注释。
 *
 * 窄卡纪律（132px 是 **minWidth 红线**，不拆）：minWidth:132 + padding:'8px 10px'
 *   + SystemTier `showCopy={false}`（窄卡装不下「暂无系统记录」）
 *   + 标签名 `title` 原生 tooltip（截断的补偿）。
 *   注：minWidth 未变，但卡片靠内容自适应会撑到约 145px（5 字组名）—— 这是取舍不是 bug。
 */
export function TagMatrix({ tags = [], empty = false, onTagClick }) {
  const c = useT();

  // 整人无标签 → 整体替换为 PageEmpty（不渲染任何标签卡）
  // v0.5：不再自带外层 Panel —— TagMatrix 现在只作为「糅合楼层下带」的内容渲染，
  //   自建 Panel 会与外层 .dp-person-head 形成 Panel 套 Panel（双边框 + 双内边距）。
  if (empty || tags.length === 0) {
    return (
      <PageEmpty
        compact
        title="暂无标签"
        desc="该成员暂无可展示的技能标签。技能标签来自系统数据抽取与人才盘点，无需本人登记。"
      />
    );
  }

  const recentTotal = tags.reduce((s, t) => s + (t.recentCount || 0), 0);

  // 单张标签卡：标签名 + 点赞 ｜ 分组名小字 ｜ 系统档位条
  const tagCard = (t) => {
    const clickable = typeof onTagClick === 'function';
    const tClick = clickable ? () => onTagClick(t.tag.id) : undefined;
    // 已停用 / 已合并的历史标签挂在某人身上时，**照常渲染**（不静默丢弃），
    // 并带对应 status 视觉（虚线 / 「原『旧名』」角标）——历史引用可审计。
    const st = t.tag.status;
    const isLegacy = st === 'deprecated' || st === 'merged';
    return (
      <Panel
        key={t.tag.id}
        hover
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={tClick}
        onKeyDown={(e) => {
          if (!clickable) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tClick();
          }
        }}
        style={{
          // v0.5 轻量化三项：padding 10/12 → 8/10；标签名 lineHeight 1.4 → 1.35；
          //   点赞高 22 → 20（见 TagLike）；档位条高 6 → 5（见 SystemTier）。
          //   minWidth 132 是**红线**，不动 —— 卡片仍靠内容自适应（见下方合并行注释）。
          minWidth: 132,
          padding: '8px 10px',
          flex: '0 1 auto',
          display: 'flex',
          flexDirection: 'column',
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
          {isLegacy ? (
            <TagChip label={t.tag.label} status={st} originLabel={t.tag.originLabel} style={{ maxWidth: '100%' }} />
          ) : (
            <span
              title={t.tag.label}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: c.ink,
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {t.tag.label}
            </span>
          )}
          {/* 点赞：读侧社交信号，置于标签名右端（同一行，卡片宽度不因点赞数变化而跳） */}
          <TagLike baseLikes={t.likes} label={t.tag.label} />
        </div>
        {/* v0.5 合并行：档位条（左、不收缩） + 分组名（右、不收缩、**不设 maxWidth**）。
            ------------------------------------------------------------------
            为什么必须合并：原「分组名行 + 档位行」两行合计 28.5px，合并后 18.5px，
              单卡高 70.5 → 54.5px（−22.7%）。
            为什么两段都必须 flex:0 0 auto 且不设 maxWidth：这是 −22% 能成立的**前置条件**。
              132px 卡减 padding 后内容宽仅 112px，档位条固定 64px + gap 6 = 70px，
              留给 11px 分组名只有 42px ≈ 3.8 字 → 「业务与场景」必被截断。
              改为双侧不收缩后，卡片由内容撑宽（5 字组名 → 约 145px），分组名完整。
              代价：1440 下每行由约 9 张降到约 8 张 —— 这是取舍，不是 bug。
            为什么分组名必须仍是 <div> 且 inline font-size:11px：smoke 门⑤用
              `card.querySelectorAll('div')` 找 11px 元素来证明「类目上下文未丢」。
            视觉顺序「先档位、再类目」：档位条表达「这个标签有多硬」，是卡内第二重要信息。 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ display: 'inline-flex', flex: '0 0 auto' }}>
            {/* showCopy={false}：窄卡装不下「暂无系统记录」等档位文案（档位条已结构性表达档位） */}
            <SystemTier tier={t.evidenceTier} count={t.recentCount} showCopy={false} />
          </span>
          <div style={{ flex: '0 0 auto', fontSize: 11, color: c.text3, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            {t.tag.group}
          </div>
        </div>
      </Panel>
    );
  };

  return (
    <>
      {/* v0.5：PanelHead 已去（楼层主标题是姓名，再给标签一个标题＝凭空造第二主标题）。
          改为一行 12px meta 取代标题条 —— 信息不减，只是不再占一个标题层级。
          原 PanelHead 的 extra「近 12 月记录 N 条」并入本行，不丢读数。 */}
      <div style={{ fontSize: 12, color: c.text3, lineHeight: 1.6, marginBottom: 10 }}>
        技能标签 · 共 {tags.length} 个 · 按技能领域排序 · 近 12 月记录 {recentTotal} 条
      </div>
      {/* 横向流式容器：flex-wrap 让短标签（RAG / 埋点）不被 grid 拉宽，提高屏效 */}
      <div className="dp-tag-floor">{tags.map(tagCard)}</div>
    </>
  );
}

export { Flex };

/**
 * 页面级空态 / 404
 * 自建而非用 antd `Result`：当 status ∈ {404,403,500} 时 Result 会强制渲染内置彩色人物插画
 * 并忽略传入的 icon —— 那与本门户设计规范 ds-04「禁用彩色插画图标」直接冲突。
 */
export function PageEmpty({ title, desc, extra, style, compact = false }) {
  const c = useT();
  return (
    <div
      className="dp-empty"
      style={{ textAlign: 'center', padding: compact ? '28px 16px' : '72px 24px', ...style }}
    >
      <BrandSymbol size={compact ? 36 : 56} />
      <div
        style={{
          marginTop: compact ? 14 : 22,
          fontSize: compact ? 16 : 20,
          fontWeight: 500,
          color: c.ink,
          lineHeight: 1.5,
        }}
      >
        {title}
      </div>
      {desc ? (
        <div
          style={{
            margin: compact ? '8px auto 0' : '10px auto 0',
            maxWidth: compact ? 460 : 580,
            fontSize: compact ? 13 : 14,
            lineHeight: 1.75,
            color: c.text2,
          }}
        >
          {desc}
        </div>
      ) : null}
      {extra ? (
        <div
          style={{
            marginTop: compact ? 14 : 24,
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {extra}
        </div>
      ) : null}
    </div>
  );
}
