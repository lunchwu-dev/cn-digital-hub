/**
 * Q4(b) 判据强度反证：断言2「高度单调不增」到底能不能防住「某一档突然折行」？
 * 做法（不改原型任何文件）：页面加载后**在运行时注入**一条 CSS，模拟「换行档位下界被误改宽」
 * 这类回归 —— 把「允许换行」的区域从 ≤767 误扩到 ≤900。然后连续扫 375→1920，
 * 在同一份数据上分别跑「lead 的判据2（单调不增）」与「我提议的判据（≥768 恒为单行）」。
 * 预期：单调性判据放行（因为 901 处高度回落，是合法的"下降"），绝对判据变红。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9430 + Math.floor(Math.random() * 60);
const DIST = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html'; // 裸路径；前缀 file:/// 在下方拼接
const OUT = 'C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify/reviewer-mutant';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MUTANT = `(()=>{const s=document.createElement('style');s.id='mutant';
  s.textContent='@media (max-width:900px){.dp-topbar-inner{flex-wrap:wrap !important;gap:12px !important;padding-top:8px !important;padding-bottom:8px !important}}';
  document.head.appendChild(s);return true})()`;

const M = `JSON.stringify((()=>{const de=document.documentElement;const tb=document.querySelector('.dp-topbar');
  const nt=document.querySelector('.dp-nav-text');
  return {h:tb?Math.round(tb.getBoundingClientRect().height*100)/100:null,
    navText:nt?getComputedStyle(nt).display!=='none':null, sw:de.scrollWidth, cw:de.clientWidth};})())`;

class CDP {
  constructor(ws){this.ws=ws;this.id=0;this.p=new Map();}
  static async attach(url){const ws=new WebSocket(url);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
    const c=new CDP(ws);ws.onmessage=(e)=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result);}};return c;}
  send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});
    this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method));}},20000);});}
  async eval(e){const r=await this.send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error('eval '+JSON.stringify(r.exceptionDetails));return r.result.value;}
}
async function httpJson(p){for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}${p}`);if(r.ok)return await r.json();}catch{}await sleep(250);}throw new Error('no cdp');}

const chrome=spawn(CHROME,[`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-first-run',
  '--no-default-browser-check',`--user-data-dir=C:/Users/uuzz/AppData/Local/Temp/reviewer-mutant-${Date.now()}`,
  '--window-size=1440,900','--hide-scrollbars','--allow-file-access-from-files','about:blank'],{stdio:'ignore'});
try{
  await httpJson('/json/version');
  const page=(await httpJson('/json/list')).find(t=>t.type==='page');
  const cdp=await CDP.attach(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`try{localStorage.setItem('dp_portal_tour_done','1')}catch(e){}`});
  const nav=await cdp.send('Page.navigate',{url:'file:///'+DIST+'#/home'});
  if(nav&&nav.errorText)throw new Error('导航失败：'+nav.errorText);
  for(let i=0;i<120;i++){try{if(await cdp.eval('!!document.querySelector(".dp-topbar")'))break;}catch{}await sleep(250);}
  await cdp.eval(`(()=>{const s=document.createElement('style');s.textContent='.ant-tour,.ant-tour-mask,.ant-tour-target-placeholder{display:none !important}';document.head.appendChild(s);return true})()`);
  await sleep(600);
  const sen=await cdp.eval(`(()=>{const tb=document.querySelector('.dp-topbar');return {href:location.href,tb:!!tb,h:tb?Math.round(tb.getBoundingClientRect().height):null}})()`);
  if(!sen.tb||!(sen.h>0))throw new Error('前置哨兵失败：顶栏未渲染 '+JSON.stringify(sen));
  await cdp.eval(MUTANT);

  const rows=[];
  for(let w=375;w<=1920;w++){await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:900,deviceScaleFactor:1,mobile:false});
    await sleep(9);const rec=Object.assign({w},JSON.parse(await cdp.eval(M)));
    if(rec.h==null)throw new Error(`第 ${w}px 档顶栏缺失 —— app 疑似崩溃，中止`);rows.push(rec);}

  // 判据A：lead 的单调不增
  const bumps=[];for(let i=1;i<rows.length;i++)if(rows[i].h>rows[i-1].h)bumps.push(`${rows[i-1].w}(${rows[i-1].h})→${rows[i].w}(${rows[i].h})`);
  // 判据B：≥768 恒为单行（等于 1920 的高度）
  const hEnd=rows.find(r=>r.w===1920).h;
  const multi=rows.filter(r=>r.w>=768&&r.h!==hEnd);
  const ov=rows.filter(r=>r.sw>r.cw);
  const band=multi.length?`${multi[0].w}–${multi[multi.length-1].w}`:'无';
  const L=[
    `变异：允许换行区域 767 → 900（仅运行时注入，未改文件）`,
    `判据A 单调不增：${bumps.length? 'FAIL('+bumps.slice(0,4).join(',')+')':'PASS'}  ← 突变处高度回落，被判为合法"下降"`,
    `判据B ≥768 恒单行：${multi.length?'FAIL':'PASS'}  非单行区间=${band}  (1920 高=${hEnd}, 该区间高=${multi[0]?multi[0].h:'n/a'})`,
    `断言1 连续溢出：${ov.length?'FAIL':'PASS'}(${ov.length} 档)  ← 折行规避了溢出，溢出断言抓不到`,
  ];
  fs.writeFileSync(OUT+'.json',JSON.stringify({rows},null,1));
  fs.writeFileSync(OUT+'.txt',L.join('\n'));
  console.log(L.join('\n'));
}catch(e){fs.writeFileSync(OUT+'.err.txt',String((e&&e.stack)||e));throw e;}finally{try{chrome.kill();}catch{}}
