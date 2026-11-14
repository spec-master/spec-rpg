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
  const elText = $("ctext"), elList = $("clist"), elName = $("cname"), elArrow = $("carrow"), elConsole = $("console");
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
  let P = null; // 저장되는 플레이어 상태
  const SAVE_KEY = "specrpg_save_v1";
  function newState() {
    return { map: "lab", x: 4, y: 6, dir: "up", lv: 1, xp: 0, hp: 30, chapter: 1, ltssm: "Detect", gen: 1, width: 1,
      flags: {}, items: {}, learned: {}, mastery: {}, moves: [], badges: [], seenQ: {}, wins: 0, playMs: 0,
      ver: 2, sbadges: [], rules: {}, ach: [], met: [], st: { cs: 0, bs: 0, pf: 0 }, title: "" };
  }
  G.P = () => P;
  const maxHP = () => 30 + 6 * (P.lv - 1);
  const xpNeed = (lv) => 10 + lv * 10;
  G.maxHP = maxHP;
  G.flag = (k) => !!P.flags[k];
  G.setFlag = (k, v = true) => { P.flags[k] = v; };
  G.hasItem = (k) => (P.items[k] || 0) > 0;
  G.save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) {} };
  G.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.load = () => { try { let s = JSON.parse(localStorage.getItem(SAVE_KEY)); const r = S.LTSSM.migrate(s); s = r.P; P = Object.assign(newState(), s); P.st = Object.assign({ cs: 0, bs: 0, pf: 0 }, P.st); G.justMigrated = r.migrated; return true; } catch (e) { return false; } };
  G.newGame = () => { P = newState(); };
  G.newState = newState;
  G.setState = (s) => { P = Object.assign(newState(), s); P.st = Object.assign({ cs: 0, bs: 0, pf: 0 }, P.st); P.hp = Math.min(P.hp, maxHP()); mv = null; };
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
  elConsole.addEventListener("pointerdown", (e) => { if (e.target.closest(".opt, input, textarea, button, a, .nogo")) return; if (handler) press("A"); });
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  const heldDir = () => (lastDir && held[lastDir] ? lastDir : ["up", "down", "left", "right"].find((d) => held[d]) || null);

  /* ---------------- 대화 / 선택 UI ---------------- */
  function clearConsole() { elText.textContent = ""; elList.innerHTML = ""; elList.className = ""; elName.textContent = ""; elArrow.classList.remove("on"); elConsole.style.fontSize = ""; elConsole.scrollTop = 0; }
  /* fitConsole: 내용이 넘치면 글자 크기를 단계적으로 줄여 스크롤 없이 보이게 (최소 11px) */
  function fitConsole() {
    elConsole.style.fontSize = ""; elConsole.scrollTop = 0;
    let fs = parseFloat(getComputedStyle(elConsole).fontSize) || 15;
    while (elConsole.scrollHeight > elConsole.clientHeight + 1 && fs > 11) { fs -= 0.5; elConsole.style.fontSize = fs + "px"; }
    elConsole.scrollTop = 0;
  }
  G.fitConsole = fitConsole;
  G.clearConsole = clearConsole;
  function typeLine(text) {
    return new Promise((resolve) => {
      let i = 0, done = false; elText.textContent = ""; elArrow.classList.remove("on"); elConsole.style.fontSize = ""; elConsole.scrollTop = 0;
      const timer = setInterval(() => { i += 2; elText.textContent = text.slice(0, i); elConsole.scrollTop = elConsole.scrollHeight; if (i >= text.length) finish(); }, 28);
      function finish() { clearInterval(timer); elText.textContent = text; done = true; elArrow.classList.add("on"); if (G.mode === "battle") { fitConsole(); elConsole.scrollTop = elConsole.scrollHeight; } }
      handler = (b) => { if (b !== "A" && b !== "B") return; if (!done) finish(); else { handler = null; elArrow.classList.remove("on"); resolve(); } };
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
      elName.textContent = opts.name || ""; elConsole.style.fontSize = ""; elConsole.scrollTop = 0;
      elText.innerHTML = ""; if (opts.header) { const h = document.createElement("div"); h.className = "hdr"; h.textContent = opts.header; elText.appendChild(h); }
      if (opts.prompt) { const q = document.createElement("div"); q.className = opts.quiz ? "qtext" : ""; q.textContent = opts.prompt; elText.appendChild(q); }
      if (opts.sub) { const h = document.createElement("div"); h.className = "qsub"; h.innerHTML = opts.sub; elText.appendChild(h); }
      elArrow.classList.remove("on"); elList.innerHTML = ""; elList.className = (opts.grid ? "grid" : "") + (opts.quiz ? " quiz" : "");
      const dis = opts.disabled || new Set(); let cur = 0; while (dis.has(cur) && cur < options.length - 1) cur++;
      const els = options.map((o, i) => { const d = document.createElement("div"); d.className = "opt" + (dis.has(i) ? " off" : ""); d.textContent = o;
        d.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (dis.has(i)) return; cur = i; render(); finish(i); }); elList.appendChild(d); return d; });
      const hintEl = document.createElement("div"); hintEl.className = "hdr"; hintEl.style.marginTop = "4px"; if (opts.hint) elList.after ? null : null;
      let first = true;
      function render() {
        els.forEach((e, i) => e.classList.toggle("sel", i === cur)); if (opts.hint) { hintEl.textContent = opts.hint(cur) || ""; elList.appendChild(hintEl); }
        // 버그 수정: 첫 렌더에서 scrollIntoView 금지(질문이 위로 밀려 안 보이던 원인). 퀴즈는 항상 맨 위 고정.
        if (opts.quiz || G.mode === "battle") { if (first) fitConsole(); elConsole.scrollTop = 0; }
        else if (!first && els[cur]) { const r = els[cur].getBoundingClientRect(), c = elConsole.getBoundingClientRect(); if (r.bottom > c.bottom || r.top < c.top) els[cur].scrollIntoView({ block: "nearest" }); }
        first = false;
      }
      function finish(i) { handler = null; resolve(i); }
      render();
      handler = (b) => {
        const step = opts.grid ? { up: -2, down: 2, left: -1, right: 1 }[b] : { up: -1, down: 1 }[b];
        if (step) { let n = cur; for (let k = 0; k < options.length; k++) { n = (n + step + options.length) % options.length; if (!dis.has(n)) break; } cur = n; render(); }
        else if (b === "A") finish(cur);
        else if (b === "B" && opts.cancel) finish(-1);
      };
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
        const sp = document.createElement("span"); sp.className = "lb"; sp.textContent = it.label; d.appendChild(sp);
        if (it.bar != null) { const b = document.createElement("div"); b.className = "bar"; const f = document.createElement("i"); f.style.width = Math.round(Math.max(0, Math.min(1, it.bar)) * 100) + "%"; b.appendChild(f); d.appendChild(b); }
        if (!it.sec) d.addEventListener("pointerdown", (e) => { e.preventDefault(); const k = selectable.indexOf(i); if (k === cur && opts.selectable) { done(i); return; } cur = k; render(); }); elPList.appendChild(d); return d; });
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
  function showFieldHint() { if (G.mode !== "field") return; clearConsole(); const m = curMap(); elName.textContent = m.name; elText.textContent = `${statusLine()}\n방향키 이동 · A 조사/대화 · B/START 메뉴`; }
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
      text(B.enemy.name, 8, 16); text("HP", 8, 26, 6); hpBar(20, 22, 56, B.ehp, B.emax);
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
    text("by teslanius", 58, 136, 6, "#88a070", false);
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
  const moveReqText = (m) => m.req ? `「${stateOf(m.req.s).name}」 규칙 ${m.req.n}개 습득` : m.concept ? `「${S.CONCEPTS[m.concept].name}」 개념 학습` : "";
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
      if (P.lv >= mo.lv && moveReqMet(mo)) { P.moves.push(mo.id); window.LUI && LUI.sfx("rule"); await G.say(`✨ Link는 새 기술 「${mo.name}」을(를) 익혔다!\n${mo.desc}`); }
    }
  };
  G.gainXP = async function (n, note) {
    P.xp += n; await G.say(`경험치 ${n}을(를) 얻었다!${note ? "\n" + note : ""}`);
    while (P.xp >= xpNeed(P.lv)) {
      P.xp -= xpNeed(P.lv); P.lv++; P.hp = Math.min(maxHP(), P.hp + 6);
      window.LUI && LUI.sfx("levelup"); levelFx();
      await G.say(`🎉 레벨 업! Lv${P.lv}  (최대 HP ${maxHP()})${P.lv === 10 ? "\n🏟 Lv10! 핵심 배지를 모으면 LTSSM 관장에게 도전할 수 있다." : ""}`);
    }
    const blocked = S.MOVES.find((m) => !P.moves.includes(m.id) && P.lv >= m.lv && !moveReqMet(m) && m.req);
    await G.checkGrowth(); await G.checkAch();
    if (blocked && !moveReqMet(blocked) && Math.random() < 0.5) await G.say(`💡 「${blocked.name}」: 레벨은 충분! ${moveReqText(blocked)}이 필요하다.`);
  };
  function levelFx() { const sc = $("screen"); const d = document.createElement("div"); d.className = "lvfx"; d.textContent = "LEVEL UP!"; sc.appendChild(d); setTimeout(() => d.remove(), 1400); }
  G.giveItem = async function (id, n = 1, silent) { P.items[id] = (P.items[id] || 0) + n; if (!silent) await G.say(`🎒 「${S.ITEMS[id].name}」 ×${n}을(를) 받았다!\n${S.ITEMS[id].desc}`); };
  G.heal = () => { P.hp = maxHP(); };
  G.addBadge = (b) => { if (!P.badges.includes(b)) P.badges.push(b); };

  /* 규칙 습득 / state 배지 */
  async function ruleProgress(rid) {
    const before = ruleOK(rid); P.rules[rid] = Math.min(99, ruleN(rid) + 1);
    if (before || !ruleOK(rid)) return;
    const r = LT.RULES[rid], st = stateOf(r.state);
    window.LUI && LUI.sfx("rule");
    window.LUI && LUI.toast(`📜 규칙 습득 <b>${st.name}</b> ${stateDone(st.id)}/${stateTot(st.id)}<br><small>${r.text}</small>`, "rule");
    if (stateDone(st.id) === stateTot(st.id) && !hasSB(st.id)) {
      P.sbadges.push(st.id);
      await sleep(300);
      await LUI.badgePopup(st, `${st.name} 배지 획득!`, `${st.name}의 규칙 ${stateTot(st.id)}개를 모두 익혔다`);
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
    core5: () => LT.CORE.every(hasSB), all_states: () => LT.STATES.every((s) => hasSB(s.id)), lv10: () => P.lv >= 10,
    gym_win: () => !!P.flags.beat_leader1, gym_nodmg: () => !!P.flags.gym_nodmg, q20: () => totals().mq >= 20,
    dex_all: () => LT.LMON.filter((m) => !m.boss).every((m) => P.met.includes(m.id))
  };
  G.checkAch = async function () {
    for (const a of LT.ACH) {
      if (P.ach.includes(a.id) || !ACH_CHECK[a.id] || !ACH_CHECK[a.id]()) continue;
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
  function pickQuestion(opt, m) {
    if ((m && m.ltssm) || opt.fams) return pickLQ(opt, m);
    const maxD = opt.maxD || levelMaxD(), minD = Math.min(opt.minD || 1, maxD);
    let pool = S.QUESTIONS.filter((q) => opt.chapters.includes(q.ch) && q.d >= minD && q.d <= maxD && !recent.includes(q.id));
    if (!pool.length) pool = S.QUESTIONS.filter((q) => opt.chapters.includes(q.ch) && !recent.includes(q.id));
    if (!pool.length) pool = S.QUESTIONS.filter((q) => opt.chapters.includes(q.ch));
    const weighted = []; pool.forEach((q) => { const s = P.seenQ[q.id]; const w = !s ? 4 : (s.st || 0) === 0 && s.n > s.ok ? 5 : s.ok >= 2 ? 1 : 2; for (let i = 0; i < w; i++) weighted.push(q); });
    const q = weighted[rnd(weighted.length)]; recent.push(q.id); if (recent.length > 12) recent.shift(); return q;
  }
  G.pickQuestion = pickQuestion;

  /* ---------------- 전투 ---------------- */
  // opt: { kind: 'wild'|'trainer'|'boss', team:[monId], chapters:[ch], fams:[state], trainer:'이름', minD, maxD, xp, onStart }
  G.battle = async function (opt) {
    const prevMode = G.mode; await flash(3); G.mode = "battle"; document.body.classList.add("battle");
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
      await G.say(opt.kind === "wild" ? `야생의 ${m.name}이(가) 나타났다!${m.sub ? `\n(${m.sub})` : ""}` : `${opt.trainer}은(는) ${m.name}을(를) 내보냈다!`);
      while (B.ehp > 0 && P.hp > 0) {
        const acts = ["기술", "가방", "도망"];
        const a = await G.choose(acts, { prompt: `${m.name}  HP ${B.ehp}/${B.emax}${P.st.cs >= 2 ? `   🔥${P.st.cs} 콤보` : ""}\n무엇을 할까?`, grid: true });
        if (a === 0) {
          const ms = P.moves.map((x) => S.MOVES.find((y) => y.id === x)).filter(Boolean);
          const k = await G.choose(ms.map((x) => x.name), { prompt: "어떤 기술을 쓸까?", cancel: true, grid: ms.length > 3, hint: (i) => ms[i] && ms[i].desc });
          if (k < 0) continue;
          await quizTurn(ms[k], opt, B.enemy);
        } else if (a === 1) {
          const used = await battleBag(); if (!used) continue;
        } else {
          if (opt.kind === "wild") { await G.say("무사히 도망쳤다! (Link를 잠시 Electrical Idle로...)"); result = "run"; break outer; }
          await G.say("트레이너와의 승부에서는 도망칠 수 없다!");
        }
      }
      if (P.hp <= 0) { result = "lose"; break; }
      B.eBlink = 30; await sleep(500); B.eVisible = false;
      await G.say(`${m.name}을(를) 쓰러뜨렸다!`);
      let xp = opt.xp ? Math.round(opt.xp / opt.team.length) : m.ltssm ? 5 + (opt.kind !== "wild" ? 4 : 0) + (m.boss ? 12 : 0) : 6 + m.ch * 4 + (m.boss ? 15 : 0);
      const notes = [];
      if (B.combo) { notes.push(`🔥 콤보 보너스 +${B.combo}`); xp += B.combo; }
      if (ti === opt.team.length - 1 && B.wrong === 0) { const bonus = Math.max(2, Math.round(xp * 0.3)); xp += bonus; P.st.pf++; notes.push(`✨ 퍼펙트 배틀! +${bonus}`); }
      B.combo = 0;
      await G.gainXP(xp, notes.join("  "));
    }
    document.body.classList.remove("battle");
    if (result === "lose") {
      P.st.cs = 0;
      await G.say(["Link Down... 눈앞이 캄캄해졌다!", "🔁 Hot Reset! Reset 센터에서 깨어났다."]);
      P.hp = maxHP(); B = null; G.mode = "field"; await G.warp("center", 4, 4, "up");
      return "lose";
    }
    if (result === "win") { P.wins++; if (opt.kind === "boss" && B.dmgTaken === 0) P.flags.gym_nodmg_pending = true; }
    await G.fade(1); B = null; G.mode = prevMode === "battle" ? "field" : prevMode; await G.fade(0);
    await G.checkAch();
    G.save(); return result;
  };
  async function battleBag() {
    const ids = Object.keys(P.items).filter((k) => P.items[k] > 0 && S.ITEMS[k].kind !== "key");
    if (!ids.length) { await G.say("쓸 수 있는 아이템이 없다."); return false; }
    const k = await G.choose(ids.map((i) => `${S.ITEMS[i].name} ×${P.items[i]}`), { prompt: "어떤 아이템을 쓸까?", cancel: true, hint: (i) => S.ITEMS[ids[i]].desc });
    if (k < 0) return false;
    return useItem(ids[k], true);
  }
  async function useItem(id, inBattle) {
    const it = S.ITEMS[id];
    if (it.heal) { if (P.hp >= maxHP()) { await G.say("HP가 이미 가득하다."); return false; } const before = P.hp; P.hp = Math.min(maxHP(), P.hp + it.heal); P.items[id]--; await G.say(`${it.name} 사용! HP ${P.hp - before} 회복.`); return true; }
    if (id === "replay_buf") { if (!inBattle) { await G.say("전투 중에만 쓸 수 있다."); return false; } B.replay = true; P.items[id]--; await G.say("Replay Buffer 장전! 다음 오답은 Nak → 재전송으로 한 번 더 도전할 수 있다."); return true; }
    if (id === "msix_table") { await G.say(["📨 MSI-X vector로 Root 박사님께 Memory Write 인터럽트 전송!", G.hint ? G.hint() : "..."], "Root 박사"); return false; }
    await G.say(it.desc); return false;
  }
  G.useItem = useItem;
  const qStatHTML = (s) => !s ? `<span class="tag new">NEW</span>` : `<span class="tag ok">✓${s.ok}</span><span class="tag ng">✗${s.n - s.ok}</span>${(s.st || 0) >= 3 ? `<span class="tag ms">👑 마스터</span>` : (s.st || 0) > 0 ? `<span class="tag st">연속 ${s.st}</span>` : ""}`;
  async function quizTurn(move, opt, m) {
    const q = pickQuestion(opt, m);
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const labels = order.map((i) => q.c[i]); const correct = order.indexOf(q.a);
    const dis = new Set(); const wrong = [0, 1, 2, 3].filter((i) => i !== correct).sort(() => Math.random() - 0.5);
    if (move.effect === "elim") dis.add(wrong[0]); if (move.effect === "elim2") { dis.add(wrong[0]); dis.add(wrong[1]); }
    let replay = move.effect === "replay" || B.replay; B.replay = false;
    const stars = "★".repeat(q.d) + "☆".repeat(3 - q.d);
    const topic = q.rule ? `${stateOf(q.fam).name}${stateOf(q.fam).tag ? " · " + stateOf(q.fam).tag : ""}` : S.CONCEPTS[q.concept].name;
    const header = `[${move.name}] ${topic} · ${stars}`;
    const s0 = P.seenQ[q.id];
    const ruleTag = q.rule ? ` <span class="tag rl">규칙 ${Math.min(ruleN(q.rule), LT.RULE_NEED)}/${LT.RULE_NEED}${ruleOK(q.rule) ? " ✔" : ""}</span>` : "";
    const grid = labels.every((l) => l.length <= 13);
    let pick;
    while (true) {
      pick = await G.choose(labels, { header, prompt: q.q, sub: qStatHTML(s0) + ruleTag, disabled: dis, quiz: true, grid });
      if (pick === correct || !replay) break;
      dis.add(pick); replay = false; G.markChoices(-1, pick); await sleep(250);
      await G.say("❌ 오답... 하지만 재전송! 한 번 더!");
    }
    const ok = pick === correct; G.markChoices(correct, pick);
    const s = (P.seenQ[q.id] = P.seenQ[q.id] || { n: 0, ok: 0, st: 0 }); s.n++; if (ok) { s.ok++; s.st = (s.st || 0) + 1; } else s.st = 0;
    if (q.concept) { const ms = (P.mastery[q.concept] = P.mastery[q.concept] || { n: 0, ok: 0 }); ms.n++; if (ok) ms.ok++; }
    if (ok) { P.st.cs++; P.st.bs = Math.max(P.st.bs, P.st.cs); } else { P.st.cs = 0; B.wrong++; }
    window.LUI && LUI.sfx(ok ? (P.st.cs >= 3 ? "combo" : "ok") : "ng");
    await sleep(350);
    const newMaster = ok && s.st === 3;
    const statLine = `✓${s.ok} ✗${s.n - s.ok}${newMaster ? "  👑 이 문제 마스터!" : s.st >= 3 ? "  👑" : ""}${ok && P.st.cs >= 3 ? `  🔥 ${P.st.cs} 콤보!` : ""}`;
    await G.say([`${ok ? "⭕ 정답!" : "❌ 오답!"}  정답: ${q.c[q.a]}\n${statLine}`, `📘 ${q.e}`]);
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
      let msg = `Link의 「${move.name}」! ${m.name}에게 ${dmg} 데미지!${P.st.cs >= 5 ? " (콤보 강화)" : ""}`;
      if (move.effect === "heal") { const h = Math.round(maxHP() * (move.heal || 0.35)); const b = P.hp; P.hp = Math.min(maxHP(), P.hp + h); msg += `\nHP ${P.hp - b} 회복!`; }
      await G.say(msg);
    } else {
      let dmg = m.atk + rnd(3);
      if (move.effect === "risky") dmg = Math.round(dmg * 1.5);
      if (move.effect === "fec") dmg = Math.round(dmg * 0.5);
      B.pShake = 20; P.hp = Math.max(0, P.hp - dmg); B.dmgTaken += dmg;
      let msg = `${m.name}의 반격! Link는 ${dmg} 데미지를 받았다.${move.effect === "fec" ? " (피해 절반)" : ""}`;
      if (move.effect === "echo") { const r = Math.max(1, Math.round(dmg / 2)); B.ehp = Math.max(0, B.ehp - r); B.eShake = 20; msg += `\nLoopback 에코! ${r} 데미지를 되돌려 보냈다.`; }
      await G.say(msg);
    }
    await G.checkAch();
  }

  /* ---------------- 필드 메뉴 ---------------- */
  async function fieldMenu() {
    while (true) {
      const ext = G.menuExtras || [];
      const base = ["Link 상태", "규칙 도감", "배지 케이스", "몬스터 도감", "업적·칭호", "기록", "기술", "가방", "spec 도감", "저장"];
      const k = await G.choose(base.concat(ext.map((e) => e.label), ["닫기"]), { prompt: "메뉴", cancel: true, grid: true });
      const nb = base.length;
      if (k >= nb && k < nb + ext.length) { const r = await ext[k - nb].run(); if (r === "close") return; continue; }
      if (k === 0) await statusPanel();
      else if (k === 1) await ruleDex();
      else if (k === 2) await badgeCase();
      else if (k === 3) await monDex();
      else if (k === 4) await achPanel();
      else if (k === 5) await statsPanel();
      else if (k === 6) await movesPanel();
      else if (k === 7) await bagPanel();
      else if (k === 8) await dexPanel();
      else if (k === 9) { G.save(); await G.say("💾 진행 상황을 저장했다. (localStorage)"); }
      else return;
    }
  }
  G.fieldMenu = fieldMenu;
  async function statusPanel() {
    const ch = S.CHAPTERS.find((c) => c.id === P.chapter) || S.CHAPTERS[0];
    const items = [
      { label: `Lv ${P.lv}   EXP ${P.xp}/${xpNeed(P.lv)}`, bar: P.xp / xpNeed(P.lv), desc: "정답으로 몬스터를 쓰러뜨리면 경험치를 얻는다. 콤보·퍼펙트 배틀이면 보너스!" },
      { label: `HP ${P.hp}/${maxHP()}`, bar: P.hp / maxHP(), desc: "오답을 고르면 몬스터의 반격으로 HP가 줄어든다. 0이 되면 Link Down → Hot Reset." },
      { label: `칭호: ${P.title || "(없음)"}`, desc: "업적을 달성하면 칭호를 얻는다. 업적·칭호 메뉴에서 바꿀 수 있다." },
      { label: `LTSSM: ${P.ltssm}`, desc: "Detect 배지 → Polling, Polling 배지 → Configuration, Configuration 배지 → L0(2.5 GT/s)." },
      { label: `속도: Gen${P.gen} (${RATE[P.gen]})`, desc: "L0 이후 Recovery 배지(속도 변경), Equalization 배지(8 GT/s 이상), L0p 배지(Flit, 64/128 GT/s)와 레벨이 필요하다." },
      { label: `Link 폭: x${P.width}`, desc: "L0에 도달한 뒤 레벨에 따라 x1→x2→x4→x8→x16." },
      { label: `state 배지: ${P.sbadges.length}/${LT.STATES.length}`, bar: P.sbadges.length / LT.STATES.length, desc: "각 state의 규칙을 모두 익히면 그 state 배지." },
      { label: `관장 배지: ${P.badges.length ? P.badges.map((b) => ({ l0: "LTSSM 마스터", dl: "DL_Active" }[b] || b)).join(", ") : "없음"}`, desc: "관장을 이기면 받는다." },
      { label: `현재 장: ${ch.title}`, desc: `무대: ${ch.area}` }
    ];
    await G.panel("Link 상태", items);
  }
  async function ruleDex() {
    const items = [];
    LT.STATES.forEach((st) => {
      const d = stateDone(st.id), t = stateTot(st.id);
      items.push({ sec: true, label: `${st.name}${st.tag ? " (" + st.tag + ")" : ""}  ${d}/${t}${hasSB(st.id) ? " 🏅" : ""}`, icon: LUI.badgeURL(st, !hasSB(st.id), 2), bar: d / t, cls: "secbar" });
      Object.entries(st.rules).forEach(([rid, text]) => {
        const n = Math.min(ruleN(rid), LT.RULE_NEED), seen = Object.keys(P.seenQ).some((k) => k.startsWith("L" + rid + "_"));
        const dots = "●".repeat(n) + "○".repeat(LT.RULE_NEED - n);
        const qs = LT.LQ.filter((q) => q.rule === rid), qok = qs.filter((q) => P.seenQ[q.id] && P.seenQ[q.id].ok).length;
        items.push({ label: `${dots} ${ruleOK(rid) || seen ? text : "??? (아직 못 만난 규칙)"}`, lock: !ruleOK(rid),
          desc: `【${st.name}】 ${ruleOK(rid) ? "✔ 습득" : `${n}/${LT.RULE_NEED} 정답`}\n${ruleOK(rid) || seen ? text : "이 규칙의 문제를 만나면 내용이 보인다."}\n관련 문제 ${qs.length}개 중 ${qok}개 맞힘`.trim() });
      });
    });
    const tot = Object.keys(LT.RULES).length, done = Object.keys(LT.RULES).filter(ruleOK).length;
    await G.panel(`규칙 도감 ${done}/${tot}`, items);
  }
  async function badgeCase() {
    const list = LT.STATES.map((st) => ({ st, got: hasSB(st.id) })).concat([{ st: Object.assign({ isMaster: true }, LT.MASTER), got: P.badges.includes("l0") }]);
    const items = list.map(({ st, got }) => ({ icon: LUI.badgeURL(st, !got, 3), label: got ? st.name : "???", lock: !got, cls: "bslot" + (got ? " got" : ""),
      desc: st.isMaster ? (got ? "🏆 LTSSM 마스터 배지 — LTSSM 관장을 이긴 증표." : "LTSSM 관장을 이기면 받는다. (Lv10 + 핵심 배지 5개)") :
        got ? `🏅 ${st.name} 배지\n${st.intro}` : `${st.name}: 규칙 ${stateDone(st.id)}/${stateTot(st.id)}${st.core ? "  · 관장 도전 필수" : ""}\n${st.intro}` }));
    const n = list.filter((x) => x.got).length;
    await G.panel(`배지 케이스 ${n}/${list.length}`, items, { cols: 4 });
  }
  async function monDex() {
    const items = [];
    LT.STATES.forEach((st) => {
      const ms = LT.LMON.filter((m) => m.fam === st.id && !m.boss); if (!ms.length) return;
      items.push({ sec: true, label: st.name });
      ms.forEach((m) => { const met = P.met.includes(m.id); items.push({ icon: LUI.monIcon(m, !met), label: met ? m.name : "???", lock: !met, cls: "mon",
        desc: met ? `【${m.name}】 ${m.sub}\n집중 규칙: ${(m.rules || []).map((r) => LT.RULES[r].text.split(/[:,]/)[0]).join(" / ")}` : "아직 만나지 못한 몬스터. 서식지를 돌아다녀 보자." }); });
    });
    const tot = LT.LMON.filter((m) => !m.boss).length, met = LT.LMON.filter((m) => !m.boss && P.met.includes(m.id)).length;
    await G.panel(`몬스터 도감 ${met}/${tot}`, items);
  }
  async function achPanel() {
    while (true) {
      const items = LT.ACH.map((a) => { const got = P.ach.includes(a.id); return { label: `${got ? "🏆" : "🔒"} ${a.name}${got && P.title === a.title ? "  (장착 중)" : ""}`, lock: !got, desc: `${a.desc}\n칭호: 「${got ? a.title : "???"}」${got ? "\n(A: 칭호 장착)" : ""}` }; });
      const k = await G.panel(`업적 ${P.ach.length}/${LT.ACH.length} · 칭호 「${P.title || "-"}」`, items, { selectable: true });
      if (k < 0) return;
      const a = LT.ACH[k]; if (P.ach.includes(a.id)) { P.title = a.title; window.LUI && LUI.toast(`칭호 「${a.title}」 장착!`); }
    }
  }
  async function statsPanel() {
    const t = totals(), acc = t.n ? Math.round((t.ok / t.n) * 100) : 0, min = Math.round((P.playMs || 0) / 60000);
    const rulesDone = Object.keys(LT.RULES).filter(ruleOK).length, rulesTot = Object.keys(LT.RULES).length;
    const items = [
      { label: `총 답변 ${t.n}  ·  정답 ${t.ok}  ·  오답 ${t.n - t.ok}`, desc: "퀴즈 배틀에서 고른 답의 누적 기록." },
      { label: `정확도 ${acc}%`, bar: acc / 100, desc: "정답 ÷ 전체 답변." },
      { label: `최고 연속 정답 ${P.st.bs}  (현재 ${P.st.cs})`, desc: "3연속부터 콤보 보너스 XP, 5연속부터 공격력 +15%." },
      { label: `퍼펙트 배틀 ${P.st.pf}회  ·  승리 ${P.wins}회`, desc: "오답 없이 이긴 배틀은 XP +30%." },
      { label: `마스터한 문제 ${t.mq} / 푼 문제 ${Object.keys(P.seenQ).length}`, desc: "같은 문제를 3번 연속 맞히면 👑 마스터." },
      { label: `규칙 ${rulesDone}/${rulesTot}`, bar: rulesDone / rulesTot, desc: "규칙마다 정답 2번이면 습득." },
      { label: `플레이 시간 ${Math.floor(min / 60)}시간 ${min % 60}분`, desc: "필드·전투 시간 합계." }
    ];
    LT.STATES.forEach((st) => items.push({ label: `${st.name} ${Math.round((stateDone(st.id) / stateTot(st.id)) * 100)}%`, bar: stateDone(st.id) / stateTot(st.id), icon: LUI.badgeURL(st, !hasSB(st.id), 2), cls: "mini", desc: `${st.name} 규칙 ${stateDone(st.id)}/${stateTot(st.id)}` }));
    await G.panel("기록", items);
  }
  async function dexPanel() {
    const items = [];
    S.CHAPTERS.filter((c) => c.id >= 2).forEach((c) => {
      items.push({ sec: true, label: c.title + (c.status === "stub" ? " (준비 중)" : "") });
      Object.entries(S.CONCEPTS).filter(([, v]) => v.ch === c.id).forEach(([id, v]) => {
        const l = P.learned[id], ms = P.mastery[id];
        const star = ms ? " " + (ms.ok >= 3 ? "★★★" : ms.ok >= 2 ? "★★☆" : ms.ok >= 1 ? "★☆☆" : "☆☆☆") : "";
        items.push({ label: l ? `${v.name}${star}` : "??? (미발견)", lock: !l, desc: l ? `【${v.name}】${ms ? `  정답 ${ms.ok}/${ms.n}` : ""}\n${v.note}` : "아직 배우지 않은 개념. NPC와 대화하거나 퀴즈 배틀에서 만나면 등록된다." });
      });
    });
    await G.panel(`spec 도감 (2장~)`, items);
  }
  async function movesPanel() {
    const items = S.MOVES.map((m) => { const has = P.moves.includes(m.id); return { label: has ? m.name : `??? (Lv${m.lv} + ${moveReqText(m)})`, lock: !has,
      desc: has ? `【${m.name}】\n${m.desc}` : `Lv${m.lv} 이상 + ${moveReqText(m)}이면 습득. ${moveReqMet(m) ? "(조건 충족 ✓)" : m.req ? `(현재 ${stateDone(m.req.s)}/${m.req.n})` : "(미학습)"}` }; });
    await G.panel("기술 (spec 메커니즘)", items);
  }
  async function bagPanel() {
    while (true) {
      const ids = Object.keys(P.items).filter((k) => P.items[k] > 0);
      if (!ids.length) { await G.say("가방이 비어 있다."); return; }
      const k = await G.panel("가방", ids.map((i) => ({ label: `${S.ITEMS[i].name}  ×${P.items[i]}${S.ITEMS[i].kind === "key" ? " (중요)" : ""}`, desc: S.ITEMS[i].desc + "\n(A: 사용)" })), { selectable: true });
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
      const base = G.hasSave() ? ["이어하기", "새로 시작"] : ["새로 시작"];
      const opts = ext.filter((e) => e.top).map((e) => e.label).concat(base, ext.filter((e) => !e.top).map((e) => e.label));
      const k = await G.choose(opts, { prompt: "SPEC 몬스터 골드 — PCIe/CXL 편\nA: 선택  (키보드: Z=A, X=B, 방향키)" });
      const e = ext.find((x) => x.label === opts[k]);
      if (e) { if (await e.run()) { G.mode = "field"; showFieldHint(); return; } continue; }
      if (opts[k] === "이어하기") { G.load(); G.mode = "field"; showFieldHint(); if (G.justMigrated && G.onMigrated) runScript(G.onMigrated); }
      else { G.newGame(); G.mode = "field"; G.save(); if (G.onNewGame) runScript(G.onNewGame); }
      return;
    }
  };
  G.S = S;
})();
