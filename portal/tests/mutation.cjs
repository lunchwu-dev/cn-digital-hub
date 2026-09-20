/**
 * 变异自证（mutation self-test）—— 证明关键断言不是「空转」
 * ==================================================================
 * ⚠️ 运行约束（必须遵守，否则会污染工作树 —— 本轮曾真实发生）
 *   1. **不可与其他写入进程并行运行**：本脚本会改写 src/ 下的被变异文件。
 *      若同一工作树上有另一个进程（人 / 另一个 mutation 实例 / 编辑器自动保存）
 *      也在写同一批文件，双方会互相覆盖，还原结果不可信。
 *   2. 本脚本启动时会**先校验工作树洁净**（见下），不干净直接 exit 1、不写任何文件。
 *   3. 崩溃 / Ctrl-C / 被强杀时，进程级钩子会**同步还原**所有 in-flight 变异文件。
 *
 * 做法
 * ------------------------------------------------------------------
 *   把指定源文件文本做一次精确替换 → 重新 vite build → 跑 smoke，
 *   在输出中查找「指定的断言名」是否出现 FAIL。判定完成后**立即还原并校验 sha256**，
 *   再进入下一个变异（严格串行）。
 *
 * 三层还原（缺一不可）
 * ------------------------------------------------------------------
 *   L1  finally            —— 正常路径，覆盖「本迭代已进入 try」。
 *   L2  进程级钩子          —— exit / SIGINT / SIGTERM / uncaughtException / unhandledRejection，
 *                              同步 writeFileSync 还原 dirtyFiles Map 里所有仍挂着的文件。
 *                              （exit 钩子内不能做异步，故一律同步写。）
 *   L3  启动自愈            —— 启动时若发现工作树不干净（sha 不符 / 残留备份），
 *                              先用磁盘备份恢复，再拒绝继续；绝不「在脏树上叠加新变异」。
 *
 * 前置洁净校验（在基线构建之前）
 * ------------------------------------------------------------------
 *   对每个被变异文件，比对其 sha256 与**清单基线**（TARGETS，见下）是否一致；
 *   再跑一次 smoke 必须「通过 N，失败 0」。
 *   任一不满足 → console.error 报出「期望 sha / 实际 sha」→ exit 1，不写任何文件。
 *   （sha 清单即“已知 good”锚点；smoke 全绿是行为级第二道保险。）
 *
 * ⚠️ 基线维护（重要，必须遵守）
 * ------------------------------------------------------------------
 *   TARGETS 里的 sha256 是**硬编码**的洁净锚点，这是刻意的「显式确认」设计。
 *   因此：**只要你有意修改了这 7 个源文件中的任意一个，就必须重跑
 *   `node tests/mutation.cjs --print-sha` 并把输出同步更新到 TARGETS**，
 *   否则下次启动会因 sha 不符而被拒绝（这是防止「在不知情的脏树上做变异」）。
 *   --print-sha 只打印当前 sha，不会写任何文件。
 *
 * 污染后的错误恢复路径
 * ------------------------------------------------------------------
 *   本脚本拒绝启动时会打印期望/实际 sha。恢复方式：
 *     ① 从 tests/.mutation-backup/ 的对应 .bak 还原（崩溃时自动生成）；或
 *     ② 从本任务上一份干净副本 / 已知基线 sha 手工还原。
 *   ⚠️ **不要用 `git checkout -- <file>`**：这些文件相对 HEAD 普遍带有未提交的
 *      特性改动（部分文件还是 untracked），checkout 会连同特性一起丢失，
 *      或对 untracked 文件直接报 `pathspec did not match`。
 *
 * 运行：**必须先设 NODE_PATH**（否则 smoke.cjs 的 jsdom / vite / esbuild 解析不到，
 *        smoke 会在启动期崩溃；此时本脚本会分流报「smoke 未能启动」而非污染）：
 *         PowerShell: $env:NODE_PATH='C:\Users\<you>\.workbuddy\binaries\node\workspace\node_modules'
 *       node tests/mutation.cjs                 （跑全量变异自证）
 *       node tests/mutation.cjs --print-sha      （打印被变异文件当前 sha256）
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NODE = process.execPath;
const VITE_JS = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const BACKUP_DIR = path.join(ROOT, 'tests', '.mutation-backup');
const LOCK_FILE = path.join(ROOT, 'tests', '.mutation.lock');

const { TARGETS, MUTATIONS } = require('./_mutations.data.cjs');

/* --print-sha：打印被变异文件的当前 sha256，便于在**有意**修改源文件后重建基线。
   只读，不写任何文件。用法见文件头「基线维护」。
   清单即 TARGETS 的键（基线 sha 与变异清单的单一事实源在 tests/_mutations.data.cjs）。 */
if (process.argv.includes('--print-sha')) {
  const crypto0 = require('crypto');
  for (const rel of Object.keys(TARGETS)) {
    const abs0 = path.join(ROOT, rel);
    const h = crypto0.createHash('sha256').update(require('fs').readFileSync(abs0)).digest('hex').toUpperCase();
    console.log("  '" + rel + "': '" + h + "',");
  }
  process.exit(0);
}

/* ================================ 工具 ================================ */
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
const sha256File = (abs) => sha256(fs.readFileSync(abs));
const relPath = (p) => p.split(path.sep).join('/');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'buffer', env: process.env, shell: false });
  const out = (r.stdout ? r.stdout.toString('utf8') : '') + (r.stderr ? r.stderr.toString('utf8') : '');
  return { ok: r.status === 0, status: r.status, out };
}
function build() {
  const r = run(NODE, [VITE_JS, 'build']);
  return { ok: r.ok && /built in|transformed/.test(r.out), out: r.out };
}
function smoke() {
  const r = spawnSync(NODE, [path.join('tests', 'smoke.cjs')], { cwd: ROOT, encoding: 'utf8', env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  const total = (out.match(/合计 (\d+) 项断言，通过 (\d+)，失败 (\d+)/) || []);
  const hasTotal = total.length > 0;
  /* 启动失败分流：smoke 脚本**根本没跑起来**（模块缺失 / 进程非零退出且无汇总行），
     与「跑起来了但断言不过」是两码事。前者几乎总是 NODE_PATH 没指向 workspace node_modules
     （jsdom / vite 等依赖解析不到），必须报「未能启动」并提示 NODE_PATH，**不得**误导为
     「工作树已被污染」。后者才是真正的断言失败（工作树可能脏）。 */
  const modMissing = /MODULE_NOT_FOUND|Cannot find module/.test(out) || /Cannot find package/.test(out);
  const crashed = !hasTotal && (modMissing || r.status !== 0);
  // 从输出里摘出 `Error: ...` 那一行，便于打印「Cannot find module 'jsdom'」这类根因。
  const errLine = (out.split(/\r?\n/).find((l) => /^\s*Error:/.test(l) || /Cannot find module/.test(l)) || '').trim();
  return {
    out,
    pass: total[2] ? Number(total[2]) : null,
    fail: total[3] ? Number(total[3]) : null,
    total: total[0] || '(no total)',
    hasTotal,
    status: r.status,
    kind: crashed ? 'smoke-crash' : 'smoke-ran',
    errLine,
  };
}

/* 几何实测门（供 gate:'geom-gantt' 的变异用）——
   调用 tests/_geom_gantt.cjs：真实 Chrome + CDP 加载个人主页，量 1440 视口下
   .dp-gantt 的真实渲染几何与**解析后的色值**（复刻 shots 断言 1d 的采集口径）。
   v0.5 起取代 v0.4.3 的 geomDuo()（`.dp-g-duo` 已从 DOM 移除，原被测量对象不存在了）。
   判定：探针 output 含 GEOM_JSON，且其中 ok=true → 版式合规（未变红）；
         ok=false（或非零退出）→ 版式事实被破坏 → **变红**（这正是变异期望）。
   子断言全量拆出（notStacked / widthsEqual / bandColor / bandRadius / bandGap /
   tierFill / noOverflow），便于报告里写清「红由哪一条触发」——
   这是 v0.4.3 那次「M13 实际只由 leftDiff 判红」教训的直接产物。 */
function geomGantt() {
  const r = spawnSync(NODE, [path.join('tests', '_geom_gantt.cjs')], { cwd: ROOT, encoding: 'utf8', env: process.env, timeout: 120000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/GEOM_JSON=(\{.*\})/);
  let parsed = null;
  try { parsed = m ? JSON.parse(m[1]) : null; } catch (_) { parsed = null; }
  const verdict = parsed ? parsed.verdict : '(无 GEOM_JSON)';
  const pick = (k) => (parsed && typeof parsed[k] === 'boolean' ? parsed[k] : null);
  return {
    status: r.status,
    ok: !!(parsed && parsed.ok),
    verdict,
    ratioMax: parsed ? parsed.ratioMax : null,
    bandColor: parsed ? parsed.bandColor : null,
    bandGap: parsed ? parsed.bandGap : null,
    notStacked: pick('notStacked'),
    widthsEqual: pick('widthsEqual'),
    bandColorOk: pick('bandColorOk'),
    bandRadiusOk: pick('bandRadiusOk'),
    bandGapOk: pick('bandGapOk'),
    tierFillOk: pick('tierFillOk'),
    noOverflow: pick('noOverflow'),
    raw: out,
  };
}

/* ===================== L2/L3：崩溃安全还原骨架 ===================== */
/* dirtyFiles: relPath -> { abs, buf(Buffer 原始内容), bak(磁盘备份路径) }
   写入变异前登记；还原并校验后注销。钩子只处理这里仍挂着的。 */
const dirtyFiles = new Map();

function writeBackup(rel) {
  const abs = path.join(ROOT, rel);
  const buf = fs.readFileSync(abs);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const bak = path.join(BACKUP_DIR, rel.replace(/[\\/]/g, '__') + '.bak');
  fs.writeFileSync(bak, buf);
  return { abs, buf, bak };
}

/** 同步还原全部 in-flight 文件（供 finally 与进程钩子共用）
    还原来源优先用内存 buf（最可靠）；若内存缺失则回退到磁盘 .bak。 */
function restoreAllSync(reason) {
  if (dirtyFiles.size === 0) return;
  const failed = [];
  for (const [rel, rec] of Array.from(dirtyFiles.entries())) {
    try {
      let src = rec.buf;
      if (!src && rec.bak && fs.existsSync(rec.bak)) src = fs.readFileSync(rec.bak);
      if (!src) {
        failed.push(rel + '(无可用还原源)');
        continue;
      }
      fs.writeFileSync(rec.abs, src); // 同步写，钩子里安全
      // 校验还原是否精确（按字节比对，避免换行/编码差异）
      const now = fs.readFileSync(rec.abs);
      if (Buffer.compare(now, src) === 0) {
        dirtyFiles.delete(rel);
        try { fs.unlinkSync(rec.bak); } catch (_) {}
      } else {
        failed.push(rel);
      }
    } catch (e) {
      failed.push(rel + '(' + (e && e.code ? e.code : e.message) + ')');
    }
  }
  if (failed.length) {
    try { process.stderr.write('[restore:' + (reason || '?') + '] 还原失败: ' + failed.join(', ') + '\n'); } catch (_) {}
  }
  return failed;
}

let restoring = false;
function hookRestore(reason, code) {
  if (restoring) return; // 防重入
  restoring = true;
  restoreAllSync(reason);
  // 清理锁与（已空的）备份目录
  try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch (_) {}
  try {
    if (fs.existsSync(BACKUP_DIR) && fs.readdirSync(BACKUP_DIR).length === 0) fs.rmdirSync(BACKUP_DIR);
  } catch (_) {}
  void code;
}

process.on('exit', () => hookRestore('exit', undefined));
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
  process.on(sig, () => {
    hookRestore(sig, 130);
    process.exit(130);
  });
});
process.on('uncaughtException', (e) => {
  try { process.stderr.write('[uncaughtException] ' + (e && e.stack ? e.stack : e) + '\n'); } catch (_) {}
  hookRestore('uncaughtException', 1);
  process.exit(1);
});
process.on('unhandledRejection', (e) => {
  try { process.stderr.write('[unhandledRejection] ' + (e && e.stack ? e.stack : e) + '\n'); } catch (_) {}
  hookRestore('unhandledRejection', 1);
  process.exit(1);
});

/* ===================== 启动：锁 + 洁净校验（L3） ===================== */
function acquireLockOrDie() {
  if (fs.existsSync(LOCK_FILE)) {
    const raw = fs.readFileSync(LOCK_FILE, 'utf8');
    let info = {};
    try { info = JSON.parse(raw); } catch (_) {}
    // 判断持锁进程是否还活着（Windows 下 tasklist；其它平台 kill(pid,0)）
    const alive = isPidAlive(info.pid);
    if (alive) {
      console.error(
        '工作树被另一个 mutation 进程占用，拒绝启动（不可并行）：\n' +
        '  lock=' + LOCK_FILE + '\n' +
        '  holder pid=' + info.pid + ' started=' + info.startedAt + '\n' +
        '  如确认该进程已死，可手动删除锁文件后重试。'
      );
      process.exit(1);
    }
    // 陈旧锁（持锁者已死）→ 清掉
    try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), 'utf8');
}
function isPidAlive(pid) {
  if (!pid || pid === process.pid) return pid === process.pid;
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('tasklist', ['/FI', 'PID eq ' + pid], { encoding: 'utf8' });
      return !!r.stdout && r.stdout.includes(String(pid));
    }
    process.kill(pid, 0);
    return true;
  } catch (_) {
    return false;
  }
}

/** 启动自愈 + 洁净校验：不干净先尝试用 .bak 恢复，再 exit 1 */
function preflightOrDie() {
  const problems = [];
  for (const [rel, expected] of Object.entries(TARGETS)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) { problems.push({ rel, expected, actual: '(缺失)' }); continue; }
    const actual = sha256File(abs);
    if (actual !== expected) problems.push({ rel, expected, actual });
  }
  if (problems.length === 0) return true;

  // 尝试用磁盘备份自愈（若备份存在且内容 sha 与基线一致）
  const healed = [];
  for (const p of problems) {
    const bak = path.join(BACKUP_DIR, p.rel.replace(/[\\/]/g, '__') + '.bak');
    if (fs.existsSync(bak)) {
      const bakSha = sha256File(bak);
      if (bakSha === p.expected) {
        fs.writeFileSync(path.join(ROOT, p.rel), fs.readFileSync(bak));
        healed.push(p.rel);
        try { fs.unlinkSync(bak); } catch (_) {}
      }
    }
  }
  // 自愈后再复查
  const stillBad = [];
  for (const [rel, expected] of Object.entries(TARGETS)) {
    const abs = path.join(ROOT, rel);
    const actual = fs.existsSync(abs) ? sha256File(abs) : '(缺失)';
    if (actual !== expected) stillBad.push({ rel, expected, actual });
  }
  if (stillBad.length === 0) {
    console.log('[i] 启动自愈成功：已用备份还原 ' + healed.join(', '));
    return true;
  }
  console.error('❌ 工作树已被污染，拒绝启动（不写任何文件）。');
  if (healed.length) console.error('  本次先自愈了: ' + healed.join(', '));
  console.error('  以下文件 sha256 与基线不符：');
  for (const b of stillBad) console.error('   ' + b.rel + '\n     期望 sha=' + b.expected + '\n     实际 sha=' + b.actual);
  console.error('  修复建议：');
  console.error('    ① 从 tests/.mutation-backup/ 的对应 .bak 还原（若存在）；或');
  console.error('    ② 从本任务上一份干净副本 / 已知基线 sha 手工还原后重跑。');
  console.error('  ⚠️ 不要用 git checkout -- ：这些文件相对 HEAD 带有未提交的特性改动（部分为 untracked），');
  console.error('     checkout 会连同特性一起丢失，或对 untracked 文件直接报 pathspec did not match。');
  return false;
}

/* ================================ 主流程 ================================ */
const results = [];

async function main() {
  // ① 拿锁（并发互斥）
  acquireLockOrDie();

  // ② 前置洁净校验（在基线构建之前）
  if (!preflightOrDie()) {
    hookRestore('preflight-fail', 1);
    process.exitCode = 1;
    return;
  }

  // ③ 行为级第二道保险：未变异状态下 smoke 必须全绿
  console.log('[i] 基线构建…');
  const b0 = build();
  if (!b0.ok) {
    console.error('❌ 基线构建失败，拒绝启动。');
    hookRestore('baseline-build-fail', 1);
    process.exitCode = 1;
    return;
  }
  const s0 = smoke();
  /* 分流：① smoke 没启动起来（模块缺失 / 非零退出无汇总行）→ 报启动失败 + NODE_PATH 提示；
     ② smoke 跑起来了但断言不过 → 报「未全绿（N 项失败）」并列出失败断言名。
     严禁把 ① 误报成「工作树可能已被污染」。 */
  if (s0.kind === 'smoke-crash') {
    console.error('❌ 基线 smoke **未能启动**（不是断言失败，勿误判为工作树污染）。');
    if (s0.errLine) console.error('   ' + s0.errLine);
    console.error('   建议：检查 `NODE_PATH` 是否指向 node workspace 的 node_modules');
    console.error('        （如 set NODE_PATH=C:\\Users\\<you>\\.workbuddy\\binaries\\node\\workspace\\node_modules），');
    console.error('        否则 smoke.cjs 依赖的 jsdom / vite / esbuild 解析不到。');
    console.error('   smoke 退出码=' + s0.status + '，无「合计 N 项断言」汇总行。');
    hookRestore('baseline-smoke-crash', 1);
    process.exitCode = 1;
    return;
  }
  if (s0.fail === null || s0.fail !== 0) {
    console.error('❌ 基线 smoke 未全绿（' + s0.total + '），工作树可能已被污染，拒绝启动。');
    const failLines = s0.out
      .split(/\r?\n/)
      .filter((l) => /^FAIL\b/.test(l))
      .slice(0, 12);
    if (failLines.length) {
      console.error('   失败断言：');
      failLines.forEach((l) => console.error('     ' + l));
    }
    hookRestore('baseline-smoke-fail', 1);
    process.exitCode = 1;
    return;
  }
  console.log('[i] 基线洁净：' + s0.total);

  for (const m of MUTATIONS) {
    const abs = path.join(ROOT, m.file);
    const original = fs.readFileSync(abs);
    const originalText = original.toString('utf8');
    const mutatedText = originalText.replace(m.find, m.repl);
    if (mutatedText === originalText) {
      results.push({ id: m.id, ok: false, note: '变异未命中源码（find 字符串未找到）' });
      console.log('[!] ' + m.id + ' —— 变异未命中，需修正 find');
      continue;
    }

    // 登记 + 备份（在写入变异之前）
    const rec = writeBackup(m.file);
    dirtyFiles.set(m.file, rec);

    try {
      fs.writeFileSync(abs, mutatedText, 'utf8');

      /* —— 自证钩子（可用 MUTATION_SELFTEST_CRASH 触发）——
         在「变异已写入、尚未还原」这一最脆弱的时刻**模拟崩溃**，
         用于验证进程级钩子确实能自动还原源码。默认关闭。
           MUTATION_SELFTEST_CRASH=throw  → 在 try 内 throw（测 L1 finally 兜底）
           MUTATION_SELFTEST_CRASH=exit   → 直接 process.exit(9)（**跳过 finally**，
                                             只测 L2 进程钩子，这才是最狠的用例）
           MUTATION_SELFTEST_CRASH=kill   → 异步抛 reject（跳过 finally，走
                                             unhandledRejection 钩子）
         不影响正常使用。 */
      const crash = process.env.MUTATION_SELFTEST_CRASH;
      if (crash && !global.__selftestDone) {
        global.__selftestDone = true;
        if (crash === 'exit') {
          console.log('[selftest] 变异已写入 ' + m.file + '，立即 process.exit(9)（跳过 finally）');
          process.exit(9); // exit 钩子同步还原
        }
        if (crash === 'kill') {
          console.log('[selftest] 变异已写入 ' + m.file + '，触发未捕获 rejection（跳过 finally）');
          Promise.reject(new Error('SELFTEST_UNHANDLED_REJECTION'));
          await new Promise((r) => setTimeout(r, 50)); // 给钩子时间，然后进程自然退出
          process.exit(9);
        }
        // throw 模式：落在 finally 上
        console.log('[selftest] 变异已写入 ' + m.file + '，立即 throw（测 finally）');
        throw new Error('SELFTEST_INDUCED_CRASH');
      }

      const b = build();
      if (!b.ok) {
        results.push({ id: m.id, ok: false, note: '变异后构建失败：' + b.out.slice(0, 200) });
        console.log('[!] ' + m.id + ' —— 变异后构建失败');
        continue; // finally 会还原
      }

      /* 分支：几何实测门（gate:'geom-gantt'）——用专用 CDP 探针量版式与色值，而非 smoke 文本门。
         期望：变异后**几何/色值事实被破坏**（ok=false）→ 判「按预期变红」。
         ok = notStacked && widthsEqual && bandColorOk && bandRadiusOk && bandGapOk
              && tierFillOk && noOverflow —— 七条子断言各由一条变异守（M13~M16），
         故此处**必须报出「红由哪一条触发」**：这是 v0.4.3 那次「M13 名义上守 two 条、
         实际只由 leftDiff 判红」教训的直接后果。若 redBy 归因不到任何子断言，
         说明该变异红了但**不是几何门红了**（红得不明不白），一样按失败处理。 */
      if (m.gate === 'geom-gantt') {
        const gm = geomGantt();
        const failed = [
          ['notStacked', 'notStacked=false（栅格塌陷，任务列不再更宽）'],
          ['widthsEqual', 'widthsEqual=false（8 周列宽度比越出 ≤8%）'],
          ['bandColorOk', 'bandColorOk=false（色带填充色 ≠ c.brand）'],
          ['bandRadiusOk', 'bandRadiusOk=false（圆角不在色带两端）'],
          ['bandGapOk', 'bandGapOk=false（相邻格之间有缝，色带被切开）'],
          ['tierFillOk', 'tierFillOk=false（档位填充色与计数不符）'],
          ['noOverflow', 'noOverflow=false（页面本体横向溢出）'],
        ].filter(([k]) => gm[k] === false).map(([, t]) => t);
        const redBy = failed.length ? failed.join(' + ') : '(未归因——红了但没有子断言为 false，红得不明不白)';
        if (gm.ok === false && failed.length > 0) {
          results.push({ id: m.id, ok: true, note: '按预期变红（几何实测）· 红由 ' + redBy, total: 'geom ' + gm.verdict });
          console.log('[OK] ' + m.id + ' → 几何断言变红 ✓   红由 ' + redBy + '   (' + gm.verdict + ')');
        } else if (gm.ok === false) {
          results.push({ id: m.id, ok: false, note: '几何断言变红但无法归因到任何子断言', total: 'geom ' + gm.verdict });
          console.log('[!!] ' + m.id + ' → 变红但未归因 ✗   (' + gm.verdict + ')');
        } else {
          results.push({ id: m.id, ok: false, note: '几何断言未变红（空转风险！）', total: 'geom ' + gm.verdict });
          console.log('[!!] ' + m.id + ' → 几何断言未变红 ✗   (' + gm.verdict + ')');
        }
        continue; // finally 会还原
      }

      const out = smoke();
      const lines = out.out.replace(/\r/g, '').split('\n');
      const hit = lines.find((l) => l.startsWith('FAIL') && l.includes(m.expectRed));
      if (hit) {
        results.push({ id: m.id, ok: true, note: '按预期变红', total: out.total });
        console.log('[OK] ' + m.id + ' → 断言变红 ✓   (' + out.total + ')');
      } else {
        results.push({ id: m.id, ok: false, note: '断言未变红（空转风险！）', total: out.total });
        console.log('[!!] ' + m.id + ' → 断言未变红 ✗   (' + out.total + ')');
      }
    } finally {
      // L1：还原并校验；校验通过才从 dirtyFiles 注销（restoreAllSync 内部已做）
      const failed = restoreAllSync('finally');
      if (failed && failed.indexOf(m.file) !== -1) {
        console.log('[!] ' + m.id + ' —— finally 还原失败，留待进程钩子重试');
      }
      // 记录还原是否干净（供后续断言）
      if (dirtyFiles.has(m.file)) {
        results.push({ id: m.id + ' (restore)', ok: false, note: '还原未完成，源码仍处变异态' });
      }
    }
  }

  console.log('\n[i] 最终干净构建…');
  build();
  const finalS = smoke();
  console.log('[i] 还原后：' + finalS.total);

  // 收尾：校验所有目标文件都回到基线
  const drift = [];
  for (const [rel, expected] of Object.entries(TARGETS)) {
    const abs = path.join(ROOT, rel);
    const actual = fs.existsSync(abs) ? sha256File(abs) : '(缺失)';
    if (actual !== expected) drift.push(rel + ' 期望=' + expected + ' 实际=' + actual);
  }

  console.log('\n================ 变异自证汇总 ================');
  for (const r of results) {
    console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  —— ' + r.note + '  ' + (r.total || ''));
  }
  console.log('\n变异 ' + results.length + ' 个，自证通过 ' + results.filter((r) => r.ok).length + '，未通过 ' + results.filter((r) => !r.ok).length);
  if (drift.length) {
    console.log('\n❌ 收尾 sha 漂移（源码未回到基线）：\n  ' + drift.join('\n  '));
  } else {
    console.log('✅ 收尾校验：全部目标文件 sha256 = 基线，工作树洁净。');
  }

  const bad = results.filter((r) => !r.ok).length + drift.length;
  // 正常结束：清理锁与残留备份目录（dirtyFiles 此时应为空）
  try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch (_) {}
  try { if (fs.existsSync(BACKUP_DIR) && fs.readdirSync(BACKUP_DIR).length === 0) fs.rmdirSync(BACKUP_DIR); } catch (_) {}
  process.exitCode = bad ? 1 : 0;
}

main().catch((e) => {
  try { process.stderr.write('[fatal] ' + (e && e.stack ? e.stack : e) + '\n'); } catch (_) {}
  hookRestore('fatal', 1);
  process.exit(1);
});
