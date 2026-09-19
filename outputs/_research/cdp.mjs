import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const TARGET = process.argv[2] || 'https://www.decathlon.com.cn/';
const OUTDIR = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_research';
const udd = mkdtempSync(join(tmpdir(), 'cdp-'));

const lines = [];
const log = (...a) => lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x, null, 1)).join(' '));

const child = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-blink-features=AutomationControlled',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`,
  '--window-size=1440,2600', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitJson(path, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`); if (r.ok) return await r.json(); } catch { }
    await sleep(500);
  }
  throw new Error('devtools not ready: ' + path);
}

let msgId = 0;
function cdp(ws) {
  const pending = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  return (method, params = {}) => new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, m => m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result));
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const EXPR = `(() => {
  const out = { url: location.href, title: document.title };
  const cs = el => getComputedStyle(el);
  const de = document.documentElement, bd = document.body;
  out.htmlFont = cs(de).fontFamily;
  out.bodyFont = cs(bd).fontFamily;
  out.bodyBg = cs(bd).backgroundColor;
  out.bodyColor = cs(bd).color;

  const ff = {}, colors = {}, bgs = {};
  for (const el of document.querySelectorAll('*')) {
    const s = cs(el);
    if (s.fontFamily) ff[s.fontFamily] = (ff[s.fontFamily] || 0) + 1;
    if (s.color) colors[s.color] = (colors[s.color] || 0) + 1;
    const b = s.backgroundColor;
    if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') bgs[b] = (bgs[b] || 0) + 1;
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  out.fontFamilies = top(ff, 20);
  out.textColors = top(colors, 20);
  out.bgColors = top(bgs, 25);

  out.typography = ['h1','h2','h3','h4','p','a','button','span'].map(tag => {
    const el = document.querySelector(tag);
    if (!el) return [tag, null];
    const s = cs(el);
    return [tag, { size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, color: s.color, ff: s.fontFamily.slice(0, 90) }];
  });

  out.logos = [...document.querySelectorAll('img,svg')].filter(e => {
    const t = (e.getAttribute('src') || '') + ' ' + (e.getAttribute('class') || '') + ' ' + (e.getAttribute('id') || '') + ' ' + (e.getAttribute('alt') || '');
    return /logo|brand|decathlon|orbit/i.test(t);
  }).slice(0, 8).map(e => ({ tag: e.tagName, src: (e.getAttribute('src') || '').slice(0, 160), alt: e.getAttribute('alt'), cls: (e.getAttribute('class') || '').slice(0, 80), w: e.clientWidth, h: e.clientHeight, svg: e.tagName === 'SVG' ? e.outerHTML.replace(/\\s+/g, ' ').slice(0, 500) : null }));

  out.buttons = [...document.querySelectorAll('button, a[class*=btn], [class*=button], [class*=Button]')].slice(0, 14).map(e => {
    const s = cs(e), r = e.getBoundingClientRect();
    return { t: (e.textContent || '').trim().slice(0, 20), bg: s.backgroundColor, c: s.color, r: s.borderRadius, w: Math.round(r.width), h: Math.round(r.height), fs: s.fontSize, fw: s.fontWeight };
  });

  const nav = document.querySelector('header, nav, [class*=header], [class*=nav]');
  if (nav) { const s = cs(nav); out.nav = { tag: nav.tagName, cls: (nav.getAttribute('class') || '').slice(0, 80), bg: s.backgroundColor, color: s.color, h: Math.round(nav.getBoundingClientRect().height), fs: s.fontSize }; }

  const vars = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!rule.style) continue;
        for (let i = 0; i < rule.style.length; i++) {
          const p = rule.style[i];
          if (p.startsWith('--')) vars[p] = rule.style.getPropertyValue(p).trim();
        }
      }
    } catch (e) { }
  }
  out.cssVars = Object.fromEntries(Object.entries(vars).slice(0, 100));
  out.loadedFonts = [...document.fonts].map(f => f.family + '|' + f.weight + '|' + f.status).slice(0, 30);
  out.fontFaces = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })
    .filter(r => r.constructor.name === 'CSSFontFaceRule')
    .map(r => r.cssText.replace(/\\s+/g, ' ').slice(0, 260)).slice(0, 20);
  return JSON.stringify(out);
})()`;

try {
  const ver = await waitJson('/json/version');
  log('### DevTools ready:', ver.Browser);

  const t = await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(TARGET), { method: 'PUT' }).then(r => r.json()).catch(async () => {
    const list = await waitJson('/json/list');
    return list.find(x => x.type === 'page');
  });
  const wsUrl = t.webSocketDebuggerUrl;
  log('### Target:', t.url || TARGET);

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const send = cdp(ws);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.navigate', { url: TARGET });

  await sleep(9000);
  let ready = '';
  for (let i = 0; i < 20; i++) {
    const r = await send('Runtime.evaluate', { expression: 'document.readyState + "|" + location.href + "|" + document.body.innerText.length', returnByValue: true });
    ready = r.result.value;
    if (/^complete/.test(ready)) break;
    await sleep(1500);
  }
  log('### readyState:', ready);
  await sleep(3000);

  const res = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true, awaitPromise: false });
  if (res.exceptionDetails) log('### EXCEPTION:', JSON.stringify(res.exceptionDetails).slice(0, 800));
  log('### EXTRACTED:');
  log(res.result.value || '(no value)');

  try {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(OUTDIR, 'decathlon_home.png'), Buffer.from(shot.data, 'base64'));
    log('### screenshot saved');
  } catch (e) { log('### screenshot failed', String(e)); }

  try { await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0,1500)', returnByValue: true }).then(r => log('### TEXT:', r.result.value)); } catch { }

  ws.close();
} catch (e) {
  log('### FATAL', String(e && e.stack || e));
} finally {
  try { child.kill(); } catch { }
  writeFileSync(join(OUTDIR, 'probe2.txt'), lines.join('\n'), 'utf8');
  console.log('done');
  process.exit(0);
}
