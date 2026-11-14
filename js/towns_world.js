/* =========================================================
 * 마을 2~10 월드: 맵 · NPC · 트레이너 · 관장 · 최종 보스 · 월드맵
 * 데이터는 js/towns.js(LT.TOWNS). 새 마을은 TOWNS에 추가하면 이 파일이 맵을 자동 생성한다.
 * ========================================================= */
(function () {
  "use strict";
  const G = window.G, S = window.SPEC, LT = S.LTSSM, t = G.t;
  const say = (ko, en, name) => G.say(G.lang === "en" && en ? en : ko, name);
  const LOOKS = [
    { hair: "#202020", shirt: "#305080", pants: "#202840", hat: "#203060" }, { hair: "#a04020", shirt: "#f080b0", pants: "#4050a0" },
    { hair: "#302010", shirt: "#40a0e0", pants: "#305030" }, { hair: "#e8e8e8", shirt: "#a07040", pants: "#504030" },
    { hair: "#f090b0", shirt: "#ffffff", pants: "#f0a0c0" }, { hair: "#5050a0", shirt: "#e0e0f0", pants: "#404060" },
    { hair: "#e0b020", shirt: "#e05030", pants: "#302020" }, { hair: "#40c0c0", shirt: "#3040a0", pants: "#202020" }
  ];
  const NURSE = LOOKS[4], GUARD = LOOKS[0], SAGE = LOOKS[3], SCI = LOOKS[5];
  const leaderLook = (T) => ({ hair: T.color2, shirt: T.color, pants: "#202020", hat: T.color2 });

  function area(w, h, base, border, ops) {
    const g = []; for (let y = 0; y < h; y++) { g.push([]); for (let x = 0; x < w; x++) g[y].push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? border : base); }
    ops.forEach(([c, x0, y0, ww = 1, hh = 1]) => { for (let y = y0; y < y0 + hh; y++) for (let x = x0; x < x0 + ww; x++) if (g[y] && x >= 0 && x < w) g[y][x] = c; });
    return g.map((r) => r.join(""));
  }
  /* 필드 테마: [바닥, 테두리, 조우 타일, 장애물, 장식] */
  const THEME = {
    meadow: [".", "T", ",", "T", "F"], forest: [".", "T", ",", "T", "T"], lake: [".", "T", ",", "~", "F"],
    desert: ["G", "K", "v", "K", "G"], cave: [";", "K", ":", "K", "*"], tower: ["Y", "Q", ":", "Q", "Y"]
  };
  /* 허브 장식 (마을마다 다른 배치) — 경로 x9~10 · y7 · 집 앞은 비움 */
  const HUBDECO = [
    [["~", 13, 9, 4, 3], ["F", 2, 10, 1, 1], ["F", 6, 12, 1, 1], ["T", 1, 12, 2, 1], ["T", 17, 12, 2, 1]],
    [["K", 2, 10, 2, 2], ["K", 15, 10, 3, 1], ["*", 13, 11, 1, 1], ["*", 6, 12, 1, 1], ["F", 17, 9, 1, 1]],
    [["~", 2, 10, 4, 2], ["T", 13, 9, 1, 1], ["T", 16, 9, 1, 1], ["T", 13, 12, 1, 1], ["T", 16, 12, 1, 1], ["F", 14, 10, 2, 2]],
    [["#", 13, 9, 5, 1], ["F", 13, 10, 5, 1], ["#", 2, 11, 5, 1], ["T", 7, 12, 1, 1], ["F", 17, 12, 1, 1]],
    [["*", 3, 10, 1, 1], ["*", 5, 11, 1, 1], ["~", 14, 9, 2, 4], ["K", 17, 10, 1, 2], ["F", 2, 12, 1, 1]]
  ];
  const trainerNPC = (id, o) => ({ id, x: o.x, y: o.y, dir: o.dir, look: o.look, trainer: { sight: o.sight == null ? 3 : o.sight }, talk: async () => {
    if (G.flag("beat_" + id)) { await say(o.after[0], o.after[1], t(o.name[0], o.name[1])); return; }
    if (o.gate) { const miss = o.gate(); if (miss.length) { await say("아직 자격이 부족하다.\n" + miss.map((m) => "· " + m[0]).join("\n"), "Not qualified yet.\n" + miss.map((m) => "· " + m[1]).join("\n"), t(o.name[0], o.name[1])); return; } }
    await say(o.intro[0], o.intro[1], t(o.name[0], o.name[1]));
    const r = await G.battle({ kind: o.boss ? "boss" : "trainer", trainer: o.name, team: o.team, fams: o.fams, minD: o.minD, maxD: o.maxD, xp: o.xp });
    if (r !== "win") return;
    G.setFlag("beat_" + id);
    await say(o.win[0], o.win[1], t(o.name[0], o.name[1]));
    if (o.onWin) await o.onWin();
  } });
  const monsOf = (famId) => LT.LMON.filter((m) => m.fam === famId && !m.boss).map((m) => m.id);
  const table = (fams, w = 3) => [].concat(...fams.map((f) => monsOf(f).map((id) => [id, w])));
  const gymMiss = (T) => { const P = G.P(), miss = []; if (P.lv < T.gymLv) miss.push([`레벨 ${P.lv}/${T.gymLv}`, `Level ${P.lv}/${T.gymLv}`]);
    T.famIds.forEach((f) => { const st = LT.STATES.find((s) => s.id === f); if (!P.sbadges.includes(f)) miss.push([`${st.name} 배지 (규칙 ${G.stateDone(f)}/${G.stateTot(f)})`, `${st.en} badge (rules ${G.stateDone(f)}/${G.stateTot(f)})`]); }); return miss; };
  const prevBadge = (n) => (n === 2 ? "l0" : "g" + (n - 1));

  LT.TOWNS.forEach((T) => {
    const n = T.n, id = "t" + n, F = T.fams, nm = [T.ko, T.en];
    const fam = (i) => F[Math.min(i, F.length - 1)][0];
    const [th1, th2, th3] = T.field.map((k) => THEME[k]);
    const fieldMap = (th, w, h, ops) => area(w, h, th[0], th[1], ops);
    // ----- 진입로 (이전 마을 → 이 마을 남쪽) -----
    const routeTo = n === 2 ? ["tower_yard", 7, 1] : ["t" + (n - 1), 9, 1];
    G.maps[id + "_route"] = { town: n, name: `${T.ko} 가는 길`, en: `Road to ${T.en}`, tint: T.tint,
      tiles: fieldMap(th1, 14, 20, [["=", 6, 0, 2, 20], [th1[2], 1, 2, 5, 5], [th1[2], 8, 5, 5, 5], [th1[2], 1, 11, 5, 5], [th1[2], 8, 13, 5, 4], [th1[3], 1, 8, 3, 2], [th1[3], 10, 2, 3, 2], [th1[4], 4, 17, 1, 1], [th1[4], 11, 11, 1, 1], ["S", 5, 18, 1, 1]]),
      warps: [{ x: 6, y: 19, to: routeTo[0], tx: routeTo[1], ty: routeTo[2], dir: "down" }, { x: 7, y: 19, to: routeTo[0], tx: routeTo[1] + 1, ty: routeTo[2], dir: "down" },
        { x: 6, y: 0, to: id, tx: 9, ty: 12, dir: "up" }, { x: 7, y: 0, to: id, tx: 10, ty: 12, dir: "up" }],
      signs: { "5,18": () => say(`【${T.ko} 가는 길】\n주제: ${T.topic[0]}\n풀숲: ${F[0][1]} · ${F[1][1]}`, `[Road to ${T.en}]\nTopic: ${T.topic[1]}\nGrass: ${F[0][2]} · ${F[1][2]}`) },
      encounter: { rate: 0.14, table: table([fam(0), fam(1)]) },
      npcs: [trainerNPC(`tr${n}_r`, { name: ["수련생 " + F[0][1], F[0][2] + " trainee"], x: 9, y: 9, dir: "left", look: LOOKS[(n + 1) % 8], team: [monsOf(fam(0))[0], monsOf(fam(1))[0]],
        intro: [`${F[0][1]}이라면 자신 있지! 덤벼!`, `I know my ${F[0][2]}! Bring it!`], win: ["크윽… 규칙을 더 외워야겠어.", "Ugh… I need to study the rules more."], after: [F[0][9 - 1] || "", F[0][9] || ""] })]
    };
    // ----- 허브 -----
    const roof = ["U", "O", "R", "P"][n % 4], roof2 = ["P", "R", "U", "O"][(n + 1) % 4], hubTh = THEME[T.field[0]];
    G.maps[id] = { town: n, name: T.ko, en: T.en, tint: T.tint, hub: true,
      tiles: area(20, 14, hubTh[0], hubTh[1], [["=", 9, 0, 2, 14], ["=", 0, 7, 20, 1], [roof2, 2, 2, 5, 2], ["H", 2, 4, 5, 1], ["D", 4, 4, 1, 1], [roof, 13, 2, 5, 2], ["H", 13, 4, 5, 1], ["C", 15, 4, 1, 1],
        ["=", 4, 5, 1, 2], ["S", 7, 5, 1, 1], ["=", 15, 5, 1, 2]].concat(HUBDECO[n % HUBDECO.length])),
      warps: [{ x: 9, y: 13, to: id + "_route", tx: 6, ty: 1, dir: "down" }, { x: 10, y: 13, to: id + "_route", tx: 7, ty: 1, dir: "down" },
        { x: 0, y: 7, to: id + "_f2", tx: 22, ty: 7, dir: "left" }, { x: 19, y: 7, to: id + "_f3", tx: 1, ty: 7, dir: "right" }, { x: 4, y: 4, to: id + "_gym", tx: 4, ty: 10, dir: "up" },
        ...(n < 10 ? [{ x: 9, y: 0, to: "t" + (n + 1) + "_route", tx: 6, ty: 18, dir: "up" }, { x: 10, y: 0, to: "t" + (n + 1) + "_route", tx: 7, ty: 18, dir: "up" }]
          : [{ x: 9, y: 0, to: "champ", tx: 4, ty: 10, dir: "up" }, { x: 10, y: 0, to: "champ", tx: 5, ty: 10, dir: "up" }])],
      triggers: [9, 10].map((x) => ({ x, y: 1, cond: () => !G.P().badges.includes("g" + n), run: async () => {
        await say(`이 앞은 ${T.ko} 관장을 이긴 사람만 지나갈 수 있다.`, `Only those who beat the ${T.en} leader may pass.`, t("경비원", "Guard")); await G.stepBack(); } })),
      signs: { "7,5": () => say(`【${T.ko}】 ${n}번 마을 — ${T.topic[0]}\n서쪽: ${F[2][1]}${F[4] ? " · " + F[4][1] : ""}  ·  동쪽: ${F[3][1]}\n관장: Lv${T.gymLv} + 이 마을 배지 ${F.length}개`,
        `[${T.en}] Town ${n} — ${T.topic[1]}\nWest: ${F[2][2]}${F[4] ? " · " + F[4][2] : ""}  ·  East: ${F[3][2]}\nGym: Lv${T.gymLv} + all ${F.length} badges here`) },
      npcs: [
        { id: id + "_nurse", x: 15, y: 5, dir: "down", look: NURSE, talk: async () => { G.heal(); await say("링크를 점검했어요. HP 전부 회복! 쓰러지면 여기서 깨어나요.", "Link checked. HP fully restored! You'll wake up here if you fall.", t("회복 센터", "Recovery Center")); } },
        { id: id + "_guide", x: 6, y: 9, dir: "down", look: SCI, talk: async () => { await G.say(G.lang === "en" ? T.lines.guideEn : T.lines.guide, t("안내원", "Guide")); await say(hintFor(n)[0], hintFor(n)[1], t("안내원", "Guide")); } },
        { id: id + "_sage", x: 12, y: 9, dir: "left", look: SAGE, talk: async () => { await G.say(G.lang === "en" ? T.lines.sageEn : T.lines.sage, t("PCIe·CXL 비교학자", "PCIe/CXL scholar")); } },
        { id: id + "_guard", x: 11, y: 1, dir: "left", look: GUARD, fixed: true, talk: async () => {
          await say(G.P().badges.includes("g" + n) ? "관장 배지 확인! 지나가도 좋다." : `${T.ko} 관장을 이겨야 북쪽으로 갈 수 있다.`, G.P().badges.includes("g" + n) ? "Gym badge confirmed! You may pass." : `Beat the ${T.en} leader to go north.`, t("경비원", "Guard")); } }
      ]
    };
    // ----- 서쪽 / 동쪽 필드 -----
    G.maps[id + "_f2"] = { town: n, name: `${T.ko} 서쪽 · ${F[2][1]}`, en: `${T.en} West · ${F[2][2]}`, tint: T.tint,
      tiles: fieldMap(th2, 24, 14, [["=", 1, 7, 23, 1], [th2[2], 2, 2, 7, 4], [th2[2], 12, 2, 8, 4], [th2[2], 3, 9, 6, 3], [th2[2], 13, 9, 8, 3], [th2[3], 10, 9, 2, 2], [th2[3], 9, 3, 2, 2], [th2[4], 21, 2, 1, 1], ["S", 21, 6, 1, 1], ["=", 23, 7, 1, 1]]),
      warps: [{ x: 23, y: 7, to: id, tx: 1, ty: 7, dir: "right" }],
      signs: { "21,6": () => say(`【${F[2][1]}${F[4] ? " · " + F[4][1] : ""}】\n${F[2][8]}${F[4] ? "\n" + F[4][8] : ""}`, `[${F[2][2]}${F[4] ? " · " + F[4][2] : ""}]\n${F[2][9]}${F[4] ? "\n" + F[4][9] : ""}`) },
      encounter: { rate: 0.14, table: table(F[4] ? [fam(2), F[4][0]] : [fam(2)]).concat(table([fam(0)], 1)) },
      npcs: [trainerNPC(`tr${n}_w`, { name: [F[2][1] + " 연구원", F[2][2] + " researcher"], x: 6, y: 8, dir: "down", look: LOOKS[(n + 3) % 8], team: monsOf(fam(2)).slice(0, 2).concat(F[4] ? [monsOf(F[4][0])[0]] : []),
        intro: [`${F[2][1]}의 규칙을 시험해 볼까?`, `Shall we test the ${F[2][2]} rules?`], win: ["훌륭해!", "Excellent!"], after: [F[2][8], F[2][9]] })]
    };
    G.maps[id + "_f3"] = { town: n, name: `${T.ko} 동쪽 · ${F[3][1]}`, en: `${T.en} East · ${F[3][2]}`, tint: T.tint,
      tiles: fieldMap(th3, 24, 14, [["=", 0, 7, 23, 1], [th3[2], 3, 2, 8, 4], [th3[2], 14, 1, 7, 5], [th3[2], 2, 9, 7, 3], [th3[2], 12, 9, 9, 3], [th3[3], 11, 2, 2, 2], [th3[3], 9, 10, 2, 2], [th3[4], 2, 2, 1, 1], ["S", 2, 6, 1, 1], ["=", 0, 7, 1, 1]]),
      warps: [{ x: 0, y: 7, to: id, tx: 18, ty: 7, dir: "left" }],
      signs: { "2,6": () => say(`【${F[3][1]}】\n${F[3][8]}`, `[${F[3][2]}]\n${F[3][9]}`) },
      encounter: { rate: 0.14, table: table([fam(3)]).concat(table([fam(1)], 1)) },
      npcs: [trainerNPC(`tr${n}_e`, { name: [F[3][1] + " 엔지니어", F[3][2] + " engineer"], x: 17, y: 8, dir: "down", look: LOOKS[(n + 5) % 8], team: monsOf(fam(3)).slice(0, 3),
        intro: [`${F[3][1]}은(는) CXL의 핵심이지. 승부!`, `${F[3][2]} is core CXL. Battle!`], win: ["졌다… 공부 더 해야지.", "I lost… back to the spec."], after: [F[3][8], F[3][9]] })]
    };
    // ----- 체육관 -----
    const allF = T.famIds;
    G.maps[id + "_gym"] = { town: n, name: `${T.ko} 체육관`, en: `${T.en} Gym`, border: " ",
      tiles: ["WWWWWWWWWW", "WM______MW", "W________W", "W________W", "WM______MW", "W________W", "W________W", "WM______MW", "W________W", "W________W", "W________W", "WWWWXXWWWW"],
      warps: [{ x: 4, y: 11, to: id, tx: 4, ty: 5, dir: "down" }, { x: 5, y: 11, to: id, tx: 4, ty: 5, dir: "down" }],
      npcs: [
        trainerNPC(`tr${n}_g1`, { name: ["체육관 트레이너", "Gym trainer"], x: 2, y: 7, dir: "right", look: LOOKS[(n + 2) % 8], team: [monsOf(fam(0))[1] || monsOf(fam(0))[0], monsOf(fam(2))[1] || monsOf(fam(2))[0]], minD: 2,
          intro: ["관장님께 가려면 나부터!", "Get past me to reach the leader!"], win: ["관장님은 더 세다고!", "The leader is way tougher!"], after: ["관장전은 ★★ 이상 문제만 나온다.", "The leader only asks ★★+ questions."] }),
        trainerNPC(`tr${n}_g2`, { name: ["체육관 트레이너", "Gym trainer"], x: 7, y: 5, dir: "left", look: LOOKS[(n + 6) % 8], team: [monsOf(fam(1))[1] || monsOf(fam(1))[0], monsOf(fam(3))[1] || monsOf(fam(3))[0]], minD: 2,
          intro: ["PCIe와 CXL, 둘 다 알아야 이긴다!", "You need both PCIe and CXL to win!"], win: ["인정!", "Respect!"], after: [T.lines.sage[1], T.lines.sageEn[1]] }),
        trainerNPC(`leader${n}`, { name: T.leader, x: 4, y: 2, dir: "down", look: leaderLook(T), sight: -1, boss: true, team: T.boss, fams: allF, minD: 2, maxD: 3, xp: 90 + 40 * (n - 1),
          gate: () => (G.P().badges.includes("g" + n) ? [] : gymMiss(T)),
          intro: [`나는 ${T.leader[0]}! ${T.topic[0]}의 모든 규칙을 시험하겠다. 3마리 연속 승부!`, `I am ${T.leader[1]}! I'll test every rule of ${T.topic[1]}. Three in a row!`],
          win: ["훌륭하다! 이 배지를 받아라.", "Splendid! Take this badge."], after: [`${n < 10 ? "북쪽 길로 다음 마을에 가라!" : "북쪽 끝, 챔피언의 전당이 너를 기다린다."}`, `${n < 10 ? "Head north to the next town!" : "At the far north, the Champion's Hall awaits."}`],
          onWin: async () => { G.addBadge("g" + n); await LUI.badgePopup(T.badge, t(`${T.badge.name} 획득!`, `${T.badge.en}!`), t(`${n}번 마을 정복`, `Town ${n} cleared`)); G.clearConsole(); G.giveItem("retimer", 1, true); G.P().chapter = Math.max(G.P().chapter || 1, n + 1); await G.checkGrowth(); await G.checkAch(); } })
      ]
    };
  });

  /* ----- 챔피언의 전당 (최종 보스) ----- */
  const CHAMP_LV = 70;
  G.maps.champ = { town: 10, name: "챔피언의 전당", en: "Champion's Hall", border: " ", tint: "rgba(255,215,0,0.08)",
    tiles: ["QQQQQQQQQQ", "QY::YY::YQ", "QYYYYYYYYQ", "QYYYYYYYYQ", "QY::YY::YQ", "QYYYYYYYYQ", "QYYYYYYYYQ", "QYYYYYYYYQ", "QYYYYYYYYQ", "QYYYYYYYYQ", "QYYYYYYYYQ", "QQQQXXQQQQ"],
    warps: [{ x: 4, y: 11, to: "t10", tx: 9, ty: 1, dir: "down" }, { x: 5, y: 11, to: "t10", tx: 10, ty: 1, dir: "down" }],
    npcs: [trainerNPC("champion", { name: ["Spec 챔피언 아크", "Spec Champion Arc"], x: 4, y: 3, dir: "down", look: { hair: "#ffd700", shirt: "#202020", pants: "#ffd700", hat: "#ffd700" }, sight: -1, boss: true,
      team: LT.CHAMP, fams: LT.STATES.filter((s) => s.core).map((s) => s.id), minD: 2, maxD: 3, xp: 600,
      gate: () => { const P = G.P(), m = []; if (P.lv < CHAMP_LV) m.push([`레벨 ${P.lv}/${CHAMP_LV}`, `Level ${P.lv}/${CHAMP_LV}`]); if (!P.badges.includes("g10")) m.push(["Trusted 성채 배지", "Trusted Citadel badge"]); return P.badges.includes("champ") ? [] : m; },
      intro: ["여기까지 온 Link는 처음이군. LTSSM부터 보안까지, PCIe와 CXL 전부를 묻겠다!", "Few Links reach this hall. From LTSSM to security — all of PCIe and CXL!"],
      win: ["…완벽하다. 너야말로 Spec 챔피언이다!", "…Flawless. You are the Spec Champion!"], after: ["언제든 다시 도전해라. 스펙은 계속 개정되니까.", "Come back anytime. The spec keeps getting revised."],
      onWin: async () => { G.addBadge("champ"); await LUI.badgePopup(LT.CHAMP_BADGE, t("Spec 챔피언!", "Spec Champion!"), t("PCIe 7.0 · CXL 4.0 완전 정복", "PCIe 7.0 · CXL 4.0 mastered")); G.clearConsole();
        await say(["🎉 엔딩: 10개 마을의 규칙을 모두 익혔다!", "남은 규칙 배지와 👑 문제 마스터에 도전해 보자. 랭킹에도 점수를 올려 보자!"].join("\n"), ["🎉 Ending: you learned the rules of all 10 towns!", "Go for the remaining rule badges and 👑 question masters, and post your score!"].join("\n")); await G.checkAch(); } })]
  };

  /* ----- 1번 마을과 연결: 시련의 탑 북쪽 → 2번 마을 진입로 (구 DLL 1번 도로 대체) ----- */
  const ty = G.maps.tower_yard;
  if (ty) ty.warps = ty.warps.filter((w) => w.to !== "route1").concat([{ x: 7, y: 0, to: "t2_route", tx: 6, ty: 18, dir: "up" }, { x: 8, y: 0, to: "t2_route", tx: 7, ty: 18, dir: "up" }]);
  ["route1", "gym2", "cxlcity", "school"].forEach((k) => delete G.maps[k]); // 구버전 프로토타입 맵(이주 대상)
  G.mapAlias = (m, P) => (["route1", "gym2", "cxlcity", "school"].includes(m) ? (P.badges.includes("l0") ? ["t2", 9, 8] : ["tower_yard", 7, 2]) : /^t(\d+)/.test(m) ? ["town", 9, 13] : null);
  Object.keys(G.maps).forEach((k) => { if (!G.maps[k].town) G.maps[k].town = 1; });

  /* ----- 쓰러졌을 때 복귀 위치 ----- */
  G.respawn = () => { const n = G.curTown(); return n > 1 && G.maps["t" + n] ? ["t" + n, 15, 6] : ["center", 4, 4]; };

  /* ----- 힌트 ----- */
  function hintFor(n) {
    const T = LT.townDef(n), P = G.P();
    if (!T) return ["", ""];
    const miss = T.famIds.filter((f) => !P.sbadges.includes(f)).map((f) => LT.STATES.find((s) => s.id === f));
    if (P.badges.includes("g" + n)) return n < 10 ? [`${T.ko} 정복! 북쪽 길로 ${LT.townDef(n + 1).ko}에 가자.`, `${T.en} cleared! Head north to ${LT.townDef(n + 1).en}.`] : ["북쪽 챔피언의 전당에 도전하라! (Lv70)", "Challenge the Champion's Hall to the north! (Lv70)"];
    if (miss.length) return [`아직 못 받은 배지: ${miss.map((s) => s.name).join(", ")}. 풀숲에서 몬스터와 싸워 규칙을 익혀라.`, `Badges left: ${miss.map((s) => s.en).join(", ")}. Battle monsters in the grass to learn rules.`];
    if (P.lv < T.gymLv) return [`배지 완료! Lv${T.gymLv}까지 레벨을 올려라 (현재 Lv${P.lv}).`, `Badges done! Reach Lv${T.gymLv} (now Lv${P.lv}).`];
    return [`모든 조건 충족! 서쪽 위 체육관의 ${T.leader[0]}에게 도전하라!`, `All set! Challenge ${T.leader[1]} in the gym (north-west).`];
  }
  const oldHint = G.hint;
  G.hint = () => { const n = G.curTown(); if (n > 1) { const h = hintFor(n); return t(h[0], h[1]); }
    if (G.P().badges.includes("l0")) return t("LTSSM 마스터! 시련의 탑 북쪽 길로 2번 마을 Flit 항구에 가자.", "LTSSM Master! Take the road north of the Tower to Town 2, Flit Harbor.");
    return oldHint ? oldHint() : ""; };

  /* ----- 월드맵 ----- */
  const WPOS = [[30, 160], [80, 172], [130, 150], [110, 108], [60, 92], [40, 50], [95, 30], [150, 52], [200, 34], [250, 58], [280, 18]]; // 1..10 + 챔피언
  function worldImage() {
    const W = 300, H = 190, c = document.createElement("canvas"); c.width = W * 2; c.height = H * 2; const g = c.getContext("2d"); g.scale(2, 2);
    g.fillStyle = "#7cc0e8"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#8bd060"; g.beginPath(); g.ellipse(150, 100, 148, 88, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#6fb048"; [[60, 140, 30], [200, 90, 40], [120, 60, 24], [250, 140, 26]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    const P = G.P(), cur = G.curTown(), champHere = G.P().map === "champ";
    for (let i = 1; i < WPOS.length; i++) { const open = i < 10 ? G.townOpen(i + 1) : P.badges.includes("g10"); g.strokeStyle = open ? "#e8d49a" : "#5a7a50"; g.lineWidth = 4; g.setLineDash(open ? [] : [4, 4]);
      g.beginPath(); g.moveTo(...WPOS[i - 1]); g.lineTo(...WPOS[i]); g.stroke(); }
    g.setLineDash([]);
    WPOS.forEach(([x, y], i) => {
      const n = i + 1, isChamp = n === 11, open = isChamp ? P.badges.includes("g10") : G.townOpen(n), clear = isChamp ? P.badges.includes("champ") : G.townCleared(n);
      g.fillStyle = clear ? "#ffd84a" : open ? "#ffffff" : "#8a948a"; g.strokeStyle = "#203820"; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, isChamp ? 9 : 8, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#203820"; g.font = "bold 9px -apple-system, sans-serif"; g.textAlign = "center"; g.fillText(isChamp ? "★" : String(n), x, y + 3);
      if (open && !clear && !isChamp) { const p = G.townProgress(n); g.strokeStyle = "#2a8a2a"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke(); }
      if ((isChamp && champHere) || (!isChamp && !champHere && n === cur)) { g.fillStyle = "#e03030"; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x - 6, y - 22); g.lineTo(x + 6, y - 22); g.fill(); g.beginPath(); g.arc(x, y - 22, 6, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y - 22, 2.4, 0, 7); g.fill(); }
    });
    return c.toDataURL();
  }
  const HUB = (n) => (n === 1 ? ["town", 9, 8] : ["t" + n, 9, 8]);
  G.worldMap = async function () {
    const P = G.P(), towns = G.TOWNS(), cur = G.curTown();
    const items = [{ sec: true, img: worldImage(), label: t("📍 현재 위치 · 노랑=정복 · 흰색=열림 · 회색=잠김", "📍 you · yellow=cleared · white=open · gray=locked") }];
    towns.forEach((T) => { const open = G.townOpen(T.n), clear = G.townCleared(T.n), p = Math.round(G.townProgress(T.n) * 100);
      items.push({ label: `${T.n}. ${open ? t(T.ko, T.en) : "???"}  ${open ? p + "%" : "🔒"}${clear ? " 🏅" : ""}${T.n === cur ? " 📍" : ""}`, bar: open ? G.townProgress(T.n) : 0, lock: !open, n: T.n,
        desc: open ? `${t(T.ko, T.en)} — ${T.topic ? t(T.topic[0], T.topic[1]) : "LTSSM"}\n${t("규칙 진행", "Rule progress")} ${p}% · ${t("관장", "Gym")} Lv${T.gymLv}${clear ? t(" · 정복 ✓", " · cleared ✓") : ""}\n${T.n !== cur ? t("(A: 이 마을로 빠른 이동)", "(A: fast travel here)") : t("(현재 마을)", "(you are here)")}` : t("이전 마을 관장을 이기면 열린다.", "Opens after beating the previous town's leader.") }); });
    const champOpen = P.badges.includes("g10");
    items.push({ label: `★ ${champOpen ? t("챔피언의 전당", "Champion's Hall") : "???"}${P.badges.includes("champ") ? " 🏆" : champOpen ? "" : " 🔒"}`, lock: !champOpen, champ: true, desc: champOpen ? t("Trusted 성채 북쪽. Lv70 필요. (A: 빠른 이동)", "North of the Trusted Citadel. Needs Lv70. (A: fast travel)") : t("10번 마을 관장을 이기면 열린다.", "Opens after beating the Town 10 leader.") });
    while (true) {
      const k = await G.panel(t("월드맵", "World map"), items, { selectable: true, start: 1 });
      if (k < 0) return;
      const it = items[k];
      if (it.lock) { await G.say(t("아직 잠긴 곳이다.", "That place is still locked.")); continue; }
      if (it.champ) { await G.warp("champ", 4, 10, "up"); return "close"; }
      if (it.n === cur && P.map !== "champ") { await G.say(t("이미 이 마을에 있다.", "You're already here.")); continue; }
      const h = HUB(it.n); await G.warp(h[0], h[1], h[2], "down"); return "close";
    }
  };
})();
