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

  /* ===================== 맵 생성 도우미 ===================== */
  // area(w,h,base,border,ops): ops = [[ch,x,y,w,h], ...] 순서대로 덮어씀
  function area(w, h, base, border, ops) {
    const g = []; for (let y = 0; y < h; y++) { g.push([]); for (let x = 0; x < w; x++) g[y].push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? border : base); }
    ops.forEach(([c, x0, y0, ww = 1, hh = 1]) => { for (let y = y0; y < y0 + hh; y++) for (let x = x0; x < x0 + ww; x++) if (g[y] && x >= 0 && x < w) g[y][x] = c; });
    return g.map((r) => r.join(""));
  }
  const LTS = S.LTSSM;
  const stName = (id) => LTS.STATES.find((s) => s.id === id).name;
  const famIntro = (ids) => ids.map((id) => { const st = LTS.STATES.find((s) => s.id === id); return `· ${G.sn(st)}: ${G.t(st.intro, st.introEn)}`; }).join("\n");
  function areaSign(title, fams, extra) { return async () => { await say([`【${G.tr(title)}】\n${famIntro(fams)}`, extra || "풀숲에서 몬스터를 만나 퀴즈로 규칙을 익히자. 규칙마다 2번 맞히면 습득, state의 규칙을 다 모으면 배지!"]); }; }

  /* ===================== 연구소 ===================== */
  G.maps.lab = {
    name: "Root 박사의 연구소", border: " ",
    tiles: ["WWWWWWWWWW", "WBBWMMWBBW", "W________W", "W________W", "W________W", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 8, to: "town", tx: 4, ty: 5, dir: "down" }, { x: 5, y: 8, to: "town", tx: 4, ty: 5, dir: "down" }],
    triggers: [4, 5].map((x) => ({ x, y: 7, cond: () => !G.flag("metProf"), run: async () => { await say("잠깐! 아직 설명이 안 끝났단다. 이리 와 보렴.", "Root 박사"); await G.stepBack(); } })),
    npcs: [{ id: "prof", x: 4, y: 3, dir: "down", look: LOOK.prof, talk: async () => {
      if (!G.flag("metProf")) return profIntro();
      await say([G.hint()], "Root 박사");
      G.heal(); await say("(박사님이 Link를 점검해 주었다. HP 회복!)");
    } }]
  };
  async function profIntro() {
    await say(["오, 깨어났구나! 나는 Root 박사. 이 PCIe 지방의 Root Complex란다.", "너는 막 전원이 들어온 신입 Link다. 아직 LTSSM의 첫 state, Detect에 머물러 있지.", "1번 마을의 목표는 단 하나 — LTSSM(PCIe 7.0)의 모든 규칙을 익히는 것!"], "Root 박사");
    G.setFlag("metProf");
    await say(["마을 밖 풀숲에는 state마다 다른 spec몬이 산다. 서쪽 Detect 초원, 그 북쪽 Polling 숲, 동쪽 Configuration 협곡과 Recovery 동굴, 남쪽 Power 호수, 북쪽 시련의 탑.", "몬스터와 퀴즈로 싸워 규칙을 익혀라. 규칙 하나는 2번 맞히면 습득, 한 state의 규칙을 다 모으면 그 state 배지란다.", "Lv10이 되고 Detect·Polling·Configuration·Recovery·L0 배지를 모으면 LTSSM 관장에게 도전할 수 있다."], "Root 박사");
    await G.giveItem("fc_credit", 3);
    await G.giveItem("msix_table", 1);
    await say(["막히면 가방에서 MSI-X 표를 써서 나에게 인터럽트를 보내라. 메뉴(B/START)의 규칙 도감·배지 케이스로 진행 상황도 볼 수 있단다.", "먼저 서쪽 Detect 초원부터 가 보거라!"], "Root 박사");
  }
  G.hint = () => {
    const p = G.P(), t = G.t, n = (id) => `(${G.stateDone(id)}/${G.stateTot(id)})`;
    if (!G.flag("metProf")) return t("연구소의 Root 박사에게 말을 걸어라.", "Talk to Dr. Root in the lab.");
    if (!p.badges.includes("l0")) {
      if (!p.sbadges.includes("det")) return t(`서쪽 Detect 초원에서 Detect 규칙을 모아라. ${n("det")}`, `Collect Detect rules in Detect Meadow to the west. ${n("det")}`);
      if (!p.sbadges.includes("pol")) return t(`Detect 초원 북쪽 Polling 숲으로! ${n("pol")}`, `On to Polling Forest, north of Detect Meadow! ${n("pol")}`);
      if (!p.sbadges.includes("cfg")) return t(`마을 동쪽 Configuration 협곡으로! ${n("cfg")}`, `On to Configuration Canyon, east of town! ${n("cfg")}`);
      if (!p.sbadges.includes("rec")) return t(`협곡 동쪽 끝 Recovery 동굴로! ${n("rec")}`, `On to Recovery Cave at the canyon's east end! ${n("rec")}`);
      if (!p.sbadges.includes("l0")) return t(`남쪽 Power 호수의 L0 몬스터들과 싸워라. ${n("l0")}`, `Battle the L0 monsters at Power Lake to the south. ${n("l0")}`);
      if (p.lv < 10) return t(`핵심 배지 완료! Lv10까지 레벨을 올려라 (현재 Lv${p.lv}). 시련의 탑의 Hot Reset·Loopback·Disabled도 좋은 수련이다.`, `Core badges done! Reach Lv10 (now Lv${p.lv}). Hot Reset, Loopback and Disabled at the Tower of Trials are good training.`);
      return t("모든 조건 충족! 마을 오른쪽 위 LTSSM 체육관 관장에게 도전하라!", "All requirements met! Challenge the leader of the LTSSM Gym in the top-right of town!");
    }
    return t("LTSSM 마스터! 시련의 탑 북쪽 길로 2번 마을 Flit 항구에 가자.", "LTSSM Master! Take the road north of the Tower to Town 2, Flit Harbor.");
  };

  G.onNewGame = async () => {
    await say(["…… 신호가 없다.", "너는 막 전원이 들어온 PCIe Link다. 아직 아무 상대도 감지하지 못했다.\n(LTSSM 상태: Detect)", "앞에 있는 박사님에게 말을 걸어 보자. (A 버튼)"]);
  };
  G.onMigrated = async () => {
    await say(["📦 업데이트 안내", "1번 마을이 LTSSM 중심으로 새로 바뀌었다! (PCIe 7.0 / CXL 4.0 기준)", "레벨·배지·문제 기록은 그대로 두고, 위치만 PCIe 마을로 옮겼다. 새 '규칙 도감'과 'state 배지'를 모아 보자.", "처음부터 다시 하고 싶다면 타이틀에서 '새로 시작'을 고르면 된다."]);
  };

  /* ===================== PCIe 마을 (허브) ===================== */
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
      "T.....F..==..HDHH..T",
      "T........==...=....T",
      "====================",
      "T.....F..==........T",
      "T~~~~....==....F...T",
      "T~~~~....==........T",
      "T~~~~...T==T.......T",
      "TTTTTTTTT==TTTTTTTTT"
    ],
    warps: [
      { x: 4, y: 4, to: "lab", tx: 4, ty: 7, dir: "up" },
      { x: 15, y: 4, to: "gym1", tx: 4, ty: 10, dir: "up" },
      { x: 14, y: 10, to: "center", tx: 4, ty: 7, dir: "up" },
      { x: 0, y: 12, to: "det_field", tx: 22, ty: 9, dir: "left" },
      { x: 19, y: 12, to: "cfg_canyon", tx: 1, ty: 8, dir: "right" },
      { x: 9, y: 17, to: "lake", tx: 11, ty: 1, dir: "down" }, { x: 10, y: 17, to: "lake", tx: 12, ty: 1, dir: "down" },
      { x: 9, y: 0, to: "tower_yard", tx: 7, ty: 12, dir: "up" }, { x: 10, y: 0, to: "tower_yard", tx: 8, ty: 12, dir: "up" }
    ],
    signs: {
      "5,8": async () => { await say(["【PCIe 마을】 LTSSM(PCIe 7.0)을 익히는 첫 마을.\n← 서: Detect 초원 (북쪽에 Polling 숲)\n→ 동: Configuration 협곡 → Recovery 동굴\n↓ 남: Power 호수   ↑ 북: 시련의 탑", "관장 도전: Lv10 + Detect·Polling·Configuration·Recovery·L0 배지"]); }
    },
    npcs: [
      { id: "granny", x: 3, y: 7, dir: "down", look: LOOK.old, talk: async () => { await say(["호호, 배지 할머니란다.", "규칙 도감을 열면 state마다 규칙이 ●○로 보이지. 규칙 문제를 2번 맞히면 ●●, 다 모으면 배지가 반짝!", "틀린 문제와 아직 못 익힌 규칙은 더 자주 나오니, 해설을 꼭 읽으렴."], "배지 할머니"); } },
      { id: "comboboy", x: 7, y: 13, dir: "left", look: LOOK.boy, talk: async () => { await say(["3문제 연속으로 맞히면 🔥콤보 보너스 XP! 5연속이면 공격력도 올라가.", "한 번도 안 틀리고 이기면 ✨퍼펙트 배틀 XP +30%야. 메뉴의 '기록'에서 최고 콤보를 확인해 봐!"], "콤보 소년"); } },
      { id: "fisher", x: 5, y: 15, dir: "left", look: LOOK.old, talk: async () => { await say(["물고기도 클럭도 가만있질 않지…", "양쪽 Refclk은 ppm 단위로 다르니 SKP Ordered Set으로 elastic buffer를 맞춘단다. 64 GT/s 이상 Flit Mode에선 Control SKP도 쓰지."], "SKP 낚시꾼"); } }
    ]
  };

  /* ===================== Detect 초원 ===================== */
  G.maps.det_field = {
    name: "Detect 초원",
    tiles: area(24, 18, ".", "T", [
      ["=", 5, 9, 19, 1], ["=", 4, 0, 2, 10], [",", 7, 2, 7, 5], [",", 15, 2, 7, 5], [",", 7, 11, 6, 5], [",", 15, 11, 7, 5], [",", 1, 11, 4, 5],
      ["T", 13, 12, 2, 2], ["F", 2, 3, 1, 1], ["F", 20, 8, 1, 1], ["S", 21, 8, 1, 1], ["T", 1, 1, 2, 1]
    ]),
    warps: [{ x: 23, y: 9, to: "town", tx: 1, ty: 12, dir: "right" }, { x: 4, y: 0, to: "pol_forest", tx: 8, ty: 20, dir: "up" }, { x: 5, y: 0, to: "pol_forest", tx: 9, ty: 20, dir: "up" }],
    signs: { "21,8": areaSign("Detect 초원", ["det"], "Detect.Quiet와 Detect.Active 몬스터가 산다. 12 ms, 1 ms, ZRX-DC… 숫자를 잘 기억하자!") },
    encounter: { rate: 0.14, table: [["quietbug", 5], ["radarbug", 5], ["pulsebird", 1]] },
    npcs: [
      trainer("t_det", { name: "Detect 꼬마", sight: 3, npc: { x: 11, y: 8, dir: "down", look: LOOK.boy },
        intro: ["너도 방금 Detect를 통과했지? 나랑 퀴즈 배틀하자!"], team: ["quietbug", "radarbug"], maxD: 1,
        win: ["졌다… 상대 Rx 종단을 감지하는 원리, 확실히 알겠어!"], after: "Detect.Active에서 모든 Lane이 감지되면 Polling, 하나도 없으면 Detect.Quiet로 돌아가." }),
      { id: "detsci", x: 18, y: 9, dir: "left", look: LOOK.sci, talk: async () => { await say(["Receiver Detection은 Tx 공통모드 전압을 바꿨을 때 충전 시간으로 상대 종단 저항을 알아내는 거야.", "Lane 일부만 감지되면 12 ms 뒤 다시 확인하고, 그래도 같으면 감지된 Lane만으로 Polling에 간다네."], "감지 연구원"); } }
    ]
  };

  /* ===================== Polling 숲 ===================== */
  G.maps.pol_forest = {
    name: "Polling 숲",
    tiles: area(18, 22, ".", "T", [
      [",", 1, 14, 6, 6], [",", 11, 14, 6, 6], [",", 2, 2, 13, 8], ["T", 6, 4, 5, 3], ["T", 1, 11, 3, 2], ["T", 14, 11, 3, 2],
      ["=", 8, 12, 2, 10], ["=", 3, 11, 12, 1], ["=", 8, 7, 2, 4], ["S", 10, 18, 1, 1], ["F", 7, 18, 1, 1]
    ]),
    warps: [{ x: 8, y: 21, to: "det_field", tx: 4, ty: 1, dir: "down" }, { x: 9, y: 21, to: "det_field", tx: 5, ty: 1, dir: "down" }],
    signs: { "10,18": areaSign("Polling 숲", ["pol"], "Polling.Active · Compliance · Configuration. TS1 1024개, 8연속, 24 ms, 48 ms!") },
    encounter: { rate: 0.14, table: [["pulsebird", 4], ["complybird", 3], ["cfgbird", 3]] },
    npcs: [
      trainer("t_pol1", { name: "TS1 소녀", sight: 3, npc: { x: 5, y: 12, dir: "right", look: LOOK.girl },
        intro: ["PAD TS1을 1024개 보내 본 적 있어? 덤벼!"], team: ["pulsebird", "cfgbird"],
        win: "8연속 수신 성공… 네가 이겼어!", after: "Polling.Configuration에서는 TS2를 8연속 받고 16개 보낸 뒤 넘어가." }),
      trainer("t_pol2", { name: "Compliance 측정원", sight: 4, npc: { x: 12, y: 3, dir: "down", look: LOOK.sci },
        intro: ["측정 장비를 연결하면 Polling.Compliance로 빠지지. 그 조건, 알고 있나?"], team: ["complybird", "pulsebird"],
        win: "측정 종료! 아주 깨끗한 eye였다.", after: "Compliance에는 전체 timeout이 없다네. 빠져나올 조건이 정해져 있지." })
    ]
  };

  /* ===================== Configuration 협곡 ===================== */
  G.maps.cfg_canyon = {
    name: "Configuration 협곡",
    tiles: area(26, 16, "G", "K", [
      ["v", 1, 10, 8, 4], ["v", 9, 2, 9, 5], ["v", 17, 10, 7, 4], ["v", 20, 1, 5, 6], ["K", 5, 1, 3, 4], ["K", 12, 11, 4, 3], ["K", 19, 2, 1, 4],
      ["=", 0, 8, 26, 1], ["S", 3, 7, 1, 1], ["S", 22, 7, 1, 1]
    ]),
    warps: [{ x: 0, y: 8, to: "town", tx: 18, ty: 12, dir: "left" }, { x: 25, y: 8, to: "rec_cave", tx: 1, ty: 9, dir: "right" }],
    signs: { "3,7": areaSign("Configuration 협곡", ["cfg", "cxl"], "Linkwidth → Lanenum → Complete → Idle. 동쪽 끝 마른 풀숲에는 CXL Flex Bus 물고기도 산다(CXL/공통)."),
      "22,7": async () => { await say("【→ Recovery 동굴】 속도 변경과 Equalization의 동굴. 깊은 곳에 크리스탈 몬스터가 있다."); } },
    encounter: { rate: 0.14, table: [["widthsnake", 3], ["acceptsnake", 3], ["lanenaga", 3], ["completenaga", 3], ["flexfish", 2], ["retimerfish", 1]] },
    npcs: [
      trainer("t_cfg1", { name: "Lane 소년", sight: 3, npc: { x: 10, y: 7, dir: "down", look: LOOK.boy },
        intro: ["Link 번호, Lane 번호, 그리고 폭! Configuration은 내 전문이야!"], team: ["widthsnake", "lanenaga"],
        win: "Lane Reversal까지 아는구나…", after: "초기 훈련의 Configuration은 2.5 GT/s에서 진행돼. 속도는 L0 이후 Recovery로!" }),
      trainer("t_cxl", { name: "CXL 탐험가", sight: 3, npc: { x: 21, y: 9, dir: "up", look: LOOK.sci },
        intro: ["Modified TS1/TS2로 Flex Bus 모드를 협상해 본 적 있나? CXL 4.0 퀴즈다!"], team: ["flexfish", "retimerfish"],
        win: "128 GT/s, 리타이머 4개… 완벽하군!", after: "CXL 4.0의 x2 native는 128 GT/s에서만이라는 걸 잊지 마." })
    ]
  };

  /* ===================== Recovery 동굴 ===================== */
  G.maps.rec_cave = {
    name: "Recovery 동굴", border: "K",
    tiles: area(20, 18, ";", "K", [
      [":", 3, 2, 6, 5], [":", 11, 2, 7, 4], [":", 2, 11, 7, 5], [":", 11, 10, 7, 6], ["K", 9, 3, 2, 3], ["K", 9, 12, 2, 4], ["K", 5, 7, 2, 1],
      [";", 0, 9, 20, 1], [";", 13, 6, 2, 4], ["*", 17, 2, 1, 1], ["*", 2, 15, 1, 1], ["*", 17, 15, 1, 1], ["S", 2, 8, 1, 1]
    ]),
    warps: [{ x: 0, y: 9, to: "cfg_canyon", tx: 24, ty: 8, dir: "left" }],
    signs: { "2,8": areaSign("Recovery 동굴", ["rec", "eq"], "RcvrLock → Speed → RcvrCfg → Idle, 그리고 EQ Phase 0~3. 64 GT/s 이상에서는 timeout이 달라진다!") },
    encounter: { rate: 0.13, table: [["lockgolem", 3], ["speedgolem", 3], ["cfggolem", 3], ["eq0crystal", 2], ["eq2crystal", 2], ["eq3crystal", 2]] },
    npcs: [
      trainer("t_rec", { name: "광부 리트레인", sight: 3, npc: { x: 6, y: 10, dir: "up", look: LOOK.old },
        intro: ["링크가 흔들리면 Recovery로 다시 맞추지! 덤벼라!"], team: ["lockgolem", "speedgolem", "cfggolem"],
        win: "허허, 재훈련이 필요한 건 나였군.", after: "Recovery.Speed 실패 시엔 원래 속도로 돌아가 다시 시도한다네." }),
      trainer("t_eq", { name: "EQ 연구원", sight: 3, npc: { x: 14, y: 6, dir: "down", look: LOOK.sci },
        intro: ["Phase 2는 USP가 DSP Tx를, Phase 3은 DSP가 USP Tx를 조정! 헷갈리면 지는 거다."], team: ["eq0crystal", "eq2crystal", "eq3crystal"],
        win: "Eye가 활짝 열렸군…", after: "64 GT/s 이상 EQ는 TS0 Ordered Set으로 진행된다." })
    ]
  };

  /* ===================== Power 호수 ===================== */
  G.maps.lake = {
    name: "Power 호수",
    tiles: area(24, 18, ".", "T", [
      [",", 1, 2, 4, 13], [",", 19, 2, 4, 13], [",", 6, 13, 12, 4], ["Z", 5, 4, 14, 9], ["~", 7, 5, 10, 7], ["=", 11, 0, 2, 4], ["S", 13, 3, 1, 1], ["F", 6, 3, 1, 1], ["F", 17, 3, 1, 1]
    ]),
    warps: [{ x: 11, y: 0, to: "town", tx: 9, ty: 16, dir: "up" }, { x: 12, y: 0, to: "town", tx: 10, ty: 16, dir: "up" }],
    signs: { "13,3": areaSign("Power 호수", ["l0", "l0p", "l0s", "l1", "l2"], "L0는 핵심 배지! L0s는 Non-Flit 전용, L0p는 Flit 전용이라는 점을 꼭 구분하자.") },
    encounter: { rate: 0.14, table: [["linkcat", 3], ["osetcat", 3], ["halfturtle", 3], ["txbat", 2], ["rxbat", 2], ["l1shroom", 2], ["l12shroom", 2], ["l2ghost", 2], ["wakeghost", 1]] },
    npcs: [
      trainer("t_lake1", { name: "링크 낚시꾼", sight: 3, npc: { x: 4, y: 15, dir: "right", look: LOOK.old },
        intro: ["L0에서 한가하게 낚시 중이었지. 한 판 할까?"], team: ["linkcat", "halfturtle"],
        win: "LinkUp=1b… 자네가 이겼네.", after: "L0p는 L0의 일부야. Flit Mode에서 Link Management DLLP로 폭만 바꾸지." }),
      trainer("t_lake2", { name: "잠꾸러기", sight: 3, npc: { x: 20, y: 14, dir: "left", look: LOOK.girl },
        intro: ["음냐… L1.2에서 깨우지 마…"], team: ["l1shroom", "txbat", "l2ghost"],
        win: "CLKREQ#… 일어났어!", after: "L1에서 나올 땐 Recovery를 거쳐. FTS로 바로 L0에 가는 건 L0s뿐이야." })
    ]
  };

  /* ===================== 시련의 탑 ===================== */
  G.maps.tower_yard = {
    name: "시련의 탑 앞",
    tiles: area(16, 14, ".", "T", [
      ["P", 10, 2, 5, 3], ["H", 10, 5, 5, 1], ["D", 12, 5, 1, 1], ["=", 7, 0, 2, 14], ["=", 9, 6, 4, 1], [",", 1, 7, 5, 5], [",", 10, 8, 5, 4], ["S", 6, 4, 1, 1], ["F", 2, 2, 1, 1]
    ]),
    warps: [{ x: 7, y: 13, to: "town", tx: 9, ty: 1, dir: "down" }, { x: 8, y: 13, to: "town", tx: 10, ty: 1, dir: "down" }, { x: 12, y: 5, to: "tower", tx: 5, ty: 12, dir: "up" },
      { x: 7, y: 0, to: "route1", tx: 6, ty: 18, dir: "up" }, { x: 8, y: 0, to: "route1", tx: 7, ty: 18, dir: "up" }],
    triggers: [7, 8].map((x) => ({ x, y: 1, cond: () => !G.P().badges.includes("l0"), run: async () => {
      await say(["멈춰! 이 앞 2번 마을(Flit 항구) 가는 길은 LTSSM 마스터만 지나갈 수 있다.", "TLP를 주고받으려면 먼저 Physical Layer가 L0여야 하거든. LTSSM 관장을 이기고 와라."], "경비원"); await G.stepBack();
    } })),
    signs: { "6,4": areaSign("시련의 탑", ["dis", "lb", "hr"], "Disabled · Loopback · Hot Reset. 관장 도전 필수는 아니지만, 경험치와 기술(Hot Reset, Loopback 에코)을 얻을 수 있다.") },
    encounter: { rate: 0.12, table: [["plugblob", 2], ["leadjelly", 2], ["echojelly", 2], ["resetdrake", 1]] },
    npcs: [{ id: "guard1", x: 9, y: 1, dir: "left", look: LOOK.guard, fixed: true, talk: async () => {
      await say(G.P().badges.includes("l0") ? "LTSSM 마스터 배지 확인! Flit 항구 가는 길로 지나가도 좋다." : "LTSSM 관장을 이겨야 북쪽 도로를 지날 수 있다.", "경비원"); } }]
  };
  G.maps.tower = {
    name: "시련의 탑", border: "Q",
    tiles: area(12, 14, "Y", "Q", [[":", 1, 1, 10, 3], [":", 1, 6, 4, 5], [":", 7, 6, 4, 5], ["Q", 5, 5, 2, 1], ["X", 5, 13, 2, 1]]),
    warps: [{ x: 5, y: 13, to: "tower_yard", tx: 12, ty: 6, dir: "down" }, { x: 6, y: 13, to: "tower_yard", tx: 12, ty: 6, dir: "down" }],
    encounter: { rate: 0.15, table: [["plugblob", 2], ["leadjelly", 2], ["echojelly", 2], ["resetdrake", 2]] },
    npcs: [
      trainer("t_tower", { name: "탑지기 리셋", sight: 3, npc: { x: 5, y: 4, dir: "down", look: LOOK.guard },
        intro: ["Hot_Reset_Request TS1 2연속! 내 시련을 받아라!"], team: ["plugblob", "leadjelly", "resetdrake"],
        win: "2 ms timeout… 내가 Detect로 돌아가는군.", after: "Disable은 bit 1, Loopback은 bit 2, Hot Reset은 bit 0. 1b/1b에선 4비트 인코딩이다." })
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
      { id: "cfgman", x: 7, y: 5, dir: "left", look: LOOK.sci, talk: async () => { await say(["링크는 처음엔 무조건 2.5 GT/s로 L0에 올라가.", "그 뒤 Recovery에서 속도를 올리지: 2.5 → 5 → 8 → 16 → 32 → 64 → 128 GT/s(PCIe 7.0)!", "8 GT/s부터는 Equalization, 64 GT/s부터는 PAM4 + Flit Mode가 필요해."], "속도 연구원"); } }
    ]
  };

  /* ===================== LTSSM 체육관 ===================== */
  const gymMissing = () => { const p = G.P(); const miss = []; if (p.lv < 10) miss.push(G.t(`레벨 ${p.lv}/10`, `Level ${p.lv}/10`)); LTS.CORE.forEach((s) => { if (!p.sbadges.includes(s)) miss.push(G.t(`${stName(s)} 배지 (규칙 ${G.stateDone(s)}/${G.stateTot(s)})`, `${stName(s)} badge (rules ${G.stateDone(s)}/${G.stateTot(s)})`)); }); return miss; };
  const leader = trainer("leader1", { name: "LTSSM 관장 하나", sight: -1, boss: true, npc: { x: 4, y: 2, dir: "down", look: LOOK.leader1 },
    intro: ["나는 LTSSM 관장 하나! Detect부터 Hot Reset까지, 링크 트레이닝의 모든 규칙을 시험하겠다.", "3마리 연속 승부다. 시작!"],
    team: ["kinggolem", "eqqueen", "ltssmdrake"], minD: 2, maxD: 3, xp: 90,
    win: ["훌륭하다! 너는 LTSSM을 완전히 이해했다."], after: "L0 다음은 PHY와 Flit의 세계다. 시련의 탑 북쪽, 2번 마을 Flit 항구로 가라!",
    onWin: async () => {
      const p = G.P();
      G.addBadge("l0");
      await window.LUI.badgePopup(Object.assign({ isMaster: true }, LTS.MASTER), G.tr("LTSSM 마스터 배지!"), G.tr("다음 마을로 가는 길이 열렸다"));
      G.clearConsole();
      if (p.flags.gym_nodmg_pending) { p.flags.gym_nodmg = true; }
      await G.checkGrowth();
      await G.giveItem("retimer", 1);
      p.chapter = 2; await say("📖 2번 마을 「Flit 항구」로 가는 길이 열렸다! 시련의 탑 앞 경비원이 북쪽 길을 열어 줄 것이다.");
      await G.checkAch();
    } });
  const leaderTalk = leader.talk;
  leader.talk = async (n) => {
    const miss = gymMissing();
    if (!G.flag("beat_leader1") && miss.length && !G.P().badges.includes("l0")) { await say(["도전자여, 아직 자격이 부족하다.", G.t("부족한 것:\n", "Missing:\n") + miss.map((m) => "· " + m).join("\n")], "LTSSM 관장 하나"); return; }
    G.P().flags.gym_nodmg_pending = false;
    await leaderTalk(n);
  };
  G.maps.gym1 = {
    name: "LTSSM 체육관", border: " ",
    tiles: ["WWWWWWWWWW", "WM______MW", "W________W", "W________W", "WM______MW", "W________W", "W________W", "WM______MW", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
    warps: [{ x: 4, y: 11, to: "town", tx: 15, ty: 5, dir: "down" }, { x: 5, y: 11, to: "town", tx: 15, ty: 5, dir: "down" }],
    npcs: [
      { id: "gymguide", x: 7, y: 10, dir: "left", look: LOOK.guard, talk: async () => {
        const miss = gymMissing();
        if (G.P().badges.includes("l0")) { await say("LTSSM 마스터! 다음은 2번 마을 Flit 항구다. 시련의 탑 북쪽으로!", "체육관 안내원"); return; }
        if (!miss.length) { await say(["모든 조건 충족! 관장님께 도전할 수 있다.", "관장전은 Recovery·EQ·전체 LTSSM 문제가 나온다. 어려운 문제(★★ 이상)뿐이니 각오해!"], "체육관 안내원"); return; }
        await say(["어이, 도전자! 관장에게 도전하려면 Lv10 + 핵심 배지 5개(Detect·Polling·Configuration·Recovery·L0)가 필요하다.", G.t("지금 부족한 것:\n", "Still missing:\n") + miss.map((m) => "· " + m).join("\n"), "체육관 안의 트레이너들과는 언제든 수련할 수 있다."], "체육관 안내원");
      } },
      trainer("t_g1a", { name: "x16 소년", sight: 3, npc: { x: 2, y: 8, dir: "right", look: LOOK.boy },
        intro: ["Lane이 16개면 뭐든 빠르지! 덤벼!"], team: ["completenaga", "lockgolem"],
        win: "크윽, 네 신호가 더 깨끗했어…", after: "Recovery.RcvrCfg 이후 speed_change나 EQ가 있었다면 폭은 못 바꿔." }),
      trainer("t_g1b", { name: "Flit 소녀", sight: 3, npc: { x: 7, y: 5, dir: "left", look: LOOK.girl },
        intro: ["64 GT/s 이상은 1b/1b PAM4 + Flit! 알고 있니?"], team: ["halfturtle", "eq3crystal"], minD: 2,
        win: "Flit Mode 박사가 되었구나!", after: "128 GT/s도 64 GT/s와 같은 1b/1b + 256B Flit이야." }),
      leader
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
      { x: 6, y: 19, to: "tower_yard", tx: 7, ty: 1, dir: "down" }, { x: 7, y: 19, to: "tower_yard", tx: 8, ty: 1, dir: "down" },
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
    name: "Transaction 시티",
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
      { id: "roadmap", x: 9, y: 11, dir: "down", look: LOOK.guard, talk: async () => { await say(["🗺 앞으로 열릴 마을 (준비 중)", "4) Power & FLIT 마을: ASPM·L1 PM Substates·PAM4·Flit·FEC (PCIe 6/7)\n5) CXL 디바이스 마을: Type 1/2/3, .cache/.mem, HDM-D/DB, 68B vs 256B Flit\n6) Switch·Pooling 마을: MLD, Bundled/Streamlined Port\n7) Fabric·PBR & 보안 마을: PBR, IDE/TSP", "CXL 링크 학습(APN·Modified TS) 자체는 1번 마을 Configuration 협곡에서 이미 배웠다! (CXL/공통)"], "로드맵 안내원"); } },
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
