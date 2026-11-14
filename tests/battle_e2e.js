/* 헤드리스 E2E: 모든 기술·아이템으로 다수 전투를 돌리며, 매 퀴즈마다 질문 + 보기 4개가 화면에 보이는지,
 * 콘솔 에러가 없는지 확인. 사용: (repo 루트에서) python3 -m http.server 8765 & ; node tests/battle_e2e.js [url]
 * puppeteer 경로는 PUPPETEER 환경변수로 지정 가능. */
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const URL = process.argv[2] || 'http://localhost:8765/';
const SHOTS = process.env.SHOTS; // 스크린샷 저장 폴더(선택)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = process.env.VP ? [process.env.VP.split('x').map(Number)] : [[390, 844], [375, 667]];
const OLD_SAVE = { map: 'route1', x: 5, y: 5, dir: 'up', lv: 4, xp: 3, hp: 40, chapter: 1, ltssm: 'Polling', gen: 1, width: 1, flags: { metProf: true }, items: { fc_credit: 2 },
  learned: { equalization: 1 }, mastery: {}, moves: ['rxdetect', 'ts1', 'width', 'eq', 'bogus_move'], badges: [], seenQ: {}, wins: 3, playMs: 600000 };
const OLD_EMPTY = Object.assign({}, OLD_SAVE, { moves: [] });
const SCEN = {
  fresh: null,
  migrated_v1: OLD_SAVE,
  migrated_v1_nomoves: OLD_EMPTY,
  migrated_v2_proto: Object.assign({}, OLD_SAVE, { ver: 2, map: 'cxlcity', x: 7, y: 7, lv: 14, hp: 100, ltssm: 'L0', badges: ['l0', 'dl'], chapter: 5, sbadges: [], rules: {}, ach: [], met: [] }),
  mid_all_moves: 'ALL',
  towns: 'TOWNS'
};
const townQ = {};
let failures = [], quizCount = 0, battles = 0;
const fail = (m) => { failures.push(m); console.log('  FAIL', m); };

async function run(br, w, h, scen) {
  const pg = await br.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); });
  await pg.emulate({ viewport: { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear());
  const sv = SCEN[scen];
  if (sv && typeof sv === 'object') await pg.evaluate((s) => localStorage.setItem('specrpg_save_v1', JSON.stringify(s)), sv);
  await pg.reload(); await sleep(600);
  const S = () => pg.evaluate(() => {
    const con = document.getElementById('console'), cr = con.getBoundingClientRect(), qt = document.querySelector('#ctext .qtext');
    const qr = qt && qt.getBoundingClientRect();
    return { mode: window.G.mode, quiz: con.classList.contains('quiz'), q: qt ? qt.textContent : '', text: document.getElementById('ctext').innerText,
      qVisible: (() => { const h = document.getElementById('ctext'), hr = h.getBoundingClientRect(); return !!qr && qr.height > 0 && hr.top >= cr.top - 1 && hr.bottom <= cr.bottom + 1 && qr.top >= hr.top - 1 && (qr.bottom <= hr.bottom + 1 || h.scrollHeight > h.clientHeight); })(),
      opts: [...document.querySelectorAll('#clist .opt')].map((e) => ({ t: e.textContent, off: e.classList.contains('off') })),
      battleCls: document.body.classList.contains('battle'), popup: !!document.querySelector('.bpop') };
  });
  const tap = async (i) => { for (let k = 0; k < 3; k++) { try { const els = await pg.$$('#clist .opt'); if (!els[i]) return; await els[i].evaluate((e) => e.scrollIntoView({ block: 'end' })); await sleep(30); await els[i].tap(); return; } catch (e) { if (!/detached|not clickable|Node/.test(e.message)) throw e; await sleep(100); } } };
  // 타이틀
  let s = await S();
  const want = s.opts.findIndex((o) => o.t === (sv && typeof sv === 'object' ? '이어하기' : '새로 시작'));
  if (want < 0) fail(`${scen}@${w}: title option missing`); else await tap(want);
  for (let i = 0; i < 60; i++) { s = await S(); if (s.mode === 'field' && !s.opts.length && /Lv\d/.test(s.text)) break; await pg.evaluate(() => G.press('A')); await sleep(60); }
  if (sv === 'ALL' || scen === 'fresh') { /* fresh도 기술 확인 */ }
  if (sv === 'ALL') await pg.evaluate(() => { const P = G.P(); P.lv = 12; P.hp = G.maxHP(); P.flags.metProf = true; P.moves = G.S.MOVES.map((m) => m.id); P.items = { fc_credit: 50, replay_buf: 30, msix_table: 1, retimer: 1, bar_key: 1 }; });
  if (sv === 'TOWNS') await pg.evaluate(() => { const P = G.P(), L = G.S.LTSSM; P.lv = 70; P.hp = G.maxHP(); P.flags.metProf = true; P.moves = G.S.MOVES.map((m) => m.id);
    P.items = { fc_credit: 50, replay_buf: 30 }; P.badges = ['l0'].concat(L.TOWNS.map((T) => 'g' + T.n)); });
  const info = await pg.evaluate(() => ({ moves: G.P().moves.slice(), map: G.P().map }));
  if (!info.moves.length) fail(`${scen}@${w}: no moves after load`);
  if (scen === 'fresh') { // 레벨 업 = HP 100% 회복 (전투 승리 → 경험치 → 레벨 업 경로 포함)
    await pg.evaluate(() => { const P = G.P(); P.lv = 5; P.xp = 59; P.hp = 1; G.runScript(() => G.battle({ kind: 'wild', team: ['m_p2_1'] })); });
    for (let k = 0; k < 400 && (await pg.evaluate(() => G.mode !== 'field' || G.busy)); k++) { await pg.evaluate(() => { if (G.mode === 'battle' && window.__B !== 1) {} }); await pg.evaluate(() => G.press('A')); await sleep(40); if ((await S()).quiz) { const ans = await pg.evaluate(() => G.lastQ.c[G.lastQ.a]); const o = (await S()).opts.findIndex((x) => x.t.replace(/^▶\s*/, '').trim() === ans.trim()); await tap(Math.max(0, o)); } }
    const lv = await pg.evaluate(() => ({ lv: G.P().lv, hp: G.P().hp, max: G.maxHP() }));
    if (lv.lv < 6) fail(`${scen}@${w}: level-up test did not level (${JSON.stringify(lv)})`); else if (lv.hp !== lv.max) fail(`${scen}@${w}: HP not full after level-up ${lv.hp}/${lv.max}`); else console.log('  level-up heal OK', JSON.stringify(lv));
    await pg.evaluate(() => { const P = G.P(); P.lv = 1; P.xp = 0; P.hp = G.maxHP(); });
  }
  if (scen === 'migrated_v2_proto' && info.map !== 't2') fail(`${scen}@${w}: old prototype map not migrated (${info.map})`);
  console.log(`[${w}x${h}] ${scen}: moves=${info.moves.length} map=${info.map}`);
  if (sv === 'TOWNS') await pg.evaluate(() => { window.__TOWNS = 1; });
  const plan = await pg.evaluate(() => {
    const L = G.S.LTSSM, out = [];
    if (window.__TOWNS) { L.TOWNS.forEach((T) => { const fm = L.LMON.filter((m) => m.town === T.n && !m.boss);
        [0, Math.floor(fm.length / 2), fm.length - 1].forEach((i) => out.push({ kind: 'wild', team: [fm[i].id], map: 't' + T.n + (i ? '_f3' : '_f2'), town: T.n }));
        out.push({ kind: 'boss', trainer: T.leader, team: T.boss, fams: T.famIds, minD: 2, maxD: 3, xp: 90, map: 't' + T.n + '_gym', town: T.n }); });
      out.push({ kind: 'boss', trainer: ['챔피언', 'Champion'], team: L.CHAMP, fams: L.STATES.filter((s) => s.core).map((s) => s.id), minD: 2, maxD: 3, map: 'champ', town: 11 });
      return out; }
    L.LMON.filter((m) => !m.boss && (m.town || 1) === 1).forEach((m) => out.push({ kind: 'wild', team: [m.id] }));
    out.push({ kind: 'boss', trainer: '관장', team: ['kinggolem', 'eqqueen', 'ltssmdrake'], minD: 2, maxD: 3, xp: 90 });
    Object.entries(G.S.MONSTERS).filter(([, m]) => !m.ltssm).slice(0, 6).forEach(([id, m]) => out.push({ kind: 'trainer', trainer: 'T', team: [id], chapters: [m.ch] }));
    out.push({ kind: 'trainer', trainer: 'T', team: ['detectmon'] }); // chapters 없음 → LTSSM 폴백
    return out;
  });
  const N = process.env.MAXB ? +process.env.MAXB : sv === 'ALL' || sv === 'TOWNS' ? plan.length : 6;
  let moveCursor = 0, itemCursor = 0, usedMoves = new Set(), usedItems = new Set();
  for (let bi = 0; bi < N; bi++) {
    const opt = plan[bi % plan.length]; battles++;
    for (let k = 0; k < 80 && (await pg.evaluate(() => G.busy)); k++) { await pg.evaluate(() => G.press('A')); await sleep(80); }
    if (await pg.evaluate(() => G.busy)) fail(`${scen}@${w}: still busy before battle ${opt.team}: ` + JSON.stringify(await pg.evaluate(() => ({ mode: G.mode, t: document.getElementById('ctext').innerText.slice(0, 80), opts: [...document.querySelectorAll('#clist .opt')].map((e) => e.textContent).slice(0, 4), pop: !!document.querySelector('.bpop'), toast: document.querySelectorAll('.toast,.ltoast').length, panel: !document.getElementById('panel').classList.contains('hidden') }))));
    await pg.evaluate((o) => { G.P().hp = G.maxHP(); G.runScript(async () => { if (o.map) await G.warp(o.map, 4, 6, 'up'); window.__qs = []; return G.battle(o); }); }, opt);
    await sleep(500);
    for (let k = 0; k < 40 && (await pg.evaluate(() => G.mode)) !== 'battle'; k++) await sleep(100); // 워프(페이드) 후 전투 시작 대기
    let steps = 0, turns = 0, lastSig = '', same = 0;
    while (steps++ < 2500) {
      s = await S();
      if (s.mode !== 'battle') break;
      const sig = JSON.stringify([s.text, s.opts.map((o) => o.t)]); if (sig === lastSig) same++; else { same = 0; lastSig = sig; }
      if (same > 90) { fail(`${scen}@${w} battle ${opt.team} stuck: ${sig.slice(0, 160)}`); break; }
      if (s.popup) { await sleep(750); await pg.evaluate(() => G.press('A')); await sleep(300); continue; }
      if (s.quiz) {
        quizCount++;
        if (opt.town && opt.town <= 10) { const qt = await pg.evaluate(() => G.lastQ && (G.lastQ.town || 1)); if (qt !== opt.town) fail(`${scen}@${w}: town ${opt.town} battle asked town-${qt} question`); }
        if (opt.town) townQ[opt.town] = (townQ[opt.town] || 0) + 1;
        if (!s.q.trim()) fail(`${scen}@${w}: empty question`);
        if (s.opts.length !== 4) fail(`${scen}@${w}: ${s.opts.length} choices`);
        if (!s.qVisible) fail(`${scen}@${w}: question not visible`);
        const pinned = await pg.evaluate(() => { const c = document.getElementById('console'); c.scrollTop = c.scrollHeight; const q = document.querySelector('#ctext .qtext').getBoundingClientRect(), r = c.getBoundingClientRect(); const h = document.getElementById('ctext'); return q.top >= r.top - 1 && (q.bottom <= r.bottom + 1 || h.scrollHeight > h.clientHeight); });
        if (!pinned) fail(`${scen}@${w}: question scrolled away (not pinned)`);
        const en = s.opts.map((o, i) => (o.off ? -1 : i)).filter((i) => i >= 0);
        let pick = en[Math.floor(Math.random() * en.length)];
        if (opt.kind === 'boss' && Math.random() < 0.8) { const ans = await pg.evaluate(() => G.lastQ && G.lastQ.c[G.lastQ.a]); const k = s.opts.findIndex((o) => ans && o.t.replace(/^▶\s*/, '').trim() === ans.trim()); if (k >= 0 && !s.opts[k].off) pick = k; }
        await tap(pick); await sleep(150);
        // 탭 후 고정 질문이 계속 보이는지 (보기 스크롤 후)
        continue;
      }
      const names = s.opts.map((o) => o.t);
      if (names.includes('기술') && names.includes('가방')) {
        turns++;
        if (turns > 40 && opt.kind === 'wild') { await tap(names.indexOf('도망')); await sleep(200); continue; }
        const useBag = sv === 'ALL' && turns % 4 === 0;
        await tap(names.indexOf(useBag ? '가방' : '기술')); await sleep(200);
        s = await S();
        if (useBag) {
          if (/아이템을/.test(s.text)) { const k = itemCursor++ % s.opts.length; usedItems.add(s.opts[k].t.split(' ×')[0]); await tap(k); }
          else await pg.evaluate(() => G.press('A'));
        } else {
          if (!/기술을/.test(s.text)) { fail(`${scen}@${w}: move menu not shown (${s.text.slice(0, 40)})`); continue; }
          if (!s.opts.length) { fail(`${scen}@${w}: move list EMPTY`); await pg.evaluate(() => G.press('B')); continue; }
          const k = moveCursor++ % s.opts.length; usedMoves.add(s.opts[k].t); await tap(k); await sleep(200);
          const s2 = await S();
          if (s2.mode === 'battle' && !s2.quiz && !s2.popup) fail(`${scen}@${w}: no quiz after move ${s.opts[k].t} → ${s2.text.slice(0, 50)}`);
          else if (s2.quiz && SHOTS && !global.shot) { global.shot = 1; }
        }
        await sleep(100); continue;
      }
      if (s.opts.length) { await tap(0); await sleep(100); continue; } // 기타 선택지
      await pg.evaluate(() => G.press('A')); await sleep(40);
    }
    s = await S();
    if (s.battleCls) fail(`${scen}@${w}: body.battle left on`);
    if (s.mode === 'battle') fail(`${scen}@${w}: battle ${opt.team} did not end (turns ${turns}, steps ${steps}): ${s.text.slice(0, 60)}`);
    for (let i = 0; i < 40 && (await pg.evaluate(() => G.busy)); i++) { await pg.evaluate(() => G.press('A')); await sleep(60); }
  }
  // 저장 코드 왕복
  const rt = await pg.evaluate(async () => { const c = await SaveCode.encode(G.P()); const d = await SaveCode.decode(c); const m = SaveCode.migrate(d, SPEC).P; return SaveCode.validate(m, SPEC); });
  if (rt.length) fail(`${scen}@${w}: savecode validate errors ${rt}`);
  console.log(`   battles ok, moves used: ${[...usedMoves].length}${sv === 'ALL' ? ' items used: ' + [...usedItems].join(',') : ''}`);
  if (sv === 'ALL') { const all = await pg.evaluate(() => G.S.MOVES.length); if (usedMoves.size < all) fail(`${scen}@${w}: only ${usedMoves.size}/${all} moves exercised`); }
  errs.forEach((e) => fail(`${scen}@${w}: ${e}`));
  await pg.close();
}
(async () => {
  const br = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  for (const [w, h] of VIEWPORTS) for (const sc of Object.keys(SCEN).filter((k) => !process.env.ONLY || process.env.ONLY.split(',').includes(k))) { try { await run(br, w, h, sc); } catch (e) { fail(`${sc}@${w}: exception ${e.message}`); } }
  await br.close();
  console.log("quizzes per town", JSON.stringify(townQ));
  console.log(`\nbattles=${battles} quizzes=${quizCount} failures=${failures.length}`);
  process.exit(failures.length ? 1 : 0);
})();
