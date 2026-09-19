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
 *   因此：**只要你有意修改了这 5 个源文件中的任意一个，就必须重跑
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
 * 运行：node tests/mutation.cjs                 （跑全量变异自证）
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

/* --print-sha：打印被变异文件的当前 sha256，便于在**有意**修改源文件后重建基线。
   只读，不写任何文件。用法见文件头「基线维护」。 */
if (process.argv.includes('--print-sha')) {
  const crypto0 = require('crypto');
  const list = [
    'src/pages/Workspace.jsx',
    'src/pages/DemandNew.jsx',
    'src/data/mock.js',
    'src/global.css',
    'src/components/demand/ScaleChips.jsx',
    'src/components/demand/BrdAssistantCard.jsx',
  ];
  for (const rel of list) {
    const abs0 = path.join(ROOT, rel);
    const h = crypto0.createHash('sha256').update(require('fs').readFileSync(abs0)).digest('hex').toUpperCase();
    console.log("  '" + rel + "': '" + h + "',");
  }
  process.exit(0);
}

/* ------------------------------------------------------------------ *
 * 被变异文件清单 + 已知 good 的 sha256 基线
 * ------------------------------------------------------------------
 * 这份基线是「洁净工作树」的确定性锚点：只有全部一致才允许开跑。
 * 若你**有意**修改了这些源文件，必须同步更新此处 sha，否则脚本会拒绝启动
 * （这正是设计意图：强制显式确认，避免在不知情的脏树上做变异）。
 * 更新方式：跑 `node tests/mutation.cjs --print-sha`，把输出行原样粘到下面。
 * ------------------------------------------------------------------ */
const TARGETS = {
  'src/pages/Workspace.jsx': 'C20F4CA5976D082192F977BB0B29B3D7CE8413BA26B7611D13901D00B0CEECC1',
  'src/pages/DemandNew.jsx': '135AB61F269C16D291AEC7A56F3851B409492FCCFB63C06BE181FD7CBE4CF8A5',
  'src/data/mock.js': 'B375CB23F13BE6E98EBFF148986B83F6B21F194BE9080E783D8A34FC883735A8',
  'src/global.css': '2074979CC4A6E8FB9DCB982D7C3C7B3F30A62115C4C268258ACA8EBEE3E4B33D',
  'src/components/demand/ScaleChips.jsx': 'B63C695F6A21AD633E7EF7B52025E03C41AD5971661C2C488CA202D87A2BECF1',
  'src/components/demand/BrdAssistantCard.jsx': 'CFDCEBC83DDADDF331DC748AB07256B28E6803F9E431D859E69C187C2A7BC2E6',
};

/* 每个变异：file + 精确 find/replace + 期望变红的断言子串 */
const MUTATIONS = [
  {
    id: 'M1 P0-1 内联 display 回归',
    file: 'src/pages/DemandNew.jsx',
    find: '<div className="dp-demand-side">',
    repl: '<div className="dp-demand-side" style={{ display: \'flex\', flexDirection: \'column\', gap: 16 }}>',
    expectRed: 'P0-1 右栏容器无内联 display',
  },
  {
    id: 'M2 P0-1 ≤900 顺序规则删除',
    file: 'src/global.css',
    find: '  .dp-demand-promise {\n    order: 1;\n  }\n',
    repl: '',
    expectRed: 'P0-1 ≤900px 媒体块完整', // 变异后 orderHits<4，走 fail 分支
  },
  {
    id: 'M3 P0-2 「说不清」chip 文案删除',
    file: 'src/data/mock.js',
    find: "{ value: DEMAND_UNSURE, label: '说不清，帮我定位' },",
    repl: "{ value: DEMAND_UNSURE, label: '系统不详' },",
    expectRed: '涉及系统含「说不清，帮我定位」合法选项',
  },
  {
    id: 'M4 P1-2 三态提示退化为二态',
    file: 'src/pages/DemandNew.jsx',
    find: "    hint: i.state === 'full' ? i.fullHint : i.state === 'partial' ? i.partialHint : i.emptyHint || i.partialHint,",
    repl: "    hint: i.state === 'full' ? i.fullHint : i.state === 'partial' ? i.partialHint : i.partialHint,",
    expectRed: 'P1-2 未填「验收标准」用独立 emptyHint',
  },
  {
    id: 'M5 P2-2 去掉鼠标焦点抑制',
    file: 'src/components/demand/ScaleChips.jsx',
    find: '        setFocused(!pointer.current);',
    repl: '        setFocused(true);',
    expectRed: 'P2-2 胶囊焦点环行为', // 变异后 mouse 也变 2px，走 fail 分支
  },
  {
    id: 'M6 保留建议：点 chip 时清空 pending',
    file: 'src/components/demand/BrdAssistantCard.jsx',
    find: "    setMessages((m) => [...m, { role: 'user', text: p }, { role: 'agent', text: hit ? hit.text : brdAgentIntro }]);",
    repl: "    setMessages((m) => [...m.filter((x) => !x.pending), { role: 'user', text: p }, { role: 'agent', text: hit ? hit.text : brdAgentIntro }]);",
    expectRed: '点快捷问题后保留 agent 建议',
  },
];

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
  return { out, pass: total[2] ? Number(total[2]) : null, fail: total[3] ? Number(total[3]) : null, total: total[0] || '(no total)' };
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
  if (s0.fail === null || s0.fail !== 0) {
    console.error('❌ 基线 smoke 未全绿（' + s0.total + '），工作树可能已被污染，拒绝启动。');
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
