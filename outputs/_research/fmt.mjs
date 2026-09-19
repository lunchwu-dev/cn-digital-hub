import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/';
const raw = readFileSync(DIR + 'probe2.txt', 'utf8');
const out = [];

const line = raw.split('\n').find(l => l.trim().startsWith('{"url"'));
if (line) {
  const s = line.indexOf('{');
  const e = line.lastIndexOf('}');
  try {
    const j = JSON.parse(line.slice(s, e + 1));
    out.push('===== FONTS =====');
    out.push('htmlFont: ' + j.htmlFont);
    out.push('bodyFont: ' + j.bodyFont);
    out.push('fontFamilies: ' + JSON.stringify(j.fontFamilies, null, 1));
    out.push('loadedFonts: ' + JSON.stringify(j.loadedFonts, null, 1));
    out.push('fontFaces: ' + JSON.stringify(j.fontFaces, null, 1));

    out.push('\n===== COLORS =====');
    const hex = v => {
      const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(v);
      if (!m) return v;
      return '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('').toUpperCase();
    };
    out.push('textColors:');
    for (const [c, n] of j.textColors) out.push('  ' + hex(c).padEnd(10) + ' x' + n);
    out.push('bgColors:');
    for (const [c, n] of j.bgColors) out.push('  ' + hex(c).padEnd(10) + ' x' + n);

    out.push('\n===== TYPOGRAPHY =====');
    out.push(JSON.stringify(j.typography, null, 1));

    out.push('\n===== NAV =====');
    out.push(JSON.stringify(j.nav, null, 1));

    out.push('\n===== BUTTONS =====');
    out.push(JSON.stringify(j.buttons, null, 1));

    out.push('\n===== LOGOS =====');
    out.push(JSON.stringify(j.logos, null, 1));

    out.push('\n===== CSS VARS =====');
    out.push(JSON.stringify(j.cssVars, null, 1));
  } catch (err) {
    out.push('parse error: ' + err.message);
    out.push(line.slice(0, 3000));
  }
}
writeFileSync(DIR + 'summary.txt', out.join('\n'), 'utf8');
console.log('ok');
