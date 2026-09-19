import { writeFileSync } from 'node:fs';

const OUT = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research/probe.txt';
const lines = [];
const log = (...a) => lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' } });
  return { status: r.status, url: r.url, text: await r.text() };
}

const seeds = [
  'https://www.decathlon.com.cn/',
  'https://www.decathlon.cn/',
];

for (const seed of seeds) {
  try {
    const r = await get(seed);
    log(`=== SEED ${seed} -> ${r.status} (final ${r.url}) len=${r.text.length}`);
    if (r.status !== 200) continue;

    const html = r.text;
    const cssHrefs = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)]
      .map(m => m[0])
      .map(tag => (tag.match(/href=["']([^"']+)["']/i) || [])[1])
      .filter(Boolean);
    const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
    const fontPreload = [...html.matchAll(/<link[^>]+as=["']?font["']?[^>]*>/gi)].map(m => m[0]);

    log('CSS links:', JSON.stringify(cssHrefs.slice(0, 40)));
    log('FONT preload tags:', JSON.stringify(fontPreload.slice(0, 20)));
    log('First 20 script srcs:', JSON.stringify(scriptSrcs.slice(0, 20)));

    const inlineFonts = [...html.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)].map(m => m[1].trim());
    log('Inline font-family:', JSON.stringify([...new Set(inlineFonts)].slice(0, 30)));

    const inlineColors = [...html.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(m => m[0].toLowerCase());
    const freq = {};
    for (const c of inlineColors) freq[c] = (freq[c] || 0) + 1;
    log('Inline hex colors top:', JSON.stringify(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 40)));

    // follow up to 6 css files
    const base = new URL(r.url);
    let n = 0;
    for (const href of cssHrefs) {
      if (n >= 6) break;
      let u;
      try { u = new URL(href, base).href; } catch { continue; }
      if (!/\.css/i.test(u)) continue;
      n++;
      try {
        const c = await get(u);
        log(`--- CSS ${u} -> ${c.status} len=${c.text.length}`);
        if (c.status !== 200) continue;
        const ff = [...c.text.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)].map(m => m[1].trim().slice(0, 200));
        log('  font-family set:', JSON.stringify([...new Set(ff)].slice(0, 25)));
        const ff2 = [...c.text.matchAll(/@font-face[^}]{0,400}/gi)].map(m => m[0].replace(/\s+/g, ' ').slice(0, 220));
        log('  @font-face:', JSON.stringify(ff2.slice(0, 12)));
        const cols = [...c.text.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(m => m[0].toLowerCase());
        const f2 = {};
        for (const x of cols) f2[x] = (f2[x] || 0) + 1;
        log('  colors top:', JSON.stringify(Object.entries(f2).sort((a, b) => b[1] - a[1]).slice(0, 30)));
        const vars = [...c.text.matchAll(/--[a-zA-Z0-9-_]*(color|primary|brand|blue|font)[a-zA-Z0-9-_]*\s*:\s*[^;]{1,60};/gi)].map(m => m[0].replace(/\s+/g, ' '));
        log('  css-vars:', JSON.stringify([...new Set(vars)].slice(0, 40)));
      } catch (e) { log('  CSS ERR', u, String(e)); }
    }
  } catch (e) {
    log(`=== SEED ${seed} ERROR ${String(e)}`);
  }
}

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log('written', OUT, lines.length);
