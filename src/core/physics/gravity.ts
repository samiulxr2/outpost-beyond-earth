/**
 * Gravity & Surface Mechanics
 *
 * Implements gravitational acceleration and its effects on rovers, payload lifting, and astronaut ergonomics.
 * Reference: NASA Planetary Fact Sheets (NASA Goddard Space Flight Center)
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 */

export const GRAVITATIONAL_CONSTANT_G = 6.6743e-11; // m^3 / (kg * s^2)
export const EARTH_STANDARD_GRAVITY = 9.80665; // m/s^2

export const PLANETARY_GRAVITY = {
  EARTH: 9.807,
  MOON: 1.62,
  MARS: 3.71,
  PHOBOS: 0.0057,
  DEIMOS: 0.003,
  CERES: 0.27,
  MERCURY: 3.7,
  VENUS: 8.87,
  EUROPA: 1.315,
  GANYMEDE: 1.428,
  TITAN: 1.352,
  ENCELADUS: 0.113,
} as const;

/**
 * Calculates surface gravitational acceleration from planetary mass and radius.
 * Formula: g = G * M / R^2
 *
 * @param massKg Mass of celestial body in kg
 * @param radiusMeters Volumetric mean radius in meters
 * @returns Surface gravity in m/s^2
 */
export function calculateSurfaceGravity(massKg: number, radiusMeters: number): number {
  if (massKg <= 0 || radiusMeters <= 0) throw new Error("Mass and radius must be positive");
  return (GRAVITATIONAL_CONSTANT_G * massKg) / Math.pow(radiusMeters, 2);
}

/**
 * Calculates lifting capacity multiplier for construction equipment.
 * In 1/6th gravity (Moon), a crane with 1000 kg capacity on Earth can lift ~6000 kg of mass.
 *
 * @param surfaceGravityMS2 Local surface gravity in m/s^2
 * @returns Multiplier for maximum liftable mass (e.g. ~6.05 for Moon, ~2.64 for Mars)
 */
export function calculateLiftingCapacityMultiplier(surfaceGravityMS2: number): number {
  if (surfaceGravityMS2 <= 0) return 100;
  return EARTH_STANDARD_GRAVITY / surfaceGravityMS2;
}

/**
 * Calculates safe rover traversing speed modifier.
 * Due to lower traction, reduced normal force, and high rollover risk in low-g,
 * safe operating speed is scaled with sqrt(g / g0).
 *
 * @param surfaceGravityMS2 Local gravity in m/s^2
 * @param baseSpeedKmH Nominal vehicle speed on Earth testbed (default: 15 km/h)
 * @returns Safe traverse speed in km/h
 */
export function calculateRoverSafeSpeed(
  surfaceGravityMS2: number,
  baseSpeedKmH: number = 15
): number {
  const gRatio = Math.min(1.0, surfaceGravityMS2 / EARTH_STANDARD_GRAVITY);
  // Traction scales with normal force (g), but braking distance is longer
  return baseSpeedKmH * Math.sqrt(Math.max(0.1, gRatio));
}

/**
 * Calculates daily musculoskeletal deconditioning / exercise requirement.
 * NASA crew members require 2.5 hours of daily resistant/aerobic exercise (ARED/T2)
 * in microgravity to counteract bone mineral density loss (~1% per month unmitigated).
 *
 * @param surfaceGravityMS2 Local gravity in m/s^2
 * @returns Recommended daily workout time in minutes
 */
export function calculateRequiredDailyExerciseMinutes(surfaceGravityMS2: number): number {
  const gRatio = Math.min(1.0, surfaceGravityMS2 / EARTH_STANDARD_GRAVITY);
  // In 1g: 30 mins; in 0g: 150 mins; linear interpolation based on g deficit
  const gravityDeficit = 1.0 - gRatio;
  return Math.round(30 + gravityDeficit * 120);
}
