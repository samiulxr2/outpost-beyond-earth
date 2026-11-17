import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching headless browser to capture Phase 3 screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Navigate to Mission Planner & Launch to Landing Site Screen
  console.log('1. Navigating to Landing Site Selection...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Click Start Artemis Mission
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Start Artemis Mission'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Level 1
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const lvlCard = divs.find(d => d.textContent?.includes('Level 1: First Footsteps') && d.className.includes('cursor-pointer'));
    if (lvlCard) lvlCard.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Proceed to Mission Planner
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Proceed to Mission Planner'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click Authorize Launch & Transit
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const launchBtn = buttons.find(b => b.textContent?.includes('Authorize Launch'));
    if (launchBtn) launchBtn.click();
  });
  await new Promise(r => setTimeout(r, 2200)); // Wait for transit burn and transition to Landing Site Selector

  // Screenshot 07: Landing Site Selector
  await page.screenshot({ path: path.join(screenshotsDir, '07_landing_sites.png') });
  console.log('📸 Saved 07_landing_sites.png');

  // 2. Select Shackleton Crater Rim and Touchdown -> BASE BUILDER (Empty Grid)
  console.log('2. Touchdown to Base Builder (Empty Grid)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const touchdownBtn = buttons.find(b => b.textContent?.includes('Initiate Touchdown'));
    if (touchdownBtn) touchdownBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotsDir, '08_base_builder_empty.png') });
  console.log('📸 Saved 08_base_builder_empty.png');

  // 3. Place Modules (VSAT Solar, Battery, Habitat, ECLSS) -> MID-BUILD OUTPOST
  console.log('3. Placing modules for Mid-Build Outpost...');
  await page.evaluate(() => {
    // Open Build Menu
    const buildBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Open Build Catalog'));
    if (buildBtn) buildBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Construct VSAT Solar Array
  await page.evaluate(() => {
    const constructBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Construct');
    if (constructBtns[0]) constructBtns[0].click(); // VSAT Solar Array
  });
  await new Promise(r => setTimeout(r, 400));

  // Click tile (8, 8) to place VSAT
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
  }
  await new Promise(r => setTimeout(r, 600));

  // Open Build Menu again for Battery
  await page.evaluate(() => {
    const buildBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Open Build Catalog'));
    if (buildBtn) buildBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const constructBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Construct');
    if (constructBtns[1]) constructBtns[1].click(); // Li-Ion Battery
  });
  await new Promise(r => setTimeout(r, 400));

  // Click tile (9, 8)
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2 + 35, box.y + box.height / 2 + 18);
    }
  }
  await new Promise(r => setTimeout(r, 600));

  // Open Build Menu for Habitat
  await page.evaluate(() => {
    const buildBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Open Build Catalog'));
    if (buildBtn) buildBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const constructBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Construct');
    if (constructBtns[2]) constructBtns[2].click(); // Inflatable Hab Alpha
  });
  await new Promise(r => setTimeout(r, 400));

  // Click tile (8, 9)
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2 - 35, box.y + box.height / 2 + 18);
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(screenshotsDir, '09_base_builder_mid_build.png') });
  console.log('📸 Saved 09_base_builder_mid_build.png');

  // 4. Simulate Night-Time Power Crisis
  console.log('4. Simulating Night-Time Power Crisis...');
  await page.evaluate(() => {
    // Set mission time to hour 115 (within the 110.4h - 120h shadow dip phase of Shackleton 120h cycle)
    // Placed modules: VSAT (50W cons) + Habitat Alpha (3500W cons) = 3550W net drain.
    // Stored energy = 142.0 kWh -> Reserve time = 142.0 kWh / 3.55 kW = exactly 40.0 hours!
    interface StoreType {
      setState: (state: unknown) => void;
    }
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        missionElapsedSeconds: 115 * 3600, // Shadow dip active
        powerStoredKWh: 34.0, // 34.0 kWh / 0.85 kW net drain = exactly 40.0 hours power reserve!
      });
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotsDir, '10_night_power_crisis.png') });
  console.log('📸 Saved 10_night_power_crisis.png');

  await browser.close();
  console.log('✅ All Phase 3 screenshots captured successfully!');
}

run().catch(console.error);
