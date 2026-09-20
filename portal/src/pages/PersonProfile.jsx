/**
 * 员工个人主页 —— 路由 #/workspace/people/:id
 * ------------------------------------------------------------------
 * v0.4.3 版面（三个楼层，自上而下）：
 *   楼层 1  头像 + 个人信息（hero，通栏单列，**沿用 v0.4.2 不动**）
 *   楼层 2  技能标签（横向流式楼层 `.dp-tag-floor`，通栏，去分组结构）
 *   楼层 3  近期工作内容（左 1fr）｜ 近期知识贡献（右 1fr）—— `.dp-g-duo` 等宽两栏
 * 栅格：楼层 3 用 .dp-g-duo（1fr/1fr）；v0.4.2 的 .dp-g-profile（1.85fr/1fr）已无使用点
 *   （定义保留以稳住 mutation TARGETS sha，见 global.css 考古注释）。
 * 只读的第三人称视图：无编辑入口、无「这是我的页面」暗示；
 *   同事可对标签点赞表示认可（读侧社交信号，不改动被访者资料）。
 *
 * v0.4.1 删除：能力分布概览（Sparkline）、协作触点（负责的工具）。
 * v0.4.2 删除：主标签概念整体退场。
 * v0.4.3 新增：近期工作内容（Jira，前瞻态）；技能标签升为独立楼层 2。
 * 底部合规声明随技能标签楼层上移，作其下方一行脚注。
 */
import React from 'react';
import { Breadcrumb, Button } from 'antd';
import { getPersonProfile, TAG_BY_ID } from '../data/mock';
import { useT } from '../theme';
import {
  Panel,
  PanelHead,
  InitialAvatar,
  TagChip,
  TagMatrix,
  WorkStatusPill,
  PageEmpty,
} from '../components/ui';
import { go } from '../router';

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

/**
 * 单条 Jira 任务行（左栏）——严格按规范 §2.2 的逐行 px 规格。
 * 行 1：Jira 单号 + 状态 Pill + 任务名（单行 ellipsis）
 * 行 2：项目/迭代（左，单行 ellipsis） + 预期交付（右，等宽；逾期仅染日期数字）
 *
 * ★ 纪律（team-lead 加严）：
 *   ① blocked 任务**整行照常渲染**（单号 / 任务名 / 项目 / 日期都在），只是状态位留空
 *      （WorkStatusPill 返回 null）——绝不因状态位为空而吞掉整行；
 *   ② 逾期只染日期数字本身（c.warningText，满足 AA 对比度），不染整行、不加背景、不加图标；
 *   ③ 整块**不可点**：无 role / 无 tabIndex / 无 cursor:pointer / 无 <a href>（规范 §5 第 7 条）。
 */
function WorkItem({ item, isLast }) {
  const c = useT();
  // 逾期日期色选 c.warningText（#8A5200，约 6.3:1）而非 c.warning（#E8890C，约 3.1:1）：
  //   日期是「辅助数字着色」，但既然两选项均可，选满足正文 AA 的那个更稳（规范 §2.5 第二选项）。
  const dueColor = item.overdue ? c.warningText : c.text3;
  return (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
      }}
    >
      {/* 行 1：Jira 单号 + 状态 Pill + 任务名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, minWidth: 0 }}>
        <span className="dp-num" style={{ fontSize: 12, color: c.text3, flex: '0 0 auto', letterSpacing: 0 }}>
          {item.key}
        </span>
        {/* blocked → null：状态位留空，但整行（单号/任务名/项目/日期）照常渲染 */}
        <WorkStatusPill status={item.status} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: c.ink,
            lineHeight: 1.5,
            flex: '1 1 auto',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </span>
      </div>
      {/* 行 2：项目/迭代（左） + 预期交付（右） */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            color: c.text3,
            flex: '1 1 auto',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.project}
        </span>
        <span className="dp-num" style={{ fontSize: 12, color: dueColor, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
          {item.due}
        </span>
      </div>
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
          desc={`成员「${id || '未知'}」不存在，可能已离开部门或链接已失效。可回到组织速查按姓名与技能标签检索。`}
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

  const { person, tags, contributions, work } = profile;
  const recentContribs = contributions.slice();
  const workItems = (work && work.items) || [];
  const workTotal = (work && work.total) || 0;

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

      {/* 楼层 1 · 头像 + 个人信息（通栏，单列）—— 沿用 v0.4.2 不动 */}
      <Panel className="dp-person-head" style={{ padding: '24px 28px' }}>
        <div className="dp-person-head-main" style={{ display: 'flex', alignItems: 'center', gap: 18, flex: '0 1 auto', minWidth: 0 }}>
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
      </Panel>

      {/* 楼层 2 · 技能标签（横向流式楼层，通栏）*/}
      <div className="dp-floor-tags" style={{ marginTop: 20 }}>
        <TagMatrix
          tags={tags}
          empty={tags.length === 0}
          onTagClick={(tagId) => go('#/workspace/tags/' + tagId)}
        />
        {/* 合规声明：并入技能标签楼层下方作脚注 */}
        <div style={{ marginTop: 10, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
          本页为只读视图（同事可对标签点赞表示认可）· 技能标签来自系统数据抽取与公司人才盘点，由系统自动生成，无需本人登记，也不作为绩效评价。
        </div>
      </div>

      {/* 楼层 3 · 近期工作内容（左）｜ 近期知识贡献（右），等宽两栏 */}
      <div className="dp-grid dp-g-duo" style={{ gap: 24, alignItems: 'start', marginTop: 20 }}>
        {/* 左栏 · 近期工作内容（Jira 前瞻态） */}
        <Panel className="dp-floor-work" style={{ overflow: 'hidden' }}>
          <PanelHead
            title="近期工作内容"
            desc="来自 Jira 的负责人字段 · 当前至未来 1 个月"
            extra={
              <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
                {workTotal > 5 ? `${workTotal} 条 · 显示近 5` : `${workTotal} 条`}
              </span>
            }
          />
          {workItems.length ? (
            <div>
              {workItems.map((item, i) => (
                <WorkItem key={item.key} item={item} isLast={i === workItems.length - 1} />
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px 16px', fontSize: 13, color: c.text3, lineHeight: 1.7 }}>
              暂无在办任务。任务数据来自 Jira 的负责人字段，仅展示当前至未来 1 个月的排期。
            </div>
          )}
          {/* 数据来源脚注：语气与技能标签的来源说明一致 */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.border}`, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
            任务来自 Jira 的负责人字段，仅作协作参考，不作为绩效评价。
          </div>
        </Panel>

        {/* 右栏 · 近期知识贡献 */}
        <Panel className="dp-floor-contrib" style={{ overflow: 'hidden' }}>
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
              暂无近期知识贡献。技能标签的档位来自最佳实践、文章、项目动态、公告与 Release 的署名，
              以及人才盘点结果，由系统自动核算。
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
