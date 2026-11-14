/* =========================================================
 * LTSSM UI: 몬스터 체형 스프라이트 · state 배지 · 팝업/팡파레 · 토스트
 * 전부 코드로 그리는 픽셀아트 (외부 이미지 없음)
 * ========================================================= */
(function () {
  "use strict";
  const U = (window.LUI = {});
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }
  U.shade = shade;

  /* ---------------- 몬스터: 40x40 그리드에 체형별로 그림 ---------------- */
  const N = 40;
  function Grid() {
    const col = new Array(N * N).fill(null), tag = new Array(N * N).fill(0);
    const set = (x, y, c, t = 1) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= N || y >= N) return; col[y * N + x] = c; tag[y * N + x] = t; };
    const G = {
      col, tag, set,
      ell(cx, cy, rx, ry, c, sh, t = 1) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) set(x, y, sh && dx * 0.6 + dy > 0.55 ? sh : c, t); } },
      rect(x0, y0, w, h, c, sh, t = 1) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, sh && (y - y0) > h * 0.7 ? sh : c, t); },
      poly(pts, c, t = 1) { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside; } if (inside) set(x, y, c, t); } },
      line(x0, y0, x1, y1, c, t = 2) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1; for (let i = 0; i <= n; i++) set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c, t); },
      eye(x, y, big) { G.rect(x, y, big ? 4 : 3, big ? 4 : 3, "#ffffff", null, 9); G.rect(x + 1, y + 1, 2, 2, "#101018", null, 9); G.set(x + 1, y + 1, "#ffffff", 9); G.set(x + 1, y + 1, "#101018", 9); G.set(x + (big ? 2 : 1), y + 1, "#ffffff", 9); }
    };
    return G;
  }
  const PLANS = {
    blob(g, m, L, D) { g.ell(20, 28, 15, 10, m.c1, D); g.ell(20, 21, 11, 10, m.c1, D); g.eye(14, 21, true); g.eye(23, 21, true); g.rect(18, 28, 5, 1, D, null, 9); g.set(13, 15, L, 9); g.set(14, 14, L, 9); g.set(15, 14, L, 9); },
    bug(g, m, L, D) {
      for (let i = 0; i < 3; i++) { g.line(10, 24 + i * 4, 3, 28 + i * 4, D); g.line(30, 24 + i * 4, 37, 28 + i * 4, D); }
      g.ell(20, 27, 13, 9, m.c1, D); g.ell(20, 15, 8, 7, shade(m.c1, -0.15), D); g.line(20, 19, 20, 35, D, 9);
      g.line(16, 9, 12, 3, D); g.line(24, 9, 28, 3, D); g.rect(11, 2, 2, 2, L, null, 9); g.rect(28, 2, 2, 2, L, null, 9);
      g.eye(15, 13); g.eye(22, 13);
    },
    bird(g, m, L, D) {
      g.poly([[10, 18], [0, 30], [13, 29]], D); g.poly([[30, 18], [40, 30], [27, 29]], D);
      g.ell(20, 25, 11, 10, m.c1, D); g.ell(20, 26, 6, 6, L); g.ell(20, 12, 8, 7, m.c1, D);
      g.poly([[17, 14], [23, 14], [20, 19]], "#f08020", 9); g.eye(14, 10); g.eye(23, 10);
      g.rect(15, 34, 2, 4, "#f08020", null, 9); g.rect(23, 34, 2, 4, "#f08020", null, 9);
    },
    serpent(g, m, L, D) {
      const pts = [[33, 35, 3], [30, 31, 4], [24, 31, 5], [18, 30, 5], [14, 25, 5], [17, 19, 5], [22, 15, 5]];
      pts.forEach(([x, y, r]) => g.ell(x, y, r, r, m.c1, D)); g.ell(18, 10, 8, 6, m.c1, D);
      g.eye(13, 8); g.eye(20, 8); g.line(10, 13, 6, 15, "#e03040", 9); g.rect(13, 13, 7, 1, D, null, 9);
    },
    golem(g, m, L, D) {
      g.rect(11, 31, 6, 8, D); g.rect(23, 31, 6, 8, D); g.rect(3, 15, 6, 14, D); g.rect(31, 15, 6, 14, D);
      g.rect(9, 13, 22, 19, m.c1, D); g.rect(13, 3, 14, 11, m.c1, D); g.rect(14, 6, 12, 4, "#203040", null, 9);
      g.rect(16, 7, 3, 2, "#60f0ff", null, 9); g.rect(21, 7, 3, 2, "#60f0ff", null, 9);
    },
    crystal(g, m, L, D) {
      g.poly([[8, 20], [3, 30], [9, 36]], D); g.poly([[32, 20], [37, 30], [31, 36]], D);
      g.poly([[20, 1], [33, 18], [20, 38], [7, 18]], m.c1); g.poly([[20, 1], [20, 38], [7, 18]], L, 3);
      g.line(7, 18, 33, 18, D, 3); g.eye(14, 19); g.eye(22, 19);
    },
    cat(g, m, L, D) {
      g.ell(34, 22, 2, 8, m.c1, D); g.ell(24, 28, 12, 8, m.c1, D);
      g.rect(14, 33, 3, 5, D); g.rect(30, 33, 3, 5, D); g.ell(15, 17, 10, 8, m.c1, D);
      g.poly([[6, 13], [8, 3], [13, 10]], m.c1); g.poly([[24, 13], [22, 3], [17, 10]], m.c1);
      g.eye(9, 15); g.eye(18, 15); g.rect(13, 21, 3, 1, D, null, 9); g.line(4, 20, 9, 21, D, 9); g.line(26, 20, 21, 21, D, 9);
    },
    turtle(g, m, L, D) {
      g.ell(6, 27, 6, 5, L, D); g.rect(9, 32, 5, 6, L); g.rect(26, 32, 5, 6, L);
      g.ell(21, 24, 15, 11, m.c1, D); g.rect(6, 28, 30, 5, shade(L, -0.1)); g.eye(3, 24);
    },
    bat(g, m, L, D) {
      g.poly([[14, 16], [0, 8], [2, 18], [0, 26], [8, 24], [14, 28]], D); g.poly([[26, 16], [40, 8], [38, 18], [40, 26], [32, 24], [26, 28]], D);
      g.ell(20, 22, 8, 10, m.c1, D); g.poly([[13, 15], [14, 6], [18, 13]], m.c1); g.poly([[27, 15], [26, 6], [22, 13]], m.c1);
      g.eye(15, 18); g.eye(22, 18);
    },
    shroom(g, m, L, D) {
      g.rect(13, 21, 14, 15, "#f6e8c8", "#d8c8a0"); g.ell(20, 16, 17, 11, m.c1, D); g.rect(3, 20, 34, 4, null);
      for (let y = 20; y < 25; y++) for (let x = 0; x < N; x++) if (g.col[y * N + x] && g.tag[y * N + x] === 1 && y > 18) g.col[y * N + x] = null;
      g.rect(13, 21, 14, 15, "#f6e8c8", "#d8c8a0", 4); g.eye(15, 26); g.eye(22, 26); g.rect(18, 31, 4, 1, "#806040", null, 9);
    },
    ghost(g, m, L, D) {
      g.ell(20, 17, 13, 13, m.c1, D); g.rect(7, 17, 26, 16, m.c1, D);
      for (let i = 0; i < 4; i++) g.ell(10 + i * 7, 34, 3.5, 3, m.c1, D);
      g.rect(12, 14, 5, 6, "#181830", null, 9); g.rect(23, 14, 5, 6, "#181830", null, 9); g.rect(13, 15, 2, 2, "#ffffff", null, 9); g.rect(24, 15, 2, 2, "#ffffff", null, 9);
      g.ell(20, 25, 3, 2, "#181830", null, 9);
    },
    jelly(g, m, L, D) {
      for (let i = 0; i < 5; i++) { const x = 9 + i * 5.5; for (let y = 20; y < 38; y++) g.set(x + Math.round(Math.sin(y / 2.5 + i) * 1.5), y, i % 2 ? D : m.c1, 2); }
      g.ell(20, 16, 14, 11, m.c1, D); g.rect(5, 20, 31, 8, null);
      for (let y = 21; y < 28; y++) for (let x = 0; x < N; x++) if (g.tag[y * N + x] === 1) g.col[y * N + x] = null;
      g.rect(6, 19, 29, 2, D); g.eye(13, 12); g.eye(24, 12); g.ell(14, 9, 3, 2, L, null, 3);
    },
    fish(g, m, L, D) {
      g.poly([[30, 20], [39, 9], [39, 31]], D); g.poly([[16, 12], [26, 4], [26, 13]], D);
      g.ell(19, 21, 15, 10, m.c1, D); g.ell(16, 25, 9, 4, L); g.eye(8, 17, true); g.rect(5, 24, 4, 1, D, null, 9);
    },
    dragon(g, m, L, D) {
      g.poly([[22, 18], [38, 2], [36, 22]], D); g.poly([[20, 18], [6, 4], [12, 24]], shade(D, 0.15));
      g.line(30, 32, 38, 36, m.c1, 1); g.line(30, 33, 38, 37, m.c1, 1); g.ell(23, 27, 11, 9, m.c1, D); g.ell(21, 29, 6, 6, L);
      g.ell(13, 14, 8, 6, m.c1, D); g.rect(4, 15, 7, 4, m.c1, D); g.poly([[10, 9], [7, 2], [13, 8]], "#f8f0d0", 9); g.poly([[16, 9], [17, 2], [19, 9]], "#f8f0d0", 9);
      g.eye(12, 11); g.rect(14, 35, 3, 4, D); g.rect(26, 35, 3, 4, D);
    }
  };
  const PAT = {
    none() {}, stripes: (x, y) => y % 5 === 0, spots: (x, y) => ((x * 7 + y * 13) % 23) < 2 && x % 2 === 0,
    diamonds: (x, y) => (x + y) % 8 === 0 || (x - y + 40) % 8 === 0, hexes: (x, y) => y % 6 === 0 || (x + (Math.floor(y / 6) % 2) * 4) % 8 === 0,
    panel: (x, y) => (x % 7 === 0 && y % 2 === 0) || y % 9 === 0, facet: () => false
  };
  function accessory(g, m, L, D) {
    const a = m.acc;
    if (a === "dish") { g.ell(20, 3, 6, 2.5, "#e0e8f0", "#90a0b0", 9); g.rect(19, 5, 2, 3, "#90a0b0", null, 9); }
    if (a === "crest") g.poly([[17, 6], [20, 0], [23, 6]], "#e04040", 9);
    if (a === "goggles") { g.rect(12, 9, 16, 2, "#303030", null, 9); g.rect(13, 9, 5, 4, "#80e0ff", null, 9); g.rect(22, 9, 5, 4, "#80e0ff", null, 9); }
    if (a === "horn") g.poly([[17, 5], [20, -1], [22, 5]], "#f8f0d0", 9);
    if (a === "crown") { g.rect(13, 1, 13, 3, "#f0c040", null, 9); [13, 19, 25].forEach((x) => g.rect(x, -1, 1, 2, "#f0c040", null, 9)); g.set(19, 2, "#e03040", 9); }
    if (a === "fin") g.poly([[18, 30], [24, 38], [26, 30]], D, 9);
    if (a === "jet") { g.rect(11, 37, 6, 3, "#ffd040", null, 9); g.rect(23, 37, 6, 3, "#ffd040", null, 9); }
    if (a === "spark") [[4, 6], [35, 8], [33, 34]].forEach(([x, y]) => { g.set(x, y, "#ffffff", 9); g.set(x - 1, y, "#bff", 9); g.set(x + 1, y, "#bff", 9); g.set(x, y - 1, "#bff", 9); g.set(x, y + 1, "#bff", 9); });
    if (a === "bell") { g.ell(14, 25, 2, 2, "#f0c040", "#a07010", 9); }
    if (a === "fang") { g.set(17, 25, "#fff", 9); g.set(22, 25, "#fff", 9); }
    if (a === "zzz") { [[30, 2], [34, 6]].forEach(([x, y], i) => { const s = 3 - i; g.rect(x, y, s + 1, 1, "#ffffff", null, 9); g.line(x + s, y, x, y + s, "#ffffff", 9); g.rect(x, y + s, s + 1, 1, "#ffffff", null, 9); }); }
    if (a === "beacon") [[4, 4], [36, 4], [2, 14], [38, 14]].forEach(([x, y]) => g.line(x, y, x + (x < 20 ? 3 : -3), y + 3, "#fff080", 9));
    if (a === "plug") { g.rect(15, 5, 2, 6, "#c0c8d0", null, 9); g.rect(23, 5, 2, 6, "#c0c8d0", null, 9); g.rect(13, 9, 14, 4, "#606870", null, 9); g.line(10, 4, 30, 14, "#e03030", 9); }
    if (a === "bolt") g.poly([[30, 0], [24, 9], [28, 9], [25, 17], [34, 6], [30, 6], [33, 0]], "#fff060", 9);
    if (a === "antenna") { g.line(20, 4, 20, 0, D, 9); g.rect(19, 0, 3, 2, "#ff4040", null, 9); }
  }
  const monCache = {};
  U.monSprite = function (m, size) {
    const key = m.id + "|" + (size || 40); if (monCache[key]) return monCache[key];
    const g = Grid(), L = shade(m.c1, 0.4), D = shade(m.c2 || m.c1, -0.1);
    (PLANS[m.plan] || PLANS.blob)(g, m, L, D);
    const pat = PAT[m.pat] || PAT.none;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (g.tag[i] === 1 && g.col[i] === m.c1 && pat(x, y)) g.col[i] = shade(m.c1, -0.25); }
    accessory(g, m, L, D);
    const c = document.createElement("canvas"); c.width = c.height = N; const ctx = c.getContext("2d");
    const out = shade(m.c2 || m.c1, -0.6);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (g.col[i]) { ctx.fillStyle = g.col[i]; ctx.fillRect(x, y, 1, 1); }
      else if ((x > 0 && g.col[i - 1]) || (x < N - 1 && g.col[i + 1]) || (y > 0 && g.col[i - N]) || (y < N - 1 && g.col[i + N])) { ctx.fillStyle = out; ctx.fillRect(x, y, 1, 1); }
    }
    if (size && size !== N) { const c2 = document.createElement("canvas"); c2.width = c2.height = size; const x2 = c2.getContext("2d"); x2.imageSmoothingEnabled = false; x2.drawImage(c, 0, 0, size, size); return (monCache[key] = c2); }
    return (monCache[key] = c);
  };
  const iconCache = {};
  U.monIcon = (m, dark) => { const k = m.id + (dark ? "_d" : ""); if (iconCache[k]) return iconCache[k]; const s = U.monSprite(m); let c = s; if (dark) { c = document.createElement("canvas"); c.width = c.height = 40; const x = c.getContext("2d"); x.drawImage(s, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#3a4a3a"; x.fillRect(0, 0, 40, 40); } return (iconCache[k] = c.toDataURL()); };

  /* ---------------- 배지: 16x16 엠블럼 ---------------- */
  const B = 16, C = 7.5;
  const inPoly = (x, y, pts) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
  const P_ = (pts) => (x, y) => inPoly(x + 0.5, y + 0.5, pts);
  const starPts = (() => { const o = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 3.7 : 8.6; o.push([8 + r * Math.cos(a), 8.6 + r * Math.sin(a)]); } return o; })();
  const SHAPE = {
    circle: (x, y) => Math.hypot(x - C, y - C) <= 7.7,
    hex: P_([[8, -0.3], [15.6, 4], [15.6, 12], [8, 16.3], [0.4, 12], [0.4, 4]]),
    square: (x, y) => { const dx = Math.abs(x - C), dy = Math.abs(y - C); return dx <= 7.5 && dy <= 7.5 && Math.hypot(Math.max(0, dx - 5), Math.max(0, dy - 5)) <= 2.6; },
    drop: (x, y) => (y >= 8 ? Math.hypot(x - C, y - 9.3) <= 6.7 : inPoly(x + 0.5, y + 0.5, [[8, -0.5], [14.6, 9.5], [1.4, 9.5]])),
    octagon: P_([[4.8, 0], [11.2, 0], [16, 4.8], [16, 11.2], [11.2, 16], [4.8, 16], [0, 11.2], [0, 4.8]]),
    diamond: P_([[8, -0.4], [16.4, 8], [8, 16.4], [-0.4, 8]]),
    shield: (x, y) => inPoly(x + 0.5, y + 0.5, [[0.6, 0.6], [15.4, 0.6], [15.4, 8.5], [8, 16.2], [0.6, 8.5]]) && !((x === 0 || x === 15) && y === 0),
    pentagon: P_([[8, -0.4], [16.3, 6.1], [13.1, 15.8], [2.9, 15.8], [-0.3, 6.1]]),
    tri: P_([[8, -0.6], [16.4, 15.6], [-0.4, 15.6]]),
    moon: (x, y) => Math.hypot(x - C, y - C) <= 7.7 && Math.hypot(x - 11.6, y - 3.6) > 5,
    cloud: (x, y) => Math.hypot(x - 4.3, y - 9.6) <= 4.1 || Math.hypot(x - 11.2, y - 9.2) <= 4.4 || Math.hypot(x - 7.6, y - 6) <= 5.6 || (y >= 9 && y <= 13.5 && x >= 1 && x <= 14.5),
    plug: (x, y) => (y >= 4 && y <= 14 && x >= 1 && x <= 14 && !(y === 14 && (x === 1 || x === 14))) || (y <= 4 && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12))),
    ring: (x, y) => Math.hypot(x - C, y - C) <= 7.7,
    star: P_(starPts),
    bolt: P_([[10.5, -0.3], [1.5, 9.3], [7, 9.3], [4, 16.4], [14.6, 5.8], [9, 5.8], [12.8, -0.3]]),
    medal: (x, y) => Math.hypot(x - C, y - 6.6) <= 6.6 || (y >= 10 && y <= 15.5 && ((x >= 2 && x <= 5 && !(y >= 14 && x === 3.5)) || (x >= 10 && x <= 13)) && !(y === 15 && (x === 3 || x === 4 || x === 11 || x === 12)))
  };
  const SYM_OFF = { tri: [3, 5], drop: [3, 5], shield: [3, 3], pentagon: [3, 4], plug: [3, 5], medal: [3, 2], cloud: [3, 4], moon: [2, 4] };
  const SHAPE_OF = { det: "circle", pol: "hex", cfg: "square", cxl: "drop", rec: "octagon", eq: "diamond", l0: "shield", l0p: "pentagon", l0s: "tri", l1: "moon", l2: "cloud", dis: "plug", lb: "ring", hr: "bolt", master: "star" };
  // 심볼: 10x10 영역 함수 → 1(밝은색) / 2(진한 강조)
  const line = (x, y, x0, y0, x1, y1, w = 0.6) => { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy; const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2)); return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)) <= w; };
  const pl = (x, y, pts, w) => pts.some((p, i) => i && line(x, y, pts[i - 1][0], pts[i - 1][1], p[0], p[1], w));
  const SYM = {
    radar: (x, y) => { const d = Math.hypot(x - 1.5, y - 8.5); return d < 1.6 || (x >= 1 && y <= 9 && (Math.abs(d - 4.6) < 0.7 || Math.abs(d - 7.7) < 0.7)); },
    pulse: (x, y) => pl(x, y, [[0, 5.5], [2.5, 5.5], [3.6, 1.5], [5.6, 8.8], [6.8, 5.5], [9.5, 5.5]], 0.62),
    grid: (x, y) => (x % 3.5 < 1.1 || y % 3.5 < 1.1) && x < 9 && y < 9 ? 1 : 0,
    fork: (x, y) => pl(x, y, [[4.5, 9.5], [4.5, 5]], 0.7) || pl(x, y, [[4.5, 5], [1, 1]], 0.7) || pl(x, y, [[4.5, 5], [8, 1]], 0.7) || Math.hypot(x - 1, y - 1) < 1.3 || Math.hypot(x - 8, y - 1) < 1.3,
    cycle: (x, y) => { const d = Math.hypot(x - 4.5, y - 4.5), a = Math.atan2(y - 4.5, x - 4.5); const ring = Math.abs(d - 3.6) < 0.75 && !(a > -0.2 && a < 0.6) && !(a > 2.95 || a < -2.55); return ring || pl(x, y, [[6.6, 2.6], [8.6, 4.2], [9.4, 1.8]], 0.55) || pl(x, y, [[2.4, 6.6], [0.4, 5], [-0.2, 7.4]], 0.55); },
    bars_f: (x, y) => { const H = [4, 7, 9, 6, 8]; const i = Math.floor(x / 2); return x % 2 < 1.2 && i < 5 && y >= 9.5 - H[i]; },
    link_f: (x, y) => { const r1 = Math.hypot((x - 3) / 1.25, y - 5.5), r2 = Math.hypot((x - 6.5) / 1.25, y - 4); return Math.abs(r1 - 2.7) < 0.7 || Math.abs(r2 - 2.7) < 0.7; },
    half: (x, y) => { const c = Math.round(x); if (c % 2 || c > 8) return 0; return c <= 2 ? 1 : (Math.round(y) % 3 === 0 ? 2 : 0); },
    fts: (x, y) => pl(x, y, [[1.5, 1.5], [4, 4], [1.5, 6.5]], 0.62) || pl(x, y, [[4.8, 1.5], [7.3, 4], [4.8, 6.5]], 0.62),
    moon: (x, y) => (Math.hypot(x - 4.5, y - 4.8) <= 4 && Math.hypot(x - 6.6, y - 3) > 3.3) || (Math.hypot(x - 8.5, y - 8.4) < 0.8),
    zzz: (x, y) => pl(x, y, [[0.5, 3], [5, 3], [0.5, 9], [5.5, 9]], 0.6) || pl(x, y, [[6, 0.5], [9, 0.5], [6, 4.5], [9.2, 4.5]], 0.5),
    plug: (x, y) => (line(x, y, 1, 0.5, 8, 7.5, 0.75) || line(x, y, 8, 0.5, 1, 7.5, 0.75) ? 2 : 0),
    loop: (x, y) => { const d = Math.hypot(x - 4.5, y - 4.5), a = Math.atan2(y - 4.5, x - 4.5); return (Math.abs(d - 3.5) < 0.75 && !(a > -1.4 && a < -0.6)) || pl(x, y, [[5.6, 0], [7.8, 1.2], [6.6, 3.2]], 0.55); },
    bolt: (x, y) => { const pts = [[6.5, 0], [1.5, 5.3], [4.4, 5.3], [2.6, 9.8], [8.2, 3.6], [5.2, 3.6], [7.6, 0]]; let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; },
    link: ["..........", "..........", ".XX....XX.", "XXXX..XXXX", "XXXXXXXXXX", "XXXXXXXXXX", "XXXX..XXXX", ".XX....XX.", "..........", ".........."],
    bars: ["......X...", "..X...X...", "..X...X.X.", "..X.X.X.X.", "X.X.X.X.X.", "X.X.X.X.X.", "X.X.X.X.X.", "X.X.X.X.X.", "..........", ".........."],
    crown: ["..........", "X...X...X.", "XX.XXX.XX.", "XXXXXXXXX.", "XoXXoXXoX.", "XXXXXXXXX.", "..........", "..........", "..........", ".........."],
    none: () => 0,
    crown_old: (x, y) => (y >= 4.5 && y <= 7 && x >= 1 && x <= 8 && !(y > 6.5 && (x < 1.5 || x > 7.5))) || (x >= 1 && x <= 2 && y >= 1.5 && y < 5) || (x >= 7 && x <= 8 && y >= 1.5 && y < 5) || (x >= 4 && x <= 5 && y >= 0.5 && y < 5) || (y >= 3 && y < 5 && x >= 2 && x <= 7 && Math.abs(x - 4.5) > 1.5 - (y - 3)) ? 1 : 0
  };
  const badgeCache = {};
  /* draw16: 16x16 배지 캔버스 (locked면 회색 실루엣) */
  U.badgeCanvas = function (st, locked) {
    const key = st.id + (st.isMaster ? "_m" : "") + (locked ? "_l" : ""); if (badgeCache[key]) return badgeCache[key];
    const c = document.createElement("canvas"); c.width = c.height = B; const g = c.getContext("2d");
    const shpName = st.shape && SHAPE[st.shape] && !(st.town === 1 || (st.isMaster && st.id === "l0")) ? st.shape : SHAPE_OF[st.isMaster ? "master" : st.id] || st.shape || "circle", shp = SHAPE[shpName];
    let sym = st.sym === "moon" ? (x, y) => (Math.hypot(x - 6.5, y - 3) < 0.8 || Math.hypot(x - 8.5, y - 6) < 0.6 ? 1 : 0) : shpName === "bolt" || shpName === "star" ? SYM.none : (SYM[st.sym] || SYM.radar);
    if (Array.isArray(sym)) { const bm = sym; sym = (x, y) => { const ch = (bm[Math.round(y)] || "")[Math.round(x)]; return ch === "X" ? 1 : ch === "o" ? 2 : 0; }; }
    const [ox, oy] = SYM_OFF[shpName] || [3, 3];
    const isRing = st.id === "lb" && !st.isMaster;
    const inside = (x, y) => x >= 0 && y >= 0 && x < B && y < B && shp(x, y) && !(isRing && Math.hypot(x - C, y - C) < 2.3);
    const border = (x, y) => !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    const top = locked ? "#a3aba3" : shade(st.color, 0.16), base = locked ? "#959d95" : st.color, bot = locked ? "#848c84" : shade(st.color, -0.18), edge = locked ? "#555d55" : shade(st.color2, -0.4);
    const sCol = locked ? "#c4ccc4" : "#ffffff", sShadow = locked ? "#737b73" : shade(st.color2, -0.05), sAcc = locked ? "#666e66" : "#d03030";
    const symAt = (x, y) => { if (isRing) return 0; const sx = x - ox, sy = y - oy; if (sx < 0 || sy < 0 || sx >= 10 || sy >= 10) return 0; return sym(sx, sy) || 0; };
    for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
      if (!inside(x, y)) continue;
      let col;
      if (border(x, y)) col = edge;
      else {
        const t = y / B; col = t < 0.38 ? top : t > 0.72 ? bot : base;
        if (border(x + 1, y + 1) && !border(x - 1, y - 1)) col = bot;           // 안쪽 그림자 (오른쪽 아래)
        if (border(x - 1, y - 1) && !border(x + 1, y + 1) && x + y < 11 && !locked) col = shade(st.color, 0.5); // 안쪽 하이라이트 (왼쪽 위 한 줄)
        if (isRing && Math.abs(Math.hypot(x - C, y - C) - 5.1) < 0.75) col = sCol;
        const v = symAt(x, y);
        if (v === 2) col = sAcc; else if (v) col = sCol; else if (symAt(x - 1, y - 1) === 1 && !border(x, y)) col = sShadow; // 심볼 그림자
      }
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    if (!locked) { // 반짝임: 왼쪽 위 작은 십자 하이라이트
      const hx = shpName === "tri" || shpName === "diamond" ? 6 : shpName === "star" ? 6 : 4, hy = shpName === "tri" ? 6 : shpName === "diamond" || shpName === "star" ? 5 : 3;
      if (inside(hx, hy) && !border(hx, hy) && !symAt(hx, hy)) { g.fillStyle = "#ffffff"; g.fillRect(hx, hy, 1, 1); g.fillStyle = "rgba(255,255,255,0.6)"; [[hx + 1, hy], [hx, hy + 1]].forEach(([a, b]) => { if (inside(a, b) && !border(a, b) && !symAt(a, b)) g.fillRect(a, b, 1, 1); }); }
    }
    return (badgeCache[key] = c);
  };
  U.badgeURL = (st, locked, scale = 3) => { const k = "u" + st.id + (st.isMaster ? "m" : "") + (locked ? "l" : "") + scale; if (badgeCache[k]) return badgeCache[k]; const s = U.badgeCanvas(st, locked); const c = document.createElement("canvas"); c.width = c.height = B * scale; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(s, 0, 0, B * scale, B * scale); return (badgeCache[k] = c.toDataURL()); };

  /* ---------------- 사운드 (WebAudio, 작은 칩튠) ---------------- */
  let AC = null;
  const unlock = () => { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} };
  window.addEventListener("pointerdown", unlock, { passive: true }); window.addEventListener("keydown", unlock);
  function tone(f, t0, d, type = "square", vol = 0.06) { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, AC.currentTime + t0); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + t0 + d); o.connect(g); g.connect(AC.destination); o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + d + 0.02); }
  U.sfx = function (kind) {
    if (!AC || U.muted) return;
    const SEQ = { ok: [[880, 0, 0.08], [1320, 0.07, 0.12]], ng: [[220, 0, 0.18, "sawtooth", 0.04]], combo: [[988, 0, 0.06], [1319, 0.05, 0.06], [1760, 0.1, 0.1]],
      levelup: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.3]],
      badge: [[523, 0, 0.12], [523, 0.13, 0.08], [523, 0.22, 0.08], [698, 0.32, 0.3], [784, 0.62, 0.14], [880, 0.76, 0.14], [1047, 0.9, 0.5]],
      ach: [[1175, 0, 0.08], [1568, 0.08, 0.18]], rule: [[784, 0, 0.07], [1047, 0.07, 0.14]] }[kind] || [];
    SEQ.forEach(([f, t, d, ty, v]) => tone(f, t, d, ty, v));
    if (kind === "badge") SEQ.forEach(([f, t, d]) => tone(f / 2, t, d, "triangle", 0.05));
  };

  /* ---------------- 배지 획득 팝업 (화면 위 오버레이) ---------------- */
  U.badgePopup = function (st, title, sub) {
    return new Promise((res) => {
      const scr = document.getElementById("app");
      const d = document.createElement("div"); d.className = "bpop";
      d.innerHTML = `<div class="rays"></div><div class="bwrap"><img class="bimg" alt=""><i class="sp s1"></i><i class="sp s2"></i><i class="sp s3"></i></div><div class="bt"></div><div class="bs"></div><div class="bk">A / 탭</div>`;
      d.querySelector(".bimg").src = U.badgeURL(st, false, 8);
      d.querySelector(".bt").textContent = title; d.querySelector(".bs").textContent = sub || "";
      scr.appendChild(d); U.sfx("badge");
      const t0 = Date.now();
      const close = () => { if (Date.now() - t0 < 700) return; window.G.setHandler(null); d.classList.add("out"); setTimeout(() => { d.remove(); res(); }, 250); };
      d.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); close(); });
      window.G.setHandler((b) => { if (b === "A" || b === "B") close(); });
    });
  };
  /* 토스트: 막지 않는 짧은 알림 (업적, 콤보) */
  U.toast = function (html, kind) {
    const scr = document.getElementById("screen"); let box = document.getElementById("toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; scr.appendChild(box); }
    const t = document.createElement("div"); t.className = "toast " + (kind || ""); t.innerHTML = html; box.appendChild(t);
    setTimeout(() => t.classList.add("out"), 2300); setTimeout(() => t.remove(), 2700);
  };
})();
