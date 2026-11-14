/* =========================================================
 * 저장 코드 & 점수 (브라우저 + Node 공용, 서버 불필요)
 * 코드 형식: "SPEC1." + base64url( [flag 1B][CRC32 4B][payload] )
 *   flag 1 = deflate-raw 압축, 0 = 비압축 JSON
 *   CRC32는 압축 전 JSON 바이트 기준 → 오타/잘림 검출
 * ========================================================= */
(function (root, factory) {
  const M = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else root.SaveCode = M;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const PREFIX = "SPEC1.";
  const isNode = typeof process !== "undefined" && process.versions && process.versions.node && typeof window === "undefined";

  /* ---- CRC32 ---- */
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(bytes) { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC_T[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

  /* ---- base64url ---- */
  function b64urlEncode(bytes) {
    if (isNode) return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/"); while (str.length % 4) str += "=";
    if (isNode) return new Uint8Array(Buffer.from(str, "base64"));
    const s = atob(str); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out;
  }

  /* ---- 압축 ---- */
  const canStream = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
  async function streamThrough(bytes, ts) { const s = new Blob([bytes]).stream().pipeThrough(ts); return new Uint8Array(await new Response(s).arrayBuffer()); }
  async function deflate(bytes) {
    if (isNode) return new Uint8Array(require("zlib").deflateRawSync(Buffer.from(bytes), { level: 9 }));
    if (canStream()) return streamThrough(bytes, new CompressionStream("deflate-raw"));
    return null;
  }
  async function inflate(bytes) {
    if (isNode) return new Uint8Array(require("zlib").inflateRawSync(Buffer.from(bytes)));
    if (canStream()) return streamThrough(bytes, new DecompressionStream("deflate-raw"));
    throw new Error("이 브라우저는 압축 해제를 지원하지 않습니다 (iOS 16.4 이상 필요).");
  }
  const enc = (s) => new TextEncoder().encode(s);
  const dec = (b) => new TextDecoder().decode(b);

  /* ---- 상태 압축 표현 ---- */
  function pack(P) {
    const o = JSON.parse(JSON.stringify(P));
    o.learned = Object.keys(P.learned || {});           // 타임스탬프 제거 → 압축률 ↑
    o.seenQ = Object.entries(P.seenQ || {}).map(([k, v]) => (v.st ? [k, v.n, v.ok, v.st] : [k, v.n, v.ok]));
    o.rules = Object.entries(P.rules || {}).map(([k, v]) => [k, v]);
    o.mastery = Object.entries(P.mastery || {}).map(([k, v]) => [k, v.n, v.ok]);
    o.flags = Object.keys(P.flags || {}).filter((k) => P.flags[k]);
    o.playMs = Math.round(P.playMs || 0);
    return { v: 1, s: o };
  }
  function unpack(obj) {
    if (!obj || obj.v !== 1 || typeof obj.s !== "object") throw new Error("지원하지 않는 저장 코드 버전입니다.");
    const o = obj.s; const P = Object.assign({}, o);
    P.learned = {}; (o.learned || []).forEach((k) => (P.learned[k] = 1));
    P.seenQ = {}; (o.seenQ || []).forEach(([k, n, ok, st]) => (P.seenQ[k] = { n, ok, st: st || 0 }));
    P.rules = {}; (Array.isArray(o.rules) ? o.rules : []).forEach(([k, v]) => (P.rules[k] = v));
    P.mastery = {}; (o.mastery || []).forEach(([k, n, ok]) => (P.mastery[k] = { n, ok }));
    P.flags = {}; (o.flags || []).forEach((k) => (P.flags[k] = true));
    return P;
  }

  async function encode(P) {
    const raw = enc(JSON.stringify(pack(P)));
    const z = await deflate(raw);
    const body = z || raw, flag = z ? 1 : 0, c = crc32(raw);
    const out = new Uint8Array(5 + body.length);
    out[0] = flag; out[1] = c >>> 24; out[2] = (c >>> 16) & 255; out[3] = (c >>> 8) & 255; out[4] = c & 255; out.set(body, 5);
    return PREFIX + b64urlEncode(out);
  }
  async function decode(code) {
    code = String(code || "").replace(/\s+/g, "");
    const h = code.indexOf("#save="); if (h >= 0) code = code.slice(h + 6);
    if (!code.startsWith(PREFIX)) throw new Error("SPEC1. 으로 시작하는 저장 코드가 아닙니다.");
    let bytes; try { bytes = b64urlDecode(code.slice(PREFIX.length)); } catch (e) { throw new Error("코드에 잘못된 문자가 있습니다."); }
    if (bytes.length < 6) throw new Error("코드가 너무 짧습니다(잘렸을 수 있음).");
    const flag = bytes[0], want = ((bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4]) >>> 0;
    let raw; try { raw = flag === 1 ? await inflate(bytes.subarray(5)) : bytes.subarray(5); } catch (e) { throw new Error(e.message && e.message.includes("iOS") ? e.message : "코드가 손상되었습니다(압축 해제 실패)."); }
    if (crc32(raw) !== want) throw new Error("체크섬 불일치: 코드가 잘리거나 바뀌었습니다.");
    let obj; try { obj = JSON.parse(dec(raw)); } catch (e) { throw new Error("코드 내용을 읽을 수 없습니다."); }
    return unpack(obj);
  }

  /* ---- 검증 (치트/손상 방지 기본 점검) ---- */
  const BADGES = ["l0", "dl", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "champ"], LTSSM = ["Detect", "Polling", "Configuration", "L0"];
  /* 구버전(v1 진행 구조) 저장 → 현재 구조로 이주 (SPEC.LTSSM.migrate) */
  function migrate(P, SPEC) { return SPEC && SPEC.LTSSM && SPEC.LTSSM.migrate ? SPEC.LTSSM.migrate(P) : { P, migrated: false }; }
  function validate(P, SPEC) {
    const err = [];
    const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    if (!int(P.lv, 1, 99)) err.push("레벨 범위 오류");
    if (!int(P.xp, 0, 10 + (P.lv || 1) * 10)) err.push("경험치 범위 오류");
    if (!int(P.hp, 0, 30 + 6 * ((P.lv || 1) - 1))) err.push("HP 범위 오류");
    if (!int(P.x, 0, 200) || !int(P.y, 0, 200)) err.push("위치 오류");
    if (!["up", "down", "left", "right"].includes(P.dir)) err.push("방향 오류");
    if (!LTSSM.includes(P.ltssm)) err.push("LTSSM 상태 오류");
    if (!int(P.gen, 1, 7) || ![1, 2, 4, 8, 16].includes(P.width)) err.push("Gen/폭 오류");
    if (!int(P.chapter, 1, 12)) err.push("챕터 오류");
    if (!Array.isArray(P.badges) || P.badges.some((b) => !BADGES.includes(b))) err.push("배지 오류");
    if (P.badges && P.badges.includes("dl") && !P.badges.includes("l0")) err.push("배지 순서 오류");
    // 마을 관장 배지는 순서대로만 (g2 ← l0, gN ← gN-1, champ ← g10)
    if (Array.isArray(P.badges)) for (let n = 2; n <= 11; n++) { const b = n === 11 ? "champ" : "g" + n, prev = n === 2 ? "l0" : "g" + (n - 1); if (P.badges.includes(b) && !P.badges.includes(prev)) { err.push("배지 순서 오류"); break; } }
    if (P.badges && P.badges.length && P.ltssm !== "L0") err.push("배지-LTSSM 불일치");
    if (!Array.isArray(P.moves)) err.push("기술 오류");
    if (typeof P.items !== "object" || Object.values(P.items).some((n) => !int(n, 0, 999))) err.push("아이템 오류");
    if (P.playMs != null && !(Number.isFinite(P.playMs) && P.playMs >= 0 && P.playMs <= 1e10)) err.push("플레이 시간 오류");
    if (SPEC) {
      if (P.moves.some((m) => !SPEC.MOVES.find((x) => x.id === m))) err.push("알 수 없는 기술");
      if (Object.keys(P.learned).some((k) => !SPEC.CONCEPTS[k])) err.push("알 수 없는 개념");
      if (Object.keys(P.items).some((k) => !SPEC.ITEMS[k])) err.push("알 수 없는 아이템");
      const LQ = SPEC.LTSSM ? SPEC.LTSSM.LQ : [];
      const qids = new Set(SPEC.QUESTIONS.map((q) => q.id).concat(LQ.map((q) => q.id)));
      if (Object.keys(P.seenQ).some((k) => !qids.has(k))) err.push("알 수 없는 문제");
      if (SPEC.LTSSM) {
        const L = SPEC.LTSSM, sids = L.STATES.map((s) => s.id);
        if (P.sbadges != null && (!Array.isArray(P.sbadges) || P.sbadges.some((b) => !sids.includes(b)) || new Set(P.sbadges).size !== P.sbadges.length)) err.push("state 배지 오류");
        if (P.rules != null && (typeof P.rules !== "object" || Object.entries(P.rules).some(([k, v]) => !L.RULES[k] || !int(v, 0, 99)))) err.push("규칙 기록 오류");
        // state 배지는 그 state의 규칙을 모두 습득했을 때만
        (P.sbadges || []).forEach((b) => { const st = L.STATES.find((s) => s.id === b); if (st && Object.keys(st.rules).some((r) => ((P.rules || {})[r] || 0) < L.RULE_NEED)) err.push("배지-규칙 불일치"); });
        if (P.ach != null && (!Array.isArray(P.ach) || P.ach.some((a) => !L.ACH.find((x) => x.id === a)))) err.push("업적 오류");
        if (P.met != null && (!Array.isArray(P.met) || P.met.some((m) => !SPEC.MONSTERS[m]))) err.push("몬스터 기록 오류");
        if (P.st != null && (typeof P.st !== "object" || ["cs", "bs", "pf"].some((k) => P.st[k] != null && !int(P.st[k], 0, 1e6)))) err.push("통계 오류");
      }
    }
    for (const v of Object.values(P.seenQ || {})) if (!int(v.n, 0, 1e5) || !int(v.ok, 0, v.n) || (v.st != null && !int(v.st, 0, v.ok))) { err.push("문제 기록 오류"); break; }
    return err;
  }

  /* ---- 점수 ---- */
  function stats(P) {
    let n = 0, ok = 0; Object.values(P.seenQ || {}).forEach((v) => { n += v.n; ok += v.ok; });
    const rules = Object.values(P.rules || {}).filter((v) => v >= 2).length;
    return { answered: n, correct: ok, acc: n ? ok / n : 0, concepts: Object.keys(P.learned || {}).length, badges: (P.badges || []).length, sbadges: (P.sbadges || []).length, rules, lv: P.lv, playMin: Math.round((P.playMs || 0) / 60000) };
  }
  /* 점수 = 레벨×100 + 관장 배지×500 + 챔피언 3000 + state 배지×200 + 습득 규칙×15 + 도감×30 + 정답×10 + 정확도 보너스(10문제 이상 답했을 때 정확도%×5) */
  function computeScore(P) {
    const s = stats(P);
    const parts = { level: s.lv * 100, badges: s.badges * 500, champ: (P.badges || []).includes("champ") ? 3000 : 0, sbadges: s.sbadges * 200, rules: s.rules * 15, dex: s.concepts * 30, correct: s.correct * 10, accuracy: s.answered >= 10 ? Math.round(s.acc * 100) * 5 : 0 };
    return Object.assign(s, { parts, score: Object.values(parts).reduce((a, b) => a + b, 0) });
  }
  /* 닉네임: 2~12자, 한글/영문/숫자/_/- */
  const NICK_RE = /^[가-힣A-Za-z0-9_\-]{2,12}$/;
  const cleanNick = (s) => String(s || "").trim().normalize("NFC");
  const validNick = (s) => NICK_RE.test(cleanNick(s));

  return { PREFIX, encode, decode, validate, migrate, computeScore, stats, validNick, cleanNick, crc32 };
});
