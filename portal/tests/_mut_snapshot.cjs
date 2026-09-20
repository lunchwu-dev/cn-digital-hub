/**
 * _mut_snapshot.cjs —— 变异前的「工作树基线快照」
 * =================================================
 * 把 MUTATIONS 引用到的**全部**目标文件（再并入 TARGETS 的键）复制到 tests/.mutbase/<basename>。
 *
 * ⚠️ 为什么必须来自「运行前的工作树副本」而不是 git：
 *    这些源文件相对 HEAD 普遍带有**未提交的特性改动**（mock.js / PersonProfile.jsx 等），
 *    `git checkout -- <file>` 会把特性一起丢掉、或对 untracked 直接报 pathspec 不匹配。
 *    故基线 = 运行前磁盘上的真实内容。
 *
 * 用法：node tests/_mut_snapshot.cjs   （只读源文件，只写 tests/.mutbase/）
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ROOT / BASE 可用环境变量重定向（供「沙盒往返验证」用；默认即真实仓库根 + tests/.mutbase）。 */
const ROOT = process.env.MUT_ROOT ? path.resolve(process.env.MUT_ROOT) : path.resolve(__dirname, '..');
const { TARGETS, MUTATIONS } = require('./_mutations.data.cjs');
const BASE = process.env.MUT_BASE ? path.resolve(process.env.MUT_BASE) : path.join(__dirname, '.mutbase');

/* 覆盖集合：MUTATIONS 引用的文件 ∪ TARGETS 键（两者取并，确保「被改的一定被还原」）。
   实际为 7 个（MUTATIONS）∪ 8 个（TARGETS）= 8 个文件。 */
const files = [...new Set([...Object.keys(TARGETS), ...MUTATIONS.map((m) => m.file)])];

fs.mkdirSync(BASE, { recursive: true });
const manifest = {};
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.error('❌ 源文件缺失，无法快照: ' + rel);
    process.exit(1);
  }
  const name = path.basename(rel);
  if (manifest[name] && manifest[name] !== rel) {
    console.error('❌ basename 冲突（' + name + '）：' + manifest[name] + ' vs ' + rel + '，快照命名方案需改为扁平化路径');
    process.exit(1);
  }
  fs.copyFileSync(abs, path.join(BASE, name));
  manifest[name] = rel;
}
fs.writeFileSync(path.join(BASE, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log('[snapshot] 已快照 ' + files.length + ' 个文件 → ' + BASE);
for (const rel of files) console.log('  ' + rel + ' → ' + path.basename(BASE) + '/' + path.basename(rel));
