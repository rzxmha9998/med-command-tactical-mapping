const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\RIZKY R\\.gemini\\antigravity-ide\\brain\\80eeeedd-309e-4821-ad5b-c5ce23d5d088';

async function main() {
  console.log('Launching Edge from:', EDGE_PATH);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const viewports = [
    { name: 'mobile_360x800', width: 360, height: 800 },
    { name: 'mobile_390x844', width: 390, height: 844 },
    { name: 'mobile_430x932', width: 430, height: 932 },
    { name: 'desktop_1280x800', width: 1280, height: 800 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    console.log(`Navigating to http://localhost:3000/ at ${vp.width}x${vp.height}...`);
    await page.goto('http://localhost:3000/?demo=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Wait for Leaflet tiles to load
    await new Promise(r => setTimeout(r, 2000));

    const outPath = path.join(ARTIFACTS_DIR, `${vp.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot: ${outPath}`);

    // If 390x844, also test opening the Unit drawer
    if (vp.name === 'mobile_390x844') {
      try {
        console.log('Attempting to click Unit button to capture drawer open...');
        const unitButton = await page.$('button[aria-label="Menu Unit"]');
        if (unitButton) {
          await unitButton.click();
          await new Promise(r => setTimeout(r, 500));
          const drawerOpenPath = path.join(ARTIFACTS_DIR, 'mobile_390x844_drawer_open.png');
          await page.screenshot({ path: drawerOpenPath });
          console.log(`Saved drawer open screenshot: ${drawerOpenPath}`);
        }
      } catch (e) {
        console.error('Failed to capture drawer open:', e);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
