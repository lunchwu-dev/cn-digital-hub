/**
 * 标签反查页 —— 路由 #/workspace/tags（可选二级 #/workspace/tags/:tagId）
 * ------------------------------------------------------------------
 * 职责是「按标签找人」，不是「判断人」（P2 文档 E.2 裁决）：
 *   · 结果列表**不显示成熟度** —— 成熟度是判断人，两步分开更清爽；
 *   · 结果**按姓名排序**，绝不做任何基于实证度的排序（禁止跨人比较）。
 * 筛选器形态（v0.4.1 单树化）：Segmented（**按 7 个分组筛选**，非旧「轴」切换）
 *   + 自建 chip 组（按分组分行，横向卡片内，**不是左侧栏** —— README 铁律「两层结构、无侧边栏」）
 *   + 已选条（无选择时不占位）。
 */
import React, { useMemo, useState } from 'react';
import { Segmented, Button } from 'antd';
import {
  TAG_DICT,
  TAG_BY_ID,
  SKILL_GROUPS,
  personTags,
  personId,
  orgPeople,
} from '../data/mock';
import { useT } from '../theme';
import { Panel, PanelHead, SectionTitle, InitialAvatar, TagChip, PageEmpty } from '../components/ui';
import { go } from '../router';

/** 生成「标签 id → 该标签下的人（姓名）」索引 */
const PEOPLE_BY_TAG = (() => {
  const map = new Map();
  orgPeople.forEach((p) => {
    const ids = Object.keys(personTags[personId(p.email)] || {});
    ids.forEach((tid) => {
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid).push(p);
    });
  });
  return map;
})();

/** 标签 id → 所属分组名（单树：直接取词表的 group 字段，7 组之一）。
 *  v0.4.1：用于判定「所选标签是否落在全员为 0 的空组」。 */
const GROUP_OF = (() => {
  const m = {};
  TAG_DICT.forEach((t) => { m[t.id] = t.group; });
  return m;
})();

/**
 * 已归档标签（P1-4 / 规范 C.4）——deprecated + merged 的**渲染出口**。
 * 「合并必须永远可见（可审计性）」：merged 用 target 的 label 渲染新词 +
 * 「原『旧名』」角标；deprecated 用虚线描边 + 「已停用」后缀。
 * 它们不再可选（不入上方 chip 组），但必须能被检索/审计到。
 */
const ARCHIVED_TAGS = TAG_DICT.filter((t) => t.status === 'deprecated' || t.status === 'merged').map((t) => {
  if (t.status === 'merged') {
    const target = TAG_BY_ID[t.mergedInto];
    return {
      id: t.id,
      status: 'merged',
      // merged：新词取 target 的 label，旧名作为「原『旧名』」角标
      label: (target && target.label) || t.label,
      originLabel: t.label,
      note: target ? `已并入「${target.label}」` : '已并入其他标签',
    };
  }
  return { id: t.id, status: 'deprecated', label: t.label, originLabel: null, note: '已停用，历史引用仍可见' };
});

/**
 * 反查页结果空态文案（v0.4.1 单树化）—— 抽成纯函数便于单测。
 *
 * 分流口径：
 *   · 「空组」= 所选标签**所在分组**（SKILL_GROUPS 7 组之一）全员为 0：
 *     用 `GROUP_OF` 找到每个所选标签的分组名，若该组下**全部** active 标签都无人（PEOPLE_BY_TAG 空），
 *     则给出「词表先行、等待第一位贡献者」的组织诊断文案；
 *   · 否则（多选交集为空）= 给「去掉条件 / 分别查看」的行动指引。
 *
 * title 亦分流：单标签 → 具名；多标签 → 组合。
 * 文案纪律：无过期路径、无红黄绿、不用「领域」等遗留词汇、给下一步或诊断信息。
 */
function isEmptyGroup(tid) {
  const g = GROUP_OF[tid];
  if (!g) return false;
  const members = TAG_DICT.filter(
    (t) => t.status === 'active' && GROUP_OF[t.id] === g
  );
  if (!members.length) return false;
  return members.every((t) => (PEOPLE_BY_TAG.get(t.id) || []).length === 0);
}

export function emptyCopy(selected) {
  const ids = Array.isArray(selected) ? selected : [];
  const single = ids.length === 1;
  const labelOf = (tid) => (TAG_BY_ID[tid] && TAG_BY_ID[tid].label) || tid;

  const title = single ? `「${labelOf(ids[0])}」暂时还没有人登记` : '这个标签组合暂时没有匹配的人';

  // 空组优先：只要所选标签里有一个落在「全员为 0」的分组，就走分组诊断文案
  const emptyGroupId = ids.find((tid) => isEmptyGroup(tid));
  if (emptyGroupId) {
    const g = GROUP_OF[emptyGroupId];
    const memberCount = TAG_DICT.filter((t) => t.status === 'active' && GROUP_OF[t.id] === g).length;
    return {
      title,
      desc: `「${g}」这个分组目前还没有成员。该分组已预留 ${memberCount} 个技能标签，暂无成员的标签落在此分组——这是能力盘点可关注的一处空档。`,
    };
  }

  return {
    title,
    desc: '这些标签的交叉暂时没有落在同一个人身上。可以去掉一两个条件，或分别查看每个标签下的人。',
  };
}

export default function TagBrowse({ id }) {
  const c = useT();
  // v0.4.1：筛选维度从「轴」升级为「7 个一级分组」——'all' | 某个分组名
  const [groupFilter, setGroupFilter] = useState('all');
  const [selected, setSelected] = useState(() => (id && TAG_BY_ID[id] ? [id] : []));
  const [archivedOpen, setArchivedOpen] = useState(false);

  const toggleTag = (tid) => {
    setSelected((cur) => (cur.includes(tid) ? cur.filter((x) => x !== tid) : [...cur, tid]));
  };

  // 词表按分组过滤后，再按分组分行（用于渲染 chip 组分行）
  const groupList = useMemo(() => {
    const groups = [];
    SKILL_GROUPS.forEach((g) => {
      if (groupFilter !== 'all' && groupFilter !== g) return;
      const items = TAG_DICT.filter((t) => t.group === g && t.status === 'active');
      if (items.length) groups.push({ key: 'g-' + g, label: g, items });
    });
    return groups;
  }, [groupFilter]);

  // 结果：选中标签的并集（任一命中），按姓名排序；无选择时展示空态
  const results = useMemo(() => {
    if (!selected.length) return [];
    const set = new Set();
    selected.forEach((tid) => {
      (PEOPLE_BY_TAG.get(tid) || []).forEach((p) => set.add(p));
    });
    // 按姓名排序（拼音/Unicode 无关，用 localeCompare 保证稳定），绝不按实证度
    return Array.from(set).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }, [selected]);

  const activeTagCount = useMemo(
    () => TAG_DICT.filter((t) => t.status === 'active').length,
    []
  );

  return (
    <div className="dp-shell">
      <SectionTitle title="标签浏览" desc={`按标签找人 · 共 ${activeTagCount} 个标签`} />

      {/* 筛选器 Panel */}
      <Panel style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <Segmented
            value={groupFilter}
            onChange={setGroupFilter}
            options={[
              { value: 'all', label: '全部' },
              ...SKILL_GROUPS.map((g) => ({ value: g, label: g })),
            ]}
          />
          <span style={{ fontSize: 12, color: c.text3 }}>
            按技能分组筛选，或直接选一个或多个标签，结果会显示同时相关的人
          </span>
        </div>

        {/* chip 组：按域分组分行（横向卡片内，不是左侧栏） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groupList.map((g) => (
            <div
              key={g.key}
              className="dp-tagbrowse-group"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
            >
              <span style={{ fontSize: 13, color: c.text3, width: 110, flex: '0 0 auto', lineHeight: '22px' }}>
                {g.label}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0, flex: 1 }}>
                {g.items.map((t) => (
                  <TagChip
                    key={t.id}
                    label={t.label}
                    selected={selected.includes(t.id)}
                    onClick={() => toggleTag(t.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 已选条：只在有选择时出现（无选择时不占位） */}
        {selected.length ? (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: `1px solid ${c.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: c.text3, flex: '0 0 auto' }}>已选</span>
            {selected.map((tid) => {
              const t = TAG_BY_ID[tid];
              if (!t) return null;
              return (
                <TagChip
                  key={tid}
                  label={t.label}
                  selected
                  onClick={() => toggleTag(tid)}
                />
              );
            })}
            <Button type="link" size="small" onClick={() => setSelected([])} style={{ padding: 0 }}>
              清空
            </Button>
          </div>
        ) : null}
      </Panel>

      <div style={{ height: 16 }} />

      {/* 结果列表 Panel */}
      <Panel style={{ overflow: 'hidden' }}>
        <PanelHead
          title="结果"
          desc={
            selected.length
              ? `${results.length} 人 · 按姓名排序`
              : '选择标签后显示结果'
          }
        />
        {!selected.length ? (
          <PageEmpty
            compact
            title="还没有选择标签"
            desc="在上方选择一个或多个标签，这里会列出相关的人。结果按姓名排序，不按任何贡献度排名。标签来自系统数据抽取与人才盘点。"
          />
        ) : results.length === 0 ? (
          (() => {
            const ec = emptyCopy(selected);
            return <PageEmpty compact title={ec.title} desc={ec.desc} />;
          })()
        ) : (
          <div>
            {results.map((p) => {
              const mine = Object.keys(personTags[personId(p.email)] || {});
              const matched = mine.filter((tid) => selected.includes(tid));
              const shown = matched.slice(0, 4);
              const extra = matched.length - shown.length;
              const open = () => go('#/workspace/people/' + personId(p.email));
              return (
                <div
                  key={p.email}
                  className="dp-row dp-tagbrowse-row"
                  role="button"
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      open();
                    }
                  }}
                >
                  <InitialAvatar name={p.name} size={32} />
                  <div className="dp-tagbrowse-row-main" style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: c.ink, lineHeight: 1.4 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>
                        {p.dept} · {p.role}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: '0 1 auto', justifyContent: 'flex-end' }}>
                      {shown.map((tid) => {
                        const t = TAG_BY_ID[tid];
                        if (!t) return null;
                        return <TagChip key={tid} label={t.label} />;
                      })}
                      {extra > 0 ? (
                        <span className="dp-num" style={{ fontSize: 12, color: c.text3, alignSelf: 'center' }}>
                          +{extra}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div style={{ marginTop: 16, fontSize: 12, color: c.text3, lineHeight: 1.7 }}>
        结果按姓名排序，不做任何基于档位的排序 · 反查页只负责「找到人」；标签档位来自系统数据抽取与人才盘点，可在个人主页查看。
      </div>

      {/* 已归档标签 · 历史引用仍可见，不再可选（P1-4 / 规范 C.4：合并永远可见，可审计） */}
      <div style={{ height: 16 }} />
      <Panel>
        <PanelHead
          title={
            <button
              type="button"
              className="dp-archived-toggle"
              aria-expanded={archivedOpen ? 'true' : 'false'}
              onClick={() => setArchivedOpen((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                font: 'inherit',
                color: c.ink,
              }}
            >
              <span style={{ fontSize: 11, color: c.text3, transform: archivedOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>▶</span>
              已归档标签
              <span className="dp-num" style={{ fontSize: 12, color: c.text3 }}>{ARCHIVED_TAGS.length}</span>
            </button>
          }
          desc="历史引用仍可见，不再可选 · 合并标签保留原名词条以便审计"
        />
        {archivedOpen ? (
          <div className="dp-archived-list" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ARCHIVED_TAGS.map((a) => (
              <div
                key={a.id}
                className="dp-archived-item"
                style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
              >
                <TagChip label={a.label} status={a.status} originLabel={a.originLabel} />
                <span style={{ fontSize: 12, color: c.text3 }}>{a.note}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
