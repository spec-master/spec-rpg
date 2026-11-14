/* =========================================================
 * 저장 코드 내보내기/불러오기 + 랭킹(리더보드)
 * 랭킹 백엔드는 어댑터로 교체 가능 (LB_ADAPTERS)
 *  - github-issues: 플레이어가 GitHub 이슈로 제출 → GitHub Actions가 검증 후
 *    data/leaderboard.json 갱신. 클라이언트에 토큰/비밀값 없음.
 * ========================================================= */
(function () {
  "use strict";
  const G = window.G, S = window.SPEC, SC = window.SaveCode;
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
  const fmtTime = (ms) => { const m = Math.floor((ms || 0) / 60000); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`; };
  const shareURL = (code) => location.href.split("#")[0] + "#save=" + code;

  /* ---------------- 내보내기 ---------------- */
  async function exportCode() {
    G.save();
    const code = await SC.encode(G.P());
    const copyBtn = (label, getText) => ({ label, onClick: async (e, fld, btn) => { e.preventDefault(); const ok = await copyText(getText()); btn.textContent = ok ? "복사됨 ✓" : "길게 눌러 직접 복사"; setTimeout(() => (btn.textContent = label), 1500); } });
    await form({ title: "저장 코드 내보내기", msg: `다른 기기에서 '저장 코드 불러오기'에 붙여넣으세요. (${code.length}자, 체크섬 포함 · 서버 저장 없음)`,
      field: { type: "textarea", value: code, readonly: true },
      buttons: [copyBtn("코드 복사", () => code), copyBtn("공유 링크 복사", () => shareURL(code)), { label: "닫기", value: "close" }] });
  }

  /* ---------------- 불러오기 ---------------- */
  async function applyCode(code) {
    let st;
    try { st = await SC.decode(code); } catch (e) { await G.say("⚠️ 불러오기 실패: " + e.message); return false; }
    const errs = SC.validate(st, S);
    if (!G.maps[st.map]) errs.push("알 수 없는 맵");
    if (errs.length) { await G.say("⚠️ 저장 코드 검증 실패: " + errs.slice(0, 3).join(", ")); return false; }
    const sc = SC.computeScore(st);
    const k = await G.choose(["덮어쓰기", "취소"], { header: "저장 코드 확인 ✓", prompt: `Lv${st.lv} · ${st.ltssm} Gen${st.gen} x${st.width} · 배지 ${st.badges.length}개 · 도감 ${sc.concepts}개\n플레이 ${fmtTime(st.playMs)} · 점수 ${sc.score}\n\n현재 기기의 진행 상황을 이 코드로 덮어쓸까요?`, cancel: true });
    if (k !== 0) return false;
    G.setState(st); G.save();
    if (location.hash.startsWith("#save=")) history.replaceState(null, "", location.href.split("#")[0]);
    await G.say("✅ 진행 상황을 불러왔다!");
    return true;
  }
  async function importCode(prefill) {
    const r = await form({ title: "저장 코드 불러오기", msg: "SPEC1. 으로 시작하는 저장 코드(또는 공유 링크)를 붙여넣으세요.", field: { type: "textarea", value: prefill || "", placeholder: "SPEC1.xxxxxxxx…" },
      buttons: [{ label: "불러오기", value: "ok", primary: true }, { label: "취소", value: null }] });
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
      note: "제출은 GitHub 이슈로 진행돼요(GitHub 로그인 필요). 서버(GitHub Actions)가 저장 코드를 다시 검증해 점수를 계산합니다."
    },
    disabled: { enabled: false }
  };
  const LB = () => LB_ADAPTERS[LB_CONFIG.adapter] || LB_ADAPTERS.disabled;

  async function viewRanking() {
    const ad = LB(); if (!ad.enabled) { await G.say("🏆 랭킹은 준비 중입니다."); return; }
    G.clearConsole(); elText.textContent = "랭킹 불러오는 중…";
    let board;
    try { board = await ad.fetchBoard(); } catch (e) { await G.say("📡 랭킹을 불러올 수 없습니다 (오프라인이거나 서버 응답 없음)."); return; }
    const list = (board.entries || []).slice().sort((a, b) => b.score - a.score);
    const myNick = localStorage.getItem(NICK_KEY) || "";
    const mine = SC.computeScore(G.P());
    const items = [{ sec: true, label: `TOP 20 (참가 ${list.length}명)` }];
    if (!list.length) items.push({ label: "아직 기록이 없습니다. 첫 번째 주인공이 되어 보세요!", desc: "" });
    list.slice(0, 20).forEach((e, i) => items.push({ label: `${i + 1}. ${e.nick}  ${e.score}점${e.nick === myNick ? "  ◀ 나" : ""}`,
      desc: `${i + 1}위 ${e.nick} (GitHub @${e.user})\nLv${e.lv} · 배지 ${e.badges} · 도감 ${e.concepts} · 정답 ${e.correct} · 정확도 ${Math.round(e.acc * 100)}% · ${e.playMin}분\n갱신: ${new Date(e.at).toLocaleString("ko-KR")}` }));
    items.push({ sec: true, label: "내 순위" });
    const myIdx = myNick ? list.findIndex((e) => e.nick === myNick) : -1;
    items.push({ label: myIdx >= 0 ? `${myIdx + 1}위 / ${list.length}명 · 등록 점수 ${list[myIdx].score}점` : "미등록 (메뉴 → 랭킹 → 점수 제출)", desc: myIdx >= 0 ? `닉네임 ${myNick}` : "아직 제출한 점수가 없거나, 반영 대기 중입니다 (1~2분)." });
    items.push({ label: `현재 점수 ${mine.score}점`, desc: scoreDesc(mine) });
    await G.panel(`🏆 랭킹 · 업데이트 ${board.updated ? new Date(board.updated).toLocaleString("ko-KR") : "-"}`, items);
  }
  const scoreDesc = (m) => `레벨 ${m.parts.level} + 배지 ${m.parts.badges} + 도감 ${m.parts.dex} + 정답 ${m.parts.correct} + 정확도 ${m.parts.accuracy}\n(Lv×100, 배지×500, 도감×30, 정답×10, 10문제 이상 답하면 정확도%×5)`;

  async function submitScore() {
    const ad = LB(); if (!ad.enabled) { await G.say("🏆 랭킹은 준비 중입니다."); return; }
    const last = +localStorage.getItem(LAST_SUBMIT_KEY) || 0;
    if (Date.now() - last < RATE_MS) { await G.say(`⏳ 너무 자주 제출했어요. ${Math.ceil((RATE_MS - (Date.now() - last)) / 60000)}분 뒤에 다시 시도하세요.`); return; }
    const m = SC.computeScore(G.P());
    if (m.answered < 5) { await G.say("퀴즈를 최소 5문제는 풀어야 랭킹에 제출할 수 있어요."); return; }
    let nick = localStorage.getItem(NICK_KEY) || "";
    while (true) {
      const r = await form({ title: "점수 제출", msg: `현재 점수 ${m.score}점\n${scoreDesc(m)}\n\n닉네임 (2~12자, 한글/영문/숫자/_/-)`, field: { type: "input", value: nick, maxlength: 12, placeholder: "닉네임" },
        buttons: [{ label: "다음", value: "ok", primary: true }, { label: "취소", value: null }] });
      if (r.value !== "ok") return;
      nick = SC.cleanNick(r.text);
      if (SC.validNick(nick)) break;
      await G.say("⚠️ 닉네임은 2~12자의 한글/영문/숫자/_/- 만 쓸 수 있어요.");
    }
    localStorage.setItem(NICK_KEY, nick);
    G.save();
    const code = await SC.encode(G.P());
    const url = ad.submitLink(nick, code);
    const r = await form({ title: "점수 제출", msg: `${ad.note}\n\n아래 버튼 → GitHub 페이지에서 'Create'(Submit new issue)를 누르면 끝!`,
      buttons: [{ label: "GitHub에서 제출하기 ↗", href: url, primary: true, onClick: () => { localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now())); } }, { label: "닫기", value: null }] });
    void r;
  }
  async function rankingMenu() {
    const k = await G.choose(["랭킹 보기", "점수 제출", "취소"], { prompt: "🏆 랭킹", cancel: true });
    if (k === 0) await viewRanking(); else if (k === 1) await submitScore();
  }

  /* ---------------- 메뉴/타이틀 연결 ---------------- */
  G.menuExtras = [
    { label: "저장 코드 내보내기", run: exportCode },
    { label: "저장 코드 불러오기", run: async () => ((await importCode()) ? "close" : undefined) },
    { label: "랭킹", run: rankingMenu }
  ];
  const hashCode = () => (location.hash.startsWith("#save=") ? decodeURIComponent(location.hash.slice(6)) : "");
  G.titleExtras = [
    { label: "🔗 링크의 저장 코드 불러오기", top: true, cond: () => !!hashCode(), run: () => applyCode(hashCode()) },
    { label: "저장 코드 불러오기", run: () => importCode() }
  ];
  G.online = { exportCode, importCode, applyCode, viewRanking, submitScore, LB_CONFIG, LB_ADAPTERS };
})();
