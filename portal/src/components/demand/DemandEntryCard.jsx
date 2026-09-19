/**
 * 首页「需求提交」入口大卡（服务台语气）。
 * ------------------------------------------------------------------
 * 视觉裁决（见 spec 第 1.2 / 2.2 节）：
 *  - **白底 + 4px 品牌蓝左边框**，不做整块品牌蓝实底。
 *    理由：首页只有一个 #3643BA 实底元素（顶栏 active）；实底大卡会夺走置顶决议的第一优先级，
 *    并把品牌蓝从「强调色」贬值成「面积色」。
 *  - **4px 是全页唯一**：置顶决议固定 3px。这就是「单张重点卡」的唯一性声明。
 *  - 主按钮用 type="primary" 实心品牌蓝——把饱和度集中在一枚 34px 胶囊里，而不是铺满 300×168px。
 *  - **禁用 YellowMark**（黄色留给置顶/里程碑/NEW）。
 *
 * 内部竖排顺序：① 标题 → ② 承诺 → ③ 状态摘要 → ④ 按钮行。
 * 摘要必须在按钮上方：先给「别人也在提、有人已经在处理」的社会证明，再给行动按钮。
 *
 * 语义色约束（C2 / C10）：三个计数一律不挂 Pill、不用任何语义色。
 * 这是「需求量分布」，不是「健康状态」；语义色的契约是「红黄绿 = 稳定性状态」。
 */
import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useT } from '../../theme';
import { StatusDot } from '../ui';

function StatSegment({ label, value, divider }) {
  const c = useT();
  return (
    <div
      style={{
        flex: '1 1 auto',
        minWidth: 88,
        paddingLeft: divider ? 16 : 0,
        borderLeft: divider ? `1px solid ${c.border}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          className="dp-num"
          style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.15, color: c.ink, letterSpacing: '-0.02em' }}
        >
          {value}
        </span>
        <StatusDot semantic="neutral" size={8} />
      </div>
      <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function DemandEntryCard({ stats, copy, onSubmit, onGuide }) {
  const c = useT();
  return (
    <div
      className="dp-card dp-demand-entry"
      style={{ position: 'relative', overflow: 'hidden', gridColumn: 'span 2' }}
    >
      {/* 全页唯一一处 4px 强调条 */}
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.brand }} />
      <div className="dp-demand-entry-body" style={{ padding: '20px 24px 20px 26px' }}>
        {/* ① 这是什么 */}
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 500, color: c.ink, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
          {copy.headline}
        </h3>

        {/* ② 我为什么该用（一条承诺，不写成 bullet） */}
        <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 400, color: c.text2, lineHeight: 1.65 }}>
          {copy.promise}
        </p>

        {/* ③ 现在多少人提、到哪了 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            flexWrap: 'wrap',
            gap: '12px 0',
            marginBottom: 18,
            borderTop: `1px solid ${c.border}`,
            borderBottom: `1px solid ${c.border}`,
            padding: '12px 0',
          }}
        >
          <StatSegment label="待处理" value={stats.pending} />
          <StatSegment label="进行中" value={stats.inprogress} divider />
          <StatSegment label="已完成" value={stats.done} divider />
        </div>

        {/* ④ 按钮行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onSubmit}>
            {copy.primaryCta}
          </Button>
          <Button type="link" style={{ padding: 0, fontSize: 14 }} onClick={onGuide}>
            {copy.secondaryCta}
          </Button>
        </div>
      </div>
    </div>
  );
}
