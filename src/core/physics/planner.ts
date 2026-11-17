/**
 * Mission Flight Planner Logic & Pass/Fail Evaluation
 * Evaluates Tsiolkovsky delta-V margins, propellant requirements, and payload thresholds.
 */

import { tsiolkovskyDeltaV, calculateRequiredPropellant } from './tsiolkovsky';
import { calculateLunarTransfer, calculateHohmannTransfer } from './orbital';

export interface RocketStageSpec {
  dryMassKg: number;
  propellantMassKg: number;
  ispVacuumS: number;
}

export interface RocketSpec {
  id: string;
  name: string;
  maxPayloadToTLIKg: number;
  maxPayloadToTMIKg: number;
  upperStage: RocketStageSpec;
}

export interface MissionPlannerEvaluation {
  destination: 'moon' | 'mars';
  rocketId: string;
  payloadMassKg: number;
  requiredDeltaVMs: number;
  availableDeltaVMs: number;
  marginDeltaVMs: number;
  fuelNeededKg: number;
  transferTimeDays: number;
  maxRatedPayloadKg: number;
  isPass: boolean;
  passPayload: boolean;
  passDeltaV: boolean;
  failureReason: string | null;
  simplification: string;
}

/**
 * Pure evaluation function for Mission Planner flight dynamics.
 */
export function evaluateMissionPlan(
  destination: 'moon' | 'mars',
  rocket: RocketSpec,
  payloadMassKg: number
): MissionPlannerEvaluation {
  let requiredDeltaVMs: number;
  let maxRatedPayloadKg: number;
  let transferTimeDays: number;

  if (destination === 'moon') {
    const lunar = calculateLunarTransfer(300);
    requiredDeltaVMs = (lunar.tliDeltaVKmS + 2.50) * 1000; // TLI + lunar orbit injection & descent
    maxRatedPayloadKg = rocket.maxPayloadToTLIKg;
    transferTimeDays = 3.5;
  } else {
    const mars = calculateHohmannTransfer(1.0, 1.52368, 'Earth', 'Mars', 300);
    requiredDeltaVMs = (mars.transInjectionDeltaVKmS + 2.0) * 1000;
    maxRatedPayloadKg = rocket.maxPayloadToTMIKg;
    transferTimeDays = Math.round(mars.transferTimeDays);
  }

  const { upperStage } = rocket;
  const m0 = upperStage.dryMassKg + upperStage.propellantMassKg + payloadMassKg;
  const mf = upperStage.dryMassKg + payloadMassKg;
  const availableDeltaVMs = tsiolkovskyDeltaV(upperStage.ispVacuumS, m0, mf);
  const marginDeltaVMs = availableDeltaVMs - requiredDeltaVMs;

  const fuelNeededKg = calculateRequiredPropellant(
    upperStage.ispVacuumS,
    requiredDeltaVMs,
    upperStage.dryMassKg,
    payloadMassKg
  );

  const passPayload = payloadMassKg <= maxRatedPayloadKg;
  const passDeltaV = availableDeltaVMs >= requiredDeltaVMs;
  const isPass = passPayload && passDeltaV;

  let failureReason: string | null = null;
  if (!passPayload) {
    failureReason = `Payload mass (${payloadMassKg.toLocaleString()} kg) exceeds rated capacity (${maxRatedPayloadKg.toLocaleString()} kg)`;
  } else if (!passDeltaV) {
    failureReason = `Delta-V deficit of ${Math.round(Math.abs(marginDeltaVMs))} m/s (Available: ${(availableDeltaVMs / 1000).toFixed(2)} km/s, Required: ${(requiredDeltaVMs / 1000).toFixed(2)} km/s)`;
  }

  return {
    destination,
    rocketId: rocket.id,
    payloadMassKg,
    requiredDeltaVMs,
    availableDeltaVMs,
    marginDeltaVMs,
    fuelNeededKg: Math.round(fuelNeededKg),
    transferTimeDays,
    maxRatedPayloadKg,
    isPass,
    passPayload,
    passDeltaV,
    failureReason,
    simplification: "Simplified for gameplay: Single-stage equivalent burn. The separate descent/lander propulsion stage and orbital rendezvous burns are aggregated into the total mission delta-V budget.",
  };
}
