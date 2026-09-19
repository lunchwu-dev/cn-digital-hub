/**
 * 知识中心 —— 最佳实践 / 设计规范 / FAQ
 * 核心机制：FAQ 的「没帮到我」反馈 → 进入「待补知识」队列 → 让静态 FAQ 变成活知识系统。
 */
import React, { useMemo, useState } from 'react';
import {
  Tabs,
  Input,
  Button,
  Space,
  Modal,
  Form,
  App as AntApp,
  Typography,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  LikeOutlined,
  DislikeOutlined,
  PlusOutlined,
  LinkOutlined,
  ReadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import {
  bestPractices,
  practiceCategories,
  designSpecs,
  designLinks,
  faqs,
  faqBacklog,
  META,
} from '../data/mock';
import { useT } from '../theme';
import { Panel, PanelHead, Pill, ChannelTag, ContentMeta, InitialAvatar } from '../components/ui';
import { go } from '../router';

const { Text } = Typography;

function PracticeView() {
  const c = useT();
  const [cat, setCat] = useState('全部');
  const list = useMemo(() => bestPractices.filter((b) => cat === '全部' || b.category === cat), [cat]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {practiceCategories.map((t) => {
          const active = cat === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setCat(t)}
              className="dp-chip"
              style={{
                background: active ? c.brandSubtle : c.page,
                border: `1px solid ${active ? c.brandBorder : c.border}`,
                color: active ? c.brand : c.text2,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: active ? 500 : 400,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="dp-grid dp-g3">
        {list.map((b) => (
          <Panel
            key={b.id}
            hover
            role="button"
            tabIndex={0}
            aria-label={b.title}
            style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
            onClick={() => go('#/knowledge/article/' + b.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                go('#/knowledge/article/' + b.id);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChannelTag>{b.category}</ChannelTag>
              <span className="dp-num" style={{ fontSize: 12, color: c.text3, marginLeft: 'auto' }}>
                {b.updated}
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{b.title}</div>
            <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.65, flex: 1 }}>{b.summary}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${c.border}`, paddingTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
                <InitialAvatar name={b.author} size={20} />
                {b.author}
              </span>
              <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
                约 {b.readMin} 分钟
              </span>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function SpecView() {
  const c = useT();
  return (
    <div className="dp-grid dp-g-spec" style={{ gap: 24 }}>
      <Panel>
        <PanelHead title="规范条目" desc="部门内统一执行" />
        <div style={{ padding: '0 8px' }}>
          {designSpecs.map((s) => (
            <div key={s.id} className="dp-row" style={{ alignItems: 'flex-start', cursor: 'default' }}>
              <span className="dp-mono" style={{ fontSize: 12, color: c.text3, width: 52, flex: '0 0 auto', paddingTop: 2 }}>
                {s.id}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{s.title}</div>
                <div style={{ fontSize: 13, color: c.text2, marginTop: 3, lineHeight: 1.6 }}>{s.desc}</div>
                <div style={{ fontSize: 12, color: c.text3, marginTop: 6 }}>
                  {s.owner} · 更新于 <span className="dp-num">{s.updated}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <PanelHead title="外部资产聚合" desc="设计令牌与组件库" />
          <div style={{ padding: '0 8px 8px' }}>
            {designLinks.map((l) => (
              <div key={l.id} className="dp-row" style={{ alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: c.page,
                    border: `1px solid ${c.border}`,
                    color: c.text2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <LinkOutlined />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: c.text3, marginTop: 2, lineHeight: 1.6 }}>{l.desc}</div>
                </div>
                <Pill semantic="neutral">{l.type}</Pill>
              </div>
            ))}
          </div>
        </Panel>
        <Panel style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.7 }}>
            规范由设计系统组维护。需要新增条目或修订既有规范，请在工作台「需求提交」中发起，评审通过后统一发布到本页。
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FaqView() {
  const c = useT();
  const { message } = AntApp.useApp();
  const [q, setQ] = useState('');
  const [openIds, setOpenIds] = useState([]);
  const [backlog, setBacklog] = useState(faqBacklog);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const list = useMemo(() => {
    const key = (q || '').replace(/\s+/g, '').toLowerCase();
    if (!key) return faqs;
    return faqs.filter((f) => (f.question + f.answer + f.category).toLowerCase().includes(key));
  }, [q]);

  const toggle = (id) =>
    setOpenIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const markHelpful = (f, yes) => {
    if (yes) {
      message.success('感谢反馈，已记录为「有帮助」');
    } else {
      const exists = backlog.some((b) => b.question === f.question);
      if (exists) {
        message.info('该问题已在「待补知识」队列中，我们会尽快补齐');
      } else {
        setBacklog((b) => [
          { id: 'bl-' + (b.length + 1), question: f.question, votes: 1, requestedBy: '部门成员反馈', age: '刚刚', status: 'pending' },
          ...b,
        ]);
        message.warning('已加入「待补知识」队列，内容负责人会补充后再通知');
      }
    }
  };

  const submitSupplement = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return; // 校验失败由 Form 自行提示
    }
    setBacklog((b) => [
      {
        id: 'bl-new-' + (b.length + 1),
        question: v.question,
        votes: 1,
        requestedBy: v.dept || '部门成员反馈',
        age: '刚刚',
        status: 'pending',
      },
      ...b,
    ]);
    setModalOpen(false);
    form.resetFields();
    message.success('已提交，进入「待补知识」队列');
  };

  return (
    <div>
      {/* 检索 + 提交补充 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: c.text3 }} />}
          placeholder="检索 FAQ，例如「权限」「SSO」「埋点」"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <Space size={8}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            提交补充 / 新问题
          </Button>
        </Space>
      </div>

      {/* 待补知识队列（核心机制可视化） */}
      <Panel style={{ marginBottom: 16 }}>
        <PanelHead
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              待补知识队列
              <Pill semantic="warning" dot>
                {backlog.length} 项待补
              </Pill>
            </span>
          }
          desc="成员反馈「没帮到我」的问题会进入这里，由内容负责人补齐"
          dense
        />
        <div style={{ padding: '0 8px' }}>
          {backlog.map((b) => (
            <div key={b.id} className="dp-row" style={{ cursor: 'default' }}>
              <span style={{ flex: '0 0 auto' }}>
                <Pill semantic="warning">待补</Pill>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: c.ink, fontWeight: 500 }}>{b.question}</div>
                <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>
                  来源 {b.requestedBy} · 等待 <span className="dp-num">{b.age}</span>
                </div>
              </div>
              <Pill semantic={b.status === 'inprogress' ? 'info' : 'neutral'}>
                {b.status === 'inprogress' ? '补充中' : '待认领'}
              </Pill>
              <span className="dp-num" style={{ fontSize: 12, color: c.text2, width: 56, textAlign: 'right' }}>
                {b.votes} 人关注
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* FAQ 列表 */}
      <div className="dp-grid" style={{ gap: 12 }}>
        {list.length === 0 && (
          <Panel style={{ padding: '32px', textAlign: 'center', color: c.text3 }}>
            没有匹配的 FAQ，试试
            <Button type="link" size="small" onClick={() => setModalOpen(true)} style={{ padding: '0 4px' }}>
              提交新问题
            </Button>
          </Panel>
        )}
        {list.map((f) => {
          const open = openIds.includes(f.id);
          return (
            <Panel key={f.id} hover>
              <button
                type="button"
                onClick={() => toggle(f.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <ChannelTag>{f.category}</ChannelTag>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: c.ink }}>{f.question}</span>
                <ArrowRightOutlined
                  style={{ color: c.text3, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}
                />
              </button>
              {open && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: c.text2,
                      padding: '12px 14px',
                      background: c.page,
                      borderRadius: 6,
                    }}
                  >
                    {f.answer}
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 12, color: c.text3 }}>
                      负责人 {f.owner} · 更新于 <span className="dp-num">{f.updated}</span>
                    </span>
                    <Space size={8}>
                      <Text style={{ fontSize: 12, color: c.text3 }}>这个回答有用吗？</Text>
                      <Button size="small" icon={<LikeOutlined />} onClick={() => markHelpful(f, true)}>
                        有用 <span className="dp-num">{f.helpful}</span>
                      </Button>
                      <Button size="small" danger icon={<DislikeOutlined />} onClick={() => markHelpful(f, false)}>
                        没帮到我 <span className="dp-num">{f.notHelpful}</span>
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        title="提交补充 / 新问题"
        onCancel={() => setModalOpen(false)}
        onOk={submitSupplement}
        okText="提交"
        cancelText="取消"
        destroyOnHidden
        getContainer={false}
      >
        <Form form={form} layout="vertical" className="dp-form" requiredMark={false}>
          <Form.Item
            name="question"
            label="问题描述"
            rules={[{ required: true, message: '请填写问题描述' }, { min: 6, message: '至少 6 个字，便于他人检索' }]}
          >
            <Input.TextArea rows={3} placeholder="例如：电子价签批量刷新失败如何定位？" />
          </Form.Item>
          <Form.Item name="dept" label="你的团队 / 姓名">
            <Input placeholder="例如：门店数字化组 · 吴桐" />
          </Form.Item>
          <Form.Item name="detail" label="补充说明（可选）">
            <Input.TextArea rows={2} placeholder="你在什么场景下遇到、已经尝试过什么" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function Knowledge() {
  const c = useT();
  const [tab, setTab] = useState('practice');

  const items = [
    { key: 'practice', label: '最佳实践', children: <PracticeView /> },
    { key: 'spec', label: '设计规范', children: <SpecView /> },
    {
      key: 'faq',
      label: (
        <span>
          FAQ <Badge count={faqBacklog.length} size="small" color={c.warning} offset={[6, -2]} />
        </span>
      ),
      children: <FaqView />,
    },
  ];

  return (
    <div className="dp-shell">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>知识中心</h1>
          <span style={{ fontSize: 14, color: c.text2 }}>最佳实践、设计规范与可检索的 FAQ</span>
        </div>
        <ContentMeta owner="设计系统组 · 周敏 / 内容运营 · 孙玥" updated={META.updated} style={{ marginTop: 10 }} />
      </div>

      <Tabs activeKey={tab} onChange={setTab} items={items} />

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
        <ReadOutlined /> 知识条目超过 90 天未更新会自动进入待复核队列；「待补知识」由内容负责人每周三集中补齐。
      </div>
    </div>
  );
}
