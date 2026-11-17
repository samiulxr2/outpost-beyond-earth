import { describe, it, expect } from "vitest";
import {
  tsiolkovskyDeltaV,
  calculateMassRatio,
  calculateMaxPayload,
  calculateRequiredPropellant,
} from "../tsiolkovsky";
import {
  calculateHohmannTransfer,
  calculateLunarTransfer,
  calculateSynodicPeriodDays,
} from "../orbital";
import {
  PLANETARY_GRAVITY,
  calculateSurfaceGravity,
  calculateLiftingCapacityMultiplier,
} from "../gravity";
import {
  calculateSolarFlux,
  calculateSolarArrayOutput,
  SOLAR_CONSTANT_EARTH_1AU,
} from "../solar";
import {
  calculateLightTimeDelay,
  COMM_DISTANCES_KM,
} from "../comms";
import {
  calculateShieldedDose,
  calculateRadiationExposure,
  SHIELDING_HVL_CM,
  RADIATION_BASELINES,
} from "../radiation";
import {
  calculateLifeSupportDemand,
  calculateISRUOxygenYield,
  METABOLIC_RATES_PER_CREW_DAY,
} from "../lifesupport";
import {
  calculateThermalManagementPower,
  calculateRadiativeHeatLossWatts,
} from "../thermal";

describe("Physics Engine Verification with NASA Reference Values", () => {
  describe("Orbital Mechanics (Hohmann Transfer Earth -> Mars)", () => {
    it("should calculate Earth -> Mars transfer duration of ~259 days", () => {
      const result = calculateHohmannTransfer(1.0, 1.52368, "Earth", "Mars");
      // Reference: NASA JPL Astrodynamics standard ~258.8 days (~259 days)
      expect(Math.round(result.transferTimeDays)).toBe(259);
    });

    it("should calculate heliocentric transfer delta-v of ~5.6 km/s", () => {
      const result = calculateHohmannTransfer(1.0, 1.52368, "Earth", "Mars");
      // Heliocentric dv = dv1 (2.95 km/s) + dv2 (2.65 km/s) = 5.59 km/s (~5.6 km/s)
      expect(result.totalDeltaVKmS).toBeCloseTo(5.6, 1);
    });

    it("should calculate Trans-Mars Injection (TMI) from LEO of ~3.6 km/s", () => {
      const result = calculateHohmannTransfer(1.0, 1.52368, "Earth", "Mars", 300);
      // From 300 km LEO parking orbit, TMI burn is ~3.59 km/s (~3.6 km/s)
      expect(result.transInjectionDeltaVKmS).toBeCloseTo(3.6, 1);
    });

    it("should calculate Mars synodic period of ~780 days (26 months)", () => {
      const synodic = calculateSynodicPeriodDays(365.25, 686.98);
      expect(Math.round(synodic)).toBe(780);
    });

    it("should calculate Lunar transfer from LEO", () => {
      const lunar = calculateLunarTransfer(300);
      // TLI delta-V from LEO is ~3.15 km/s
      expect(lunar.tliDeltaVKmS).toBeGreaterThan(3.0);
      expect(lunar.tliDeltaVKmS).toBeLessThan(3.3);
    });
  });

  describe("Communications & Speed of Light Delay", () => {
    it("should calculate Earth -> Moon one-way light time of ~1.28 seconds", () => {
      const delay = calculateLightTimeDelay(COMM_DISTANCES_KM.MOON_AVERAGE);
      // 384,400 km / 299,792.458 km/s = 1.282 seconds
      expect(delay.oneWayLightTimeSeconds).toBeCloseTo(1.28, 2);
    });

    it("should calculate Earth -> Mars light time between 3 and 22 minutes", () => {
      const closest = calculateLightTimeDelay(COMM_DISTANCES_KM.MARS_MIN_CLOSEST_APPROACH);
      const furthest = calculateLightTimeDelay(COMM_DISTANCES_KM.MARS_MAX_SUPERIOR_CONJUNCTION);

      // Closest: ~54.6M km -> ~3.03 minutes (~3 min)
      expect(closest.oneWayLightTimeMinutes).toBeCloseTo(3.0, 0);
      expect(closest.oneWayLightTimeMinutes).toBeGreaterThan(2.9);
      expect(closest.oneWayLightTimeMinutes).toBeLessThan(3.2);

      // Furthest: ~401M km -> ~22.3 minutes (~22 min)
      expect(furthest.oneWayLightTimeMinutes).toBeCloseTo(22.0, 0);
      expect(furthest.oneWayLightTimeMinutes).toBeGreaterThan(21.5);
      expect(furthest.oneWayLightTimeMinutes).toBeLessThan(23.0);
    });
  });

  describe("Solar Irradiance & Photovoltaic Power", () => {
    it("should have exact solar flux of 1361 W/m2 at 1.0 AU", () => {
      const flux1AU = calculateSolarFlux(1.0);
      expect(flux1AU).toBe(SOLAR_CONSTANT_EARTH_1AU);
      expect(flux1AU).toBe(1361.0);
    });

    it("should calculate solar flux at Mars (1.524 AU) of ~590 W/m2", () => {
      const fluxMars = calculateSolarFlux(1.52368);
      // 1361 / (1.52368^2) = 586.2 W/m2 (~590 W/m2)
      expect(Math.round(fluxMars)).toBeCloseTo(590, -1);
      expect(fluxMars).toBeGreaterThan(580);
      expect(fluxMars).toBeLessThan(600);
    });

    it("should calculate power degradation from dust obscuration", () => {
      const cleanArray = calculateSolarArrayOutput(1.0, 10, 0.30, 0, 0, 0);
      const dustyArray = calculateSolarArrayOutput(1.0, 10, 0.30, 0, 0, 0.5); // 50% dust
      expect(dustyArray.effectivePowerOutputWatts).toBeCloseTo(cleanArray.effectivePowerOutputWatts * 0.5, 1);
    });
  });

  describe("Surface Gravity", () => {
    it("should match NASA Planetary Fact Sheet values for Moon and Mars", () => {
      expect(PLANETARY_GRAVITY.MOON).toBe(1.62);
      expect(PLANETARY_GRAVITY.MARS).toBe(3.71);
      expect(PLANETARY_GRAVITY.EARTH).toBe(9.807);
    });

    it("should calculate lifting capacity multiplier in low gravity", () => {
      const lunarMultiplier = calculateLiftingCapacityMultiplier(PLANETARY_GRAVITY.MOON);
      // 9.80665 / 1.62 = ~6.05x lifting advantage on the Moon
      expect(lunarMultiplier).toBeCloseTo(6.05, 1);
    });

    it("should calculate surface gravity from mass and radius", () => {
      // Moon: Mass = 7.342e22 kg, Radius = 1737.4 km
      const gMoon = calculateSurfaceGravity(7.342e22, 1737.4e3);
      expect(gMoon).toBeCloseTo(1.62, 1);
    });
  });

  describe("Tsiolkovsky Rocket Equation", () => {
    it("should accurately compute delta-v for given Isp and mass ratio", () => {
      // 1000 kg dry mass, 9000 kg propellant (m0 = 10000 kg, mf = 1000 kg), Isp = 300 s
      // dv = 300 * 9.80665 * ln(10) = 6774.2 m/s
      const dv = tsiolkovskyDeltaV(300, 10000, 1000);
      expect(dv).toBeCloseTo(6774.2, 0);
    });

    it("should compute required propellant mass for a target delta-v", () => {
      const requiredPropellant = calculateRequiredPropellant(450, 3000, 2000, 1000);
      const m0 = 2000 + 1000 + requiredPropellant;
      const mf = 2000 + 1000;
      const dvCheck = tsiolkovskyDeltaV(450, m0, mf);
      expect(dvCheck).toBeCloseTo(3000, 1);
    });

    it("should calculate mass ratio and max payload capacity", () => {
      const ratio = calculateMassRatio(450, 3000);
      expect(ratio).toBeGreaterThan(1.5);
      const maxPayload = calculateMaxPayload(450, 3000, 2000, 5000);
      expect(maxPayload).toBeGreaterThan(0);
    });
  });

  describe("Radiation Shielding & Dosimetry", () => {
    it("should reduce dose by 50% for every 18 cm of lunar regolith (HVL)", () => {
      const unshielded = RADIATION_BASELINES.MOON_SURFACE_UNSHIELDED; // 1.4 mSv/day
      const dose18cm = calculateShieldedDose(unshielded, 18.0, SHIELDING_HVL_CM.LUNAR_REGOLITH);
      expect(dose18cm).toBeCloseTo(unshielded * 0.5, 3);
    });

    it("should achieve >85% radiation attenuation with 50 cm regolith berm", () => {
      const exp = calculateRadiationExposure("moon", 50.0, 1.0);
      expect(exp.attenuationFraction).toBeGreaterThan(0.85);
    });
  });

  describe("Life Support (NASA ECLSS Rates)", () => {
    it("should accurately calculate consumption for 4 crew over 180 days (Season 1 Level 10)", () => {
      const demand = calculateLifeSupportDemand(4, 180, 0.93, true);

      // O2: 4 * 180 * METABOLIC_RATES_PER_CREW_DAY.O2_CONSUMPTION_KG = 604.8 kg
      const expectedO2 = 4 * 180 * METABOLIC_RATES_PER_CREW_DAY.O2_CONSUMPTION_KG;
      expect(demand.oxygenRequiredKg).toBeCloseTo(expectedO2, 1);

      // Dry food: 4 * 180 * METABOLIC_RATES_PER_CREW_DAY.DRY_FOOD_KG = 446.4 kg
      const expectedFood = 4 * 180 * METABOLIC_RATES_PER_CREW_DAY.DRY_FOOD_KG;
      expect(demand.dryFoodRequiredKg).toBeCloseTo(expectedFood, 1);

      // Closed-loop water recycling reduces net consumption significantly
      expect(demand.netWaterConsumedKg).toBeLessThan(demand.waterRequiredKg * 0.10);
    });

    it("should calculate ISRU oxygen extraction from lunar regolith", () => {
      // 1000 kg regolith processed at 35% efficiency yields ~150 kg O2
      const o2Yield = calculateISRUOxygenYield(1000, 0.35);
      expect(o2Yield).toBeCloseTo(150.5, 1);
    });
  });

  describe("Thermal Management", () => {
    it("should calculate electric heating power needed during cold lunar night (100 K)", () => {
      const result = calculateThermalManagementPower(100, 500, 120, 10.0);
      expect(result.heatingPowerRequiredWatts).toBeGreaterThan(1500);
      expect(result.coolingPowerRequiredWatts).toBe(0);
    });

    it("should calculate radiative cooling power during hot lunar day", () => {
      const radLoss = calculateRadiativeHeatLossWatts(294.15, 50, 0.90);
      expect(radLoss).toBeGreaterThan(0);
    });
  });
});
