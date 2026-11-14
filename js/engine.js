/* =========================================================
 * SPEC RPG 엔진: 렌더링 / 입력 / 대화 / 메뉴 / 전투 / 저장
 * ========================================================= */
(function () {
  "use strict";
  const S = window.SPEC;
  const TS = 16, VW = 10, VH = 9, SC = 4;
  const cv = document.getElementById("cv");
  const ctx = cv.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const elText = $("ctext"), elSub = $("csub"), elList = $("clist"), elName = $("cname"), elArrow = $("carrow"), elConsole = $("console");
  const elPanel = $("panel"), elPTitle = $("ptitle"), elPList = $("plist");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (n) => Math.floor(Math.random() * n);
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: "down", down: "up", left: "right", right: "left" };

  /* ---------------- 타일 (절차적 픽셀아트) ---------------- */
  function mk(fn) { const c = document.createElement("canvas"); c.width = c.height = TS; const g = c.getContext("2d"); fn(g, (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); }); return c; }
  const grassBase = (p) => { p(0, 0, "#8bd060", 16, 16); [[2, 3], [9, 1], [13, 6], [5, 10], [11, 13], [1, 14], [7, 7]].forEach(([x, y]) => { p(x, y, "#6fb048"); p(x + 1, y - 1, "#6fb048"); }); };
  const TILES = {};
  function buildTiles() {
    TILES["."] = mk((g, p) => grassBase(p));
    TILES[","] = mk((g, p) => { p(0, 0, "#5cae48", 16, 16); for (let y = 1; y < 16; y += 5) for (let x = (y % 2) * 2; x < 16; x += 4) { p(x, y + 2, "#2f7a30"); p(x + 1, y + 1, "#2f7a30"); p(x + 2, y + 2, "#2f7a30"); p(x + 1, y + 2, "#3f9440"); p(x + 1, y + 3, "#2f7a30"); } });
    TILES["="] = mk((g, p) => { p(0, 0, "#e8d49a", 16, 16); [[3, 2], [10, 5], [6, 11], [13, 12], [1, 8]].forEach(([x, y]) => p(x, y, "#cdb070", 2, 1)); });
    TILES["T"] = mk((g, p) => { grassBase(p); p(6, 11, "#6d4c41", 4, 5); p(2, 1, "#1f5d22", 12, 11); p(1, 3, "#1f5d22", 14, 7); p(3, 2, "#2e7d32", 10, 8); p(4, 3, "#4caf50", 4, 3); p(5, 4, "#81c784", 2, 1); });
    TILES["~"] = mk((g, p) => { p(0, 0, "#4a90e2", 16, 16); p(2, 4, "#a8d4ff", 4, 1); p(9, 9, "#a8d4ff", 5, 1); p(4, 13, "#a8d4ff", 3, 1); p(12, 2, "#a8d4ff", 3, 1); });
    const roof = (c1, c2) => mk((g, p) => { p(0, 0, c1, 16, 16); for (let y = 3; y < 16; y += 4) p(0, y, c2, 16, 1); for (let x = 0; x < 16; x += 4) p(x, 0, c2, 1, 16); });
    TILES["R"] = roof("#d9534f", "#a93a36"); TILES["U"] = roof("#4f78d9", "#3656a9"); TILES["O"] = roof("#f0a040", "#c07820"); TILES["P"] = roof("#9a5fd0", "#7040a0");
    TILES["H"] = mk((g, p) => { p(0, 0, "#f3e9d2", 16, 16); p(0, 15, "#b8a888", 16, 1); p(4, 4, "#8d6e63", 8, 8); p(5, 5, "#6fb7ff", 6, 6); p(5, 8, "#8d6e63", 6, 1); });
    TILES["D"] = mk((g, p) => { p(0, 0, "#f3e9d2", 16, 16); p(3, 2, "#5d3a1a", 10, 14); p(4, 3, "#8d4f2a", 8, 13); p(10, 9, "#f0c040", 1, 2); });
    TILES["F"] = mk((g, p) => { grassBase(p); [[3, 4, "#e04040"], [10, 3, "#f0e040"], [6, 10, "#f0e040"], [12, 11, "#e04040"]].forEach(([x, y, c]) => { p(x, y, c, 3, 3); p(x + 1, y + 1, "#fff"); }); });
    TILES["S"] = mk((g, p) => { grassBase(p); p(7, 9, "#6d4c41", 2, 6); p(2, 3, "#5d3a1a", 12, 7); p(3, 4, "#c8a060", 10, 5); p(4, 5, "#5d3a1a", 8, 1); p(4, 7, "#5d3a1a", 6, 1); });
    TILES["#"] = mk((g, p) => { grassBase(p); p(0, 5, "#fff", 16, 2); p(0, 10, "#fff", 16, 2); p(2, 3, "#ddd", 2, 11); p(12, 3, "#ddd", 2, 11); });
    TILES["_"] = mk((g, p) => { p(0, 0, "#e6cfa1", 16, 16); p(0, 15, "#d0b47e", 16, 1); p(15, 0, "#d0b47e", 1, 16); });
    TILES["W"] = mk((g, p) => { p(0, 0, "#7c5a40", 16, 16); p(0, 0, "#a1785a", 16, 10); p(0, 9, "#5a3f2c", 16, 1); });
    TILES["B"] = mk((g, p) => { p(0, 0, "#5a3f2c", 16, 16); const cs = ["#d9534f", "#4f78d9", "#f0c040", "#4caf50", "#9a5fd0"]; for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) p(1 + i * 2 + (i > 2 ? 1 : 0), 2 + r * 7, cs[(i + r) % 5], 2, 5); });
    TILES["M"] = mk((g, p) => { p(0, 0, "#e6cfa1", 16, 16); p(2, 1, "#455a64", 12, 14); p(3, 2, "#90a4ae", 10, 6); p(4, 3, "#80ff80", 8, 4); p(4, 10, "#f0c040", 2, 2); p(8, 10, "#e04040", 2, 2); });
    TILES["C"] = mk((g, p) => { p(0, 0, "#e6cfa1", 16, 16); p(0, 4, "#c0d8f0", 16, 10); p(0, 4, "#ffffff", 16, 2); p(0, 13, "#8090a0", 16, 2); });
    TILES["X"] = mk((g, p) => { p(0, 0, "#e6cfa1", 16, 16); p(2, 4, "#c03030", 12, 10); p(3, 5, "#e05050", 10, 8); });
    TILES[" "] = mk((g, p) => p(0, 0, "#000", 16, 16));
    // 동굴/협곡/탑/호수 타일
    TILES["K"] = mk((g, p) => { p(0, 0, "#4a3c34", 16, 16); p(1, 2, "#7a6a5a", 9, 6); p(8, 8, "#6a5a4c", 7, 6); p(2, 3, "#9a8a76", 4, 2); p(9, 9, "#8a7a68", 3, 2); p(0, 15, "#2a201a", 16, 1); });
    TILES[";"] = mk((g, p) => { p(0, 0, "#5a4a42", 16, 16); [[3, 4], [11, 2], [7, 10], [13, 13], [2, 12]].forEach(([x, y]) => p(x, y, "#6c5a50", 2, 1)); });
    TILES[":"] = mk((g, p) => { p(0, 0, "#4c3e38", 16, 16); [[2, 3], [9, 5], [5, 11], [12, 12], [13, 1]].forEach(([x, y]) => { p(x, y, "#8a7868", 2, 2); p(x, y + 2, "#2e2420", 2, 1); }); p(7, 2, "#60d0e0"); p(3, 8, "#60d0e0"); });
    TILES["G"] = mk((g, p) => { p(0, 0, "#d8a070", 16, 16); [[3, 2], [10, 6], [5, 12], [13, 11]].forEach(([x, y]) => p(x, y, "#c08858", 2, 1)); });
    TILES["v"] = mk((g, p) => { p(0, 0, "#d8a070", 16, 16); for (let y = 1; y < 16; y += 5) for (let x = (y % 2) * 2; x < 16; x += 4) { p(x, y + 2, "#9a7a30"); p(x + 1, y + 1, "#b89a40"); p(x + 2, y + 2, "#9a7a30"); p(x + 1, y + 2, "#c8aa50"); p(x + 1, y + 3, "#9a7a30"); } });
    TILES["Y"] = mk((g, p) => { p(0, 0, "#b8b0c8", 16, 16); p(0, 7, "#9890a8", 16, 1); p(0, 15, "#9890a8", 16, 1); p(7, 0, "#9890a8", 1, 7); p(3, 8, "#9890a8", 1, 7); p(11, 8, "#9890a8", 1, 7); });
    TILES["Q"] = mk((g, p) => { p(0, 0, "#585070", 16, 16); p(0, 0, "#706890", 16, 4); p(0, 7, "#403858", 16, 1); p(0, 12, "#403858", 16, 1); p(5, 7, "#403858", 1, 5); p(11, 12, "#403858", 1, 4); });
    TILES["Z"] = mk((g, p) => { p(0, 0, "#f0e0a8", 16, 16); [[3, 3], [10, 7], [6, 12], [13, 2]].forEach(([x, y]) => p(x, y, "#d8c890", 1, 1)); });
    TILES["*"] = mk((g, p) => { p(0, 0, "#4c3e38", 16, 16); p(5, 3, "#60d0e0", 6, 10); p(6, 1, "#a0f0ff", 4, 4); p(4, 8, "#40a0c0", 2, 5); p(10, 6, "#40a0c0", 2, 7); p(7, 4, "#fff", 1, 3); });
  }
  const SOLID = new Set(["T", "~", "R", "U", "O", "P", "H", "W", "B", "M", "C", "S", "#", " ", "K", "Q", "*"]);
  const ENC_TILES = new Set([",", ":", "v"]);

  /* ---------------- 캐릭터 스프라이트 ---------------- */
  function drawPerson(g, x, y, dir, step, look) {
    const p = (px, py, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x + px, y + py, w, h); };
    const skin = look.skin || "#f8c890", hair = look.hair || "#402010", shirt = look.shirt || "#d04040", pants = look.pants || "#304080";
    p(3, 14, "rgba(0,0,0,0.25)", 10, 2);
    // legs
    const l1 = step === 1 ? -1 : 0, l2 = step === 2 ? -1 : 0;
    p(5, 12 + l1, pants, 2, 3); p(9, 12 + l2, pants, 2, 3); p(5, 15 + l1, "#202020", 2, 1); p(9, 15 + l2, "#202020", 2, 1);
    // body
    p(4, 8, "#202020", 8, 5); p(5, 8, shirt, 6, 4);
    if (dir === "left" || dir === "right") { p(dir === "left" ? 6 : 8, 9, skin, 2, 2); }
    else { p(3, 9, skin, 1, 2); p(12, 9, skin, 1, 2); }
    // head
    p(4, 1, "#202020", 8, 8); p(5, 2, skin, 6, 6);
    if (dir === "up") { p(5, 1, hair, 6, 7); }
    else {
      p(4, 1, hair, 8, 3);
      if (dir === "down") { p(6, 5, "#202020"); p(9, 5, "#202020"); }
      if (dir === "left") { p(10, 2, hair, 2, 5); p(5, 5, "#202020"); }
      if (dir === "right") { p(4, 2, hair, 2, 5); p(10, 5, "#202020"); }
    }
    if (look.hat) { p(3, 0, look.hat, 10, 2); if (dir === "down") p(4, 2, look.hat, 8, 1); }
  }

  /* ---------------- 몬스터 스프라이트 (시드 기반 대칭 생성) ---------------- */
  const monCache = {};
  function monSprite(id) {
    if (monCache[id]) return monCache[id];
    const m = S.MONSTERS[id];
    if (m.ltssm && window.LUI) return (monCache[id] = window.LUI.monSprite(m)); let seed = m.seed * 9301 + 49297;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const N = 20, H = 10; let grid = [];
    for (let y = 0; y < N; y++) { grid[y] = []; for (let x = 0; x < H; x++) { const dx = (H - x) / H, dy = Math.abs(y - N * 0.55) / (N / 2); const pr = 0.85 - dy * 0.7 - (1 - dx) * 0.5; grid[y][x] = rand() < pr ? 1 : 0; } }
    for (let it = 0; it < 2; it++) { const g2 = grid.map((r) => r.slice()); for (let y = 0; y < N; y++) for (let x = 0; x < H; x++) { let c = 0; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const X = x + xx, Y = y + yy; if (X >= H) { if (grid[Y] && grid[Y][2 * H - 1 - X]) c++; } else if (grid[Y] && grid[Y][X]) c++; } g2[y][x] = c >= 5 ? 1 : c <= 2 ? 0 : grid[y][x]; } grid = g2; }
    const full = grid.map((r) => r.concat(r.slice().reverse()));
    const c = document.createElement("canvas"); c.width = c.height = N * 2; const g = c.getContext("2d");
    const dark = shade(m.color, -0.45), light = shade(m.color, 0.35);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (full[y][x]) { g.fillStyle = (y < N * 0.4 && (x + y) % 5 === 0) ? light : m.color; g.fillRect(x * 2, y * 2, 2, 2); }
      else if ((full[y - 1] && full[y - 1][x]) || (full[y + 1] && full[y + 1][x]) || full[y][x - 1] || full[y][x + 1]) { g.fillStyle = dark; g.fillRect(x * 2, y * 2, 2, 2); }
    }
    let ey = -1; for (let y = 4; y < N; y++) if (full[y][H - 3] && full[y][H - 4]) { ey = y; break; }
    if (ey < 0) ey = 8;
    [H - 4, H + 2].forEach((ex) => { g.fillStyle = "#fff"; g.fillRect(ex * 2, ey * 2 + 2, 6, 6); g.fillStyle = "#101010"; g.fillRect(ex * 2 + 2, ey * 2 + 4, 3, 3); });
    g.fillStyle = dark; g.fillRect((H - 2) * 2, (ey + 5) * 2, 8, 2);
    if (m.boss) { g.fillStyle = "#f0c040"; for (let i = 0; i < 3; i++) g.fillRect(12 + i * 6, 0, 3, 5); }
    return (monCache[id] = c);
  }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + ((1 << 24) + (f(r) << 16) + (f(gg) << 8) + f(b)).toString(16).slice(1); }

  /* ---------------- 상태 ---------------- */
  const G = (window.G = {});
  G.maps = {}; G.mode = "title"; G.busy = false;
  /* ---- 언어 (ko / en) ---- */
  const LANG_KEY = "specrpg_lang";
  G.lang = (() => { try { return localStorage.getItem(LANG_KEY) || "ko"; } catch (e) { return "ko"; } })();
  G.setLang = (l) => { G.lang = l === "en" ? "en" : "ko"; try { localStorage.setItem(LANG_KEY, G.lang); } catch (e) {} document.documentElement.lang = G.lang; };
  const t = (ko, en) => (G.lang === "en" && en != null ? en : ko); G.t = t;
  const NM = (m) => (m ? t(m.name, m.en) : ""); G.nm = NM;
  const SN = (st) => (st ? t(st.name, st.en) : ""); G.sn = SN;
  const IN = (it) => (it ? t(it.name, it.en) : ""), ID = (it) => (it ? t(it.desc, it.descEn) : "");
  const MD = (m) => t(m.desc, m.descEn);
  const RT = (rid) => { const r = S.LTSSM.RULES[rid]; return r ? t(r.text, r.en) : rid; };
  const TAGC = { PCIe: "pc", CXL: "cx", "공통": "cm", "CXL/공통": "cx" };
  const tagHTML = (tg) => tg ? `<span class="tag t${TAGC[tg] || "pc"}">${tg === "공통" ? t("공통", "Common") : tg === "CXL/공통" ? t("CXL/공통", "CXL/Common") : tg}</span>` : "";
  G.tagHTML = tagHTML;
  let P = null; // 저장되는 플레이어 상태
  const SAVE_KEY = "specrpg_save_v1";
  function newState() {
    return { map: "lab", x: 4, y: 6, dir: "up", lv: 1, xp: 0, hp: 30, chapter: 1, ltssm: "Detect", gen: 1, width: 1,
      flags: {}, items: {}, learned: {}, mastery: {}, moves: ["rxdetect"], badges: [], seenQ: {}, wins: 0, playMs: 0,
      ver: 2, sbadges: [], rules: {}, ach: [], met: [], st: { cs: 0, bs: 0, pf: 0 }, title: "" };
  }
  /* 기본 기술 보장: 기술이 0개면 전투에서 '기술' 목록이 비어 아무것도 안 뜨던 버그(v3) 방지 */
  const BASE_MOVE = "rxdetect";
  function sanitize() {
    if (!P) return;
    ["flags", "items", "learned", "mastery", "seenQ", "rules"].forEach((k) => { if (!P[k] || typeof P[k] !== "object" || Array.isArray(P[k])) P[k] = {}; });
    ["moves", "badges", "sbadges", "ach", "met"].forEach((k) => { if (!Array.isArray(P[k])) P[k] = []; });
    P.moves = P.moves.filter((m, i, a) => S.MOVES.some((x) => x.id === m) && a.indexOf(m) === i);
    if (!P.moves.includes(BASE_MOVE)) P.moves.unshift(BASE_MOVE);
    P.st = Object.assign({ cs: 0, bs: 0, pf: 0 }, P.st);
    { const ids = new Set(S.LTSSM.LQ.map((q) => q.id).concat(S.QUESTIONS.map((q) => q.id))); Object.keys(P.seenQ).forEach((k) => { if (!ids.has(k)) delete P.seenQ[k]; }); }
    P.met = P.met.filter((m) => S.MONSTERS[m]);
    if (!(P.lv >= 1)) P.lv = 1; if (!(P.hp >= 0)) P.hp = maxHP(); P.hp = Math.min(P.hp, maxHP());
  }
  /* 없어진 맵(구버전 프로토타입 등)에 저장된 위치 → 가까운 허브로 이주 */
  function fixMap() { if (G.maps[P.map]) return; const alt = G.mapAlias && G.mapAlias(P.map, P); if (alt && G.maps[alt[0]]) { [P.map, P.x, P.y] = alt; } else { P.map = "town"; P.x = 9; P.y = 13; } }
  G.sanitize = () => sanitize();
  G.P = () => P;
  const maxHP = () => 30 + 6 * (P.lv - 1);
  const xpNeed = (lv) => 10 + lv * 10;
  G.maxHP = maxHP;
  G.flag = (k) => !!P.flags[k];
  G.setFlag = (k, v = true) => { P.flags[k] = v; };
  G.hasItem = (k) => (P.items[k] || 0) > 0;
  G.save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) {} };
  G.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.load = () => { try { let s = JSON.parse(localStorage.getItem(SAVE_KEY)); const r = S.LTSSM.migrate(s); s = r.P; P = Object.assign(newState(), s); sanitize(); fixMap(); G.justMigrated = r.migrated; return true; } catch (e) { console.warn("load failed", e); P = newState(); return false; } };
  G.newGame = () => { P = newState(); sanitize(); };
  G.newState = newState;
  G.setState = (s) => { P = Object.assign(newState(), s); sanitize(); fixMap(); mv = null; };
  G.setHandler = (h) => { handler = h; };

  /* ---------------- 입력 ---------------- */
  const held = { up: false, down: false, left: false, right: false };
  let lastDir = null, handler = null;
  function press(b) {
    if (handler) { handler(b); return; }
    if (G.mode === "field" && !G.busy) fieldPress(b);
  }
  G.press = press;
  const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right",
    z: "A", Z: "A", Enter: "A", " ": "A", x: "B", X: "B", Escape: "B", Backspace: "B", Shift: "START", m: "START" };
  const typing = (e) => e.target && e.target.closest && e.target.closest("input, textarea");
  window.addEventListener("keydown", (e) => { if (typing(e)) return; const b = KEYMAP[e.key]; if (!b) return; e.preventDefault(); if (DIRS[b]) { held[b] = true; lastDir = b; } press(b); });
  window.addEventListener("keyup", (e) => { if (typing(e)) return; const b = KEYMAP[e.key]; if (b && DIRS[b]) { held[b] = false; if (lastDir === b) lastDir = null; } });
  document.querySelectorAll("[data-b]").forEach((el) => {
    const b = el.dataset.b;
    const down = (e) => { e.preventDefault(); el.classList.add("on"); if (DIRS[b]) { held[b] = true; lastDir = b; } press(b); };
    const up = (e) => { e.preventDefault(); el.classList.remove("on"); if (DIRS[b]) { held[b] = false; if (lastDir === b) lastDir = null; } };
    el.addEventListener("pointerdown", down); el.addEventListener("pointerup", up); el.addEventListener("pointerleave", up); el.addEventListener("pointercancel", up);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  // 콘솔 탭 = 대사 넘기기 (대사 중일 때만; 선택지/퀴즈 중 탭·스크롤로 답이 골라지던 문제 방지). click이라 스크롤 드래그엔 반응 안 함.
  let sayActive = false;
  ($("cframe") || elConsole).addEventListener("click", (e) => { if (e.target.closest(".opt, input, textarea, button, a, .nogo")) return; if (handler && sayActive) press("A"); });
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  const heldDir = () => (lastDir && held[lastDir] ? lastDir : ["up", "down", "left", "right"].find((d) => held[d]) || null);

  /* ---------------- 대화 / 선택 UI ---------------- */
  function setQuiz(on) { elConsole.classList.toggle("quiz", !!on);
    // 고정 질문이 콘솔을 다 덮지 않도록: 작은 화면에서는 질문 영역을 콘솔 높이의 55%로 제한(질문 자체 스크롤)
    elText.style.maxHeight = on ? Math.max(48, Math.floor(elConsole.clientHeight * 0.55)) + "px" : ""; elText.style.overflowY = on ? "auto" : ""; }
  function clearConsole() { elText.textContent = ""; elSub.innerHTML = ""; elList.innerHTML = ""; elList.className = ""; elName.textContent = ""; elArrow.classList.remove("on"); setQuiz(false); elConsole.scrollTop = 0; }
  /* v3.1: 글자 축소(fitConsole) 제거. 퀴즈는 질문(#ctext)을 sticky로 고정하고 보기만 스크롤. */
  function ensureVisible(el) {
    if (!el) return; const r = el.getBoundingClientRect(), c = elConsole.getBoundingClientRect();
    const top = c.top + (elConsole.classList.contains("quiz") ? elText.offsetHeight : 0);
    if (r.top < top) elConsole.scrollTop -= top - r.top + 4; else if (r.bottom > c.bottom) elConsole.scrollTop += r.bottom - c.bottom + 4;
  }
  G.fitConsole = () => {};
  G.clearConsole = clearConsole;
  function typeLine(text) {
    return new Promise((resolve) => {
      let i = 0, done = false; text = String(text == null ? "" : text); setQuiz(false); elSub.innerHTML = ""; elText.textContent = ""; elArrow.classList.remove("on"); elConsole.scrollTop = 0;
      const timer = setInterval(() => { i += 2; elText.textContent = text.slice(0, i); elConsole.scrollTop = elConsole.scrollHeight; if (i >= text.length) finish(); }, 28);
      function finish() { clearInterval(timer); elText.textContent = text; done = true; elArrow.classList.add("on"); elConsole.scrollTop = elConsole.scrollHeight; }
      sayActive = true;
      handler = (b) => { if (b !== "A" && b !== "B") return; if (!done) finish(); else { handler = null; sayActive = false; elArrow.classList.remove("on"); resolve(); } };
    });
  }
  G.say = async function (lines, name) {
    if (!Array.isArray(lines)) lines = [lines];
    elList.innerHTML = ""; elName.textContent = name || "";
    for (const l of lines) await typeLine(l);
  };
  /* choose: 목록 선택. opts: {prompt, cancel, grid, disabled:Set, hint:(i)=>text, header} → index (-1 = 취소) */
  G.choose = function (options, opts = {}) {
    return new Promise((resolve) => {
      options = (options || []).map((o) => String(o == null ? "" : o));
      elName.textContent = opts.name || ""; setQuiz(opts.quiz); elConsole.scrollTop = 0; elSub.innerHTML = "";
      elText.innerHTML = ""; if (opts.header) { const h = document.createElement("div"); h.className = "hdr"; h.textContent = opts.header; elText.appendChild(h); }
      if (opts.prompt) { const q = document.createElement("div"); q.className = opts.quiz ? "qtext" : ""; q.textContent = opts.prompt; elText.appendChild(q); }
      if (opts.sub) { const h = document.createElement("div"); h.className = "qsub"; h.innerHTML = opts.sub; (opts.quiz ? elSub : elText).appendChild(h); }
      elArrow.classList.remove("on"); elList.innerHTML = ""; elList.className = (opts.grid ? "grid" : "") + (opts.quiz ? " quiz" : "");
      const dis = opts.disabled || new Set(); let cur = 0; while (dis.has(cur) && cur < options.length - 1) cur++;
      const els = options.map((o, i) => { const d = document.createElement("div"); d.className = "opt" + (dis.has(i) ? " off" : ""); d.textContent = o;
        d.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); if (dis.has(i) || finished || handler !== myHandler) return; cur = i; render(); finish(i); }); elList.appendChild(d); return d; });
      const hintEl = document.createElement("div"); hintEl.className = "hdr hint"; hintEl.style.marginTop = "4px";
      let first = true;
      function render() {
        els.forEach((e, i) => e.classList.toggle("sel", i === cur)); if (opts.hint) { hintEl.textContent = (els.length && opts.hint(cur)) || ""; elList.appendChild(hintEl); }
        // 첫 렌더는 항상 맨 위(질문 보이게). 이후 이동 시 선택 보기만 보이도록 스크롤(고정된 질문 아래로).
        if (first) elConsole.scrollTop = 0; else ensureVisible(els[cur]);
        first = false;
      }
      let finished = false;
      function finish(i) { if (finished) return; finished = true; handler = null; resolve(i); }
      if (!els.length) { // 선택지가 없으면 안내 후 A/B로 취소(-1) — 빈 화면에서 멈추지 않도록
        const d = document.createElement("div"); d.className = "hdr"; d.textContent = opts.empty || "(선택할 항목이 없다 — A/B: 돌아가기)"; elList.appendChild(d);
        handler = (b) => { if (b === "A" || b === "B") finish(-1); }; return;
      }
      render();
      const myHandler = (handler = (b) => {
        const step = opts.grid ? { up: -2, down: 2, left: -1, right: 1 }[b] : { up: -1, down: 1 }[b];
        if (step) { let n = cur; for (let k = 0; k < options.length; k++) { n = (n + step + options.length) % options.length; if (!dis.has(n)) break; } cur = n; render(); }
        else if (b === "A") finish(cur);
        else if (b === "B" && opts.cancel) finish(-1);
      });
    });
  };
  G.markChoices = (okIdx, ngIdx) => { const els = elList.querySelectorAll(".opt"); if (els[okIdx]) els[okIdx].classList.add("ok"); if (ngIdx != null && ngIdx !== okIdx && els[ngIdx]) els[ngIdx].classList.add("ng"); };
  /* panel: 화면 위 목록 (도감/가방/기술). items:[{label, sec, lock, desc}] → index (-1 = 닫기) */
  G.panel = function (title, items, opts = {}) {
    return new Promise((resolve) => {
      elPanel.classList.remove("hidden"); elPTitle.textContent = title; elPList.innerHTML = "";
      const selectable = items.map((it, i) => (it.sec ? -1 : i)).filter((i) => i >= 0);
      let cur = opts.start != null ? Math.max(0, selectable.indexOf(opts.start)) : 0;
      elPList.className = opts.cols ? "cols c" + opts.cols : "";
      const els = items.map((it, i) => { const d = document.createElement("div"); d.className = "it" + (it.sec ? " sec" : "") + (it.lock ? " lock" : "") + (it.cls ? " " + it.cls : "");
        if (it.icon) { const im = document.createElement("img"); im.src = it.icon; im.className = "ico"; d.appendChild(im); }
        if (it.img) { const im = document.createElement("img"); im.src = it.img; im.className = "pimg"; d.appendChild(im); }
        const sp = document.createElement("span"); sp.className = "lb"; sp.textContent = it.label; d.appendChild(sp);
        if (it.bar != null) { const b = document.createElement("div"); b.className = "bar"; const f = document.createElement("i"); f.style.width = Math.round(Math.max(0, Math.min(1, it.bar)) * 100) + "%"; b.appendChild(f); d.appendChild(b); }
        if (!it.sec) d.addEventListener("click", (e) => { e.preventDefault(); const k = selectable.indexOf(i); if (k === cur && opts.selectable) { done(i); return; } cur = k; render(); }); elPList.appendChild(d); return d; });
      function render() { els.forEach((e) => e.classList.remove("sel")); const i = selectable[cur]; if (i == null) { clearConsole(); elText.textContent = opts.empty || ""; return; } els[i].classList.add("sel"); els[i].scrollIntoView({ block: "nearest" }); clearConsole(); elText.textContent = items[i].desc || ""; elArrow.classList.remove("on"); }
      function done(i) { handler = null; elPanel.classList.add("hidden"); clearConsole(); resolve(i); }
      render();
      const cols = opts.cols || 1, n = () => selectable.length;
      handler = (b) => { if (cols > 1 && (b === "left" || b === "right") && n()) { cur = (cur + (b === "left" ? -1 : 1) + n()) % n(); render(); } else if (b === "up" && n()) { cur = (cur - cols + n() * cols) % n(); render(); } else if (b === "down" && n()) { cur = (cur + cols) % n(); render(); } else if (b === "A" && opts.selectable && selectable.length) done(selectable[cur]); else if (b === "B" || b === "START" || (b === "A" && !opts.selectable)) done(-1); };
      if (opts.hintAll) { /* no-op */ }
    });
  };

  /* ---------------- 맵 / 이동 ---------------- */
  let mv = null; // {dx,dy,t}
  let animT = 0, fadeA = 0, flashA = 0, bubble = null;
  const curMap = () => G.maps[P.map];
  function tileAt(m, x, y) { if (y < 0 || y >= m.tiles.length || x < 0 || x >= m.tiles[0].length) return m.border || "T"; return m.tiles[y][x]; }
  G.tileAt = (x, y) => tileAt(curMap(), x, y);
  const npcsOf = (m) => (m.npcs || []).filter((n) => !n.cond || n.cond());
  function npcAt(m, x, y) { return npcsOf(m).find((n) => n.x === x && n.y === y); }
  function walkable(m, x, y) { const t = tileAt(m, x, y); if (SOLID.has(t)) return false; if (npcAt(m, x, y)) return false; return true; }
  G.warp = async function (map, x, y, dir) {
    await G.fade(1); P.map = map; P.x = x; P.y = y; if (dir) P.dir = dir; mv = null;
    const m = curMap(); G.save(); await G.fade(0);
    if (m.onEnter) await m.onEnter();
  };
  G.stepBack = async function () { const [dx, dy] = DIRS[OPP[P.dir]]; if (walkable(curMap(), P.x + dx, P.y + dy)) { await walkStep(OPP[P.dir], true); } };
  function walkStep(dir, keepFacing) {
    return new Promise((res) => { const [dx, dy] = DIRS[dir]; if (!keepFacing) P.dir = dir; mv = { dx, dy, t: 0, done: res, scripted: true }; });
  }
  G.fade = function (to) { return new Promise((res) => { const st = fadeA, t0 = performance.now(); const f = () => { const k = Math.min(1, (performance.now() - t0) / 220); fadeA = st + (to - st) * k; if (k < 1) requestAnimationFrame(f); else res(); }; f(); }); };
  async function flash(n = 3) { for (let i = 0; i < n; i++) { flashA = 1; await sleep(90); flashA = 0; await sleep(90); } }

  async function runScript(fn) { if (G.busy) return; G.busy = true; try { await fn(); } catch (e) { console.error(e); } G.busy = false; clearConsole(); showFieldHint(); G.save(); }
  G.runScript = runScript;
  function showFieldHint() { if (G.mode !== "field") return; clearConsole(); const m = curMap(); elName.textContent = t(m.name, m.en); elText.textContent = `${statusLine()}\n${t("방향키 이동 · A 조사/대화 · B/START 메뉴", "D-pad move · A talk/check · B/START menu")}`; }
  G.showFieldHint = showFieldHint;
  function statusLine() { return `Lv${P.lv}  HP ${P.hp}/${maxHP()}  ·  ${P.ltssm}  Gen${P.gen} x${P.width}`; }

  function fieldPress(b) {
    if (mv) return;
    if (b === "A") {
      const [dx, dy] = DIRS[P.dir]; const m = curMap(); let tx = P.x + dx, ty = P.y + dy;
      if (tileAt(m, tx, ty) === "C") { tx += dx; ty += dy; }
      const n = npcAt(m, tx, ty);
      if (n) { runScript(async () => { if (!n.fixed) n.dir = OPP[P.dir]; await n.talk(n); }); return; }
      const sg = m.signs && m.signs[tx + "," + ty];
      if (sg) runScript(sg);
    } else if (b === "B" || b === "START") runScript(fieldMenu);
  }
  async function afterStep() {
    const m = curMap();
    const tr = (m.triggers || []).find((t) => t.x === P.x && t.y === P.y && (!t.cond || t.cond()));
    if (tr) { await tr.run(); return; }
    const w = (m.warps || []).find((t) => t.x === P.x && t.y === P.y);
    if (w) { await G.warp(w.to, w.tx, w.ty, w.dir || P.dir); return; }
    // 트레이너 시야
    for (const n of npcsOf(m)) {
      if (!n.trainer || P.flags["beat_" + n.id]) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let k = 1; k <= (n.trainer.sight || 3); k++) {
        const x = n.x + dx * k, y = n.y + dy * k;
        if (SOLID.has(tileAt(m, x, y))) break;
        if (x === P.x && y === P.y) { bubble = n; await sleep(600); bubble = null; P.dir = OPP[n.dir]; await n.talk(n); return; }
        if (npcAt(m, x, y)) break;
      }
    }
    if (ENC_TILES.has(tileAt(m, P.x, P.y)) && m.encounter && Math.random() < (m.encounter.rate || 0.1)) {
      const e = m.encounter; let id;
      if (e.table) { const tot = e.table.reduce((a, [, w]) => a + w, 0); let r = Math.random() * tot; for (const [mid, w] of e.table) { r -= w; if (r <= 0) { id = mid; break; } } id = id || e.table[0][0]; }
      else id = e.mons[rnd(e.mons.length)];
      await G.battle({ kind: "wild", team: [id], chapters: e.chapters });
    }
  }
  function updateField() {
    if (mv) {
      mv.t += 2;
      if (mv.t >= TS) {
        P.x += mv.dx; P.y += mv.dy; const d = mv; mv = null;
        if (d.scripted) d.done(); else runScript(afterStep);
      }
      return;
    }
    if (G.busy || handler) return;
    const d = heldDir(); if (!d) return;
    P.dir = d; const [dx, dy] = DIRS[d];
    if (walkable(curMap(), P.x + dx, P.y + dy)) mv = { dx, dy, t: 0 };
  }

  /* ---------------- 렌더링 ---------------- */
  function drawField() {
    const m = curMap(); const w = m.tiles[0].length, h = m.tiles.length;
    let ppx = P.x * TS + (mv ? mv.dx * mv.t : 0), ppy = P.y * TS + (mv ? mv.dy * mv.t : 0);
    let cx = ppx - 72, cy = ppy - 64;
    if (w * TS <= VW * TS) cx = (w * TS - VW * TS) / 2; else cx = Math.max(0, Math.min(cx, w * TS - VW * TS));
    if (h * TS <= VH * TS) cy = (h * TS - VH * TS) / 2; else cy = Math.max(0, Math.min(cy, h * TS - VH * TS));
    cx = Math.round(cx); cy = Math.round(cy);
    const tx0 = Math.floor(cx / TS), ty0 = Math.floor(cy / TS);
    for (let ty = ty0; ty <= ty0 + VH + 1; ty++) for (let tx = tx0; tx <= tx0 + VW + 1; tx++) {
      const t = tileAt(m, tx, ty); ctx.drawImage(TILES[t] || TILES[" "], tx * TS - cx, ty * TS - cy);
    }
    const step = mv ? (Math.floor(mv.t / 8) % 2 ? 1 : 2) : 0;
    const actors = npcsOf(m).map((n) => ({ y: n.y * TS, f: () => drawPerson(ctx, n.x * TS - cx, n.y * TS - cy - 2, n.dir, 0, n.look) }));
    actors.push({ y: ppy, f: () => drawPerson(ctx, ppx - cx, ppy - cy - 2, P.dir, step, { hair: "#5a3018", shirt: "#e03030", pants: "#3050a0", hat: "#e03030" }) });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.f());
    if (bubble) { const bx = bubble.x * TS - cx + 4, by = bubble.y * TS - cy - 14; ctx.fillStyle = "#fff"; ctx.fillRect(bx, by, 9, 11); ctx.fillStyle = "#000"; ctx.fillRect(bx + 3, by + 2, 3, 5); ctx.fillRect(bx + 3, by + 8, 3, 2); }
  }
  /* 전투 상태 */
  let B = null;
  function hpBar(x, y, w, hp, max) { ctx.fillStyle = "#203820"; ctx.fillRect(x, y, w + 2, 5); ctx.fillStyle = "#f8f8e8"; ctx.fillRect(x + 1, y + 1, w, 3); const k = Math.max(0, hp / max); ctx.fillStyle = k > 0.5 ? "#30c040" : k > 0.2 ? "#e0c020" : "#e03030"; ctx.fillRect(x + 1, y + 1, Math.round(w * k), 3); }
  function text(s, x, y, size = 7, col = "#203820", bold = true) { ctx.fillStyle = col; ctx.font = `${bold ? "bold " : ""}${size}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`; ctx.fillText(s, x, y); }
  function drawBattle() {
    ctx.fillStyle = "#f8f8e8"; ctx.fillRect(0, 0, 160, 144);
    ctx.fillStyle = "#d8e8c0"; ctx.beginPath(); ctx.ellipse(118, 58, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(42, 116, 38, 9, 0, 0, Math.PI * 2); ctx.fill();
    if (B.enemy && B.eVisible) {
      const sh = B.eShake > 0 ? (B.eShake-- % 4 < 2 ? 3 : -3) : 0;
      if (!(B.eBlink > 0 && (B.eBlink-- % 6) < 3)) ctx.drawImage(monSprite(B.enemy.id), 98 + sh + B.eSlide, 14);
      ctx.fillStyle = "#203820"; ctx.fillRect(4, 6, 78, 26); ctx.fillStyle = "#f8f8e8"; ctx.fillRect(5, 7, 76, 24);
      text(NM(B.enemy), 8, 16); text("HP", 8, 26, 6); hpBar(20, 22, 56, B.ehp, B.emax);
    }
    const psh = B.pShake > 0 ? (B.pShake-- % 4 < 2 ? 3 : -3) : 0;
    ctx.save(); ctx.translate(18 + psh, 70); ctx.scale(3, 3); drawPerson(ctx, 0, 0, "up", 0, { hair: "#5a3018", shirt: "#e03030", pants: "#3050a0", hat: "#e03030" }); ctx.restore();
    ctx.fillStyle = "#203820"; ctx.fillRect(76, 98, 80, 38); ctx.fillStyle = "#f8f8e8"; ctx.fillRect(77, 99, 78, 36);
    text(`LINK  Lv${P.lv}`, 80, 108); text("HP", 80, 118, 6); hpBar(92, 114, 58, P.hp, maxHP());
    text(`${P.hp}/${maxHP()}`, 118, 126, 6); text(`${P.ltssm} G${P.gen} x${P.width}`, 80, 133, 5.5, "#507050");
    if (B.title) text(B.title, 4, 46, 6, "#806020");
  }
  function drawTitle() {
    ctx.fillStyle = "#1b2a1b"; ctx.fillRect(0, 0, 160, 144);
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? "#2c4a2c" : "#244024"; ctx.fillRect(0, 100 + ((i * 7 + animT / 2) % 44), 160, 1); }
    text("SPEC 몬스터", 30, 40, 16, "#f0c040"); text("골드 · PCIe/CXL 편", 40, 56, 9, "#f8f8e8");
    ctx.drawImage(monSprite("ltssmdrake"), 60, 64);
  }
  let lastT = performance.now();
  function frame() {
    animT++;
    const now = performance.now(), dt = Math.min(1000, now - lastT); lastT = now;
    if (P && (G.mode === "field" || G.mode === "battle") && !document.hidden) P.playMs = (P.playMs || 0) + dt;
    ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.imageSmoothingEnabled = false;
    if (G.mode === "field") { updateField(); drawField(); }
    else if (G.mode === "battle" && B) drawBattle();
    else drawTitle();
    if (fadeA > 0) { ctx.fillStyle = `rgba(0,0,0,${fadeA})`; ctx.fillRect(0, 0, 160, 144); }
    if (flashA > 0) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 160, 144); }
    requestAnimationFrame(frame);
  }

  /* ---------------- 학습 / 성장 ---------------- */
  const LT = S.LTSSM;
  const ruleN = (rid) => (P.rules[rid] || 0);
  const ruleOK = (rid) => ruleN(rid) >= LT.RULE_NEED;
  const stateOf = (sid) => LT.STATES.find((s) => s.id === sid);
  const stateDone = (sid) => Object.keys(stateOf(sid).rules).filter(ruleOK).length;
  const stateTot = (sid) => Object.keys(stateOf(sid).rules).length;
  const hasSB = (sid) => P.sbadges.includes(sid);
  G.ruleOK = ruleOK; G.stateDone = stateDone; G.stateTot = stateTot; G.hasSB = hasSB;
  G.learn = async function (ids, silent) {
    if (!Array.isArray(ids)) ids = [ids];
    for (const id of ids) {
      if (P.learned[id] || !S.CONCEPTS[id]) continue;
      P.learned[id] = Date.now();
      if (!silent) await G.say(`📗 spec 도감에 「${S.CONCEPTS[id].name}」 등록!\n${S.CONCEPTS[id].note}`);
    }
    await G.checkGrowth();
  };
  const RATE = { 1: "2.5 GT/s · 8b/10b", 2: "5.0 GT/s · 8b/10b", 3: "8.0 GT/s · 128b/130b", 4: "16.0 GT/s · 128b/130b", 5: "32.0 GT/s · 128b/130b", 6: "64.0 GT/s · PAM4 1b/1b · FLIT", 7: "128.0 GT/s · PAM4 1b/1b · FLIT" };
  const L = (id) => !!P.learned[id];
  const LT_ORDER = ["Detect", "Polling", "Configuration", "L0"];
  G.setLTSSM = async function (st, msg) { if (LT_ORDER.indexOf(st) <= LT_ORDER.indexOf(P.ltssm)) return; P.ltssm = st; await G.say(msg || `🔗 LTSSM 상태가 ${st}(으)로 전이했다!`); await G.checkGrowth(); };
  const moveReqText = (m) => m.req ? t(`「${SN(stateOf(m.req.s))}」 규칙 ${m.req.n}개 습득`, `${m.req.n} rules of ${SN(stateOf(m.req.s))}`) : m.concept ? `「${S.CONCEPTS[m.concept].name}」 개념 학습` : "";
  const moveReqMet = (m) => m.req ? stateDone(m.req.s) >= m.req.n : m.concept ? L(m.concept) : true;
  G.checkGrowth = async function () {
    // LTSSM 진행 = state 배지
    if (hasSB("det") && P.ltssm === "Detect") await G.setLTSSM("Polling", "🔗 LTSSM: Detect → Polling\n상대 Receiver 감지 완료! 이제 TS1/TS2로 lock을 맞출 차례.");
    if (hasSB("pol") && P.ltssm === "Polling") await G.setLTSSM("Configuration", "🔗 LTSSM: Polling → Configuration\nbit/symbol lock 성공! Link·Lane 번호를 정하자.");
    if ((hasSB("cfg") || P.badges.includes("l0")) && P.ltssm !== "L0") await G.setLTSSM("L0", "🔗 LTSSM: Configuration → L0 (2.5 GT/s)\n링크 업! 속도는 Recovery를 거쳐 올린다.");
    // Link 폭: L0 이후 레벨에 따라
    let w = 1;
    if (P.ltssm === "L0") w = P.lv >= 12 ? 16 : P.lv >= 8 ? 8 : P.lv >= 5 ? 4 : P.lv >= 3 ? 2 : 1;
    if (w > P.width) { P.width = w; await G.say(`↔️ Configuration 재협상! Link 폭이 x${w}(으)로 넓어졌다.\n(폭 2배 = 대역폭 2배)`); }
    // Gen 속도: Recovery 배지(속도 변경) · Equalization 배지(8 GT/s+) · L0p 배지(Flit) 필요
    let g = 1;
    if (P.ltssm === "L0") {
      const recOK = hasSB("rec") || P.badges.includes("l0"), eqOK = hasSB("eq") || (P.badges.includes("l0") && L("equalization"));
      if (P.lv >= 3 && recOK) g = 2;
      if (g >= 2 && P.lv >= 5 && eqOK) g = 3;
      if (g >= 3 && P.lv >= 7) g = 4;
      if (g >= 4 && P.lv >= 9) g = 5;
      if (g >= 5 && P.lv >= 11 && (hasSB("l0p") || (L("pam4") && L("flit")))) g = 6;
      if (g >= 6 && P.lv >= 13 && hasSB("l0p")) g = 7;
    }
    if (g > P.gen) {
      P.gen = g;
      await G.say([`⚡ Recovery.Speed 진입${g >= 3 ? " → Recovery.Equalization" : ""}...`, `Link가 Gen${g} (${RATE[g]})(으)로 속도를 올렸다! 공격력 상승!`]);
    }
    for (const mo of S.MOVES) {
      if (P.moves.includes(mo.id)) continue;
      if (P.lv >= mo.lv && moveReqMet(mo)) { P.moves.push(mo.id); window.LUI && LUI.sfx("rule"); await G.say(t(`✨ Link는 새 기술 「${mo.name}」을(를) 익혔다!`, `✨ Link learned ${mo.name}!`) + `\n${MD(mo)}`); }
    }
  };
  G.gainXP = async function (n, note) {
    P.xp += n; await G.say(t(`경험치 ${n}을(를) 얻었다!`, `Gained ${n} EXP!`) + (note ? "\n" + note : ""));
    while (P.xp >= xpNeed(P.lv)) {
      P.xp -= xpNeed(P.lv); P.lv++; P.hp = maxHP(); /* 레벨 업 = HP 100% 회복 */
      window.LUI && LUI.sfx("levelup"); levelFx();
      const gl = (S.LTSSM.TOWNS || []).find((T) => T.gymLv === P.lv);
      await G.say(t(`🎉 레벨 업! Lv${P.lv}  💚 HP 완전 회복! (${P.hp}/${maxHP()})`, `🎉 Level up! Lv${P.lv}  💚 HP fully restored! (${P.hp}/${maxHP()})`) + (P.lv === 10 ? t("\n🏟 Lv10! 핵심 배지를 모으면 LTSSM 관장에게 도전할 수 있다.", "\n🏟 Lv10! Collect the core badges to challenge the LTSSM leader.") : gl ? t(`\n🏟 Lv${P.lv}! ${gl.ko} 관장 도전 레벨 달성.`, `\n🏟 Lv${P.lv}! Level reached for the ${gl.en} leader.`) : ""));
    }
    const blocked = S.MOVES.find((m) => !P.moves.includes(m.id) && P.lv >= m.lv && !moveReqMet(m) && m.req);
    await G.checkGrowth(); await G.checkAch();
    if (blocked && !moveReqMet(blocked) && Math.random() < 0.5) await G.say(t(`💡 「${blocked.name}」: 레벨은 충분! ${moveReqText(blocked)}이 필요하다.`, `💡 ${blocked.name}: level OK! Needs ${moveReqText(blocked)}.`));
  };
  function levelFx() { const sc = $("screen"); const d = document.createElement("div"); d.className = "lvfx"; d.innerHTML = "LEVEL UP!<small>HP 100%</small>"; sc.appendChild(d); setTimeout(() => d.remove(), 1400); }
  G.giveItem = async function (id, n = 1, silent) { P.items[id] = (P.items[id] || 0) + n; if (!silent) await G.say(t(`🎒 「${IN(S.ITEMS[id])}」 ×${n}을(를) 받았다!`, `🎒 Got ${IN(S.ITEMS[id])} ×${n}!`) + `\n${ID(S.ITEMS[id])}`); };
  G.heal = () => { P.hp = maxHP(); };
  G.addBadge = (b) => { if (!P.badges.includes(b)) P.badges.push(b); };

  /* 규칙 습득 / state 배지 */
  async function ruleProgress(rid) {
    const before = ruleOK(rid); P.rules[rid] = Math.min(99, ruleN(rid) + 1);
    if (before || !ruleOK(rid)) return;
    const r = LT.RULES[rid], st = stateOf(r.state);
    window.LUI && LUI.sfx("rule");
    window.LUI && LUI.toast(`📜 ${t("규칙 습득", "Rule learned")} <b>${SN(st)}</b> ${stateDone(st.id)}/${stateTot(st.id)}<br><small>${RT(rid)}</small>`, "rule");
    if (stateDone(st.id) === stateTot(st.id) && !hasSB(st.id)) {
      P.sbadges.push(st.id);
      await sleep(300);
      await LUI.badgePopup(st, t(`${SN(st)} 배지 획득!`, `${SN(st)} badge!`), t(`${SN(st)}의 규칙 ${stateTot(st.id)}개를 모두 익혔다`, `Learned all ${stateTot(st.id)} rules of ${SN(st)}`));
      clearConsole();
      await G.checkGrowth();
    }
  }
  /* 업적 */
  const totals = () => { let n = 0, ok = 0, mq = 0; Object.values(P.seenQ).forEach((v) => { n += v.n; ok += v.ok; if ((v.st || 0) >= 3) mq++; }); return { n, ok, mq }; };
  G.totals = totals;
  const ACH_CHECK = {
    first_win: () => P.wins >= 1, streak5: () => P.st.bs >= 5, streak10: () => P.st.bs >= 10, streak25: () => P.st.bs >= 25,
    c50: () => totals().ok >= 50, c100: () => totals().ok >= 100, c300: () => totals().ok >= 300,
    perfect1: () => P.st.pf >= 1, perfect10: () => P.st.pf >= 10, first_badge: () => P.sbadges.length >= 1, det_master: () => hasSB("det"),
    core5: () => LT.CORE.every(hasSB), all_states: () => LT.STATES.filter((s) => (s.town || 1) === 1).every((s) => hasSB(s.id)), lv10: () => P.lv >= 10,
    gym_win: () => !!P.flags.beat_leader1, gym_nodmg: () => !!P.flags.gym_nodmg, q20: () => totals().mq >= 20,
    dex_all: () => LT.LMON.filter((m) => !m.boss && (m.town || 1) === 1).every((m) => P.met.includes(m.id))
  };
  G.checkAch = async function () {
    for (const a of LT.ACH) {
      const chk = ACH_CHECK[a.id] || (a.test && (() => a.test(P)));
      if (P.ach.includes(a.id) || !chk || !chk()) continue;
      P.ach.push(a.id); if (!P.title) P.title = a.title;
      window.LUI && (LUI.sfx("ach"), LUI.toast(`🏆 업적 「${a.name}」<br><small>칭호 「${a.title}」 획득</small>`, "ach"));
      await sleep(250);
    }
  };

  /* ---------------- 문제 선택 ---------------- */
  const levelMaxD = () => (P.lv <= 2 ? 1 : P.lv <= 6 ? 2 : 3);
  const recent = [];
  function pickLQ(opt, m) {
    const maxD = opt.maxD || levelMaxD(), minD = Math.min(opt.minD || 1, maxD);
    let fams = m && m.fam ? [m.fam] : opt.fams || LT.CORE;
    let base = [].concat(...fams.map((f) => LT.LQ_BY_FAM[f] || []));
    if (!base.length) base = LT.LQ.slice(); // 빈 풀 방지
    let pool = base.filter((q) => q.d >= minD && q.d <= maxD && !recent.includes(q.id));
    if (pool.length < 3) pool = base.filter((q) => q.d <= Math.max(maxD, 2) && !recent.includes(q.id));
    if (!pool.length) pool = base.filter((q) => !recent.includes(q.id));
    if (!pool.length) pool = base;
    const focus = (m && m.rules) || [];
    const wts = pool.map((q) => { const s = P.seenQ[q.id]; let w = 1; if (!ruleOK(q.rule)) w *= 4; if (focus.includes(q.rule)) w *= 3; if (!s) w *= 3; else if ((s.st || 0) === 0 && s.n > s.ok) w *= 5; else if ((s.st || 0) >= 3) w *= 0.4; return w; });
    let r = Math.random() * wts.reduce((a, b) => a + b, 0), q = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= wts[i]; if (r <= 0) { q = pool[i]; break; } }
    recent.push(q.id); if (recent.length > 15) recent.shift(); return q;
  }
  const validQ = (q) => q && typeof q.q === "string" && q.q && Array.isArray(q.c) && q.c.length === 4 && q.a >= 0 && q.a < 4;
  function pickQuestion(opt, m) {
    opt = opt || {};
    let q = null;
    try { q = pickQuestion0(opt, m); } catch (e) { console.error("pickQuestion", e); }
    if (!validQ(q)) { const all = LT.LQ.filter(validQ); q = all[rnd(all.length)]; } // 어떤 경우에도 문제는 나온다
    G.lastQ = q; return q;
  }
  function pickQuestion0(opt, m) {
    if ((m && m.ltssm) || opt.fams || !Array.isArray(opt.chapters) || !opt.chapters.length) return pickLQ(opt, m);
    const maxD = opt.maxD || levelMaxD(), minD = Math.min(opt.minD || 1, maxD);
    let pool = S.QUESTIONS.filter((q) => opt.chapters.includes(q.ch) && q.d >= minD && q.d <= maxD && !recent.includes(q.id));
    if (!pool.length) pool = S.QUESTIONS.filter((q) => opt.chapters.includes(q.ch) && !recent.includes(q.id));
    if (!pool.length) pool = S.QUESTIONS.filter((q) => opt.chapters.includes(q.ch));
    if (!pool.length) return pickLQ(opt, m);
    const weighted = []; pool.forEach((q) => { const s = P.seenQ[q.id]; const w = !s ? 4 : (s.st || 0) === 0 && s.n > s.ok ? 5 : s.ok >= 2 ? 1 : 2; for (let i = 0; i < w; i++) weighted.push(q); });
    const q = weighted[rnd(weighted.length)]; recent.push(q.id); if (recent.length > 12) recent.shift(); return q;
  }
  G.pickQuestion = pickQuestion;

  /* ---------------- 전투 ---------------- */
  // opt: { kind: 'wild'|'trainer'|'boss', team:[monId], chapters:[ch], fams:[state], trainer:'이름', minD, maxD, xp, onStart }
  /* 전투 중 예외가 나도 전투 모드에 갇히지 않도록 래핑 */
  G.battle = async function (opt) {
    opt = Object.assign({ kind: "wild", team: [] }, opt); opt.team = (opt.team || []).filter((id) => S.MONSTERS[id]);
    if (!opt.team.length) { console.error("battle: empty team"); return "run"; }
    sanitize();
    const prevMode = G.mode === "battle" ? "field" : G.mode;
    try { return await battle0(opt, prevMode); }
    catch (e) {
      console.error("battle error", e); handler = null; document.body.classList.remove("battle"); clearConsole();
      B = null; fadeA = 0; G.mode = prevMode === "title" ? "field" : prevMode; G.save(); return "run";
    }
  };
  async function battle0(opt, prevMode) {
    await flash(3); G.mode = "battle"; document.body.classList.add("battle");
    B = { enemy: null, ehp: 0, emax: 0, eShake: 0, pShake: 0, eBlink: 0, eSlide: 60, eVisible: true, replay: false, wrong: 0, combo: 0, dmgTaken: 0,
      title: opt.kind === "boss" ? "★ 관장전 ★" : opt.kind === "trainer" ? "트레이너 배틀" : "" };
    let result = "win";
    outer: for (let ti = 0; ti < opt.team.length; ti++) {
      const id = opt.team[ti], m = S.MONSTERS[id];
      if (m.ltssm && !P.met.includes(id)) P.met.push(id);
      const hp = m.ltssm ? Math.round(14 + 3 * P.lv + (m.boss ? 18 + 2 * P.lv : 0) + (opt.kind !== "wild" ? 4 : 0)) : m.hp;
      const atk = m.ltssm ? Math.round(4 + P.lv * 0.9 + (m.boss ? 3 : 0)) : m.atk;
      B.enemy = Object.assign({ id }, m, { atk }); B.emax = B.ehp = hp; B.eVisible = true; B.eSlide = 60;
      for (let k = 0; k < 15; k++) { B.eSlide -= 4; await sleep(16); } B.eSlide = 0;
      const msub = t(m.sub, m.subEn), trn = Array.isArray(opt.trainer) ? t(opt.trainer[0], opt.trainer[1]) : opt.trainer;
      await G.say(opt.kind === "wild" ? t(`야생의 ${NM(m)}이(가) 나타났다!`, `A wild ${NM(m)} appeared!`) + (msub ? `\n(${msub})` : "") : t(`${trn}은(는) ${NM(m)}을(를) 내보냈다!`, `${trn} sent out ${NM(m)}!`));
      while (B.ehp > 0 && P.hp > 0) {
        const acts = [t("기술", "Moves"), t("가방", "Bag"), t("도망", "Run")];
        const a = await G.choose(acts, { prompt: `${NM(m)}  HP ${B.ehp}/${B.emax}${P.st.cs >= 2 ? `   🔥${P.st.cs} ${t("콤보", "combo")}` : ""}\n${t("무엇을 할까?", "What will you do?")}`, grid: true });
        if (a === 0) {
          let ms = P.moves.map((x) => S.MOVES.find((y) => y.id === x)).filter(Boolean);
          if (!ms.length) { sanitize(); ms = P.moves.map((x) => S.MOVES.find((y) => y.id === x)).filter(Boolean); }
          const k = await G.choose(ms.map((x) => x.name), { prompt: t("어떤 기술을 쓸까?", "Which move?"), cancel: true, grid: ms.length > 3, hint: (i) => ms[i] && MD(ms[i]) });
          if (k < 0 || !ms[k]) continue;
          await quizTurn(ms[k], opt, B.enemy);
        } else if (a === 1) {
          const used = await battleBag(); if (!used) continue;
        } else {
          if (opt.kind === "wild") { await G.say(t("무사히 도망쳤다! (Link를 잠시 Electrical Idle로...)", "Got away safely! (Link went Electrical Idle...)")); result = "run"; break outer; }
          await G.say(t("트레이너와의 승부에서는 도망칠 수 없다!", "You can't run from a trainer battle!"));
        }
      }
      if (P.hp <= 0) { result = "lose"; break; }
      B.eBlink = 30; await sleep(500); B.eVisible = false;
      await G.say(t(`${NM(m)}을(를) 쓰러뜨렸다!`, `${NM(m)} was defeated!`));
      const tw = Math.max(0, Math.min(10, m.town || 1) - 1);
      let xp = opt.xp ? Math.round(opt.xp / opt.team.length) : m.ltssm ? 5 + 5 * tw + (opt.kind !== "wild" ? 4 + 2 * tw : 0) + (m.boss ? 12 + 6 * tw : 0) : 6 + m.ch * 4 + (m.boss ? 15 : 0);
      const notes = [];
      if (B.combo) { notes.push(`🔥 ${t("콤보 보너스", "Combo bonus")} +${B.combo}`); xp += B.combo; }
      if (ti === opt.team.length - 1 && B.wrong === 0) { const bonus = Math.max(2, Math.round(xp * 0.3)); xp += bonus; P.st.pf++; notes.push(`✨ ${t("퍼펙트 배틀!", "Perfect battle!")} +${bonus}`); }
      B.combo = 0;
      await G.gainXP(xp, notes.join("  "));
    }
    document.body.classList.remove("battle");
    if (result === "lose") {
      P.st.cs = 0;
      await G.say([t("Link Down... 눈앞이 캄캄해졌다!", "Link Down... everything went dark!"), t("🔁 Hot Reset! 회복 센터에서 깨어났다.", "🔁 Hot Reset! You woke up at the recovery center.")]);
      P.hp = maxHP(); B = null; G.mode = "field"; const rs = (G.respawn && G.respawn()) || ["center", 4, 4]; await G.warp(rs[0], rs[1], rs[2], "up");
      return "lose";
    }
    if (result === "win") { P.wins++; if (opt.kind === "boss" && B.dmgTaken === 0) P.flags.gym_nodmg_pending = true; }
    await G.fade(1); B = null; G.mode = prevMode; await G.fade(0);
    await G.checkAch();
    G.save(); return result;
  }
  async function battleBag() {
    const ids = Object.keys(P.items).filter((k) => P.items[k] > 0 && S.ITEMS[k].kind !== "key");
    if (!ids.length) { await G.say(t("쓸 수 있는 아이템이 없다.", "No usable items.")); return false; }
    const k = await G.choose(ids.map((i) => `${IN(S.ITEMS[i])} ×${P.items[i]}`), { prompt: t("어떤 아이템을 쓸까?", "Which item?"), cancel: true, hint: (i) => ID(S.ITEMS[ids[i]]) });
    if (k < 0) return false;
    return useItem(ids[k], true);
  }
  async function useItem(id, inBattle) {
    const it = S.ITEMS[id];
    if (it.heal) { if (P.hp >= maxHP()) { await G.say(t("HP가 이미 가득하다.", "HP is already full.")); return false; } const before = P.hp; P.hp = Math.min(maxHP(), P.hp + it.heal); P.items[id]--; await G.say(t(`${IN(it)} 사용! HP ${P.hp - before} 회복.`, `Used ${IN(it)}! Recovered ${P.hp - before} HP.`)); return true; }
    if (id === "replay_buf") { if (!inBattle) { await G.say(t("전투 중에만 쓸 수 있다.", "Only usable in battle.")); return false; } B.replay = true; P.items[id]--; await G.say(t("Replay Buffer 장전! 다음 오답은 Nak → 재전송으로 한 번 더 도전할 수 있다.", "Replay Buffer loaded! Your next wrong answer gets a Nak → replay retry.")); return true; }
    if (id === "msix_table") { await G.say(["📨 MSI-X vector로 Root 박사님께 Memory Write 인터럽트 전송!", G.hint ? G.hint() : "..."], "Root 박사"); return false; }
    await G.say(ID(it)); return false;
  }
  G.useItem = useItem;
  const qStatHTML = (s) => !s ? `<span class="tag new">NEW</span>` : `<span class="tag ok">✓${s.ok}</span><span class="tag ng">✗${s.n - s.ok}</span>${(s.st || 0) >= 3 ? `<span class="tag ms">👑 마스터</span>` : (s.st || 0) > 0 ? `<span class="tag st">연속 ${s.st}</span>` : ""}`;
  /* 문제 현지화: q.en이 있으면 영어, 없으면(1번 마을) 한국어 원문 */
  const loc = (q) => (G.lang === "en" && q.en ? { q: q.en.q, c: q.en.c, e: q.en.e } : { q: q.q, c: q.c, e: q.e });
  G.locQ = loc;
  async function quizTurn(move, opt, m) {
    move = move || S.MOVES.find((x) => x.id === BASE_MOVE);
    const q0 = pickQuestion(opt, m), L0 = loc(q0), q = Object.assign({}, q0, { q: L0.q, c: L0.c, e: L0.e });
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const labels = order.map((i) => q.c[i]); const correct = order.indexOf(q.a);
    const dis = new Set(); const wrong = [0, 1, 2, 3].filter((i) => i !== correct).sort(() => Math.random() - 0.5);
    if (move.effect === "elim") dis.add(wrong[0]); if (move.effect === "elim2") { dis.add(wrong[0]); dis.add(wrong[1]); }
    let replay = move.effect === "replay" || B.replay; B.replay = false;
    const stars = "★".repeat(q.d) + "☆".repeat(3 - q.d);
    const fs = q.rule && stateOf(q.fam), cc = q.concept && S.CONCEPTS[q.concept];
    const topic = fs ? SN(fs) : cc ? cc.name : "spec";
    const header = `[${move.name}] ${topic} · ${stars}`;
    const s0 = P.seenQ[q.id];
    const ruleTag = (q.rule ? ` <span class="tag rl">${t("규칙", "Rule")} ${Math.min(ruleN(q.rule), LT.RULE_NEED)}/${LT.RULE_NEED}${ruleOK(q.rule) ? " ✔" : ""}</span>` : "") + " " + tagHTML(q.tag || (fs && fs.tag) || "PCIe");
    const grid = labels.every((l) => l.length <= 13);
    let pick;
    while (true) {
      pick = await G.choose(labels, { header, prompt: q.q, sub: qStatHTML(s0) + ruleTag, disabled: dis, quiz: true, grid });
      if (pick === correct || !replay) break;
      dis.add(pick); replay = false; G.markChoices(-1, pick); await sleep(250);
      await G.say(t("❌ 오답... 하지만 재전송! 한 번 더!", "❌ Wrong... but replay! Try again!"));
    }
    const ok = pick === correct; G.markChoices(correct, pick);
    const s = (P.seenQ[q.id] = P.seenQ[q.id] || { n: 0, ok: 0, st: 0 }); s.n++; if (ok) { s.ok++; s.st = (s.st || 0) + 1; } else s.st = 0;
    if (q.concept) { const ms = (P.mastery[q.concept] = P.mastery[q.concept] || { n: 0, ok: 0 }); ms.n++; if (ok) ms.ok++; }
    if (ok) { P.st.cs++; P.st.bs = Math.max(P.st.bs, P.st.cs); } else { P.st.cs = 0; B.wrong++; }
    window.LUI && LUI.sfx(ok ? (P.st.cs >= 3 ? "combo" : "ok") : "ng");
    await sleep(350);
    const newMaster = ok && s.st === 3;
    const statLine = `✓${s.ok} ✗${s.n - s.ok}${newMaster ? t("  👑 이 문제 마스터!", "  👑 Question mastered!") : s.st >= 3 ? "  👑" : ""}${ok && P.st.cs >= 3 ? `  🔥 ${P.st.cs} ${t("콤보!", "combo!")}` : ""}`;
    await G.say([`${ok ? t("⭕ 정답!", "⭕ Correct!") : t("❌ 오답!", "❌ Wrong!")}  ${t("정답", "Answer")}: ${q.c[q.a]}\n${statLine}`, `📘 ${q.e}`]);
    if (q.concept && !P.learned[q.concept]) await G.learn(q.concept);
    if (ok && q.rule) await ruleProgress(q.rule);
    if (ok) {
      if (P.st.cs >= 3) B.combo = Math.min(5, B.combo + 1);
      let pow = move.power;
      if (move.effect === "lanes") pow += 4 * Math.log2(P.width) + 2;
      if (move.effect === "diff") pow = 7 + 6 * q.d;
      const mult = (1 + 0.12 * (P.gen - 1) + 0.06 * Math.log2(P.width)) * (P.st.cs >= 5 ? 1.15 : 1);
      const dmg = Math.max(1, Math.round((pow + P.lv * 1.5) * mult * (0.9 + Math.random() * 0.2)));
      B.eShake = 20; B.ehp = Math.max(0, B.ehp - dmg);
      let msg = t(`Link의 「${move.name}」! ${NM(m)}에게 ${dmg} 데미지!${P.st.cs >= 5 ? " (콤보 강화)" : ""}`, `Link used ${move.name}! ${dmg} damage to ${NM(m)}!${P.st.cs >= 5 ? " (combo boost)" : ""}`);
      if (move.effect === "heal") { const h = Math.round(maxHP() * (move.heal || 0.35)); const b = P.hp; P.hp = Math.min(maxHP(), P.hp + h); msg += t(`\nHP ${P.hp - b} 회복!`, `\nRecovered ${P.hp - b} HP!`); }
      await G.say(msg);
    } else {
      let dmg = m.atk + rnd(3);
      if (move.effect === "risky") dmg = Math.round(dmg * 1.5);
      if (move.effect === "fec") dmg = Math.round(dmg * 0.5);
      B.pShake = 20; P.hp = Math.max(0, P.hp - dmg); B.dmgTaken += dmg;
      let msg = t(`${NM(m)}의 반격! Link는 ${dmg} 데미지를 받았다.${move.effect === "fec" ? " (피해 절반)" : ""}`, `${NM(m)} strikes back! Link took ${dmg} damage.${move.effect === "fec" ? " (halved)" : ""}`);
      if (move.effect === "echo") { const r = Math.max(1, Math.round(dmg / 2)); B.ehp = Math.max(0, B.ehp - r); B.eShake = 20; msg += t(`\nLoopback 에코! ${r} 데미지를 되돌려 보냈다.`, `\nLoopback echo! Reflected ${r} damage.`); }
      await G.say(msg);
    }
    await G.checkAch();
  }

  /* ---------------- 필드 메뉴 ---------------- */
  /* 마을 진행: 마을 n은 이전 관장 배지가 있으면 열림 */
  const TOWNS = () => [{ n: 1, ko: "LTSSM 마을", en: "LTSSM Town", gymLv: 10, badge: Object.assign({ isMaster: true }, LT.MASTER) }].concat(LT.TOWNS || []);
  const gymBadgeOf = (n) => (n === 1 ? "l0" : "g" + n);
  const townOpen = (n) => n === 1 || P.badges.includes(gymBadgeOf(n - 1));
  const townCleared = (n) => P.badges.includes(gymBadgeOf(n));
  const statesOf = (n) => LT.STATES.filter((st) => (st.town || 1) === n);
  const townProgress = (n) => { let d = 0, tt = 0; statesOf(n).forEach((st) => { d += stateDone(st.id); tt += stateTot(st.id); }); return tt ? d / tt : 0; };
  const townName = (T) => t(T.ko, T.en);
  G.townOpen = townOpen; G.townCleared = townCleared; G.townProgress = townProgress; G.statesOf = statesOf; G.TOWNS = TOWNS; G.gymBadgeOf = gymBadgeOf;
  G.curTown = () => { const m = curMap(); return (m && m.town) || 1; };
  /* 여러 마을이 열려 있으면 마을을 먼저 고른다 (-1 = 취소) */
  async function pickTown(title) {
    const open = TOWNS().filter((T) => townOpen(T.n));
    if (open.length <= 1) return 1;
    const cur = G.curTown(), labels = open.map((T) => `${T.n}. ${townName(T)}  ${Math.round(townProgress(T.n) * 100)}%${townCleared(T.n) ? " 🏅" : ""}${T.n === cur ? " 📍" : ""}`);
    const k = await G.choose(labels, { prompt: title, cancel: true });
    return k < 0 ? -1 : open[k].n;
  }
  async function fieldMenu() {
    while (true) {
      const ext = G.menuExtras || [];
      const base = [t("Link 상태", "Status"), t("월드맵", "World map"), t("규칙 도감", "Rule dex"), t("배지 케이스", "Badges"), t("몬스터 도감", "Monster dex"), t("업적·칭호", "Achievements"), t("기록", "Stats"), t("기술", "Moves"), t("가방", "Bag"), t("저장", "Save"), "Language: " + (G.lang === "en" ? "English" : "한국어")];
      const k = await G.choose(base.concat(ext.map((e) => e.label), [t("닫기", "Close")]), { prompt: t("메뉴", "Menu"), cancel: true, grid: true });
      const nb = base.length;
      if (k >= nb && k < nb + ext.length) { const r = await ext[k - nb].run(); if (r === "close") return; continue; }
      if (k === 0) await statusPanel();
      else if (k === 1) { if (G.worldMap) { const r = await G.worldMap(); if (r === "close") return; } }
      else if (k === 2) await ruleDex();
      else if (k === 3) await badgeCase();
      else if (k === 4) await monDex();
      else if (k === 5) await achPanel();
      else if (k === 6) await statsPanel();
      else if (k === 7) await movesPanel();
      else if (k === 8) await bagPanel();
      else if (k === 9) { G.save(); await G.say(t("💾 진행 상황을 저장했다. (localStorage)", "💾 Progress saved (localStorage).")); }
      else if (k === 10) { G.setLang(G.lang === "en" ? "ko" : "en"); }
      else return;
    }
  }
  G.fieldMenu = fieldMenu;
  async function statusPanel() {
    const cur = TOWNS().find((T) => T.n === G.curTown()) || TOWNS()[0];
    const gyms = P.badges.map((b) => { const T = TOWNS().find((x) => gymBadgeOf(x.n) === b); return T ? townName(T) : b === "champ" ? t("챔피언", "Champion") : b === "dl" ? "DL_Active(legacy)" : b; });
    const items = [
      { label: `Lv ${P.lv}   EXP ${P.xp}/${xpNeed(P.lv)}`, bar: P.xp / xpNeed(P.lv), desc: t("정답으로 몬스터를 쓰러뜨리면 경험치를 얻는다. 콤보·퍼펙트 배틀이면 보너스!", "Defeat monsters with correct answers for EXP. Combos and perfect battles give bonuses!") },
      { label: `HP ${P.hp}/${maxHP()}`, bar: P.hp / maxHP(), desc: t("오답을 고르면 몬스터의 반격으로 HP가 줄어든다. 0이 되면 Link Down → Hot Reset.", "Wrong answers let the monster strike back. At 0 HP: Link Down → Hot Reset.") },
      { label: `${t("칭호", "Title")}: ${P.title || "-"}`, desc: t("업적을 달성하면 칭호를 얻는다.", "Achievements unlock titles.") },
      { label: `${t("현재 마을", "Town")}: ${cur.n}. ${townName(cur)}`, bar: townProgress(cur.n), desc: t(`이 마을 규칙 진행 ${Math.round(townProgress(cur.n) * 100)}%`, `Rule progress here ${Math.round(townProgress(cur.n) * 100)}%`) },
      { label: `LTSSM: ${P.ltssm}`, desc: t("Detect 배지 → Polling, Polling 배지 → Configuration, Configuration 배지 → L0(2.5 GT/s).", "Detect badge → Polling, Polling badge → Configuration, Configuration badge → L0 (2.5 GT/s).") },
      { label: `${t("속도", "Speed")}: Gen${P.gen} (${RATE[P.gen]})`, desc: t("L0 이후 Recovery 배지(속도 변경), Equalization 배지(8 GT/s 이상), L0p 배지(Flit, 64/128 GT/s)와 레벨이 필요하다.", "After L0: the Recovery badge (speed change), Equalization badge (8 GT/s+), L0p badge (Flit, 64/128 GT/s) and levels.") },
      { label: `${t("Link 폭", "Link width")}: x${P.width}`, desc: t("L0에 도달한 뒤 레벨에 따라 x1→x2→x4→x8→x16.", "After L0, width grows with level: x1→x2→x4→x8→x16.") },
      { label: `${t("규칙 배지", "Rule badges")}: ${P.sbadges.length}/${LT.STATES.length}`, bar: P.sbadges.length / LT.STATES.length, desc: t("각 규칙 묶음의 규칙을 모두 익히면 배지.", "Learn every rule in a group to earn its badge.") },
      { label: `${t("관장 배지", "Gym badges")}: ${gyms.length ? gyms.join(", ") : "-"}`, desc: t("관장을 이기면 받는다.", "Beat a gym leader to earn one.") }
    ];
    await G.panel(t("Link 상태", "Status"), items);
  }
  async function ruleDex() {
    const tn = await pickTown(t("어느 마을의 규칙 도감?", "Rule dex of which town?")); if (tn < 0) return;
    const items = [];
    statesOf(tn).forEach((st) => {
      const d = stateDone(st.id), tt = stateTot(st.id);
      items.push({ sec: true, label: `${SN(st)}${st.tag ? " [" + (st.tag === "공통" ? t("공통", "Common") : st.tag) + "]" : ""}  ${d}/${tt}${hasSB(st.id) ? " 🏅" : ""}`, icon: LUI.badgeURL(st, !hasSB(st.id), 2), bar: d / tt, cls: "secbar" });
      Object.keys(st.rules).forEach((rid) => {
        const text = RT(rid);
        const n = Math.min(ruleN(rid), LT.RULE_NEED), qs = LT.LQ.filter((q) => q.rule === rid), seen = qs.some((q) => P.seenQ[q.id]);
        const dots = "●".repeat(n) + "○".repeat(LT.RULE_NEED - n);
        const qok = qs.filter((q) => P.seenQ[q.id] && P.seenQ[q.id].ok).length;
        const tags = [...new Set(qs.map((q) => q.tag).filter(Boolean))].map((x) => (x === "공통" ? t("공통", "Common") : x)).join("/");
        items.push({ label: `${dots} ${ruleOK(rid) || seen ? text : t("??? (아직 못 만난 규칙)", "??? (not met yet)")}`, lock: !ruleOK(rid),
          desc: `【${SN(st)}】 ${ruleOK(rid) ? t("✔ 습득", "✔ learned") : `${n}/${LT.RULE_NEED} ${t("정답", "correct")}`}${tags ? "  [" + tags + "]" : ""}\n${ruleOK(rid) || seen ? text : t("이 규칙의 문제를 만나면 내용이 보인다.", "Meet a question on this rule to reveal it.")}\n${t(`관련 문제 ${qs.length}개 중 ${qok}개 맞힘`, `${qok} of ${qs.length} related questions answered correctly`)}`.trim() });
      });
    });
    const rs = statesOf(tn).reduce((a, st) => a.concat(Object.keys(st.rules)), []), done = rs.filter(ruleOK).length;
    await G.panel(`${t("규칙 도감", "Rule dex")} ${tn}${t("번 마을", "")} ${done}/${rs.length}`, items);
  }
  async function badgeCase() {
    const tn = await pickTown(t("어느 마을의 배지 케이스?", "Badges of which town?")); if (tn < 0) return;
    const T = TOWNS().find((x) => x.n === tn);
    const list = statesOf(tn).map((st) => ({ st, got: hasSB(st.id) })).concat([{ st: T.badge, got: P.badges.includes(gymBadgeOf(tn)), gym: true }]);
    if (tn === 10 && LT.CHAMP_BADGE) list.push({ st: LT.CHAMP_BADGE, got: P.badges.includes("champ"), gym: true });
    const items = list.map(({ st, got, gym }) => ({ icon: LUI.badgeURL(st, !got, 3), label: got ? SN(st) : "???", lock: !got, cls: "bslot" + (got ? " got" : ""),
      desc: gym ? (got ? t(`🏆 ${SN(st)} — 관장을 이긴 증표.`, `🏆 ${SN(st)} — proof of beating the leader.`) : t(`관장을 이기면 받는다. (Lv${T.gymLv} + 이 마을 필수 배지)`, `Beat the leader (Lv${T.gymLv} + this town's required badges).`)) :
        got ? `🏅 ${SN(st)}\n${t(st.intro, st.introEn)}` : `${SN(st)}: ${t("규칙", "rules")} ${stateDone(st.id)}/${stateTot(st.id)}${st.core ? t("  · 관장 도전 필수", "  · required for the gym") : ""}\n${t(st.intro, st.introEn)}` }));
    const n = list.filter((x) => x.got).length;
    await G.panel(`${t("배지 케이스", "Badges")} · ${townName(T)} ${n}/${list.length}`, items, { cols: 4 });
  }
  async function monDex() {
    const tn = await pickTown(t("어느 마을의 몬스터 도감?", "Monster dex of which town?")); if (tn < 0) return;
    const items = [];
    statesOf(tn).forEach((st) => {
      const ms = LT.LMON.filter((m) => m.fam === st.id && !m.boss); if (!ms.length) return;
      items.push({ sec: true, label: SN(st) + (st.tag ? ` [${st.tag === "공통" ? t("공통", "Common") : st.tag}]` : "") });
      ms.forEach((m) => { const met = P.met.includes(m.id); items.push({ icon: LUI.monIcon(m, !met), label: met ? NM(m) : "???", lock: !met, cls: "mon",
        desc: met ? `【${NM(m)}】 ${t(m.sub, m.subEn)}\n${t("집중 규칙", "Focus rules")}: ${(m.rules || []).map((r) => RT(r).split(/[:,]/)[0]).join(" / ")}` : t("아직 만나지 못한 몬스터. 서식지를 돌아다녀 보자.", "Not met yet. Explore its habitat.") }); });
    });
    const all = LT.LMON.filter((m) => !m.boss && (m.town || 1) === tn), met = all.filter((m) => P.met.includes(m.id)).length;
    await G.panel(`${t("몬스터 도감", "Monster dex")} ${met}/${all.length}`, items);
  }
  async function achPanel() {
    while (true) {
      const items = LT.ACH.map((a) => { const got = P.ach.includes(a.id); return { label: `${got ? "🏆" : "🔒"} ${a.name}${got && P.title === a.title ? t("  (장착 중)", "  (equipped)") : ""}`, lock: !got, desc: `${a.desc}\n${t("칭호", "Title")}: 「${got ? a.title : "???"}」${got ? t("\n(A: 칭호 장착)", "\n(A: equip title)") : ""}` }; });
      const k = await G.panel(`${t("업적", "Achievements")} ${P.ach.length}/${LT.ACH.length} · ${t("칭호", "Title")} 「${P.title || "-"}」`, items, { selectable: true });
      if (k < 0) return;
      const a = LT.ACH[k]; if (P.ach.includes(a.id)) { P.title = a.title; window.LUI && LUI.toast(t(`칭호 「${a.title}」 장착!`, `Title 「${a.title}」 equipped!`)); }
    }
  }
  async function statsPanel() {
    const tt = totals(), acc = tt.n ? Math.round((tt.ok / tt.n) * 100) : 0, min = Math.round((P.playMs || 0) / 60000);
    const rulesDone = Object.keys(LT.RULES).filter(ruleOK).length, rulesTot = Object.keys(LT.RULES).length;
    const items = [
      { label: t(`총 답변 ${tt.n}  ·  정답 ${tt.ok}  ·  오답 ${tt.n - tt.ok}`, `Answers ${tt.n}  ·  correct ${tt.ok}  ·  wrong ${tt.n - tt.ok}`), desc: t("퀴즈 배틀에서 고른 답의 누적 기록.", "All answers chosen in quiz battles.") },
      { label: `${t("정확도", "Accuracy")} ${acc}%`, bar: acc / 100, desc: t("정답 ÷ 전체 답변.", "Correct ÷ all answers.") },
      { label: t(`최고 연속 정답 ${P.st.bs}  (현재 ${P.st.cs})`, `Best streak ${P.st.bs}  (now ${P.st.cs})`), desc: t("3연속부터 콤보 보너스 XP, 5연속부터 공격력 +15%.", "3 in a row: combo EXP; 5 in a row: +15% attack.") },
      { label: t(`퍼펙트 배틀 ${P.st.pf}회  ·  승리 ${P.wins}회`, `Perfect battles ${P.st.pf}  ·  wins ${P.wins}`), desc: t("오답 없이 이긴 배틀은 XP +30%.", "Battles won without a wrong answer give +30% EXP.") },
      { label: t(`마스터한 문제 ${tt.mq} / 푼 문제 ${Object.keys(P.seenQ).length}`, `Mastered ${tt.mq} / seen ${Object.keys(P.seenQ).length}`), desc: t("같은 문제를 3번 연속 맞히면 👑 마스터.", "Answer a question right 3 times in a row to 👑 master it.") },
      { label: `${t("규칙", "Rules")} ${rulesDone}/${rulesTot}`, bar: rulesDone / rulesTot, desc: t("규칙마다 정답 2번이면 습득.", "Two correct answers per rule to learn it.") },
      { label: t(`플레이 시간 ${Math.floor(min / 60)}시간 ${min % 60}분`, `Play time ${Math.floor(min / 60)}h ${min % 60}m`), desc: t("필드·전투 시간 합계.", "Field + battle time.") }
    ];
    TOWNS().filter((T) => townOpen(T.n)).forEach((T) => {
      items.push({ sec: true, label: `${T.n}. ${townName(T)}  ${Math.round(townProgress(T.n) * 100)}%`, bar: townProgress(T.n), cls: "secbar" });
      statesOf(T.n).forEach((st) => items.push({ label: `${SN(st)} ${Math.round((stateDone(st.id) / stateTot(st.id)) * 100)}%`, bar: stateDone(st.id) / stateTot(st.id), icon: LUI.badgeURL(st, !hasSB(st.id), 2), cls: "mini", desc: `${SN(st)} ${t("규칙", "rules")} ${stateDone(st.id)}/${stateTot(st.id)}` }));
    });
    await G.panel(t("기록", "Stats"), items);
  }
  async function movesPanel() {
    const items = S.MOVES.map((m) => { const has = P.moves.includes(m.id); return { label: has ? m.name : `??? (Lv${m.lv} + ${moveReqText(m)})`, lock: !has,
      desc: has ? `【${m.name}】\n${MD(m)}` : t(`Lv${m.lv} 이상 + ${moveReqText(m)}이면 습득. `, `Learned at Lv${m.lv} + ${moveReqText(m)}. `) + (moveReqMet(m) ? t("(조건 충족 ✓)", "(requirement met ✓)") : m.req ? `(${stateDone(m.req.s)}/${m.req.n})` : "") }; });
    await G.panel(t("기술 (spec 메커니즘)", "Moves (spec mechanisms)"), items);
  }
  async function bagPanel() {
    while (true) {
      const ids = Object.keys(P.items).filter((k) => P.items[k] > 0 && S.ITEMS[k]);
      if (!ids.length) { await G.say(t("가방이 비어 있다.", "Your bag is empty.")); return; }
      const k = await G.panel(t("가방", "Bag"), ids.map((i) => ({ label: `${IN(S.ITEMS[i])}  ×${P.items[i]}${S.ITEMS[i].kind === "key" ? t(" (중요)", " (key)") : ""}`, desc: ID(S.ITEMS[i]) + t("\n(A: 사용)", "\n(A: use)") })), { selectable: true });
      if (k < 0) return;
      await useItem(ids[k], false);
    }
  }

  /* ---------------- 시작 ---------------- */
  G.start = async function () {
    buildTiles(); requestAnimationFrame(frame);
    G.mode = "title";
    while (true) {
      const ext = (G.titleExtras || []).filter((e) => !e.cond || e.cond());
      const CONT = t("이어하기", "Continue"), NEW = t("새로 시작", "New game"), LNG = "🌐 " + (G.lang === "en" ? "한국어로" : "English");
      const base = G.hasSave() ? [CONT, NEW] : [NEW];
      const opts = ext.filter((e) => e.top).map((e) => e.label).concat(base, ext.filter((e) => !e.top).map((e) => e.label), [LNG]);
      const k = await G.choose(opts, { prompt: t("SPEC 몬스터 골드 — PCIe/CXL 편\nA: 선택  (키보드: Z=A, X=B, 방향키)", "SPEC Monster Gold — PCIe/CXL\nA: select  (keys: Z=A, X=B, arrows)") });
      if (opts[k] === LNG) { G.setLang(G.lang === "en" ? "ko" : "en"); continue; }
      const e = ext.find((x) => x.label === opts[k]);
      if (e) { if (await e.run()) { G.mode = "field"; showFieldHint(); return; } continue; }
      if (opts[k] === CONT) { G.load(); G.mode = "field"; showFieldHint(); if (G.justMigrated && G.onMigrated) runScript(G.onMigrated); }
      else { G.newGame(); G.mode = "field"; G.save(); if (G.onNewGame) runScript(G.onNewGame); }
      return;
    }
  };
  G.S = S;
})();
