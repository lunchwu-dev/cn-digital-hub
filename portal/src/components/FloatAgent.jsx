/**
 * FloatAgent —— 悬浮 Agent doodle（02b §B）
 * ------------------------------------------------------------------
 * 设计裁决（02b §B.1）：白底 + 1.5px 品牌蓝描边 + 品牌蓝图标，52px 正圆，轻投影。
 *   · 不用「品牌蓝实心」：实心蓝是全站「当前激活导航项」的专属语义，doodle 是常驻元素，
 *     用实心蓝会在每个页面多出一个「看起来像被选中的导航项」，与激活态语义冲突。
 *   · 不用黄色：黄色语义是「内容标记」（置顶 / 里程碑 / NEW），不是操作入口。
 * 位置（02b §B.2）：fixed right:24 bottom:24，永不躲进页脚。
 * 层级（02b §B.3）：z-index 900，高于 Watermark(9)，低于 antd Modal/Drawer。
 * 提示点（02b §B.5）：8px 品牌蓝圆点，无数字、无红黄绿；首次点开面板后一次性消除。
 * 无障碍（02b §B.7）：<button type="button">、aria-label / aria-expanded / aria-haspopup /
 *   aria-controls；焦点环用品牌蓝（白底上黄只有 1.51:1）。
 */
import React from 'react';
import { MessageOutlined } from '@ant-design/icons';
import { useT } from '../theme';

export default function FloatAgent({ onClick, showDot = false, ariaExpanded = false, buttonRef }) {
  const c = useT();
  return (
    <button
      type="button"
      ref={buttonRef}
      className="dp-float-agent"
      onClick={onClick}
      aria-label={showDot ? '打开 Agent for Digital（有新功能提示）' : '打开 Agent for Digital'}
      aria-expanded={ariaExpanded ? 'true' : 'false'}
      aria-haspopup="dialog"
      aria-controls="dp-agent-panel"
    >
      <MessageOutlined style={{ fontSize: 24, color: c.brand }} />
      {showDot ? <span className="dp-float-agent-dot" aria-hidden="true" /> : null}
    </button>
  );
}
