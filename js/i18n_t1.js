/* =========================================================
 * 1번 마을(LTSSM) 영어판: state·규칙 도감·몬스터·업적 EN + 스토리/NPC 대사 KO→EN 사전.
 * 한국어 원문은 그대로 두고, G.lang==="en"일 때만 G.tr()/G.say가 이 사전으로 바꿔 보여 준다.
 * ========================================================= */
(function () {
  "use strict";
  const isNode = typeof window === "undefined";
  const SPEC = isNode ? require("./ltssm.js") : window.SPEC;
  const LT = SPEC.LTSSM;

  /* ---- state 소개 + 규칙 도감 ---- */
  const ST = {
    det: ["The first state after reset. Detects the partner Receiver electrically.", {
      det1: "Entering Detect.Quiet: LinkUp=0b, EQ/Flit/speed variables reset", det2: "Quiet → Active: 12 ms timeout or EI exit on any Lane",
      det3: "Non-2.5 GT/s entry: stay ≥1 ms and switch to 2.5 GT/s; Rx meets ZRX-DC within 1 ms", det4: "Active: all Lanes detected → Polling / none → Quiet",
      det5: "Partial detect: re-check after 12 ms; if same, Polling with those Lanes, other Lanes to EI", det6: "Receiver Detection principle (termination charge time); after Hot Reset the DSP should wait 2 ms before enabling EI exit detection" }],
    pol: ["Exchange PAD-numbered TS1/TS2 to get bit/symbol lock and fix polarity.", {
      pol1: "Polling.Active: send PAD TS1, advertise only up to 32.0 GT/s", pol2: "Active exit: send ≥1024 TS1 + receive 8 consecutive PAD TSs on all Lanes",
      pol3: "Active 24 ms timeout: branch to Configuration / Compliance / Detect", pol4: "Polling.Compliance: for measurement, no overall timeout",
      pol5: "Polling.Configuration: PAD TS2, polarity inversion, 8 received + 16 sent → Configuration, 48 ms → Detect", pol6: "Polling.Speed is unreachable: reach L0 at 2.5 GT/s, then change rate via Recovery" }],
    cfg: ["Sets Link number, Lane numbers, width, and Flit Mode/L0p support. 2.5 GT/s during initial training.", {
      cfg1: "Order Linkwidth.Start→Accept→Lanenum→Complete→Idle; 2.5 GT/s in initial training", cfg2: "Linkwidth.Start: DSP proposes the Link number, 24 ms → Detect, crosslink uses Tcrosslink",
      cfg3: "Linkwidth.Accept: DSP assigns Lane numbers, 2 ms → Detect", cfg4: "Lanenum.Accept/Wait: width reduction & Lane Reversal; Accept has no ms timeout, Wait 2 ms",
      cfg5: "Flit Mode is enabled in Linkwidth.Accept; Complete: TS2 with configured numbers, L0p capability negotiated, 8 received + 16 sent",
      cfg6: "Idle: Idle Symbols/IDLE Flits → L0 (2.5 GT/s in initial training); on failure RcvrLock (itr<FFh) or Detect", cfg7: "2 consecutive Disable/Loopback request TS1s → Disabled/Loopback" }],
    cxl: ["CXL 4.0 (common): negotiates CXL mode with Modified TS1/TS2 on top of the PCIe LTSSM.", {
      cxl1: "Trains by PCIe rules; Alternate Protocol Negotiation with Modified TS1/TS2 during Configuration (before L0 at 2.5 GT/s)", cxl2: "CXL mode only at 8 GT/s or higher",
      cxl3: "CXL 4.0: up to 4 optional retimers", cxl4: "CXL 4.0: 128 GT/s (PCIe 7.0 PHY), x2 native only at 128 GT/s, 256B Flit at 64/128", cxl5: "256B Flit mode is implied by PCIe Flit mode (no dedicated bit)" }],
    rec: ["The hub of speed change, EQ, error recovery and retraining — realigns the Link without dropping it.", {
      rec1: "Roles and the normal speed-up path", rec2: "RcvrLock: TS1 with configured numbers, 24 ms timeout branches", rec3: "Fallback: 32.0 GT/s if it was 1b/1b, else 2.5; entry rate if csr=1b",
      rec4: "Recovery.Speed: EIOSQ→EI, ≥800 ns on success / ≥6 µs on failure, Detect after 48 ms (<64) / 96 ms (≥64)", rec5: "RcvrCfg: TS2, 48 ms, no width change after speed_change or EQ",
      rec6: "Recovery.Idle: 1b/1b SDS×2 → Control SKP → IDLE Flit, 2 ms timeout" }],
    eq: ["Recovery.Equalization Phases 0–3 tune Tx FIR presets/coefficients at 8 GT/s and above.", {
      eq1: "EC 00/01/10/11 = Phase 0–3; USP starts at Phase 0 (DSP-requested preset), DSP at Phase 1", eq2: "Phase 2 = USP tunes the DSP Tx, Phase 3 = DSP tunes the USP Tx; only Tx is tuned remotely",
      eq3: "Phase timeouts: ≤32 GT/s DSP 24/32/24, USP 12/12/24/32; Ph2/Ph3 doubled at 64+", eq4: "<2 ms per request (≤32), no limit at 64+; on timeout Complete=1b (not success)",
      eq5: "Presets P0–P10 (NRZ) / Q0–Q10 (PAM4); Q0 flat, Q5–Q9 use c-2", eq6: "EQ at 64+ uses TS0; skipped with No EQ Needed; redone after Detect" }],
    l0: ["Normal operating state. Also where encodings and Ordered Sets are learned.", {
      l01: "Entered from Configuration.Idle/Recovery.Idle, LinkUp=1b", l02: "L0 → Recovery: TS1/TS2/EIEOS received, directed speed change, EI inferred after 128 µs",
      l03: "Encodings: 8b/10b (2.5/5), 128b/130b (8/16/32 Non-Flit), 1b/1b PAM4 (64/128)", l04: "L0 → L1/L2: direction + EIOS received + EIOSQ sent", l05: "Ordered Sets: EIOS, EIEOS, SKP/Control SKP, SDS" }],
    l0p: ["Flit Mode only. Adjusts only the active width inside L0 with Link Management DLLPs.", {
      lp1: "Part of L0, Flit Mode only, width changed by Link Management DLLPs", lp2: "Symmetric widths, ≥1 Lane per direction, x1 up to configured width",
      lp3: "Timing: respond in 1 µs (4 µs for 8b/10b), ≤3 DLLPs in 5 Flits, up-size within 16 µs of Ack",
      lp4: "Lanes turned off in Configuration can't be re-enabled by L0p (Flit Mode has no Upconfigure); Recovery returns to configured width", lp5: "Mandatory for Flit Retimers; replaces L0s in Flit Mode" }],
    l0s: ["Fast power saving for Non-Flit only. Tx/Rx enter separately and return to L0 directly with FTSs.", {
      s1: "Not supported in Flit Mode; Tx/Rx separate", s2: "Tx_L0s.Entry: EIOSQ→EI, TTX-IDLE-MIN 20 ns", s3: "Tx_L0s.FTS: N_FTS FTSs (4096 with Extended Synch), EIEOSQ+SDS at the end in 128b/130b",
      s4: "Rx_L0s.FTS: lock failure (N_FTS timeout) → Recovery", s5: "TS1 Symbol 3 = N_FTS (EFM_CNTL1 in Flit Mode)" }],
    l1: ["Power saving in both directions. LTSSM L1.Entry/L1.Idle, with L1 PM Substates (L1.1/L1.2) inside.", {
      a1: "LTSSM substates are L1.Entry/L1.Idle; L1.0 on entry/exit", a2: "L1.Entry: EI, then L1.Idle after TTX-IDLE-MIN", a3: "Exit goes through Recovery; ≥40 ns stay if not 2.5 GT/s",
      a4: "L1.1/L1.2: CLKREQ#, neither needs Refclk, only L1.2 releases common mode, ASPM L1.2 needs LTR", a5: "L1.2 timing: TPOWER_OFF ≤2 µs, TL1.2 ≥4 µs", a6: "USP must not deassert CLKREQ# before L1.0" }],
    l2: ["Deep power saving where main power can be removed. Wakes via Beacon/WAKE# and restarts from Detect.", {
      b1: "L2.Idle / L2.TransmitWake (USP), main power may be removed", b2: "Beacon only Upstream→Root, at least on Lane 0", b3: "DSP: Beacon/direction → (power restored) Detect; a Switch forwards it upward",
      b4: "USP: EI exit on predetermined Lanes → Detect", b5: "L2.Idle: Rx meets ZRX-DC within 1 ms, Tx in EI ≥ TTX-IDLE-MIN" }],
    dis: ["Keeps the Link turned off. Entered by Disable_Link_Request TS1 or software.", {
      x1: "Entry: software Link Disable or Disable_Link_Request TS", x2: "16–32 TS1s → EIOSQ → EI", x3: "Clearing LinkUp on entry is recommended",
      x4: "USP: EI exit → Detect, 2 ms if no EIOS / DSP: direction → Detect", x5: "Training Control: Disable is bit 1, 1b/1b 0010b" }],
    lb: ["For testing. The Follower sends back the symbols sent by the Lead.", {
      lb1: "Lead/Follower, LinkUp=0b in Entry", lb2: "2 consecutive Loopback_Request TS1s (8 consecutive RcvrCfg TS2s in Flit Recovery) → becomes Follower", lb3: "Active: Follower echoes symbols",
      lb4: "Entry failure: Exit after an implementation-specific <100 ms", lb5: "Exit: EIOS (8 consecutive if >2.5 supported), EI 2 ms → Detect", lb6: "Rate change 1 ms; bit 2 / 1b/1b 0100b" }],
    hr: ["Resets what lies beyond the Link with Hot_Reset_Request TS1s.", {
      h1: "Hot_Reset_Request (configured numbers); DSP initiates, USP enters from Recovery.Idle (Flit: carried in RcvrCfg TS2s)", h2: "2 consecutive received → LinkUp=0b → Detect",
      h3: "2 ms timeout; 2 consecutive received while remaining resets the timer", h4: "A Switch USP propagates it to its Downstream Ports", h5: "LinkUp=0 → DL_Inactive, 1b/1b 0001b" }]
  };
  Object.entries(ST).forEach(([id, [intro, rules]]) => {
    const st = LT.STATES.find((s) => s.id === id); if (!st) return;
    st.en = st.en || st.name; st.introEn = intro; st.rulesEn = Object.assign({}, st.rulesEn, rules);
    Object.entries(rules).forEach(([r, txt]) => { if (LT.RULES[r]) LT.RULES[r].en = txt; });
  });
  LT.MASTER.en = "LTSSM Master";

  /* ---- 1번 마을 몬스터 ---- */
  const MON = { quietbug: "Quiet Beetle", radarbug: "Radar Beetle", pulsebird: "Pulse Bird", complybird: "Comply Bird", cfgbird: "Token Bird", widthsnake: "Width Snake", acceptsnake: "Accept Snake",
    lanenaga: "Lanenum Naga", completenaga: "Complete Naga", flexfish: "Flex Fish", retimerfish: "Retimer Fish", lockgolem: "Lock Golem", speedgolem: "Speed Golem", cfggolem: "RcvrCfg Golem",
    eq0crystal: "Phase0 Crystal", eq2crystal: "Phase2 Crystal", eq3crystal: "Phase3 Crystal", linkcat: "Link Cat", osetcat: "OrderedSet Cat", halfturtle: "Half Turtle", txbat: "Tx_L0s Bat",
    rxbat: "Rx_L0s Bat", l1shroom: "L1 Drowsy Shroom", l12shroom: "L1.2 Deep-Sleep Shroom", l2ghost: "L2 Ghost", wakeghost: "Wake Ghost", plugblob: "Plug Slime", leadjelly: "Lead Jelly",
    echojelly: "Echo Jelly", resetdrake: "Reset Drake", kinggolem: "Recovery King Golem", eqqueen: "EQ Crystal Queen", ltssmdrake: "LTSSM Dragon" };
  const MSUB = { kinggolem: "Leader #1", eqqueen: "Leader #2", ltssmdrake: "Leader's ace (all states)" };
  Object.entries(MON).forEach(([id, en]) => { [LT.LMON.find((m) => m.id === id), SPEC.MONSTERS[id]].forEach((m) => { if (m) { m.en = en; if (MSUB[id]) m.subEn = MSUB[id]; else if (!m.subEn) m.subEn = m.sub; } }); });

  /* ---- 업적 / 칭호 ---- */
  const ACH = {
    first_win: ["First Win", "Win your first quiz battle", "Rookie Link"], streak5: ["5 Combo", "5 correct answers in a row", "Combo Beginner"], streak10: ["10 Combo", "10 correct answers in a row", "Bit Lock Expert"],
    streak25: ["25 Combo", "25 correct answers in a row", "Error-free Link"], c50: ["50 Correct", "50 correct answers in total", "TS1 Collector"], c100: ["100 Correct", "100 correct answers in total", "Ordered Set Doctor"],
    c300: ["300 Correct", "300 correct answers in total", "LTSSM Sage"], perfect1: ["Perfect!", "Win a battle with no wrong answers", "Clean Signal"], perfect10: ["Perfect ×10", "10 perfect battles", "Wide-open Eye"],
    first_badge: ["First Badge", "Earn your first state badge", "Badge Collector"], det_master: ["Detect Master", "Learn every Detect rule", "Radar Eyes"],
    core5: ["Core 5 Badges", "Detect, Polling, Configuration, Recovery and L0 badges", "Gym Challenger"], all_states: ["All LTSSM Badges", "All 14 state badges", "LTSSM Grandmaster"],
    lv10: ["Lv10", "Reach level 10", "Seasoned Link"], gym_win: ["Gym Leader Defeated", "Beat the LTSSM gym leader", "LTSSM Master"], gym_nodmg: ["No-damage Gym", "Win the gym battle without losing HP", "Flawless Training"],
    q20: ["20 Questions Mastered", "Master 20 questions with 3 correct in a row", "Review King"], dex_all: ["Monster Dex Complete", "Meet every Town 1 monster", "Dex Completer"],
    town2: ["Flit Harbor Cleared", "Beat the Town 2 gym leader", "Flit Captain"], town5: ["Coherence Cleared", "Beat the Town 5 gym leader", "Coherent Master"], town8: ["RAS Cleared", "Beat the Town 8 gym leader", "Unbreakable Link"],
    town10: ["Trusted Cleared", "Beat the Town 10 gym leader", "Security Guardian"], champion: ["Spec Champion", "Defeat the final boss", "Spec Champion"], sb20: ["20 Badges", "Collect 20 rule badges", "Badge Hoarder"],
    sb_all: ["Every Badge", "Collect every rule badge", "Spec Grandmaster"], c1000: ["1000 Correct", "1000 correct answers in total", "Spec Sage"]
  };
  const TITLE_EN = {};
  LT.ACH.forEach((a) => { const e = ACH[a.id]; if (e) { a.nameEn = e[0]; a.descEn = e[1]; a.titleEn = e[2]; TITLE_EN[a.title] = e[2]; } });

  /* ---- 스토리 / NPC / 표지판 대사 (KO → EN) ---- */
  const D = {
    "풀숲에서 몬스터를 만나 퀴즈로 규칙을 익히자. 규칙마다 2번 맞히면 습득, state의 규칙을 다 모으면 배지!": "Meet monsters in the tall grass and learn the rules through quizzes. Answer a rule correctly twice to learn it; learn all of a state's rules to earn its badge!",
    "Root 박사의 연구소": "Dr. Root's Lab", "잠깐! 아직 설명이 안 끝났단다. 이리 와 보렴.": "Wait! I'm not done explaining yet. Come here.", "Root 박사": "Dr. Root",
    "(박사님이 Link를 점검해 주었다. HP 회복!)": "(The doctor checked your Link. HP restored!)",
    "오, 깨어났구나! 나는 Root 박사. 이 PCIe 지방의 Root Complex란다.": "Oh, you're awake! I'm Dr. Root, the Root Complex of this PCIe region.",
    "너는 막 전원이 들어온 신입 Link다. 아직 LTSSM의 첫 state, Detect에 머물러 있지.": "You're a brand-new Link that just powered up. You're still in the LTSSM's first state, Detect.",
    "1번 마을의 목표는 단 하나 — LTSSM(PCIe 7.0)의 모든 규칙을 익히는 것!": "Town 1 has just one goal — learn every rule of the LTSSM (PCIe 7.0)!",
    "마을 밖 풀숲에는 state마다 다른 spec몬이 산다. 서쪽 Detect 초원, 그 북쪽 Polling 숲, 동쪽 Configuration 협곡과 Recovery 동굴, 남쪽 Power 호수, 북쪽 시련의 탑.": "Each state has its own spec-mon living in the grass outside town: Detect Meadow to the west, Polling Forest north of it, Configuration Canyon and Recovery Cave to the east, Power Lake to the south, and the Tower of Trials to the north.",
    "몬스터와 퀴즈로 싸워 규칙을 익혀라. 규칙 하나는 2번 맞히면 습득, 한 state의 규칙을 다 모으면 그 state 배지란다.": "Fight monsters with quizzes to learn the rules. Two correct answers learn a rule; learn all of a state's rules and you get that state's badge.",
    "Lv10이 되고 Detect·Polling·Configuration·Recovery·L0 배지를 모으면 LTSSM 관장에게 도전할 수 있다.": "Reach Lv10 and collect the Detect, Polling, Configuration, Recovery and L0 badges to challenge the LTSSM gym leader.",
    "막히면 가방에서 MSI-X 표를 써서 나에게 인터럽트를 보내라. 메뉴(B/START)의 규칙 도감·배지 케이스로 진행 상황도 볼 수 있단다.": "If you get stuck, use the MSI-X Table from your bag to send me an interrupt. The Rule Dex and Badge Case in the menu (B/START) show your progress.",
    "먼저 서쪽 Detect 초원부터 가 보거라!": "Head west to Detect Meadow first!",
    "연구소의 Root 박사에게 말을 걸어라.": "Talk to Dr. Root in the lab.",
    "모든 조건 충족! 마을 오른쪽 위 LTSSM 체육관 관장에게 도전하라!": "All requirements met! Challenge the leader of the LTSSM Gym in the top-right of town!",
    "…… 신호가 없다.": "…… No signal.",
    "너는 막 전원이 들어온 PCIe Link다. 아직 아무 상대도 감지하지 못했다.\n(LTSSM 상태: Detect)": "You are a PCIe Link that just powered up. No partner detected yet.\n(LTSSM state: Detect)",
    "앞에 있는 박사님에게 말을 걸어 보자. (A 버튼)": "Talk to the doctor in front of you. (A button)",
    "📦 업데이트 안내": "📦 Update notice", "1번 마을이 LTSSM 중심으로 새로 바뀌었다! (PCIe 7.0 / CXL 4.0 기준)": "Town 1 has been rebuilt around the LTSSM! (PCIe 7.0 / CXL 4.0)",
    "레벨·배지·문제 기록은 그대로 두고, 위치만 PCIe 마을로 옮겼다. 새 '규칙 도감'과 'state 배지'를 모아 보자.": "Your level, badges and question records are kept; only your location moved to PCIe Town. Collect the new Rule Dex entries and state badges.",
    "처음부터 다시 하고 싶다면 타이틀에서 '새로 시작'을 고르면 된다.": "To start over, choose 'New Game' on the title screen.",
    "PCIe 마을": "PCIe Town",
    "【PCIe 마을】 LTSSM(PCIe 7.0)을 익히는 첫 마을.\n← 서: Detect 초원 (북쪽에 Polling 숲)\n→ 동: Configuration 협곡 → Recovery 동굴\n↓ 남: Power 호수   ↑ 북: 시련의 탑": "[PCIe Town] The first town, for learning the LTSSM (PCIe 7.0).\n← West: Detect Meadow (Polling Forest to its north)\n→ East: Configuration Canyon → Recovery Cave\n↓ South: Power Lake   ↑ North: Tower of Trials",
    "관장 도전: Lv10 + Detect·Polling·Configuration·Recovery·L0 배지": "Gym challenge: Lv10 + Detect, Polling, Configuration, Recovery and L0 badges",
    "호호, 배지 할머니란다.": "Hoho, I'm the Badge Granny.",
    "규칙 도감을 열면 state마다 규칙이 ●○로 보이지. 규칙 문제를 2번 맞히면 ●●, 다 모으면 배지가 반짝!": "Open the Rule Dex and each state's rules show as ●○. Answer a rule's question twice for ●●; collect them all and the badge sparkles!",
    "틀린 문제와 아직 못 익힌 규칙은 더 자주 나오니, 해설을 꼭 읽으렴.": "Questions you missed and rules you haven't learned come up more often, so read the explanations.",
    "배지 할머니": "Badge Granny",
    "3문제 연속으로 맞히면 🔥콤보 보너스 XP! 5연속이면 공격력도 올라가.": "3 correct in a row gives 🔥 combo bonus XP! At 5 in a row your attack goes up too.",
    "한 번도 안 틀리고 이기면 ✨퍼펙트 배틀 XP +30%야. 메뉴의 '기록'에서 최고 콤보를 확인해 봐!": "Win without a single mistake for a ✨ Perfect Battle, +30% XP. Check your best combo under 'Stats' in the menu!",
    "콤보 소년": "Combo Kid", "물고기도 클럭도 가만있질 않지…": "Neither fish nor clocks ever sit still…",
    "양쪽 Refclk은 ppm 단위로 다르니 SKP Ordered Set으로 elastic buffer를 맞춘단다. 64 GT/s 이상 Flit Mode에선 Control SKP도 쓰지.": "The two Refclks differ by some ppm, so SKP Ordered Sets keep the elastic buffer balanced. Flit Mode at 64 GT/s and above also uses Control SKP.",
    "SKP 낚시꾼": "SKP Angler", "Detect 초원": "Detect Meadow",
    "Detect.Quiet와 Detect.Active 몬스터가 산다. 12 ms, 1 ms, ZRX-DC… 숫자를 잘 기억하자!": "Detect.Quiet and Detect.Active monsters live here. 12 ms, 1 ms, ZRX-DC… remember the numbers!",
    "Detect 꼬마": "Detect Kid", "너도 방금 Detect를 통과했지? 나랑 퀴즈 배틀하자!": "You just got through Detect too, right? Quiz battle me!",
    "졌다… 상대 Rx 종단을 감지하는 원리, 확실히 알겠어!": "I lost… now I really get how the far Rx termination is detected!",
    "Detect.Active에서 모든 Lane이 감지되면 Polling, 하나도 없으면 Detect.Quiet로 돌아가.": "In Detect.Active, if every Lane is detected you go to Polling; if none, back to Detect.Quiet.",
    "Receiver Detection은 Tx 공통모드 전압을 바꿨을 때 충전 시간으로 상대 종단 저항을 알아내는 거야.": "Receiver Detection changes the Tx common-mode voltage and uses the charge time to find the far-end termination.",
    "Lane 일부만 감지되면 12 ms 뒤 다시 확인하고, 그래도 같으면 감지된 Lane만으로 Polling에 간다네.": "If only some Lanes are detected, it checks again after 12 ms; if still the same, it goes to Polling with just the detected Lanes.",
    "감지 연구원": "Detection Researcher", "Polling 숲": "Polling Forest",
    "Polling.Active · Compliance · Configuration. TS1 1024개, 8연속, 24 ms, 48 ms!": "Polling.Active · Compliance · Configuration. 1024 TS1s, 8 in a row, 24 ms, 48 ms!",
    "TS1 소녀": "TS1 Girl", "PAD TS1을 1024개 보내 본 적 있어? 덤벼!": "Ever sent 1024 PAD TS1s? Bring it on!", "8연속 수신 성공… 네가 이겼어!": "8 in a row received… you win!",
    "Polling.Configuration에서는 TS2를 8연속 받고 16개 보낸 뒤 넘어가.": "In Polling.Configuration you receive 8 TS2s in a row and send 16 before moving on.",
    "Compliance 측정원": "Compliance Tester", "측정 장비를 연결하면 Polling.Compliance로 빠지지. 그 조건, 알고 있나?": "Hook up test equipment and you drop into Polling.Compliance. Know the conditions?",
    "측정 종료! 아주 깨끗한 eye였다.": "Measurement done! That was a very clean eye.", "Compliance에는 전체 timeout이 없다네. 빠져나올 조건이 정해져 있지.": "Compliance has no overall timeout. There are defined conditions for leaving it.",
    "Configuration 협곡": "Configuration Canyon",
    "Linkwidth → Lanenum → Complete → Idle. 동쪽 끝 마른 풀숲에는 CXL Flex Bus 물고기도 산다(CXL/공통).": "Linkwidth → Lanenum → Complete → Idle. CXL Flex Bus fish live in the dry grass at the east end (CXL/common).",
    "【→ Recovery 동굴】 속도 변경과 Equalization의 동굴. 깊은 곳에 크리스탈 몬스터가 있다.": "[→ Recovery Cave] The cave of speed changes and Equalization. Crystal monsters lurk deep inside.",
    "Lane 소년": "Lane Kid", "Link 번호, Lane 번호, 그리고 폭! Configuration은 내 전문이야!": "Link number, Lane numbers, and width! Configuration is my specialty!",
    "Lane Reversal까지 아는구나…": "You even know Lane Reversal…",
    "초기 훈련의 Configuration은 2.5 GT/s에서 진행돼. 속도는 L0 이후 Recovery로!": "Configuration in initial training runs at 2.5 GT/s. Speed goes up via Recovery after L0!",
    "CXL 탐험가": "CXL Explorer", "Modified TS1/TS2로 Flex Bus 모드를 협상해 본 적 있나? CXL 4.0 퀴즈다!": "Ever negotiated Flex Bus mode with Modified TS1/TS2? CXL 4.0 quiz time!",
    "128 GT/s, 리타이머 4개… 완벽하군!": "128 GT/s, four retimers… perfect!", "CXL 4.0의 x2 native는 128 GT/s에서만이라는 걸 잊지 마.": "Don't forget: in CXL 4.0, x2 is native only at 128 GT/s.",
    "Recovery 동굴": "Recovery Cave", "RcvrLock → Speed → RcvrCfg → Idle, 그리고 EQ Phase 0~3. 64 GT/s 이상에서는 timeout이 달라진다!": "RcvrLock → Speed → RcvrCfg → Idle, plus EQ Phases 0–3. Timeouts change at 64 GT/s and above!",
    "광부 리트레인": "Miner Retrain", "링크가 흔들리면 Recovery로 다시 맞추지! 덤벼라!": "When the Link wobbles, Recovery realigns it! Come on!",
    "허허, 재훈련이 필요한 건 나였군.": "Heh, turns out I'm the one who needed retraining.", "Recovery.Speed 실패 시엔 원래 속도로 돌아가 다시 시도한다네.": "If Recovery.Speed fails, the Link falls back to its earlier rate and tries again.",
    "EQ 연구원": "EQ Researcher", "Phase 2는 USP가 DSP Tx를, Phase 3은 DSP가 USP Tx를 조정! 헷갈리면 지는 거다.": "In Phase 2 the USP tunes the DSP Tx; in Phase 3 the DSP tunes the USP Tx! Mix them up and you lose.",
    "Eye가 활짝 열렸군…": "The eye is wide open…", "64 GT/s 이상 EQ는 TS0 Ordered Set으로 진행된다.": "EQ at 64 GT/s and above uses TS0 Ordered Sets.",
    "Power 호수": "Power Lake", "L0는 핵심 배지! L0s는 Non-Flit 전용, L0p는 Flit 전용이라는 점을 꼭 구분하자.": "L0 is a core badge! Remember: L0s is Non-Flit only, L0p is Flit only.",
    "링크 낚시꾼": "Link Angler", "L0에서 한가하게 낚시 중이었지. 한 판 할까?": "I was fishing lazily in L0. Fancy a round?", "LinkUp=1b… 자네가 이겼네.": "LinkUp=1b… you win.",
    "L0p는 L0의 일부야. Flit Mode에서 Link Management DLLP로 폭만 바꾸지.": "L0p is part of L0. In Flit Mode it only changes width, using Link Management DLLPs.",
    "잠꾸러기": "Sleepyhead", "음냐… L1.2에서 깨우지 마…": "Mmm… don't wake me from L1.2…", "CLKREQ#… 일어났어!": "CLKREQ#… I'm up!",
    "L1에서 나올 땐 Recovery를 거쳐. FTS로 바로 L0에 가는 건 L0s뿐이야.": "Leaving L1 goes through Recovery. Only L0s goes straight back to L0 with FTSs.",
    "시련의 탑 앞": "Tower of Trials Yard", "멈춰! 이 앞 2번 마을(Flit 항구) 가는 길은 LTSSM 마스터만 지나갈 수 있다.": "Halt! Only LTSSM Masters may take the road to Town 2 (Flit Harbor).",
    "TLP를 주고받으려면 먼저 Physical Layer가 L0여야 하거든. LTSSM 관장을 이기고 와라.": "The Physical Layer has to be in L0 before any TLP can flow. Beat the LTSSM gym leader first.",
    "경비원": "Guard", "시련의 탑": "Tower of Trials",
    "Disabled · Loopback · Hot Reset. 관장 도전 필수는 아니지만, 경험치와 기술(Hot Reset, Loopback 에코)을 얻을 수 있다.": "Disabled · Loopback · Hot Reset. Not required for the gym, but you can earn XP and moves (Hot Reset, Loopback Echo).",
    "LTSSM 마스터 배지 확인! Flit 항구 가는 길로 지나가도 좋다.": "LTSSM Master badge confirmed! You may take the road to Flit Harbor.", "LTSSM 관장을 이겨야 북쪽 도로를 지날 수 있다.": "Beat the LTSSM gym leader to use the north road.",
    "탑지기 리셋": "Tower Keeper Reset", "Hot_Reset_Request TS1 2연속! 내 시련을 받아라!": "Two Hot_Reset_Request TS1s in a row! Face my trial!", "2 ms timeout… 내가 Detect로 돌아가는군.": "2 ms timeout… I'm the one going back to Detect.",
    "Disable은 bit 1, Loopback은 bit 2, Hot Reset은 bit 0. 1b/1b에선 4비트 인코딩이다.": "Disable is bit 1, Loopback bit 2, Hot Reset bit 0. 1b/1b uses a 4-bit encoding.",
    "Reset 센터": "Reset Center", "Reset 센터에 어서 오세요!": "Welcome to the Reset Center!", "Link를 Fundamental Reset으로 초기화해 드릴게요… ♪": "Let me reinitialize your Link with a Fundamental Reset… ♪", "간호사": "Nurse",
    "Link의 HP가 모두 회복되었다! (진행 상황 저장됨)": "Your Link's HP is fully restored! (progress saved)",
    "링크는 처음엔 무조건 2.5 GT/s로 L0에 올라가.": "A Link always reaches L0 at 2.5 GT/s first.",
    "그 뒤 Recovery에서 속도를 올리지: 2.5 → 5 → 8 → 16 → 32 → 64 → 128 GT/s(PCIe 7.0)!": "Then Recovery raises the rate: 2.5 → 5 → 8 → 16 → 32 → 64 → 128 GT/s (PCIe 7.0)!",
    "8 GT/s부터는 Equalization, 64 GT/s부터는 PAM4 + Flit Mode가 필요해.": "From 8 GT/s you need Equalization; from 64 GT/s, PAM4 + Flit Mode.", "속도 연구원": "Speed Researcher",
    "LTSSM 관장 하나": "LTSSM Leader Hana", "나는 LTSSM 관장 하나! Detect부터 Hot Reset까지, 링크 트레이닝의 모든 규칙을 시험하겠다.": "I'm Hana, the LTSSM gym leader! From Detect to Hot Reset, I'll test every rule of link training.",
    "3마리 연속 승부다. 시작!": "Three monsters in a row. Begin!", "훌륭하다! 너는 LTSSM을 완전히 이해했다.": "Splendid! You have fully mastered the LTSSM.",
    "L0 다음은 PHY와 Flit의 세계다. 시련의 탑 북쪽, 2번 마을 Flit 항구로 가라!": "After L0 comes the world of PHY and Flits. Go north of the Tower of Trials to Town 2, Flit Harbor!",
    "LTSSM 마스터 배지!": "LTSSM Master Badge!", "다음 마을로 가는 길이 열렸다": "The road to the next town is open",
    "📖 2번 마을 「Flit 항구」로 가는 길이 열렸다! 시련의 탑 앞 경비원이 북쪽 길을 열어 줄 것이다.": "📖 The road to Town 2, 'Flit Harbor', is open! The guard at the Tower of Trials will let you through to the north.",
    "도전자여, 아직 자격이 부족하다.": "Challenger, you are not yet qualified.", "LTSSM 체육관": "LTSSM Gym",
    "LTSSM 마스터! 다음은 2번 마을 Flit 항구다. 시련의 탑 북쪽으로!": "LTSSM Master! Next is Town 2, Flit Harbor. North of the Tower of Trials!", "체육관 안내원": "Gym Guide",
    "모든 조건 충족! 관장님께 도전할 수 있다.": "All requirements met! You may challenge the leader.",
    "관장전은 Recovery·EQ·전체 LTSSM 문제가 나온다. 어려운 문제(★★ 이상)뿐이니 각오해!": "The leader asks Recovery, EQ and whole-LTSSM questions — only hard ones (★★ and up), so be ready!",
    "어이, 도전자! 관장에게 도전하려면 Lv10 + 핵심 배지 5개(Detect·Polling·Configuration·Recovery·L0)가 필요하다.": "Hey, challenger! To face the leader you need Lv10 + 5 core badges (Detect, Polling, Configuration, Recovery, L0).",
    "체육관 안의 트레이너들과는 언제든 수련할 수 있다.": "You can train with the trainers in this gym any time.",
    "x16 소년": "x16 Kid", "Lane이 16개면 뭐든 빠르지! 덤벼!": "With 16 Lanes everything's fast! Bring it!", "크윽, 네 신호가 더 깨끗했어…": "Ugh, your signal was cleaner…",
    "Recovery.RcvrCfg 이후 speed_change나 EQ가 있었다면 폭은 못 바꿔.": "If speed_change or EQ happened before Recovery.RcvrCfg, you can't change the width.",
    "Flit 소녀": "Flit Girl", "64 GT/s 이상은 1b/1b PAM4 + Flit! 알고 있니?": "64 GT/s and up means 1b/1b PAM4 + Flit! Did you know?", "Flit Mode 박사가 되었구나!": "You've become a Flit Mode expert!",
    "128 GT/s도 64 GT/s와 같은 1b/1b + 256B Flit이야.": "128 GT/s uses the same 1b/1b + 256B Flit as 64 GT/s."
  };
  Object.entries(MON).forEach(([id, en]) => { const m = LT.LMON.find((x) => x.id === id); if (m) D[m.name] = en; });
  const tr = (s) => (typeof s === "string" && D[s]) || s;
  LT.I18N_T1 = { D, TITLE_EN, tr };
  if (isNode) { module.exports = LT.I18N_T1; return; }

  /* ---- 엔진 연결: G.tr(문자열), G.say 자동 번역, 맵 이름 ---- */
  const G = window.G;
  G.tr = (s) => (G.lang === "en" ? (Array.isArray(s) ? s.map(tr) : tr(s)) : s);
  G.ttl = (title) => (G.lang === "en" ? TITLE_EN[title] || title : title);
  const say0 = G.say;
  G.say = (lines, name) => say0(G.tr(lines), G.tr(name));
  const mapEn = () => Object.values(G.maps || {}).forEach((m) => { if (m.name && !m.en && D[m.name]) m.en = D[m.name]; });
  window.addEventListener("load", mapEn); // 맵은 story.js에서 만들어진다 (G.start 전에 실행)
})();
