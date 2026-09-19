/**
 * 工作台 —— 工具导航（服务目录） / 组织速查
 * 工具导航是本产品的高价值模块：每张卡都有 Owner 与状态，是「服务目录」而非链接墙。
 *
 * P2-1 清理：原地删除重构前遗留的死代码 `DemandView`（约 620 行，含一份与
 * pages/DemandNew.jsx 完全重复的评分引擎 D1–D5 / brdMissing / lightMissing /
 * agentAdvice）。该组件全库无 import（grep 确认），「需求提交」已拆为
 * 一级页 #/demand + 二级页 #/demand/new。随组件一并移除的还有它专用的
 * imports（DatePicker / Segmented / Checkbox / PlusOutlined / CheckOutlined、
 * 仅它使用的一批 demand / brd mock 常量、以及 CompletenessBar / ScaleChips /
 * BrdAssistantCard / DemandRecentList 组件）。OrgView 导出保留（pages/Org.jsx 依赖）。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Input, Button, Space, Table, Modal, Form, Select, App as AntApp, Typography } from 'antd';
import { SearchOutlined, KeyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { toolGroups, orgPeople, personId, META } from '../data/mock';
import { useT } from '../theme';
import { Panel, Pill, ContentMeta, SectionTitle, InitialAvatar, StatusDot } from '../components/ui';
import { go } from '../router';
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
    message.success('权限申请已提交，将进入「业务需求」列表跟进，可在顶部导航查看。');
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
/* 导出供一级栏目「组织速查」（#/org，pages/Org.jsx）复用 —— 组件不搬家，只把入口升为一级栏目。 */
export function OrgView() {
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
        <Space size={12} wrap>
          <Text style={{ fontSize: 12, color: c.text3 }}>
            共 <span className="dp-num">{list.length}</span> 位成员 · 仅展示部门内公开信息
          </Text>
          {/* 标签反查页入口：反查页是二级页，从组织速查进入符合用户心智（不新增一级 Tab） */}
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => go('#/workspace/tags')}>
            浏览全部标签 →
          </Button>
        </Space>
      </div>
      <Panel style={{ overflow: 'hidden' }}>
        <Table
          className="dp-table-compact"
          rowKey="email"
          columns={columns}
          dataSource={list}
          pagination={false}
          size="middle"
          scroll={{ x: 960 }}
          onRow={(record) => ({
            // 整行可点 → 个人主页；复用既有键盘可达范式（role=button + tabindex=0 + Enter/Space）
            role: 'button',
            tabIndex: 0,
            style: { cursor: 'pointer' },
            onClick: () => go('#/workspace/people/' + personId(record.email)),
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                go('#/workspace/people/' + personId(record.email));
              }
            },
          })}
        />
      </Panel>
    </div>
  );
}



/**
 * 工作台 —— 退回纯工具导航（02b §A.1 / §C.4）
 * 「组织速查」与「业务需求」已升为一级栏目（#/org、#/demand），
 * 因此本页移除 Tabs，直接渲染 ToolsView，只保留「工具服务目录」单一职能。
 * 导出名 `Workspace` 与 renderRoute 的调用契约保持不变（仍接收 route prop 以支持工具分组深链）。
 */
export default function Workspace({ route }) {
  const c = useT();
  // 支持深链：#/workspace/tools/<groupKey> 直接定位到具体工具分组
  const focusGroup = route && route.sub === 'tools' ? route.id : undefined;

  return (
    <div className="dp-shell">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>工作台</h1>
          <span style={{ fontSize: 14, color: c.text2 }}>工具服务目录</span>
        </div>
        <ContentMeta owner="SRE 组 · 何嘉 / 内容运营 · 孙玥" updated={META.updated} style={{ marginTop: 10 }} />
      </div>

      <ToolsView focusGroup={focusGroup} />

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
        <ClockCircleOutlined /> 每个工具都有明确 Owner 与运行状态，处于「维护中 / 降级」的工具请先联系 Owner 再使用。
      </div>
    </div>
  );
}
