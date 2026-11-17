/**
 * Orbital Mechanics & Interplanetary Hohmann Transfers
 *
 * Implements Keplerian orbits, Hohmann transfer trajectories, and synodic launch windows.
 * Reference: Bate, Mueller, White "Fundamentals of Astrodynamics" (Dover)
 * NASA JPL Solar System Dynamics (SSD) Group Physical Constants
 */

import type { HohmannTransferResult } from "../../types/physics";

// Standard Astronomical Constants
export const AU_METERS = 149597870700; // 1 Astronomical Unit in meters
export const AU_KM = 149597870.7; // 1 AU in kilometers
export const GM_SUN = 1.32712440018e20; // Gravitational parameter of Sun (m^3/s^2)
export const GM_EARTH = 3.986004418e14; // Gravitational parameter of Earth (m^3/s^2)
export const GM_MOON = 4.9048695e12; // Gravitational parameter of Moon (m^3/s^2)
export const GM_MARS = 4.282837e13; // Gravitational parameter of Mars (m^3/s^2)
export const EARTH_RADIUS_KM = 6371.0;
export const MOON_RADIUS_KM = 1737.4;
export const MARS_RADIUS_KM = 3389.5;

export const SECONDS_PER_DAY = 86400;

/**
 * Calculates orbital velocity for a circular orbit around a central body.
 *
 * @param rMeters Radius from center of mass in meters
 * @param mu Standard gravitational parameter of central body in m^3/s^2 (default: Sun)
 * @returns Orbital speed in meters/second
 */
export function circularOrbitSpeed(rMeters: number, mu: number = GM_SUN): number {
  if (rMeters <= 0) throw new Error("Orbital radius must be positive");
  return Math.sqrt(mu / rMeters);
}

/**
 * Calculates orbital period using Kepler's Third Law: T = 2π * sqrt(a^3 / μ)
 *
 * @param semiMajorAxisMeters Semi-major axis in meters
 * @param mu Standard gravitational parameter in m^3/s^2 (default: Sun)
 * @returns Orbital period in seconds
 */
export function orbitalPeriodSeconds(semiMajorAxisMeters: number, mu: number = GM_SUN): number {
  if (semiMajorAxisMeters <= 0) throw new Error("Semi-major axis must be positive");
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisMeters, 3) / mu);
}

/**
 * Calculates Synodic Period between two orbiting bodies: 1 / |1/T1 - 1/T2|
 *
 * @param period1Days Orbital period of body 1 in days
 * @param period2Days Orbital period of body 2 in days
 * @returns Synodic period in days (interval between optimal launch windows)
 */
export function calculateSynodicPeriodDays(period1Days: number, period2Days: number): number {
  if (period1Days <= 0 || period2Days <= 0) throw new Error("Periods must be positive");
  const diff = Math.abs(1 / period1Days - 1 / period2Days);
  if (diff === 0) return Infinity;
  return 1 / diff;
}

/**
 * Computes a Hohmann Transfer between two circular, coplanar heliocentric orbits.
 *
 * @param r1AU Heliocentric radius of origin body in AU (e.g. Earth = 1.0)
 * @param r2AU Heliocentric radius of target body in AU (e.g. Mars = 1.52368)
 * @param originName Name of origin body (e.g. "Earth")
 * @param targetName Name of target body (e.g. "Mars")
 * @param parkingOrbitAltitudeKm Altitude of parking orbit at origin in km (default: 300 km LEO)
 * @returns Full HohmannTransferResult containing transfer time, delta-vs, and synodic period
 */
export function calculateHohmannTransfer(
  r1AU: number,
  r2AU: number,
  originName: string = "Earth",
  targetName: string = "Target",
  parkingOrbitAltitudeKm: number = 300
): HohmannTransferResult {
  const r1Meters = r1AU * AU_METERS;
  const r2Meters = r2AU * AU_METERS;

  // Semi-major axis of transfer ellipse
  const aTransferMeters = (r1Meters + r2Meters) / 2;
  const aTransferAU = (r1AU + r2AU) / 2;

  // Transfer time: half the orbital period of the transfer ellipse
  const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(aTransferMeters, 3) / GM_SUN);
  const transferTimeDays = transferTimeSeconds / SECONDS_PER_DAY;

  // Circular speeds of origin and target
  const v1 = circularOrbitSpeed(r1Meters, GM_SUN);
  const v2 = circularOrbitSpeed(r2Meters, GM_SUN);

  // Speeds on transfer ellipse at perihelion (origin) and aphelion (target)
  // Vis-viva equation: v^2 = GM * (2/r - 1/a)
  const vTransfer1 = Math.sqrt(GM_SUN * (2 / r1Meters - 1 / aTransferMeters));
  const vTransfer2 = Math.sqrt(GM_SUN * (2 / r2Meters - 1 / aTransferMeters));

  // Heliocentric delta-Vs
  const deltaV1MetersPerSec = Math.abs(vTransfer1 - v1);
  const deltaV2MetersPerSec = Math.abs(v2 - vTransfer2);
  const totalDeltaVKmS = (deltaV1MetersPerSec + deltaV2MetersPerSec) / 1000;

  // Trans-Injection burn calculation from Low Earth Parking Orbit (LEO)
  // v_inf is the hyperbolic excess velocity = deltaV1MetersPerSec
  const rParkMeters = (EARTH_RADIUS_KM + parkingOrbitAltitudeKm) * 1000;
  const vParkCircular = Math.sqrt(GM_EARTH / rParkMeters);
  const vHyperbolicBurn = Math.sqrt(
    Math.pow(deltaV1MetersPerSec, 2) + (2 * GM_EARTH) / rParkMeters
  );
  const transInjectionDeltaVKmS = (vHyperbolicBurn - vParkCircular) / 1000;

  // Orbital periods of both bodies
  const t1Days = orbitalPeriodSeconds(r1Meters, GM_SUN) / SECONDS_PER_DAY;
  const t2Days = orbitalPeriodSeconds(r2Meters, GM_SUN) / SECONDS_PER_DAY;
  const synodicPeriodDays = calculateSynodicPeriodDays(t1Days, t2Days);

  return {
    originBody: originName,
    targetBody: targetName,
    transferSemiMajorAxisAU: aTransferAU,
    transferTimeDays,
    transferTimeSeconds,
    deltaV1HeliocentricKmS: deltaV1MetersPerSec / 1000,
    deltaV2HeliocentricKmS: deltaV2MetersPerSec / 1000,
    totalDeltaVKmS,
    transInjectionDeltaVKmS,
    synodicPeriodDays,
    simplification: "Simplified for gameplay: assumes circular, coplanar Keplerian orbits. Real planetary orbits have orbital eccentricity (e=0.093 for Mars) and inclination (1.85°), which cause transfer delta-V and duration to vary slightly between individual synodic launch windows.",
  };
}

/**
 * Calculates Moon transit time and delta-V from LEO (Trans-Lunar Injection).
 * Typical Apollo / Artemis trajectory takes ~3.0 days.
 *
 * @param parkingOrbitAltitudeKm LEO parking orbit altitude (km)
 * @returns Lunar transfer summary
 */
export function calculateLunarTransfer(parkingOrbitAltitudeKm: number = 300) {
  const rParkMeters = (EARTH_RADIUS_KM + parkingOrbitAltitudeKm) * 1000;
  const moonDistanceMeters = 384400 * 1000;

  // Transfer ellipse from LEO to lunar orbit radius
  const aTransfer = (rParkMeters + moonDistanceMeters) / 2;
  const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(aTransfer, 3) / GM_EARTH);
  const transferTimeDays = transferTimeSeconds / SECONDS_PER_DAY;

  const vPark = Math.sqrt(GM_EARTH / rParkMeters);
  const vTransPeriapsis = Math.sqrt(GM_EARTH * (2 / rParkMeters - 1 / aTransfer));
  const tliDeltaVKmS = (vTransPeriapsis - vPark) / 1000; // ~3.15 km/s

  return {
    transferTimeDays, // ~4.9 days for pure Hohmann; patched-conic with lunar capture takes ~3 to 3.5 days
    tliDeltaVKmS,
    moonDistanceKm: 384400,
  };
}
