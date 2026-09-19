const fs = require('fs');
const dir = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/';
const src = dir + 'shots-pristine.txt';
const buf = fs.readFileSync(src);

// 试三种解码，取"替换字符最少 + 空字符最少"的那个
const cands = [
  ['u16', buf.toString('utf16le')],
  ['u8', buf.toString('utf8')],
  ['latin1-as-u8', Buffer.from(buf.toString('latin1'), 'latin1').toString('utf8')],
];
function score(s) {
  const bad = (s.match(/\uFFFD/g) || []).length;
  const nul = (s.match(/\u0000/g) || []).length;
  return bad * 10 + nul * 100;
}
cands.sort((a, b) => score(a[1]) - score(b[1]));
const [name, raw] = cands[0];
const txt = raw.replace(/\u0000/g, '').replace(/^\uFEFF/, '');
fs.writeFileSync(dir + 'pristine-clean.txt', txt, 'utf8');
console.log('picked', name, 'score', score(raw), 'lines', txt.split('\n').length);
