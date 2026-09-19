/**
 * Agent for Digital：右侧 Drawer 对话面板
 * 这是把静态 FAQ 升级为对话入口的关键设计。
 * 原型内为脚本化回复（明确标注），不接任何外部 API。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Drawer, Input, Button, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { agentReplies, agentFallback, agentPrompts, META } from '../data/mock';
import { useT } from '../theme';

const norm = (s) => (s || '').toLowerCase();

function replyFor(text) {
  const q = norm(text);
  const hit = agentReplies.find((r) => r.match.some((m) => q.includes(norm(m))));
  return hit ? hit.text : agentFallback;
}

export default function AgentDrawer({ open, onClose, seed }) {
  const c = useT();
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text:
        '我是 Agent for Digital。可以问我部门的流程、规范与既定实践，比如 SSO 接入、权限申请、库存一致性。原型阶段为脚本化回复。',
    },
  ]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const send = (value) => {
    const v = (value ?? text).trim();
    if (!v) return;
    setMessages((m) => [...m, { role: 'user', text: v }, { role: 'agent', text: replyFor(v) }]);
    setText('');
  };

  useEffect(() => {
    if (seed) {
      setMessages((m) => [...m, { role: 'user', text: seed }, { role: 'agent', text: replyFor(seed) }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
          <RobotOutlined style={{ color: c.brand }} />
          Agent for Digital
          <span className="dp-chip" style={{ background: c.page, border: `1px solid ${c.border}`, color: c.text3 }}>
            脚本化原型
          </span>
        </span>
      }
      styles={{ body: { display: 'flex', flexDirection: 'column', padding: 0 } }}
      footer={null}
      getContainer={false}
    >
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 8,
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
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
                background: m.role === 'user' ? c.brand : c.page,
                border: `1px solid ${m.role === 'user' ? c.brand : c.border}`,
                color: m.role === 'user' ? c.white : c.text2,
                fontSize: 13,
              }}
            >
              {m.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
            </span>
            <div className={`dp-bubble ${m.role === 'user' ? 'dp-bubble--user' : 'dp-bubble--agent'}`}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 12, color: c.text3, marginBottom: 8 }}>可以这样问</div>
        <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
          {agentPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className="dp-chip"
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
        </Space>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPressEnter={() => send()}
            placeholder="描述你的问题，例如「如何申请生产库只读权限」"
            style={{ borderRadius: '6px 0 0 6px' }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={() => send()} style={{ borderRadius: '0 6px 6px 0' }}>
            发送
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 10, fontSize: 12, color: c.text3 }}>
          {META.portalName} · 原型内回复为脚本示例，接入知识库后由真实服务承担
        </div>
      </div>
    </Drawer>
  );
}
