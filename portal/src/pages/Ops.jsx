/**
 * 监控运营 —— L1 健康度看板
 * 定位：门户只做 L1 概览，不做重型嵌入；深度排查一键下钻到 Grafana / 日志 / 值班看板。
 * 全页信息密度最高，块间距 16px；图表卡无阴影仅边框。
 */
import React, { useMemo, useState } from 'react';
import { Segmented, Button, Space, Tooltip, Typography, Flex } from 'antd';
import { ReloadOutlined, ExportOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { opsKpis, opsCharts, stabilityItems, drilldowns, META } from '../data/mock';
import { useT } from '../theme';
import { Panel, PanelHead, Pill, ContentMeta, SectionTitle, KpiTile, StatusDot } from '../components/ui';
import { LineChart, BarChart, HBarChart, Legend } from '../components/charts';

const { Text, Link } = Typography;

const RANGES = [
  { value: 'today', label: '今日' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

function nowText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Ops() {
  const c = useT();
  const [range, setRange] = useState('7d');
  const [refreshed, setRefreshed] = useState('2026-09-17 18:40');
  const [busy, setBusy] = useState(false);

  const onRefresh = () => {
    setBusy(true);
    window.setTimeout(() => {
      setRefreshed(nowText());
      setBusy(false);
    }, 600);
  };

  const chartCards = useMemo(
    () => [
      {
        key: 'availability',
        right: <Legend names={opsCharts.availability.series.map((s) => s.name)} />,
        body: <LineChart chart={opsCharts.availability} />,
      },
      {
        key: 'latency',
        // 单位由 PanelHead 的 desc 统一渲染（「单位 ms」），这里不再重复，避免卡头同一行出现两次
        right: null,
        body: <BarChart chart={opsCharts.latency} />,
      },
      {
        key: 'errorRate',
        right: <Legend names={opsCharts.errorRate.series.map((s) => s.name)} />,
        body: <LineChart chart={opsCharts.errorRate} />,
      },
      {
        key: 'alertDistribution',
        right: <Text style={{ fontSize: 12, color: c.text3 }}>近 7 天</Text>,
        body: <HBarChart items={opsCharts.alertDistribution.items} />,
      },
    ],
    [c.text3]
  );

  return (
    <div className="dp-shell">
      {/* 页头 + 时间范围 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>监控运营</h1>
              <span style={{ fontSize: 14, color: c.text2 }}>L1 健康度概览 · 深度排查请下钻</span>
            </div>
            <ContentMeta owner="SRE 组 · 何嘉" updated={META.updated} style={{ marginTop: 10 }} />
          </div>
          <Space size={12} wrap>
            <Segmented value={range} onChange={setRange} options={RANGES} />
            <span style={{ fontSize: 12, color: c.text3 }}>
              最后刷新 <span className="dp-num" style={{ color: c.text2 }}>{refreshed}</span>
            </span>
            <Button icon={<ReloadOutlined spin={busy} />} onClick={onRefresh} loading={busy}>
              手动刷新
            </Button>
          </Space>
        </div>
      </div>

      {/* KPI 行 */}
      <section style={{ marginBottom: 16 }}>
        <div className="dp-grid dp-g6">
          {opsKpis.map((k) => (
            <KpiTile key={k.key} item={k} showStatus dense />
          ))}
        </div>
      </section>

      {/* 图表区：2 列白底卡 */}
      <section style={{ marginBottom: 16 }}>
        <SectionTitle title="趋势与分布" desc="近 7 天主要指标走势" />
        <div className="dp-grid dp-g2">
          {chartCards.map((card) => (
            <Panel key={card.key}>
              <PanelHead title={opsCharts[card.key].title} desc={`单位 ${opsCharts[card.key].unit}`} extra={card.right} dense />
              <div style={{ padding: '8px 12px 12px' }}>{card.body}</div>
            </Panel>
          ))}
        </div>
      </section>

      {/* 稳定性状态区：语义色只集中在这里出现 */}
      <section style={{ marginBottom: 16 }}>
        <SectionTitle title="稳定性状态" desc="正常 / 预警 / 异常" />
        <div className="dp-grid dp-g3">
          {stabilityItems.map((s) => {
            return (
              <Panel key={s.system} hover style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <StatusDot semantic={s.status} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: c.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.system}
                    </span>
                  </div>
                  <Pill semantic={s.status}>{s.label}</Pill>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: c.text3, lineHeight: 1.6 }}>{s.detail}</div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* 下钻卡：门户只做 L1 概览的架构决策表达 */}
      <section style={{ marginBottom: 16 }}>
        <SectionTitle
          title="无法在门户内解决？下钻到专业工具"
          desc="时序明细、日志链路与告警认领在专业平台完成"
        />
        <Panel style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.7 }}>
            本页提供趋势判断、阈值状态与快速定位；需要看时序明细、按 traceId 追日志或认领告警时，请从下方入口前往对应平台，
            门户不做内置嵌入，避免把重型界面塞进浏览器标签页。
          </div>
        </Panel>
        <div className="dp-grid dp-g3">
          {drilldowns.map((d) => (
            <Panel key={d.key} hover style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{d.title}</div>
              <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.6, flex: 1 }}>{d.desc}</div>
              <Tooltip title="原型内为占位跳转">
                <Button type="primary" ghost icon={<ExportOutlined />} style={{ alignSelf: 'flex-start' }}>
                  {d.action}
                </Button>
              </Tooltip>
            </Panel>
          ))}
        </div>
      </section>

      <Flex gap={6} align="center" wrap="wrap" style={{ fontSize: 12, color: c.text3 }}>
        <ArrowRightOutlined />
        <span>采集口径与阈值定义见</span>
        <Link href="#/knowledge" style={{ fontSize: 12 }}>
          知识中心「设计规范」
        </Link>
        <span>；指标异常时请先在下钻卡中打开值班看板确认责任人。</span>
      </Flex>
    </div>
  );
}
