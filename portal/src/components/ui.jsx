/**
 * 通用 UI 原子组件
 * 约束：零硬编码颜色，全部经 useT() 取令牌。
 */
import React from 'react';
import { Flex } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useT, SEMANTIC } from '../theme';

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

/** 首字母头像（中性灰底，无头像菜单 / 无已读态） */
export function InitialAvatar({ name, size = 32 }) {
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
        fontSize: size <= 28 ? 12 : 14,
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

export { Flex };

/**
 * 页面级空态 / 404
 * 自建而非用 antd `Result`：当 status ∈ {404,403,500} 时 Result 会强制渲染内置彩色人物插画
 * 并忽略传入的 icon —— 那与本门户设计规范 ds-04「禁用彩色插画图标」直接冲突。
 */
export function PageEmpty({ title, desc, extra, style }) {
  const c = useT();
  return (
    <div className="dp-empty" style={{ textAlign: 'center', padding: '72px 24px', ...style }}>
      <BrandSymbol size={56} />
      <div style={{ marginTop: 22, fontSize: 20, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{title}</div>
      {desc ? (
        <div
          style={{
            margin: '10px auto 0',
            maxWidth: 580,
            fontSize: 14,
            lineHeight: 1.75,
            color: c.text2,
          }}
        >
          {desc}
        </div>
      ) : null}
      {extra ? (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>{extra}</div>
      ) : null}
    </div>
  );
}
