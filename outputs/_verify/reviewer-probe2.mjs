/** 诊断：为什么 foldband 脚本里应用没渲染（顶栏缺失）。 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT=9346;
const IDX='C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/portal/dist/index.html';
const OUT='C:/Users/uuzz/WorkBuddy/2026-09-17-21-20-34/outputs/_verify/reviewer-probe2-'+(process.argv[2]||'default')+'.txt';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const DIAG=`JSON.stringify((()=>{const r=document.getElementById('root');
  return {url:location.href, title:document.title, bodyLen:document.body?document.body.innerHTML.length:null,
    rootKids:r?r.childElementCount:null, topbar:!!document.querySelector('.dp-topbar'),
    scripts:Array.from(document.scripts).map(s=>s.getAttribute('src')||'(inline)'),
    res:performance.getEntriesByType('resource').map(e=>e.name.split('/').slice(-1)[0]).slice(0,8)};})())`;
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map();this.events=[];}
  static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
    const c=new CDP(ws);ws.onmessage=(ev)=>{const m=JSON.parse(ev.data);
      if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result);}
      else if(m.method)c.events.push(m.method+(m.params&&m.params.exceptionDetails?': '+(m.params.exceptionDetails.exception&&m.params.exceptionDetails.exception.description||JSON.stringify(m.params.exceptionDetails)).slice(0,300):m.params&&m.params.entry?': '+m.params.entry.text.slice(0,200):m.params&&m.params.args?': '+m.params.args.map(a=>a.value||a.description||'').join(' ').slice(0,200):''));};
    return c;}
  send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});
    this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method));}},15000);});}
  async eval(e){const r=await this.send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)return 'EXC:'+JSON.stringify(r.exceptionDetails).slice(0,300);return r.result.value;}}
async function httpJson(p){for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}${p}`);if(r.ok)return await r.json();}catch{}await sleep(250);}throw new Error('no cdp');}

const ARGS=process.argv[2]==='foldband'
  ? [`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
     '--user-data-dir=C:/Users/uuzz/AppData/Local/Temp/reviewer-probe2-profile','--window-size=1440,900','--hide-scrollbars',
     '--allow-file-access-from-files','file:///'+IDX+'#/home']
  : [`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
     '--user-data-dir=C:/Users/uuzz/AppData/Local/Temp/reviewer-probe2-profile','--window-size=1440,900','file:///'+IDX+'#/home'];

const chrome=spawn(CHROME,ARGS,{stdio:'ignore'});
const out=[];
try{
  await httpJson('/json/version');
  const page=(await httpJson('/json/list')).find(t=>t.type==='page');
  const cdp=await CDP.attach(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Log.enable');
  await sleep(3000);
  out.push('ARGS_MODE='+(process.argv[2]||'audit'));
  out.push('DIAG='+JSON.stringify(await cdp.eval(DIAG)));
  out.push('EVENTS:'); out.push(cdp.events.slice(0,25).join('\n  '));
  fs.writeFileSync(OUT,out.join('\n'));
  console.log(out.join('\n'));
}catch(e){fs.writeFileSync(OUT,'ERR '+e.message+'\n'+out.join('\n'));console.log(e.message);}
finally{try{chrome.kill();}catch{}}
