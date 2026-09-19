/**
 * 新增需求 · 二级页（#/demand/new）
 * ==================================================================
 * 设计系统：Decathlon Digital Design Tokens（portal/src/theme.js）
 * 施工依据：outputs/02b-site-restructure-spec.md §E 全文 + §F
 *
 * 结构（§E.2 / §E.5）：
 *   页头：← 返回业务需求（link + ArrowLeft） + h1「新增需求」
 *   .dp-grid.dp-g-spec（1.5fr : 1fr）
 *     左栏 Panel[data-role="form"].dp-demand-form-col（内层 .dp-form）
 *     右栏 .dp-demand-side：受理承诺卡 [data-role="promise"] + BrdAssistantCard（.dp-demand-assistant）
 *   —— **本页没有 [data-role="recent"]**（公开列表已在一级页）
 *
 * 字段级 agent（§E.1，用户明确要求的「嵌入到表单控件」）：
 *   挂图标的 6 个字段：标题 / 现状 / 期望 / 验收 / 影响范围（ScaleChips 组旁）/ 涉及系统(轻量档)
 *   不挂：需求类型 / 期望完成时间 / 用途与期限 / 联系方式
 *   同一时刻只允许一个字段的建议展开（沿用 agentAdvice 的「任何时刻只有一条建议」铁律）。
 *
 * 状态归属（§E.3）：rows / onAdd / draft / setDraft 全部由 App 层持有 ——
 *   本组件不 useState 一份 rows，也不自己持有表单状态；
 *   draft 直接作为整棵表单受控状态树（App 初始化 {title:'',type:undefined,systems:[]}），
 *   这样用户误点返回 / 跳去别处再回来，草稿不丢。提交成功后清空回 App 的规范空形状。
 */
import React, { useMemo, useState } from 'react';
import {
  Input,
  Button,
  Select,
  Segmented,
  DatePicker,
  Checkbox,
  App as AntApp,
} from 'antd';
import {
  PlusOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  demandTypes,
  demandSystems,
  demandSolutionWords,
  demandPhenomenonWords,
  demandVerifiableWords,
  demandTitleFluff,
  demandTracks,
  brdTemplates,
  trackOfType,
  demandStats,
  brdDimensions,
  demandCompletenessCopy,
  brdAgentVerdict,
  DEMAND_UNSURE,
  META,
} from '../data/mock';
import { useT } from '../theme';
import { Panel, PanelHead, Pill } from '../components/ui';
import { go } from '../router';
import CompletenessBar from '../components/demand/CompletenessBar';
import ScaleChips from '../components/demand/ScaleChips';
import BrdAssistantCard from '../components/demand/BrdAssistantCard';
import FieldAgent from '../components/demand/FieldAgent';

/* =============================== 评分引擎 ===============================
 * 从旧 DemandView 原样搬移（纯前端规则，零 API）。
 * 注意：这是「资料完整度」不是「分数」—— 不报扣分、不给逐项分值。 */
const BRD_DIM_KEYS = ['D1', 'D2', 'D3', 'D4', 'D5'];

function str(v) {
  return typeof v === 'string' ? v : '';
}
function hasSolutionWord(text) {
  return demandSolutionWords.some((w) => str(text).includes(w));
}
function hasPhenomenonWord(text) {
  return demandPhenomenonWords.some((w) => str(text).includes(w));
}
function scoreD1(v) {
  const cur = str(v.current);
  if (!cur.trim()) return 0;
  if (hasSolutionWord(cur)) return 0;
  if (hasPhenomenonWord(cur) && cur.trim().length >= 20) return 1;
  return cur.trim().length >= 20 ? 1 : 0;
}
function scoreD2(v) {
  const s = v.scale || {};
  const n = [s.headcount, s.frequency, s.blocking].filter(Boolean).length;
  return n / 3;
}
function scoreD3(v) {
  const list = Array.isArray(v.systems) ? v.systems : [];
  if (list.length === 0) return 0;
  if (list.includes(DEMAND_UNSURE)) return 0.5;
  return 1;
}
function scoreD4(v) {
  const t = str(v.acceptance);
  if (!t.trim()) return 0;
  if (t.trim().length < 15) return 0.5;
  return demandVerifiableWords.some((w) => t.includes(w)) ? 1 : 0.5;
}
function scoreD5(v) {
  const t = str(v.title).trim();
  if (!t) return 0;
  if (demandTitleFluff.some((w) => t.includes(w))) return 0;
  return t.length >= 12 ? 1 : 0;
}
const DIM_SCORERS = { D1: scoreD1, D2: scoreD2, D3: scoreD3, D4: scoreD4, D5: scoreD5 };

function computeCompleteness(v) {
  const items = BRD_DIM_KEYS.map((key) => {
    const s = DIM_SCORERS[key](v);
    return { key, ...brdDimensions[key], raw: s, state: s >= 1 ? 'full' : s > 0 ? 'partial' : 'none' };
  });
  const gained = items.reduce((a, i) => a + i.raw, 0);
  const pct = Math.round((gained / BRD_DIM_KEYS.length) * 100);
  const weakest = items.slice().sort((a, b) => a.raw - b.raw)[0];
  const withHint = items.map((i) => ({
    key: i.key,
    name: i.name,
    state: i.state,
    hint: i.state === 'full' ? i.fullHint : i.state === 'partial' ? i.partialHint : i.emptyHint || i.partialHint,
  }));
  const tier = demandCompletenessCopy.find((t) => pct >= t.min) || demandCompletenessCopy[demandCompletenessCopy.length - 1];
  return {
    pct,
    items: withHint,
    weakestName: weakest.name,
    weakestState: weakest.state,
    summary: tier.text.replace('{weak}', weakest.name),
    tierMin: tier.min,
  };
}

function brdMissing(v) {
  const s = v.scale || {};
  const miss = [];
  if (str(v.title).trim().length < 4) miss.push('需求标题');
  if (!v.type) miss.push('需求类型');
  if (str(v.current).trim().length < 20) miss.push('现状 / 遇到的问题');
  if (str(v.expected).trim().length < 15) miss.push('期望结果');
  if (!s.headcount || !s.frequency || !s.blocking) miss.push('影响范围与量级');
  if (!Array.isArray(v.systems) || v.systems.length === 0) miss.push('涉及系统 / 入口');
  return miss;
}
function lightMissing(v) {
  const miss = [];
  if (str(v.title).trim().length < 4) miss.push('需求标题');
  if (!v.type) miss.push('需求类型');
  if (!Array.isArray(v.systems) || v.systems.length === 0) miss.push('涉及系统 / 库');
  if (str(v.purpose).trim().length < 10) miss.push('用途与期限');
  return miss;
}

/** agent 的唯一一条建议（协作者语气；铁律：任何时刻只有一条待改建议） */
function agentAdvice(v, done, result, missing) {
  const hasCurrent = str(v.current).trim().length > 0;
  const hasExpected = str(v.expected).trim().length > 0;
  if (hasSolutionWord(v.current)) {
    return '「加个 / 做个」这类更像是解决办法，挪到「期望结果」里；现状那段写清现在是什么现象——受理人据此才能判断该不该做。';
  }
  if (!hasCurrent && !hasExpected && !v.title) {
    return '先写现状就行，想到哪写到哪，我帮你理。标题、类型、现状、期望、量级、系统这 6 项齐了就能提交。';
  }
  if (done && missing.length) {
    return `还差 ${missing.length} 项必填：${missing.join('、')}。「验收 / 成功标准」不填也能提交，但补上会更快被受理。`;
  }
  if (result.pct >= 80) return brdAgentVerdict.high;
  const filled = [];
  if (v.title) filled.push('标题');
  if (hasCurrent) filled.push('现状');
  if (hasExpected) filled.push('期望');
  if ((v.systems || []).length) filled.push('涉及系统');
  const b = filled.length ? `${filled.slice(0, 2).join(' 和 ')} 这块清楚了。` : '';
  const rest = '「验收 / 成功标准」不填也能提交，但补上这句会更快被受理。';
  return `${b}${brdAgentVerdict.fair.replace('{weak}', result.weakestName)}${result.tierMin <= 40 ? ' ' + rest : ''}`.trim();
}

/** agentAdvice 输出的「那唯一一条」当前指向哪个字段（用于 §E.1 ③ 防重复）
 *
 *  ⚠️ 必须与 agentAdvice 的**分支一一对应**。原实现只返回 'current' | null，
 *  于是 `adviceField === 'acceptance'` / `=== 'title'` / `=== 'scale'` 全是死比较：
 *  规范要求的「建议已在右栏高亮时，字段 agent 收起」实际只对 current 生效，
 *  另外 4 个话题会**同时**在右下协作卡和字段旁各说一遍 —— 正是 §E.1 ③ 要防的重复。
 *  这里按 agentAdvice 的判定顺序重算话题，两者必须同步改。
 */
export function adviceTopic(v, done, result, missing) {
  const hasCurrent = str(v.current).trim().length > 0;
  const hasExpected = str(v.expected).trim().length > 0;
  if (hasSolutionWord(v.current)) return 'current';
  if (!hasCurrent && !hasExpected && !v.title) return 'title';
  if (done && missing && missing.length) {
    return missing.some((m) => /验收|成功标准/.test(m)) ? 'acceptance' : null;
  }
  if (result.pct >= 80) return null;
  const w = String(result.weakestName || '');
  if (/验收|成功标准/.test(w)) return 'acceptance';
  if (/标题/.test(w)) return 'title';
  if (/现状/.test(w)) return 'current';
  if (/期望/.test(w)) return 'expected';
  if (/量级|范围/.test(w)) return 'scale';
  if (/系统/.test(w)) return 'systems';
  return null;
}

/* ------------------------------ 字段控件 ------------------------------ */
const UNSURE_OPTION = demandSystems.find((s) => s.value === DEMAND_UNSURE);

/** 涉及系统多选胶囊（从旧实现搬移） */
function SystemsField({ value, onChange }) {
  const c = useT();
  const list = Array.isArray(value) ? value : [];
  const unsure = list.includes(DEMAND_UNSURE);
  const toggle = (opt) => {
    const on = list.includes(opt);
    let next;
    if (opt === DEMAND_UNSURE) {
      next = on ? [] : [DEMAND_UNSURE];
    } else {
      const base = list.filter((x) => x !== DEMAND_UNSURE);
      next = on ? base.filter((x) => x !== opt) : [...base, opt];
    }
    onChange(next);
  };
  const chipStyle = (on, disabled) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 30,
    padding: '0 12px',
    borderRadius: 999,
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: on ? c.brandSubtle : c.surface,
    border: `1px solid ${on ? c.brand : c.borderStrong}`,
    color: on ? c.brand : disabled ? c.text3 : c.text2,
    fontWeight: on ? 500 : 400,
    opacity: disabled ? 0.5 : 1,
  });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button type="button" aria-pressed={unsure} onClick={() => toggle(DEMAND_UNSURE)} style={chipStyle(unsure, false)}>
        {unsure ? <CheckOutlined style={{ fontSize: 11 }} /> : null}
        {UNSURE_OPTION.label}
      </button>
      {demandSystems
        .filter((s) => s.value !== DEMAND_UNSURE)
        .map((s) => {
          const on = list.includes(s.value);
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={on}
              disabled={unsure}
              onClick={() => toggle(s.value)}
              style={chipStyle(on, unsure)}
            >
              {on ? <CheckOutlined style={{ fontSize: 11 }} /> : null}
              {s.label}
            </button>
          );
        })}
    </div>
  );
}

/** 字段标签：文本 + 必填/选填 + （可选）字段级 agent 挂点 */
function FieldLabel({ text, required, optional, hint, agent, fieldKey, openAgent, onToggleAgent, suppressAgent }) {
  const c = useT();
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{text}</span>
        {required ? <span style={{ fontSize: 12, color: c.text3 }}>必填</span> : null}
        {optional ? <span style={{ fontSize: 12, color: c.text3 }}>选填，写不出可以先跳过</span> : null}
        {agent ? (
          <FieldAgent
            topic={fieldKey}
            label={text}
            open={openAgent === fieldKey}
            onToggle={onToggleAgent}
            suppressed={suppressAgent}
          />
        ) : null}
      </div>
      {hint ? <div style={{ fontSize: 12, color: c.text3, marginTop: 3, lineHeight: 1.6 }}>{hint}</div> : null}
    </div>
  );
}

/* ================================================================== */
export function DemandNew({ rows, onAdd, draft, setDraft }) {
  const c = useT();
  const { message } = AntApp.useApp();
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState([]);
  // 字段级 agent：同一时刻只允许一个字段展开（§E.1）
  const [openAgent, setOpenAgent] = useState(null);

  // draft 直接作为整棵表单受控状态树（App 层持有 → 返回不丢草稿，§E.3）
  const v = draft || {};
  const set = (patch) => setDraft({ ...(draft || {}), ...patch });

  const track = v.type ? trackOfType(v.type) : 'light';
  const isBrd = track === 'brd';

  const result = useMemo(() => computeCompleteness(v), [v]);
  // 缺项必须**按档位**算：brdMissing 与 lightMissing 的字段集不同
  // （如轻量档查「用途与期限」「涉及系统 / 库」，完整档查「现状 / 期望 / 量级」）。
  // 同一份 missing 要同时喂给 advice 与 adviceField，否则两处口径脱节，
  // 会出现「建议在讲 A 字段、adviceField 却指向 B」的错位。
  const missingNow = useMemo(() => (isBrd ? brdMissing(v) : lightMissing(v)), [v, isBrd]);
  const advice = useMemo(
    () => agentAdvice(v, submitted, result, missingNow),
    [v, submitted, result, missingNow]
  );
  // 全局建议卡（.dp-demand-assistant）只在**完整档**渲染（见下方 isBrd 分支），
  // 因此「建议已在右栏高亮 → 收起字段 agent」这条防重复规则也只在完整档成立。
  // 轻量档没有那张卡，若仍返回话题，会误收起字段 agent —— 反而少了一个入口。
  const adviceField = isBrd ? adviceTopic(v, submitted, result, missingNow) : null;
  const stats = demandStats(rows || []);

  const toggleAgent = (topic) => setOpenAgent((cur) => (cur === topic ? null : topic));

  const submit = () => {
    setSubmitted(true);
    const miss = isBrd ? brdMissing(v) : lightMissing(v);
    setLocalError(miss);
    if (miss.length) {
      message.info(`还差 ${miss.length} 项必填，补上就能提交`);
      return;
    }
    const typeObj = demandTypes.find((d) => d.value === v.type) || {};
    const nextNo = 930 + (rows || []).length;
    const newRow = {
      id: 'REQ-2026-' + String(nextNo).slice(-3),
      title: v.title,
      type: typeObj.label || v.type,
      track,
      status: 'pending',
      submitted: (META.updated || '').slice(0, 10),
      assignee: '待分配',
      note: '刚提交，待需求受理人认领',
      completeness: isBrd ? result.pct : 100,
      scope: isBrd
        ? { current: v.current, expected: v.expected, scale: v.scale, systems: v.systems, acceptance: v.acceptance }
        : { systems: v.systems, purpose: v.purpose },
      // ★ P0-1 修复位置（不是 :560 的 onChange）：
      //   DatePicker 的 value={v.expectAt}（:555）要求草稿里存的是 **dayjs 对象**，
      //   所以 onChange 必须继续存对象（供回填）。真正该转字符串的是「写进行数据」这一步：
      //   需求列表 DemandRow 渲染 <span>{r.expectAt}</span>，若把 dayjs 对象当 React child
      //   会抛 React error #31（Objects are not valid as a React child）→ #/demand 整页白屏。
      //   `.format ? ... : ...` 兼容「历史形状 / 已传入字符串」的路径（如 '无硬性期限'）。
      expectAt: v.expectAt ? (v.expectAt.format ? v.expectAt.format('YYYY-MM-DD') : v.expectAt) : undefined,
    };
    onAdd(newRow);
    message.success(
      `已提交，受理人会在 2 个工作日内联系你。编号 ${newRow.id}，可在「业务需求」列表里随时查进度。`
    );
    // 提交成功后清空草稿（§E.3）——回 App 的规范空形状
    setDraft({ title: '', type: undefined, systems: [] });
    setSubmitted(false);
    setLocalError([]);
    setOpenAgent(null);
  };

  const numStyle = { fontSize: 12, color: c.text3, textAlign: 'right' };

  return (
    <div className="dp-shell">
      {/* ————— 页头 ————— */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="link"
          size="small"
          icon={<ArrowLeftOutlined />}
          style={{ padding: 0, marginBottom: 8 }}
          onClick={() => go('#/demand')}
        >
          返回业务需求
        </Button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: c.ink, letterSpacing: '-0.01em' }}>新增需求</h1>
        <div style={{ marginTop: 6, fontSize: 14, color: c.text2, lineHeight: 1.65 }}>
          描述你遇到的现象就行，先不用想怎么解决。提交后会进入「业务需求」公开列表，处理到哪一步都看得见。
        </div>
      </div>

      {/* ————— 类型分流（跟随表单）————— */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Segmented
          value={isBrd ? 'brd' : 'light'}
          onChange={(val) => {
            const preset = val === 'brd' ? 'feature' : 'perm';
            set({ type: preset });
            setOpenAgent(null);
          }}
          options={[
            { value: 'light', label: demandTracks.light.segLabel },
            { value: 'brd', label: demandTracks.brd.segLabel },
          ]}
        />
        <span style={{ fontSize: 12, color: c.text3 }}>
          权限类与「其他」走轻量档，{demandTracks.light.fieldCount} 项即可提交；功能类与系统接入走完整档，有模板引导。
        </span>
      </div>

      <div className="dp-grid dp-g-spec" style={{ gap: 16, alignItems: 'start' }}>
        {/* ————— 左栏：表单 ————— */}
        <Panel data-role="form" className="dp-demand-form-col" style={{ overflow: 'hidden' }}>
          <PanelHead
            title={isBrd ? '完整档 · 需求登记' : '轻量档 · 需求登记'}
            desc={
              isBrd
                ? `${brdTemplates.brd.length} 个字段，其中 ${
                    brdTemplates.brd.filter((f) => f.required).length
                  } 项必填、${brdTemplates.brd.filter((f) => !f.required).length} 项可后补`
                : `${brdTemplates.light.length} 个字段，其中 ${
                    brdTemplates.light.filter((f) => f.required).length
                  } 项必填，不需要填完整 BRD`
            }
          />
          {/* 内层必须挂 .dp-form，否则输入框变胶囊圆角（§F.1 #4） */}
          <div className="dp-form" style={{ padding: '18px 20px 20px' }}>
            {/* 轻量档说明条 */}
            {!isBrd ? (
              <div className="dp-demand-light-note" style={{ marginBottom: 18 }}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: c.page,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 13, color: c.text2, lineHeight: 1.65 }}>
                    这类需求不需要填完整 BRD，{demandTracks.light.committed}。
                  </span>
                  <Pill semantic="neutral">{demandTracks.light.fieldCount} 项必填</Pill>
                </div>
              </div>
            ) : null}

            {/* ① 需求标题 —— 挂 agent */}
            <div style={{ marginBottom: 18 }}>
              <FieldLabel
                text="需求标题"
                required
                hint={isBrd ? '一句话说清「谁在什么场景下遇到什么」' : '一句话说清要什么'}
                agent
                fieldKey="title"
                openAgent={openAgent}
                onToggleAgent={toggleAgent}
                suppressAgent={adviceField === 'title'}
              />
              <Input
                value={v.title}
                maxLength={60}
                showCount={isBrd ? { count: (n) => <span className="dp-num">{n} / 60</span> } : false}
                placeholder={
                  isBrd ? '例如：门店盘点时库存对不上账，希望定位到具体环节' : '例如：申请库存服务的生产库只读权限'
                }
                onChange={(e) => set({ title: e.target.value })}
                style={{ borderColor: localError.includes('需求标题') ? c.error : c.borderStrong }}
              />
            </div>

            {/* ② 需求类型 —— 不挂 agent（§E.1） */}
            <div style={{ marginBottom: 18 }}>
              <FieldLabel text="需求类型" required hint="选「功能需求」或「系统接入 / 打通」会切换到完整档" />
              <Select
                value={v.type}
                placeholder="请选择"
                options={demandTypes}
                style={{ width: '100%' }}
                getContainer={false}
                onChange={(val) => {
                  set({ type: val });
                  setOpenAgent(null);
                }}
                status={localError.includes('需求类型') ? 'error' : undefined}
              />
            </div>

            {/* 完整档专属字段 */}
            {isBrd ? (
              <>
                {/* ③ 现状 / 遇到的问题 —— 挂 agent（最高优先级） */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel
                    text="现状 / 遇到的问题"
                    required
                    hint="描述你遇到的现象就行，先不用想怎么解决"
                    agent
                    fieldKey="current"
                    openAgent={openAgent}
                    onToggleAgent={toggleAgent}
                    suppressAgent={adviceField === 'current'}
                  />
                  <Input.TextArea
                    rows={4}
                    value={v.current}
                    placeholder="例如：门店盘点时对不上账。系统显示的库存和实际货架差 3–5 件，但不知道是入库、调拨还是收银环节漏记的。"
                    onChange={(e) => set({ current: e.target.value })}
                    style={{ borderColor: localError.includes('现状 / 遇到的问题') ? c.error : c.borderStrong }}
                  />
                  <div style={{ ...numStyle, marginTop: 4 }}>
                    <span className="dp-num">已写 {str(v.current).trim().length} 字</span> · 建议 ≥20 字
                  </div>
                </div>

                {/* ④ 期望结果 —— 挂 agent */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel
                    text="期望结果"
                    required
                    hint="写「希望达到什么」，而不是「加什么按钮」"
                    agent
                    fieldKey="expected"
                    openAgent={openAgent}
                    onToggleAgent={toggleAgent}
                    suppressAgent={adviceField === 'expected'}
                  />
                  <Input.TextArea
                    rows={3}
                    value={v.expected}
                    placeholder="例如：能在盘点差异报表里直接看到差异产生的具体环节和时间点。"
                    onChange={(e) => set({ expected: e.target.value })}
                    style={{ borderColor: localError.includes('期望结果') ? c.error : c.borderStrong }}
                  />
                  <div style={{ ...numStyle, marginTop: 4 }}>
                    <span className="dp-num">已写 {str(v.expected).trim().length} 字</span> · 建议 ≥15 字
                  </div>
                </div>

                {/* ⑤ 影响范围与量级 —— agent 挂在 ScaleChips 组旁 */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel
                    text="影响范围与量级"
                    required
                    hint="三组各选一项，估计个大概就够"
                    agent
                    fieldKey="scale"
                    openAgent={openAgent}
                    onToggleAgent={toggleAgent}
                    suppressAgent={adviceField === 'scale'}
                  />
                  <ScaleChips value={v.scale || {}} onChange={(scale) => set({ scale })} />
                </div>

                {/* ⑥ 期望完成时间 —— 不挂 agent */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel text="期望完成时间" hint="有硬性节点就填，没有就勾「无硬性期限」" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <DatePicker
                      value={v.expectAt || null}
                      disabled={!!v.noDeadline}
                      placeholder="选择日期"
                      style={{ width: 200 }}
                      getContainer={false}
                      onChange={(d) => set({ expectAt: d })}
                    />
                    <Checkbox
                      checked={!!v.noDeadline}
                      onChange={(e) =>
                        set({ noDeadline: e.target.checked, expectAt: e.target.checked ? null : v.expectAt })
                      }
                    >
                      无硬性期限
                    </Checkbox>
                  </div>
                </div>

                {/* ⑦ 验收 / 成功标准 —— 挂 agent */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel
                    text="验收 / 成功标准"
                    optional
                    hint="建议句式「当……时，视为完成」。这一项是大家最怕的，写不出真的可以跳过"
                    agent
                    fieldKey="acceptance"
                    openAgent={openAgent}
                    onToggleAgent={toggleAgent}
                    suppressAgent={adviceField === 'acceptance'}
                  />
                  <Input.TextArea
                    rows={3}
                    value={v.acceptance}
                    placeholder="例如：当盘点差异报表能按环节列出差异时，视为完成。（写不出可以不填）"
                    onChange={(e) => set({ acceptance: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                {/* ④ 用途与期限（轻量档）—— 不挂 agent */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel text="用途与期限" required hint="写清用来做什么、要用多久（至少 10 字）" />
                  <Input.TextArea
                    rows={3}
                    value={v.purpose}
                    placeholder="例如：因排查库存差异需要查询近 3 个月的出入库流水，预计使用 1 个月。"
                    onChange={(e) => set({ purpose: e.target.value })}
                    style={{ borderColor: localError.includes('用途与期限') ? c.error : c.borderStrong }}
                  />
                </div>

                {/* 联系方式（选填）—— 不挂 agent */}
                <div style={{ marginBottom: 18 }}>
                  <FieldLabel text="联系方式" hint="选填，便于处理人联系你" />
                  <Input
                    value={v.contact || ''}
                    placeholder="企微 / 邮箱"
                    onChange={(e) => set({ contact: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* ⑥ 涉及系统 / 入口（完整档为第 ⑥，轻量档为第 ③）—— 挂 agent */}
            <div style={{ marginBottom: 18 }}>
              <FieldLabel
                text={isBrd ? '涉及系统 / 入口' : '涉及系统 / 库'}
                required
                hint="可多选；不确定就选「说不清，帮我定位」，我们会帮你找"
                agent
                fieldKey="systems"
                openAgent={openAgent}
                onToggleAgent={toggleAgent}
                suppressAgent={adviceField === 'systems'}
              />
              <SystemsField value={v.systems} onChange={(list) => set({ systems: list })} />
            </div>

            {/* 缺项提示（点提交被拦时才出现；沿用旧实现，仅在拦下时显示） */}
            {localError.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                {localError.map((m) => (
                  <div key={m} style={{ fontSize: 12, color: c.error, lineHeight: 1.6 }}>
                    {m}：这一项受理人必须知道
                  </div>
                ))}
              </div>
            ) : null}

            {/* 完整度进度条（仅完整档；填充只用品牌蓝，永不随分数变色） */}
            {isBrd ? (
              <div style={{ marginTop: 18 }}>
                <CompletenessBar pct={result.pct} summary={result.summary} items={result.items} />
              </div>
            ) : null}

            <div
              style={{
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                borderTop: `1px solid ${c.border}`,
                paddingTop: 16,
              }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={submit}>
                提交需求
              </Button>
              <span style={{ fontSize: 12, color: c.text3 }}>
                {isBrd ? '6 项必填齐了就能提交，验收标准与时限可以后补。' : '4 项必填齐了就能提交。'}
              </span>
            </div>
          </div>
        </Panel>

        {/* ————— 右栏：受理承诺卡 + BRD 协作助手（本页无公开列表）————— */}
        {/* 桌面态 flex column 由 .dp-demand-side 类表达；≤900 该类 display:contents + order 重排。
            这里**不得写内联 display**，否则会盖掉媒体的 display:contents。 */}
        <div className="dp-demand-side">
          <Panel data-role="promise" className="dp-demand-promise" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ClockCircleOutlined style={{ color: c.text2, fontSize: 15 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>受理承诺</span>
            </div>
            <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.7 }}>
              提交后 <span className="dp-num" style={{ color: c.ink }}>2</span> 个工作日内由受理人回应并指派。
              受理人、当前状态与处理备注都会显示在「业务需求」公开列表里，不需要另外去问进度。
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                borderTop: `1px solid ${c.border}`,
                paddingTop: 12,
              }}
            >
              <span style={{ fontSize: 12, color: c.text3 }}>
                待处理{' '}
                <span className="dp-num" style={{ color: c.ink, fontSize: 14, fontWeight: 500 }}>
                  {stats.pending}
                </span>
              </span>
              <span style={{ fontSize: 12, color: c.text3 }}>
                进行中{' '}
                <span className="dp-num" style={{ color: c.ink, fontSize: 14, fontWeight: 500 }}>
                  {stats.inprogress}
                </span>
              </span>
              <span style={{ fontSize: 12, color: c.text3 }}>
                已完成{' '}
                <span className="dp-num" style={{ color: c.ink, fontSize: 14, fontWeight: 500 }}>
                  {stats.done}
                </span>
              </span>
            </div>
          </Panel>

          {/* BRD 协作助手（内联卡）：承载 agentAdvice() 的那「唯一一条」全局建议 */}
          {isBrd ? (
            <div className="dp-demand-assistant" data-role="assistant">
              <BrdAssistantCard advice={advice} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default DemandNew;
