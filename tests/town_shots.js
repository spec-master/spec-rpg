// 마을 스크린샷: node tests/town_shots.js <url> <outdir>  (월드맵 · 각 마을 허브 · 마을별 전투)
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const [URL, OUT] = [process.argv[2] || 'http://localhost:8765/', process.argv[3] || 'screenshots'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' });
  await pg.goto(URL + '?t=' + Date.now()); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await sleep(800);
  for (const e of await pg.$$('#clist .opt')) if ((await e.evaluate((x) => x.textContent)) === '새로 시작') { await e.tap(); break; }
  for (let i = 0; i < 14; i++) { await pg.evaluate(() => G.press('A')); await sleep(80); }
  // 진행 상태: 5번 마을까지 정복, 6번 진행 중
  await pg.evaluate(() => { const P = G.P(), L = G.S.LTSSM; P.lv = 42; P.hp = G.maxHP(); P.ltssm = 'L0'; P.badges = ['l0', 'g2', 'g3', 'g4', 'g5'];
    L.STATES.filter((s) => (s.town || 1) <= 5 || s.id === 't6ecam').forEach((s) => { Object.keys(s.rules).forEach((r) => (P.rules[r] = 3)); if (!P.sbadges.includes(s.id)) P.sbadges.push(s.id); }); });
  const shot = async (name) => { await sleep(350); await pg.screenshot({ path: `${OUT}/${name}.png` }); };
  await pg.evaluate(() => G.runScript(() => G.warp('t6', 9, 8, 'down'))); await sleep(700);
  await pg.evaluate(() => G.press('START')); await sleep(400);
  for (const e of await pg.$$('#clist .opt')) if ((await e.evaluate((x) => x.textContent)) === '월드맵') { await e.tap(); break; }
  await shot('worldmap'); await pg.evaluate(() => G.press('B')); await sleep(300); await pg.evaluate(() => G.press('B')); await sleep(300);
  for (let n = 2; n <= 10; n++) {
    await pg.evaluate((n) => G.runScript(() => G.warp('t' + n, 9, 6, 'down')), n); await sleep(800); await shot(`town${n}`);
    const mon = await pg.evaluate((n) => { const fm = G.S.LTSSM.LMON.filter((m) => m.town === n && !m.boss); return fm[(n * 7) % fm.length].id; }, n);
    await pg.evaluate((id) => { G.P().hp = G.maxHP(); G.runScript(() => G.battle({ kind: 'wild', team: [id] })); }, mon);
    for (let i = 0; i < 25; i++) { await sleep(150); if ((await pg.$$eval('#clist .opt', (e) => e.map((x) => x.textContent))).includes('기술')) break; await pg.evaluate(() => G.press('A')); }
    for (const e of await pg.$$('#clist .opt')) if ((await e.evaluate((x) => x.textContent)) === '기술') { await e.tap(); break; }
    await sleep(300); const ms = await pg.$$('#clist .opt'); await ms[ms.length - 1].tap(); await sleep(500);
    await shot(`battle${n}`);
    await pg.evaluate(() => { G.mode = 'field'; }); await pg.reload(); await sleep(800);
    for (const e of await pg.$$('#clist .opt')) if ((await e.evaluate((x) => x.textContent)) === '이어하기') { await e.tap(); break; } await sleep(500);
  }
  await pg.evaluate(() => G.runScript(() => G.warp('t10_gym', 4, 5, 'up'))); await sleep(800); await shot('gym10');
  console.log('errors:', errs.length ? errs : 'none');
  await br.close();
})();
