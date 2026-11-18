import { create } from 'zustand';
import type { 
  ScreenState, 
  TimeScale, 
  PlacedModule, 
  GridTile, 
  MissionObjective, 
  ActiveHazard, 
  MissionReportData, 
  CampaignProgress 
} from '../types/game';
import season1Data from '../data/seasons/season1_moon.json';
import modulesData from '../data/modules.json';
import { stepResourceSimulation, calculateSiteIllumination } from '../core/economy/resourceSimulation';
import { calculateMissionScore } from '../core/economy/scoring';
import { stepHazardSimulation, sampleSolarParticleEvent, sampleMicrometeoriteImpact, calculateRepairCost } from '../core/economy/hazardEngine';
import technologiesData from '../data/technologies.json';

function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem('outpost_campaign_progression');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unlockedLevels: [1], levelHighScores: {}, totalSciencePoints: 0 };
}

function saveCampaignProgress(data: CampaignProgress) {
  try {
    localStorage.setItem('outpost_campaign_progression', JSON.stringify(data));
  } catch {}
}

export interface GameStoreState {
  currentScreen: ScreenState;
  selectedSeasonId: number;
  selectedLevelNumber: number;
  gameTimeScale: TimeScale; // 0=Paused, 1=1m/s, 10=10m/s, 60=1h/s, 1440=1d/s
  previousTimeScale: TimeScale;
  missionElapsedSeconds: number;
  missionElapsedDays: number;

  // Active Level Data
  levelTitle: string;
  landingSiteId: string;
  missionDurationDays: number;
  budgetCredits: number;
  sciencePoints: number;
  objectives: MissionObjective[];
  tutorialStepIndex: number;
  tutorialCompleted: boolean;

  // Resources
  powerStoredKWh: number;
  maxPowerStorageKWh: number;
  netPowerWatts: number;
  powerGeneratedWatts: number;
  powerConsumedWatts: number;
  oxygenKg: number;
  waterKg: number;
  foodDaysRemaining: number;
  regolithOreKg: number;
  propellantKg: number;

  // Rover Sortie State (for Level 2 & 3)
  roverDistanceTraversedMeters: number;
  iceProspectingDetectedPct: number;

  // Base Grid
  gridSize: number;
  gridTiles: GridTile[];
  placedModules: PlacedModule[];
  selectedModuleIdForBuild: string | null;

  // Hazards & Alerts
  activeHazards: ActiveHazard[];
  engineerPanelModuleId: string | null;
  crewSheltered: boolean;
  regolithBermThicknessCm: number;
  cumulativeRadiationDoseMSv: number;
  hourlyDoseRateMSv: number;
  hazardsSurvivedCount: number;
  repairsPerformedCount: number;
  unlockedTechnologies: string[];

  // Campaign Progression & Persistence
  unlockedLevels: number[];
  levelHighScores: Record<number, { score: number; stars: number; scienceEarned: number }>;
  missionReport: MissionReportData | null;
  hasExperiencedNight: boolean;
  consecutiveBlackoutSeconds: number;

  // i18n & Settings
  locale: 'en' | 'bn';
  soundEnabled: boolean;

  // Actions
  setScreen: (screen: ScreenState) => void;
  setTimeScale: (scale: TimeScale) => void;
  togglePause: () => void;
  fastForwardDays: (days: number) => void;
  tickMissionTime: (deltaRealSeconds: number) => void;
  loadLevel: (seasonId: number, levelNumber: number) => void;
  triggerMissionReport: (report: MissionReportData) => void;
  triggerDefeat: (reason: string) => void;
  selectModuleForBuild: (moduleId: string | null) => void;
  placeModuleOnGrid: (moduleId: string, x: number, y: number) => boolean;
  driveRover: (distanceMeters: number, icePct: number) => void;
  setEngineerPanelModuleId: (moduleId: string | null) => void;
  toggleLanguage: () => void;
  toggleSound: () => void;
  nextTutorialStep: () => void;
  checkObjectives: () => void;
  resetGame: () => void;
  toggleCrewShelter: () => void;
  buildRegolithBerm: (additionalCm?: number) => boolean;
  repairModule: (instanceId: string) => boolean;
  unlockTechnology: (techId: string) => boolean;
  triggerSolarParticleEvent: () => void;
  triggerMicrometeoriteImpact: () => void;
}

// Generate base terrain for Shackleton Rim (elevated rim with craters & ice deposits)
function generateInitialGrid(size: number = 16): GridTile[] {
  const tiles: GridTile[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Create elevated ridge along diagonal, crater shadow in lower-left
      const distFromCrater = Math.hypot(x - 3, y - 12);
      const isShadowCrater = distFromCrater < 4;
      const isRimPeak = (x + y >= 12 && x + y <= 18);

      let elevationMeters = 800 + Math.sin(x * 0.4) * 200 + Math.cos(y * 0.5) * 150;
      let illuminationPct = 88;
      let icePct = 1.0;

      if (isShadowCrater) {
        elevationMeters = -400 - (4 - distFromCrater) * 200;
        illuminationPct = 0; // Total cold trap darkness
        icePct = 7.5 + Math.random() * 4.0; // Rich cryogenic ice deposit
      } else if (isRimPeak) {
        elevationMeters = 1450 + Math.random() * 80;
        illuminationPct = 95; // Peak of Eternal Light
        icePct = 0.5;
      }

      tiles.push({
        x,
        y,
        elevationMeters: Math.round(elevationMeters),
        illuminationPct: Math.round(illuminationPct),
        iceWaterContentPct: Math.round(icePct * 10) / 10,
        isObstacle: distFromCrater < 1.5, // Impassable crater floor center
        regolithThicknessCm: Math.round(40 + Math.random() * 25),
      });
    }
  }
  return tiles;
}

const initialProg = loadCampaignProgress();

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentScreen: 'MAIN_MENU',
  selectedSeasonId: 1,
  selectedLevelNumber: 1,
  gameTimeScale: 1, // 1 real second = 1 game minute
  previousTimeScale: 1,
  missionElapsedSeconds: 0,
  missionElapsedDays: 0,

  levelTitle: "Level 1: First Footsteps (Tutorial)",
  landingSiteId: "shackleton_rim",
  missionDurationDays: 14,
  budgetCredits: 800000,
  sciencePoints: initialProg.totalSciencePoints || 0,
  objectives: [],
  tutorialStepIndex: 0,
  tutorialCompleted: false,

  powerStoredKWh: 20,
  maxPowerStorageKWh: 50,
  netPowerWatts: 0,
  powerGeneratedWatts: 0,
  powerConsumedWatts: 0,
  oxygenKg: 100,
  waterKg: 200,
  foodDaysRemaining: 30,
  regolithOreKg: 0,
  propellantKg: 500,

  roverDistanceTraversedMeters: 0,
  iceProspectingDetectedPct: 0,

  gridSize: 16,
  gridTiles: generateInitialGrid(16),
  placedModules: [],
  selectedModuleIdForBuild: null,

  activeHazards: [],
  engineerPanelModuleId: null,
  crewSheltered: false,
  regolithBermThicknessCm: 0,
  cumulativeRadiationDoseMSv: 0,
  hourlyDoseRateMSv: 0.058,
  hazardsSurvivedCount: 0,
  repairsPerformedCount: 0,
  unlockedTechnologies: ['tech_vsat_power'],

  unlockedLevels: initialProg.unlockedLevels || [1],
  levelHighScores: initialProg.levelHighScores || {},
  missionReport: null,
  hasExperiencedNight: false,
  consecutiveBlackoutSeconds: 0,

  locale: 'en',
  soundEnabled: true,

  setScreen: (screen) => set({ currentScreen: screen }),

  setTimeScale: (scale) => set({ gameTimeScale: scale }),

  togglePause: () => {
    const { gameTimeScale, previousTimeScale } = get();
    if (gameTimeScale > 0) {
      set({ gameTimeScale: 0, previousTimeScale: gameTimeScale });
    } else {
      set({ gameTimeScale: previousTimeScale || 1 });
    }
  },

  fastForwardDays: (days: number) => {
    const secondsToAdd = days * 86400;
    const { 
      missionElapsedSeconds, 
      powerStoredKWh, 
      maxPowerStorageKWh, 
      oxygenKg, 
      waterKg, 
      foodDaysRemaining, 
      regolithOreKg, 
      propellantKg, 
      budgetCredits, 
      landingSiteId, 
      placedModules,
      currentScreen 
    } = get();

    const newSeconds = missionElapsedSeconds + secondsToAdd;
    const newDays = Math.floor(newSeconds / 86400);

    if (currentScreen === 'BASE_BUILDER') {
      const sim = stepResourceSimulation(
        {
          missionElapsedSeconds: newSeconds,
          missionElapsedDays: newDays,
          powerStoredKWh,
          maxPowerStorageKWh,
          oxygenKg,
          waterKg,
          foodDaysRemaining,
          regolithOreKg,
          propellantKg,
          budgetCredits,
          landingSiteId,
          crewCount: 4,
        },
        placedModules,
        secondsToAdd
      );

      // Step Environmental Hazards & Radiation Exposure (Phase 5)
      const hazardStep = stepHazardSimulation(
        get().activeHazards,
        sim.updatedModules,
        secondsToAdd,
        get().crewSheltered,
        get().regolithBermThicknessCm
      );
      const newCumulativeDose = get().cumulativeRadiationDoseMSv + hazardStep.newDoseMSv;
      const resolvedCount = get().activeHazards.length - hazardStep.updatedHazards.length;
      const newSurvivedCount = get().hazardsSurvivedCount + (resolvedCount > 0 ? resolvedCount : 0);

      set({
        missionElapsedSeconds: newSeconds,
        missionElapsedDays: newDays,
        powerGeneratedWatts: sim.powerGeneratedWatts,
        powerConsumedWatts: sim.powerConsumedWatts,
        netPowerWatts: sim.netPowerWatts,
        powerStoredKWh: sim.powerStoredKWh,
        maxPowerStorageKWh: sim.maxPowerStorageKWh,
        oxygenKg: sim.oxygenKg,
        waterKg: sim.waterKg,
        foodDaysRemaining: sim.foodDaysRemaining,
        placedModules: hazardStep.updatedModules,
        activeHazards: hazardStep.updatedHazards,
        cumulativeRadiationDoseMSv: newCumulativeDose,
        hourlyDoseRateMSv: hazardStep.hourlyDoseRateMSv,
        hazardsSurvivedCount: newSurvivedCount,
      });

      // Acute radiation sickness defeat check (250 mSv 30-day limit)
      if (newCumulativeDose >= 250) {
        get().triggerDefeat("Acute Radiation Sickness: Astronaut radiation exposure exceeded NASA 30-day limits (250 mSv). Inadequate regolith shielding.");
        return;
      }

      // Check loss conditions during active base operations
      if (sim.oxygenKg <= 0) {
        get().triggerDefeat("Oxygen depletion: ECLSS atmospheric revitalization failed.");
        return;
      }
      if (sim.waterKg <= 0) {
        get().triggerDefeat("Dehydration: Potable water reserves exhausted.");
        return;
      }
      if (sim.foodDaysRemaining <= 0) {
        get().triggerDefeat("Starvation: Crew food rations exhausted.");
        return;
      }
      if (newDays >= get().missionDurationDays && !get().objectives.every(o => o.completed)) {
        get().triggerDefeat("Mission expired: Scheduled operational duration ended before completing objectives.");
        return;
      }
    } else {
      set({
        missionElapsedSeconds: newSeconds,
        missionElapsedDays: newDays,
      });
    }

    get().checkObjectives();
  },

  tickMissionTime: (deltaRealSeconds: number) => {
    const { 
      gameTimeScale, 
      missionElapsedSeconds, 
      powerStoredKWh,
      maxPowerStorageKWh,
      oxygenKg,
      waterKg,
      foodDaysRemaining,
      regolithOreKg,
      propellantKg,
      budgetCredits,
      landingSiteId,
      placedModules,
      currentScreen 
    } = get();

    if (gameTimeScale === 0) return;

    // gameTimeScale: 1 = 60x real time (1s = 1m), 10 = 600x, 60 = 3600x (1s = 1h), 1440 = 86400x (1s = 1d)
    const multiplier = gameTimeScale * 60;
    const elapsedGameSeconds = deltaRealSeconds * multiplier;
    const newSeconds = missionElapsedSeconds + elapsedGameSeconds;
    const newDays = Math.floor(newSeconds / 86400);

    if (currentScreen === 'BASE_BUILDER') {
      const sim = stepResourceSimulation(
        {
          missionElapsedSeconds: newSeconds,
          missionElapsedDays: newDays,
          powerStoredKWh,
          maxPowerStorageKWh,
          oxygenKg,
          waterKg,
          foodDaysRemaining,
          regolithOreKg,
          propellantKg,
          budgetCredits,
          landingSiteId,
          crewCount: 4,
        },
        placedModules,
        elapsedGameSeconds
      );

      // Step Environmental Hazards & Radiation Exposure (Phase 5)
      const hazardStep = stepHazardSimulation(
        get().activeHazards,
        sim.updatedModules,
        elapsedGameSeconds,
        get().crewSheltered,
        get().regolithBermThicknessCm
      );
      const newCumulativeDose = get().cumulativeRadiationDoseMSv + hazardStep.newDoseMSv;
      const resolvedCount = get().activeHazards.length - hazardStep.updatedHazards.length;
      const newSurvivedCount = get().hazardsSurvivedCount + (resolvedCount > 0 ? resolvedCount : 0);

      set({
        missionElapsedSeconds: newSeconds,
        missionElapsedDays: newDays,
        powerGeneratedWatts: sim.powerGeneratedWatts,
        powerConsumedWatts: sim.powerConsumedWatts,
        netPowerWatts: sim.netPowerWatts,
        powerStoredKWh: sim.powerStoredKWh,
        maxPowerStorageKWh: sim.maxPowerStorageKWh,
        oxygenKg: sim.oxygenKg,
        waterKg: sim.waterKg,
        foodDaysRemaining: sim.foodDaysRemaining,
        placedModules: hazardStep.updatedModules,
        activeHazards: hazardStep.updatedHazards,
        cumulativeRadiationDoseMSv: newCumulativeDose,
        hourlyDoseRateMSv: hazardStep.hourlyDoseRateMSv,
        hazardsSurvivedCount: newSurvivedCount,
      });

      // Acute radiation sickness defeat check (250 mSv 30-day limit)
      if (newCumulativeDose >= 250) {
        get().triggerDefeat("Acute Radiation Sickness: Astronaut radiation exposure exceeded NASA 30-day limits (250 mSv). Inadequate regolith shielding.");
        return;
      }

      // Check loss conditions during active base operations
      if (sim.oxygenKg <= 0) {
        get().triggerDefeat("Oxygen depletion: ECLSS atmospheric revitalization failed.");
        return;
      }
      if (sim.waterKg <= 0) {
        get().triggerDefeat("Dehydration: Potable water reserves exhausted.");
        return;
      }
      if (sim.foodDaysRemaining <= 0) {
        get().triggerDefeat("Starvation: Crew food rations exhausted.");
        return;
      }
      if (newDays >= get().missionDurationDays && !get().objectives.every(o => o.completed)) {
        get().triggerDefeat("Mission expired: Scheduled operational duration ended before completing objectives.");
        return;
      }
    } else {
      set({
        missionElapsedSeconds: newSeconds,
        missionElapsedDays: newDays,
      });
    }

    get().checkObjectives();
  },

  loadLevel: (seasonId: number, levelNumber: number) => {
    const season = seasonId === 1 ? season1Data : null;
    if (!season) return;

    const level = season.levels.find(l => l.levelNumber === levelNumber) || season.levels[0];

    const initialTiles = generateInitialGrid(16);

    set({
      selectedSeasonId: seasonId,
      selectedLevelNumber: levelNumber,
      levelTitle: level.title,
      landingSiteId: level.landingSiteId,
      missionDurationDays: level.missionDurationDays,
      budgetCredits: level.startingBudgetCredits,
      sciencePoints: level.startingSciencePoints,
      objectives: (level.objectives || []).map(o => ({ ...o, completed: false })),
      tutorialStepIndex: 0,
      tutorialCompleted: (level.tutorialSteps || []).length === 0,
      missionElapsedSeconds: 0,
      missionElapsedDays: 0,
      placedModules: [],
      gridTiles: initialTiles,
      selectedModuleIdForBuild: null,
      activeHazards: levelNumber === 5 ? [sampleSolarParticleEvent(0)] : [],
      crewSheltered: false,
      regolithBermThicknessCm: 0,
      cumulativeRadiationDoseMSv: 0,
      hourlyDoseRateMSv: 0.058,
      hazardsSurvivedCount: 0,
      repairsPerformedCount: 0,
      roverDistanceTraversedMeters: 0,
      iceProspectingDetectedPct: 0,
      powerStoredKWh: level.startingResources?.powerStoredKWh ?? 20,
      maxPowerStorageKWh: 50,
      oxygenKg: level.startingResources?.oxygenKg ?? 100,
      waterKg: level.startingResources?.waterKg ?? 200,
      foodDaysRemaining: level.startingResources?.foodRationsDays ?? 30,
      regolithOreKg: level.startingResources?.regolithOreKg ?? 0,
      propellantKg: level.startingResources?.propellantKg ?? 500,
      hasExperiencedNight: false,
      consecutiveBlackoutSeconds: 0,
      missionReport: null,
      currentScreen: 'BASE_BUILDER',
    });
  },

  selectModuleForBuild: (moduleId: string | null) => {
    set({ selectedModuleIdForBuild: moduleId });
  },

  placeModuleOnGrid: (moduleId: string, x: number, y: number) => {
    const { gridTiles, placedModules, budgetCredits } = get();
    const tile = gridTiles.find(t => t.x === x && t.y === y);
    if (!tile || tile.isObstacle || tile.occupiedByInstanceId) {
      return false;
    }

    const modDef = modulesData.modules.find(m => m.id === moduleId);
    if (!modDef) return false;

    if (budgetCredits < modDef.costCredits) {
      return false; // Insufficient budget
    }

    const instanceId = `${moduleId}_${Date.now()}`;
    const newPlaced: PlacedModule = {
      instanceId,
      moduleId,
      x,
      y,
      constructedAtMissionDay: get().missionElapsedDays,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
    };

    const updatedTiles = gridTiles.map(t =>
      t.x === x && t.y === y ? { ...t, occupiedByInstanceId: instanceId } : t
    );

    set({
      placedModules: [...placedModules, newPlaced],
      gridTiles: updatedTiles,
      budgetCredits: budgetCredits - modDef.costCredits,
      selectedModuleIdForBuild: null,
    });

    get().checkObjectives();
    return true;
  },

  driveRover: (distanceMeters: number, icePct: number) => {
    const newDist = get().roverDistanceTraversedMeters + distanceMeters;
    const maxIce = Math.max(get().iceProspectingDetectedPct, icePct);
    set({
      roverDistanceTraversedMeters: newDist,
      iceProspectingDetectedPct: maxIce,
    });
    get().checkObjectives();
  },

  setEngineerPanelModuleId: (moduleId: string | null) => {
    set({ engineerPanelModuleId: moduleId });
  },

  toggleLanguage: () => {
    set(state => ({ locale: state.locale === 'en' ? 'bn' : 'en' }));
  },

  toggleSound: () => {
    set(state => ({ soundEnabled: !state.soundEnabled }));
  },

  nextTutorialStep: () => {
    const { tutorialStepIndex } = get();
    set({ tutorialStepIndex: tutorialStepIndex + 1 });
  },

  triggerMissionReport: (report: MissionReportData) => {
    set({
      currentScreen: 'MISSION_REPORT',
      missionReport: report,
    });
  },

  triggerDefeat: (reason: string) => {
    const { 
      selectedLevelNumber, 
      missionDurationDays, 
      missionElapsedDays,
      oxygenKg, 
      waterKg, 
      foodDaysRemaining, 
      budgetCredits, 
      powerStoredKWh, 
      maxPowerStorageKWh 
    } = get();
    const levelData = season1Data.levels.find(l => l.levelNumber === selectedLevelNumber) || season1Data.levels[0];
    const scoreRes = calculateMissionScore({
      status: 'DEFEAT',
      levelNumber: selectedLevelNumber,
      missionDurationDays,
      elapsedDays: missionElapsedDays,
      oxygenKg,
      waterKg,
      foodDaysRemaining,
      budgetCreditsRemaining: budgetCredits,
      startingBudgetCredits: levelData.startingBudgetCredits || 800000,
      powerStoredKWh,
      maxPowerStorageKWh,
      crewCount: 4,
    });

    set({
      currentScreen: 'MISSION_REPORT',
      missionReport: {
        status: 'DEFEAT',
        score: scoreRes.totalScore,
        stars: 0,
        missionSuccessScore: 0,
        crewSafetyScore: scoreRes.crewSafetyScore,
        efficiencyScore: scoreRes.efficiencyScore,
        sciencePointsEarned: scoreRes.sciencePointsEarned,
        realScienceSummary: levelData.realDataReference.explanation,
        sourceCitation: levelData.realDataReference.source,
        defeatReason: reason,
      },
    });
  },

  checkObjectives: () => {
    const { 
      objectives, 
      placedModules, 
      powerStoredKWh, 
      netPowerWatts, 
      roverDistanceTraversedMeters, 
      iceProspectingDetectedPct, 
      waterKg,
      oxygenKg,
      budgetCredits,
      landingSiteId,
      missionElapsedSeconds,
      selectedLevelNumber,
      hasExperiencedNight
    } = get();

    let allCompleted = true;
    const updated = objectives.map(obj => {
      let isDone = obj.completed;
      if (obj.type === 'BUILD_MODULE') {
        const count = placedModules.filter(m => m.moduleId === obj.moduleId).length;
        if (count >= (obj.targetCount || 1)) isDone = true;
      } else if (obj.type === 'RESOURCE_THRESHOLD') {
        if (obj.resource === 'powerStoredKWh' && powerStoredKWh >= (obj.targetValue || 50)) {
          isDone = true;
        } else if (obj.resource === 'oxygenKg' && oxygenKg >= (obj.targetValue || 50)) {
          isDone = true;
        }
      } else if (obj.type === 'SURVIVE_NIGHT') {
        const siteIllum = calculateSiteIllumination(landingSiteId, missionElapsedSeconds);
        if (hasExperiencedNight && siteIllum.isDaylight && powerStoredKWh > 0) {
          isDone = true;
        }
      } else if (obj.type === 'POWER_SURVIVAL_PREP') {
        const hasNuclear = placedModules.some(m => m.moduleId === 'kilopower_nuclear_reactor');
        const hasBatteryCapacity = get().maxPowerStorageKWh >= (obj.targetValue || 400);
        if (hasNuclear || hasBatteryCapacity) {
          isDone = true;
        }
      } else if (obj.type === 'ROVER_DISTANCE_METERS') {
        if (roverDistanceTraversedMeters >= (obj.targetValue || 500)) isDone = true;
      } else if (obj.type === 'ICE_PROSPECTING_PCT') {
        if (iceProspectingDetectedPct >= (obj.targetValue || 5.0)) isDone = true;
      } else if (obj.type === 'RESOURCE_ACCUMULATION') {
        if (obj.resource === 'waterKg' && waterKg >= (obj.targetValue || 250)) isDone = true;
        if (obj.resource === 'oxygenKg' && oxygenKg >= (obj.targetValue || 500)) isDone = true;
      } else if (obj.type === 'GRID_POWER_KW') {
        if (netPowerWatts >= (obj.targetValue || 4.5) * 1000) isDone = true;
      } else if (obj.type === 'REGOLITH_BERM_THICKNESS') {
        if (get().regolithBermThicknessCm >= (obj.targetValue || 36)) isDone = true;
      } else if (obj.type === 'RADIATION_SAFETY_MAX_MSV') {
        if (get().cumulativeRadiationDoseMSv <= (obj.targetValue || 25) && (get().hazardsSurvivedCount >= 1 || get().missionElapsedDays >= 20)) {
          isDone = true;
        }
      }

      if (!isDone) allCompleted = false;
      return { ...obj, completed: isDone };
    });

    set({ objectives: updated });

    if (allCompleted && updated.length > 0 && get().currentScreen === 'BASE_BUILDER') {
      const levelData = season1Data.levels.find(l => l.levelNumber === selectedLevelNumber) || season1Data.levels[0];
      const scoreRes = calculateMissionScore({
        status: 'VICTORY',
        levelNumber: selectedLevelNumber,
        missionDurationDays: get().missionDurationDays,
        elapsedDays: get().missionElapsedDays,
        oxygenKg,
        waterKg,
        foodDaysRemaining: get().foodDaysRemaining,
        budgetCreditsRemaining: budgetCredits,
        startingBudgetCredits: levelData.startingBudgetCredits || 800000,
        powerStoredKWh,
        maxPowerStorageKWh: get().maxPowerStorageKWh,
        crewCount: 4,
        cumulativeRadiationDoseMSv: get().cumulativeRadiationDoseMSv,
        hazardsSurvivedCount: get().hazardsSurvivedCount,
      });

      const currentUnlocked = get().unlockedLevels;
      const nextLvl = selectedLevelNumber + 1;
      const newUnlocked = Array.from(new Set([...currentUnlocked, nextLvl]));
      const updatedScores = {
        ...get().levelHighScores,
        [selectedLevelNumber]: { 
          score: scoreRes.totalScore, 
          stars: scoreRes.stars, 
          scienceEarned: scoreRes.sciencePointsEarned 
        }
      };
      const totalSP = get().sciencePoints + scoreRes.sciencePointsEarned;

      saveCampaignProgress({
        unlockedLevels: newUnlocked,
        levelHighScores: updatedScores,
        totalSciencePoints: totalSP,
      });

      set({
        unlockedLevels: newUnlocked,
        levelHighScores: updatedScores,
        sciencePoints: totalSP,
        currentScreen: 'MISSION_REPORT',
        missionReport: {
          status: 'VICTORY',
          score: scoreRes.totalScore,
          stars: scoreRes.stars,
          missionSuccessScore: scoreRes.missionSuccessScore,
          crewSafetyScore: scoreRes.crewSafetyScore,
          efficiencyScore: scoreRes.efficiencyScore,
          sciencePointsEarned: scoreRes.sciencePointsEarned,
          realScienceSummary: levelData.realDataReference.explanation,
          sourceCitation: levelData.realDataReference.source,
          hazardsSurvivedCount: get().hazardsSurvivedCount,
          peakRadiationDoseRateMSvPerHour: get().hourlyDoseRateMSv,
          cumulativeDoseMSv: get().cumulativeRadiationDoseMSv,
          repairsPerformedCount: get().repairsPerformedCount,
        }
      });
    }
  },

  resetGame: () => {
    try {
      localStorage.removeItem('outpost_base_save');
      localStorage.removeItem('outpost_campaign_progression');
    } catch {
      // Ignore if localStorage unavailable
    }
    const initialTiles = generateInitialGrid(16);
    const l1 = season1Data.levels[0];
    set({
      currentScreen: 'MAIN_MENU',
      selectedSeasonId: 1,
      selectedLevelNumber: 1,
      unlockedLevels: [1],
      levelHighScores: {},
      levelTitle: l1.title,
      landingSiteId: l1.landingSiteId,
      missionDurationDays: l1.missionDurationDays,
      budgetCredits: l1.startingBudgetCredits,
      sciencePoints: 0,
      objectives: (l1.objectives || []).map(o => ({ ...o, completed: false })),
      tutorialStepIndex: 0,
      tutorialCompleted: false,
      missionElapsedSeconds: 0,
      missionElapsedDays: 0,
      placedModules: [],
      gridTiles: initialTiles,
      selectedModuleIdForBuild: null,
      activeHazards: [],
      crewSheltered: false,
      regolithBermThicknessCm: 0,
      cumulativeRadiationDoseMSv: 0,
      hourlyDoseRateMSv: 0.058,
      hazardsSurvivedCount: 0,
      repairsPerformedCount: 0,
      unlockedTechnologies: ['tech_vsat_power'],
      roverDistanceTraversedMeters: 0,
      iceProspectingDetectedPct: 0,
      powerStoredKWh: l1.startingResources?.powerStoredKWh ?? 20,
      maxPowerStorageKWh: 50,
      oxygenKg: l1.startingResources?.oxygenKg ?? 100,
      waterKg: l1.startingResources?.waterKg ?? 200,
      foodDaysRemaining: l1.startingResources?.foodRationsDays ?? 30,
      regolithOreKg: 0,
      propellantKg: 500,
      hasExperiencedNight: false,
      consecutiveBlackoutSeconds: 0,
      missionReport: null,
      engineerPanelModuleId: null,
    });
  },

  toggleCrewShelter: () => {
    set(state => ({ crewSheltered: !state.crewSheltered }));
  },

  buildRegolithBerm: (additionalCm: number = 18) => {
    const { placedModules, regolithOreKg, budgetCredits, regolithBermThicknessCm } = get();
    const hasPrinter = placedModules.some(m => m.moduleId === 'regolith_sintering_printer');
    if (!hasPrinter) return false;
    const regolithCost = additionalCm * 10;
    const creditCost = 25000;
    if (regolithOreKg < regolithCost || budgetCredits < creditCost) return false;

    set({
      regolithBermThicknessCm: regolithBermThicknessCm + additionalCm,
      regolithOreKg: regolithOreKg - regolithCost,
      budgetCredits: budgetCredits - creditCost,
    });
    get().checkObjectives();
    return true;
  },

  repairModule: (instanceId: string) => {
    const { placedModules, budgetCredits, repairsPerformedCount } = get();
    const mod = placedModules.find(m => m.instanceId === instanceId);
    if (!mod || mod.durabilityPct >= 100) return false;
    const def = modulesData.modules.find(m => m.id === mod.moduleId);
    if (!def) return false;
    const cost = calculateRepairCost(def.costCredits, mod.durabilityPct);
    if (budgetCredits < cost) return false;

    const updated = placedModules.map(m =>
      m.instanceId === instanceId ? { ...m, durabilityPct: 100 } : m
    );

    set({
      placedModules: updated,
      budgetCredits: budgetCredits - cost,
      repairsPerformedCount: repairsPerformedCount + 1,
    });
    return true;
  },

  unlockTechnology: (techId: string) => {
    const { sciencePoints, unlockedTechnologies } = get();
    const tech = technologiesData.technologies.find(t => t.id === techId);
    if (!tech) return false;
    if (unlockedTechnologies.includes(techId)) return false;
    if (sciencePoints < tech.scienceCost) return false;
    const prereqsMet = tech.prerequisites.every(p => unlockedTechnologies.includes(p));
    if (!prereqsMet) return false;

    set({
      sciencePoints: sciencePoints - tech.scienceCost,
      unlockedTechnologies: [...unlockedTechnologies, techId],
    });
    return true;
  },

  triggerSolarParticleEvent: () => {
    const spe = sampleSolarParticleEvent(get().missionElapsedDays);
    set(state => ({
      activeHazards: [...state.activeHazards, spe]
    }));
  },

  triggerMicrometeoriteImpact: () => {
    const mm = sampleMicrometeoriteImpact(get().placedModules);
    if (mm) {
      set(state => ({
        activeHazards: [...state.activeHazards, mm]
      }));
    }
  },
}));

if (typeof window !== 'undefined') {
  (window as unknown as { __GAME_STORE__: typeof useGameStore }).__GAME_STORE__ = useGameStore;
}
