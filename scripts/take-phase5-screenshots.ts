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

  console.log('Launching headless browser to capture Phase 5 UI snapshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 17. Main Menu with Reset Game (Fresh Start)
  console.log('1. Capturing Main Menu with Reset Game button...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotsDir, '17_main_menu_fresh_reset.png') });
  console.log('📸 Saved 17_main_menu_fresh_reset.png');

  // 18. Technology Readiness Tree Screen
  console.log('2. Capturing Tech Tree Screen...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        currentScreen: 'TECH_TREE',
        sciencePoints: 450,
        unlockedTechnologies: ['tech_vsat_power', 'tech_surface_habitation'],
      });
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '18_tech_tree_screen.png') });
  console.log('📸 Saved 18_tech_tree_screen.png');

  // 19. Space Weather Early Warning Banner & Radiation Dosimetry HUD
  console.log('3. Capturing Space Weather Early Warning on Base Builder...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.getState().loadLevel(1, 5);
      store.setState({
        currentScreen: 'BASE_BUILDER',
        activeHazards: [
          {
            instanceId: 'spe_demo',
            hazardId: 'solar_particle_event_x_class',
            name: 'Solar Particle Event (CME Proton Storm)',
            category: 'Radiation',
            status: 'WARNING',
            warningTimeRemainingSeconds: 14.5 * 3600,
            durationRemainingSeconds: 36 * 3600,
            totalDurationSeconds: 36 * 3600,
            intensityMultiplier: 65,
            radiationDoseRateMSvPerHour: 4.2,
            damageRatePerHour: 0.015,
            earlyWarningDescription: 'DONKI Alert: SOHO & GOES detected major Coronal Mass Ejection shock front.',
            sourceDonkiEventId: '2024-05-10T06:54:00-SEP-001',
            realScienceExplanation: 'Observed by SOHO: COSTEP 15.8-39.8 MeV.'
          }
        ],
        cumulativeRadiationDoseMSv: 8.4,
        hourlyDoseRateMSv: 0.058,
        crewSheltered: false,
        regolithBermThicknessCm: 18,
      });
      store.getState().checkObjectives();
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '19_space_weather_early_warning.png') });
  console.log('📸 Saved 19_space_weather_early_warning.png');

  // 20. Radiation Bunker Sheltered & Sintered Berm Status
  console.log('4. Capturing Bunker Sheltered State...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        crewSheltered: true,
        regolithBermThicknessCm: 36,
        cumulativeRadiationDoseMSv: 12.1,
      });
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '20_radiation_bunker_sheltered.png') });
  console.log('📸 Saved 20_radiation_bunker_sheltered.png');

  // 21. Level 5 Objectives (The Radiation Berm)
  console.log('5. Capturing Level 5 Objectives HUD...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.getState().loadLevel(1, 5);
      store.setState({
        currentScreen: 'BASE_BUILDER',
        regolithBermThicknessCm: 36,
        cumulativeRadiationDoseMSv: 14.2,
        hazardsSurvivedCount: 1,
      });
      store.getState().checkObjectives();
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '21_level5_radiation_berm_mission.png') });
  console.log('📸 Saved 21_level5_radiation_berm_mission.png');

  // 22. Mission Report with Hazard Survival Telemetry
  console.log('6. Capturing Mission Report with Hazard Survival Telemetry...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        currentScreen: 'MISSION_REPORT',
        missionReport: {
          status: 'VICTORY',
          score: 2420,
          stars: 3,
          missionSuccessScore: 1000,
          crewSafetyScore: 480,
          efficiencyScore: 460,
          sciencePointsEarned: 480,
          realScienceSummary: "Galactic Cosmic Rays (GCR) and episodic Solar Particle Events (SPE) pose severe cancer risks. Lunar regolith provides effective mass shielding with a half-value layer (HVL) of approximately 18 cm.",
          sourceCitation: "NASA Space Radiation Analysis Group (SRAG) & LRO CRaTER Instrument",
          hazardsSurvivedCount: 2,
          peakRadiationDoseRateMSvPerHour: 4.2,
          cumulativeDoseMSv: 14.8,
          repairsPerformedCount: 3,
        }
      });
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '22_mission_report_with_hazards.png') });
  console.log('📸 Saved 22_mission_report_with_hazards.png');

  // 23. Engineer's Panel: Radiation Dosimetry & Regolith HVL Physics
  console.log('7. Capturing Engineer Panel Radiation & HVL Physics...');
  await page.evaluate(() => {
    const store = (window as unknown as { __GAME_STORE__?: StoreType }).__GAME_STORE__;
    if (store) {
      store.setState({
        currentScreen: 'BASE_BUILDER',
        engineerPanelModuleId: 'radiation_protection',
      });
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotsDir, '23_engineers_panel_radiation_hvl.png') });
  console.log('📸 Saved 23_engineers_panel_radiation_hvl.png');

  await browser.close();
  console.log('✅ Phase 5 snapshot capture complete! All 7 snapshots saved to docs/screenshots/.');
}

run().catch(console.error);
