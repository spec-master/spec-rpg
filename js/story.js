/* =========================================================
 * SPEC RPG 스토리 / 맵 / NPC 스크립트
 * 맵 기호: . 풀  , 풀숲(조우)  = 길  T 나무  ~ 물  R/U/O/P 지붕  H 벽  D 문
 *          F 꽃  S 표지판  # 울타리  _ 바닥  W 실내벽  B 책장  M 기계  C 카운터  X 출구
 * ========================================================= */
(function () {
  const G = window.G, S = window.SPEC;
  const say = G.say, learn = G.learn;
  const LOOK = {
    prof: { hair: "#c0c0c0", shirt: "#f8f8f8", pants: "#6a6a6a" },
    girl: { hair: "#a04020", shirt: "#f080b0", pants: "#4050a0" },
    boy: { hair: "#302010", shirt: "#40a0e0", pants: "#305030" },
    old: { hair: "#e8e8e8", shirt: "#a07040", pants: "#504030" },
    guard: { hair: "#202020", shirt: "#305080", pants: "#202840", hat: "#203060" },
    leader1: { hair: "#e0b020", shirt: "#e05030", pants: "#302020" },
    leader2: { hair: "#40c0c0", shirt: "#3040a0", pants: "#202020" },
    nurse: { hair: "#f090b0", shirt: "#ffffff", pants: "#f0a0c0" },
    sci: { hair: "#5050a0", shirt: "#e0e0f0", pants: "#404060" }
  };

  /* 트레이너 공통 스크립트 */
  function trainer(id, opt) {
    return Object.assign({ id, trainer: { sight: opt.sight || 3 }, talk: async (n) => {
      if (G.flag("beat_" + id)) { await say(opt.after, opt.name); return; }
      await say(opt.intro, opt.name);
      if (opt.learn) await learn(opt.learn);
      const r = await G.battle({ kind: opt.boss ? "boss" : "trainer", trainer: opt.name, team: opt.team, chapters: opt.chapters, minD: opt.minD, maxD: opt.maxD, xp: opt.xp });
      if (r !== "win") return;
      G.setFlag("beat_" + id);
      await say(opt.win, opt.name);
      if (opt.onWin) await opt.onWin();
    } }, opt.npc);
  }
  const teacher = (lines, concepts, name) => async () => { await say(lines, name); await learn(concepts); };

  /* ===================== 연구소 ===================== */
  G.maps.lab = {
    name: "Root 박사의 연구소", border: " ",
    tiles: ["WWWWWWWWWW", "WBBWMMWBBW", "W________W", "W________W", "W________W", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 8, to: "town", tx: 4, ty: 5, dir: "down" }, { x: 5, y: 8, to: "town", tx: 4, ty: 5, dir: "down" }],
    triggers: [4, 5].map((x) => ({ x, y: 7, cond: () => !G.flag("metProf"), run: async () => { await say("잠깐! 아직 Receiver Detect도 안 했잖니. 이리 와 보렴.", "Root 박사"); await G.stepBack(); } })),
    npcs: [{ id: "prof", x: 4, y: 3, dir: "down", look: LOOK.prof, talk: async () => {
      if (!G.flag("metProf")) return profIntro();
      const p = G.P();
      if (!p.badges.includes("l0")) await say(["Lane 체육관 관장을 이기면 너는 L0에 도달한다.", "풀숲에서 퀴즈 배틀로 레벨을 올리고, 마을 사람들에게서 개념을 배워라. 개념을 모르면 기술도 못 익힌단다!"], "Root 박사");
      else if (!p.badges.includes("dl")) await say(["L0 축하한다! 이제 Physical Layer 위에 Data Link Layer를 쌓을 차례다.", "북쪽 DLL 1번 도로의 Replay 체육관을 노려라."], "Root 박사");
      else await say(["DL_Active까지! 다음은 CXL 시티. Transaction Layer를 배우고 CXL의 세계로 가거라."], "Root 박사");
      G.heal(); await say("(박사님이 Link를 점검해 주었다. HP 회복!)");
    } }]
  };
  async function profIntro() {
    await say(["오, 깨어났구나! 나는 Root 박사. 이 PCIe 지방의 Root Complex란다.", "너는 막 전원이 들어온 신입 Link다. 아직 상대가 누군지도 모르는… Detect 상태지.", "링크는 상대 수신기를 감지(Receiver Detect)하는 것부터 시작한단다."], "Root 박사");
    await learn(["ltssm", "detect"]);
    G.setFlag("metProf");
    await say(["좋아, 내 Rx 종단 저항을 감지했구나! Receiver Detect 성공!"], "Root 박사");
    await G.setLTSSM("Polling", "🔗 LTSSM: Detect → Polling\n이제 TS1/TS2를 주고받으며 bit lock을 맞춰야 한다.");
    await say(["이 세계의 spec몬들은 퀴즈로 싸운다. 정답이면 공격, 오답이면 반격을 받지.", "매 문제 뒤에 해설이 나오니 꼭 읽어라. 네 이해도가 곧 Link의 성장이다.", "레벨이 올라도 관련 개념을 배우지 않으면 새 기술을 못 익힌단다."], "Root 박사");
    await G.giveItem("fc_credit", 3);
    await G.giveItem("msix_table", 1);
    await say(["막히면 가방에서 MSI-X 표를 써서 나에게 인터럽트를 보내라.", "목표: Lane 체육관(마을 오른쪽 위 파란 지붕) 관장을 이겨 L0에 도달하는 것!"], "Root 박사");
  }
  G.hint = () => {
    const p = G.P();
    if (!G.flag("metProf")) return "연구소의 Root 박사에게 말을 걸어라.";
    if (p.ltssm === "Polling" && !p.learned.polling) return "마을의 Polling 할머니(꽃밭 근처)에게 TS1/TS2를 배워라.";
    if (!p.learned.configuration) return "남쪽 풀숲 근처 Lane 소년에게 Configuration을 배워라.";
    if (!p.badges.includes("l0")) return `풀숲에서 레벨을 올리고 Lane 체육관에 도전! (현재 Lv${p.lv}, 권장 Lv4+)`;
    if (!p.badges.includes("dl")) return `북쪽 DLL 1번 도로를 지나 Replay 체육관에 도전! (권장 Lv7+)`;
    return "CXL 시티로! Transaction 학교와 CXL 박사를 찾아가라. (3장 이후는 프로토타입 단계)";
  };
  G.onNewGame = async () => {
    await say(["…… 신호가 없다.", "너는 막 전원이 들어온 PCIe Link다. 아직 아무 상대도 감지하지 못했다.\n(LTSSM 상태: Detect)", "앞에 있는 박사님에게 말을 걸어 보자. (A 버튼)"]);
  };

  /* ===================== PCIe 마을 ===================== */
  G.maps.town = {
    name: "PCIe 마을",
    tiles: [
      "TTTTTTTTT==TTTTTTTTT",
      "T........==........T",
      "T.RRRRR..==..UUUUU.T",
      "T.RRRRR..==..UUUUU.T",
      "T.HHDHH..==..HHDHH.T",
      "T...=....==....=...T",
      "T...============...T",
      "T.F......==.....F..T",
      "T....S...==..OOOO..T",
      "T........==..OOOO..T",
      "T,,,,,...==..HDHH..T",
      "T,,,,,...==...=....T",
      "T,,,,,..=======....T",
      "T,,,,,...==........T",
      "T~~~~....==....F...T",
      "T~~~~....==........T",
      "T~~~~...TTTT.......T",
      "TTTTTTTTTTTTTTTTTTTT"
    ],
    warps: [
      { x: 4, y: 4, to: "lab", tx: 4, ty: 7, dir: "up" },
      { x: 15, y: 4, to: "gym1", tx: 4, ty: 10, dir: "up" },
      { x: 14, y: 10, to: "center", tx: 4, ty: 7, dir: "up" },
      { x: 9, y: 0, to: "route1", tx: 6, ty: 18, dir: "up" }, { x: 10, y: 0, to: "route1", tx: 7, ty: 18, dir: "up" }
    ],
    triggers: [9, 10].map((x) => ({ x, y: 1, cond: () => !G.P().badges.includes("l0"), run: async () => {
      await say(["멈춰! 이 앞 DLL 1번 도로는 L0에 도달한 Link만 지나갈 수 있다.", "TLP를 주고받으려면 먼저 Physical Layer 링크가 L0여야 하거든. Lane 체육관 배지를 가져와라."], "경비원"); await G.stepBack();
    } })),
    signs: {
      "5,8": async () => { await say("【PCIe 마을】 모든 Link가 Detect에서 시작되는 곳.\nLTSSM 길잡이: Detect → Polling → Configuration → L0\n(L0에서 Recovery를 거쳐 속도 변경 · 저전력은 L0s/L1/L2)"); await learn("ltssm"); }
    },
    encounter: { rate: 0.12, mons: ["detectmon", "ts1slime", "pollbug", "skppeng", "lanesnake"], chapters: [1] },
    npcs: [
      { id: "granny", x: 3, y: 7, dir: "down", look: LOOK.old, talk: teacher(["호호, Polling 할머니란다.", "Detect가 끝나면 Polling에서 TS1/TS2 Ordered Set을 주고받지.", "그걸로 bit lock과 symbol lock을 맞추고, 뒤집힌 Lane 극성도 바로잡는단다."], ["polling", "ts_os"], "Polling 할머니") },
      { id: "laneboy", x: 7, y: 12, dir: "left", look: LOOK.boy, talk: teacher(["난 Lane 소년! Lane 하나는 Tx 차동쌍 + Rx 차동쌍이야.", "Configuration 상태에서 Link 번호, Lane 번호, 그리고 폭(x1~x16)을 정해.", "넌 지금 x1이지만, 레벨이 오르면 Link 폭도 넓어질 거야!"], ["link_lane", "configuration"], "Lane 소년") },
      { id: "fisher", x: 5, y: 15, dir: "left", look: LOOK.old, talk: teacher(["물고기도 클럭도 가만있질 않지…", "양쪽 기준 클럭은 미세하게 달라(ppm). 그래서 SKP Ordered Set을 주기적으로 보내 elastic buffer로 차이를 흡수하지."], ["skp"], "SKP 낚시꾼") },
      { id: "guard1", x: 11, y: 1, dir: "left", look: LOOK.guard, fixed: true, talk: async () => {
        if (G.P().badges.includes("l0")) await say("L0 배지 확인! DLL 1번 도로로 지나가도 좋다.", "경비원");
        else await say("L0에 도달해야 북쪽 도로를 지날 수 있다. Lane 체육관 관장을 이겨라!", "경비원");
      } },
      trainer("t_kid", { name: "Detect 꼬마", sight: 3, npc: { x: 6, y: 11, dir: "left", look: LOOK.boy },
        intro: ["너도 방금 Detect를 통과했지? 나랑 퀴즈 배틀하자!"], team: ["detectmon"], chapters: [1], maxD: 1,
        win: ["졌다… Detect에서 상대 Rx 종단을 감지하는 원리, 확실히 알겠어!"], after: "Gen1은 2.5 GT/s, 8b/10b 인코딩이야. 기억해!" })
    ]
  };

  /* ===================== Reset 센터 (회복) ===================== */
  G.maps.center = {
    name: "Reset 센터", border: " ",
    tiles: ["WWWWWWWWWW", "WBB____BBW", "WCCCCCCCCW", "W________W", "W________W", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 8, to: "town", tx: 14, ty: 11, dir: "down" }, { x: 5, y: 8, to: "town", tx: 14, ty: 11, dir: "down" }],
    npcs: [
      { id: "nurse", x: 4, y: 1, dir: "down", look: LOOK.nurse, talk: async () => {
        await say(["Reset 센터에 어서 오세요!", "Link를 Fundamental Reset으로 초기화해 드릴게요… ♪"], "간호사");
        G.heal(); await say("Link의 HP가 모두 회복되었다! (진행 상황 저장됨)", "간호사"); G.save();
      } },
      { id: "cfgman", x: 7, y: 5, dir: "left", look: LOOK.sci, talk: teacher(["링크는 처음엔 무조건 2.5 GT/s로 L0에 올라가.", "그 뒤 Recovery 상태에서 속도를 바꾸지. Gen1 2.5 → Gen2 5 → Gen3 8 → Gen4 16 → Gen5 32 → Gen6 64 GT/s!"], ["gen_speed", "recovery", "l0"], "속도 연구원") }
    ]
  };

  /* ===================== Lane 체육관 (1장 시험) ===================== */
  G.maps.gym1 = {
    name: "Lane 체육관", border: " ",
    tiles: ["WWWWWWWWWW", "WM______MW", "W________W", "W________W", "WM______MW", "W________W", "W________W", "WM______MW", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 11, to: "town", tx: 15, ty: 5, dir: "down" }, { x: 5, y: 11, to: "town", tx: 15, ty: 5, dir: "down" }],
    npcs: [
      { id: "gymguide", x: 7, y: 10, dir: "left", look: LOOK.guard, talk: teacher(["어이, 도전자! 관장은 인코딩과 Equalization을 꼭 물어본다.", "Gen1/2는 8b/10b(오버헤드 20%), Gen3~5는 128b/130b(약 1.5%)야.", "관장전은 1장 시험이니 해설 꼭 복습해!"], ["enc_8b10b", "enc_128b130b"], "체육관 안내원") },
      trainer("t_g1a", { name: "x1 소년", sight: 4, npc: { x: 2, y: 8, dir: "right", look: LOOK.boy },
        intro: ["8 GT/s부터는 채널 손실이 커서 Equalization이 필수라고!", "송신 preset과 FFE 계수를 Phase 0~3에서 조정하지. 덤벼!"], learn: "equalization",
        team: ["lanesnake", "ts1slime"], chapters: [1], win: "크윽, 네 신호가 더 깨끗했어…", after: "Equalization은 Recovery.Equalization 하위 상태에서 일어나." }),
      trainer("t_g1b", { name: "8b10b 소녀", sight: 4, npc: { x: 7, y: 5, dir: "left", look: LOOK.girl },
        intro: ["128비트마다 2비트 sync header! 그 의미를 아니?"], learn: "enc_128b130b",
        team: ["skppeng", "pollbug"], chapters: [1], minD: 2, win: "인코딩 박사가 되었구나!", after: "Gen3 x16은 한 방향 약 15.75 GB/s야." }),
      trainer("leader1", { name: "Lane 관장 하나", sight: 1, boss: true, npc: { x: 4, y: 2, dir: "down", look: LOOK.leader1 },
        intro: ["나는 Lane 관장 하나! Detect부터 L0까지, 링크 트레이닝의 모든 것을 시험하겠다.", "1장 챕터 시험, 시작!"],
        team: ["recgolem", "ltssmdragon"], chapters: [1], minD: 2, maxD: 3, xp: 60,
        win: ["훌륭하다! 너의 LTSSM은 이제 L0에 도달했다."], after: "L0 이후엔 Data Link Layer가 신뢰성을 책임진다. 북쪽으로 가라!",
        onWin: async () => {
          G.addBadge("l0"); await say("🏅 「L0 배지」를 받았다!");
          await G.setLTSSM("L0", "🔗 LTSSM: Configuration → L0\n링크 업! 이제 TLP/DLLP를 주고받을 수 있다. (처음엔 Gen1 2.5 GT/s)");
          await learn(["l0", "recovery", "gen_speed"]);
          await G.giveItem("retimer", 1);
          G.P().chapter = 2; await say("📖 2장 「Data Link Layer: 신뢰의 길」 시작! 마을 북쪽 경비원이 길을 열어 줄 것이다.");
        } })
    ]
  };

  /* ===================== DLL 1번 도로 (2장) ===================== */
  G.maps.route1 = {
    name: "DLL 1번 도로",
    tiles: [
      "TTTTTT==TTTTTT",
      "T.....==.....T",
      "T.....==UUUU.T",
      "T.....==UUUU.T",
      "T.S...==HDHH.T",
      "T.....=====..T",
      "T,,,,,==,,,,,T",
      "T,,,,,==,,,,,T",
      "T,,,,,==,,,,,T",
      "T.....==.....T",
      "TTT...==...TTT",
      "T~~~..==..,,,T",
      "T~~~..==..,,,T",
      "T.....==..,,,T",
      "T.F...==.....T",
      "T,,,,.==.,,,,T",
      "T,,,,.==.,,,,T",
      "T,,,,.==.,,,,T",
      "T.....==.....T",
      "TTTTTT==TTTTTT"
    ],
    warps: [
      { x: 6, y: 19, to: "town", tx: 9, ty: 1, dir: "down" }, { x: 7, y: 19, to: "town", tx: 10, ty: 1, dir: "down" },
      { x: 9, y: 4, to: "gym2", tx: 4, ty: 8, dir: "up" },
      { x: 6, y: 0, to: "cxlcity", tx: 7, ty: 12, dir: "up" }, { x: 7, y: 0, to: "cxlcity", tx: 8, ty: 12, dir: "up" }
    ],
    triggers: [6, 7].map((x) => ({ x, y: 1, cond: () => !G.hasItem("bar_key"), run: async () => {
      await say(["여기서부터 CXL 시티. 주소 공간을 할당받지 못한 장치는 들어갈 수 없다.", "Replay 체육관 관장에게 BAR 열쇠를 받아 와라."], "관문 경비원"); await G.stepBack();
    } })),
    signs: { "2,4": async () => { await say("【DLL 1번 도로】 북: Replay 체육관 · CXL 시티\nData Link Layer는 링크 한 구간의 신뢰성을 책임진다: Sequence Number, LCRC, Ack/Nak, Flow Control."); await learn("dll"); } },
    encounter: { rate: 0.12, mons: ["nakghost", "lcrccrab", "creditsq", "dllpbat"], chapters: [2] },
    npcs: [
      { id: "gate2", x: 8, y: 1, dir: "left", look: LOOK.guard, fixed: true, talk: async () => { await say(G.hasItem("bar_key") ? "BAR 열쇠 확인. CXL 시티로 가라!" : "BAR 열쇠가 없으면 못 지나간다.", "관문 경비원"); } },
      { id: "seqold", x: 3, y: 14, dir: "right", look: LOOK.old, talk: teacher(["DLL은 TLP 앞에 12비트 Sequence Number, 뒤에 32비트 LCRC를 붙인다네.", "DLLP는 작아서 16비트 CRC를 쓰지."], ["seq_lcrc"], "Seq 할아버지") },
      { id: "fcmerchant", x: 11, y: 9, dir: "down", look: LOOK.sci, talk: async () => {
        await say(["Credit 상인일세. 수신측은 버퍼 여유를 credit으로 광고하지.", "P/NP/Cpl 각각 Header·Data credit, 총 6종! Data credit 1개 = 16바이트."], "Credit 상인");
        await learn("fc");
        if (!G.flag("gotfc2")) { G.setFlag("gotfc2"); await G.giveItem("fc_credit", 3); }
      } },
      trainer("t_r1a", { name: "Ack 소녀", sight: 3, npc: { x: 5, y: 13, dir: "right", look: LOOK.girl },
        intro: ["정상 수신이면 Ack, LCRC 오류면 Nak! 내 TLP를 받아 봐!"], learn: "ack_nak",
        team: ["nakghost", "lcrccrab"], chapters: [2], win: "Ack! 잘 받았어.", after: "Ack 하나로 여러 TLP를 한꺼번에 확인할 수 있어." }),
      trainer("t_r1b", { name: "Credit 아저씨", sight: 3, npc: { x: 8, y: 9, dir: "left", look: LOOK.boy },
        intro: ["credit 없이는 TLP 한 개도 못 보낸다고!"], learn: "fc",
        team: ["creditsq", "dllpbat"], chapters: [2], win: "UpdateFC… 내 credit을 돌려받아야겠군.", after: "credit이 바닥나면 송신측은 기다려야 해. 그래서 overflow가 없지." })
    ]
  };

  /* ===================== Replay 체육관 (2장 시험) ===================== */
  G.maps.gym2 = {
    name: "Replay 체육관", border: " ",
    tiles: ["WWWWWWWWWW", "WM______MW", "W________W", "W________W", "W________W", "WM______MW", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 9, to: "route1", tx: 9, ty: 5, dir: "down" }, { x: 5, y: 9, to: "route1", tx: 9, ty: 5, dir: "down" }],
    npcs: [
      trainer("t_g2a", { name: "Replay 트레이너", sight: 3, npc: { x: 6, y: 6, dir: "left", look: LOOK.boy },
        intro: ["Ack가 올 때까지 TLP 복사본은 Replay Buffer에! REPLAY_TIMER가 만료되면 재전송이다!", "그리고 DLLP는 replay하지 않는다는 것도 알아 둬."], learn: ["replay", "dllp"],
        team: ["dllpbat", "nakghost"], chapters: [2], minD: 2, win: "REPLAY_NUM 롤오버… 재훈련해야겠다.", after: "재전송이 4번 반복되면 Recovery로 재훈련이야." }),
      trainer("leader2", { name: "Replay 관장 애크", sight: 1, boss: true, npc: { x: 4, y: 2, dir: "down", look: LOOK.leader2 },
        intro: ["나는 애크! 링크 신뢰성의 수호자다.", "Sequence, LCRC, Ack/Nak, Replay, Flow Control… 2장 챕터 시험이다!"],
        team: ["nakghost", "replaytitan"], chapters: [2], minD: 2, maxD: 3, xp: 90,
        win: ["Ack! 너의 DLL은 완벽하다."], after: "CXL 시티에서는 Transaction Layer와 CXL이 기다린다.",
        onWin: async () => {
          G.addBadge("dl"); await say("🏅 「DL_Active 배지」를 받았다!");
          await say("🔗 InitFC1 → InitFC2 교환 완료. DL_Init → DL_Active! 이제 TLP를 보낼 수 있다.");
          await learn("fc_init");
          await G.giveItem("bar_key", 1); await G.giveItem("replay_buf", 2);
          G.P().chapter = 3; await say("📖 3장 「Transaction Layer」 시작! 북쪽 CXL 시티로 가자.");
        } })
    ]
  };

  /* ===================== CXL 시티 (3장~ 프로토타입) ===================== */
  G.maps.cxlcity = {
    name: "CXL 시티",
    tiles: [
      "TTTTTTTTTTTTTTTT",
      "T..............T",
      "T.RRRR....PPPP.T",
      "T.RRRR....PPPP.T",
      "T.HDHH....HHDH.T",
      "T..=........=..T",
      "T..==========..T",
      "T......==......T",
      "T.,,,,.==.,,,,.T",
      "T.,,,,.==.,,,,.T",
      "T.,,,,.==.,,,,.T",
      "T......==...F..T",
      "T......==......T",
      "TTTTTTT==TTTTTTT"
    ],
    warps: [{ x: 7, y: 13, to: "route1", tx: 6, ty: 1, dir: "down" }, { x: 8, y: 13, to: "route1", tx: 7, ty: 1, dir: "down" }, { x: 3, y: 4, to: "school", tx: 4, ty: 7, dir: "up" }],
    triggers: [{ x: 12, y: 4, run: async () => { await say("【Coherency 체육관】 공사 중!\n6장(Type 1/2/3 & Coherency) 업데이트를 기다려 주세요."); await G.stepBack(); } }],
    encounter: { rate: 0.12, mons: ["tlpmon", "barbear", "msixfox", "flitbird", "pam4jelly", "snoopowl", "cxliofrog"], chapters: [3, 4, 5] },
    npcs: [
      { id: "cxlprof", x: 6, y: 7, dir: "down", look: LOOK.sci, talk: async () => {
        await say(["나는 CXL 박사. CXL은 PCIe PHY 위에서 세 프로토콜을 섞는다네.", "CXL.io는 PCIe와 같은 발견·설정·DMA, CXL.cache는 장치가 호스트 메모리를 캐시, CXL.mem은 호스트가 장치 메모리를 load/store!", "링크 트레이닝 중 Modified TS1/TS2로 CXL 모드를 협상하지."], "CXL 박사");
        await learn(["cxl_overview", "cxl_io", "cxl_cache", "cxl_mem", "alt_protocol"]);
        if (G.P().chapter < 5) { G.P().chapter = 5; await say("📖 5장 「CXL 프로토콜」 미리보기 해금! (4장 전원 상태는 풀숲 문제로 학습)"); }
      } },
      { id: "typegirl", x: 13, y: 6, dir: "left", look: LOOK.girl, talk: teacher(["체육관이 열리면 장치 타입을 물어볼 거래!", "Type 1 = .io+.cache, Type 2 = .io+.cache+.mem, Type 3 = .io+.mem(메모리 확장기)!"], ["type1", "type2", "type3"], "타입 소녀") },
      { id: "poolman", x: 11, y: 11, dir: "left", look: LOOK.boy, talk: teacher(["CXL 2.0부터 스위치로 메모리를 풀링할 수 있어. MLD 하나를 최대 16개 LD로 나누지!", "CXL 3.0은 64 GT/s, 256B Flit, 4096 노드 패브릭까지!"], ["switching", "mld_pool", "cxl3_fabric"], "풀링 아저씨") }
    ]
  };
  G.maps.school = {
    name: "Transaction 학교", border: " ",
    tiles: ["WWWWWWWWWW", "WBBWMMWBBW", "W________W", "W________W", "W________W", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 8, to: "cxlcity", tx: 3, ty: 5, dir: "down" }, { x: 5, y: 8, to: "cxlcity", tx: 3, ty: 5, dir: "down" }],
    npcs: [
      { id: "tlpteacher", x: 4, y: 3, dir: "down", look: LOOK.prof, talk: teacher(["Transaction Layer 수업을 시작하지.", "TLP = Header + (Data) + (ECRC). MRd는 Non-Posted라 CplD가 돌아오고, MWr는 Posted라 응답이 없다.", "Config Space는 Function마다 4KB, BAR로 주소 영역을 할당하지.", "인터럽트 MSI/MSI-X도 결국 Memory Write TLP! 그리고 Read는 앞선 Write를 추월하지 못한다."], ["tlp", "tlp_types", "posted", "cfg_space", "bar", "msi", "ordering", "mps"], "TLP 선생님") },
      { id: "pwrstudent", x: 7, y: 5, dir: "left", look: LOOK.girl, talk: teacher(["4장 예습 중이에요! L1에서 깨어날 땐 Recovery를 거치고, L0s는 FTS로 바로 L0!", "Gen6는 PAM4 + 256B FLIT + FEC래요."], ["aspm", "pam4", "flit", "fec"], "예습하는 학생") }
    ]
  };

  window.addEventListener("load", () => G.start());
})();
