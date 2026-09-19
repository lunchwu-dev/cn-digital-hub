/**
 * 应用外壳
 * 结构：深色顶栏（一级导航）+ 内容区（Watermark 水印）+ 页脚
 * 无左侧边栏；无登录 / 无个人中心 / 无已读态。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Watermark, Tour, Button, Skeleton, Space } from 'antd';
import TopBar from './components/TopBar';
import GlobalSearch from './components/GlobalSearch';
import AgentPanel from './components/AgentPanel';
import FloatAgent from './components/FloatAgent';
import Home from './pages/Home';
import News from './pages/News';
import Ops from './pages/Ops';
import Knowledge from './pages/Knowledge';
import ArticleDetail from './pages/ArticleDetail';
import Workspace from './pages/Workspace';
import PersonProfile from './pages/PersonProfile';
import TagBrowse from './pages/TagBrowse';
import Org from './pages/Org';
import DemandList from './pages/DemandList';
import DemandNew from './pages/DemandNew';
import { useHashRoute, NAV_OF, go } from './router';
import { store } from './store';
import { useT } from './theme';
import { META, demandHistory } from './data/mock';
import { BrandSymbol, PageEmpty } from './components/ui';

const TOUR_KEY = 'dp_portal_tour_done';
const AGENT_HINT_KEY = 'dp_agent_hint_seen';

const TOUR_STEPS = [
  {
    title: '欢迎来到 Digital 门户',
    description: '这里是迪卡侬中国 Digital 部门的内部信息与工具入口。顶栏横向导航即可到达七个主频道，没有侧边栏。',
  },
  {
    title: '全局搜索（快捷键 /）',
    description: '顶栏搜索框支持跨频道检索公告、Release、项目动态、工具与 FAQ，结果按频道分组。',
  },
  {
    title: 'Agent for Digital（右下角悬浮，随时可用）',
    description:
      '流程或规范上的疑问可以直接问 Agent —— 它现在常驻在页面右下角，不占导航位置，任何页面都能随时唤出。对门户本身的意见与建议也可以直接告诉它，它会帮你登记成反馈。知识中心的 FAQ 与最佳实践会持续沉淀为它的语料。',
  },
  {
    title: '内容负责人机制',
    description: '每个区块都标注内容负责人与最后更新时间；超过 90 天未更新会自动进入待复核队列，防止内容荒废。',
  },
];

function PageSkeleton() {
  return (
    <div className="dp-shell">
      <Skeleton active title={{ width: 240 }} paragraph={{ rows: 1, width: 460 }} />
      <div className="dp-grid dp-g4" style={{ marginTop: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dp-card" style={{ padding: 16 }}>
            <Skeleton active title={{ width: 80 }} paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
      <div className="dp-card" style={{ padding: 20, marginTop: 24 }}>
        <Skeleton active title={{ width: 160 }} paragraph={{ rows: 4 }} />
      </div>
    </div>
  );
}

function NotFound({ route }) {
  const c = useT();
  return (
    <div className="dp-shell">
      <PageEmpty
        title="页面不存在"
        desc={`没有匹配到路由「${route.hash || '#/'}」。门户目前提供七个一级栏目：首页 · 今日 Hub、信息中心、监控运营、知识中心、组织速查、业务需求、工作台。如果你是从旧链接进入，内容可能已被合并或迁移。`}
        extra={
          <>
            <Button type="primary" onClick={() => go('#/home')}>
              回到今日 Hub
            </Button>
            <Button onClick={() => go('#/knowledge')}>去知识中心</Button>
          </>
        }
      />
      <div style={{ textAlign: 'center', fontSize: 12, color: c.text3 }}>
        找不到内容时，也可以直接用顶栏的全局搜索或问 Agent for Digital。
      </div>
    </div>
  );
}

/* 注：原模块级 renderRoute(route, onOpenAgent) 已删除。
   它拿不到组件内 state（demandRows / demandDraft），且 02b §E.3 明确要求
   改为 App 组件内的闭包版本。保留这份死代码只会让后来者改错地方。 */

export default function App() {
  const route = useHashRoute();
  const c = useT();
  const [searchOpen, setSearchOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentSeed, setAgentSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const [demandRows, setDemandRows] = useState(demandHistory);
  // 草稿提升到 shell 层（02b §E.3）：切页不销毁 → 误点返回 / 跳走再回来都不丢草稿；提交成功后清空
  const [demandDraft, setDemandDraft] = useState({ title: '', type: undefined, systems: [] });

  const searchRef = useRef(null);
  const agentRef = useRef(null);
  const navRef = useRef(null);

  // 导航高亮：优先按 sub 段解析（02b §A.4 要求 people / tags 高亮回「组织速查」，
  // 但它们的 URL 段是 #/workspace/people/<id> 与 #/workspace/tags —— seg 仍是 workspace。
  // 若只按 seg 查，NAV_OF.people / NAV_OF.tags 永远不会被命中，高亮会错误停在「工作台」。
  // 因此先试 NAV_OF[route.sub]，未命中再回落 NAV_OF[route.seg]。）
  const activeKey = NAV_OF[route.sub] || NAV_OF[route.seg] || 'home';
  const isDemandNew = route.seg === 'demand' && route.sub === 'new';

  const addDemandRow = (row) => setDemandRows((prev) => [row, ...prev]);

  // 每切换路由展示一次加载态（Skeleton 出现 → 消失）
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, [route.seg, route.sub, route.id]);

  // 首次访问引导
  useEffect(() => {
    if (!store.get(TOUR_KEY)) setTourOpen(true);
  }, []);

  // 二级页（#/demand/new）不渲染悬浮 doodle（02b §E.4）——
  //   进入时强制关闭全局面板，避免「两个对话入口 + 一个带上下文的表单」同屏。
  useEffect(() => {
    if (isDemandNew) setAgentOpen(false);
  }, [isDemandNew]);

  // 快捷键 /
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/i.test(tag)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openAgent = (seed) => {
    setAgentSeed(seed || '');
    setAgentOpen(true);
  };

  const closeAgent = () => {
    setAgentOpen(false);
    // Esc/关闭后把焦点送回 doodle（02b §B.7 无障碍硬要求）
    if (agentRef.current) agentRef.current.focus();
  };

  // 首次点开面板即消除提示点（一次性，永不再现）—— store.set 在 file:// 不透明源会抛错，必须容错
  const markAgentHintSeen = () => {
    try {
      store.set(AGENT_HINT_KEY, '1');
    } catch {
      /* 静默降级 */
    }
  };

  const closeTour = () => {
    setTourOpen(false);
    store.set(TOUR_KEY, '1');
  };

  // renderRoute 由模块级函数改为组件内闭包（02b §E.3）：需要捕获 state（demandRows/draft）与 openAgent。
  // notFound 显式包一层：NotFound 是解构收参（{ route }），必须传 route prop，
  // 不可写成 <NotFound hash={r} />（会让 route.hash 变 undefined，404 文案里的坏链接退化成「#/」）。
  const notFound = (r) => <NotFound route={r} />;
  const renderRoute = (r) => {
    switch (r.seg) {
      case 'home':
        // P1-1：把 demandRows 下发给首页 —— 首页「提交需求」区块不再用静态 demandHistory，
        // 与 #/demand / #/demand/new 共用同一份 state，保证站内单一真相源。
        return <Home onOpenAgent={openAgent} demandRows={demandRows} />;
      case 'news':
        return <News />;
      case 'ops':
        return <Ops />;
      case 'knowledge':
        return r.sub === 'article' ? <ArticleDetail id={r.id} /> : <Knowledge />;
      case 'org':
        return <Org route={r} />;
      case 'demand':
        return r.sub === 'new' ? (
          <DemandNew rows={demandRows} onAdd={addDemandRow} draft={demandDraft} setDraft={setDemandDraft} />
        ) : (
          <DemandList rows={demandRows} />
        );
      case 'workspace':
        return r.sub === 'people' ? (
          <PersonProfile id={r.id} />
        ) : r.sub === 'tags' ? (
          <TagBrowse id={r.id} />
        ) : (
          <Workspace route={r} />
        );
      default:
        return notFound(r);
    }
  };

  const [agentHintSeen, setAgentHintSeen] = useState(() => !!store.get(AGENT_HINT_KEY));
  const showAgentDot = !agentHintSeen;

  return (
    <div style={{ minHeight: '100%', background: c.page, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        activeKey={activeKey}
        onOpenSearch={() => setSearchOpen(true)}
        refs={{ search: searchRef, nav: navRef }}
      />

      <Watermark content={META.watermark} className="dp-watermark" gap={[140, 140]} zIndex={9} font={{ fontSize: 13 }}>
        <main style={{ flex: 1, minHeight: 'calc(100vh - 60px - 64px)' }}>
          {loading ? <PageSkeleton /> : renderRoute(route)}
        </main>
      </Watermark>

      <footer style={{ borderTop: `1px solid ${c.border}`, background: c.surface }}>
        <div
          className="dp-container"
          style={{
            paddingTop: 18,
            paddingBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            fontSize: 12,
            color: c.text3,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <BrandSymbol size={20} muted />
            {META.department} · {META.portalName}
          </span>
          {/* padding-right 72px：纯 CSS 让页脚右侧内容主动为右下角常驻 doodle 让位（02b §B.2 兜底） */}
          <Space size={16} wrap style={{ fontSize: 12, color: c.text3, paddingRight: 72 }}>
            <span style={{ color: c.text2 }}>本原型所有数据均为示意数据 · 非真实运行值</span>
            <span>内部系统 · 请勿外传</span>
            <span>
              内容负责人 <span style={{ color: c.text2 }}>{META.owner}</span>
            </span>
            <span>
              最后更新 <span className="dp-num" style={{ color: c.text2 }}>{META.updated}</span>
            </span>
            <Button type="link" size="small" onClick={() => setTourOpen(true)} style={{ padding: 0 }}>
              重新查看引导
            </Button>
          </Space>
        </div>
      </footer>

      {/* ★ 悬浮 doodle —— 与 TopBar / Watermark / footer 平级，不受水印覆盖（02b §B.3）
          ★ 条件卸载（不是 CSS 隐藏）：#/demand/new 上不渲染，避免两个 agent 入口同屏（02b §E.4） */}
      {!isDemandNew ? (
        <FloatAgent
          onClick={() => (agentOpen ? closeAgent() : openAgent())}
          showDot={showAgentDot}
          ariaExpanded={agentOpen}
          buttonRef={agentRef}
        />
      ) : null}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      {!isDemandNew ? (
        <AgentPanel
          open={agentOpen}
          onClose={closeAgent}
          seed={agentSeed}
          onFirstOpen={() => {
            if (showAgentDot) setAgentHintSeen(true);
            markAgentHintSeen();
          }}
        />
      ) : null}

      <Tour
        open={tourOpen}
        onClose={closeTour}
        onFinish={closeTour}
        steps={TOUR_STEPS}
        indicatorsRender={(current, total) => <span className="dp-mono" style={{ fontSize: 12 }}>{current + 1} / {total}</span>}
      />
    </div>
  );
}
