import { describe, it, expect } from 'vitest';
import { 
  sampleSolarParticleEvent, 
  sampleMicrometeoriteImpact, 
  stepHazardSimulation, 
  calculateRepairCost,
  type ActiveHazard 
} from '../hazardEngine';
import type { PlacedModule } from '../../../types/game';

describe('Hazard Engine & Space Weather Mechanics', () => {
  it('samples real Solar Particle Event with early warning and DONKI event ID', () => {
    const spe = sampleSolarParticleEvent(5);
    expect(spe.hazardId).toBe('solar_particle_event_x_class');
    expect(spe.category).toBe('Radiation');
    expect(spe.status).toBe('WARNING');
    expect(spe.warningTimeRemainingSeconds).toBeGreaterThan(0);
    expect(spe.durationRemainingSeconds).toBeGreaterThan(0);
    expect(spe.intensityMultiplier).toBeGreaterThan(10);
    expect(spe.sourceDonkiEventId).toBeDefined();
    expect(spe.earlyWarningDescription).toContain('DONKI Alert');
  });

  it('micrometeorite strike has zero warning time and targets an active module', () => {
    const testModules: PlacedModule[] = [
      {
        instanceId: 'mod_1',
        moduleId: 'vsat_solar_array',
        x: 5,
        y: 5,
        constructedAtMissionDay: 1,
        durabilityPct: 100,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0
      }
    ];

    const mm = sampleMicrometeoriteImpact(testModules);
    expect(mm).not.toBeNull();
    if (mm) {
      expect(mm.warningTimeRemainingSeconds).toBe(0);
      expect(mm.status).toBe('IMPACTING');
      expect(mm.affectedModuleInstanceId).toBe('mod_1');
      expect(mm.damageRatePerHour).toBeGreaterThan(0);
    }
  });

  it('steps hazard through WARNING -> IMPACTING -> RESOLVED lifecycle', () => {
    const hazard: ActiveHazard = {
      instanceId: 'test_h1',
      hazardId: 'solar_particle_event_x_class',
      name: 'SPE Storm',
      category: 'Radiation',
      status: 'WARNING',
      warningTimeRemainingSeconds: 3600, // 1 hour warning
      durationRemainingSeconds: 7200, // 2 hour storm
      totalDurationSeconds: 7200,
      intensityMultiplier: 50,
      radiationDoseRateMSvPerHour: 4.0,
      damageRatePerHour: 0.01,
      earlyWarningDescription: 'Storm approaching',
      realScienceExplanation: 'Solar flare CME',
    };

    const modules: PlacedModule[] = [];

    // Step 1: 1800s in WARNING
    const step1 = stepHazardSimulation([hazard], modules, 1800);
    expect(step1.updatedHazards[0].status).toBe('WARNING');
    expect(step1.updatedHazards[0].warningTimeRemainingSeconds).toBe(1800);

    // Step 2: 1800s -> Warning expires, transitions to IMPACTING
    const step2 = stepHazardSimulation(step1.updatedHazards, modules, 1800);
    expect(step2.updatedHazards[0].status).toBe('IMPACTING');
    expect(step2.hazardAlerts.some(a => a.includes('CRITICAL'))).toBe(true);

    // Step 3: Fast-forward through duration -> RESOLVED
    const step3 = stepHazardSimulation(step2.updatedHazards, modules, 7200);
    expect(step3.updatedHazards.length).toBe(0); // Resolved hazards are removed
    expect(step3.hazardAlerts.some(a => a.includes('RESOLVED'))).toBe(true);
  });

  it('attenuates radiation dose when crew is sheltered behind regolith berm', () => {
    const impactingHazard: ActiveHazard = {
      instanceId: 'test_spe',
      hazardId: 'solar_particle_event_x_class',
      name: 'SPE Storm',
      category: 'Radiation',
      status: 'IMPACTING',
      warningTimeRemainingSeconds: 0,
      durationRemainingSeconds: 3600,
      totalDurationSeconds: 3600,
      intensityMultiplier: 50,
      radiationDoseRateMSvPerHour: 4.0,
      damageRatePerHour: 0,
      earlyWarningDescription: 'Storm ongoing',
      realScienceExplanation: 'Solar flare CME',
    };

    // Unshielded / unsheltered
    const unshielded = stepHazardSimulation([impactingHazard], [], 3600, false, 0);

    // Sheltered behind 50 cm regolith berm
    const sheltered = stepHazardSimulation([impactingHazard], [], 3600, true, 50);

    // Sheltered dose must be dramatically lower due to exponential half-value layer attenuation
    expect(sheltered.newDoseMSv).toBeLessThan(unshielded.newDoseMSv * 0.25);
  });

  it('repair cost calculates accurately based on missing durability', () => {
    // 100% durability = 0 cost
    expect(calculateRepairCost(250000, 100)).toBe(0);

    // 50% durability of a 250,000 credit module
    // 250,000 * 0.20 * 0.50 = 25,000 credits
    const cost50 = calculateRepairCost(250000, 50);
    expect(cost50).toBe(25000);

    // Minimum clamp at 1000 credits for small damage
    const cost99 = calculateRepairCost(10000, 99);
    expect(cost99).toBe(1000);
  });
});
