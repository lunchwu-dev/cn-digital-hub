/**
 * 手写 SVG 图表（零外部依赖、零 CDN）
 * 配色规则：单序列图表（Bar / HBar）用品牌蓝 c.brand；多序列图表（Line）才用分类色板 c.chart。
 * 网格线 c.grid；不使用任何渐变。
 */
import React from 'react';
import { useT } from '../theme';

const PAD = { l: 46, r: 14, t: 14, b: 26 };

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step = span / count;
  return Array.from({ length: count + 1 }, (_, i) => min + step * i);
}

function fmt(v, span) {
  let d = 0;
  if (span <= 0.05) d = 3;
  else if (span < 1) d = 2;
  else if (span < 10) d = 1;
  else d = 0;
  return v.toFixed(d);
}

/** 多序列折线图 */
export function LineChart({ chart, height = 208 }) {
  const c = useT();
  const W = 600;
  const H = height;
  const { x, series, yDomain, unit } = chart;
  const all = series.flatMap((s) => s.data);
  const min = yDomain ? yDomain[0] : Math.min(...all) * 0.995;
  const max = yDomain ? yDomain[1] : Math.max(...all) * 1.005;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const px = (i) => PAD.l + (x.length === 1 ? iw / 2 : (i / (x.length - 1)) * iw);
  const py = (v) => PAD.t + ih - ((v - min) / (max - min || 1)) * ih;
  const ticks = niceTicks(min, max, 4);
  const span = max - min;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={chart.title} style={{ display: 'block' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)} stroke={c.grid} strokeWidth="1" />
          <text x={PAD.l - 8} y={py(t) + 4} textAnchor="end" fontSize="11" fill={c.text3} className="dp-mono">
            {fmt(t, span)}
          </text>
        </g>
      ))}
      {x.map((label, i) => (
        <text key={label + i} x={px(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={c.text3} className="dp-mono">
          {label}
        </text>
      ))}
      {series.map((s, si) => {
        const color = c.chart[si % c.chart.length];
        const d = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {s.data.map((v, i) => (
              <circle key={i} cx={px(i)} cy={py(v)} r="2.6" fill={c.surface} stroke={color} strokeWidth="1.6" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** 纵向柱状图 */
export function BarChart({ chart, height = 208 }) {
  const c = useT();
  const W = 600;
  const H = height;
  const { x, values, unit } = chart;
  const max = Math.max(...values) * 1.15;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = Math.min(46, (iw / x.length) * 0.52);
  const cx = (i) => PAD.l + (i + 0.5) * (iw / x.length);
  const py = (v) => PAD.t + ih - (v / max) * ih;
  const ticks = niceTicks(0, max, 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={chart.title} style={{ display: 'block' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)} stroke={c.grid} strokeWidth="1" />
          <text x={PAD.l - 8} y={py(t) + 4} textAnchor="end" fontSize="11" fill={c.text3} className="dp-mono">
            {fmt(t, max)}
          </text>
        </g>
      ))}
      {values.map((v, i) => (
        <g key={x[i]}>
          <rect
            x={cx(i) - bw / 2}
            y={py(v)}
            width={bw}
            height={Math.max(2, PAD.t + ih - py(v))}
            rx="3"
            fill={c.brand}
          />
          <text x={cx(i)} y={py(v) - 6} textAnchor="middle" fontSize="11" fill={c.ink} className="dp-mono" fontWeight="500">
            {v}
          </text>
          <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={c.text3}>
            {x[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** 横向条形图（分布类） */
export function HBarChart({ items, height }) {
  const c = useT();
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: height ? height - 40 : 0 }}>
      {items.map((it) => (
        <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 96, fontSize: 13, color: c.text2, flex: '0 0 auto', textAlign: 'right' }}>{it.name}</span>
          <div style={{ flex: 1, height: 14, background: c.page, borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(it.value / max) * 100}%`,
                height: '100%',
                background: c.brand,
                borderRadius: 999,
              }}
            />
          </div>
          <span className="dp-num" style={{ width: 28, fontSize: 13, color: c.ink, textAlign: 'right', flex: '0 0 auto' }}>
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 图例（卡头右上） */
export function Legend({ names }) {
  const c = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {names.map((n, i) => (
        <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.text2 }}>
          <span
            style={{ width: 8, height: 8, borderRadius: 2, background: c.chart[i % c.chart.length], display: 'inline-block' }}
          />
          {n}
        </span>
      ))}
    </div>
  );
}
