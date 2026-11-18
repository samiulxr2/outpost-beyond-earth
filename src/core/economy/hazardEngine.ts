/**
 * Environmental Hazard & Space Weather Engine
 *
 * Implements realistic solar particle events (SPE / CME) sampled from NASA DONKI telemetry,
 * sporadic hypervelocity micrometeoroid impacts, and module degradation/repair loops.
 *
 * References:
 * - NASA CCMC DONKI (Database Of Notifications, Knowledge, Information) Space Weather Catalog
 * - NASA Space Radiation Analysis Group (SRAG) Astronaut Exposure Limits (NASA-STD-3001)
 * - NASA Meteoroid Environment Office (MEO) Sporadic Flux Model
 * - NASA Glenn Research Center Reliability & Degradation Baselines
 */

import hazardsData from '../../data/hazards.json';
import { calculateRadiationExposure } from '../physics/radiation';
import type { PlacedModule } from '../../types/game';

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

export interface HazardStepResult {
  updatedHazards: ActiveHazard[];
  newDoseMSv: number;
  hourlyDoseRateMSv: number;
  updatedModules: PlacedModule[];
  hazardAlerts: string[];
}

/**
 * Samples a real Solar Particle Event from NASA DONKI historical telemetry.
 */
export function sampleSolarParticleEvent(_missionElapsedDays: number = 0): ActiveHazard {
  const donkiEvents = (hazardsData as { observedEvents?: Array<{ sepID?: string; eventTime?: string; instruments?: Array<{ displayName?: string }> }> }).observedEvents || [];
  const eventSample = donkiEvents[Math.floor(Math.random() * Math.max(1, donkiEvents.length))];
  const sepId = eventSample?.sepID || '2024-05-10T06:54:00-SEP-001';
  const instrument = eventSample?.instruments?.[0]?.displayName || 'SOHO: COSTEP 15.8-39.8 MeV';

  // Real CME shock transit time from Sun to Earth-Moon L1 takes ~12 to 36 hours
  const warningHours = 12 + Math.random() * 12; // 12-24 hours warning
  const durationHours = 24 + Math.random() * 24; // 24-48 hours storm duration
  const intensity = 35 + Math.random() * 40; // 35x to 75x normal GCR flux

  return {
    instanceId: `hazard_spe_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    hazardId: 'solar_particle_event_x_class',
    name: 'Solar Particle Event (CME Proton Storm)',
    category: 'Radiation',
    status: 'WARNING',
    warningTimeRemainingSeconds: warningHours * 3600,
    durationRemainingSeconds: durationHours * 3600,
    totalDurationSeconds: durationHours * 3600,
    intensityMultiplier: intensity,
    radiationDoseRateMSvPerHour: 3.5 + Math.random() * 2.0,
    damageRatePerHour: 0.012,
    earlyWarningDescription: `DONKI Alert: SOHO & GOES detected major Coronal Mass Ejection shock front (${sepId}). Relativistic solar proton arrival in ${(warningHours).toFixed(1)} mission hours.`,
    sourceDonkiEventId: sepId,
    realScienceExplanation: `Observed by ${instrument}. Coronal Mass Ejections drive relativistic protons into interplanetary space. SOHO/COSTEP and ACE sensors at Sun-Earth L1 give tens of minutes to 24 hours of advance warning before the shock reaches the Moon.`
  };
}

/**
 * Samples a sporadic hypervelocity micrometeoroid impact on an active surface module.
 */
export function sampleMicrometeoriteImpact(modules: PlacedModule[]): ActiveHazard | null {
  if (modules.length === 0) return null;
  const target = modules[Math.floor(Math.random() * modules.length)];
  const durationHours = 2 + Math.random() * 4;

  return {
    instanceId: `hazard_mm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    hazardId: 'micrometeorite_shower',
    name: 'Hypervelocity Micrometeorite Strike',
    category: 'Impact',
    status: 'IMPACTING', // Hypervelocity (10-72 km/s) strikes with 0 warning
    warningTimeRemainingSeconds: 0,
    durationRemainingSeconds: durationHours * 3600,
    totalDurationSeconds: durationHours * 3600,
    intensityMultiplier: 1.0,
    radiationDoseRateMSvPerHour: 0,
    damageRatePerHour: 0.05,
    affectedModuleInstanceId: target.instanceId,
    affectedModuleName: target.moduleId,
    earlyWarningDescription: `IMPACT ALERT: Unpredicted hypervelocity particle strike on module ${target.moduleId}. Structural integrity degraded.`,
    realScienceExplanation: `NASA Meteoroid Environment Office models indicate millions of gram-to-microgram cometary particles strike the airless lunar surface daily at speeds up to 72 km/s without atmospheric burnup.`
  };
}

/**
 * Advances the active hazard simulation by deltaSeconds.
 */
export function stepHazardSimulation(
  activeHazards: ActiveHazard[],
  modules: PlacedModule[],
  deltaSeconds: number,
  crewSheltered: boolean = false,
  regolithBermThicknessCm: number = 0
): HazardStepResult {
  const updatedHazards: ActiveHazard[] = [];
  const alerts: string[] = [];
  let hourlyDoseRateMSv = 0.058; // Baseline lunar surface ~1.40 mSv / 24h = 0.058 mSv/h

  // Find max radiation intensity from all active storms
  let maxSpeMultiplier = 1.0;
  for (const h of activeHazards) {
    if (h.category === 'Radiation' && h.status === 'IMPACTING') {
      maxSpeMultiplier = Math.max(maxSpeMultiplier, h.intensityMultiplier);
    }
  }

  // Calculate radiation dose for this tick using physics model
  const effectiveBerm = crewSheltered ? Math.max(regolithBermThicknessCm, 50) : regolithBermThicknessCm;
  const radCalc = calculateRadiationExposure(
    'moon',
    effectiveBerm,
    maxSpeMultiplier,
    2.5 // 2.5 cm Aluminum hull baseline
  );

  hourlyDoseRateMSv = radCalc.shieldedDoseRateMSvPerDay / 24;
  const newDoseMSv = hourlyDoseRateMSv * (deltaSeconds / 3600);

  // Step each hazard
  let updatedModulesList = [...modules];

  for (const hazard of activeHazards) {
    if (hazard.status === 'WARNING') {
      const remainingWarning = hazard.warningTimeRemainingSeconds - deltaSeconds;
      if (remainingWarning <= 0) {
        // Transition to IMPACTING and apply any remaining excess time to duration
        const excessSeconds = Math.abs(remainingWarning);
        const remainingDuration = hazard.durationRemainingSeconds - excessSeconds;

        if (remainingDuration <= 0) {
          // Both warning and storm duration passed completely within this step
          alerts.push(`✅ RESOLVED: ${hazard.name} has passed. Ambient telemetry returned to baseline.`);
        } else {
          const stormHazard: ActiveHazard = {
            ...hazard,
            status: 'IMPACTING',
            warningTimeRemainingSeconds: 0,
            durationRemainingSeconds: remainingDuration,
          };
          updatedHazards.push(stormHazard);
          alerts.push(`🚨 CRITICAL: ${hazard.name} has begun! Relativistic proton flux spiking!`);
        }
      } else {
        updatedHazards.push({
          ...hazard,
          warningTimeRemainingSeconds: remainingWarning,
        });
      }
    } else if (hazard.status === 'IMPACTING') {
      const remainingDuration = hazard.durationRemainingSeconds - deltaSeconds;

      // Apply degradation / damage to modules
      if (hazard.damageRatePerHour > 0) {
        const damageThisStep = (hazard.damageRatePerHour / 3600) * deltaSeconds * 100;
        updatedModulesList = updatedModulesList.map(mod => {
          if (!hazard.affectedModuleInstanceId || mod.instanceId === hazard.affectedModuleInstanceId) {
            const newDur = Math.max(0, mod.durabilityPct - damageThisStep);
            return { ...mod, durabilityPct: newDur };
          }
          return mod;
        });
      }

      if (remainingDuration <= 0) {
        // Resolved!
        alerts.push(`✅ RESOLVED: ${hazard.name} has passed. Ambient telemetry returned to baseline.`);
      } else {
        updatedHazards.push({
          ...hazard,
          durationRemainingSeconds: remainingDuration,
        });
      }
    }
  }

  return {
    updatedHazards,
    newDoseMSv,
    hourlyDoseRateMSv,
    updatedModules: updatedModulesList,
    hazardAlerts: alerts,
  };
}

/**
 * Calculates credit cost to repair a damaged module to 100% durability.
 */
export function calculateRepairCost(baseCostCredits: number, currentDurabilityPct: number): number {
  if (currentDurabilityPct >= 100) return 0;
  const missingFrac = (100 - currentDurabilityPct) / 100;
  // Repair costs 20% of full module purchase scaled by missing durability
  const cost = Math.round(baseCostCredits * 0.20 * missingFrac);
  return Math.max(1000, cost);
}
