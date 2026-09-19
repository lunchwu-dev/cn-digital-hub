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
  { key: 'org', path: '#/org', label: '组织速查', short: '组织速查' }, // 新增（02b §A.5）
  { key: 'demand', path: '#/demand', label: '业务需求', short: '业务需求' }, // 新增（02b §A.5）
  { key: 'workspace', path: '#/workspace', label: '工作台', short: '工作台' },
];

/** 详情页 → 主导航高亮的映射（列表段与详情段不同名时必须两个 key 都写） */
export const NAV_OF = {
  home: 'home',
  news: 'news',
  ops: 'ops',
  knowledge: 'knowledge',
  article: 'knowledge', // 详情页高亮回知识中心
  org: 'org', // 新增：组织速查一级栏目
  // ★ 为什么 people 在 workspace 路径下却高亮 org？
  //   员工的个人主页 URL 仍是 #/workspace/people/<id>（§A.4 裁决：URL 不迁，
  //   因为 smoke.cjs 用正则把这条路径钉死了，迁移对用户零收益、对回归全是成本）。
  //   但语义上「看某个人的主页」属于「组织速查」这一信息发现类栏目，不是「工作台」。
  //   若保持高亮回 workspace，会出现逻辑断裂：用户从组织速查点进个人主页，
  //   高亮却跳回工作台，等于系统在说「你已经离开了组织速查」——但他人明明还在看组织信息。
  //   所以用 NAV_OF 显式把「路径归属」与「导航归属」解耦：URL 前缀是历史包袱，
  //   高亮以信息语义为准。tags（标签反查）同理。
  people: 'org', // ★ 变更：员工个人主页由 workspace → org
  tags: 'org', // ★ 变更：标签反查页由 workspace → org
  demand: 'demand', // 新增：业务需求一级栏目
  workspace: 'workspace', // 工作台退回纯工具目录
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
