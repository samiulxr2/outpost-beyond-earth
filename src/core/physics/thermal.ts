/**
 * Thermal Dynamics & Radiative Balance
 *
 * Models radiative and conductive heat exchange in planetary vacuum/thin atmospheres.
 * References:
 * - Stefan-Boltzmann Law of Thermal Radiation
 * - NASA Thermal Control Systems (TCS) Spacecraft Design Principles
 */

import type { ThermalBalanceResult } from "../../types/physics";

export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8; // W / (m^2 * K^4)
export const DEEP_SPACE_SINK_TEMP_KELVIN = 3.0; // 3 Kelvin CMB
export const HABITAT_NOMINAL_TEMP_KELVIN = 294.15; // 21°C / 70°F

/**
 * Calculates radiative heat exchange between a surface and deep space.
 * Formula: Q = emissivity * sigma * Area * (T_surf^4 - T_space^4)
 *
 * @param surfaceTempKelvin Temperature of emitting surface in Kelvin
 * @param areaM2 Radiating surface area in m^2
 * @param emissivity Surface thermal emissivity (0.0 to 1.0, e.g. 0.90 for white thermal paint)
 * @param sinkTempKelvin Background sink temperature (default: 3K)
 * @returns Heat emitted in Watts
 */
export function calculateRadiativeHeatLossWatts(
  surfaceTempKelvin: number,
  areaM2: number,
  emissivity: number = 0.90,
  sinkTempKelvin: number = DEEP_SPACE_SINK_TEMP_KELVIN
): number {
  if (surfaceTempKelvin <= 0 || areaM2 <= 0) return 0;
  const deltaT4 = Math.pow(surfaceTempKelvin, 4) - Math.pow(sinkTempKelvin, 4);
  return emissivity * STEFAN_BOLTZMANN_CONSTANT * areaM2 * deltaT4;
}

/**
 * Calculates heating or cooling electrical power required to keep habitat interior at 21°C (294.15 K).
 *
 * @param ambientExternalTempKelvin Outside surface temperature (e.g. 100K during lunar night, 390K daytime)
 * @param internalHeatLoadWatts Heat generated inside by crew (~120W per person) + running avionics
 * @param habitatSurfaceAreaM2 Exterior shell surface area
 * @param insulationRValue Thermal insulation effectiveness (high R-value for Multi-Layer Insulation MLI)
 * @returns ThermalBalanceResult
 */
export function calculateThermalManagementPower(
  ambientExternalTempKelvin: number,
  internalHeatLoadWatts: number,
  habitatSurfaceAreaM2: number = 120,
  insulationRValue: number = 10.0 // Effective thermal resistance (m^2 * K / W)
): ThermalBalanceResult {
  // Conductive / radiative heat transfer through insulation shell: Q_loss = A * (T_int - T_ext) / R
  const deltaT = HABITAT_NOMINAL_TEMP_KELVIN - ambientExternalTempKelvin;
  const heatLossThroughShellWatts = (habitatSurfaceAreaM2 * deltaT) / insulationRValue;

  // Net thermal balance: Net = Q_loss - Internal_Heat
  const netDeficitWatts = heatLossThroughShellWatts - internalHeatLoadWatts;

  let heatingPowerRequiredWatts = 0;
  let coolingPowerRequiredWatts = 0;

  if (netDeficitWatts > 0) {
    // Habitat losing more heat than internal equipment generates -> electric heaters required
    heatingPowerRequiredWatts = netDeficitWatts;
  } else {
    // Habitat overheating from internal equipment & hot outside sun -> heat pump & radiators required
    coolingPowerRequiredWatts = Math.abs(netDeficitWatts);
  }

  const radiativeLoss = calculateRadiativeHeatLossWatts(HABITAT_NOMINAL_TEMP_KELVIN, habitatSurfaceAreaM2 * 0.3);

  return {
    ambientTempKelvin: ambientExternalTempKelvin,
    internalTempKelvin: HABITAT_NOMINAL_TEMP_KELVIN,
    radiativeLossWatts: radiativeLoss,
    conductiveLossWatts: heatLossThroughShellWatts,
    heatingPowerRequiredWatts: Math.max(0, heatingPowerRequiredWatts),
    coolingPowerRequiredWatts: Math.max(0, coolingPowerRequiredWatts),
    simplification: "Simplified for gameplay: 1D lumped-parameter thermal resistance (R-value) model assuming uniform interior air volume and static external sink, neglecting multi-layer convective air pockets and structural thermal bridges.",
  };
}
