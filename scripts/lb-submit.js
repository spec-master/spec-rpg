/* GitHub Actions: '[score]' 이슈 → 저장 코드 재검증 → data/leaderboard.json 갱신
 * 입력은 이벤트 JSON 파일(GITHUB_EVENT_PATH)에서만 읽음 (셸 인젝션 방지). */
const fs = require("fs");
const path = require("path");
const SC = require("../js/savecode.js");
const SPEC = require("../js/ltssm.js"); // data.js + LTSSM 문제/규칙
const LB = path.join(__dirname, "..", "data", "leaderboard.json");
const OUT = process.env.RESULT_FILE || "/tmp/lb-result.md";
const RATE_MS = 10 * 60 * 1000, MAX_ENTRIES = 500;

(async () => {
  const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const issue = ev.issue, user = issue.user.login, body = issue.body || "";
  const say = (ok, msg) => { fs.writeFileSync(OUT, (ok ? "✅ " : "❌ ") + msg + "\n\n_자동 처리된 이슈입니다. 랭킹: 게임 메뉴 → 랭킹 보기_"); process.exitCode = 0; };
  try {
    if (issue.user.type !== "User") return say(false, "사람 계정만 제출할 수 있습니다.");
    const nickM = body.match(/^nick:\s*(.+)$/m), codeM = body.match(/^code:\s*(SPEC1\.[A-Za-z0-9_-]+)\s*$/m);
    if (!nickM || !codeM) return say(false, "제출 형식이 올바르지 않습니다 (nick/code 줄이 필요).");
    const nick = SC.cleanNick(nickM[1]);
    if (!SC.validNick(nick)) return say(false, "닉네임은 2~12자의 한글/영문/숫자/_/- 만 가능합니다.");
    if (codeM[1].length > 20000) return say(false, "저장 코드가 너무 깁니다.");
    const st = SC.migrate(await SC.decode(codeM[1]), SPEC).P;
    const errs = SC.validate(st, SPEC);
    const m = SC.computeScore(st);
    // 간단한 상식 점검 (치트 방지 기본선)
    if (m.answered < 5) errs.push("5문제 이상 풀어야 합니다");
    if ((st.playMs || 0) < m.answered * 3000) errs.push("플레이 시간에 비해 답한 문제가 너무 많습니다");
    if (m.correct > 20000 || m.score > 1e6) errs.push("점수 범위 초과");
    if (errs.length) return say(false, "저장 코드 검증 실패: " + errs.join(", "));

    const board = JSON.parse(fs.readFileSync(LB, "utf8"));
    board.entries = board.entries || [];
    const prev = board.entries.find((e) => e.user === user);
    if (prev && Date.now() - Date.parse(prev.at) < RATE_MS) return say(false, "10분에 한 번만 제출할 수 있습니다.");
    const taken = board.entries.find((e) => e.nick === nick && e.user !== user);
    if (taken) return say(false, `닉네임 '${nick}'은(는) 이미 다른 사용자가 쓰고 있습니다.`);
    const entry = { user, nick, score: m.score, lv: m.lv, badges: m.badges, sbadges: m.sbadges, rules: m.rules, concepts: m.concepts, correct: m.correct, answered: m.answered, acc: Math.round(m.acc * 1000) / 1000, playMin: m.playMin, at: new Date().toISOString() };
    let note = "";
    if (prev && prev.score > entry.score) { prev.nick = nick; prev.at = entry.at; note = ` (기존 최고점 ${prev.score}점 유지)`; }
    else if (prev) Object.assign(prev, entry); else board.entries.push(entry);
    board.entries.sort((a, b) => b.score - a.score);
    board.entries = board.entries.slice(0, MAX_ENTRIES);
    board.updated = new Date().toISOString(); board.version = 1;
    fs.writeFileSync(LB, JSON.stringify(board, null, 1) + "\n");
    const rank = board.entries.findIndex((e) => e.user === user) + 1;
    say(true, `${nick} 님 ${m.score}점 등록! 현재 ${rank}위 / ${board.entries.length}명${note}\nLv${m.lv} · 관장 배지 ${m.badges} · state 배지 ${m.sbadges} · 규칙 ${m.rules} · 정답 ${m.correct}/${m.answered}`);
    fs.writeFileSync("/tmp/lb-changed", "1");
  } catch (e) { say(false, "처리 중 오류: " + (e.message || e)); }
})();
