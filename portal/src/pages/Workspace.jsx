/**
 * 工作台 —— 工具导航（服务目录） / 组织速查 / 需求提交
 * 工具导航是本产品的高价值模块：每张卡都有 Owner 与状态，是「服务目录」而非链接墙。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Input, Button, Space, Table, Modal, Form, Select, App as AntApp, Typography } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  KeyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  toolGroups,
  orgPeople,
  demandTypes,
  demandHistory,
  demandStatusMap,
  workspaceTabs,
  META,
} from '../data/mock';
import { useT } from '../theme';
import { Panel, Pill, ContentMeta, SectionTitle, InitialAvatar, StatusDot } from '../components/ui';
import { IconByName } from '../components/icons';

const { Text } = Typography;

/* ------------------------------ 工具导航 ------------------------------ */
function ToolsView({ focusGroup }) {
  const c = useT();
  const { message } = AntApp.useApp();
  const [active, setActive] = useState(toolGroups[0].key);
  const [permOpen, setPermOpen] = useState(null);
  const [form] = Form.useForm();

  const scrollTo = (key) => {
    setActive(key);
    const el = document.getElementById('grp-' + key);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 支持深链：#/workspace/tools/<groupKey> 直接定位到具体工具分组
  useEffect(() => {
    if (!focusGroup || !toolGroups.some((g) => g.key === focusGroup)) return;
    scrollTo(focusGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusGroup]);

  const submitPerm = async () => {
    try {
      await form.validateFields();
    } catch {
      return; // 校验失败由 Form 自行提示，这里必须吞掉 rejection
    }
    setPermOpen(null);
    form.resetFields();
    message.success('权限申请已提交，将进入需求提交列表跟进');
  };

  return (
    <div className="dp-grid dp-g-tools" style={{ gap: 24, alignItems: 'start' }}>
      <aside style={{ position: 'sticky', top: 76 }}>
        <Panel>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.border}`, fontSize: 13, fontWeight: 500, color: c.ink }}>
            工具分组
          </div>
          <div style={{ padding: '8px 6px 10px' }}>
            {toolGroups.map((g) => {
              const on = active === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  className="dp-toolgroup"
                  data-active={on ? 'true' : 'false'}
                  aria-current={on ? 'true' : undefined}
                  onClick={() => scrollTo(g.key)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: on ? c.brandSubtle : 'transparent',
                    color: on ? c.brand : c.text2,
                    fontWeight: on ? 500 : 400,
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  {g.label}
                  <span className="dp-num" style={{ color: c.textDisabled }}>
                    {g.tools.length}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {toolGroups.map((g) => (
          <section key={g.key} id={'grp-' + g.key}>
            <SectionTitle title={g.label} desc={`${g.tools.length} 个工具`} />
            <div className="dp-grid dp-g3">
              {g.tools.map((t) => (
                <Panel key={t.key} hover style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: c.page,
                        border: `1px solid ${c.border}`,
                        color: c.text2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      <IconByName name={t.icon} />
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
                      <StatusDot semantic={t.status} />
                      {t.statusLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: c.ink, lineHeight: 1.4 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.6, flex: 1 }}>{t.purpose}</div>
                  <div style={{ fontSize: 12, color: c.text3, borderTop: `1px solid ${c.border}`, paddingTop: 10 }}>
                    Owner <span style={{ color: c.text2 }}>{t.owner}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Pill semantic="neutral">{t.perm}</Pill>
                    <Button size="small" type="primary" ghost icon={<KeyOutlined />} onClick={() => setPermOpen(t)}>
                      申请权限
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={!!permOpen}
        title={permOpen ? `申请权限 · ${permOpen.name}` : ''}
        onCancel={() => setPermOpen(null)}
        onOk={submitPerm}
        okText="提交申请"
        cancelText="取消"
        destroyOnHidden
        getContainer={false}
      >
        {permOpen ? (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: c.page, borderRadius: 6, fontSize: 12, color: c.text2, lineHeight: 1.6 }}>
            当前工具 Owner：<strong style={{ color: c.ink }}>{permOpen.owner}</strong> · 权限说明：{permOpen.perm}
          </div>
        ) : null}
        <Form form={form} layout="vertical" className="dp-form" requiredMark={false}>
          <Form.Item name="account" label="你的账号 / 团队" rules={[{ required: true, message: '请填写账号或团队' }]}>
            <Input placeholder="例如：会员增长组 · 陈思远" />
          </Form.Item>
          <Form.Item name="reason" label="申请理由" rules={[{ required: true, message: '请填写申请理由' }, { min: 6, message: '至少 6 个字' }]}>
            <Input.TextArea rows={3} placeholder="说明使用场景与预计使用时长" />
          </Form.Item>
          <Form.Item name="days" label="预计使用时长" initialValue="90">
            <Select
              options={[
                { value: '30', label: '30 天' },
                { value: '90', label: '90 天（默认）' },
                { value: '180', label: '180 天' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ------------------------------ 组织速查 ------------------------------ */
function OrgView() {
  const c = useT();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const key = (q || '').replace(/\s+/g, '').toLowerCase();
    if (!key) return orgPeople;
    return orgPeople.filter((p) =>
      (p.name + p.dept + p.role + p.email + p.location + (p.tags || []).join('')).toLowerCase().includes(key)
    );
  }, [q]);

  const columns = [
    {
      title: '成员',
      dataIndex: 'name',
      width: 150,
      render: (v) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <InitialAvatar name={v} size={28} />
          <span style={{ fontWeight: 500, color: c.ink }}>{v}</span>
        </span>
      ),
    },
    { title: '团队', dataIndex: 'dept', width: 168, render: (v) => <span style={{ color: c.text2 }}>{v}</span> },
    { title: '角色', dataIndex: 'role', width: 156, render: (v) => <span style={{ color: c.ink }}>{v}</span> },
    {
      title: '专长 / 关注',
      dataIndex: 'tags',
      render: (tags) => (
        <Space size={[6, 6]} wrap>
          {(tags || []).map((t) => (
            <Pill key={t} semantic="neutral">
              {t}
            </Pill>
          ))}
        </Space>
      ),
    },
    { title: '办公地点', dataIndex: 'location', width: 132, render: (v) => <span style={{ color: c.text2 }}>{v}</span> },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 188,
      render: (v) => <span className="dp-mono" style={{ fontSize: 12, color: c.text2 }}>{v}</span>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: c.text3 }} />}
          placeholder="按姓名 / 团队 / 专长检索，例如「门店」「SSO」"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 380 }}
        />
        <Text style={{ fontSize: 12, color: c.text3 }}>
          共 <span className="dp-num">{list.length}</span> 位成员 · 仅展示部门内公开信息
        </Text>
      </div>
      <Panel style={{ overflow: 'hidden' }}>
        <Table className="dp-table-compact" rowKey="email" columns={columns} dataSource={list} pagination={false} size="middle" scroll={{ x: 960 }} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 需求提交 ------------------------------ */
function DemandView() {
  const c = useT();
  const { message } = AntApp.useApp();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(demandHistory);
  const [form] = Form.useForm();

  const submit = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return; // 校验失败由 Form 自行提示
    }
    const typeLabel = (demandTypes.find((d) => d.value === v.type) || {}).label || v.type;
    setRows((r) => [
      {
        id: 'REQ-2026-' + String(930 + r.length).slice(-3),
        title: v.title,
        type: typeLabel,
        status: 'pending',
        submitted: '2026-09-17',
        assignee: '待分配',
        note: v.detail ? v.detail.slice(0, 20) : '待处理',
      },
      ...r,
    ]);
    setOpen(false);
    form.resetFields();
    message.success('需求已提交，可在下方历史中跟踪状态');
  };

  const columns = [
    {
      title: '需求编号',
      dataIndex: 'id',
      width: 128,
      render: (v) => <span className="dp-mono" style={{ fontSize: 12, color: c.text2 }}>{v}</span>,
    },
    { title: '标题', dataIndex: 'title', ellipsis: true, render: (v) => <span style={{ color: c.ink, fontWeight: 500 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', width: 156, render: (v) => <Pill semantic="neutral">{v}</Pill> },
    { title: '处理人', dataIndex: 'assignee', width: 96, render: (v) => <span style={{ color: c.text2 }}>{v}</span> },
    {
      title: '提交时间',
      dataIndex: 'submitted',
      width: 116,
      render: (v) => <span className="dp-num" style={{ color: c.text2 }}>{v}</span>,
    },
    { title: '备注', dataIndex: 'note', width: 180, ellipsis: true, render: (v) => <span style={{ color: c.text3, fontSize: 12 }}>{v}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 108,
      render: (v) => {
        const m = demandStatusMap[v] || demandStatusMap.pending;
        return <Pill semantic={m.semantic} dot>{m.label}</Pill>;
      },
    },
  ];

  const stats = [
    { key: 'pending', label: '待处理', icon: <InboxOutlined />, semantic: 'neutral' },
    { key: 'inprogress', label: '进行中', icon: <SyncOutlined />, semantic: 'info' },
    { key: 'done', label: '已完成', icon: <CheckCircleOutlined />, semantic: 'success' },
  ];

  return (
    <div>
      <div className="dp-grid dp-g3" style={{ marginBottom: 16 }}>
        {stats.map((s) => {
          const n = rows.filter((r) => r.status === s.key).length;
          return (
            <Panel key={s.key} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: c.text3, fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: c.text2 }}>{s.label}</div>
                  <div className="dp-num" style={{ fontSize: 24, fontWeight: 500, color: c.ink, lineHeight: 1.2 }}>
                    {n}
                  </div>
                </div>
                <span style={{ marginLeft: 'auto' }}>
                  <Pill semantic={s.semantic}>{s.label}</Pill>
                </span>
              </div>
            </Panel>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <SectionTitle title="提交历史" desc="状态会随处理进展更新" />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          提交新需求
        </Button>
      </div>

      <Panel style={{ overflow: 'hidden' }}>
        <Table className="dp-table-compact" rowKey="id" columns={columns} dataSource={rows} pagination={false} size="middle" scroll={{ x: 1000 }} />
      </Panel>

      <Modal
        open={open}
        title="提交新需求"
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="提交"
        cancelText="取消"
        destroyOnHidden
        getContainer={false}
      >
        <Form form={form} layout="vertical" className="dp-form" requiredMark={false}>
          <Form.Item name="title" label="需求标题" rules={[{ required: true, message: '请填写需求标题' }, { min: 4, message: '至少 4 个字' }]}>
            <Input placeholder="例如：申请生产库只读权限：库存服务" />
          </Form.Item>
          <Form.Item name="type" label="需求类型" rules={[{ required: true, message: '请选择需求类型' }]}>
            <Select placeholder="请选择" options={demandTypes} />
          </Form.Item>
          <Form.Item name="detail" label="背景与期望" rules={[{ required: true, message: '请填写背景与期望' }, { min: 10, message: '请至少写 10 个字，便于受理' }]}>
            <Input.TextArea rows={4} placeholder="说明背景、使用场景与期望的完成时间" />
          </Form.Item>
          <Form.Item name="contact" label="联系方式（可选）">
            <Input placeholder="企微 / 邮箱，便于处理人联系你" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function Workspace({ route }) {
  const c = useT();
  const validTabs = workspaceTabs.map((t) => t.key);
  const initial = route && validTabs.includes(route.sub) ? route.sub : 'tools';
  const [tab, setTab] = useState(initial);

  // 支持深链：#/workspace/<tab>[/<groupKey>]
  useEffect(() => {
    if (route && validTabs.includes(route.sub)) setTab(route.sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route && route.sub]);

  const items = [
    { key: 'tools', label: '工具导航', children: <ToolsView focusGroup={tab === 'tools' ? route && route.id : undefined} /> },
    { key: 'org', label: '组织速查', children: <OrgView /> },
    { key: 'demand', label: '需求提交', children: <DemandView /> },
  ];

  return (
    <div className="dp-shell">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>工作台</h1>
          <span style={{ fontSize: 14, color: c.text2 }}>工具服务目录、组织速查与需求受理</span>
        </div>
        <ContentMeta owner="SRE 组 · 何嘉 / 内容运营 · 孙玥" updated={META.updated} style={{ marginTop: 10 }} />
      </div>

      <Tabs activeKey={tab} onChange={setTab} items={items} />

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
        <ClockCircleOutlined /> 每个工具都有明确 Owner 与运行状态，处于「维护中 / 降级」的工具请先联系 Owner 再使用。
      </div>
    </div>
  );
}
