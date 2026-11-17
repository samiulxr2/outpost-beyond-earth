/**
 * ECLSS: Environmental Control and Life Support System
 *
 * Implements human metabolic consumption budgets and closed-loop recycling loops.
 * References:
 * - NASA Human Integration Design Handbook (HIDH) NASA/SP-2010-3407
 * - NASA ECLSS Technology Development Roadmap (ISS Environmental Systems)
 */

import type { LifeSupportDemand } from "../../types/physics";

// Baseline human metabolic requirements (kg per person per day)
export const METABOLIC_RATES_PER_CREW_DAY = {
  O2_CONSUMPTION_KG: 0.84, // Nominal metabolic rate (NASA HIDH Table 7.2-1)
  DRINKING_FOOD_WATER_KG: 2.50, // Hydration and rehydrating rations
  HYGIENE_WATER_KG: 25.0, // Wash, oral hygiene, laundry
  DRY_FOOD_KG: 0.62, // Balanced 3000 kcal dehydrated diet
  CO2_EXHALATION_KG: 1.00, // Produced from respiration
  URINE_WATER_KG: 1.50, // Liquid waste for recycling
} as const;

/**
 * Calculates ECLSS consumables required for a given crew and mission duration.
 *
 * @param crewCount Number of active astronauts
 * @param durationDays Duration in days
 * @param waterRecyclingEfficiency Fraction of graywater/urine recovered (0.0 = open loop, 0.93 = ISS ECLSS, 0.98 = advanced)
 * @param sabatierRecoveryEnabled Whether CO2 Sabatier reactor is active to recover water from CO2
 * @returns LifeSupportDemand summary
 */
export function calculateLifeSupportDemand(
  crewCount: number,
  durationDays: number,
  waterRecyclingEfficiency: number = 0.93,
  sabatierRecoveryEnabled: boolean = true
): LifeSupportDemand {
  if (crewCount <= 0 || durationDays <= 0) {
    return {
      crewCount: 0,
      durationDays: 0,
      oxygenRequiredKg: 0,
      waterRequiredKg: 0,
      dryFoodRequiredKg: 0,
      co2ProducedKg: 0,
      waterRecycledKg: 0,
      netWaterConsumedKg: 0,
    };
  }

  const crewDays = crewCount * durationDays;

  const oxygenRequiredKg = crewDays * METABOLIC_RATES_PER_CREW_DAY.O2_CONSUMPTION_KG;
  const dryFoodRequiredKg = crewDays * METABOLIC_RATES_PER_CREW_DAY.DRY_FOOD_KG;
  const co2ProducedKg = crewDays * METABOLIC_RATES_PER_CREW_DAY.CO2_EXHALATION_KG;

  // Gross water needed before reclamation
  const grossWaterKg = crewDays * (
    METABOLIC_RATES_PER_CREW_DAY.DRINKING_FOOD_WATER_KG +
    METABOLIC_RATES_PER_CREW_DAY.HYGIENE_WATER_KG
  );

  // Recycled water through filtration and vacuum distillation
  let waterRecycledKg = grossWaterKg * Math.min(0.98, Math.max(0, waterRecyclingEfficiency));

  // Sabatier reaction recovery bonus: CO2 + 4H2 -> CH4 + 2H2O
  // 1 kg CO2 yields ~0.818 kg H2O
  if (sabatierRecoveryEnabled) {
    const sabatierWater = co2ProducedKg * 0.818 * 0.85; // 85% reaction conversion efficiency
    waterRecycledKg += sabatierWater;
  }

  const netWaterConsumedKg = Math.max(0, grossWaterKg - waterRecycledKg);

  return {
    crewCount,
    durationDays,
    oxygenRequiredKg,
    waterRequiredKg: grossWaterKg,
    dryFoodRequiredKg,
    co2ProducedKg,
    waterRecycledKg,
    netWaterConsumedKg,
  };
}

/**
 * Calculates oxygen produced via Molten Regolith Electrolysis (MRE) or MOXIE.
 * Lunar regolith is ~40-45% oxygen by weight bound in oxides (SiO2, FeO, TiO2, Al2O3).
 *
 * @param regolithProcessedKg Kilograms of raw lunar/Martian regolith processed
 * @param extractionEfficiency Fraction of bound oxygen extracted (typically ~0.35 - 0.40)
 * @returns Kilograms of breathable pure O2 gas produced
 */
export function calculateISRUOxygenYield(
  regolithProcessedKg: number,
  extractionEfficiency: number = 0.35
): number {
  if (regolithProcessedKg <= 0) return 0;
  // Regolith mass fraction of oxygen = 0.43
  return regolithProcessedKg * 0.43 * Math.min(1.0, Math.max(0, extractionEfficiency));
}
