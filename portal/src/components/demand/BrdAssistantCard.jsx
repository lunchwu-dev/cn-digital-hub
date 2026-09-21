/**
 * BRD 协作助手（内联卡，常驻右栏）—— spec 第 7 节。
 * ------------------------------------------------------------------
 * 形态裁决：**可收起的内联提示卡，不是 Drawer**。
 *   ① Drawer 会遮挡表单（420px 从右滑入），而需求是「与表单共存、不遮挡」；
 *   ② agent 的定位是协作者、随填随看，抽屉要在「打开→看→关」之间来回，反而增加成本；
 *   ③ 右栏本来就空着，把 agent 放进去是零新增面积。
 *   **不做 Drawer 第二入口**（避免同一能力两个入口造成困惑）。
 *
 * 沿用 AgentDrawer 的脚本化范式（C7）：
 *   脚本化披露胶囊 / 头像方块 26×26 / .dp-bubble--agent 气泡 / brandSubtle chips。
 *
 * 定位是**协作者不是评分官**（行为契约）：
 *   - 初次进入：降低门槛，不报分数、不列 8 项清单
 *   - 用户填了内容：先肯定已填项，**只给一条**建议
 *   - 达标（≥80%）：停止给建议，不为了显得有用而硬提
 *   **铁律：气泡里任何时刻不得同时出现 2 条以上「待改」建议。**
 *   因此：新的建议总是替换掉旧的「最新一条」（pending），历史问答保留。
 *   —— 注意：用户点「可以这样问」的快捷问题时**不清空**当前建议，
 *      只在建议之后追加一组 Q&A，这样用户不会「为了提问而丢掉刚拿到的建议」。
 */
import React, { useEffect, useRef, useState } from 'react';
import { RobotOutlined } from '@ant-design/icons';
import { brdPrompts, brdScriptedReplies, brdAgentIntro } from '../../data/mock';
import { useT } from '../../theme';
import { Panel, PanelHead } from '../ui';

export default function BrdAssistantCard({ advice, prompts = brdPrompts }) {
  const c = useT();
  const [messages, setMessages] = useState([{ role: 'agent', text: brdAgentIntro }]);
  const listRef = useRef(null);

  /* 当表单状态给出新的「唯一一条」建议时，用新建议**替换**掉上一条 pending 建议——
     这样气泡里永远不会同时出现 2 条待改建议，但历史 Q&A 完整保留。 */
  useEffect(() => {
    if (!advice) return;
    setMessages((m) => {
      const history = m.filter((x) => !x.pending);
      return [...history, { role: 'agent', text: advice, pending: true }];
    });
  }, [advice]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  /* 点快捷问题：保留当前建议（pending 不动），只在其后追加 Q&A。
     用户不会因为「想问一句」而丢掉刚拿到的建议。 */
  const ask = (p) => {
    const hit = brdScriptedReplies.find((r) => r.match.some((m) => p.includes(m)));
    setMessages((m) => [...m.filter((x) => !x.pending), { role: 'user', text: p }, { role: 'agent', text: hit ? hit.text : brdAgentIntro }]);
  };

  return (
    <Panel style={{ overflow: 'hidden' }}>
      <PanelHead
        title="BRD 协作助手"
        dense
        extra={
          <span
            className="dp-chip"
            style={{ background: c.page, border: `1px solid ${c.border}`, color: c.text3 }}
          >
            脚本化原型
          </span>
        }
      />

      <div
        ref={listRef}
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                flex: '0 0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                background: m.role === 'user' ? c.brand : c.page,
                border: `1px solid ${m.role === 'user' ? c.brand : c.border}`,
                color: m.role === 'user' ? c.white : c.text2,
              }}
            >
              {m.role === 'user' ? '我' : <RobotOutlined />}
            </span>
            <div className={`dp-bubble ${m.role === 'user' ? 'dp-bubble--user' : 'dp-bubble--agent'}`}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 12, color: c.text3, marginBottom: 8 }}>可以这样问</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              className="dp-chip"
              onClick={() => ask(p)}
              style={{
                background: c.brandSubtle,
                border: `1px solid ${c.brandBorder}`,
                color: c.brand,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: c.text3, lineHeight: 1.6 }}>
          原型内回复为脚本示例，不接任何真实模型；接入知识库后由真实服务承担。
        </div>
      </div>
    </Panel>
  );
}
