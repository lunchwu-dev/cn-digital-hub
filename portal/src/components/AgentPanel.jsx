/**
 * AgentPanel —— Agent for Digital 轻面板（由原 AgentDrawer 改造，02b §B.4 + §C.1）
 * ------------------------------------------------------------------
 * 形态裁决（02b §B.4）：不再是右侧全高 Drawer，而是右下角 380×560 贴边浮窗。
 *   · Drawer 与右下角的 doodle 几何冲突、默认带遮罩阻断背景交互、语义是「进入次级页面」，
 *     三者都与「伴随式能力、随时可用」的诉求相反。
 *   · 改为 position:fixed 的容器 div（className="dp-agent-panel"），无遮罩、非模态。
 *   · aria-modal="false"：面板不阻断背景交互，声明 true 会错误锁死屏幕阅读器的背景导航。
 * 反馈能力（02b §C.1）：反馈不再是 TopBar 的独立入口，而是 Agent 的结构化能力 ——
 *   命中反馈意图 → 回复带「登记为反馈」动作 → 点击后气泡内展开内联表单
 *   （类型 Select + 内容 TextArea，内容预填用户原话）→ 提交后气泡内确认。
 * 原型内为脚本化回复（明确披露），不接任何外部 API。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Space, Select, App as AntdApp } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import {
  agentReplies,
  agentFallback,
  agentPrompts,
  agentFeedbacksIntent,
  feedbackKinds,
  META,
} from '../data/mock';
import { useT } from '../theme';

const norm = (s) => (s || '').toLowerCase();

/**
 * 回复脚本（02b §C.1 ②）：返回值从「字符串」扩展为「{ text, action? }」。
 * 反馈意图最高优先：命中则返回动作型回复。
 */
function replyFor(text) {
  const q = norm(text);
  if (agentFeedbacksIntent.match.some((m) => q.includes(norm(m)))) {
    return {
      action: 'feedback',
      text: '听起来这是对门户本身的意见 —— 我帮你直接登记成反馈，门户 Owner 会跟进。',
    };
  }
  const hit = agentReplies.find((r) => r.match.some((m) => q.includes(norm(m))));
  return { text: hit ? hit.text : agentFallback };
}

/** 依据用户原话推荐反馈类型（Agent 相比静态表单的唯一实质增值，02b §C.1）—— 推荐、用户确认，不自动归类 */
function recommendKind(text) {
  const q = norm(text);
  if (q.includes(norm('找不到')) || q.includes(norm('入口')) || q.includes(norm('导航'))) return 'ia';
  if (q.includes(norm('希望能')) || q.includes(norm('能不能加')) || q.includes(norm('建议'))) return 'idea';
  if (q.includes(norm('内容')) || q.includes(norm('更新')) || q.includes(norm('缺失'))) return 'content';
  if (q.includes(norm('显示')) || q.includes(norm('交互')) || q.includes(norm('bug')) || q.includes(norm('不好用')))
    return 'ui';
  return undefined; // 默认不预选，让用户主动归类
}

/* 单条反馈气泡：常驻的 action 按钮 / 展开的内联表单 / 提交后的确认，都在同一气泡内 */
function FeedbackBubble({ msg, index, c, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(() => recommendKind(msg.sourceText || ''));
  const [detail, setDetail] = useState(msg.sourceText || '');
  const [doneNo, setDoneNo] = useState(null);

  const submit = () => {
    // 编号 FB-2026-XXX（与需求 REQ- 区分），前端生成；不落 demandHistory（反馈与需求两条流水）
    const no = String(14 + index).padStart(3, '0');
    setDoneNo(no);
    setOpen(false);
    if (onSubmitted) onSubmitted(no);
  };

  if (doneNo) {
    return (
      <div className="dp-bubble dp-bubble--agent">
        已登记（FB-2026-{doneNo}）。门户 Owner 会在 2 个工作日内受理，处理进展会在本对话里同步给你。
      </div>
    );
  }

  return (
    <div className="dp-bubble dp-bubble--agent">
      <div>{msg.text}</div>

      {!open ? (
        <div style={{ marginTop: 10 }}>
          <Button type="primary" ghost size="small" onClick={() => setOpen(true)}>
            登记为反馈
          </Button>
        </div>
      ) : (
        <div className="dp-form" style={{ marginTop: 12, borderTop: `1px solid ${c.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: c.text3, lineHeight: 1.6, marginBottom: 10 }}>
            登记后由门户 Owner 受理，与业务需求分开跟进。本原型不真实发送。
          </div>
          <div style={{ fontSize: 12, color: c.text3, marginBottom: 4 }}>反馈类型</div>
          <Select
            value={kind}
            placeholder="请选择"
            options={feedbackKinds}
            getContainer={false} /* 红线 2：浮层必须挂 getContainer={false} */
            style={{ width: '100%', marginBottom: 12 }}
            onChange={setKind}
          />
          <div style={{ fontSize: 12, color: c.text3, marginBottom: 4 }}>反馈内容</div>
          <Input.TextArea
            rows={3}
            maxLength={300}
            value={detail}
            placeholder="请描述你遇到的问题或建议…"
            onChange={(e) => setDetail(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <Space size={8}>
            <Button type="primary" size="small" onClick={submit}>
              提交反馈
            </Button>
            <Button size="small" onClick={() => setOpen(false)}>
              取消
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}

export default function AgentPanel({ open, onClose, seed, onFirstOpen }) {
  const c = useT();
  const { message } = AntdApp.useApp();
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
    const reply = replyFor(v);
    setMessages((m) => [
      ...m,
      { role: 'user', text: v },
      { role: 'agent', text: reply.text, action: reply.action, sourceText: v },
    ]);
    setText('');
  };

  useEffect(() => {
    if (seed) {
      const reply = replyFor(seed);
      setMessages((m) => [
        ...m,
        { role: 'user', text: seed },
        { role: 'agent', text: reply.text, action: reply.action, sourceText: seed },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  // 首次点开时消除提示点（一次性，永不再现）—— 02b §B.5
  useEffect(() => {
    if (open && onFirstOpen) onFirstOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc 关闭（焦点归还由 App 层负责，02b §B.7）—— 面板内监听 keydown
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmitted = (no) => {
    message.success(`反馈已登记（FB-2026-${no}），门户 Owner 会在 2 个工作日内受理`);
  };

  /* 显式反馈入口（本轮新增的兜底）：
     关键词识别终究会漏（实测「这个页面导航有点乱」原词表就漏检），
     一旦漏检，用户就没有任何可发现的方式登记反馈 —— 因为原「站点反馈」入口已被移除。
     这里提供一个**不依赖关键词**的直接通道：点一下就进反馈表单。
     关键词识别因此从「唯一入口」降级为「捷径」，漏检不再等于功能不可达。 */
  const startFeedback = () => {
    setMessages((m) => [
      ...m,
      { role: 'user', text: '我要提个反馈' },
      {
        role: 'agent',
        text: '好 —— 直接填在这里就行。登记后由门户 Owner 受理，与业务需求分开跟进。',
        action: 'feedback',
        sourceText: '我要提个反馈',
      },
    ]);
    setText('');
  };

  return (
    <div
      className="dp-agent-panel"
      id="dp-agent-panel"
      data-open={open ? 'true' : 'false'}
      role="dialog"
      aria-label="Agent for Digital"
      aria-modal="false"
    >
      {/* 头部标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: `1px solid ${c.border}`,
          fontSize: 15,
          flex: '0 0 auto',
        }}
      >
        <RobotOutlined style={{ color: c.brand }} />
        <span style={{ fontWeight: 500, color: c.ink }}>Agent for Digital</span>
        <span className="dp-chip" style={{ background: c.page, border: `1px solid ${c.border}`, color: c.text3 }}>
          脚本化原型
        </span>
        <button
          type="button"
          className="dp-agent-panel-close"
          aria-label="关闭 Agent for Digital"
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            border: 'none',
            background: 'transparent',
            color: c.text3,
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* 对话列表 */}
      <div
        ref={listRef}
        style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
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
            {m.role === 'agent' && m.action === 'feedback' ? (
              <FeedbackBubble msg={m} index={i} c={c} onSubmitted={handleSubmitted} />
            ) : (
              <div className={`dp-bubble ${m.role === 'user' ? 'dp-bubble--user' : 'dp-bubble--agent'}`}>{m.text}</div>
            )}
          </div>
        ))}
      </div>

      {/* 快捷问题 + 输入区 */}
      <div style={{ padding: 16, borderTop: `1px solid ${c.border}`, flex: '0 0 auto' }}>
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
          {/* 显式反馈入口：与知识问答并列，一眼可见，不靠关键词命中 */}
          <button
            type="button"
            onClick={startFeedback}
            className="dp-chip"
            style={{
              background: c.surface,
              border: `1px solid ${c.brandBorder}`,
              color: c.brand,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            title="对门户本身的意见、建议或问题，登记后由门户 Owner 跟进"
          >
            <MessageOutlined style={{ fontSize: 11, marginRight: 4 }} />
            提个反馈
          </button>
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
        <div style={{ marginTop: 10, fontSize: 12, color: c.text3, lineHeight: 1.6 }}>
          {META.portalName} · 原型内回复为脚本示例，接入知识库后由真实服务承担。反馈登记同样为原型示意。
        </div>
      </div>
    </div>
  );
}
