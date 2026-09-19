/**
 * 「影响范围与量级」三组单选胶囊（spec 第 5 节）。
 * ------------------------------------------------------------------
 * 为什么是单选胶囊而不是滑块/数字输入：
 *   胶囊是「零思考成本」的，业务方 3 秒内能点完三组；滑块会让人纠结「到底算 15 人还是 20 人」，进而放弃。
 * 为什么每组必须单选：
 *   量级是标量，多选会让 D2 的判定失去意义。
 * 为什么保持胶囊圆角而不受 .dp-form 的 6px 影响：
 *   这里属于「表单里的选择题」= 标签/胶囊语汇，不是「文本输入」语汇；
 *   global.css 的 .dp-form 规则只覆盖 .ant-input / .ant-select-selector / textarea，不会命中本组件。
 * 键盘焦点：
 *   用内联 outline 切换（onFocus/onBlur），因此**不需要新增任何 CSS 类**，
 *   满足 spec「唯一允许新增 CSS」条款下的更严格实现（连那一条也不加）。
 *   —— 但浏览器在**鼠标点击**时也会给 <button> 加 :focus（非 :focus-visible），
 *      若直接 onFocus 置位会出现「鼠标点一下也留一圈焦点环」的干扰。
 *      因此用 onMouseDown 标记刚刚的交互来自指针，指针交互不显示焦点环；
 *      键盘 Tab 聚焦（无 pointer 标记）照常显示，无障碍不受影响。
 */
import React from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { demandScaleOptions } from '../../data/mock';
import { useT } from '../../theme';

function ChipRadio({ label, selected, onClick }) {
  const c = useT();
  const [focused, setFocused] = React.useState(false);
  /* 指针按下的那一刻置 true；随后的 focus 事件不再点亮焦点环。
     下一次键盘交互（Tab）不经过 onMouseDown，标记自然为 false。 */
  const pointer = React.useRef(false);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      onMouseDown={() => {
        pointer.current = true;
      }}
      onFocus={() => {
        setFocused(!pointer.current);
      }}
      onBlur={() => {
        pointer.current = false;
        setFocused(false);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 30,
        padding: '0 12px',
        borderRadius: 999,
        fontSize: 13,
        fontFamily: 'inherit',
        cursor: 'pointer',
        background: selected ? c.brandSubtle : c.surface,
        border: `1px solid ${selected ? c.brand : c.borderStrong}`,
        color: selected ? c.brand : c.text2,
        fontWeight: selected ? 500 : 400,
        outline: focused ? `2px solid ${c.brand}` : 'none',
        outlineOffset: 2,
        transition: 'background .14s ease, border-color .14s ease, color .14s ease',
      }}
    >
      {selected ? <CheckOutlined style={{ fontSize: 11 }} /> : null}
      {label}
    </button>
  );
}

export default function ScaleChips({ value, onChange }) {
  const c = useT();
  const v = value || {};

  const pick = (group, option) => {
    onChange({ ...v, [group]: v[group] === option ? undefined : option });
  };

  return (
    <div>
      {Object.values(demandScaleOptions).map((group) => (
        <div key={group.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: c.text3, marginBottom: 8 }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {group.options.map((opt) => (
              <ChipRadio
                key={opt}
                label={opt}
                selected={v[group.key] === opt}
                onClick={() => pick(group.key, opt)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
