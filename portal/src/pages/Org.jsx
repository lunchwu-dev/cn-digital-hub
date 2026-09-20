/**
 * 组织速查（一级栏目 #/org）—— 02b §A 导航 5→7 项后新增的一级页。
 * 内容复用 Workspace 里原有的 OrgView（组件不搬家，只把入口升为一级栏目），
 * 这样 #/workspace/people/<id> 的个人主页返回路径与既有实现零改动。
 */
import React from 'react';
import { useT } from '../theme';
import { ContentMeta } from '../components/ui';
import { OrgView } from './Workspace';
import { META } from '../data/mock';

export default function Org() {
  const c = useT();
  return (
    <div className="dp-shell">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>组织速查</h1>
          <span style={{ fontSize: 14, color: c.text2 }}>按姓名、团队或技能标签找到对接人</span>
        </div>
        <ContentMeta owner="设计系统组 · 周敏 / 内容运营 · 孙玥" updated={META.updated} style={{ marginTop: 10 }} />
      </div>

      <OrgView />
    </div>
  );
}
