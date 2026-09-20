/**
 * _mut_apply.cjs <id> —— 对单个源文件注入一条变异（叶子脚本，单进程，不 spawn）
 * ==========================================================================
 * 读 _mutations.data.cjs，按 id 取 find/repl，对目标文件做 String.replace(find, repl)。
 * **硬约束**：find 串在原文里必须**恰好命中 1 次**，否则报错退出非零、**不写任何文件**
 *           （绝不允许静默改错位置 / 改错文件）。
 * utf8 读写。用法：node tests/_mut_apply.cjs "M13 v0.5 甘特栅格塌陷（...）"
 *        也接受唯一前缀，如 "M13"。
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ROOT 可用 MUT_ROOT 重定向（默认真实仓库根；供沙盒往返验证用）。 */
const ROOT = process.env.MUT_ROOT ? path.resolve(process.env.MUT_ROOT) : path.resolve(__dirname, '..');
const { MUTATIONS } = require('./_mutations.data.cjs');

const arg = process.argv[2];
if (!arg) {
  console.error('用法: node tests/_mut_apply.cjs <id|id前缀>');
  process.exit(2);
}
const m =
  MUTATIONS.find((x) => x.id === arg) ||
  MUTATIONS.find((x) => x.id.startsWith(arg));
if (!m) {
  console.error('❌ 未找到变异: ' + arg);
  process.exit(2);
}

const abs = path.join(ROOT, m.file);
if (!fs.existsSync(abs)) {
  console.error('❌ 目标文件缺失: ' + m.file);
  process.exit(2);
}
const txt = fs.readFileSync(abs, 'utf8');

/* 统计 find 的**精确命中次数**（用 indexOf 次数，而非正则，避免 find 里的特殊字符被当元字符）。 */
let count = 0;
let idx = 0;
while (true) {
  const at = txt.indexOf(m.find, idx);
  if (at === -1) break;
  count++;
  idx = at + m.find.length;
}
if (count !== 1) {
  console.error('❌ find 命中 ' + count + ' 次（必须恰好 1 次），拒绝写入: ' + m.id + ' @ ' + m.file);
  process.exit(3);
}

const out = txt.replace(m.find, m.repl);
if (out === txt) {
  console.error('❌ replace 未改变内容（repl 与 find 相同？）: ' + m.id);
  process.exit(3);
}
fs.writeFileSync(abs, out, 'utf8');
console.log('[apply] ' + m.id + ' @ ' + m.file + ' 已注入（find 命中 1 次）');
