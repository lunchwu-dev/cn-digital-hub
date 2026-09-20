/**
 * _mut_restore.cjs <id|all> —— 从 tests/.mutbase/ 还原源文件（叶子脚本，单进程，不 spawn）
 * ======================================================================================
 * 还原来源 = 运行前的工作树快照（**不是** git）。`all` 还原全部目标文件。
 * 用法：node tests/_mut_restore.cjs "M13"    或    node tests/_mut_restore.cjs all
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ROOT / BASE 可用环境变量重定向（默认真实仓库根 + tests/.mutbase；供沙盒往返验证用）。 */
const ROOT = process.env.MUT_ROOT ? path.resolve(process.env.MUT_ROOT) : path.resolve(__dirname, '..');
const { TARGETS, MUTATIONS } = require('./_mutations.data.cjs');
const BASE = process.env.MUT_BASE ? path.resolve(process.env.MUT_BASE) : path.join(__dirname, '.mutbase');

const all = [...new Set([...Object.keys(TARGETS), ...MUTATIONS.map((m) => m.file)])];

const arg = process.argv[2];
if (!arg) {
  console.error('用法: node tests/_mut_restore.cjs <id|id前缀|all>');
  process.exit(2);
}

let files;
if (arg === 'all') {
  files = all;
} else {
  const m =
    MUTATIONS.find((x) => x.id === arg) ||
    MUTATIONS.find((x) => x.id.startsWith(arg));
  if (!m) {
    console.error('❌ 未找到变异: ' + arg);
    process.exit(2);
  }
  files = [m.file];
}

for (const rel of files) {
  const name = path.basename(rel);
  const bak = path.join(BASE, name);
  if (!fs.existsSync(bak)) {
    console.error('❌ 快照缺失: .mutbase/' + name + '（请先运行 node tests/_mut_snapshot.cjs）');
    process.exit(4);
  }
  fs.copyFileSync(bak, path.join(ROOT, rel));
  console.log('[restore] ' + (arg === 'all' ? 'all' : arg) + ' → ' + rel);
}
