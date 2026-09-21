/**
 * 深色顶栏（面积色 #000F17，高 60px）
 * 一级导航横向排布 —— 本项目不设左侧边栏。
 * 右侧只有两件事：全局搜索 / 通知（无登录、无个人中心）。
 *   · Agent for Digital 入口已移至右下角悬浮 doodle（02b §B）；
 *   · 反馈入口已融合进 Agent 的结构化能力（02b §C）。
 *
 * 窄屏折叠：折叠状态一律由 global.css 的 @media + className 控制，**不写内联 style**
 *（内联 style 无法被媒体查询覆盖，是此前窄屏顶栏始终不折叠的根因）。
 */
import React from 'react';
import { Badge, Button, Tooltip, Popover } from 'antd';
import {
  HomeOutlined,
  NotificationOutlined,
  DashboardOutlined,
  ReadOutlined,
  TeamOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  SearchOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useT } from '../theme';
import { BrandSymbol } from './ui';
import { NAV, go } from '../router';
import { META } from '../data/mock';

const NAV_ICON = {
  home: HomeOutlined,
  news: NotificationOutlined,
  ops: DashboardOutlined,
  knowledge: ReadOutlined,
  org: TeamOutlined, // 新增：组织 → 人
  demand: FileTextOutlined, // 新增：需求 → 文档（不用 BugOutlined/AlertOutlined，避免警示联想）
  workspace: AppstoreOutlined,
};

const NOTICES = [
  { title: '「打印机密价」制度更新待你确认', time: '2 小时前' },
  { title: '库存服务本周第二次补货延迟', time: '今天 09:12' },
  { title: '你的知识条目被引用 3 次', time: '昨天' },
];

export default function TopBar({ activeKey, onOpenSearch, noticeCount = 3, refs = {} }) {
  const c = useT();
  // 字标两段式配色：按第一个空格把站点名切成「主词 / 余下」。
  // 站点名里没有空格时 nameRest 为空串，整串走主色段（不会渲染空的浅色 span）。
  const [nameHead, ...nameTail] = META.portalName.split(' ');
  const nameRest = nameTail.join(' ');

  const noticePanel = (
    <div style={{ width: 268 }}>
      <div style={{ fontSize: 12, color: c.text3, marginBottom: 6 }}>近 7 天 · {noticeCount} 条</div>
      {NOTICES.map((n) => (
        <div key={n.title} className="dp-notice-item">
          <div style={{ color: c.ink, fontSize: 13, lineHeight: 1.5 }}>{n.title}</div>
          <div className="dp-num" style={{ color: c.text3, fontSize: 12, marginTop: 2 }}>
            {n.time}
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 8,
          paddingTop: 10,
          borderTop: `1px solid ${c.border}`,
          fontSize: 12,
          color: c.text3,
        }}
      >
        通知中心为原型示意，接入消息服务后开放。
      </div>
    </div>
  );

  return (
    <header className="dp-topbar">
      <div className="dp-container dp-topbar-inner">
        {/* Logo：公告栏图形符号仅用于页头 */}
        <div className="dp-logo">
          <BrandSymbol size={30} color={c.darkText1} />
          {/* dp-logo-text：T4（768–940）只隐藏文字保留符号，故文字块必须有类名 */}
          <div className="dp-logo-text" style={{ lineHeight: 1.15 }}>
            {/* v0.6 更名：字标与副标都取 META（站点名唯一权威来源），不再硬编码。
                两段式配色沿用旧字标的手法：首词深色主色、其余浅一号 —— 不用字符串切割
                硬编码位置，而是按第一个空格分段；名字若只有一个词则整体走前段。 */}
            <div style={{ color: c.darkText1, fontSize: 15, fontWeight: 500, letterSpacing: '0.02em' }}>
              {nameHead}
              {nameRest ? <span style={{ color: c.darkText2, fontWeight: 400 }}> {nameRest}</span> : null}
            </div>
            <div className="dp-logo-sub">{META.portalNameEn}</div>
          </div>
        </div>

        {/* 一级导航（7 项） */}
        <nav ref={refs.nav} className="dp-nav" aria-label="主导航">
          {NAV.map((n) => {
            const Icon = NAV_ICON[n.key];
            const active = activeKey === n.key;
            return (
              <button
                key={n.key}
                type="button"
                className="dp-nav-item"
                data-active={active ? 'true' : 'false'}
                aria-current={active ? 'page' : undefined}
                title={n.short}
                onClick={() => go(n.path)}
              >
                <Icon style={{ fontSize: 16 }} />
                <span className="dp-nav-text">{n.short}</span>
              </button>
            );
          })}
        </nav>

        {/* 右侧动作区：只剩搜索 + 通知（Agent 按钮与反馈按钮均已移除） */}
        <div className="dp-topbar-actions">
          <span ref={refs.search} className="dp-search-wrap">
            <button
              type="button"
              className="dp-search-pill"
              onClick={onOpenSearch}
              aria-label="打开全局搜索"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 14px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <SearchOutlined style={{ fontSize: 15 }} />
              <span className="dp-search-label" style={{ color: c.darkText3, flex: 1, textAlign: 'left' }}>
                搜索公告 / Release / 工具 / FAQ
              </span>
              <span className="dp-mono dp-search-kbd">/</span>
            </button>
          </span>

          <Popover placement="bottomRight" trigger="click" title="通知" content={noticePanel} getContainer={false}>
            <Badge count={noticeCount} size="small" color={c.yellow} offset={[-2, 2]}>
              <Button type="text" className="dp-icon-btn" aria-label="通知" icon={<BellOutlined />} />
            </Badge>
          </Popover>
        </div>
      </div>
    </header>
  );
}

