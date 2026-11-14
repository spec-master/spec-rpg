// EN 모드 점검: node tests/en_check.js <url> [shotdir]
// 1번 마을 대화·전투(문제/보기/해설)·메뉴 패널에서 화면에 뜬 한글을 모두 수집해 보고한다.
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const [URL, OUT] = [process.argv[2] || 'http://localhost:8765/', process.argv[3] || ''];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HANGUL = /[\uAC00-\uD7A3]/;
// 의도적으로 한글을 남기는 곳: 언어 전환 버튼, 닉네임 허용 문자 안내
const ALLOW = [/한국어로/, /Hangul/, /^수집기 점검$/];
(async () => {
  const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 20000 });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pg.evaluateOnNewDocument(() => { setInterval(() => { if (!window.G || !document.getElementById('cname')) return; const ko = JSON.parse(sessionStorage.getItem('__ko') || '{}'); let ch = false;
    const s = [document.getElementById('cname').textContent, document.getElementById('ctext').textContent, ...[...document.querySelectorAll('#clist .opt, #clist .hdr, #console .desc, #csub, #toasts > *, .bt, .bs')].map((e) => e.textContent)].join('\n');
    s.split('\n').forEach((l) => { l = l.trim(); if (/[\uAC00-\uD7A3]/.test(l) && !ko[l]) { ko[l] = ((window.G.P && G.P() || {}).map || '') + '/' + G.mode; ch = true; } });
    if (ch) sessionStorage.setItem('__ko', JSON.stringify(ko)); }, 40); });
  await pg.goto(URL + '?t=' + Date.now()); await pg.evaluate(() => { localStorage.clear(); sessionStorage.clear(); G.setLang('en'); }); await pg.reload(); await sleep(900); await pg.evaluate(() => sessionStorage.removeItem('__ko'));

  const tapOpt = async (label) => { for (const e of await pg.$$('#clist .opt')) if ((await e.evaluate((x) => x.textContent)).trim() === label) { await e.tap(); return true; } return false; };
  const opts = () => pg.$$eval('#clist .opt', (e) => e.map((x) => x.textContent.trim()));
  const shot = async (n) => { if (OUT) { await sleep(300); await pg.screenshot({ path: `${OUT}/${n}.png` }); } };
  const fails = [];
  const drain = async () => { for (let k = 0; k < 120 && (await pg.evaluate(() => G.busy)); k++) { await pg.evaluate((k) => G.press(k % 10 === 9 ? 'B' : 'A'), k); await sleep(50); } };
  if (!(await tapOpt('New game'))) fails.push('title not English: ' + (await opts()).join('|'));
  await sleep(500);
  for (let i = 0; i < 30; i++) { await pg.evaluate(() => G.press('A')); await sleep(70); }
  // NPC 전원과 대화 (1번 마을 맵들)
  const maps = await pg.evaluate(() => Object.keys(G.maps).filter((k) => G.maps[k].town === 1));
  let npcShot = false;
  for (const mk of maps) {
    const ids = await pg.evaluate((mk) => (G.maps[mk].npcs || []).map((n, i) => i), mk);
    await drain(); await pg.evaluate((mk) => { G.runScript(() => G.warp(mk, 1, 1, 'down')); }, mk); await sleep(500);
    for (const i of ids) { if (process.env.DBG) console.log('npc', mk, i);
      await drain(); await pg.evaluate((mk, i) => { G.P().hp = G.maxHP(); const n = G.maps[mk].npcs[i]; if (typeof n.talk === 'function') G.runScript(() => n.talk(n)); }, mk, i);
      for (let k = 0; k < 40; k++) { await sleep(60); const md = await pg.evaluate(() => G.mode); if (!(await pg.evaluate(() => G.busy))) break;
        if (!npcShot && mk === 'lab' && (await pg.evaluate(() => document.getElementById('cname').textContent)).length) { await sleep(1800); await shot('town1_npc_dialogue_en'); npcShot = true; }
        if (md === 'battle') { await pg.evaluate(() => { G.mode = 'field'; }); await pg.reload(); await sleep(700); await tapOpt('Continue'); await sleep(300); break; }
        await pg.evaluate(() => G.press('A')); }
    }
    for (const s of await pg.evaluate((mk) => Object.keys(G.maps[mk].signs || {}), mk)) { if (process.env.DBG) console.log('sign', mk, s);
      await drain(); await pg.evaluate((mk, s) => { G.runScript(() => G.maps[mk].signs[s]()); }, mk, s);
      for (let k = 0; k < 15; k++) { await sleep(60); if (!(await pg.evaluate(() => G.busy))) break; await pg.evaluate(() => G.press('A')); }
    }
  }
  // 1번 마을 야생 전투: 문제·보기·해설
  await drain(); await pg.evaluate(() => { G.runScript(() => G.warp('det_field', 5, 5, 'down')); }); await sleep(600);
  for (let i = 0; i < 30 && (await pg.evaluate(() => G.mode)) !== 'field'; i++) { await pg.evaluate(() => G.press('A')); await sleep(80); }
  const mon = await pg.evaluate(() => G.S.LTSSM.LMON.find((m) => m.fam === 'det' && !m.boss).id);
  await drain(); await pg.evaluate((id) => { G.P().hp = G.maxHP(); G.runScript(() => G.battle({ kind: 'wild', team: [id] })); }, mon);
  for (let i = 0; i < 30; i++) { await sleep(120); if ((await pg.evaluate(() => G.mode)) === 'battle' && (await opts()).includes('Moves')) break; if (i === 10 && (await pg.evaluate(() => G.mode)) !== 'battle') await pg.evaluate((id) => { G.runScript(() => G.battle({ kind: 'wild', team: [id] })); }, mon); await pg.evaluate(() => G.press('A')); }
  if (!(await tapOpt('Moves'))) fails.push('battle menu not English: ' + (await opts()).join('|'));
  await sleep(300); const ms = await pg.$$('#clist .opt'); if (!ms.length) { console.log('no moves; mode', await pg.evaluate(() => G.mode), await opts()); process.exit(2); } await ms[ms.length - 1].tap(); await sleep(500);
  const qv = await pg.evaluate(() => ({ q: document.getElementById('ctext').textContent, c: [...document.querySelectorAll('#clist .opt')].map((e) => e.textContent) }));
  await shot('town1_battle_en');
  if (HANGUL.test(qv.q) || qv.c.some((c) => HANGUL.test(c)) || qv.c.length !== 4) fails.push('question/choices: ' + JSON.stringify(qv));
  (await pg.$$('#clist .opt'))[0].tap(); await sleep(600);
  const hd = await pg.evaluate(() => document.getElementById('ctext').textContent);
  if (HANGUL.test(hd) || !/Correct|Wrong/.test(hd)) fails.push('result line: ' + hd.slice(0, 200));
  for (let k = 0; k < 10 && !(await pg.evaluate(() => document.getElementById('ctext').textContent.startsWith('📘'))); k++) { await pg.evaluate(() => G.press('A')); await sleep(250); } await sleep(3000);
  const ex = await pg.evaluate(() => document.getElementById('ctext').textContent);
  if (HANGUL.test(ex) || !/^📘 \S/.test(ex)) fails.push('explanation: ' + ex.slice(0, 200));
  await shot('town1_battle_explanation_en');
  // 여러 문제를 연속으로 풀어 본다
  for (let i = 0; i < 60; i++) { await sleep(90); const o = await opts(); if (await pg.evaluate(() => G.mode) !== 'battle') break;
    if (o.includes('Moves')) { await tapOpt('Moves'); await sleep(200); const m2 = await pg.$$('#clist .opt'); await m2[m2.length - 1].tap(); } else if (o.length === 4) { await (await pg.$$('#clist .opt'))[Math.floor(Math.random() * 4)].tap(); } else await pg.evaluate(() => G.press('A')); }
  await pg.evaluate(() => { G.mode = 'field'; }); await pg.reload(); await sleep(700); await tapOpt('Continue'); await sleep(400);
  // 메뉴 패널 (규칙 도감 스크린샷 포함)
  await pg.evaluate(() => { const P = G.P(); P.lv = 12; Object.keys(G.S.LTSSM.RULES).slice(0, 40).forEach((r) => (P.rules[r] = 3)); P.ach = G.S.LTSSM.ACH.slice(0, 5).map((a) => a.id); P.title = G.S.LTSSM.ACH[0].title; });
  const labels = ['Status', 'World map', 'Rule dex', 'Badges', 'Monster dex', 'Achievements', 'Stats', 'Moves', 'Bag', 'Ranking'];
  for (const lb of labels) {
    await drain(); await pg.evaluate(() => G.press('START')); await sleep(350);
    if (!(await tapOpt(lb))) { fails.push('menu item missing: ' + lb + ' in ' + (await opts()).join('|')); await pg.evaluate(() => G.press('B')); continue; }
    await sleep(400);
    if (lb === 'Rule dex') { const o = await pg.$$('#clist .opt'); if (o.length) { await o[0].tap(); await sleep(400); } await shot('rule_dex_en');
      for (let k = 0; k < 6; k++) { await pg.evaluate(() => G.press('DOWN')); await sleep(80); } }
    if (lb === 'Ranking') { await sleep(1500); }
    for (let k = 0; k < 4; k++) { await pg.evaluate(() => G.press('B')); await sleep(150); }
  }
  await pg.evaluate(() => { document.getElementById('ctext').textContent = '수집기 점검'; }); await sleep(200);
  const ko = await pg.evaluate(() => JSON.parse(sessionStorage.getItem('__ko') || '{}'));
  if (!ko['수집기 점검']) fails.push('Hangul collector did not run');
  const left = Object.entries(ko).filter(([l]) => !ALLOW.some((r) => r.test(l)));
  console.log('Hangul lines seen in EN mode:', left.length);
  left.forEach(([l, w]) => console.log('  [' + w + '] ' + l.slice(0, 140)));
  console.log('fails:', fails.length ? fails : 'none');
  console.log('errors:', errs.length ? errs : 'none');
  await br.close();
  process.exit(fails.length || errs.length ? 1 : 0);
})();
