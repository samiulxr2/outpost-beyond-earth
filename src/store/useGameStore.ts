import { create } from 'zustand';
import type { 
  ScreenState, 
  TimeScale, 
  PlacedModule, 
  GridTile, 
  MissionObjective, 
  ActiveHazard, 
  MissionReportData, 
  CampaignProgress,
  PendingCommand 
} from '../types/game';
import season1Data from '../data/seasons/season1_moon.json';
import season2Data from '../data/seasons/season2_mars.json';
import modulesData from '../data/modules.json';
import { stepResourceSimulation, calculateSiteIllumination } from '../core/economy/resourceSimulation';
import { calculateMissionScore } from '../core/economy/scoring';
import { stepHazardSimulation, sampleSolarParticleEvent, sampleMicrometeoriteImpact, calculateRepairCost } from '../core/economy/hazardEngine';
import { calculateEarthMarsDistanceAndDelay } from '../core/physics/comms';
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
  pendingCommands: PendingCommand[];
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
  startDemoMode: () => void;
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
  pendingCommands: [],
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
      // 1. Process pending comms commands (e.g. Earth-Mars 3-22 min light-time delay)
      let currentPlaced = [...placedModules];
      let currentTiles = [...get().gridTiles];
      let currentRoverDist = get().roverDistanceTraversedMeters;
      let currentIce = get().iceProspectingDetectedPct;
      const remainingPending: PendingCommand[] = [];

      for (const cmd of get().pendingCommands) {
        if (newSeconds >= cmd.executeAtMissionSeconds) {
          if (cmd.type === 'PLACE_MODULE' && cmd.moduleId && cmd.x !== undefined && cmd.y !== undefined) {
            const instanceId = `${cmd.moduleId}_${Date.now()}`;
            currentPlaced.push({
              instanceId,
              moduleId: cmd.moduleId,
              x: cmd.x,
              y: cmd.y,
              constructedAtMissionDay: newDays,
              durabilityPct: 100,
              isActive: true,
              isConstructing: false,
              constructionProgressPct: 100,
              constructionTimeRemainingHours: 0,
            });
            currentTiles = currentTiles.map(t =>
              t.x === cmd.x && t.y === cmd.y ? { ...t, occupiedByInstanceId: instanceId } : t
            );
          } else if (cmd.type === 'DRIVE_ROVER' && cmd.distanceMeters) {
            currentRoverDist += cmd.distanceMeters;
            if (cmd.icePct) currentIce = Math.max(currentIce, cmd.icePct);
          } else if (cmd.type === 'REPAIR_MODULE' && cmd.targetInstanceId) {
            currentPlaced = currentPlaced.map(m =>
              m.instanceId === cmd.targetInstanceId ? { ...m, durabilityPct: 100 } : m
            );
          }
        } else {
          remainingPending.push(cmd);
        }
      }

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
        currentPlaced,
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

      // Level 10 Dynamic Hazard Timeline (Day 30 MM, Day 70 Extreme SPE, Day 120 MM)
      let activeHazardsList = hazardStep.updatedHazards;
      if (get().selectedLevelNumber === 10) {
        const hasSPE = activeHazardsList.some(h => h.category === 'Radiation');
        const hasMM = activeHazardsList.some(h => h.category === 'Impact');
        if (newDays >= 70 && newDays < 75 && !hasSPE) {
          const spe = sampleSolarParticleEvent(newDays);
          activeHazardsList = [...activeHazardsList, spe];
        } else if (((newDays >= 30 && newDays < 33) || (newDays >= 120 && newDays < 123)) && !hasMM) {
          const mm = sampleMicrometeoriteImpact(hazardStep.updatedModules);
          if (mm) activeHazardsList = [...activeHazardsList, mm];
        }
      }

      const siteIllum = calculateSiteIllumination(landingSiteId, newSeconds);
      const newHasExperiencedNight = get().hasExperiencedNight || !siteIllum.isDaylight;

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
        regolithOreKg: sim.regolithOreKg,
        propellantKg: sim.propellantKg,
        placedModules: hazardStep.updatedModules,
        gridTiles: currentTiles,
        roverDistanceTraversedMeters: currentRoverDist,
        iceProspectingDetectedPct: currentIce,
        pendingCommands: remainingPending,
        activeHazards: activeHazardsList,
        cumulativeRadiationDoseMSv: newCumulativeDose,
        hourlyDoseRateMSv: hazardStep.hourlyDoseRateMSv,
        hazardsSurvivedCount: newSurvivedCount,
        hasExperiencedNight: newHasExperiencedNight,
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
      // Evaluate objectives upon current state advancement
      get().checkObjectives();
      if (get().currentScreen === 'MISSION_REPORT') return;

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
      // 1. Process pending comms commands (e.g. Earth-Mars 3-22 min light-time delay)
      let currentPlaced = [...placedModules];
      let currentTiles = [...get().gridTiles];
      let currentRoverDist = get().roverDistanceTraversedMeters;
      let currentIce = get().iceProspectingDetectedPct;
      const remainingPending: PendingCommand[] = [];

      for (const cmd of get().pendingCommands) {
        if (newSeconds >= cmd.executeAtMissionSeconds) {
          if (cmd.type === 'PLACE_MODULE' && cmd.moduleId && cmd.x !== undefined && cmd.y !== undefined) {
            const instanceId = `${cmd.moduleId}_${Date.now()}`;
            currentPlaced.push({
              instanceId,
              moduleId: cmd.moduleId,
              x: cmd.x,
              y: cmd.y,
              constructedAtMissionDay: newDays,
              durabilityPct: 100,
              isActive: true,
              isConstructing: false,
              constructionProgressPct: 100,
              constructionTimeRemainingHours: 0,
            });
            currentTiles = currentTiles.map(t =>
              t.x === cmd.x && t.y === cmd.y ? { ...t, occupiedByInstanceId: instanceId } : t
            );
          } else if (cmd.type === 'DRIVE_ROVER' && cmd.distanceMeters) {
            currentRoverDist += cmd.distanceMeters;
            if (cmd.icePct) currentIce = Math.max(currentIce, cmd.icePct);
          } else if (cmd.type === 'REPAIR_MODULE' && cmd.targetInstanceId) {
            currentPlaced = currentPlaced.map(m =>
              m.instanceId === cmd.targetInstanceId ? { ...m, durabilityPct: 100 } : m
            );
          }
        } else {
          remainingPending.push(cmd);
        }
      }

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
        currentPlaced,
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

      // Level 10 Dynamic Hazard Timeline (Day 30 MM, Day 70 Extreme SPE, Day 120 MM)
      let activeHazardsList = hazardStep.updatedHazards;
      if (get().selectedLevelNumber === 10) {
        const hasSPE = activeHazardsList.some(h => h.category === 'Radiation');
        const hasMM = activeHazardsList.some(h => h.category === 'Impact');
        if (newDays >= 70 && newDays < 75 && !hasSPE) {
          const spe = sampleSolarParticleEvent(newDays);
          activeHazardsList = [...activeHazardsList, spe];
        } else if (((newDays >= 30 && newDays < 33) || (newDays >= 120 && newDays < 123)) && !hasMM) {
          const mm = sampleMicrometeoriteImpact(hazardStep.updatedModules);
          if (mm) activeHazardsList = [...activeHazardsList, mm];
        }
      }

      const siteIllum = calculateSiteIllumination(landingSiteId, newSeconds);
      const newHasExperiencedNight = get().hasExperiencedNight || !siteIllum.isDaylight;

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
        regolithOreKg: sim.regolithOreKg,
        propellantKg: sim.propellantKg,
        placedModules: hazardStep.updatedModules,
        gridTiles: currentTiles,
        roverDistanceTraversedMeters: currentRoverDist,
        iceProspectingDetectedPct: currentIce,
        pendingCommands: remainingPending,
        activeHazards: activeHazardsList,
        cumulativeRadiationDoseMSv: newCumulativeDose,
        hourlyDoseRateMSv: hazardStep.hourlyDoseRateMSv,
        hazardsSurvivedCount: newSurvivedCount,
        hasExperiencedNight: newHasExperiencedNight,
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
      // Evaluate objectives upon current state advancement
      get().checkObjectives();
      if (get().currentScreen === 'MISSION_REPORT') return;

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
  },

  loadLevel: (seasonId: number, levelNumber: number) => {
    const season = seasonId === 1 ? season1Data : (seasonId === 2 ? season2Data : null);
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
      pendingCommands: [],
      selectedModuleIdForBuild: null,
      activeHazards: (levelNumber === 5 || levelNumber === 8) ? [sampleSolarParticleEvent(0)] : [],
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
    const { gridTiles, placedModules, budgetCredits, landingSiteId, selectedSeasonId } = get();
    const tile = gridTiles.find(t => t.x === x && t.y === y);
    if (!tile || tile.isObstacle || tile.occupiedByInstanceId) {
      return false;
    }

    const modDef = modulesData.modules.find(m => m.id === moduleId);
    if (!modDef) return false;

    if (budgetCredits < modDef.costCredits) {
      return false; // Insufficient budget
    }

    const isMars = selectedSeasonId === 2 || landingSiteId.includes('jezero');
    if (isMars) {
      const { oneWayLightTimeSeconds } = calculateEarthMarsDistanceAndDelay(get().missionElapsedDays);
      const cmdId = `cmd_place_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const pendingCmd: PendingCommand = {
        id: cmdId,
        type: 'PLACE_MODULE',
        description: `Deploy ${modDef.name} at (${x}, ${y})`,
        moduleId,
        x,
        y,
        queuedAtMissionSeconds: get().missionElapsedSeconds,
        executeAtMissionSeconds: get().missionElapsedSeconds + oneWayLightTimeSeconds,
        delaySeconds: oneWayLightTimeSeconds,
      };

      const updatedTiles = gridTiles.map(t =>
        t.x === x && t.y === y ? { ...t, occupiedByInstanceId: `reserved_${cmdId}` } : t
      );

      set({
        pendingCommands: [...get().pendingCommands, pendingCmd],
        gridTiles: updatedTiles,
        budgetCredits: budgetCredits - modDef.costCredits,
        selectedModuleIdForBuild: null,
      });
      return true;
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
    const isMars = get().selectedSeasonId === 2 || get().landingSiteId.includes('jezero');
    if (isMars) {
      const { oneWayLightTimeSeconds } = calculateEarthMarsDistanceAndDelay(get().missionElapsedDays);
      const pendingCmd: PendingCommand = {
        id: `cmd_rover_${Date.now()}`,
        type: 'DRIVE_ROVER',
        description: `Rover Sortie: Traverse +${distanceMeters}m`,
        distanceMeters,
        icePct,
        queuedAtMissionSeconds: get().missionElapsedSeconds,
        executeAtMissionSeconds: get().missionElapsedSeconds + oneWayLightTimeSeconds,
        delaySeconds: oneWayLightTimeSeconds,
      };
      set({
        pendingCommands: [...get().pendingCommands, pendingCmd],
      });
      return;
    }

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
        const hasBatteryCapacity = get().maxPowerStorageKWh >= (obj.targetValue || 2000);
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
        if (obj.resource === 'propellantKg' && get().propellantKg >= (obj.targetValue || 5000)) isDone = true;
      } else if (obj.type === 'GRID_POWER_KW') {
        if (netPowerWatts >= (obj.targetValue || 4.5) * 1000) isDone = true;
      } else if (obj.type === 'REGOLITH_BERM_THICKNESS') {
        if (get().regolithBermThicknessCm >= (obj.targetValue || 36)) isDone = true;
      } else if (obj.type === 'RADIATION_SAFETY_MAX_MSV' || obj.type === 'MAX_RADIATION_DOSE') {
        if (get().cumulativeRadiationDoseMSv <= (obj.targetValue || 25) && (get().hazardsSurvivedCount >= 1 || get().missionElapsedDays >= 4)) {
          isDone = true;
        }
      } else if (obj.type === 'FULL_EXPEDITION_SUCCESS') {
        if (get().missionElapsedDays >= (obj.targetValue || 180) && get().powerStoredKWh > 0 && get().oxygenKg > 0) {
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

  startDemoMode: () => {
    const l10 = season1Data.levels.find(l => l.levelNumber === 10) || season1Data.levels[season1Data.levels.length - 1];
    const initialTiles = generateInitialGrid(16);

    const demoPlacedModules: PlacedModule[] = [
      {
        instanceId: 'kilopower_nuclear_reactor_demo_1',
        moduleId: 'kilopower_nuclear_reactor',
        x: 7,
        y: 7,
        constructedAtMissionDay: 1,
        durabilityPct: 98,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'vsat_solar_array_demo_1',
        moduleId: 'vsat_solar_array',
        x: 6,
        y: 6,
        constructedAtMissionDay: 2,
        durabilityPct: 96,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'vsat_solar_array_demo_2',
        moduleId: 'vsat_solar_array',
        x: 6,
        y: 7,
        constructedAtMissionDay: 2,
        durabilityPct: 97,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'inflatable_hab_alpha_demo_1',
        moduleId: 'inflatable_hab_alpha',
        x: 8,
        y: 7,
        constructedAtMissionDay: 3,
        durabilityPct: 95,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'eclss_life_support_demo_1',
        moduleId: 'eclss_life_support',
        x: 8,
        y: 8,
        constructedAtMissionDay: 4,
        durabilityPct: 96,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'thermal_ice_drill_plant_demo_1',
        moduleId: 'thermal_ice_drill_plant',
        x: 5,
        y: 6,
        constructedAtMissionDay: 5,
        durabilityPct: 92,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'mre_oxygen_smelter_demo_1',
        moduleId: 'mre_oxygen_smelter',
        x: 9,
        y: 7,
        constructedAtMissionDay: 6,
        durabilityPct: 94,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'regolith_sintering_printer_demo_1',
        moduleId: 'regolith_sintering_printer',
        x: 7,
        y: 8,
        constructedAtMissionDay: 7,
        durabilityPct: 95,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
      {
        instanceId: 'cryo_propellant_depot_demo_1',
        moduleId: 'cryo_propellant_depot',
        x: 9,
        y: 8,
        constructedAtMissionDay: 8,
        durabilityPct: 99,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0,
      },
    ];

    const updatedTiles = initialTiles.map(tile => {
      const mod = demoPlacedModules.find(m => m.x === tile.x && m.y === tile.y);
      return mod ? { ...tile, occupiedByInstanceId: mod.instanceId } : tile;
    });

    const activeSPE = sampleSolarParticleEvent(30);

    set({
      currentScreen: 'BASE_BUILDER',
      selectedSeasonId: 1,
      selectedLevelNumber: 10,
      levelTitle: l10.title,
      landingSiteId: 'shackleton_rim',
      missionDurationDays: 180,
      missionElapsedDays: 30,
      missionElapsedSeconds: 30 * 86400,
      budgetCredits: 2450000,
      sciencePoints: 1250,
      unlockedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      placedModules: demoPlacedModules,
      gridTiles: updatedTiles,
      regolithBermThicknessCm: 54,
      crewSheltered: true,
      activeHazards: [activeSPE],
      roverDistanceTraversedMeters: 2850,
      iceProspectingDetectedPct: 7.2,
      netPowerWatts: 12500,
      powerStoredKWh: 400,
      maxPowerStorageKWh: 500,
      oxygenKg: 850,
      waterKg: 620,
      foodDaysRemaining: 150,
      propellantKg: 5400,
      hazardsSurvivedCount: 3,
      cumulativeRadiationDoseMSv: 14.2,
      hourlyDoseRateMSv: 0.12,
      tutorialCompleted: true,
      objectives: (l10.objectives || []).map(o => ({ ...o, completed: true })),
    });
  },
}));

if (typeof window !== 'undefined') {
  (window as unknown as { __GAME_STORE__: typeof useGameStore }).__GAME_STORE__ = useGameStore;
}
