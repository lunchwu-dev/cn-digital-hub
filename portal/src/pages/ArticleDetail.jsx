/**
 * 文章详情 —— 长文阅读排版
 * 结构：Breadcrumb + 标题 meta + 左 TOC / 右正文（16px / 1.75）
 */
import React from 'react';
import { Breadcrumb, Button, Space } from 'antd';
import { ClockCircleOutlined, UserOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { articles, bestPractices, META } from '../data/mock';
import { useT } from '../theme';
import { Panel, Pill, ChannelTag, PageEmpty } from '../components/ui';
import { go } from '../router';

function scrollToId(id) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** 有全文的用全文；只有卡片摘要的生成「建设中」版本，而不是甩一个 404 */
function resolveArticle(id) {
  if (articles[id]) return { article: articles[id], pending: false };
  const card = bestPractices.find((b) => b.id === id);
  if (!card) return { article: null, pending: false };
  return {
    pending: true,
    article: {
      id: card.id,
      title: card.title,
      category: `最佳实践 / ${card.category}`,
      author: card.author,
      authorRole: '待补充正文',
      updated: card.updated,
      readMin: card.readMin,
      owner: '待认领 · 已进入「待补知识」队列',
      toc: ['摘要', '内容建设中'],
      body: [
        { type: 'h2', text: '摘要' },
        { type: 'p', text: card.summary },
        { type: 'h2', text: '内容建设中' },
        {
          type: 'p',
          text:
            '本条目正文正在完善，当前版本仅提供摘要。完整正文会在内容负责人补齐后更新——这也是门户「待补知识」机制的一部分：当条目被反复访问却缺少正文时，它会自动进入待补队列。',
        },
        {
          type: 'p',
          text: '你可以直接在顶部导航「业务需求」里提交补充，或在知识中心 FAQ 里登记具体问题。',
        },
      ],
    },
  };
}

export default function ArticleDetail({ id }) {
  const c = useT();
  const { article, pending } = resolveArticle(id);

  if (!article) {
    return (
      <div className="dp-shell">
        <PageEmpty
          title="没有找到这篇内容"
          desc={`知识条目「${id || '未知'}」不存在，可能已被合并或移除。`}
          extra={
            <>
              <Button type="primary" onClick={() => go('#/knowledge')}>
                返回知识中心
              </Button>
              <Button onClick={() => go('#/home')}>回到今日 Hub</Button>
            </>
          }
        />
      </div>
    );
  }

  const slug = (t) => 'sec-' + t.replace(/\s+/g, '-');

  return (
    <div className="dp-shell">
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Button type="link" style={{ padding: 0 }} onClick={() => go('#/home')}>首页</Button> },
          { title: <Button type="link" style={{ padding: 0 }} onClick={() => go('#/knowledge')}>知识中心</Button> },
          { title: <span style={{ color: c.text2 }}>{article.category.split(' / ')[0]}</span> },
          { title: <span style={{ color: c.ink }}>{article.title}</span> },
        ]}
      />

      <div className="dp-grid dp-g-article" style={{ gap: 32, alignItems: 'start' }}>
        {/* 正文 */}
        <article>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <ChannelTag>{article.category}</ChannelTag>
              {pending ? <Pill semantic="warning" dot>正文建设中</Pill> : <Pill semantic="neutral">长文</Pill>}
            </div>
            <h1 style={{ margin: '12px 0 10px', fontSize: 32, fontWeight: 500, color: c.ink, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
              {article.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, color: c.text3 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <UserOutlined /> {article.author} · {article.authorRole}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ClockCircleOutlined /> 更新于 <span className="dp-num">{article.updated}</span>
              </span>
              <span className="dp-num">约 {article.readMin} 分钟阅读</span>
            </div>
          </div>

          <Panel style={{ padding: '28px 32px' }}>
            <div className="dp-article-body">
              {article.body.map((b, i) => {
                if (b.type === 'h2')
                  return (
                    <h2 key={i} id={slug(b.text)}>
                      {b.text}
                    </h2>
                  );
                if (b.type === 'h3') return <h3 key={i} id={slug(b.text)}>{b.text}</h3>;
                if (b.type === 'pre')
                  return (
                    <pre key={i}>
                      <code>{b.text}</code>
                    </pre>
                  );
                return <p key={i}>{b.text}</p>;
              })}
            </div>
          </Panel>

          <div
            style={{
              marginTop: 20,
              padding: '14px 18px',
              background: c.page,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: c.text3 }}>
              内容负责人：<span style={{ color: c.text2 }}>{article.owner}</span> · 内容修订请走顶部导航「业务需求」
            </span>
            <Space size={8}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => go('#/knowledge')}>
                返回列表
              </Button>
              <Button type="primary" onClick={() => go('#/workspace')}>
                提交内容修订
              </Button>
            </Space>
          </div>
        </article>

        {/* TOC 侧栏 */}
        <aside style={{ position: 'sticky', top: 76 }}>
          <Panel>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.border}`, fontSize: 13, fontWeight: 500, color: c.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: c.text3 }} /> 本文目录
            </div>
            <div style={{ padding: '8px 6px 10px' }}>
              {article.toc.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => scrollToId(slug(t))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    padding: '7px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    color: c.text2,
                    display: 'flex',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.page;
                    e.currentTarget.style.color = c.brand;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = c.text2;
                  }}
                >
                  <span className="dp-num" style={{ color: c.textDisabled, flex: '0 0 auto' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </Panel>
          <div style={{ marginTop: 12, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
            {pending
              ? '该条目正文仍在完善中，先提供了摘要。补齐后会在这里更新。'
              : `${META.portalName} 内部资料，请勿外传。`}
          </div>
        </aside>
      </div>
    </div>
  );
}
