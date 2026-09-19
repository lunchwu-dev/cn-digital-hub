const fs = require('fs');
const dir = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/';
for (const name of ['smoke-lead.txt']) {
  const buf = fs.readFileSync(dir + name);
  let txt;
  // UTF-16LE heuristic: many zero bytes in odd positions
  let zeros = 0;
  for (let i = 1; i < Math.min(buf.length, 4000); i += 2) if (buf[i] === 0) zeros++;
  if (zeros > 500) txt = buf.toString('utf16le');
  else txt = buf.toString('utf8');
  txt = txt.replace(/^\uFEFF/, '');
  fs.writeFileSync(dir + 'clean-' + name, txt, 'utf8');
  console.log(name, 'bytes=', buf.length, 'mode=', zeros > 500 ? 'utf16le' : 'utf8', 'lines=', txt.split('\n').length);
}
