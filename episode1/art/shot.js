const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: Number(process.argv[4]||1) });
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
  await (await p.$('#s')).screenshot({ path: process.argv[3] }); await b.close(); })();
