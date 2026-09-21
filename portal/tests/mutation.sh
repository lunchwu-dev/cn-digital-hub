#!/usr/bin/env bash
# =============================================================================
# tests/mutation.sh —— 变异自证（Bash 编排器）
# =============================================================================
# 背景：原 tests/mutation.cjs 是「一个 node 进程在内部 spawnSync 子进程当编排器」。
#   本机存在关键不对称性 ——「Bash 工具 → node.exe」可以，但「node 进程内 spawn 任意子进程」
#   返回 EBUSY（status=null）。故 build() 与 _geom_gantt 的 Chrome 启动全部卡死，
#   mutation.cjs 在本机**不可能跑起来**。修复方式：把「编排层」从 node 内搬到 Bash。
#
# 流程（与旧脚本逐条等价）：
#   0. 先由 Bash 起 headless Chrome（供 geom 门用），临时 user-data-dir
#   1. node tests/_mut_snapshot.cjs            （快照工作树基线 → tests/.mutbase/）
#   2. 干净基线构建 + 基线 smoke               （基线不全绿 → 拒绝启动）
#   3. for 每条变异（_mutations.data.cjs 顺序）：
#        node tests/_mut_apply.cjs <id>                 （失败即中止）
#        node node_modules/vite/bin/vite.js build       （Bash 直接起，已验证可行）
#        gate=='geom-gantt' ? node tests/_geom_gantt_nospawn.cjs : node tests/smoke.cjs
#        node tests/_mut_restore.cjs <id>
#        判定变红 → 打印 [OK]/[!!]
#   4. 干净重建 + smoke，逐个比对 4…（实为全部 TARGETS 键）目标文件 sha256 与 TARGETS 基线
#       打印 `变异 N 个，自证通过 X，未通过 Y` 与 ✅/❌ 收尾行
#   退出码：有未通过 或 sha 漂移 → 非 0
#
# 用法：bash tests/mutation.sh
#   环境变量：NODE_BIN / NODE_PATH / DP_CHROME / DP_GEOM_PORT / MUT_ONLY
#     MUT_ONLY —— 空格分隔的变异编号（按 id 的首个词精确匹配，如 "M13 M14"），
#       **只跑指定几条**。用途：整跑 25 条耗时较长，本机宿主会在 ~13 分钟处回收进程
#       （实测整跑在 M20 被 SIGKILL，退出码 137，且还原 trap 未执行、源码留在变异态）。
#       分块跑即可绕开；收尾的 sha256 校验仍然针对**全部** TARGETS，不受过滤影响。
# =============================================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

NODE="${NODE_BIN:-C:/Users/uuzz/.workbuddy/binaries/node/versions/22.22.2-3/node.exe}"
export NODE_PATH="${NODE_PATH:-C:/Users/uuzz/.workbuddy/binaries/node/workspace/node_modules}"
VITE="node_modules/vite/bin/vite.js"
GEOM_PORT="${DP_GEOM_PORT:-9346}"
CHROME="${DP_CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
BASE="$ROOT/tests/.mutbase"
LOCK="$ROOT/tests/.mutation.lock"

CHROME_PID=""
NORMAL=0
TMPD="$(mktemp -d)"
CHROME_PROFILE="$TMPD/chrome-profile"

restore_all() { "$NODE" tests/_mut_restore.cjs all >/dev/null 2>&1 || true; }

cleanup() {
  local code=$?
  if [ "$NORMAL" != "1" ]; then
    echo "[cleanup] 异常退出，同步还原全部目标文件…"
    restore_all
  fi
  if [ -n "$CHROME_PID" ]; then kill "$CHROME_PID" 2>/dev/null || true; fi
  rm -f "$LOCK" 2>/dev/null || true
  if [ "$NORMAL" = "1" ]; then rm -rf "$BASE" 2>/dev/null || true; fi
  rm -rf "$TMPD" 2>/dev/null || true
  exit "$code"
}
trap cleanup EXIT

# ── 并发互斥锁（与旧脚本等价）────────────────────────────────────────────────
if [ -f "$LOCK" ]; then
  oldpid="$(cat "$LOCK" 2>/dev/null || true)"
  if [ -n "$oldpid" ] && kill -0 "$oldpid" 2>/dev/null; then
    echo "工作树被另一个 mutation 进程占用（pid=$oldpid），拒绝启动（不可并行）。"
    exit 1
  fi
  rm -f "$LOCK"
fi
echo $$ > "$LOCK"

# ── 0) 起 Chrome（供 geom 门；无 spawn 版探针假定它已在监听）─────────────────
if [ -f "$CHROME" ]; then
  "$CHROME" --headless=new --remote-debugging-port="$GEOM_PORT" --user-data-dir="$CHROME_PROFILE" \
    --no-first-run --no-default-browser-check --disable-gpu --hide-scrollbars \
    --allow-file-access-from-files about:blank >/dev/null 2>&1 &
  CHROME_PID=$!
  for _ in $(seq 1 60); do
    if "$NODE" -e 'const p=Number(process.env.DP_GEOM_PORT||9346);require("http").get({host:"127.0.0.1",port:p,path:"/json/version"},r=>{r.resume();process.exit(0)}).on("error",()=>process.exit(1))' 2>/dev/null; then
      break
    fi
    sleep 0.25
  done
  echo "[i] Chrome 已启动 pid=$CHROME_PID  port=$GEOM_PORT"
else
  echo "⚠️ 未找到 Chrome：$CHROME —— geom 门将连不上（会被判 [!!]）。可用 DP_CHROME 覆盖。"
fi

# ── 1) 快照工作树基线 ────────────────────────────────────────────────────────
if ! "$NODE" tests/_mut_snapshot.cjs; then
  echo "❌ 快照失败，拒绝启动。"
  exit 1
fi

# ── 2) 基线构建 + 基线 smoke（不全绿即拒绝启动）──────────────────────────────
# ★★★ 为什么三处构建都带 `--emptyOutDir=false`（首轮实测踩过的坑，别再改回去）★★★
#   本机沙箱注入了 safe-delete shim，它**按「turn」累计**统计删除条目数，超过 50 就抛
#     [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":53,"threshold":50,...}
#   而 vite build 默认 emptyOutDir=true，每次构建都会删掉 dist/assets 下的 4 个产物；
#   22 条变异 × 4 ≈ 88 次删除 → 累计越过 50 之后**每一条构建都被拒**。
#   症状极具误导性：M1–M3 正常变红，M4 起连续「变异后构建失败」，收尾构建也失败 ——
#   看起来像变异把代码改坏了，实际是删除计数被限流（构建立刻在 prepareOutDir 抛错）。
#   关掉 emptyOutDir 是安全的：本项目所有产物文件名都是**固定名**
#   （index.js / style.css / roboto-*.woff2，无内容 hash），不会产生陈旧残留。
#   交付前若要真正的干净构建，请在**新的 turn**里单独 `rm -rf dist && vite build`
#   （一次 turn 内删 dist 全量约 5 条，远低于阈值）。
echo "[i] 基线构建…"
if ! "$NODE" "$VITE" build --emptyOutDir=false > "$TMPD/base_build.txt" 2>&1; then
  echo "❌ 基线构建失败，拒绝启动。"
  tail -20 "$TMPD/base_build.txt"
  exit 1
fi
"$NODE" tests/smoke.cjs > "$TMPD/base_smoke.txt" 2>&1 || true
base_sum="$(grep -E '合计 [0-9]+ 项断言，通过 [0-9]+，失败 [0-9]+' "$TMPD/base_smoke.txt" | tail -1 || true)"
if [ -z "$base_sum" ]; then
  echo "❌ 基线 smoke 未能启动 (no total)。"
  tail -20 "$TMPD/base_smoke.txt"
  exit 1
fi
base_fail="$(printf '%s' "$base_sum" | sed -E 's/.*失败 ([0-9]+).*/\1/')"
if [ "$base_fail" != "0" ]; then
  echo "❌ 基线 smoke 未全绿，拒绝启动（$base_sum）。"
  grep '^FAIL' "$TMPD/base_smoke.txt" | head -12 || true
  exit 1
fi
echo "[i] 基线洁净：$base_sum"

# ── 3) 逐条变异（严格串行）───────────────────────────────────────────────────
TOTAL=0; PASS=0; FAILN=0
SUMMARY="$TMPD/summary.txt"; : > "$SUMMARY"

while IFS=$'\t' read -r id file gate expectRed; do
  [ -z "$id" ] && continue
  TOTAL=$((TOTAL + 1))
  echo ""
  echo "—— [$TOTAL] $id ($file) gate=${gate:-smoke} ——"

  if ! "$NODE" tests/_mut_apply.cjs "$id"; then
    echo "[!] $id —— apply 失败，中止。"
    exit 1
  fi

  if ! "$NODE" "$VITE" build --emptyOutDir=false > "$TMPD/mut_build.txt" 2>&1; then
    echo "[!] $id —— 变异后构建失败"
    # ★ 必须把构建输出打出来：$TMPD 在退出时被清理，只报「构建失败」等于把根因丢掉。
    #   首轮实测就栽在这里 —— M4 起连续失败，日志里却只有一句「变异后构建失败」。
    echo "      ┌─ 构建输出尾部（$TMPD/mut_build.txt）"
    tail -25 "$TMPD/mut_build.txt" | sed 's/^/      │ /'
    echo "      └─"
    "$NODE" tests/_mut_restore.cjs "$id" >/dev/null 2>&1 || true
    FAILN=$((FAILN + 1))
    printf 'FAIL  %s  —— 变异后构建失败\n' "$id" >> "$SUMMARY"
    continue
  fi

  if [ "$gate" = "geom-gantt" ]; then
    set +e
    "$NODE" tests/_geom_gantt_nospawn.cjs > "$TMPD/geom.txt" 2>&1
    set -e
    line="$("$NODE" -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");const m=s.match(/GEOM_JSON=(\{.*\})/);if(!m){console.log("NOJSON\t\t");process.exit(0);}let j;try{j=JSON.parse(m[1]);}catch(e){console.log("BADJSON\t\t");process.exit(0);}const subs=["notStacked","widthsEqual","bandColorOk","bandRadiusOk","bandGapOk","tierFillOk","noOverflow"].filter(k=>j[k]===false);console.log((j.ok?"OK":"RED")+"\t"+subs.join(",")+"\t"+j.verdict);' "$TMPD/geom.txt")"
    IFS=$'\t' read -r st subs verdict <<< "$line"
    if [ "$st" = "RED" ] && [ -n "$subs" ]; then
      echo "[OK] $id → 几何断言变红 ✓   红由 $subs   ($verdict)"
      PASS=$((PASS + 1))
      printf 'PASS  %s  —— 按预期变红（几何实测）· 红由 %s  %s\n' "$id" "$subs" "geom $verdict" >> "$SUMMARY"
    else
      echo "[!!] $id → 几何断言未变红 ✗   ($verdict)"
      FAILN=$((FAILN + 1))
      printf 'FAIL  %s  —— 几何断言未变红（空转风险！）  %s\n' "$id" "geom $verdict" >> "$SUMMARY"
    fi
  else
    "$NODE" tests/smoke.cjs > "$TMPD/mut_smoke.txt" 2>&1 || true
    msum="$(grep -E '合计 [0-9]+ 项断言，通过 [0-9]+，失败 [0-9]+' "$TMPD/mut_smoke.txt" | tail -1 || true)"
    # ★ 无汇总行 = 这次 smoke **根本没跑起来**（崩溃 / 被宿主回收），**不等于断言没变红**。
    #   把两者混为一谈，就是把「测试自身崩了」误报成「空转断言」——本项目最忌讳的误归因。
    #   实测教训：单次整跑 25 条时，M7 曾出现 `(no total)` 并被记成「未变红 ✗」，
    #   而同一批里 M8~M19 全部正常 —— 说明那是运行期故障，不是断言失效。
    #   故：重试一次；仍无汇总行，就明确记「smoke 未跑起来（结论未知）」，不得写成「未变红」。
    if [ -z "$msum" ]; then
      echo "      ⚠ smoke 未产出汇总行 → 重试一次（常见诱因：资源紧张 / 进程被宿主回收）"
      sleep 3
      "$NODE" tests/smoke.cjs > "$TMPD/mut_smoke_retry.txt" 2>&1 || true
      msum="$(grep -E '合计 [0-9]+ 项断言，通过 [0-9]+，失败 [0-9]+' "$TMPD/mut_smoke_retry.txt" | tail -1 || true)"
      if [ -n "$msum" ]; then cp -f "$TMPD/mut_smoke_retry.txt" "$TMPD/mut_smoke.txt"; fi
    fi
    mfail="$(printf '%s' "$msum" | sed -E 's/.*失败 ([0-9]+).*/\1/')"
    if [ -n "$msum" ] && [ "$mfail" != "0" ] && grep -qF "$expectRed" <(grep '^FAIL' "$TMPD/mut_smoke.txt"); then
      echo "[OK] $id → 断言变红 ✓   ($msum)"
      PASS=$((PASS + 1))
      printf 'PASS  %s  —— 按预期变红  %s\n' "$id" "$msum" >> "$SUMMARY"
    elif [ -z "$msum" ]; then
      echo "[!!] $id → smoke 未跑起来（重试后仍无汇总行）—— 结论未知，不得记为「未变红」"
      FAILN=$((FAILN + 1))
      printf 'FAIL  %s  —— smoke 未跑起来（重试后仍无汇总行）→ 结论未知\n' "$id" >> "$SUMMARY"
    else
      echo "[!!] $id → 断言未变红 ✗   ($msum)"
      FAILN=$((FAILN + 1))
      printf 'FAIL  %s  —— 断言未变红（空转风险！）  %s\n' "$id" "$msum" >> "$SUMMARY"
    fi
  fi

  "$NODE" tests/_mut_restore.cjs "$id" >/dev/null 2>&1 || true
  if ! cmp -s "$ROOT/$file" "$BASE/$(basename "$file")"; then
    echo "[!] $id —— 还原后与快照不一致（cmp 失败），中止。"
    exit 1
  fi
done < <("$NODE" -e 'const {MUTATIONS}=require("./tests/_mutations.data.cjs");const only=(process.env.MUT_ONLY||"").split(/\s+/).filter(Boolean);const sel=only.length?MUTATIONS.filter(m=>only.includes(m.id.split(" ")[0])):MUTATIONS;for(const m of sel)process.stdout.write([m.id,m.file,m.gate||"",m.expectRed].join("\t")+"\n")')

# ── 4) 收尾：干净重建 + smoke + 还原完整性 + sha 校验 ─────────────────────────
echo ""
echo "[i] 最终干净构建…"
if ! "$NODE" "$VITE" build --emptyOutDir=false > "$TMPD/final_build.txt" 2>&1; then
  echo "❌ 最终构建失败。"
  tail -20 "$TMPD/final_build.txt"
  exit 1
fi
"$NODE" tests/smoke.cjs > "$TMPD/final_smoke.txt" 2>&1 || true
fin_sum="$(grep -E '合计 [0-9]+ 项断言，通过 [0-9]+，失败 [0-9]+' "$TMPD/final_smoke.txt" | tail -1 || true)"
echo "[i] 还原后：${fin_sum:-no total}"

# 还原完整性：工作树 vs 运行前快照（证明「本脚本没污染」）
snap_drift=0
while IFS=$'\t' read -r rel name; do
  if ! cmp -s "$ROOT/$rel" "$BASE/$name"; then
    echo "  [污染] $rel 与运行前快照不一致"
    snap_drift=1
  fi
done < <("$NODE" -e 'const fs=require("fs"),path=require("path");const {TARGETS,MUTATIONS}=require("./tests/_mutations.data.cjs");const all=[...new Set([...Object.keys(TARGETS),...MUTATIONS.map(m=>m.file)])];for(const rel of all)process.stdout.write(rel+"\t"+path.basename(rel)+"\n")')

echo ""
echo "================ 变异自证汇总 ================"
cat "$SUMMARY"
echo ""
echo "变异 $TOTAL 个，自证通过 $PASS，未通过 $FAILN"

# sha 校验：逐文件对比 TARGETS 硬基线
"$NODE" -e 'const fs=require("fs"),path=require("path"),crypto=require("crypto");const {TARGETS}=require("./tests/_mutations.data.cjs");const ROOT=process.cwd();const drift=[];for(const rel of Object.keys(TARGETS)){const abs=path.join(ROOT,rel);const act=fs.existsSync(abs)?crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex").toUpperCase():"(缺失)";if(act!==TARGETS[rel])drift.push(rel+" 期望="+TARGETS[rel]+" 实际="+act);}if(drift.length){console.log("\n❌ 收尾 sha 漂移（源码未回到基线）：\n  "+drift.join("\n  "));process.exit(3);}console.log("✅ 收尾校验：全部目标文件 sha256 = 基线，工作树洁净。");process.exit(0);'
sha_rc=$?

# 正常完成：仅在「工作树 == 快照」时才让 cleanup 删除 .mutbase
if [ "$snap_drift" = "0" ]; then NORMAL=1; fi

echo ""
if [ "$FAILN" != "0" ] || [ "$sha_rc" != "0" ] || [ "$snap_drift" != "0" ]; then
  echo "[结果] 存在未通过或漂移 → 退出码 1"
  exit 1
fi
echo "[结果] 全部通过 → 退出码 0"
exit 0
