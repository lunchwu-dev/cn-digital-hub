/**
 * 字段级 agent（「2 级半」的就地建议挂点）—— §E.1
 * ==================================================================
 * 形态：字段标签行内的 RobotOutlined 小图标按钮（`.dp-field-agent`，
 *   24×24 点击区，样式已在 global.css 定义：静止中性、hover 品牌蓝）。
 *   点击后在该字段下方就地展开一行建议（`.dp-field-agent-hint`：引用块样式，
 *   左侧 2px 品牌蓝竖线，margin-top: 8px）。
 *
 * 立场（本页核心裁决）：**agent 只建议、绝不代笔** ——
 *   不自动填充、不改写任何字段值。用户必须自己把话说清，这正是本页存在的理由。
 *
 * 防重复（§E.1 ③）：右栏 BrdAssistantCard 承载 agentAdvice() 输出的「全局唯一一条」。
 *   若本字段旁要说的话与它同指一个字段，则这里只显示一行指路
 *   「这条建议已高亮在右侧协作卡里 →」，不重复长文本。
 *
 * 无障碍：aria-label="打开「X」字段的填写建议"、aria-expanded、aria-controls。
 *   点击目标 24px（已知豁免，§F.6 A10：非主要操作，放大点击区会破坏行高）。
 */
import React from 'react';
import { RobotOutlined } from '@ant-design/icons';

/** 字段 → 就地建议文案（复用/扩展 brdScriptedReplies 语料，中文散文，不用 dp-num） */
export const FIELD_ADVICE = {
  title:
    '标题写「谁在什么场景下遇到什么」就够，比如「门店盘点时库存对不上账，希望定位到具体环节」。避免「优化一下」这类写法，受理人检索时找不到。',
  current:
    '现状里只写「现在是什么现象」（对不上、超时、没人知道），解决办法留到「期望结果」写——受理人要靠现状判断该不该做。',
  expected: '写「希望达到什么」，别写「加个什么按钮」。加按钮是手段，说清目标受理人才能给出更好的方案。',
  acceptance: '建议句式「当……时，视为完成」。写不出真的可以跳过，不影响提交。',
  scale: '不用精确。点三组胶囊就行：影响多少人、多频繁、是否阻塞业务。受理人用它是排优先级，不是做考核。',
  systems: '说不清就选「说不清，帮我定位」，照样能提交。等于让受理人替你找系统，比硬填一个错的更省事。',
};

/** 无专属建议时的引导语（不做禁用态 —— 禁用会让人不知道理由） */
const FALLBACK_GUIDE = '这个字段先写现状就行，想到哪写到哪，我帮你理。';

/**
 * 返回两个节点：图标按钮（挂在标签行内）+ 展开的建议行。
 * 建议行用 flexBasis:100% 迫使它换到标签行的下一行（在控件上方紧贴），
 * **不用 absolute**，否则浮层会盖住下方输入控件。
 */
export default function FieldAgent({ topic, label, open, onToggle, suppressed = false, adviceOverride }) {
  const panelId = `dp-field-advice-${topic}`;
  const text = adviceOverride || FIELD_ADVICE[topic] || FALLBACK_GUIDE;

  return (
    <>
      <button
        type="button"
        className="dp-field-agent"
        aria-label={`打开「${label}」字段的填写建议`}
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={panelId}
        /* 防重复状态**显式落成属性**：建议已由右栏协作卡高亮时置 true。
           不写成「仅展开后可见的文案」，否则外部（含测试、含读屏器）
           在收起态下无从判断该字段的建议是否已被别处承担 —— 上一版即因此
           让「adviceTopic 退化为只认 current」这个 bug 长期不可见。 */
        data-suppressed={suppressed ? 'true' : 'false'}
        onClick={(e) => {
          e.preventDefault();
          onToggle(topic);
        }}
      >
        <RobotOutlined />
      </button>
      {open ? (
        <div id={panelId} role="note" className="dp-field-agent-hint" style={{ flexBasis: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{suppressed ? '这条建议已高亮在右侧协作卡里 →' : text}</span>
            <button
              type="button"
              aria-label="收起建议"
              onClick={(e) => {
                e.preventDefault();
                onToggle(topic);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                flex: '0 0 auto',
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
