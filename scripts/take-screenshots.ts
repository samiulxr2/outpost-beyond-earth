import puppeteer from 'puppeteer';
import * as path from 'path';

async function run() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Start Artemis Mission'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const lvlCard = divs.find(d => d.textContent?.includes('Level 1: First Footsteps') && d.className.includes('cursor-pointer'));
    if (lvlCard) lvlCard.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Proceed to Mission Planner'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Properly trigger React input change using prototype setter
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    if (slider) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(slider, '55000');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '06_mission_planner_fail.png') });
  console.log('📸 Updated 06_mission_planner_fail.png with FAIL status!');

  await browser.close();
}

run().catch(console.error);
