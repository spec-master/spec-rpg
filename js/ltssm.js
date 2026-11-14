/* =========================================================
 * 1번 마을: LTSSM (PCIe 7.0 Base 7.0-1.0-PUB 기준, CXL 4.0 공통 항목 포함)
 * STATES: state별 규칙(rule) · 배지 · 몬스터
 * 규칙은 그 규칙에 대한 문제를 2번 맞히면 '습득', state의 모든 규칙을 습득하면 그 state 배지 획득.
 * ========================================================= */
(function () {
  "use strict";
  const SPEC = typeof window !== "undefined" ? window.SPEC : require("./data.js");
  const Q = typeof window !== "undefined" ? [].concat(window.LTSSM_Q1, window.LTSSM_Q2, window.LTSSM_Q3)
    : [].concat(require("./ltssm_q1.js"), require("./ltssm_q2.js"), require("./ltssm_q3.js"));
  const RULE_NEED = 2;

  /* core: 관장 도전에 필요한 핵심 배지 */
  const STATES = [
    { id: "det", name: "Detect", core: true, color: "#3fb6e8", color2: "#1d6f9a", shape: "circle", sym: "radar",
      intro: "리셋 후 첫 state. 상대 Receiver를 전기적으로 감지한다.",
      rules: { det1: "Detect.Quiet 진입: LinkUp=0b, EQ·Flit·속도 변수 리셋", det2: "Quiet → Active: 12 ms timeout 또는 아무 Lane EI exit", det3: "비-2.5 GT/s 진입 시 최소 1 ms 체류하며 2.5 GT/s로, Rx는 1 ms 안에 ZRX-DC", det4: "Active: 전 Lane 감지 → Polling / 미감지 → Quiet", det5: "부분 감지: 12 ms 후 재검사, 같으면 그 Lane으로 Polling, 나머지 Lane은 EI", det6: "Receiver Detection 원리(종단 충전 시간), Hot Reset 후 DSP는 EI exit 감지 전 2 ms 대기 권장" } },
    { id: "pol", name: "Polling", core: true, color: "#f0c040", color2: "#a07810", shape: "hex", sym: "pulse",
      intro: "PAD 번호 TS1/TS2를 주고받아 bit/symbol lock과 극성을 맞춘다.",
      rules: { pol1: "Polling.Active: PAD TS1 송신, 32.0 GT/s까지만 광고", pol2: "Active exit: TS1 ≥1024 송신 + 전 Lane PAD TS 8연속 수신", pol3: "Active 24 ms timeout: Configuration / Compliance / Detect 분기", pol4: "Polling.Compliance: 측정용, 전체 timeout 없음", pol5: "Polling.Configuration: PAD TS2, 극성 반전, 8연속+16송신 → Configuration, 48 ms → Detect", pol6: "Polling.Speed는 도달 불가: 2.5 GT/s L0에 오른 뒤 Recovery로 속도 변경" } },
    { id: "cfg", name: "Configuration", core: true, color: "#50c878", color2: "#207848", shape: "square", sym: "grid",
      intro: "Link 번호·Lane 번호·폭, Flit Mode/L0p 지원을 정한다. 초기 훈련에서는 2.5 GT/s.",
      rules: { cfg1: "순서 Linkwidth.Start→Accept→Lanenum→Complete→Idle, 초기 훈련은 2.5 GT/s", cfg2: "Linkwidth.Start: DSP가 Link 번호, 24 ms → Detect, crosslink는 Tcrosslink", cfg3: "Linkwidth.Accept: DSP가 Lane 번호 부여, 2 ms → Detect", cfg4: "Lanenum.Accept/Wait: 폭 축소·Lane Reversal, Accept는 ms timeout 없음, Wait 2 ms", cfg5: "Flit Mode는 Linkwidth.Accept에서 Enabled, Complete: 구성 번호 TS2·L0p capability 협상, 8연속+16송신", cfg6: "Idle: Idle Symbol/IDLE Flit → L0(초기 훈련은 2.5 GT/s), 실패 시 RcvrLock(itr<FFh) 또는 Detect", cfg7: "Disable/Loopback 요청 TS1 2연속 → Disabled/Loopback" } },
    { id: "cxl", name: "Flex Bus (CXL)", core: false, tag: "CXL/공통", color: "#c070f0", color2: "#6a2a9a", shape: "drop", sym: "fork",
      intro: "CXL 4.0(공통): PCIe LTSSM 위에서 Modified TS1/TS2로 CXL 모드를 협상한다.",
      rules: { cxl1: "PCIe 규칙으로 학습, Configuration 중(2.5 GT/s L0 전) Modified TS1/TS2로 Alternate Protocol Negotiation", cxl2: "CXL 모드는 8 GT/s 이상에서만", cxl3: "CXL 4.0: optional retimer 최대 4개", cxl4: "CXL 4.0: 128 GT/s(PCIe 7.0 PHY), x2 native는 128 GT/s에서만, 64/128은 256B Flit", cxl5: "256B Flit mode는 PCIe Flit mode에서 함의(전용 비트 없음)" } },
    { id: "rec", name: "Recovery", core: true, color: "#ff8040", color2: "#a84010", shape: "octagon", sym: "cycle",
      intro: "속도 변경·EQ·오류 복구·재훈련의 중심. 링크를 끊지 않고 다시 맞춘다.",
      rules: { rec1: "역할과 정상 속도 상승 경로", rec2: "RcvrLock: 구성 번호 TS1, 24 ms timeout 분기", rec3: "fallback: 1b/1b였으면 32.0 GT/s, 그 외 2.5, csr=1b면 진입 속도", rec4: "Recovery.Speed: EIOSQ→EI, 성공 ≥800 ns / 실패 ≥6 µs, Detect 48 ms(<64) / 96 ms(≥64)", rec5: "RcvrCfg: TS2, 48 ms, speed_change·EQ 후 폭 변경 금지", rec6: "Recovery.Idle: 1b/1b SDS×2→Control SKP→IDLE Flit, 2 ms timeout" } },
    { id: "eq", name: "Equalization", core: false, color: "#40e0d0", color2: "#107870", shape: "diamond", sym: "bars",
      intro: "8 GT/s 이상에서 Tx FIR preset/계수를 맞추는 Recovery.Equalization Phase 0~3.",
      rules: { eq1: "EC 00/01/10/11 = Phase 0~3, USP는 Phase 0부터(DSP 요청 preset), DSP는 Phase 1부터", eq2: "Phase 2 = USP가 DSP Tx 조정, Phase 3 = DSP가 USP Tx 조정, 원격은 Tx만", eq3: "Phase timeout: ≤32 GT/s DSP 24/32/24, USP 12/12/24/32, 64+는 Ph2/Ph3 2배", eq4: "요청당 <2 ms(≤32), 64+는 제한 없음, timeout이면 Complete=1b(성공 아님)", eq5: "Preset P0–P10(NRZ) / Q0–Q10(PAM4), Q0 flat, Q5–Q9 c-2", eq6: "64+ EQ는 TS0, No EQ Needed 생략, Detect 후 재수행" } },
    { id: "l0", name: "L0", core: true, color: "#4f78ff", color2: "#20308a", shape: "shield", sym: "link",
      intro: "정상 동작 상태. 인코딩과 Ordered Set의 쓰임도 여기서 익힌다.",
      rules: { l01: "Configuration.Idle/Recovery.Idle에서 진입, LinkUp=1b", l02: "L0 → Recovery: TS1/TS2·EIEOS 수신, directed speed change, EI 추론 128 µs", l03: "인코딩: 8b/10b(2.5/5), 128b/130b(8/16/32 Non-Flit), 1b/1b PAM4(64/128)", l04: "L0 → L1/L2: 지시 + EIOS 수신 + EIOSQ 송신", l05: "Ordered Set: EIOS, EIEOS, SKP/Control SKP, SDS" } },
    { id: "l0p", name: "L0p", core: false, color: "#7fd0ff", color2: "#2a6a9a", shape: "pentagon", sym: "half",
      intro: "Flit Mode 전용. L0 안에서 Link Management DLLP로 활성 폭만 조절한다.",
      rules: { lp1: "L0의 일부, Flit Mode 전용, Link Management DLLP로 폭 변경", lp2: "대칭 폭, 방향마다 최소 1 Lane, x1~구성 폭 지원", lp3: "타이밍: 응답 1 µs(8b/10b 4 µs), 5 Flit에 최대 3 DLLP, Ack 후 16 µs", lp4: "Configuration에서 끈 Lane은 L0p로 못 켬(Flit Mode는 Upconfigure 미지원), Recovery 시 구성 폭 복귀", lp5: "Flit Retimer는 필수, Flit Mode에서 L0s 대신" } },
    { id: "l0s", name: "L0s", core: false, color: "#a0a0ff", color2: "#4a4a9a", shape: "circle", sym: "fts",
      intro: "Non-Flit 전용 빠른 절전. Tx/Rx가 따로 들어가고 FTS로 바로 L0 복귀.",
      rules: { s1: "Flit Mode 미지원, Tx/Rx 분리", s2: "Tx_L0s.Entry: EIOSQ→EI, TTX-IDLE-MIN 20 ns", s3: "Tx_L0s.FTS: N_FTS개 FTS(Extended Synch 4096), 128b/130b 끝 EIEOSQ+SDS", s4: "Rx_L0s.FTS: lock 실패(N_FTS timeout) → Recovery", s5: "TS1 Symbol 3 = N_FTS (Flit에서는 EFM_CNTL1)" } },
    { id: "l1", name: "L1", core: false, color: "#f4d35e", color2: "#6a5a1a", shape: "moon", sym: "moon",
      intro: "양방향 절전. LTSSM은 L1.Entry/L1.Idle, 그 안에서 L1 PM Substates(L1.1/L1.2).",
      rules: { a1: "LTSSM substate는 L1.Entry/L1.Idle, 진입·탈출 시 L1.0", a2: "L1.Entry: EI, TTX-IDLE-MIN 후 L1.Idle", a3: "탈출은 Recovery 경유, 비-2.5면 최소 40 ns", a4: "L1.1/L1.2: CLKREQ#, 둘 다 Refclk 불필요, L1.2만 common mode 해제, ASPM L1.2는 LTR 필요", a5: "L1.2 타이밍: TPOWER_OFF ≤2 µs, TL1.2 ≥4 µs", a6: "USP는 L1.0 전 CLKREQ# deassert 금지" } },
    { id: "l2", name: "L2", core: false, color: "#8a7cff", color2: "#302a6a", shape: "moon", sym: "zzz",
      intro: "주 전원을 끌 수 있는 깊은 절전. Beacon/WAKE#로 깨어나 Detect부터.",
      rules: { b1: "L2.Idle / L2.TransmitWake(USP), main power 제거 가능", b2: "Beacon은 Upstream→Root 방향만, 최소 Lane 0", b3: "DSP: Beacon/지시 → (전원 복구) Detect, Switch는 위로 전달", b4: "USP: predetermined Lane EI exit → Detect", b5: "L2.Idle: Rx 1 ms 안에 ZRX-DC, Tx EI ≥ TTX-IDLE-MIN" } },
    { id: "dis", name: "Disabled", core: false, color: "#9aa0a8", color2: "#3a3f46", shape: "square", sym: "plug",
      intro: "링크를 꺼 두는 state. 진입은 Disable_Link_Request TS1 또는 소프트웨어.",
      rules: { x1: "진입: 소프트웨어 Link Disable 또는 Disable_Link_Request TS", x2: "TS1 16–32개 → EIOSQ → EI", x3: "진입 시 LinkUp Clear 권장", x4: "USP: EI exit → Detect, EIOS 없으면 2 ms / DSP: 지시 → Detect", x5: "Training Control: Disable bit 1, 1b/1b 0010b" } },
    { id: "lb", name: "Loopback", core: false, color: "#ff70b0", color2: "#8a2050", shape: "ring", sym: "loop",
      intro: "테스트용. Lead가 보낸 심볼을 Follower가 되돌려 보낸다.",
      rules: { lb1: "Lead/Follower, Entry에서 LinkUp=0b", lb2: "Loopback_Request TS1 2연속(Flit Recovery는 RcvrCfg TS2 8연속) → Follower 진입", lb3: "Active: Follower가 심볼 echo", lb4: "Entry 실패: 구현 정의 <100 ms 후 Exit", lb5: "Exit: EIOS(8연속, >2.5 지원 시), EI 2 ms → Detect", lb6: "속도 변경 1 ms, bit 2 / 1b/1b 0100b" } },
    { id: "hr", name: "Hot Reset", core: false, color: "#ffd000", color2: "#a05000", shape: "star", sym: "bolt",
      intro: "Hot_Reset_Request TS1로 링크 너머를 리셋한다.",
      rules: { h1: "Hot_Reset_Request(구성 번호), DSP 개시·USP는 Recovery.Idle에서 진입(Flit은 RcvrCfg TS2로 전달)", h2: "2연속 수신 → LinkUp=0b → Detect", h3: "2 ms timeout, 유지 중 2연속 수신은 타이머 리셋", h4: "Switch USP는 Downstream Port로 전파", h5: "LinkUp=0 → DL_Inactive, 1b/1b 0001b" } }
  ];
  const MASTER = { id: "l0", name: "LTSSM 마스터", color: "#ffd700", color2: "#a06000", shape: "star", sym: "crown" };

  /* 몬스터: plan(체형) / c1·c2(색) / pat(무늬) / acc(장식) / rules(집중 규칙) */
  const M = (id, name, fam, sub, plan, c1, c2, pat, acc, rules, extra) => Object.assign({ id, name, fam, sub, plan, c1, c2, pat, acc, rules, ltssm: true }, extra || {});
  const LMON = [
    M("quietbug", "콰이엇 딱정이", "det", "Detect.Quiet", "bug", "#5aa9d6", "#1d4f70", "spots", "antenna", ["det1", "det2", "det3"]),
    M("radarbug", "레이더 딱정이", "det", "Detect.Active", "bug", "#3fd6c0", "#136a5e", "stripes", "dish", ["det4", "det5", "det6"]),
    M("pulsebird", "펄스버드", "pol", "Polling.Active", "bird", "#f0c040", "#9a6a10", "none", "crest", ["pol1", "pol2", "pol3"]),
    M("complybird", "컴플라이 버드", "pol", "Polling.Compliance", "bird", "#e08040", "#7a3a10", "stripes", "goggles", ["pol3", "pol4"]),
    M("cfgbird", "토큰 버드", "pol", "Polling.Configuration", "bird", "#f8e070", "#8a7020", "spots", "crest", ["pol5", "pol6"]),
    M("widthsnake", "와이드 스네이크", "cfg", "Config.Linkwidth.Start", "serpent", "#50c878", "#1e6a3e", "stripes", "horn", ["cfg1", "cfg2"]),
    M("acceptsnake", "어셉트 스네이크", "cfg", "Config.Linkwidth.Accept", "serpent", "#8ad860", "#3a7020", "spots", "none", ["cfg3"]),
    M("lanenaga", "레인넘 나가", "cfg", "Config.Lanenum.Wait/Accept", "serpent", "#40b0a0", "#16584e", "diamonds", "crown", ["cfg4"]),
    M("completenaga", "컴플리트 나가", "cfg", "Config.Complete/Idle", "serpent", "#2fa860", "#0e4a28", "stripes", "crown", ["cfg5", "cfg6", "cfg7"]),
    M("flexfish", "플렉스 피시", "cxl", "Alternate Protocol Negotiation", "fish", "#c070f0", "#5a2a8a", "stripes", "fin", ["cxl1", "cxl2", "cxl5"]),
    M("retimerfish", "리타이머 피시", "cxl", "CXL 4.0 Retimer ×4", "fish", "#e090ff", "#7a3aa0", "spots", "fin", ["cxl3", "cxl4"]),
    M("lockgolem", "락 골렘", "rec", "Recovery.RcvrLock", "golem", "#ff8040", "#8a3a10", "panel", "antenna", ["rec1", "rec2", "rec3"]),
    M("speedgolem", "스피드 골렘", "rec", "Recovery.Speed", "golem", "#ffb040", "#8a5a10", "stripes", "jet", ["rec3", "rec4"]),
    M("cfggolem", "RcvrCfg 골렘", "rec", "Recovery.RcvrCfg/Idle", "golem", "#e06030", "#702a10", "panel", "horn", ["rec5", "rec6"]),
    M("eq0crystal", "Phase0 크리스탈", "eq", "EQ Phase 0/1", "crystal", "#7af0e0", "#1a8070", "none", "none", ["eq1", "eq6"]),
    M("eq2crystal", "Phase2 크리스탈", "eq", "EQ Phase 2", "crystal", "#40d0f0", "#105a80", "facet", "none", ["eq2", "eq3"]),
    M("eq3crystal", "Phase3 크리스탈", "eq", "EQ Phase 3", "crystal", "#50a0ff", "#1a3a9a", "facet", "spark", ["eq3", "eq4", "eq5"]),
    M("linkcat", "링크캣", "l0", "L0", "cat", "#4f78ff", "#1a2a7a", "stripes", "none", ["l01", "l02", "l03"]),
    M("osetcat", "오더셋 캣", "l0", "L0 · Ordered Set", "cat", "#6a5aff", "#2a1a8a", "spots", "bell", ["l04", "l05", "l03"]),
    M("halfturtle", "하프 거북", "l0p", "L0p", "turtle", "#7fd0ff", "#22608a", "hexes", "none", ["lp1", "lp2", "lp3", "lp4", "lp5"]),
    M("txbat", "Tx_L0s 박쥐", "l0s", "Tx_L0s", "bat", "#a0a0ff", "#3a3a8a", "none", "none", ["s1", "s2", "s3", "s5"]),
    M("rxbat", "Rx_L0s 박쥐", "l0s", "Rx_L0s", "bat", "#c0a0f0", "#5a3a8a", "spots", "fang", ["s1", "s4", "s5"]),
    M("l1shroom", "L1 졸음버섯", "l1", "L1.Entry/Idle", "shroom", "#f4d35e", "#8a6a1a", "spots", "none", ["a1", "a2", "a3", "a6"]),
    M("l12shroom", "L1.2 꿀잠버섯", "l1", "L1 PM Substates", "shroom", "#ffa0c0", "#8a3a5a", "spots", "zzz", ["a4", "a5", "a6"]),
    M("l2ghost", "L2 고스트", "l2", "L2.Idle", "ghost", "#b8b0ff", "#4a40a0", "none", "zzz", ["b1", "b4", "b5"]),
    M("wakeghost", "웨이크 고스트", "l2", "L2.TransmitWake", "ghost", "#ffe080", "#a07a10", "none", "beacon", ["b2", "b3"]),
    M("plugblob", "플러그 슬라임", "dis", "Disabled", "blob", "#9aa0a8", "#3a3f46", "none", "plug", ["x1", "x2", "x3", "x4", "x5"]),
    M("leadjelly", "리드 해파리", "lb", "Loopback Lead", "jelly", "#ff70b0", "#8a2050", "none", "none", ["lb1", "lb4", "lb5", "lb6"]),
    M("echojelly", "에코 해파리", "lb", "Loopback Follower", "jelly", "#70ffd0", "#108a60", "spots", "none", ["lb2", "lb3"]),
    M("resetdrake", "리셋 드레이크", "hr", "Hot Reset", "dragon", "#ffd000", "#a05000", "stripes", "bolt", ["h1", "h2", "h3", "h4", "h5"]),
    M("kinggolem", "Recovery 킹골렘", "rec", "관장 1번째", "golem", "#ff5030", "#701a08", "panel", "crown", null, { boss: true }),
    M("eqqueen", "EQ 크리스탈 퀸", "eq", "관장 2번째", "crystal", "#a0f0ff", "#2060a0", "facet", "crown", null, { boss: true }),
    M("ltssmdrake", "LTSSM 드래곤", null, "관장 에이스 (전 state)", "dragon", "#e05040", "#701a10", "stripes", "crown", null, { boss: true })
  ];

  // 문제 id = 규칙 + 질문 문장 해시 (문제를 추가·재배치해도 저장 기록이 유지됨)
  const h32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const LQ = Q.map(([fam, rule, d, q, a, b, c, e2, ex, idq]) => ({ id: "L" + rule + "_" + h32(idq || q), /* idq: 문구 수정 전 원문 → 기존 기록 유지 */ fam, rule, d, q, c: [a, b, c, e2], a: 0, e: ex }));
  { const seen = new Set(); LQ.forEach((q) => { if (seen.has(q.id)) throw new Error("dup question " + q.id); seen.add(q.id); }); }
  const LQ_BY_FAM = {}; LQ.forEach((q) => (LQ_BY_FAM[q.fam] = LQ_BY_FAM[q.fam] || []).push(q));
  const RULES = {}; STATES.forEach((s) => Object.entries(s.rules).forEach(([rid, text]) => (RULES[rid] = { id: rid, state: s.id, text })));
  // 검사: 모든 문제의 rule이 정의되어 있는지
  LQ.forEach((q) => { if (!RULES[q.rule] || RULES[q.rule].state !== q.fam) throw new Error("rule mismatch " + q.id); });
  Object.keys(RULES).forEach((r) => { if (!LQ.some((q) => q.rule === r)) throw new Error("rule without question " + r); });

  /* 업적 / 칭호 (검사 로직은 ltssm_ui.js) */
  const ACH = [
    ["first_win", "첫 승리", "첫 퀴즈 배틀 승리", "새내기 Link"],
    ["streak5", "5 콤보", "5문제 연속 정답", "콤보 입문자"],
    ["streak10", "10 콤보", "10문제 연속 정답", "Bit Lock 달인"],
    ["streak25", "25 콤보", "25문제 연속 정답", "무오류 링크"],
    ["c50", "정답 50", "누적 정답 50개", "TS1 수집가"],
    ["c100", "정답 100", "누적 정답 100개", "Ordered Set 박사"],
    ["c300", "정답 300", "누적 정답 300개", "LTSSM 현자"],
    ["perfect1", "퍼펙트!", "오답 없이 배틀 승리", "깔끔한 신호"],
    ["perfect10", "퍼펙트 ×10", "퍼펙트 배틀 10회", "Eye 활짝"],
    ["first_badge", "첫 배지", "state 배지를 처음 획득", "배지 컬렉터"],
    ["det_master", "Detect 마스터", "Detect 규칙 전부 습득", "레이더 눈"],
    ["core5", "핵심 5배지", "Detect·Polling·Configuration·Recovery·L0 배지", "관장 도전자"],
    ["all_states", "LTSSM 전 배지", "14개 state 배지 전부", "LTSSM 그랜드마스터"],
    ["lv10", "Lv10", "레벨 10 달성", "숙련 Link"],
    ["gym_win", "관장 격파", "LTSSM 관장 승리", "LTSSM 마스터"],
    ["gym_nodmg", "무피해 관장전", "관장전을 HP 손실 없이 승리", "완벽한 트레이닝"],
    ["q20", "문제 마스터 20", "문제 20개를 3연속 정답으로 마스터", "복습왕"],
    ["dex_all", "몬스터 도감 완성", "1번 마을 몬스터 전부 조우", "도감 완성자"]
  ].map(([id, name, desc, title]) => ({ id, name, desc, title }));

  /* 구 저장(v1) → v2: 진행(레벨·배지·문제 기록)은 유지, 위치는 마을로 */
  function migrate(P) {
    if (!P || P.ver >= 2) return { P, migrated: false };
    const Q = Object.assign({}, P);
    Q.ver = 2; Q.map = "town"; Q.x = 9; Q.y = 13; Q.dir = "down";
    Q.sbadges = Q.sbadges || []; Q.rules = Q.rules || {}; Q.ach = Q.ach || []; Q.met = Q.met || [];
    Q.st = Q.st || { cs: 0, bs: 0, pf: 0 };
    Q.moves = (Q.moves || []).filter((m) => SPEC.MOVES.find((x) => x.id === m));
    Q.flags = Object.assign({}, Q.flags, { metProf: true, migrated: true });
    return { P: Q, migrated: true };
  }

  SPEC.LTSSM = { ACH, migrate, STATES, MASTER, LMON, LQ, LQ_BY_FAM, RULES, RULE_NEED, CORE: STATES.filter((s) => s.core).map((s) => s.id) };
  LMON.forEach((m) => (SPEC.MONSTERS[m.id] = Object.assign({ hp: 18, atk: 6, ch: 1 }, SPEC.MONSTERS[m.id] || {}, m)));
  if (typeof module !== "undefined") { module.exports = SPEC; if (typeof window === "undefined") require("./towns.js"); } // Node: 마을 2~10도 함께 로드(랭킹 검증용)
})();
