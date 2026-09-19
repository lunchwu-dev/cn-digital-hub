/**
 * 业务需求 · 一级页（#/demand）
 * ==================================================================
 * 设计系统：Decathlon Digital Design Tokens（portal/src/theme.js）
 * 施工依据：outputs/02b-site-restructure-spec.md §D 全文 + §E.2 + §F
 *
 * 页面结构（§D.1）：
 *   h1「业务需求」+ 说明 + ContentMeta          ← 页头
 *   [需求状态楼层]  5 格 · 单 Panel 横向 + 内部分隔线（.dp-floor）
 *   [+ 新增需求]   页头右侧 primary lg 主按钮  +  列表上方整行虚线入口
 *   Panel：需求列表（全量，可被楼层下钻过滤）
 *
 * 硬约束（违反即返工）：
 *   - file:// 可双击打开（无 ESM/crossorigin/外部请求）
 *   - JSX 零硬编码颜色，一律 const c = useT()
 *   - 响应式重排容器禁止在 JSX 写内联 display（.dp-floor 桌面态由 CSS 类表达）
 *   - 任何浮层 getContainer={false}
 *   - 不出现「得分/扣分/满分/分数」字样
 *   - 不出现「请到工作台「需求提交」提交」句式
 */
import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, ClockCircleOutlined, ClearOutlined } from '@ant-design/icons';
import { demandStats, META } from '../data/mock';
import { useT } from '../theme';
import { Panel, PanelHead, ContentMeta, PageEmpty, Pill, InitialAvatar } from '../components/ui';
import { go } from '../router';

/* ------------------------------------------------------------------
 * 楼层计算（§D.2）：基准日取 META.updated 的日期部分。
 *
 * ⚠️ 规范点名的真实坑：expectAt 可能是字符串 '无硬性期限'，
 *    参与日期运算会得 NaN 并静默污染计数 → 必须先用正则排除。
 * ------------------------------------------------------------------ */
const BASE_DATE = (META.updated || '').slice(0, 10); // '2026-09-17'
const TODAY = new Date(BASE_DATE + 'T00:00:00');

/** 仅接受严格的 YYYY-MM-DD 字符串（排除 '无硬性期限' 这类文案） */
function isDateStr(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/** 基准日 / 真实今天各自的 {y,m,d}，用于判定「本月新增」是否已经过完 */
function ymd(d) {
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}
const baseStamp = ymd(TODAY);
/**
 * 真实「今天」——P2-3：改为**可注入**，默认取真实系统时间。
 * 原写法 `const todayStamp = ymd(new Date())` 在模块加载时固化，导致：
 *   · 单测/截图随当天日期漂移（同一份 dist 在不同日期跑出不同 UI）；
 *   · 「本月新增 · 截至今日」副标签的显隐不可复现。
 * 现在由 DemandList 的 `today` prop 注入（缺省 `new Date()`），
 * 使测试可固定基准日、UI 行为可复现。
 */
function resolveTodayStamp(today) {
  const d = today instanceof Date ? today : new Date();
  return ymd(d);
}
/** 今天 − 某日期 = 已过天数（正数表示过去） */
function daysSince(dateStr) {
  return Math.round((TODAY - new Date(dateStr + 'T00:00:00')) / 86400000);
}
/** 某日期 − 今天 = 剩余天数（正数表示未来） */
function daysUntil(dateStr) {
  return Math.round((new Date(dateStr + 'T00:00:00') - TODAY) / 86400000);
}

/** R3 阻塞词表（§D.2）。
 *  注：规范原文词表里写的是「待确认库范围」，但 mock.js 该条真实 note 是
 *  「待系统负责人确认库范围」—— 原文串并非其子串（规范自相矛盾）。
 *  取真实 note 的子串「确认库范围」，语义不变、阈值不放宽，仅修正拼写。 */
const BLOCK_WORDS = ['阻塞', '卡住', '待第三方', '等依赖', '确认库范围', '搁置', '暂停'];

/** 异常告警四条规则 R1–R4 的并集（去重：一条命中多规则只计 1 次） */
function isAlert(r) {
  // R1 · SLA 超期未受理：pending 且未分配且已过 > 3 天
  if (r.status === 'pending' && r.assignee === '待分配' && daysSince(r.submitted) > 3) return true;
  // R2 · 承诺时间临近：合法日期且 0 ≤ 剩余 ≤ 3 天且未完成
  if (isDateStr(r.expectAt) && daysUntil(r.expectAt) >= 0 && daysUntil(r.expectAt) <= 3 && r.status !== 'done') return true;
  // R3 · 被标记阻塞：note 命中阻塞词表
  if (BLOCK_WORDS.some((w) => String(r.note || '').includes(w))) return true;
  // R4 · 长期滞留：inprogress 且已过 > 21 天
  if (r.status === 'inprogress' && daysSince(r.submitted) > 21) return true;
  return false;
}

/** 楼层 5 格：顺序固定（§D.4）。label / key / 计算 / 是否可下钻
 *
 *  ⚠️ 「异常告警」格额外挂 ownerText：用户原话是「异常告警需求待跟进事项**及责任人**」，
 *  若这条格子里只有数字，责任人要下钻进列表、再逐行扫右端才能拼出来 ——
 *  等于把用户点名的信号藏在两级之外。这里在格内直接给出「谁要跟进」。
 *  写法受两条约束：① 只用 text3/ink 与品牌蓝，不得引入任何语义色（§D.3 红线）；
 *             ② 具体人名只能在**单一责任人**时上屏 —— 多责任人时列名字会挤爆格子，
 *                退化为「等 N 人」，把「是哪几个人」留给下钻后的列表。
 */
function isSameDay(a, b) {
  return a && b && a.y === b.y && a.m === b.m && a.d === b.d;
}

/**
 * 异常告警格「责任人摘要」纯函数（P2-2：把多责任人分支抽出来可单测）。
 * 分支（按 owners 去重数组的长度）：
 *   · []                → ''（无告警，不显示摘要）
 *   · ['待分配']         → '尚未指派 · 需受理组认领'
 *   · ['顾一鸣']         → '责任人 顾一鸣'
 *   · ['顾一鸣','待分配'] → '责任人 顾一鸣 + 待指派'
 *   · 其它 >0 人         → '责任人 N 人 · 含待指派'（N = owners.length，含待分配时）
 * 原先这三条 `owners.length === 1 / 2 / >2` 分支从未被测试覆盖（数据恒为 1 人）。
 * 抽成纯函数后由 smoke 直接喂入多责任人输入断言，覆盖全部路径。
 */
export function floorOwnerText(owners) {
  const list = Array.isArray(owners) ? owners : [];
  if (list.length === 1) {
    return list[0] === '待分配' ? '尚未指派 · 需受理组认领' : `责任人 ${list[0]}`;
  }
  if (list.length === 2 && list.includes('待分配')) {
    return `责任人 ${list.find((o) => o !== '待分配')} + 待指派`;
  }
  if (list.length > 0) {
    return `责任人 ${list.length} 人 · 含待指派`;
  }
  return '';
}

function buildFloor(rows, todayStamp) {
  const stats = demandStats(rows);
  const thisMonth = (BASE_DATE || '').slice(0, 7); // '2026-09'
  const alerts = rows.filter(isAlert);
  const owners = [...new Set(alerts.map((r) => r.assignee || '待分配'))];
  const ownerText = floorOwnerText(owners);
  return [
    { key: 'pending', label: '待处理', count: stats.pending, drill: true, match: (r) => r.status === 'pending' },
    { key: 'inprogress', label: '进行中', count: stats.inprogress, drill: true, match: (r) => r.status === 'inprogress' },
    { key: 'done', label: '已完成', count: stats.done, drill: true, match: (r) => r.status === 'done' },
    {
      key: 'alert',
      label: '异常告警',
      sub: '待跟进',
      count: alerts.length,
      drill: true,
      alert: true,
      ownerText,
      match: isAlert,
    },
    {
      key: 'month',
      label: '本月新增',
      sub: isSameDay(todayStamp, baseStamp) ? '截至今日' : undefined,
      count: rows.filter((r) => String(r.submitted || '').slice(0, 7) === thisMonth).length,
      drill: false,
    },
  ];
}

/** 列表内的单条状态胶囊（这是唯一允许 info/success 语义色的地方，§D.3） */
const STATUS_MAP = {
  pending: { label: '待处理', semantic: 'neutral' },
  inprogress: { label: '进行中', semantic: 'info' },
  done: { label: '已完成', semantic: 'success' },
};
const STATUS_FALLBACK = { label: '待处理', semantic: 'neutral' };

/* ------------------------------------------------------------------
 * 单条需求列表行 —— 沿用 .dp-row 范式（行高 / hover / 分隔线）
 * 故意**不**加 role="button" / tabIndex / onClick：
 *   需求详情没有独立路由，「点进去」无处可去。给一个点了没反应的可点行，
 *   比不可点更糟 —— 它是键盘可达的谎言。真正的入口是上方「新增需求」。
 * ------------------------------------------------------------------ */
function DemandRow({ r }) {
  const c = useT();
  const m = STATUS_MAP[r.status] || STATUS_FALLBACK;
  const alert = isAlert(r);
  return (
    <div className="dp-row" style={{ alignItems: 'flex-start' }}>
      {/* 需求编号（等宽）+ 异常标记 */}
      <span
        className="dp-mono"
        style={{ fontSize: 12, color: c.text3, width: 108, flex: '0 0 auto', paddingTop: 3 }}
      >
        {r.id}
      </span>

      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            color: c.ink,
            lineHeight: 1.5,
            minWidth: 0,
          }}
        >
          {/* 「异常告警」在列表内的标记：品牌蓝图标 + 中性 chip，零语义色（§D.3） */}
          {alert ? (
            <span
              className="dp-chip"
              title="待跟进：命中异常告警规则"
              style={{
                flex: '0 0 auto',
                background: c.brandSubtle,
                border: `1px solid ${c.brandBorder}`,
                color: c.brand,
                gap: 4,
              }}
            >
              <ExclamationCircleOutlined style={{ fontSize: 11 }} />
              待跟进
            </span>
          ) : null}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 3,
            fontSize: 12,
            color: c.text3,
            flexWrap: 'wrap',
          }}
        >
          <span className="dp-num">{r.submitted}</span>
          <span>·</span>
          <span>{r.track === 'brd' ? '完整档' : '轻量档'}</span>
          {r.expectAt && r.expectAt !== '无硬性期限' ? (
            <>
              <span>·</span>
              <span>
                期望 <span className="dp-num">{r.expectAt}</span>
              </span>
            </>
          ) : null}
          {r.note ? (
            <>
              <span>·</span>
              <span style={{ color: c.text2 }}>{r.note}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 责任人 + 状态胶囊 */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
        <span style={{ fontSize: 12, color: c.text3, whiteSpace: 'nowrap' }}>
          责任人 <span style={{ color: c.text2 }}>{r.assignee || '待分配'}</span>
        </span>
        <InitialAvatar name={r.assignee} size={24} />
        <Pill semantic={m.semantic} dot>
          {m.label}
        </Pill>
      </div>
    </div>
  );
}

/* ================================================================== */
export function DemandList({ rows, today }) {
  const c = useT();
  // 楼层下钻过滤：组件内状态，单选，不进路由（§D.5）
  const [floorFilter, setFloorFilter] = useState(null);

  // P2-3：「今天」可注入（缺省真实系统时间）；用 useMemo 固定同一次渲染的口径。
  const todayStamp = useMemo(() => resolveTodayStamp(today), [today]);
  const floor = useMemo(() => buildFloor(rows, todayStamp), [rows, todayStamp]);
  const activeCell = floor.find((f) => f.key === floorFilter) || null;

  const list = useMemo(() => {
    if (!activeCell || !activeCell.match) return rows;
    return rows.filter(activeCell.match);
  }, [rows, activeCell]);

  const total = rows.length;

  return (
    <div className="dp-shell">
      {/* ————— 页头 ————— */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>业务需求</h1>
            <div style={{ marginTop: 6, fontSize: 14, color: c.text2, lineHeight: 1.65 }}>
              内部系统与数据需求的统一入口。谁提了什么、处理到哪一步，都在这份公开列表里。
            </div>
          </div>
          {/* 页级主行动（§E.2）：primary 无 ghost，与「申请权限」的 primary ghost 区分 */}
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => go('#/demand/new')}>
            新增需求
          </Button>
        </div>
        <ContentMeta
          owner="需求受理组 · 吴桐"
          updated={META.updated}
          style={{ marginTop: 10 }}
        />
      </div>

      {/* ————— 需求状态楼层（§D.1 / §D.4）————— */}
      <Panel style={{ overflow: 'hidden', marginBottom: 12 }}>
        <div className="dp-floor" role="group" aria-label="需求状态概览">
          {floor.map((f) => {
            const isActive = f.drill && floorFilter === f.key;
            const common = {
              className: 'dp-floor-cell',
              'data-alert': f.alert ? 'true' : 'false',
              'data-static': f.drill ? undefined : 'true',
            };
            const inner = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.text3, fontSize: 12 }}>
                  {f.alert ? <ExclamationCircleOutlined style={{ color: c.brand, fontSize: 13 }} /> : null}
                  {f.label}
                  {f.sub ? (
                    <span style={{ color: f.alert ? c.brand : c.text3, opacity: f.alert ? 0.85 : 1 }}>· {f.sub}</span>
                  ) : null}
                </div>
                <div
                  className="dp-num"
                  style={{ fontSize: 28, fontWeight: 500, color: c.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}
                >
                  {f.count}
                </div>
                {/* 异常告警格的责任人摘要（用户点名的「及责任人」）——纯中性灰，零语义色 */}
                {f.ownerText ? (
                  <div
                    className="dp-floor-owner"
                    style={{
                      fontSize: 12,
                      color: c.text3,
                      marginTop: 2,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.ownerText}
                  </div>
                ) : null}
              </>
            );
            // 可下钻格：role=button + tabIndex + aria-pressed（§D.5 / A1）
            if (f.drill) {
              return (
                <div
                  key={f.key}
                  {...common}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive ? 'true' : 'false'}
                  aria-label={`筛选：${f.label}，${f.count} 条${f.ownerText ? '，' + f.ownerText : ''}`}
                  onClick={() => setFloorFilter(isActive ? null : f.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFloorFilter(isActive ? null : f.key);
                    }
                  }}
                >
                  {inner}
                </div>
              );
            }
            // 「本月新增」不可下钻：静态格，无 role/tabIndex
            return (
              <div key={f.key} {...common}>
                {inner}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 楼层说明行（§D.3 / §F.5 T5）—— 语义色不越界的天然锚点 */}
      <div style={{ marginBottom: 20, fontSize: 12, color: c.text3, lineHeight: 1.6 }}>
        计数为示意数据 · 状态色仅用于列表内的单条标记
      </div>

      {/* ————— 列表上方的整行新增入口（§E.2）————— */}
      <button
        type="button"
        className="dp-demand-addrow"
        onClick={() => go('#/demand/new')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 16px',
          marginBottom: 16,
          background: c.brandSubtle,
          border: `1px dashed ${c.brandBorder}`,
          borderRadius: c.radiusCard,
          color: c.brand,
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <PlusOutlined />
        新增需求
      </button>

      {/* ————— 需求列表（可被楼层下钻过滤）————— */}
      {/* padding-bottom 72px：给常驻悬浮 doodle 让位（§B.2 裁决）——只改内边距，不涉及 display，不触发红线 1 */}
      <Panel className="dp-demand-list" style={{ overflow: 'hidden', paddingBottom: 72 }}>
        <PanelHead
          title={activeCell ? `需求列表 · ${activeCell.label} ${list.length} 条` : '需求列表'}
          desc={activeCell ? undefined : '全部需求 · 按提交时间倒序'}
          extra={
            activeCell ? (
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setFloorFilter(null)}>
                ✕ 清除筛选
              </Button>
            ) : (
              <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>
                {total} 条
              </span>
            )
          }
        />

        {list.length === 0 ? (
          <PageEmpty
            compact
            title="该状态下暂无需求"
            desc="换一个状态看看，或清除筛选回到全部需求。"
            extra={
              <Button icon={<ClearOutlined />} onClick={() => setFloorFilter(null)}>
                清除筛选
              </Button>
            }
          />
        ) : (
          <div style={{ padding: '4px 8px 6px' }}>
            {list.map((r) => (
              <DemandRow key={r.id} r={r} />
            ))}
          </div>
        )}
      </Panel>

      {/* 页尾提示（中性，无警示色） */}
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text3 }}>
        <ClockCircleOutlined /> 提交后 2 个工作日内由受理人回应并指派；受理人、状态与处理备注都在上方列表可见。
      </div>
    </div>
  );
}

export default DemandList;
