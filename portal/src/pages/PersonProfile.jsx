/**
 * 员工个人主页 —— 路由 #/workspace/people/:id
 * ------------------------------------------------------------------
 * v0.4.1 版面（单树化 + 主页化 + 减法）：
 *   L0 hero  基础信息（头像 + 姓名 + 部门/角色 + 联系）+ 主标签成熟度卡（≤2，放大态）
 *   L1 主栏  技能标签树 + 成熟度（TagMatrix，宽 1.85fr）
 *   L2 辅栏  近期知识贡献（窄 1fr，每条标注它喂养了哪个标签 → 联动）
 * 栅格：新建 .dp-g-profile（不复用 .dp-g-article，避免影响 ArticleDetail）。
 * 只读的第三人称视图：无编辑入口、无关注、无「这是我的页面」暗示。
 *
 * v0.4.1 删除（用户「不用其他内容了」）：能力分布概览（Sparkline）、协作触点（负责的工具）。
 * 底部合规声明保留，但并入标签树 Panel 内作一行脚注。
 */
import React from 'react';
import { Breadcrumb, Button, Typography } from 'antd';
import { getPersonProfile, personId, TAG_BY_ID } from '../data/mock';
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
} from '../components/ui';
import { go } from '../router';

const { Text } = Typography;

/** 证据类型 → 展示名（中性为主，不与运行状态语义色争抢） */
const KIND_META = {
  bestPractice: { label: '最佳实践' },
  article: { label: '最佳实践' },
  projectUpdate: { label: '项目动态' },
  announcement: { label: '公告与决议' },
  release: { label: '产品 Release' },
};

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
        <TagChip label={meta.label} />
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
              <TagChip label={t.label} />
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

  const { person, tags, contributions } = profile;
  const primaries = tags.filter((t) => t.primary);
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

      {/* L0 · Hero（通栏）：左侧人信息 + 右侧主标签成熟度卡（≤2，放大态） */}
      <Panel className="dp-person-head" style={{ padding: '24px 28px' }}>
        <div className="dp-person-head-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div className="dp-person-head-main" style={{ display: 'flex', alignItems: 'center', gap: 18, flex: '1 1 320px', minWidth: 0 }}>
            <InitialAvatar name={person.name} size={64} fontSize={23} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 500, color: c.ink, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                {person.name}
              </div>
              <div style={{ fontSize: 14, color: c.text2, lineHeight: 1.5, marginTop: 6 }}>
                {person.dept} · {person.role}
              </div>
              <div style={{ fontSize: 13, color: c.text3, lineHeight: 1.5, marginTop: 3 }}>
                {person.location} · <span className="dp-mono">{person.email}</span>
              </div>
            </div>
          </div>
          {/* 主标签 ≤2，右对齐（放大态 MaturityAxis）——hero 是精选，不是全部标签的预览 */}
          {primaries.length ? (
            <div
              className="dp-person-head-tags"
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flex: '0 1 320px', minWidth: 0 }}
            >
              <span style={{ fontSize: 11, color: c.text3 }}>主标签</span>
              {primaries.slice(0, 2).map((t) => (
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
                    <span style={{ fontSize: 11, color: c.text3, flex: '0 0 auto' }}>{t.tag.group}</span>
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
      </Panel>

      {/* L1 + L2 · 主体两栏：技能标签树（宽）｜近期知识贡献（窄） */}
      <div className="dp-grid dp-g-profile" style={{ gap: 24, alignItems: 'start', marginTop: 20 }}>
        <div>
          <TagMatrix
            tags={tags}
            empty={tags.length === 0}
            onTagClick={(tagId) => go('#/workspace/tags/' + tagId)}
          />
          {/* 合规声明：并入标签树下方作脚注（不再是独立区块） */}
          <div style={{ marginTop: 10, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
            本页为只读视图 · 标签用于让同事找到你的专长，实证度由系统按公开贡献核算，不作为绩效评价。
          </div>
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
        </div>
      </div>
    </div>
  );
}
