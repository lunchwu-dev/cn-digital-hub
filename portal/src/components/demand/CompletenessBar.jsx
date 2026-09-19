/**
 * 「资料完整度」面板（spec 第 6 节）。
 * ------------------------------------------------------------------
 * 命名铁律：叫「资料完整度」不叫「分数 / 评分 / 满分」。
 *   叫「分数」会把 agent 变成评分官，用户会为了刷分写废话（「这个需求很重要，希望尽快处理」）；
 *   叫「完整度」语义指向「资料齐不齐」，与「补上这句会更快被受理」的行为引导同向。
 *
 * 视觉铁律（C2）：
 *  - 进度条**永远只有品牌蓝**，低位（<40%）也不变色。低完整度不是错误，是「还没写完」。
 *  - 命中 / 部分命中 / 未命中只用三种**中性视觉**：品牌蓝实心圆 / 品牌蓝描边圆 / 中性空心圆。
 *  - **一次都不碰红黄绿**；不给逐项分值，给一行行动提示。
 *  - 百分比、计数一律 dp-num（C11）。
 *  - 折叠 / 展开状态内部自管；切档位或刷新回折叠态（不持久化）。
 */
import React, { useState } from 'react';
import { Button } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined, MinusCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useT } from '../../theme';

const STATE_META = {
  full: { label: '已具备' },
  partial: { label: '说到一半' },
  none: { label: '待补充' },
};

function StateIcon({ state }) {
  const c = useT();
  if (state === 'full') return <CheckCircleFilled style={{ fontSize: 13, color: c.brand }} />;
  if (state === 'partial') return <ClockCircleOutlined style={{ fontSize: 13, color: c.brand }} />;
  return <MinusCircleOutlined style={{ fontSize: 13, color: c.textDisabled }} />;
}

export default function CompletenessBar({ pct, summary, items, defaultOpen = false }) {
  const c = useT();
  const [open, setOpen] = useState(defaultOpen);
  const list = items || [];
  const fullCount = list.filter((i) => i.state === 'full').length;

  return (
    <div style={{ borderTop: `1px solid ${c.border}` }}>
      {/* 折叠行：整体可点 */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 44,
          padding: '10px 0',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <span style={{ fontSize: 13, color: c.text2, flex: '0 0 auto' }}>资料完整度</span>

        {/* 轨道 */}
        <span
          style={{
            flex: 1,
            minWidth: 60,
            height: 6,
            background: c.grid,
            borderRadius: 999,
            overflow: 'hidden',
            display: 'inline-block',
          }}
        >
          {/* 填充：永远品牌蓝 */}
          <span
            style={{
              display: 'block',
              height: '100%',
              minWidth: 6,
              width: `${pct}%`,
              background: c.brand,
              borderRadius: 999,
              transition: 'width .24s ease',
            }}
          />
        </span>

        <span
          className="dp-num"
          style={{ fontSize: 15, fontWeight: 500, color: c.ink, minWidth: 44, textAlign: 'right', flex: '0 0 auto' }}
        >
          {pct}%
        </span>

        <Button
          type="link"
          size="small"
          style={{ padding: 0, flex: '0 0 auto' }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {open ? '收起明细' : '展开明细'} {open ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
        </Button>
      </div>

      {/* 总评一句话（一句话，不做审判） */}
      <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.65, paddingBottom: open ? 8 : 12 }}>{summary}</div>

      {/* 展开后的逐项（D1→D5 固定顺序，不按得分排序） */}
      {open ? (
        <div style={{ paddingBottom: 12 }}>
          <div style={{ fontSize: 12, color: c.text3, paddingBottom: 8 }}>
            <span className="dp-num">{pct}%</span> · 5 项里 <span className="dp-num">{fullCount}</span> 项已具备
          </div>
          {list.map((it, i) => {
            const meta = STATE_META[it.state] || STATE_META.none;
            return (
              <div
                key={it.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 0',
                  minHeight: 40,
                  borderTop: i === 0 ? 'none' : `1px solid ${c.border}`,
                }}
              >
                <span style={{ flex: '0 0 auto', paddingTop: 3 }}>
                  <StateIcon state={it.state} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: c.ink }}>{it.name}</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: it.state === 'partial' ? c.text2 : c.text3,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: c.text3, marginTop: 2, lineHeight: 1.6 }}>{it.hint}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
