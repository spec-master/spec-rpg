/* =========================================================
 * 저장 코드 내보내기/불러오기 + 랭킹(리더보드)
 * 랭킹 백엔드는 어댑터로 교체 가능 (LB_ADAPTERS)
 *  - github-issues: 플레이어가 GitHub 이슈로 제출 → GitHub Actions가 검증 후
 *    data/leaderboard.json 갱신. 클라이언트에 토큰/비밀값 없음.
 * ========================================================= */
(function () {
  "use strict";
  const G = window.G, S = window.SPEC, SC = window.SaveCode;
  const t = (ko, en) => (G.lang === "en" ? en : ko);
  const ERR_EN = {"이 브라우저는 압축 해제를 지원하지 않습니다 (iOS 16.4 이상 필요).": "This browser cannot decompress the code (iOS 16.4+ needed).", "지원하지 않는 저장 코드 버전입니다.": "Unsupported save code version.", "SPEC1. 으로 시작하는 저장 코드가 아닙니다.": "Not a save code starting with SPEC1.", "코드에 잘못된 문자가 있습니다.": "The code has invalid characters.", "코드가 너무 짧습니다(잘렸을 수 있음).": "The code is too short (it may be cut off).", "코드가 손상되었습니다(압축 해제 실패).": "The code is damaged (decompression failed).", "체크섬 불일치: 코드가 잘리거나 바뀌었습니다.": "Checksum mismatch: the code was cut off or changed.", "코드 내용을 읽을 수 없습니다.": "Cannot read the code contents.", "레벨 범위 오류": "level out of range", "경험치 범위 오류": "XP out of range", "HP 범위 오류": "HP out of range", "위치 오류": "bad position", "방향 오류": "bad direction", "LTSSM 상태 오류": "bad LTSSM state", "Gen/폭 오류": "bad Gen/width", "챕터 오류": "bad chapter", "배지 오류": "bad badges", "배지 순서 오류": "badge order mismatch", "배지-LTSSM 불일치": "badge/LTSSM mismatch", "기술 오류": "bad moves", "아이템 오류": "bad items", "플레이 시간 오류": "bad play time", "알 수 없는 기술": "unknown move", "알 수 없는 개념": "unknown concept", "알 수 없는 아이템": "unknown item", "알 수 없는 문제": "unknown question", "state 배지 오류": "bad state badges", "규칙 기록 오류": "bad rule records", "배지-규칙 불일치": "badge/rule mismatch", "업적 오류": "bad achievements", "몬스터 기록 오류": "bad monster records", "통계 오류": "bad stats", "문제 기록 오류": "bad question records", "알 수 없는 맵": "unknown map"};
  const te = (m) => (G.lang === "en" ? ERR_EN[m] || m : m); // savecode.js 메시지는 서버 검증과 공유 → 표시할 때만 번역
  const LOC = () => (G.lang === "en" ? "en-US" : "ko-KR");
  const $ = (id) => document.getElementById(id);
  const elText = $("ctext"), elList = $("clist"), elName = $("cname");
  const NICK_KEY = "specrpg_nick", LAST_SUBMIT_KEY = "specrpg_last_submit", RATE_MS = 10 * 60 * 1000;

  /* ---------------- 공통 폼 UI ---------------- */
  function el(tag, attrs = {}, text) { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => (k === "class" ? (e.className = v) : e.setAttribute(k, v))); if (text != null) e.textContent = text; return e; }
  /* form: {title, msg, field:{type:'textarea'|'input', value, readonly, placeholder, maxlength}, buttons:[{label, value, href, primary}]} → {value, text} */
  function form(o) {
    return new Promise((resolve) => {
      G.clearConsole(); elName.textContent = o.title || "";
      if (o.msg) elText.textContent = o.msg;
      const wrap = el("div", { class: "form nogo" });
      let fld = null;
      if (o.field) {
        fld = el(o.field.type === "input" ? "input" : "textarea", { class: "fld", spellcheck: "false", autocomplete: "off", autocapitalize: "off" });
        if (o.field.placeholder) fld.placeholder = o.field.placeholder;
        if (o.field.maxlength) fld.maxLength = o.field.maxlength;
        if (o.field.readonly) fld.readOnly = true;
        fld.value = o.field.value || ""; wrap.appendChild(fld);
      }
      const row = el("div", { class: "btnrow" });
      const finish = (v) => { G.setHandler(null); resolve({ value: v, text: fld ? fld.value : "" }); };
      (o.buttons || []).forEach((b) => {
        const btn = b.href ? el("a", { class: "fbtn" + (b.primary ? " pri" : ""), href: b.href, target: "_blank", rel: "noopener" }, b.label) : el("button", { class: "fbtn" + (b.primary ? " pri" : ""), type: "button" }, b.label);
        btn.addEventListener("click", (e) => { if (b.onClick) { b.onClick(e, fld, btn); return; } if (!b.href) e.preventDefault(); finish(b.value); });
        row.appendChild(btn);
      });
      wrap.appendChild(row); elList.appendChild(wrap);
      if (fld && !o.field.readonly) setTimeout(() => fld.focus(), 50);
      if (fld && o.field.readonly) { fld.addEventListener("focus", () => fld.select()); }
      G.setHandler((b) => { if (b === "B" || b === "START") finish(null); });
    });
  }
  G.form = form;
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
    try { const ta = el("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (e) { return false; }
  }
  const fmtTime = (ms) => { const m = Math.floor((ms || 0) / 60000); return m >= 60 ? t(`${Math.floor(m / 60)}시간 ${m % 60}분`, `${Math.floor(m / 60)}h ${m % 60}m`) : t(`${m}분`, `${m}m`); };
  const shareURL = (code) => location.href.split("#")[0] + "#save=" + code;

  /* ---------------- 내보내기 ---------------- */
  async function exportCode() {
    G.save();
    const code = await SC.encode(G.P());
    const copyBtn = (label, getText) => ({ label, onClick: async (e, fld, btn) => { e.preventDefault(); const ok = await copyText(getText()); btn.textContent = ok ? t("복사됨 ✓", "Copied ✓") : t("길게 눌러 직접 복사", "Long-press to copy"); setTimeout(() => (btn.textContent = label), 1500); } });
    await form({ title: t("저장 코드 내보내기", "Export save code"), msg: t(`다른 기기에서 '저장 코드 불러오기'에 붙여넣으세요. (${code.length}자, 체크섬 포함 · 서버 저장 없음)`, `Paste this into 'Import save code' on another device. (${code.length} chars, with checksum · nothing stored on a server)`),
      field: { type: "textarea", value: code, readonly: true },
      buttons: [copyBtn(t("코드 복사", "Copy code"), () => code), copyBtn(t("공유 링크 복사", "Copy share link"), () => shareURL(code)), { label: t("닫기", "Close"), value: "close" }] });
  }

  /* ---------------- 불러오기 ---------------- */
  async function applyCode(code) {
    let st;
    try { st = await SC.decode(code); } catch (e) { await G.say(t("⚠️ 불러오기 실패: ", "⚠️ Import failed: ") + te(e.message)); return false; }
    const mig = SC.migrate(st, S); st = mig.P;
    const errs = SC.validate(st, S);
    if (!G.maps[st.map]) errs.push(t("알 수 없는 맵", "unknown map"));
    if (errs.length) { await G.say(t("⚠️ 저장 코드 검증 실패: ", "⚠️ Save code check failed: ") + errs.slice(0, 3).map(te).join(", ")); return false; }
    const sc = SC.computeScore(st);
    const k = await G.choose([t("덮어쓰기", "Overwrite"), t("취소", "Cancel")], { header: t("저장 코드 확인 ✓", "Save code OK ✓"), prompt: t(`Lv${st.lv} · ${st.ltssm} Gen${st.gen} x${st.width} · state 배지 ${(st.sbadges || []).length}개 · 관장 배지 ${st.badges.length}개\n플레이 ${fmtTime(st.playMs)} · 점수 ${sc.score}${mig.migrated ? "\n📦 구버전 코드 → 새 1번 마을 구조로 변환(레벨·배지·기록 유지)" : ""}\n\n현재 기기의 진행 상황을 이 코드로 덮어쓸까요?`, `Lv${st.lv} · ${st.ltssm} Gen${st.gen} x${st.width} · ${(st.sbadges || []).length} state badges · ${st.badges.length} gym badges\nPlayed ${fmtTime(st.playMs)} · score ${sc.score}${mig.migrated ? "\n📦 Old code → converted to the new Town 1 layout (level, badges and records kept)" : ""}\n\nOverwrite this device's progress with this code?`), cancel: true });
    if (k !== 0) return false;
    G.setState(st); G.save();
    if (location.hash.startsWith("#save=")) history.replaceState(null, "", location.href.split("#")[0]);
    await G.say(t("✅ 진행 상황을 불러왔다!", "✅ Progress loaded!"));
    return true;
  }
  async function importCode(prefill) {
    const r = await form({ title: t("저장 코드 불러오기", "Import save code"), msg: t("SPEC1. 으로 시작하는 저장 코드(또는 공유 링크)를 붙여넣으세요.", "Paste a save code starting with SPEC1. (or a share link)."), field: { type: "textarea", value: prefill || "", placeholder: "SPEC1.xxxxxxxx…" },
      buttons: [{ label: t("불러오기", "Import"), value: "ok", primary: true }, { label: t("취소", "Cancel"), value: null }] });
    if (r.value !== "ok" || !r.text.trim()) return false;
    return applyCode(r.text);
  }

  /* ---------------- 랭킹 어댑터 ---------------- */
  const LB_CONFIG = { adapter: "github-issues", owner: "spec-master", repo: "spec-rpg", branch: "main", file: "data/leaderboard.json" };
  const LB_ADAPTERS = {
    "github-issues": {
      enabled: true,
      async fetchBoard() {
        const urls = [`https://raw.githubusercontent.com/${LB_CONFIG.owner}/${LB_CONFIG.repo}/${LB_CONFIG.branch}/${LB_CONFIG.file}?t=${Date.now()}`, `./${LB_CONFIG.file}?t=${Date.now()}`];
        let last;
        for (const u of urls) { try { const r = await fetch(u, { cache: "no-store" }); if (r.ok) return await r.json(); last = new Error("HTTP " + r.status); } catch (e) { last = e; } }
        throw last || new Error("fetch failed");
      },
      submitLink(nick, code) {
        const body = `<!-- SPEC 몬스터 랭킹 제출: 아래 내용을 수정하지 말고 Submit new issue 를 누르세요. 1~2분 안에 자동 반영됩니다. -->\nnick: ${nick}\ncode: ${code}\n`;
        return `https://github.com/${LB_CONFIG.owner}/${LB_CONFIG.repo}/issues/new?title=${encodeURIComponent("[score] " + nick)}&body=${encodeURIComponent(body)}`;
      },
      get note() { return t("제출은 GitHub 이슈로 진행돼요(GitHub 로그인 필요). 서버(GitHub Actions)가 저장 코드를 다시 검증해 점수를 계산합니다.", "Scores are submitted as a GitHub issue (GitHub login needed). The server (GitHub Actions) re-checks the save code and computes the score."); }
    },
    disabled: { enabled: false }
  };
  const LB = () => LB_ADAPTERS[LB_CONFIG.adapter] || LB_ADAPTERS.disabled;

  async function viewRanking() {
    const ad = LB(); if (!ad.enabled) { await G.say(t("🏆 랭킹은 준비 중입니다.", "🏆 Ranking is coming soon.")); return; }
    G.clearConsole(); elText.textContent = t("랭킹 불러오는 중…", "Loading ranking…");
    let board;
    try { board = await ad.fetchBoard(); } catch (e) { await G.say(t("📡 랭킹을 불러올 수 없습니다 (오프라인이거나 서버 응답 없음).", "📡 Could not load the ranking (offline or no server response).")); return; }
    const list = (board.entries || []).slice().sort((a, b) => b.score - a.score);
    const myNick = localStorage.getItem(NICK_KEY) || "";
    const mine = SC.computeScore(G.P());
    const items = [{ sec: true, label: t(`TOP 20 (참가 ${list.length}명)`, `TOP 20 (${list.length} players)`) }];
    if (!list.length) items.push({ label: t("아직 기록이 없습니다. 첫 번째 주인공이 되어 보세요!", "No records yet. Be the first!"), desc: "" });
    list.slice(0, 20).forEach((e, i) => items.push({ label: `${i + 1}. ${e.nick}  ${e.score}${t("점", " pts")}${e.nick === myNick ? t("  ◀ 나", "  ◀ me") : ""}`,
      desc: t(`${i + 1}위 ${e.nick} (GitHub @${e.user})\nLv${e.lv} · 관장 배지 ${e.badges} · state 배지 ${e.sbadges || 0} · 규칙 ${e.rules || 0} · 정답 ${e.correct} · 정확도 ${Math.round(e.acc * 100)}% · ${e.playMin}분\n갱신: ${new Date(e.at).toLocaleString("ko-KR")}`, `#${i + 1} ${e.nick} (GitHub @${e.user})\nLv${e.lv} · gym badges ${e.badges} · state badges ${e.sbadges || 0} · rules ${e.rules || 0} · correct ${e.correct} · accuracy ${Math.round(e.acc * 100)}% · ${e.playMin}m\nUpdated: ${new Date(e.at).toLocaleString("en-US")}`) }));
    items.push({ sec: true, label: t("내 순위", "My rank") });
    const myIdx = myNick ? list.findIndex((e) => e.nick === myNick) : -1;
    items.push({ label: myIdx >= 0 ? t(`${myIdx + 1}위 / ${list.length}명 · 등록 점수 ${list[myIdx].score}점`, `#${myIdx + 1} / ${list.length} · posted score ${list[myIdx].score}`) : t("미등록 (메뉴 → 랭킹 → 점수 제출)", "Not posted (Menu → Ranking → Submit score)"), desc: myIdx >= 0 ? t(`닉네임 ${myNick}`, `Nickname ${myNick}`) : t("아직 제출한 점수가 없거나, 반영 대기 중입니다 (1~2분).", "No score submitted yet, or it is still being processed (1–2 min).") });
    items.push({ label: t(`현재 점수 ${mine.score}점`, `Current score ${mine.score}`), desc: scoreDesc(mine) });
    await G.panel(`🏆 ${t("랭킹 · 업데이트", "Ranking · updated")} ${board.updated ? new Date(board.updated).toLocaleString(LOC()) : "-"}`, items);
  }
  const scoreDesc = (m) => (G.lang === "en" ? `Level ${m.parts.level} + gym badges ${m.parts.badges}${m.parts.champ ? ` + champion ${m.parts.champ}` : ""} + state badges ${m.parts.sbadges} + rules ${m.parts.rules} + dex ${m.parts.dex} + correct ${m.parts.correct} + accuracy ${m.parts.accuracy}\n(Lv×100, gym badge×500, state badge×200, rule×15, dex×30, correct×10, accuracy%×5 after 10+ answers)` : `레벨 ${m.parts.level} + 관장 배지 ${m.parts.badges}${m.parts.champ ? ` + 챔피언 ${m.parts.champ}` : ""} + state 배지 ${m.parts.sbadges} + 규칙 ${m.parts.rules} + 도감 ${m.parts.dex} + 정답 ${m.parts.correct} + 정확도 ${m.parts.accuracy}\n(Lv×100, 관장 배지×500, state 배지×200, 규칙×15, 도감×30, 정답×10, 10문제 이상 답하면 정확도%×5)`);

  async function submitScore() {
    const ad = LB(); if (!ad.enabled) { await G.say(t("🏆 랭킹은 준비 중입니다.", "🏆 Ranking is coming soon.")); return; }
    const last = +localStorage.getItem(LAST_SUBMIT_KEY) || 0;
    if (Date.now() - last < RATE_MS) { await G.say(t(`⏳ 너무 자주 제출했어요. ${Math.ceil((RATE_MS - (Date.now() - last)) / 60000)}분 뒤에 다시 시도하세요.`, `⏳ Too many submissions. Try again in ${Math.ceil((RATE_MS - (Date.now() - last)) / 60000)} min.`)); return; }
    const m = SC.computeScore(G.P());
    if (m.answered < 5) { await G.say(t("퀴즈를 최소 5문제는 풀어야 랭킹에 제출할 수 있어요.", "Answer at least 5 quiz questions before submitting to the ranking.")); return; }
    let nick = localStorage.getItem(NICK_KEY) || "";
    while (true) {
      const r = await form({ title: t("점수 제출", "Submit score"), msg: t(`현재 점수 ${m.score}점\n${scoreDesc(m)}\n\n닉네임 (2~12자, 한글/영문/숫자/_/-)`, `Current score ${m.score}\n${scoreDesc(m)}\n\nNickname (2–12 chars: Hangul/letters/digits/_/-)`), field: { type: "input", value: nick, maxlength: 12, placeholder: t("닉네임", "Nickname") },
        buttons: [{ label: t("다음", "Next"), value: "ok", primary: true }, { label: t("취소", "Cancel"), value: null }] });
      if (r.value !== "ok") return;
      nick = SC.cleanNick(r.text);
      if (SC.validNick(nick)) break;
      await G.say(t("⚠️ 닉네임은 2~12자의 한글/영문/숫자/_/- 만 쓸 수 있어요.", "⚠️ Nicknames must be 2–12 chars of Hangul/letters/digits/_/- only."));
    }
    localStorage.setItem(NICK_KEY, nick);
    G.save();
    const code = await SC.encode(G.P());
    const url = ad.submitLink(nick, code);
    const r = await form({ title: t("점수 제출", "Submit score"), msg: `${ad.note}\n\n${t("아래 버튼 → GitHub 페이지에서 'Create'(Submit new issue)를 누르면 끝!", "Tap the button below, then press 'Create' (Submit new issue) on GitHub. Done!")}`,
      buttons: [{ label: t("GitHub에서 제출하기 ↗", "Submit on GitHub ↗"), href: url, primary: true, onClick: () => { localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now())); } }, { label: t("닫기", "Close"), value: null }] });
    void r;
  }
  async function rankingMenu() {
    const k = await G.choose([t("랭킹 보기", "View ranking"), t("점수 제출", "Submit score"), t("취소", "Cancel")], { prompt: t("🏆 랭킹", "🏆 Ranking"), cancel: true });
    if (k === 0) await viewRanking(); else if (k === 1) await submitScore();
  }

  /* ---------------- 메뉴/타이틀 연결 ---------------- */
  G.menuExtras = [
    { get label() { return t("저장 코드 내보내기", "Export save code"); }, run: exportCode },
    { get label() { return t("저장 코드 불러오기", "Import save code"); }, run: async () => ((await importCode()) ? "close" : undefined) },
    { get label() { return t("랭킹", "Ranking"); }, run: rankingMenu }
  ];
  const hashCode = () => (location.hash.startsWith("#save=") ? decodeURIComponent(location.hash.slice(6)) : "");
  G.titleExtras = [
    { get label() { return t("🔗 링크의 저장 코드 불러오기", "🔗 Load save code from link"); }, top: true, cond: () => !!hashCode(), run: () => applyCode(hashCode()) },
    { get label() { return t("저장 코드 불러오기", "Import save code"); }, run: () => importCode() }
  ];
  G.online = { exportCode, importCode, applyCode, viewRanking, submitScore, LB_CONFIG, LB_ADAPTERS };
})();
