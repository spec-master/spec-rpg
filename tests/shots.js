// 스크린샷: node tests/shots.js <url> <outdir> <prefix>
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const [URL, OUT, PFX] = [process.argv[2] || 'http://localhost:8765/', process.argv[3] || 'screenshots', process.argv[4] || '50'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  for (const [w, h] of [[390, 844], [375, 667]]) {
    const pg = await br.newPage();
    await pg.emulate({ viewport: { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' });
    await pg.goto(URL + '?t=' + Date.now()); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await sleep(700);
    const tapTxt = async (t) => { for (const e of await pg.$$('#clist .opt')) if ((await e.evaluate((x) => x.textContent)) === t) { await e.tap(); return; } throw new Error('no ' + t); };
    await tapTxt('새로 시작'); for (let i = 0; i < 12; i++) { await pg.evaluate(() => G.press('A')); await sleep(80); }
    await pg.evaluate(() => { G.P().lv = 6; G.P().hp = G.maxHP(); G.runScript(() => G.battle({ kind: 'wild', team: ['lockgolem'] })); });
    for (let i = 0; i < 20; i++) { await sleep(150); if (await pg.$$eval('#clist .opt', (e) => e.length)) break; await pg.evaluate(() => G.press('A')); }
    await tapTxt('기술'); await sleep(300);
    const els = await pg.$$('#clist .opt'); await els[0].tap(); await sleep(400);
    await pg.screenshot({ path: `${OUT}/${PFX}_quiz_pinned_${w}x${h}.png` });
    await pg.evaluate(() => { const c = document.getElementById('console'); c.scrollTop = c.scrollHeight; }); await sleep(200);
    await pg.screenshot({ path: `${OUT}/${PFX}_quiz_scrolled_${w}x${h}.png` });
    await pg.close();
  }
  await br.close();
})();
