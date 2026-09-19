/**
 * 首页 · 今日 Hub —— 主编排层
 * 结构：置顶决议 → 健康度快照 → 双栏（Release 时间线 / 里程碑）→ 快捷入口 → Agent 引导条
 */
import React, { useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  PushpinFilled,
  DownOutlined,
  UpOutlined,
  ArrowRightOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  pinnedResolutions,
  healthSnapshot,
  recentReleases,
  milestones,
  quickLinks,
  releaseStatusMap,
  META,
} from '../data/mock';
import { useT } from '../theme';
import { SectionTitle, Panel, PanelHead, KpiTile, Pill, YellowMark, ContentMeta } from '../components/ui';
import { IconByName } from '../components/icons';
import { go } from '../router';

function PinnedCard({ item }) {
  const c = useT();
  const [open, setOpen] = useState(false);
  return (
    <Panel style={{ position: 'relative', overflow: 'hidden' }}>
      {/* 3px 品牌蓝强调条：有意的信息层级表达（Anti-Slop 例外条款） */}
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c.brand }} />
      <div style={{ padding: '16px 20px 16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <YellowMark>
            <PushpinFilled style={{ fontSize: 11 }} />
            置顶
          </YellowMark>
          <Pill semantic="neutral">{item.meeting}</Pill>
          <span className="dp-mono" style={{ fontSize: 12, color: c.text3 }}>
            {item.id}
          </span>
        </div>
        <h3 style={{ margin: '10px 0 6px', fontSize: 16, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>
          {item.title}
        </h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: c.text2 }}>{item.summary}</p>
        {open && (
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 14,
              lineHeight: 1.75,
              color: c.ink,
              padding: '10px 12px',
              background: c.page,
              borderRadius: 6,
            }}
          >
            {item.body}
          </p>
        )}
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
          <Space size={16} wrap style={{ fontSize: 12, color: c.text3 }}>
            <span>
              生效日期 <span className="dp-num" style={{ color: c.text2 }}>{item.effective}</span>
            </span>
            <span>
              负责人 <span style={{ color: c.text2 }}>{item.owner}</span>
            </span>
          </Space>
          <Button type="link" size="small" onClick={() => setOpen((v) => !v)} style={{ padding: 0 }}>
            {open ? '收起' : '展开全文'} {open ? <UpOutlined /> : <DownOutlined />}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

export default function Home({ onOpenAgent }) {
  const c = useT();

  return (
    <div className="dp-shell">
      {/* 页头 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>
          今日 Hub
        </h1>
        <div style={{ marginTop: 6, fontSize: 14, color: c.text2 }}>
          {META.department} · 重要决议、系统健康度与常用入口集中在这里
        </div>
        <ContentMeta owner={META.owner} updated={META.updated} style={{ marginTop: 10 }} />
      </div>

      {/* 1. 置顶决议 */}
      <section style={{ marginBottom: 32 }}>
        <SectionTitle
          title="置顶决议"
          desc="高时效、需周知的事项"
          extra={
            <Button type="link" onClick={() => go('#/news')} style={{ padding: 0 }}>
              全部公告与决议 <ArrowRightOutlined />
            </Button>
          }
        />
        <div style={{ display: 'grid', gap: 16 }}>
          {pinnedResolutions.map((r) => (
            <PinnedCard key={r.id} item={r} />
          ))}
        </div>
      </section>

      {/* 2. 健康度快照 */}
      <section style={{ marginBottom: 32 }}>
        <SectionTitle
          title="健康度快照"
          desc="核心系统运行指标"
          extra={
            <Button type="link" onClick={() => go('#/ops')} style={{ padding: 0 }}>
              进入监控运营 <ArrowRightOutlined />
            </Button>
          }
        />
        <div className="dp-grid dp-g4">
          {healthSnapshot.map((k) => (
            <KpiTile key={k.key} item={k} />
          ))}
        </div>
      </section>

      {/* 3. 双栏：Release 时间线 / 里程碑 */}
      <section className="dp-grid dp-g2-asym" style={{ marginBottom: 32, gap: 24 }}>
        <Panel>
          <PanelHead
            title="近期 Release"
            desc="按发布时间倒序"
            extra={
              <Button type="link" size="small" onClick={() => go('#/news')} style={{ padding: 0 }}>
                查看全部
              </Button>
            }
          />
          <div style={{ padding: '12px 16px 16px' }}>
            {recentReleases.map((r, i) => {
              const sm = releaseStatusMap[r.status] || releaseStatusMap.released;
              const last = i === recentReleases.length - 1;
              return (
                <div key={r.version + r.date} style={{ display: 'flex', gap: 14 }}>
                  {/* 时间线轴 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', paddingTop: 6 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: sm.semantic === 'success' ? c.success : c.surface,
                        border: `1.5px solid ${sm.semantic === 'success' ? c.success : sm.semantic === 'warning' ? c.warning : c.info}`,
                        flex: '0 0 auto',
                      }}
                    />
                    {!last && <span style={{ width: 1, flex: 1, background: c.border, marginTop: 2, minHeight: 34 }} />}
                  </div>
                  <div style={{ paddingBottom: last ? 0 : 16, minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="dp-mono"
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: c.ink,
                          background: c.page,
                          border: `1px solid ${c.border}`,
                          borderRadius: 999,
                          padding: '1px 9px',
                        }}
                      >
                        {r.version}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{r.name}</span>
                      <Pill semantic={sm.semantic}>{sm.label}</Pill>
                      <span className="dp-num" style={{ fontSize: 12, color: c.text3, marginLeft: 'auto' }}>
                        {r.date}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: c.text2, lineHeight: 1.6 }}>{r.summary}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="里程碑精选" desc="未来 6 周关键节点" />
          <div style={{ padding: '6px 8px 10px' }}>
            {milestones.map((m) => (
              <div
                key={m.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 8px',
                  borderBottom: `1px solid ${c.border}`,
                }}
              >
                <span className="dp-num" style={{ fontSize: 12, color: c.text2, width: 78, flex: '0 0 auto' }}>
                  {m.date}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: c.ink, fontWeight: 500, lineHeight: 1.5 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: c.text3, marginTop: 1 }}>{m.owner}</div>
                </div>
                {m.tag === '里程碑' ? <YellowMark>里程碑</YellowMark> : <Pill semantic="neutral">{m.tag}</Pill>}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* 4. 快捷入口 */}
      <section style={{ marginBottom: 32 }}>
        <SectionTitle
          title="快捷入口"
          desc="常用系统与平台"
          extra={
            <Button type="link" onClick={() => go('#/workspace')} style={{ padding: 0 }}>
              更多工具 <ArrowRightOutlined />
            </Button>
          }
        />
        <div className="dp-grid dp-g4">
          {quickLinks.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => go(q.path)}
              className="dp-card dp-card--hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                border: `1px solid ${c.border}`,
              }}
            >
              <IconByName name={q.icon} style={{ fontSize: 20, color: c.text2 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Agent 引导条 */}
      <Panel style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: c.brandSubtle,
              border: `1px solid ${c.brandBorder}`,
              color: c.brand,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flex: '0 0 auto',
            }}
          >
            <RobotOutlined />
          </span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>有流程或规范上的疑问？先问 Agent for Digital</div>
            <div style={{ fontSize: 13, color: c.text2, marginTop: 2 }}>
              它聚合了部门的 FAQ、最佳实践与工具说明，能直接给出可执行的下一步。
            </div>
          </div>
          <Space size={8} wrap>
            <Tooltip title="演示：脚本化回复">
              <Button type="primary" icon={<RobotOutlined />} onClick={() => onOpenAgent()}>
                去提问
              </Button>
            </Tooltip>
            <Button icon={<ThunderboltOutlined />} onClick={() => go('#/knowledge')}>
              浏览 FAQ
            </Button>
          </Space>
        </div>
      </Panel>
    </div>
  );
}
