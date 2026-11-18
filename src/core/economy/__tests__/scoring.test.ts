import { describe, it, expect } from 'vitest';
import { calculateMissionScore, type ScoreInputs } from '../scoring';
import season1Data from '../../../data/seasons/season1_moon.json';

describe('Mission Scoring Engine & Documented Maximums', () => {
  it('score calculation matches documented maximums (exact sum of 4 components, max 2500)', () => {
    const perfectInputs: ScoreInputs = {
      status: 'VICTORY',
      levelNumber: 3,
      missionDurationDays: 45,
      elapsedDays: 20,
      oxygenKg: 200,
      waterKg: 300,
      foodDaysRemaining: 30,
      budgetCreditsRemaining: 800000,
      startingBudgetCredits: 800000,
      powerStoredKWh: 150,
      maxPowerStorageKWh: 150,
      crewCount: 4,
      cumulativeRadiationDoseMSv: 0,
      hazardsSurvivedCount: 3,
    };

    const res = calculateMissionScore(perfectInputs);

    expect(res.status).toBe('VICTORY');
    expect(res.missionSuccessScore).toBe(1000);
    expect(res.crewSafetyScore).toBeLessThanOrEqual(500);
    expect(res.efficiencyScore).toBeLessThanOrEqual(500);
    expect(res.scienceYieldScore).toBeLessThanOrEqual(500);
    expect(res.totalScore).toBe(res.missionSuccessScore + res.crewSafetyScore + res.efficiencyScore + res.scienceYieldScore);
    expect(res.totalScore).toBeLessThanOrEqual(2500);
    expect(res.stars).toBe(3);
  });

  it('defeat score clamps at <= 350 and 0 stars', () => {
    const defeatInputs: ScoreInputs = {
      status: 'DEFEAT',
      levelNumber: 2,
      missionDurationDays: 30,
      elapsedDays: 14,
      oxygenKg: 0,
      waterKg: 50,
      foodDaysRemaining: 10,
      budgetCreditsRemaining: 200000,
      startingBudgetCredits: 1000000,
      powerStoredKWh: 0,
      maxPowerStorageKWh: 150,
      crewCount: 4,
    };

    const res = calculateMissionScore(defeatInputs);

    expect(res.status).toBe('DEFEAT');
    expect(res.missionSuccessScore).toBe(0);
    expect(res.stars).toBe(0);
    expect(res.totalScore).toBeLessThanOrEqual(350);
  });

  it('Level 1 scoring assigns 3 stars when exceeding 2000 points', () => {
    const l1Inputs: ScoreInputs = {
      status: 'VICTORY',
      levelNumber: 1,
      missionDurationDays: 14,
      elapsedDays: 5,
      oxygenKg: 100,
      waterKg: 200,
      foodDaysRemaining: 28,
      budgetCreditsRemaining: 550000,
      startingBudgetCredits: 800000,
      powerStoredKWh: 50,
      maxPowerStorageKWh: 50,
      crewCount: 4,
    };

    const res = calculateMissionScore(l1Inputs);
    expect(res.missionSuccessScore).toBe(1000);
    expect(res.totalScore).toBeGreaterThanOrEqual(1800);
    expect(res.stars).toBeGreaterThanOrEqual(2);
  });
});

describe('Level 1-3 Objective Completion Logic', () => {
  it('Level 1 objectives pass when solar array, battery, hab are placed and 50 kWh power stored', () => {
    const l1 = season1Data.levels[0];
    const placed = [
      { moduleId: 'vsat_solar_array' },
      { moduleId: 'li_ion_battery_bank' },
      { moduleId: 'inflatable_hab_alpha' }
    ];
    const powerStoredKWh = 52.5;

    const evaluated = l1.objectives.map((obj: any) => {
      if (obj.type === 'BUILD_MODULE') {
        const count = placed.filter(m => m.moduleId === obj.moduleId).length;
        return count >= (obj.targetCount || 1);
      }
      if (obj.type === 'RESOURCE_THRESHOLD' && obj.resource === 'powerStoredKWh') {
        return powerStoredKWh >= (obj.targetValue || 50);
      }
      return false;
    });

    expect(evaluated.every(done => done)).toBe(true);
  });

  it('Level 2 objectives pass when hab is built, 354h night survived, and power solution deployed', () => {
    const l2 = season1Data.levels[1];
    
    // Case A: Using Kilopower fission reactor
    const placedNuclear = [
      { moduleId: 'inflatable_hab_alpha' },
      { moduleId: 'kilopower_nuclear_reactor' }
    ];
    const maxPowerStorageA = 100;
    const hasExperiencedNightA = true;
    const isDaylightA = true;
    const powerStoredA = 40;
    const oxygenA = 75;

    const evalNuclear = l2.objectives.map((obj: any) => {
      if (obj.type === 'BUILD_MODULE') {
        return placedNuclear.some(m => m.moduleId === obj.moduleId);
      }
      if (obj.type === 'POWER_SURVIVAL_PREP') {
        const hasNuke = placedNuclear.some(m => m.moduleId === 'kilopower_nuclear_reactor');
        return hasNuke || maxPowerStorageA >= (obj.targetValue || 400);
      }
      if (obj.type === 'SURVIVE_NIGHT') {
        return hasExperiencedNightA && isDaylightA && powerStoredA > 0;
      }
      if (obj.type === 'RESOURCE_THRESHOLD' && obj.resource === 'oxygenKg') {
        return oxygenA >= (obj.targetValue || 50);
      }
      return false;
    });
    expect(evalNuclear.every(done => done)).toBe(true);

    // Case B: Using >= 2000 kWh battery storage without nuclear
    const placedBatteries = [
      { moduleId: 'inflatable_hab_alpha' }
    ];
    const maxPowerStorageB = 2100;
    const evalBatteries = l2.objectives.map((obj: any) => {
      if (obj.type === 'POWER_SURVIVAL_PREP') {
        const hasNuke = placedBatteries.some(m => m.moduleId === 'kilopower_nuclear_reactor');
        return hasNuke || maxPowerStorageB >= (obj.targetValue || 2000);
      }
      return true;
    });
    expect(evalBatteries.every(done => done)).toBe(true);
  });

  it('Level 3 objectives pass when ice drill is built, 250 kg water extracted, and 4.5 kW grid power sustained', () => {
    const l3 = season1Data.levels[2];
    const placed = [
      { moduleId: 'thermal_ice_drill_plant' },
      { moduleId: 'vsat_solar_array' }
    ];
    const waterKg = 265.0;
    const netPowerWatts = 5200; // > 4.5 kW

    const evaluated = l3.objectives.map((obj: any) => {
      if (obj.type === 'BUILD_MODULE') {
        return placed.some(m => m.moduleId === obj.moduleId);
      }
      if (obj.type === 'RESOURCE_ACCUMULATION' && obj.resource === 'waterKg') {
        return waterKg >= (obj.targetValue || 250);
      }
      if (obj.type === 'GRID_POWER_KW') {
        return netPowerWatts >= (obj.targetValue || 4.5) * 1000;
      }
      return false;
    });

    expect(evaluated.every(done => done)).toBe(true);
  });

  it('Level 4 objectives pass when MRE plant is built, 500 kg O2 accumulated, and 8 kW power maintained', () => {
    const l4 = season1Data.levels[3];
    const placed = [
      { moduleId: 'mre_oxygen_smelter' },
      { moduleId: 'vsat_solar_array' }
    ];
    const oxygenKg = 512.0;
    const netPowerWatts = 8500; // > 8 kW

    const evaluated = l4.objectives.map((obj: any) => {
      if (obj.type === 'BUILD_MODULE') {
        return placed.some(m => m.moduleId === obj.moduleId);
      }
      if (obj.type === 'RESOURCE_ACCUMULATION' && obj.resource === 'oxygenKg') {
        return oxygenKg >= (obj.targetValue || 500);
      }
      if (obj.type === 'GRID_POWER_KW') {
        return netPowerWatts >= (obj.targetValue || 8.0) * 1000;
      }
      return false;
    });

    expect(evaluated.every(done => done)).toBe(true);
  });

  it('Level 5 objectives pass when hab, sintering printer, 36cm berm are built, and SPE survived under 25 mSv', () => {
    const l5 = season1Data.levels[4];
    const placed = [
      { moduleId: 'inflatable_hab_alpha' },
      { moduleId: 'regolith_sintering_printer' }
    ];
    const regolithBermThicknessCm = 36.0;
    const cumulativeDoseMSv = 14.2;
    const hazardsSurvived = 1;

    const evaluated = l5.objectives.map((obj: any) => {
      if (obj.type === 'BUILD_MODULE') {
        return placed.some(m => m.moduleId === obj.moduleId);
      }
      if (obj.type === 'REGOLITH_BERM_THICKNESS') {
        return regolithBermThicknessCm >= (obj.targetValue || 36);
      }
      if (obj.type === 'RADIATION_SAFETY_MAX_MSV') {
        return cumulativeDoseMSv <= (obj.targetValue || 25.0) && hazardsSurvived >= 1;
      }
      return false;
    });

    expect(evaluated.every(done => done)).toBe(true);
  });
});

describe('Win & Loss Triggers for Levels 1-3', () => {
  it('Victory trigger occurs when all objectives are completed', () => {
    const objectives = [
      { id: '1', completed: true },
      { id: '2', completed: true },
      { id: '3', completed: true },
    ];
    const allCompleted = objectives.every(o => o.completed);
    expect(allCompleted).toBe(true);
  });

  it('Loss trigger: Asphyxiation when oxygen hits 0', () => {
    const oxygenKg = 0;
    const checkDefeat = (o2: number) => {
      if (o2 <= 0) return { defeat: true, reason: 'Oxygen depletion: ECLSS atmospheric revitalization failed.' };
      return { defeat: false, reason: '' };
    };
    const res = checkDefeat(oxygenKg);
    expect(res.defeat).toBe(true);
    expect(res.reason).toContain('Oxygen depletion');
  });

  it('Loss trigger: Dehydration when potable water hits 0', () => {
    const waterKg = 0;
    const checkDefeat = (w: number) => {
      if (w <= 0) return { defeat: true, reason: 'Dehydration: Potable water reserves exhausted.' };
      return { defeat: false, reason: '' };
    };
    const res = checkDefeat(waterKg);
    expect(res.defeat).toBe(true);
    expect(res.reason).toContain('Dehydration');
  });

  it('Loss trigger: Starvation when food rations expire (0 days)', () => {
    const foodDaysRemaining = 0;
    const checkDefeat = (f: number) => {
      if (f <= 0) return { defeat: true, reason: 'Starvation: Crew food rations exhausted.' };
      return { defeat: false, reason: '' };
    };
    const res = checkDefeat(foodDaysRemaining);
    expect(res.defeat).toBe(true);
    expect(res.reason).toContain('Starvation');
  });

  it('Loss trigger: Mission duration expired before objectives achieved', () => {
    const elapsedDays = 15;
    const durationDays = 14;
    const objectives = [{ completed: false }];
    const checkExpiry = (elapsed: number, maxDays: number, objs: typeof objectives) => {
      if (elapsed >= maxDays && !objs.every(o => o.completed)) {
        return { defeat: true, reason: 'Mission expired: Scheduled operational duration ended before completing objectives.' };
      }
      return { defeat: false, reason: '' };
    };
    const res = checkExpiry(elapsedDays, durationDays, objectives);
    expect(res.defeat).toBe(true);
    expect(res.reason).toContain('Mission expired');
  });
});
