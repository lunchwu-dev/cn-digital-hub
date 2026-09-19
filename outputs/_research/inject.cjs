const fs = require('fs');
const p = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/assets/style.css';
const mode = process.argv[2];
const MARK = '@media (max-width:1300px){.dp-topbar-inner{min-height:69px}}';
let css = fs.readFileSync(p, 'utf8');
const out = [];
if (mode === 'inject') {
  if (css.includes(MARK)) out.push('already injected');
  else { css = css + '\n' + MARK + '\n'; fs.writeFileSync(p, css, 'utf8'); out.push('injected min-height:69px band'); }
} else if (mode === 'restore') {
  fs.copyFileSync('C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/style.css.bak', p);
  out.push('restored from baseline backup');
} else {
  out.push('no-op');
}
out.push('css length now = ' + fs.readFileSync(p, 'utf8').length);
out.push('has mark = ' + fs.readFileSync(p, 'utf8').includes(MARK));
fs.writeFileSync('C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/inject.txt', out.join('\n'), 'utf8');
console.log('ok');
