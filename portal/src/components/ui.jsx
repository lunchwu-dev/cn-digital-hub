/**
 * 通用 UI 原子组件
 * 约束：零硬编码颜色，全部经 useT() 取令牌。
 */
import React from 'react';
import { Flex } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useT, SEMANTIC } from '../theme';
import { SKILL_GROUPS } from '../data/mock';

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
   标签体系三件套：TagChip / MaturityAxis / TagMatrix
   规范来源：outputs/p2-design-system.md B/C/D 节。
   约束：零硬编码色值（一律 useT() 取 token）；两轴靠「蓝 vs 灰 + ◈ vs ◇」
   区分而非新色相；实证度 4 档是品牌蓝单色阶，坚决不做红黄绿。
   ========================================================================== */

/** 自评兴趣度 4 级文案（措辞落在「兴趣—投入—意愿」语义域，全程无「擅长/精通/掌握」） */
const SELF_RATING_COPY = {
  curious: '有点好奇',
  following: '持续关注',
  practicing: '在项目中用过',
  advocating: '主动投入',
};
const SELF_RATING_ORDER = ['curious', 'following', 'practicing', 'advocating'];

/** 实证度 4 档文案与档位序号（v0.4 2.3：none 由「暂无实证」改为「暂无公开贡献」） */
const EVIDENCE_COPY = {
  none: '暂无公开贡献',
  emerging: '有初步产出',
  established: '有稳定的产出',
  authoritative: '有沉淀与影响力',
};
const EVIDENCE_ORDER = ['none', 'emerging', 'established', 'authoritative'];

/**
 * 主标签几何符（PRIMARY_GLYPH）—— v0.4.1 单树化后的唯一字形。
 * 语义：标记「这个人主动表达过态度的主标签」（primary / selected 分支）。
 * 原 AXIS_GLYPH（domain ◈ / capability ◇）已删除——单树后不存在「轴」，
 * active 默认态不带任何前缀，字形只在 primary / selected 出现。
 */
const PRIMARY_GLYPH = '◈';

/**
 * MaturityAxis —— 双轴成熟度条（本体系最关键的组件）
 * 承载「双轴不合成」这一核心决策：自评 = 圆形点阵（主观、可打点），
 * 实证 = 分段胶囊条（客观、系统算）。**形状不同，故物理上不可相加。**
 *
 * props:
 *   selfRating      'curious'|'following'|'practicing'|'advocating'
 *   evidenceTier    'none'|'emerging'|'established'|'authoritative'
 *   variant         'compact'（默认，TagMatrix 内）| 'expanded'（个人页主标签）
 *   recentCount     近 12 月证据条数（等宽数字，仅此处 + historicalCount + 3/9）
 *   historicalCount 超窗历史贡献条数（仅 expanded 显示）
 *   latestCount / totalCount  回望计数（'3/9 条' 形式，仅 expanded 显示）
 *   extraText       hover 时原地追加的文案（如「 · 近 12 月 3 条」），不换行
 */
export function MaturityAxis({
  selfRating = 'curious',
  evidenceTier = 'none',
  variant = 'compact',
  recentCount,
  historicalCount,
  latestCount,
  totalCount,
  extraText,
}) {
  const c = useT();
  const expanded = variant === 'expanded';

  const tierIdx = Math.max(0, EVIDENCE_ORDER.indexOf(evidenceTier));
  // 自评与实证都取「已达成级数」（1..4）
  const selfIdx = Math.max(0, SELF_RATING_ORDER.indexOf(selfRating)) + 1;
  const evIdx = tierIdx + 1;
  // 吹牛态：自评 ≥ practicing（3 级）且实证 0 —— 诚实并列，不隐藏、不惩罚
  const boast = selfIdx >= 3 && evidenceTier === 'none';

  // —— 尺寸（两档只改尺寸，绝不改语义）——
  const dotSize = expanded ? 11 : 7;
  const dotGap = expanded ? 6 : 4;
  const trackH = expanded ? 8 : 6;
  const trackW = expanded ? 160 : 64;
  const segGap = expanded ? 3 : 2;
  const pointSize = expanded ? 15 : 13;
  const copySize = expanded ? 15 : 13;
  // 4 档填充色（单色阶）；空槽用 c.border（读起来像「凹槽」而不是「占位」）
  const fillColor = [c.brandStep1, c.brandStep2, c.brandStep3, c.brand][tierIdx] || c.brand;

  // —— 自评圆点阵 ——
  const dots = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: dotGap, flex: '0 0 auto' }}>
      {[1, 2, 3, 4].map((lv) => {
        const on = lv <= selfIdx;
        return (
          <span
            key={lv}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              boxSizing: 'border-box',
              // 已达 = 品牌蓝实心；未达 = 空心 + brandBorder 描边（「位置留好但没填」）
              background: on ? c.brand : 'transparent',
              border: on ? 'none' : `1.5px solid ${c.brandBorder}`,
            }}
          />
        );
      })}
    </span>
  );

  // —— 实证分段胶囊条 ——
  // 4 段等分（25/50/75/100%），不按分数比例（按比例会造出「绩效分」的横向比较读法）。
  // 段间透明缝；吹牛态改虚线描边空槽（同宽同高，不缩不涨）。
  const track = boast ? (
    <span
      style={{
        display: 'inline-block',
        width: trackW,
        height: trackH,
        borderRadius: 999,
        border: `1px dashed ${c.dashedBorder}`,
        background: 'transparent',
        boxSizing: 'border-box',
        flex: '0 0 auto',
      }}
    />
  ) : (
    <span
      style={{
        display: 'inline-flex',
        width: trackW,
        height: trackH,
        gap: segGap,
        flex: '0 0 auto',
      }}
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
  );

  // v0.4 2.3：措辞由「暂无实证」改为「暂无公开贡献」——
  //   不是「没有实证」，而是「没有**公开**贡献被系统统计到」；也避免与「实证度」名词自我循环。
  const evidenceCopy = boast ? '仅自评 · 暂无公开贡献' : EVIDENCE_COPY[evidenceTier] || EVIDENCE_COPY.none;
  const evidenceCopyColor = boast ? c.text3 : c.text2;

  // ★ v0.4 (e) 视觉噪音按 selfIdx 分档（仅改**渲染分支**，不动 :374 的 boast 判定语义）：
  //   selfIdx <= 2 && tier==='none' → 收轨：不渲染实证行(track)，只留一行极淡 text3 的「暂无公开贡献」。
  //                                 这类标签本就没声称什么，画一条空槽纯属噪音（噪音主体）。
  //   selfIdx >= 3 && tier==='none' → 保留完整双行（点阵 + 虚线空槽 + 文案 + 提示行）= 吹牛态，
  //                                 诚实并列不能消解。
  //   ⚠️ 「吹牛态」判定仍是 boast（:374），collapse 只是它的补集，二者互斥、不可混淆。
  const collapse = !boast && evidenceTier === 'none' && selfIdx <= 2;

  // —— 回望计数（仅 expanded，等宽数字，'3/9 条' 形式）——
  // 严禁用于中文标签名/中文文案：Roboto Mono 无中文字形，会触发回退、破坏「数字 mono」切分。
  const hasRecall = expanded && totalCount != null;
  const recall = hasRecall ? (
    <span className="dp-num" style={{ fontSize: 12, color: c.text3, flex: '0 0 auto' }}>
      {latestCount}/{totalCount} 条
    </span>
  ) : null;

  const recallLine = expanded ? (
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {recentCount != null ? (
        <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
          近 12 月 {recentCount} 条
        </span>
      ) : null}
      {historicalCount != null && historicalCount > 0 ? (
        <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
          历史贡献 {historicalCount} 条
        </span>
      ) : null}
      {recall}
    </div>
  ) : null;

  // —— 紧凑态：不设行首标签，改置于图形下方 10px ——
  if (!expanded) {
    // 收轨态（selfIdx<=2 && tier==='none'）：不渲染实证行(track)，只留一行极淡 text3 文案
    if (collapse) {
      return (
        <div>
          {/* L2 自评行：点阵 + 文案 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {dots}
            <span style={{ fontSize: copySize, color: c.text2, whiteSpace: 'nowrap' }}>{SELF_RATING_COPY[selfRating]}</span>
          </div>
          {/* 收轨淡文案：无图形，12px text3（噪音收敛主体） */}
          <div style={{ marginTop: 4, fontSize: 12, color: c.text3, lineHeight: 1.5, minWidth: 0 }}>暂无公开贡献</div>
        </div>
      );
    }
    return (
      <div>
        {/* L2 自评行：点阵 + 文案 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {dots}
          <span style={{ fontSize: copySize, color: c.text2, whiteSpace: 'nowrap' }}>{SELF_RATING_COPY[selfRating]}</span>
        </div>
        {/* L3 实证行：条 + 文案（hover 时原地追加 extraText，不换行） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, minWidth: 0 }}>
          {track}
          <span
            style={{
              fontSize: copySize,
              color: evidenceCopyColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {evidenceCopy}
            {extraText ? <span style={{ fontSize: 12, color: c.text3 }}>{extraText}</span> : null}
          </span>
        </div>
        {/* L4 一级提示行（仅吹牛态）—— v0.4 2.4：第三人称 + 召回入口（不得出现「你」） */}
        {boast ? (
          <div
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: `1px solid ${c.border}`,
              fontSize: 11,
              color: c.text3,
              lineHeight: 1.5,
            }}
          >
            这项仅有自评，系统暂未找到对应的公开产出。
          </div>
        ) : null}
      </div>
    );
  }

  // —— 放大态：两列制（列 1 行首轴标 40px 固定，列 2 图形 + 文案从 x=52 起排）——
  const rowLabel = (t) => (
    <span style={{ width: 40, flex: '0 0 auto', fontSize: 10, color: c.text3 }}>{t}</span>
  );
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {rowLabel('兴趣')}
        {dots}
        <span style={{ fontSize: copySize, color: c.text2, whiteSpace: 'nowrap' }}>{SELF_RATING_COPY[selfRating]}</span>
      </div>
      {/* 实证行：收轨态（selfIdx<=2 && none）不画图形，只留淡文案；吹牛态/有实证态照常画 track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        {rowLabel('实证')}
        {collapse ? null : track}
        <span style={{ fontSize: copySize, color: collapse ? c.text3 : evidenceCopyColor, whiteSpace: 'nowrap' }}>
          {collapse ? '暂无公开贡献' : evidenceCopy}
        </span>
      </div>
      {recallLine}
      {boast ? (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${c.border}`,
            fontSize: 12,
            color: c.text3,
            lineHeight: 1.5,
          }}
        >
          这项仅有自评，系统暂未找到对应的公开产出。
        </div>
      ) : null}
    </div>
  );
}

/**
 * TagChip —— 标签胶囊（v0.4.1 单树：无轴语义）
 * 不复用 Pill：Pill 的 semantic 绑定「运行状态」语义域，硬塞语义会耦合两套语义系统。
 * 复用既有 .dp-chip 类与 ChannelTag 的中性画法。
 *
 * props: label / primary / status('active'|'deprecated'|'merged')
 *        originLabel（merged 用，显示「原『旧名』」）/ selected / disabled / onClick
 *        axis（**已降级为可选遗留 prop**：传与不传渲染完全一致，不参与任何视觉计算）
 *        单行裁剪由调用方在容器上控制（TagMatrix 内卡片强制单行）
 *
 * 配色纪律（取代原「轴色差」）：默认态统一中性（c.page/c.border/c.text2/400），
 * 品牌蓝只出现在「用户主动表达态度」的场景 —— primary（主标签）、selected（已选）、hover。
 */
export function TagChip({
  label,
  primary = false,
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
        <TagChip label={label} primary={primary} selected={selected} disabled={disabled} onClick={onClick} />
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

  // —— 主标签：brandSubtle 底 + 1.5px brand 描边 + 统一 ◈ 前缀 + 24px 高 + 右侧「主」字标 ——
  //    不用品牌黄（黄是「时间性标记」语义，主标签是「长期属性」），不反白填充。
  if (primary) {
    return (
      <span
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onClick : undefined}
        onKeyDown={onKey}
        className="dp-chip"
        style={{
          ...base,
          height: 24,
          padding: '0 12px',
          background: c.brandSubtle,
          border: `1.5px solid ${c.brand}`,
          color: c.brand,
          fontWeight: 500,
          cursor: clickable ? 'pointer' : 'default',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {PRIMARY_GLYPH} {label}
        </span>
        <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 500, color: c.brand, flex: '0 0 auto' }}>主</span>
      </span>
    );
  }

  // —— 已选：brandStep1 底 + brandBorder 边 + inset brand 环 + 统一 ◈ 前缀 + 后端 × 移除符 ——
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {PRIMARY_GLYPH} {label}
        </span>
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
 * TagMatrix —— 技能标签树容器（v0.4.1 单树）
 * 单 Panel 内按 SKILL_GROUPS 的 7 个一级分组渲染多段树；**只渲染该人有标签的分组**
 * （空组不渲染——个人画像是「展示这个人的能力」，空组只制造噪音）。
 * 组间按 SKILL_GROUPS 顺序；组内按 evidenceTier 降序，同档按 selfRating 降序。
 *
 * props: tags[{ tag, selfRating, evidenceTier, recentCount, historicalCount }]
 *        empty（bool，整人无标签）/ onTagClick(tagId)
 */
export function TagMatrix({ tags = [], empty = false, onTagClick }) {
  const c = useT();

  // 整人无标签 → 整体替换为 PageEmpty（不渲染任何分组）
  if (empty || tags.length === 0) {
    return (
      <Panel>
        <PageEmpty
          compact
          title="暂无标签"
          desc="该成员尚未选择任何标签。标签用于让同事找到你的专长——可在组织速查里发起补充。"
        />
      </Panel>
    );
  }

  const recentTotal = tags.reduce((s, t) => s + (t.recentCount || 0), 0);

  // 按分组归并（只保留有标签的组，按 SKILL_GROUPS 顺序）
  const tierRank = (tier) => ({ none: 0, emerging: 1, established: 2, authoritative: 3 }[tier] || 0);
  const ratingRank = (r) => ['curious', 'following', 'practicing', 'advocating'].indexOf(r);
  const buckets = SKILL_GROUPS.map((g) => ({
    label: g,
    list: tags
      .filter((t) => t.tag && t.tag.group === g)
      .slice()
      .sort((a, b) => {
        const td = tierRank(b.evidenceTier) - tierRank(a.evidenceTier);
        if (td !== 0) return td;
        return ratingRank(b.selfRating) - ratingRank(a.selfRating);
      }),
  })).filter((b) => b.list.length > 0);

  // 分组标题条：高 32px / cardHeadBg 底 / 6px 圆角 / 13px 500 text2 / 左 padding 10px / 右侧该组数量
  const groupBar = (label, n, key) => (
    <div
      key={key}
      style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '0 10px',
        background: c.cardHeadBg,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        color: c.text2,
      }}
    >
      <span>{label}</span>
      <span className="dp-num" style={{ fontSize: 11, fontWeight: 400, color: c.text3 }}>
        {n}
      </span>
    </div>
  );

  // 单张标签卡：标签名（+主标签 ◈ 前缀）+ 分组名（替代旧「领域/能力」角标）+ MaturityAxis 紧凑态
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
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          cursor: clickable ? 'pointer' : 'default',
          minWidth: 0,
        }}
      >
        {isLegacy ? (
          <TagChip label={t.tag.label} status={st} originLabel={t.tag.originLabel} style={{ maxWidth: '100%' }} />
        ) : (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: c.ink,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {t.primary ? `${PRIMARY_GLYPH} ` : ''}
            {t.tag.label}
          </span>
        )}
        {/* 分组名独立一行（11px / text3）——替代旧「领域 / 能力」角标。
            「业务与场景」「协作与流程」等 5 字组名与标签名同行会挤，故固定独立成行。 */}
        <div style={{ fontSize: 11, color: c.text3, lineHeight: 1.5, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.tag.group}
        </div>
        <div style={{ marginTop: 4 }}>
          <MaturityAxis
            selfRating={t.selfRating}
            evidenceTier={t.evidenceTier}
            variant="compact"
            recentCount={t.recentCount}
          />
        </div>
      </Panel>
    );
  };

  return (
    <Panel>
      <PanelHead
        title="技能标签"
        desc={`${buckets.length} 组 · 共 ${tags.length} 个标签`}
        extra={
          <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
            近 12 月实证 {recentTotal} 条
          </span>
        }
      />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {buckets.map((b) => (
          <div key={b.label}>
            {groupBar(b.label, b.list.length, b.label)}
            <div style={{ marginTop: 10 }}>
              <div className="dp-grid dp-g3 dp-grid--tight" style={{ alignItems: 'start' }}>
                {b.list.map(tagCard)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
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
