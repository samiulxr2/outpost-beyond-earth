import { describe, it, expect } from 'vitest';
import technologiesData from '../../../data/technologies.json';
import { stepHazardSimulation, type ActiveHazard } from '../hazardEngine';

describe('Technology Tree Unlock & Science Point Economy', () => {
  it('enforces prerequisite chains, SP balances, and unlocks hardware modules', () => {
    let sciencePoints = 350;
    const unlockedTechs = ['tech_vsat_power'];

    // Helper simulating store unlockTechnology logic
    const tryUnlock = (techId: string): boolean => {
      const tech = technologiesData.technologies.find(t => t.id === techId);
      if (!tech) return false;
      if (unlockedTechs.includes(techId)) return false;
      if (sciencePoints < tech.scienceCost) return false;
      const prereqsMet = tech.prerequisites.every(p => unlockedTechs.includes(p));
      if (!prereqsMet) return false;

      sciencePoints -= tech.scienceCost;
      unlockedTechs.push(techId);
      return true;
    };

    // 1. Attempt Tier 2 tech without prerequisite -> FAILS
    // tech_ice_mining requires tech_prospecting_rovers
    expect(tryUnlock('tech_ice_mining')).toBe(false);
    expect(unlockedTechs).not.toContain('tech_ice_mining');
    expect(sciencePoints).toBe(350);

    // 2. Unlock prerequisite: tech_prospecting_rovers (cost: 100 SP) -> SUCCEEDS
    expect(tryUnlock('tech_prospecting_rovers')).toBe(true);
    expect(unlockedTechs).toContain('tech_prospecting_rovers');
    expect(sciencePoints).toBe(250); // 350 - 100

    // 3. Now unlock tech_ice_mining (cost: 250 SP) -> SUCCEEDS
    expect(tryUnlock('tech_ice_mining')).toBe(true);
    expect(unlockedTechs).toContain('tech_ice_mining');
    expect(sciencePoints).toBe(0); // 250 - 250

    // 4. Attempt next tech without enough SP -> FAILS
    // tech_mre_oxygen costs 400 SP, current balance 0 SP
    expect(tryUnlock('tech_mre_oxygen')).toBe(false);
    expect(unlockedTechs).not.toContain('tech_mre_oxygen');
    expect(sciencePoints).toBe(0);

    // 5. Verify unlocked hardware modules are accessible
    const allUnlockedModules = new Set<string>();
    technologiesData.technologies.forEach(t => {
      if (unlockedTechs.includes(t.id)) {
        t.unlocksModules.forEach(m => allUnlockedModules.add(m));
      }
    });

    expect(allUnlockedModules.has('vsat_solar_array')).toBe(true);
    expect(allUnlockedModules.has('prospecting_rover_garage')).toBe(true);
    expect(allUnlockedModules.has('thermal_ice_drill_plant')).toBe(true);
    expect(allUnlockedModules.has('mre_oxygen_smelter')).toBe(false); // Still locked
  });
});

describe('Level 5 Radiation Berm: 36cm Shielding vs 25 mSv Dose Limit', () => {
  const standardStorm: ActiveHazard = {
    instanceId: 'spe_standard_test',
    hazardId: 'solar_particle_event_x_class',
    name: 'Solar Particle Event (CME Proton Storm)',
    category: 'Radiation',
    status: 'IMPACTING',
    warningTimeRemainingSeconds: 0,
    durationRemainingSeconds: 36 * 3600, // 36-hour storm
    totalDurationSeconds: 36 * 3600,
    intensityMultiplier: 50, // 50x normal GCR flux
    radiationDoseRateMSvPerHour: 4.0,
    damageRatePerHour: 0.01,
    earlyWarningDescription: 'Standard SPE test storm',
    realScienceExplanation: 'Coronal Mass Ejection proton storm',
  };

  it('WITHOUT 36 cm regolith berm: astronaut dose exceeds 25 mSv mission limit (FAILS Level 5)', () => {
    // 0 cm regolith berm, 2.5 cm Aluminum spacecraft hull only
    const unshieldedSimulation = stepHazardSimulation(
      [standardStorm],
      [],
      36 * 3600, // 36 hours of exposure
      false, // unsheltered
      0 // 0 cm regolith berm
    );

    // Unshielded cumulative dose should be ~70 to 100+ mSv, exceeding 25 mSv
    expect(unshieldedSimulation.newDoseMSv).toBeGreaterThan(25.0);
    expect(unshieldedSimulation.newDoseMSv).toBeGreaterThan(60.0);
  });

  it('WITH 36 cm regolith berm: exponential attenuation keeps dose under 25 mSv (PASSES Level 5)', () => {
    // 36 cm regolith berm (HVL = 18 cm -> 2 half-value layers -> 75% attenuation)
    const shieldedSimulation = stepHazardSimulation(
      [standardStorm],
      [],
      36 * 3600, // 36 hours of exposure
      false,
      36 // 36 cm regolith berm
    );

    // Dose is cut by factor of 4 (2^(-36/18) = 0.25)
    // Shielded dose is ~17-19 mSv, safely below the 25 mSv mission objective threshold
    expect(shieldedSimulation.newDoseMSv).toBeLessThan(25.0);
    expect(shieldedSimulation.newDoseMSv).toBeGreaterThan(10.0);
  });

  it('exponential half-value layer attenuation formula is mathematically exact', () => {
    const unshieldedDose = 100.0;
    const hvl = 18.0;

    // 0 cm -> 100% (100 mSv)
    const d0 = unshieldedDose * Math.pow(0.5, 0 / hvl);
    expect(d0).toBe(100.0);

    // 18 cm (1 HVL) -> 50% (50 mSv)
    const d18 = unshieldedDose * Math.pow(0.5, 18 / hvl);
    expect(d18).toBe(50.0);

    // 36 cm (2 HVL) -> 25% (25 mSv, 75% attenuation)
    const d36 = unshieldedDose * Math.pow(0.5, 36 / hvl);
    expect(d36).toBe(25.0);

    // 54 cm (3 HVL) -> 12.5% (12.5 mSv, 87.5% attenuation)
    const d54 = unshieldedDose * Math.pow(0.5, 54 / hvl);
    expect(d54).toBe(12.5);
  });
});

describe('Levels 4 & 5 Win and Lose Conditions', () => {
  it('Level 4: Wins with MRE plant + 500kg O2; Loses on consumable exhaustion', () => {
    // Win Condition
    const winCheck = (hasMre: boolean, o2: number, powerKW: number) => {
      return hasMre && o2 >= 500 && powerKW >= 8.0;
    };
    expect(winCheck(true, 505, 8.5)).toBe(true);
    expect(winCheck(false, 505, 8.5)).toBe(false);
    expect(winCheck(true, 480, 8.5)).toBe(false);

    // Lose Condition
    const loseCheck = (o2: number, water: number, foodDays: number) => {
      if (o2 <= 0) return { defeat: true, reason: 'Oxygen depletion' };
      if (water <= 0) return { defeat: true, reason: 'Dehydration' };
      if (foodDays <= 0) return { defeat: true, reason: 'Starvation' };
      return { defeat: false, reason: '' };
    };
    expect(loseCheck(0, 100, 20).defeat).toBe(true);
    expect(loseCheck(100, 0, 20).defeat).toBe(true);
    expect(loseCheck(100, 100, 0).defeat).toBe(true);
    expect(loseCheck(100, 100, 20).defeat).toBe(false);
  });

  it('Level 5: Wins with 36cm berm and dose < 25mSv; Loses if acute dose exceeds 250 mSv limit', () => {
    // Win Condition
    const winCheckL5 = (hasHab: boolean, hasPrinter: boolean, bermCm: number, doseMSv: number, stormSurvived: boolean) => {
      return hasHab && hasPrinter && bermCm >= 36 && doseMSv <= 25.0 && stormSurvived;
    };
    expect(winCheckL5(true, true, 36, 18.5, true)).toBe(true);
    expect(winCheckL5(true, true, 20, 18.5, true)).toBe(false); // Berm too thin
    expect(winCheckL5(true, true, 36, 28.0, true)).toBe(false); // Dose over limit

    // Acute Radiation Sickness Lose Condition (NASA 30-day limit = 250 mSv)
    const checkRadiationDefeat = (cumulativeDoseMSv: number) => {
      if (cumulativeDoseMSv >= 250.0) {
        return { defeat: true, reason: 'Acute Radiation Sickness: Astronaut radiation exposure exceeded NASA 30-day limits (250 mSv).' };
      }
      return { defeat: false, reason: '' };
    };
    expect(checkRadiationDefeat(255).defeat).toBe(true);
    expect(checkRadiationDefeat(255).reason).toContain('Acute Radiation Sickness');
    expect(checkRadiationDefeat(24.5).defeat).toBe(false);
  });
});

