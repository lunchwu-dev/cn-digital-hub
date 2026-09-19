const fs = require('fs');
const p = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/assets/style.css';
const mode = process.argv[2] || 'show';
let css = fs.readFileSync(p, 'utf8');
const out = [];
function ctx(needle) {
  const i = css.indexOf(needle);
  if (i < 0) return needle + ' :: NOT FOUND';
  return needle + ' @' + i + ' :: ...' + css.slice(Math.max(0, i - 60), i + 220) + '...';
}
out.push('--- .dp-search-pill ---');
out.push(ctx('.dp-search-pill{'));
out.push('--- .dp-topbar-inner ---');
out.push(ctx('.dp-topbar-inner{'));
out.push('--- 1011 media ---');
out.push(ctx('@media (max-width: 1011px)'));
out.push('--- 1271 media ---');
out.push(ctx('@media (max-width: 1271px)'));
out.push('--- nowrap ---');
out.push(ctx('flex-wrap:nowrap'));
out.push('--- wrap ---');
out.push(ctx('flex-wrap:wrap'));

if (mode === 'mutate') {
  // 变异1：把搜索胶囊的最小宽度钉成 400px → 全宽度区间溢出
  const before = css;
  css = css.replace('.dp-search-pill{', '.dp-search-pill{min-width:400px !important;');
  if (css === before) out.push('!! mutate-noop');
  else fs.writeFileSync(p, css, 'utf8');
  out.push('MUTATED min-width:400px !important applied=' + (css !== before));
}
if (mode === 'restore') {
  fs.copyFileSync('C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/style.css.bak', p);
  out.push('RESTORED');
}
fs.writeFileSync('C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/cssprobe.txt', out.join('\n\n'), 'utf8');
console.log('ok');
