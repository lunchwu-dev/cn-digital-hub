/**
 * 自写 hash 路由（约 20 行，不引 react-router）
 * 约定：#/seg/sub/id  →  { seg, sub, id }
 * 例：#/knowledge/article/bp-stock-dedup → seg=knowledge, sub=article, id=bp-stock-dedup
 */
import { useEffect, useState } from 'react';

export const NAV = [
  { key: 'home', path: '#/home', label: '首页 · 今日 Hub', short: '首页' },
  { key: 'news', path: '#/news', label: '信息中心', short: '信息中心' },
  { key: 'ops', path: '#/ops', label: '监控运营', short: '监控运营' },
  { key: 'knowledge', path: '#/knowledge', label: '知识中心', short: '知识中心' },
  { key: 'workspace', path: '#/workspace', label: '工作台', short: '工作台' },
];

/** 详情页 → 主导航高亮的映射（列表段与详情段不同名时必须两个 key 都写） */
export const NAV_OF = {
  home: 'home',
  news: 'news',
  ops: 'ops',
  knowledge: 'knowledge',
  article: 'knowledge', // 详情页高亮回知识中心
  workspace: 'workspace',
};

export function go(path) {
  if (window.location.hash !== path) window.location.hash = path;
}

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/home');
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/home');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { hash, seg: parts[0] || 'home', sub: parts[1], id: parts[2] };
}
