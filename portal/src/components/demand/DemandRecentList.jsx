/**
 * 公开列表（需求提交记录）——首页与需求提交页共用一个组件。
 * ------------------------------------------------------------------
 * 产品判据（决策 3）：「提交页不能只有表单，必须能看到别人提了什么、处理到哪一步。
 * 只有入口没有公开列表，用户会认为它是个黑洞，从而继续走 IM 提需求。」
 * 因此本组件在提交页**不得折叠隐藏**，且必须与表单同屏。
 *
 * 视觉约束：
 *  - 行必须复用 global.css 的 .dp-row（56px / hover #F5F4F5 / 末行无下边框）
 *  - 需求编号 / 提交时间一律 dp-mono、dp-num（C11 等宽数字）
 *  - 状态胶囊 semantic 取自 demandStatusMap（需求「状态」允许 info/success；计数不允许）
 *  - 整行 role=button + tabindex=0（.dp-row:focus-visible 已有焦点环，无需补 CSS）
 */
import React from 'react';
import { Empty } from 'antd';
import { demandStatusMap } from '../../data/mock';
import { useT } from '../../theme';
import { Pill, InitialAvatar } from '../ui';

const FALLBACK = { label: '待处理', semantic: 'neutral' };

export default function DemandRecentList({ rows, max = 6, onItemClick }) {
  const c = useT();
  const list = (rows || []).slice(0, max);

  if (list.length === 0) {
    return (
      <div style={{ padding: '28px 16px' }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ fontSize: 13, color: c.text3 }}>还没有提交记录</span>} />
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 8px 6px' }}>
      {list.map((r) => {
        const m = demandStatusMap[r.status] || FALLBACK;
        return (
          <div
            key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => onItemClick && onItemClick(r.id)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onItemClick) {
                e.preventDefault();
                onItemClick(r.id);
              }
            }}
            className="dp-row"
            style={{ alignItems: 'flex-start' }}
          >
            <span
              className="dp-mono"
              style={{ fontSize: 12, color: c.text3, width: 108, flex: '0 0 auto', paddingTop: 3 }}
            >
              {r.id}
            </span>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: c.ink,
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 3,
                  fontSize: 12,
                  color: c.text3,
                  flexWrap: 'wrap',
                }}
              >
                <span className="dp-num">{r.submitted}</span>
                <span>·</span>
                <span>{r.assignee || '待分配'}</span>
              </div>
            </div>

            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingTop: 2,
              }}
            >
              <InitialAvatar name={r.assignee} size={24} />
              <Pill semantic={m.semantic} dot>
                {m.label}
              </Pill>
            </div>
          </div>
        );
      })}
    </div>
  );
}
