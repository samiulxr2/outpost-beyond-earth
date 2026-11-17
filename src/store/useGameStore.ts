import { create } from 'zustand';
import type { ScreenState, TimeScale, PlacedModule, GridTile, MissionObjective, ActiveHazard } from '../types/game';
import season1Data from '../data/seasons/season1_moon.json';
import modulesData from '../data/modules.json';

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
  selectModuleForBuild: (moduleId: string | null) => void;
  placeModuleOnGrid: (moduleId: string, x: number, y: number) => boolean;
  driveRover: (distanceMeters: number, icePct: number) => void;
  setEngineerPanelModuleId: (moduleId: string | null) => void;
  toggleLanguage: () => void;
  toggleSound: () => void;
  nextTutorialStep: () => void;
  checkObjectives: () => void;
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
  sciencePoints: 0,
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
    const newSeconds = get().missionElapsedSeconds + secondsToAdd;
    set({
      missionElapsedSeconds: newSeconds,
      missionElapsedDays: Math.floor(newSeconds / 86400),
    });
    // Immediately calculate progression and check objectives
    get().checkObjectives();
  },

  tickMissionTime: (deltaRealSeconds: number) => {
    const { gameTimeScale, missionElapsedSeconds } = get();
    if (gameTimeScale === 0) return;

    // gameTimeScale: 1 = 60x real time (1s = 1m), 10 = 600x, 60 = 3600x (1s = 1h), 1440 = 86400x (1s = 1d)
    const multiplier = gameTimeScale * 60;
    const elapsedGameSeconds = deltaRealSeconds * multiplier;
    const newSeconds = missionElapsedSeconds + elapsedGameSeconds;
    const newDays = Math.floor(newSeconds / 86400);

    // Calculate real-time module generation & consumption
    const { placedModules } = get();
    let totalGenWatts = 0;
    let totalConsWatts = 0;
    let storageCap = 50;

    for (const p of placedModules) {
      const modDef = modulesData.modules.find(m => m.id === p.moduleId);
      if (!modDef) continue;
      if (modDef.powerGenerationWatts) totalGenWatts += modDef.powerGenerationWatts;
      if (modDef.powerConsumptionWatts) totalConsWatts += modDef.powerConsumptionWatts;
      if (modDef.storageCapacityKWh) storageCap += modDef.storageCapacityKWh;
    }

    const netWatts = totalGenWatts - totalConsWatts;
    // Energy delta in kWh: Watts * hours / 1000
    const deltaHours = elapsedGameSeconds / 3600;
    const deltaKWh = (netWatts * deltaHours) / 1000;
    const currentStored = get().powerStoredKWh;
    const updatedStored = Math.min(storageCap, Math.max(0, currentStored + deltaKWh));

    set({
      missionElapsedSeconds: newSeconds,
      missionElapsedDays: newDays,
      powerGeneratedWatts: totalGenWatts,
      powerConsumedWatts: totalConsWatts,
      netPowerWatts: netWatts,
      powerStoredKWh: Math.round(updatedStored * 10) / 10,
      maxPowerStorageKWh: storageCap,
    });

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
      activeHazards: [],
      roverDistanceTraversedMeters: 0,
      iceProspectingDetectedPct: 0,
      powerStoredKWh: level.startingResources?.powerStoredKWh ?? 20,
      maxPowerStorageKWh: 50,
      oxygenKg: level.startingResources?.oxygenKg ?? 100,
      waterKg: level.startingResources?.waterKg ?? 200,
      foodDaysRemaining: level.startingResources?.foodRationsDays ?? 30,
      regolithOreKg: level.startingResources?.regolithOreKg ?? 0,
      propellantKg: level.startingResources?.propellantKg ?? 500,
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

  checkObjectives: () => {
    const { objectives, placedModules, powerStoredKWh, netPowerWatts, roverDistanceTraversedMeters, iceProspectingDetectedPct, waterKg } = get();

    let allCompleted = true;
    const updated = objectives.map(obj => {
      let isDone = obj.completed;
      if (obj.type === 'BUILD_MODULE') {
        const count = placedModules.filter(m => m.moduleId === obj.moduleId).length;
        if (count >= (obj.targetCount || 1)) isDone = true;
      } else if (obj.type === 'RESOURCE_THRESHOLD') {
        if (obj.resource === 'powerStoredKWh' && powerStoredKWh >= (obj.targetValue || 50)) {
          isDone = true;
        }
      } else if (obj.type === 'ROVER_DISTANCE_METERS') {
        if (roverDistanceTraversedMeters >= (obj.targetValue || 500)) isDone = true;
      } else if (obj.type === 'ICE_PROSPECTING_PCT') {
        if (iceProspectingDetectedPct >= (obj.targetValue || 5.0)) isDone = true;
      } else if (obj.type === 'RESOURCE_ACCUMULATION') {
        if (obj.resource === 'waterKg' && waterKg >= (obj.targetValue || 250)) isDone = true;
      } else if (obj.type === 'GRID_POWER_KW') {
        if (netPowerWatts >= (obj.targetValue || 4.5) * 1000) isDone = true;
      }

      if (!isDone) allCompleted = false;
      return { ...obj, completed: isDone };
    });

    set({ objectives: updated });

    if (allCompleted && updated.length > 0 && get().currentScreen === 'BASE_BUILDER') {
      // Award science points for level completion
      const currentLevel = get().selectedLevelNumber;
      if (currentLevel <= 3) {
        set({ sciencePoints: get().sciencePoints + 150 });
      }
    }
  },
}));
