/**
 * Game & Base Building Types for Outpost: Beyond Earth
 */

export type ScreenState = 
  | 'MAIN_MENU'
  | 'SEASON_SELECT'
  | 'MISSION_PLANNER'
  | 'LANDING_SELECTOR'
  | 'BASE_BUILDER'
  | 'MISSION_REPORT'
  | 'TECH_TREE'
  | 'DATA_CREDITS';

export type TimeScale = 0 | 1 | 10 | 60 | 1440; // 0 = Paused, 1 = 1m/s, 10 = 10m/s, 60 = 1h/s, 1440 = 1d/s

export interface PlacedModule {
  instanceId: string;
  moduleId: string;
  x: number; // Grid X
  y: number; // Grid Y
  constructedAtMissionDay: number;
  durabilityPct: number; // 0 - 100
  isActive: boolean;
  isConstructing: boolean;
  constructionProgressPct: number; // 0 - 100
  constructionTimeRemainingHours: number;
  assignedBuilderId?: number;
}

export interface GridTile {
  x: number;
  y: number;
  elevationMeters: number;
  illuminationPct: number; // 0 to 100
  iceWaterContentPct: number; // 0 to 15%
  isObstacle: boolean; // Crater cliff or rock boulder
  regolithThicknessCm: number;
  occupiedByInstanceId?: string;
}

export interface GameResources {
  powerGeneratedWatts: number;
  powerConsumedWatts: number;
  powerStoredKWh: number;
  maxPowerStorageKWh: number;
  oxygenKg: number;
  waterKg: number;
  foodDaysRemaining: number;
  regolithOreKg: number;
  propellantKg: number;
  budgetCredits: number;
  sciencePoints: number;
}

export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  targetCount?: number;
  currentCount?: number;
  targetValue?: number;
  currentValue?: number;
  type: string;
  moduleId?: string;
  resource?: string;
}

export interface ActiveHazard {
  instanceId: string;
  hazardId: string;
  name: string;
  category: 'Radiation' | 'Impact' | 'Mechanical' | 'Thermal' | 'Weather';
  status: 'WARNING' | 'IMPACTING' | 'RESOLVED';
  warningTimeRemainingSeconds: number;
  durationRemainingSeconds: number;
  totalDurationSeconds: number;
  intensityMultiplier: number;
  radiationDoseRateMSvPerHour: number;
  damageRatePerHour: number;
  affectedModuleInstanceId?: string;
  affectedModuleName?: string;
  mitigationActionTaken?: boolean;
  earlyWarningDescription: string;
  sourceDonkiEventId?: string;
  realScienceExplanation: string;
}

export interface BuilderDrone {
  id: number;
  name: string;
  isBusy: boolean;
  assignedInstanceId: string | null;
}

export interface MissionReportData {
  status: 'VICTORY' | 'DEFEAT';
  score: number;
  stars: number;
  missionSuccessScore: number;
  crewSafetyScore: number;
  efficiencyScore: number;
  sciencePointsEarned: number;
  realScienceSummary: string;
  sourceCitation: string;
  defeatReason?: string;
  hazardsSurvivedCount?: number;
  peakRadiationDoseRateMSvPerHour?: number;
  cumulativeDoseMSv?: number;
  repairsPerformedCount?: number;
}

export interface CampaignProgress {
  unlockedLevels: number[];
  levelHighScores: Record<number, { score: number; stars: number; scienceEarned: number }>;
  totalSciencePoints: number;
}

export interface PendingCommand {
  id: string;
  type: 'PLACE_MODULE' | 'DRIVE_ROVER' | 'REPAIR_MODULE' | 'SINTER_BERM';
  description: string;
  queuedAtMissionSeconds: number;
  executeAtMissionSeconds: number;
  delaySeconds: number;
  moduleId?: string;
  x?: number;
  y?: number;
  distanceMeters?: number;
  icePct?: number;
  targetInstanceId?: string;
  bermAdditionalCm?: number;
}
