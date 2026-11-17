/**
 * Space Radiation & Shielding Dosimetry
 *
 * Models Galactic Cosmic Radiation (GCR), Solar Particle Events (SPE),
 * and exponential shielding attenuation by lunar/Martian regolith.
 *
 * References:
 * - NASA CRaTER (Cosmic Ray Telescope for the Effects of Radiation) on LRO
 * - Chang'e 4 Lunar Lander LND instrument (Science Advances 2020: ~60 µSv/hr on Moon)
 * - Curiosity RAD (Radiation Assessment Detector) on Mars (~0.64 mSv/day on Mars surface)
 * - NASA Space Radiation Laboratory (NSRL) Shielding Guidelines
 */

import type { RadiationDoseResult } from "../../types/physics";

// Baseline unshielded daily radiation doses on celestial surfaces (mSv / day)
export const RADIATION_BASELINES = {
  EARTH_SURFACE: 0.0065, // ~2.4 mSv / year
  ISS_INTERIOR: 0.50, // LEO interior
  MOON_SURFACE_UNSHIELDED: 1.40, // ~60 µSv / hr * 24h
  MARS_SURFACE_UNSHIELDED: 0.65, // Curiosity RAD measurement
  DEEP_SPACE_INTERPLANETARY: 1.80, // Transit cruise
} as const;

// Half-Value Layer (HVL) of materials in centimeters
// Thickness of material required to reduce radiation intensity by 50%
export const SHIELDING_HVL_CM = {
  LUNAR_REGOLITH: 18.0, // Density ~1.5 - 1.8 g/cm^3
  MARTIAN_REGOLITH: 19.5, // Density ~1.4 g/cm^3
  WATER_POLYETHYLENE: 14.0, // High hydrogen content
  ALUMINUM: 27.0, // Spacecraft hull
  LEAD: 4.8, // Heavy, impractical for primary structures
} as const;

export const NASA_CAREER_DOSE_LIMIT_MSV = 600.0; // NASA astronaut career radiation limit

/**
 * Calculates radiation attenuation through a shielding layer.
 * Formula: I = I0 * 2^(-thickness / HVL)
 *
 * @param unshieldedDoseMSvPerDay Incident radiation dose rate in mSv/day
 * @param thicknessCm Shielding layer thickness in cm
 * @param hvlCm Half-value layer thickness in cm (default: Lunar Regolith = 18 cm)
 * @returns Shielded dose rate in mSv/day
 */
export function calculateShieldedDose(
  unshieldedDoseMSvPerDay: number,
  thicknessCm: number,
  hvlCm: number = SHIELDING_HVL_CM.LUNAR_REGOLITH
): number {
  if (thicknessCm <= 0) return unshieldedDoseMSvPerDay;
  if (hvlCm <= 0) throw new Error("HVL must be positive");
  const halfLives = thicknessCm / hvlCm;
  return unshieldedDoseMSvPerDay * Math.pow(0.5, halfLives);
}

/**
 * Calculates daily astronaut radiation exposure during mission operations.
 *
 * @param location 'moon' | 'mars' | 'deep_space'
 * @param regolithShieldingThicknessCm Thickness of regolith berm or bury depth (cm)
 * @param speIntensityMultiplier Solar Particle Event multiplier (1.0 = normal, 10-100 during storm)
 * @param habitatHullAluminumThicknessCm Spacecraft hull thickness in cm (default: 2.5 cm)
 * @returns RadiationDoseResult
 */
export function calculateRadiationExposure(
  location: "moon" | "mars" | "deep_space",
  regolithShieldingThicknessCm: number = 0,
  speIntensityMultiplier: number = 1.0,
  habitatHullAluminumThicknessCm: number = 2.5
): RadiationDoseResult {
  let baseDose: number = RADIATION_BASELINES.MOON_SURFACE_UNSHIELDED;
  if (location === "mars") baseDose = RADIATION_BASELINES.MARS_SURFACE_UNSHIELDED;
  if (location === "deep_space") baseDose = RADIATION_BASELINES.DEEP_SPACE_INTERPLANETARY;

  const incidentDose = baseDose * speIntensityMultiplier;

  // Primary attenuation through aluminum hull
  const doseAfterHull = calculateShieldedDose(
    incidentDose,
    habitatHullAluminumThicknessCm,
    SHIELDING_HVL_CM.ALUMINUM
  );

  // Secondary attenuation through regolith shielding berm
  const hvl = location === "mars" ? SHIELDING_HVL_CM.MARTIAN_REGOLITH : SHIELDING_HVL_CM.LUNAR_REGOLITH;
  const shieldedDoseRateMSvPerDay = calculateShieldedDose(
    doseAfterHull,
    regolithShieldingThicknessCm,
    hvl
  );

  const attenuationFraction = 1.0 - (shieldedDoseRateMSvPerDay / incidentDose);

  return {
    unshieldedDoseRateMSvPerDay: incidentDose,
    shieldedDoseRateMSvPerDay,
    attenuationFraction: Math.max(0, Math.min(1.0, attenuationFraction)),
    regolithShieldingThicknessCm,
    cumulativeDoseMSv: 0,
    isSolarParticleEvent: speIntensityMultiplier > 1.5,
    speIntensityMultiplier,
    simplification: "Simplified for gameplay: uses uniform exponential half-value layer (HVL) attenuation for primary ionizing particles. Secondary spallation neutron cascades and bremsstrahlung from heavy relativistic ions striking dense metals are approximated into the bulk effective half-value coefficient.",
  };
}
