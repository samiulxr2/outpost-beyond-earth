/**
 * Tsiolkovsky Rocket Equation & Mass Fraction Tradeoffs
 *
 * Fundamental equation of rocketry derived by Konstantin Tsiolkovsky (1903):
 * Δv = Isp * g0 * ln(m0 / mf)
 *
 * Reference: NASA SP-8110 "Liquid Rocket Engine Combustion Stabilization Devices"
 * NASA Earth Standard Gravity: g0 = 9.80665 m/s^2
 */

export const STANDARD_GRAVITY_G0 = 9.80665; // m/s^2

/**
 * Calculates ideal velocity change (Δv) produced by a rocket stage.
 *
 * @param isp Specific impulse in seconds (s)
 * @param m0 Initial wet mass (including propellant, dry mass, payload) in kg
 * @param mf Final dry mass (after propellant consumed) in kg
 * @returns Delta-V in meters per second (m/s)
 */
export function tsiolkovskyDeltaV(isp: number, m0: number, mf: number): number {
  if (isp <= 0) throw new Error("Specific impulse (Isp) must be greater than zero");
  if (m0 <= 0 || mf <= 0) throw new Error("Masses must be positive non-zero values");
  if (m0 < mf) throw new Error("Initial mass m0 cannot be less than final mass mf");
  if (m0 === mf) return 0;

  return isp * STANDARD_GRAVITY_G0 * Math.log(m0 / mf);
}

/**
 * Calculates mass ratio (m0 / mf) required to achieve a given Δv.
 *
 * @param isp Specific impulse in seconds (s)
 * @param deltaV Desired velocity change in m/s
 * @returns Mass ratio (m0 / mf >= 1.0)
 */
export function calculateMassRatio(isp: number, deltaV: number): number {
  if (isp <= 0) throw new Error("Specific impulse must be greater than zero");
  if (deltaV < 0) throw new Error("Delta-V cannot be negative");
  return Math.exp(deltaV / (isp * STANDARD_GRAVITY_G0));
}

/**
 * Calculates maximum payload mass deliverable given available propellant and dry mass.
 *
 * @param isp Specific impulse in seconds (s)
 * @param targetDeltaV Required Δv in m/s
 * @param dryMassKg Rocket stage structural dry mass in kg
 * @param propellantMassKg Available usable propellant in kg
 * @returns Maximum payload mass in kg (can be negative if rocket cannot achieve Δv even with 0 payload)
 */
export function calculateMaxPayload(
  isp: number,
  targetDeltaV: number,
  dryMassKg: number,
  propellantMassKg: number
): number {
  const massRatio = calculateMassRatio(isp, targetDeltaV);
  // m0 = dryMass + propellantMass + payload
  // mf = dryMass + payload
  // m0 / mf = massRatio
  // (dryMass + propellant + payload) = massRatio * (dryMass + payload)
  // propellant + dryMass * (1 - massRatio) = payload * (massRatio - 1)
  // payload = (propellantMass - dryMass * (massRatio - 1)) / (massRatio - 1)
  if (massRatio <= 1.0) return Infinity;
  const denominator = massRatio - 1;
  const maxPayload = (propellantMassKg - dryMassKg * denominator) / denominator;
  return maxPayload;
}

/**
 * Calculates required propellant mass to deliver a specific payload and dry mass through a given Δv.
 *
 * @param isp Specific impulse in seconds (s)
 * @param targetDeltaV Required Δv in m/s
 * @param dryMassKg Rocket stage dry mass in kg
 * @param payloadMassKg Delivered payload mass in kg
 * @returns Required propellant mass in kg
 */
export function calculateRequiredPropellant(
  isp: number,
  targetDeltaV: number,
  dryMassKg: number,
  payloadMassKg: number
): number {
  const massRatio = calculateMassRatio(isp, targetDeltaV);
  const mf = dryMassKg + payloadMassKg;
  const m0 = mf * massRatio;
  return m0 - mf;
}

/**
 * Multistage rocket total Δv calculation.
 *
 * @param stages Array of stages ordered from first to fire to final stage.
 * @param payloadKg Final mission payload mass.
 * @returns Total cumulative Δv in m/s.
 */
export function calculateMultistageDeltaV(
  stages: { dryMassKg: number; propellantMassKg: number; ispVacuumS: number }[],
  payloadKg: number
): number {
  let totalDeltaV = 0;
  for (let i = 0; i < stages.length; i++) {
    const current = stages[i];
    // Remaining mass carried by stage i includes upper stages and final payload
    let upperMass = payloadKg;
    for (let j = i + 1; j < stages.length; j++) {
      upperMass += stages[j].dryMassKg + stages[j].propellantMassKg;
    }
    const m0 = current.dryMassKg + current.propellantMassKg + upperMass;
    const mf = current.dryMassKg + upperMass;
    totalDeltaV += tsiolkovskyDeltaV(current.ispVacuumS, m0, mf);
  }
  return totalDeltaV;
}
