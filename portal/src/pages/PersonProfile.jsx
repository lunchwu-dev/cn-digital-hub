/**
 * 员工个人主页 —— 路由 #/workspace/people/:id
 * ------------------------------------------------------------------
 * 信息架构（P1 文档 E.1，按优先级）：
 *   P0 ① 基本信息（页头通栏，Breadcrumb 之上）
 *   P0 ② 标签矩阵（左栏，TagMatrix）
 *   P1 ③ 近期知识贡献（右栏，每条标注它喂养了哪个标签 → 联动）
 *   P2 ④ 能力分布概览（页头底部一行 + Sparkline）
 *   P2 ⑤ 协作触点（该人负责的工具）
 * 栅格：复用既有 .dp-g-article（不改定义，避免影响 ArticleDetail）。
 * 只读的第三人称视图：无编辑入口、无关注、无「这是我的页面」暗示。
 */
import React from 'react';
import { Breadcrumb, Button, Typography } from 'antd';
import { FileTextOutlined, ToolOutlined } from '@ant-design/icons';
import {
  getPersonProfile,
  toolsOfPerson,
  personId,
  TAG_BY_ID,
} from '../data/mock';
import { useT } from '../theme';
import {
  Panel,
  PanelHead,
  SectionTitle,
  InitialAvatar,
  TagChip,
  TagMatrix,
  MaturityAxis,
  PageEmpty,
  StatusDot,
} from '../components/ui';
import { Sparkline } from '../components/ui';
import { go } from '../router';

const { Text } = Typography;

/** 证据类型 → 展示名 + 语义色（中性为主，不与运行状态语义色争抢） */
const KIND_META = {
  bestPractice: { label: '最佳实践', semantic: 'neutral' },
  article: { label: '最佳实践', semantic: 'neutral' },
  projectUpdate: { label: '项目动态', semantic: 'neutral' },
  announcement: { label: '公告与决议', semantic: 'neutral' },
  release: { label: '产品 Release', semantic: 'neutral' },
};

/** 近 6 月贡献密度（供 Sparkline；纯展示，不参与档位） */
function densitySpark(contributions, asOf = '2026-09-17') {
  const base = new Date(asOf + 'T00:00:00');
  const buckets = new Array(6).fill(0);
  contributions.forEach((e) => {
    const d = new Date(String(e.date || '') + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return;
    const diff = (base.getFullYear() - d.getFullYear()) * 12 + (base.getMonth() - d.getMonth());
    if (diff >= 0 && diff < 6) buckets[5 - diff] += 1;
  });
  return buckets;
}

/** 单条证据条目（右栏）：标题 + 元信息 + 「→ 标签名」联动标注（第二行，整块不可点） */
function ContributionItem({ item, isLast }) {
  const c = useT();
  const meta = KIND_META[item.kind] || { label: '贡献' };
  const tags = (item.tagIds || []).map((id) => TAG_BY_ID[id]).filter(Boolean);
  const open = () => item.path && go(item.path);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      style={{
        padding: '10px 12px',
        borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <TagChip label={meta.label} axis="capability" />
        <span className="dp-num" style={{ fontSize: 11, color: c.text3 }}>
          {item.date}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{item.title}</div>
      {/* 第二行：→ 标签名（联动标注，说明不是入口，故整块不可点） */}
      {tags.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {tags.map((t) => (
            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: c.text3 }}>→</span>
              <TagChip label={t.label} axis="domain" />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PersonProfile({ id }) {
  const c = useT();
  const profile = getPersonProfile(id);

  if (!profile.person) {
    return (
      <div className="dp-shell">
        <PageEmpty
          title="没有找到这位成员"
          desc={`成员「${id || '未知'}」不存在，可能已离开部门或链接已失效。可回到组织速查按姓名与专长检索。`}
          extra={
            <>
              <Button type="primary" onClick={() => go('#/org')}>
                去组织速查
              </Button>
              <Button onClick={() => go('#/workspace/tags')}>浏览全部标签</Button>
            </>
          }
        />
      </div>
    );
  }

  const { person, tags, stats, contributions } = profile;
  const primaries = tags.filter((t) => t.primary);
  const myTools = toolsOfPerson(person);
  const spark = densitySpark(contributions);
  const recentContribs = contributions.slice();

  return (
    <div className="dp-shell">
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => go('#/home')}>
                首页
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => go('#/org')}>
                组织速查
              </Button>
            ),
          },
          { title: <span style={{ color: c.ink }}>{person.name}</span> },
        ]}
      />

      {/* P0 ① 基本信息（页头通栏） */}
      <Panel className="dp-person-head" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div className="dp-person-head-main" style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 320px', minWidth: 0 }}>
            <InitialAvatar name={person.name} size={56} fontSize={20} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: c.ink, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {person.name}
              </div>
              <div style={{ fontSize: 14, color: c.text2, lineHeight: 1.5, marginTop: 4 }}>
                {person.dept} · {person.role}
              </div>
              <div style={{ fontSize: 13, color: c.text3, lineHeight: 1.5, marginTop: 2 }}>
                {person.location} · <span className="dp-mono">{person.email}</span>
              </div>
            </div>
          </div>
          {/* 主标签 ≤3，右对齐（放大态 MaturityAxis） */}
          {primaries.length ? (
            <div
              className="dp-person-head-tags"
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flex: '0 1 320px', minWidth: 0 }}
            >
              <span style={{ fontSize: 11, color: c.text3 }}>主标签</span>
              {primaries.slice(0, 3).map((t) => (
                <div
                  key={t.tag.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 12px',
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    background: c.surface,
                    minWidth: 200,
                    maxWidth: 320,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: c.ink }}>{t.tag.label}</span>
                    <span style={{ fontSize: 11, color: c.text3 }}>
                      {t.tag.axis === 'domain' ? '领域' : '能力'}
                    </span>
                  </div>
                  <MaturityAxis
                    selfRating={t.selfRating || 'curious'}
                    evidenceTier={t.evidenceTier}
                    variant="expanded"
                    recentCount={t.recentCount}
                    historicalCount={t.historicalCount}
                    latestCount={t.recentCount}
                    totalCount={t.totalCount}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* P2 ④ 能力分布概览 */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            fontSize: 14,
            color: c.text2,
          }}
        >
          <span>
            领域 <span className="dp-num" style={{ color: c.ink, fontWeight: 500 }}>{stats.domain}</span> 个 · 能力{' '}
            <span className="dp-num" style={{ color: c.ink, fontWeight: 500 }}>{stats.capability}</span> 个 · 近 12 月实证{' '}
            <span className="dp-num" style={{ color: c.ink, fontWeight: 500 }}>{stats.recent}</span> 条
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.text3 }}>
            近 6 月贡献密度
            {/* v0.4 2.5：全 0 时不画贴底平线（min=max=0 → span=1 → 所有点贴底，读作坏图），
                改为一行中性灰字。判断放在**调用点**，Sparkline 保持通用纯展示职责。 */}
            {(() => {
              const sp = spark.length ? spark : [0, 0, 0, 0, 0, 0];
              return sp.every((v) => v === 0) ? (
                <span style={{ color: c.text3 }}>近 6 月暂无公开贡献</span>
              ) : (
                <Sparkline data={sp} />
              );
            })()}
          </span>
        </div>
      </Panel>

      {/* 双栏：标签矩阵（左） + 近期知识贡献（右） */}
      <div className="dp-grid dp-g-article" style={{ gap: 16, alignItems: 'start', marginTop: 16 }}>
        <div>
          <TagMatrix
            tags={tags}
            empty={tags.length === 0}
            onTagClick={(tagId) => go('#/workspace/tags/' + tagId)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel style={{ overflow: 'hidden' }}>
            <PanelHead
              title="近期知识贡献"
              desc="每条都标注它喂养了哪个标签"
              extra={
                <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
                  {recentContribs.length} 条
                </span>
              }
            />
            {recentContribs.length ? (
              <div>
                {recentContribs.map((item, i) => (
                  <ContributionItem key={item.key} item={item} isLast={i === recentContribs.length - 1} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px 16px', fontSize: 13, color: c.text3, lineHeight: 1.7 }}>
                暂无公开知识贡献。标签的实证度来自最佳实践、文章、项目动态、公告与 Release 的署名，
                由系统自动核算。
              </div>
            )}
          </Panel>

          {/* P2 ⑤ 协作触点（可空） */}
          {myTools.length ? (
            <Panel style={{ overflow: 'hidden' }}>
              <PanelHead title="协作触点" desc="负责的工具" />
              <div>
                {myTools.map((t) => (
                  <div
                    key={t.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderBottom: `1px solid ${c.border}`,
                    }}
                  >
                    <ToolOutlined style={{ color: c.text3 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>{t.group}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
                      <StatusDot semantic={t.status} />
                      {t.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          ) : (
            <Panel style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <FileTextOutlined style={{ color: c.text3 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: c.ink }}>协作触点</span>
              </div>
              <div style={{ fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
                该成员暂未登记负责的工具。工具 Owner 与状态见工作台「工具导航」。
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
        本页为只读视图 · 标签用于让同事找到你的领域与能力，实证度由系统按公开贡献核算，不作为绩效评价。
      </div>
    </div>
  );
}
