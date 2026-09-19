/**
 * 应用外壳
 * 结构：深色顶栏（一级导航）+ 内容区（Watermark 水印）+ 页脚
 * 无左侧边栏；无登录 / 无个人中心 / 无已读态。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Watermark, Tour, Button, Skeleton, Space } from 'antd';
import TopBar from './components/TopBar';
import GlobalSearch from './components/GlobalSearch';
import AgentDrawer from './components/AgentDrawer';
import Home from './pages/Home';
import News from './pages/News';
import Ops from './pages/Ops';
import Knowledge from './pages/Knowledge';
import ArticleDetail from './pages/ArticleDetail';
import Workspace from './pages/Workspace';
import { useHashRoute, NAV_OF, go } from './router';
import { store } from './store';
import { useT } from './theme';
import { META } from './data/mock';
import { BrandSymbol, PageEmpty } from './components/ui';

const TOUR_KEY = 'dp_portal_tour_done';

const TOUR_STEPS = [
  {
    title: '欢迎来到 Digital 门户',
    description: '这里是迪卡侬中国 Digital 部门的内部信息与工具入口。顶栏横向导航即可到达五个主频道，没有侧边栏。',
  },
  {
    title: '全局搜索（快捷键 /）',
    description: '顶栏搜索框支持跨频道检索公告、Release、项目动态、工具与 FAQ，结果按频道分组。',
  },
  {
    title: 'Agent for Digital',
    description: '流程或规范上的疑问可以直接问 Agent。知识中心的 FAQ 与最佳实践会持续沉淀为它的语料。',
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
        desc={`没有匹配到路由「${route.hash || '#/'}」。门户目前提供：今日 Hub、信息中心、监控运营、知识中心、工作台。如果你是从旧链接进入，内容可能已被合并或迁移。`}
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

function renderRoute(route, onOpenAgent) {
  switch (route.seg) {
    case 'home':
      return <Home onOpenAgent={onOpenAgent} />;
    case 'news':
      return <News />;
    case 'ops':
      return <Ops />;
    case 'knowledge':
      return route.sub === 'article' ? <ArticleDetail id={route.id} /> : <Knowledge />;
    case 'workspace':
      return <Workspace route={route} />;
    default:
      return <NotFound route={route} />;
  }
}

export default function App() {
  const route = useHashRoute();
  const c = useT();
  const [searchOpen, setSearchOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentSeed, setAgentSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);

  const searchRef = useRef(null);
  const agentRef = useRef(null);
  const navRef = useRef(null);

  const activeKey = NAV_OF[route.seg] || 'home';

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

  const closeTour = () => {
    setTourOpen(false);
    store.set(TOUR_KEY, '1');
  };

  return (
    <div style={{ minHeight: '100%', background: c.page, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        activeKey={activeKey}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAgent={() => openAgent()}
        refs={{ search: searchRef, agent: agentRef, nav: navRef }}
      />

      <Watermark content={META.watermark} className="dp-watermark" gap={[140, 140]} zIndex={9} font={{ fontSize: 13 }}>
        <main style={{ flex: 1, minHeight: 'calc(100vh - 60px - 64px)' }}>
          {loading ? <PageSkeleton /> : renderRoute(route, openAgent)}
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
          <Space size={16} wrap style={{ fontSize: 12, color: c.text3 }}>
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

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AgentDrawer open={agentOpen} onClose={() => setAgentOpen(false)} seed={agentSeed} />

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
