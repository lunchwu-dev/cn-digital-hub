/**
 * 信息中心 —— 三个子频道：公告与决议 / 产品 Release / 项目动态
 * 结构：顶部 Tabs + 筛选（Tag 组 + 时间范围）+ 「重点宽卡 + 紧凑列表」混合流
 */
import React, { useMemo, useState } from 'react';
import { Tabs, Select, Table, Button, Space, Typography } from 'antd';
import {
  announcements,
  releaseNotes,
  projectUpdates,
  newsTagFilters,
  newsTimeRanges,
  releaseStatusMap,
  releaseTypeMap,
  META,
} from '../data/mock';
import { useT } from '../theme';
import { Panel, PanelHead, Pill, ChannelTag, YellowMark, ContentMeta, SectionTitle } from '../components/ui';
import { go } from '../router';

const { Text, Link } = Typography;

/* 时间范围：把 mock 里最早的日期当作「今天」的近似基准 */
const TODAY = new Date('2026-09-17');

function withinRange(dateStr, range) {
  if (!range || range === 'all') return true;
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
  if (!days) return true;
  const d = new Date(dateStr);
  const diff = (TODAY - d) / 86400000;
  return diff <= days;
}

function FilterChips({ tags, value, onChange }) {
  const c = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {tags.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
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
  );
}

/** 紧凑列表行：56px，标题 + 频道 tag + 日期，hover 底 #F5F4F5 */
function NewsRow({ item, channelLabel }) {
  const c = useT();
  const open = () => go('#/news');
  return (
    <div
      className="dp-row"
      role="button"
      tabIndex={0}
      aria-label={item.title}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          open();
        }
      }}
    >
      {item.isNew ? <span style={{ width: 2, alignSelf: 'stretch', background: c.brand, borderRadius: 2, flex: '0 0 auto' }} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{item.title}</span>
          {item.isNew ? <YellowMark>NEW</YellowMark> : null}
        </div>
        <div style={{ fontSize: 12, color: c.text3, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.summary}
        </div>
      </div>
      <ChannelTag>{channelLabel}</ChannelTag>
      <span className="dp-num" style={{ fontSize: 12, color: c.text3, width: 84, textAlign: 'right', flex: '0 0 auto' }}>
        {item.date}
      </span>
    </div>
  );
}

/** 重点宽卡：标题 16/500 + 摘要 2 行 + 右下 meta */
function FeatureCard({ item, channelLabel }) {
  const c = useT();
  return (
    <Panel hover style={{ padding: '18px 20px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Pill semantic="info">重点</Pill>
        <ChannelTag>{channelLabel}</ChannelTag>
        {item.isNew ? <Pill semantic="info" dot>最新</Pill> : null}
      </div>
      <h3 style={{ margin: '10px 0 6px', fontSize: 16, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{item.title}</h3>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: c.text2 }}>{item.summary}</p>
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
        <Space size={8} wrap>
          {(item.tags || []).map((t) => (
            <ChannelTag key={t}>{t}</ChannelTag>
          ))}
        </Space>
        <span style={{ fontSize: 12, color: c.text3 }}>
          {item.owner} · <span className="dp-num">{item.date}</span>
        </span>
      </div>
    </Panel>
  );
}

function AnnounceView() {
  const c = useT();
  const [tag, setTag] = useState('全部');
  const [range, setRange] = useState('all');
  const list = useMemo(
    () =>
      announcements.filter(
        (a) => (tag === '全部' || (a.tags || []).includes(tag)) && withinRange(a.date, range)
      ),
    [tag, range]
  );
  const feature = list.find((a) => a.feature);
  const rest = list.filter((a) => a !== feature);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <FilterChips tags={newsTagFilters} value={tag} onChange={setTag} />
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12, color: c.text3 }}>
            时间范围
          </Text>
          <Select value={range} onChange={setRange} options={newsTimeRanges} style={{ width: 132 }} />
        </Space>
      </div>

      {feature ? <FeatureCard item={feature} channelLabel="公告与决议" /> : null}

      <Panel>
        <PanelHead title="全部公告" desc={`共 ${list.length} 条`} dense />
        <div style={{ padding: '0 8px' }}>
          {rest.length === 0 ? (
            <div style={{ padding: '32px 8px', textAlign: 'center', color: c.text3, fontSize: 14 }}>
              当前筛选条件下没有公告
            </div>
          ) : (
            rest.map((a) => <NewsRow key={a.id} item={a} channelLabel="公告与决议" />)
          )}
        </div>
      </Panel>
    </div>
  );
}

function ReleaseView() {
  const c = useT();
  const [range, setRange] = useState('all');
  const data = useMemo(() => releaseNotes.filter((r) => withinRange(r.date, range)), [range]);

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 108,
      render: (v) => (
        <span
          className="dp-mono"
          style={{ fontSize: 12, fontWeight: 500, color: c.ink, background: c.page, border: `1px solid ${c.border}`, borderRadius: 999, padding: '1px 9px' }}
        >
          {v}
        </span>
      ),
    },
    { title: '系统', dataIndex: 'system', width: 118, render: (v) => <span style={{ color: c.ink }}>{v}</span> },
    {
      title: '变更类型',
      dataIndex: 'changeType',
      width: 96,
      render: (v) => {
        const m = releaseTypeMap[v] || releaseTypeMap.feat;
        return <Pill semantic={m.semantic}>{m.label}</Pill>;
      },
    },
    { title: '变更摘要', dataIndex: 'summary', ellipsis: true },
    {
      title: '变更项数',
      dataIndex: 'items',
      width: 92,
      align: 'right',
      render: (v) => <span className="dp-num">{v}</span>,
    },
    { title: '负责人', dataIndex: 'owner', width: 82, render: (v) => <span style={{ color: c.text2 }}>{v}</span> },
    {
      title: '发布日期',
      dataIndex: 'date',
      width: 108,
      render: (v) => <span className="dp-num" style={{ color: c.text2 }}>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (v) => {
        const m = releaseStatusMap[v] || releaseStatusMap.released;
        return <Pill semantic={m.semantic} dot>{m.label}</Pill>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 13, color: c.text3 }}>
          共 <span className="dp-num">{data.length}</span> 个版本 · 按发布日期倒序
        </Text>
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12, color: c.text3 }}>
            时间范围
          </Text>
          <Select value={range} onChange={setRange} options={newsTimeRanges} style={{ width: 132 }} />
        </Space>
      </div>
      <Panel style={{ overflow: 'hidden' }}>
        <Table
          className="dp-table-compact"
          rowKey="version"
          columns={columns}
          dataSource={data}
          pagination={false}
          size="middle"
          scroll={{ x: 860 }}
        />
      </Panel>
    </div>
  );
}

function ProjectView() {
  const c = useT();
  const [range, setRange] = useState('all');
  const list = useMemo(() => projectUpdates.filter((p) => withinRange(p.date, range)), [range]);
  const feature = list[0];
  const rest = list.slice(1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 12, color: c.text3 }}>
            时间范围
          </Text>
          <Select value={range} onChange={setRange} options={newsTimeRanges} style={{ width: 132 }} />
        </Space>
      </div>
      {feature ? <FeatureCard item={feature} channelLabel="项目动态" /> : null}
      <Panel>
        <PanelHead title="项目进展" desc={`共 ${list.length} 条`} dense />
        <div style={{ padding: '0 8px' }}>
          {rest.map((p) => (
            <NewsRow key={p.id} item={p} channelLabel="项目动态" />
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default function News() {
  const c = useT();
  const [tab, setTab] = useState('announce');

  const items = [
    { key: 'announce', label: '公告与决议', children: <AnnounceView /> },
    { key: 'release', label: '产品 Release', children: <ReleaseView /> },
    { key: 'project', label: '项目动态', children: <ProjectView /> },
  ];

  return (
    <div className="dp-shell">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>信息中心</h1>
          <span style={{ fontSize: 14, color: c.text2 }}>公告决议、产品发布与项目进展的统一入口</span>
        </div>
        <ContentMeta owner="内容运营 · 孙玥" updated={META.updated} note="每工作日 18:00 汇总更新" style={{ marginTop: 10 }} />
      </div>

      <Tabs activeKey={tab} onChange={setTab} items={items} />

      <div style={{ marginTop: 20 }}>
        <SectionTitle title="订阅说明" desc="本项目不设登录与个人订阅" />
        <Panel style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.7 }}>
            由于门户定位为「无登录的内部信息面」，本页不提供个人订阅与已读状态。所有频道内容对部门内所有人可见，重要决议会同步置顶到
            <Link href="#/home" style={{ fontSize: 13 }}>
              今日 Hub
            </Link>
            。需要长期跟进的节点，请关注里程碑列表或直接向 Agent 提问。
          </div>
        </Panel>
      </div>
    </div>
  );
}
