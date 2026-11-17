import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface StoreType {
  setState: (state: unknown) => void;
  getState: () => Record<string, unknown>;
}

async function run() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching headless browser to capture Phase 4 screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Tutorial Overlay on Level 1
  console.log('1. Navigating to Level 1 with Interactive Tutorial Overlay...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Navigate to Level 1 Base Builder
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.getState().loadLevel(1, 1);
      store.setState({
        currentScreen: 'BASE_BUILDER',
        tutorialStepIndex: 2, // Step 3: Deploying Vertical Solar Array
        tutorialCompleted: false,
      });
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '11_tutorial_overlay.png') });
  console.log('📸 Saved 11_tutorial_overlay.png');

  // 2. Level 1 Objectives HUD (Mid-mission with placed VSAT)
  console.log('2. Capturing Level 1 Objective HUD...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      // Place 1 VSAT and update objective progress
      const vsatMod = {
        instanceId: 'vsat_tut_1',
        moduleId: 'vsat_solar_array',
        x: 8,
        y: 8,
        constructedAtMissionDay: 0,
        durabilityPct: 100,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      };
      store.setState({
        placedModules: [vsatMod],
        powerStoredKWh: 35.0,
      });
      store.getState().checkObjectives();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '12_level1_objectives.png') });
  console.log('📸 Saved 12_level1_objectives.png');

  // 3. Level 2 Objectives HUD (Survive Lunar Night)
  console.log('3. Capturing Level 2 Objective HUD...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.getState().loadLevel(1, 2);
      store.setState({
        currentScreen: 'BASE_BUILDER',
        powerStoredKWh: 80.0,
        oxygenKg: 145.0,
      });
      store.getState().checkObjectives();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '13_level2_objectives.png') });
  console.log('📸 Saved 13_level2_objectives.png');

  // 4. Level 3 Objectives HUD (Mining the Shadows)
  console.log('4. Capturing Level 3 Objective HUD...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.getState().loadLevel(1, 3);
      store.setState({
        currentScreen: 'BASE_BUILDER',
        waterKg: 120.0,
        roverDistanceTraversedMeters: 350,
      });
      store.getState().checkObjectives();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '14_level3_objectives.png') });
  console.log('📸 Saved 14_level3_objectives.png');

  // 5. Win Mission Report
  console.log('5. Capturing Win Mission Report...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        selectedLevelNumber: 1,
        currentScreen: 'MISSION_REPORT',
        missionReport: {
          status: 'VICTORY',
          score: 2450,
          stars: 3,
          missionSuccessScore: 1000,
          crewSafetyScore: 480,
          efficiencyScore: 420,
          sciencePointsEarned: 150,
          realScienceSummary: "Because the Moon's axis is tilted only 1.54°, high crater rims at the South Pole remain illuminated by the Sun for over 90% of the year. Placing tall vertical solar arrays maximizes power without requiring massive multi-ton batteries.",
          sourceCitation: "NASA LRO / LOLA Topography Data (Mazarico et al., 2011)",
        },
      });
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '15_mission_win_report.png') });
  console.log('📸 Saved 15_mission_win_report.png');

  // 6. Lose Mission Report
  console.log('6. Capturing Lose Mission Report...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        selectedLevelNumber: 2,
        currentScreen: 'MISSION_REPORT',
        missionReport: {
          status: 'DEFEAT',
          score: 350,
          stars: 0,
          missionSuccessScore: 0,
          crewSafetyScore: 120,
          efficiencyScore: 180,
          sciencePointsEarned: 25,
          realScienceSummary: "Equatorial and polar shadow dips plunge surface temperatures to 90 Kelvin (-183°C). Without continuous battery or nuclear power, thermal fluid loops freeze solid within 4 to 6 hours, rendering life support irrecoverable.",
          sourceCitation: "NASA Glenn Research Center / Lunar Surface Power Architecture Study",
          defeatReason: "Cryogenic Thermal Collapse: Base battery reserves remained at 0% for over 6 hours of lunar darkness, freezing thermal loops and ECLSS.",
        },
      });
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, '16_mission_lose_report.png') });
  console.log('📸 Saved 16_mission_lose_report.png');

  await browser.close();
  console.log('✅ All Phase 4 screenshots captured successfully!');
}

run().catch(console.error);
