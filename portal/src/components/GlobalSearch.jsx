/**
 * 全局搜索：Modal + 结果分组
 * 覆盖 公告与决议 / 产品 Release / 项目动态 / 知识中心 / 工具导航 五类。
 */
import React, { useMemo, useState } from 'react';
import { Input, Modal, Empty, Typography, Space } from 'antd';
import { SearchOutlined, RightOutlined } from '@ant-design/icons';
import { announcements, releaseNotes, projectUpdates, faqs, bestPractices, toolGroups, articles, orgPeople, personTags, personId, TAG_BY_ID, TAG_DICT as TAG_LIST } from '../data/mock';
import { useT } from '../theme';
import { Pill, BrandSymbol } from './ui';
import { go } from '../router';

const { Text } = Typography;

/** 归一化：忽略空格与大小写，中文按包含匹配 */
const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');

function buildIndex() {
  const idx = [];
  // 人员：找人是最强意图 → 排在最前（分组渲染顺序即 push 顺序）
  orgPeople.forEach((p) => {
    const tagIds = Object.keys(personTags[personId(p.email)] || {});
    const tagLabels = tagIds.map((tid) => (TAG_BY_ID[tid] ? TAG_BY_ID[tid].label : '')).filter(Boolean);
    idx.push({
      group: '人员',
      title: p.name,
      desc: `${p.dept} · ${p.role} · ${tagLabels.join('/')}`,
      path: '#/workspace/people/' + personId(p.email),
      kw: `${p.name}${p.dept}${p.role}${p.email}${(p.tags || []).join('')}${tagLabels.join('')}`,
    });
  });
  announcements.forEach((a) =>
    idx.push({ group: '公告与决议', title: a.title, desc: a.summary, path: '#/news', kw: `${a.title}${a.summary}${(a.tags || []).join('')}` })
  );
  releaseNotes.forEach((r) =>
    idx.push({
      group: '产品 Release',
      title: `${r.system} ${r.version} — ${r.summary}`,
      desc: `负责人 ${r.owner} · ${r.date}`,
      path: '#/news',
      kw: `${r.system}${r.version}${r.summary}${r.owner}`,
    })
  );
  projectUpdates.forEach((p) =>
    idx.push({ group: '项目动态', title: p.title, desc: p.summary, path: '#/news', kw: `${p.title}${p.summary}${(p.tags || []).join('')}` })
  );
  faqs.forEach((f) =>
    idx.push({ group: 'FAQ', title: f.question, desc: f.answer, path: '#/knowledge', kw: `${f.question}${f.answer}${f.category}` })
  );
  bestPractices.forEach((b) =>
    idx.push({
      group: '最佳实践',
      title: b.title,
      desc: b.summary,
      path: '#/knowledge/article/' + b.id,
      kw: `${b.title}${b.summary}${b.category}${b.author}`,
    })
  );
  Object.values(articles).forEach((a) =>
    idx.push({ group: '最佳实践', title: a.title, desc: `阅读正文 · ${a.readMin} 分钟`, path: '#/knowledge/article/' + a.id, kw: a.title })
  );
  toolGroups.forEach((g) =>
    g.tools.forEach((t) =>
      idx.push({ group: '工具导航', title: t.name, desc: `${t.purpose} · Owner ${t.owner}`, path: '#/workspace', kw: `${t.name}${t.purpose}${t.owner}${g.label}` })
    )
  );
  // 标签：搜「谁懂 RAG」→ 直达反查页。只索引 active 词（deprecated/merged 不再可选）。
  TAG_LIST.forEach((t) => {
    if (t.status !== 'active') return;
    idx.push({
      group: '标签',
      title: t.label,
      desc: `${t.group}`,
      path: '#/workspace/tags/' + t.id,
      kw: `${t.label}${t.group}${(t.aliases || []).join('')}`,
    });
  });
  // 去重（最佳实践与 articles 有重叠）
  const seen = new Set();
  return idx.filter((i) => {
    const k = i.group + '|' + i.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const SEARCH_INDEX = buildIndex();

export default function GlobalSearch({ open, onClose }) {
  const c = useT();
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const key = norm(q);
    if (!key) return [];
    const hit = SEARCH_INDEX.filter((i) => norm(i.kw).includes(key) || norm(i.title).includes(key));
    const map = new Map();
    hit.slice(0, 24).forEach((i) => {
      if (!map.has(i.group)) map.set(i.group, []);
      map.get(i.group).push(i);
    });
    return Array.from(map.entries());
  }, [q]);

  const total = groups.reduce((s, [, arr]) => s + arr.length, 0);

  const pick = (path) => {
    onClose();
    setQ('');
    go(path);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
      title={null}
      getContainer={false}
    >
      <div style={{ padding: '16px 16px 8px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SearchOutlined style={{ color: c.text3, fontSize: 16 }} />
          <Input
            autoFocus
            variant="borderless"
            placeholder="搜索公告 / 人员 / 标签 / Release / 工具 / FAQ"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={() => {
              const first = groups[0] && groups[0][1] && groups[0][1][0];
              if (first) pick(first.path);
            }}
            style={{ fontSize: 15, padding: 0 }}
          />
          <span className="dp-mono" style={{ fontSize: 11, color: c.text3, border: `1px solid ${c.border}`, borderRadius: 4, padding: '0 5px' }}>
            ESC
          </span>
        </div>
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto', padding: q ? '8px 8px 12px' : '32px 16px' }}>
        {!q && (
          <div style={{ textAlign: 'center' }}>
            <BrandSymbol size={44} muted />
            <div style={{ marginTop: 12, color: c.text2, fontSize: 14 }}>输入关键词开始检索</div>
            <div style={{ marginTop: 6, color: c.text3, fontSize: 12 }}>
              试试「积分规则」「POS v3.2」「SSO」「Grafana」
            </div>
          </div>
        )}

        {q && total === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: c.text3 }}>没有找到与「{q}」相关内容</span>}
            style={{ padding: '24px 0' }}
          />
        )}

        {q &&
          groups.map(([group, arr]) => (
            <div key={group} style={{ marginBottom: 8 }}>
              <div
                style={{
                  padding: '8px 10px 6px',
                  fontSize: 12,
                  color: c.text3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {group}
                <span className="dp-num" style={{ color: c.textDisabled }}>{arr.length}</span>
              </div>
              {arr.map((it, i) => (
                <button
                  key={group + i}
                  type="button"
                  onClick={() => pick(it.path)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 6,
                    padding: '9px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = c.page)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: c.ink, fontWeight: 500 }}>{it.title}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: c.text3,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {it.desc}
                    </div>
                  </div>
                  <RightOutlined style={{ color: c.textDisabled, fontSize: 12, marginTop: 4 }} />
                </button>
              ))}
            </div>
          ))}
      </div>

      {q ? (
        <div
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: c.text3,
          }}
        >
          <Space size={8}>
            <Pill semantic="neutral">共 {total} 条</Pill>
            <span>结果按频道分组</span>
          </Space>
          <Text type="secondary" style={{ fontSize: 12, color: c.text3 }}>
            回车打开首条 · ESC 关闭
          </Text>
        </div>
      ) : null}
    </Modal>
  );
}
