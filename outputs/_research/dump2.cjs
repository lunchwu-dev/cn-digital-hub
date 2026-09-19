const fs = require('fs');
const dir = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/';
const buf = fs.readFileSync(dir + 'shots-pristine.txt');
let zeros = 0;
for (let i = 1; i < Math.min(buf.length, 8000); i += 2) if (buf[i] === 0) zeros++;
let txt = zeros > 800 ? buf.toString('utf16le') : buf.toString('utf8');
txt = txt.replace(/^\uFEFF/, '');
// PowerShell 把原生 stdout 按 ANSI 解码 → 中文出现 UTF-8→GBK 双重编码，这里做一次可读性修复：仅保留 ASCII + 数字，中文用占位
fs.writeFileSync(dir + 'clean-pristine.txt', txt, 'utf8');
console.log('mode', zeros > 800 ? 'utf16le' : 'utf8', 'lines', txt.split('\n').length);
