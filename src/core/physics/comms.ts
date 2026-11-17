/**
 * Deep Space Communications & Light-Time Delay
 *
 * Implements speed-of-light propagation latency, inverse-square link margin,
 * and NASA Deep Space Network (DSN) solar conjunction signal blackouts.
 *
 * References:
 * - NASA Deep Space Network (DSN) Telecommunications Link Design Handbook (810-005)
 * - Speed of light constant c = 299,792.458 km/s (CODATA / BIPM)
 */

import type { CommsDelayResult } from "../../types/physics";

export const SPEED_OF_LIGHT_KM_S = 299792.458; // km / second

// Astronomical distances from Earth in kilometers
export const COMM_DISTANCES_KM = {
  MOON_AVERAGE: 384400,
  MOON_PERIGEE: 363300,
  MOON_APOGEE: 405500,
  MARS_MIN_CLOSEST_APPROACH: 54600000, // ~0.365 AU (perihelic opposition)
  MARS_AVERAGE: 225000000, // ~1.5 AU
  MARS_MAX_SUPERIOR_CONJUNCTION: 401000000, // ~2.68 AU (opposite sides of the Sun)
} as const;

/**
 * Calculates one-way and round-trip light-time delay for radio transmission.
 * Formula: t_delay = distance / c
 *
 * @param distanceKm Distance between transmitter and receiver in kilometers
 * @returns CommsDelayResult
 */
export function calculateLightTimeDelay(distanceKm: number): CommsDelayResult {
  if (distanceKm <= 0) {
    return {
      distanceKm: 0,
      oneWayLightTimeSeconds: 0,
      oneWayLightTimeMinutes: 0,
      roundTripLightTimeSeconds: 0,
      signalStrengthFactor: 1.0,
    };
  }

  const oneWayLightTimeSeconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  const oneWayLightTimeMinutes = oneWayLightTimeSeconds / 60;
  const roundTripLightTimeSeconds = oneWayLightTimeSeconds * 2;

  // Free space path loss / inverse square attenuation relative to lunar distance (normalized)
  const signalStrengthFactor = Math.pow(COMM_DISTANCES_KM.MOON_AVERAGE / distanceKm, 2);

  return {
    distanceKm,
    oneWayLightTimeSeconds,
    oneWayLightTimeMinutes,
    roundTripLightTimeSeconds,
    signalStrengthFactor: Math.min(1.0, signalStrengthFactor),
  };
}

/**
 * Checks whether planetary alignment causes a Solar Conjunction blackout.
 * When the line-of-sight passes within 2 degrees of the Sun, solar corona plasma
 * severely scrambles or blocks RF communication (NASA pauses Mars rover operations during this window).
 *
 * @param separationAngleDeg Angular separation between target planet and the Sun as viewed from Earth
 * @returns Boolean indicating whether deep space communications are blacked out
 */
export function isSolarConjunctionBlackout(separationAngleDeg: number): boolean {
  return separationAngleDeg < 2.0;
}
