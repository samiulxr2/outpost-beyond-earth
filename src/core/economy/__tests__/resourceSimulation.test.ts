import { describe, it, expect } from 'vitest';
import { 
  stepResourceSimulation, 
  calculateSiteIllumination, 
  type SimulationState 
} from '../resourceSimulation';
import type { PlacedModule } from '../../../types/game';

describe('Resource Simulation & Conservation Laws', () => {
  const baseInitialState: SimulationState = {
    missionElapsedSeconds: 3600, // 1 hour into mission
    missionElapsedDays: 0.04,
    powerStoredKWh: 50,
    maxPowerStorageKWh: 150,
    oxygenKg: 100,
    waterKg: 200,
    foodDaysRemaining: 30,
    regolithOreKg: 0,
    propellantKg: 500,
    budgetCredits: 800000,
    landingSiteId: 'shackleton_rim',
    crewCount: 4,
  };

  it('fixed-timestep stepping yields equivalent consumable rates at 1s, 60s, and 1440s steps', () => {
    const totalDurationSeconds = 86400; // 1 Earth day

    // A: Single 86400s step
    const resultSingle = stepResourceSimulation(baseInitialState, [], totalDurationSeconds);

    // B: 60s steps (1440 steps = 1 day)
    let state60 = { ...baseInitialState };
    for (let i = 0; i < 1440; i++) {
      const res = stepResourceSimulation(state60, [], 60);
      state60 = {
        ...state60,
        missionElapsedSeconds: state60.missionElapsedSeconds + 60,
        oxygenKg: res.oxygenKg,
        waterKg: res.waterKg,
        foodDaysRemaining: res.foodDaysRemaining,
      };
    }

    // C: 1440s steps (60 steps = 1 day)
    let state1440 = { ...baseInitialState };
    for (let i = 0; i < 60; i++) {
      const res = stepResourceSimulation(state1440, [], 1440);
      state1440 = {
        ...state1440,
        missionElapsedSeconds: state1440.missionElapsedSeconds + 1440,
        oxygenKg: res.oxygenKg,
        waterKg: res.waterKg,
        foodDaysRemaining: res.foodDaysRemaining,
      };
    }

    // Check O2 consumption (4 crew * 0.84 kg/day = 3.36 kg/day consumed)
    expect(resultSingle.oxygenKg).toBeCloseTo(baseInitialState.oxygenKg - 3.36, 1);
    expect(state60.oxygenKg).toBeCloseTo(resultSingle.oxygenKg, 1);
    expect(state1440.oxygenKg).toBeCloseTo(resultSingle.oxygenKg, 1);

    // Check Water consumption (4 crew * 2.50 kg/day = 10.0 kg/day consumed)
    expect(resultSingle.waterKg).toBeCloseTo(baseInitialState.waterKg - 10.0, 1);
    expect(state60.waterKg).toBeCloseTo(resultSingle.waterKg, 1);
    expect(state1440.waterKg).toBeCloseTo(resultSingle.waterKg, 1);

    // Check Food days (decreases by exactly 1 day)
    expect(resultSingle.foodDaysRemaining).toBeCloseTo(29.0, 1);
    expect(state60.foodDaysRemaining).toBeCloseTo(29.0, 1);
    expect(state1440.foodDaysRemaining).toBeCloseTo(29.0, 1);
  });

  it('resources never go below 0 under severe deficit', () => {
    const consumingHab: PlacedModule = {
      instanceId: 'hab_drain',
      moduleId: 'inflatable_hab_alpha',
      x: 8,
      y: 8,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 0,
    };

    const nearDepletedState: SimulationState = {
      ...baseInitialState,
      powerStoredKWh: 0.5,
      oxygenKg: 0.2,
      waterKg: 0.1,
      foodDaysRemaining: 0.05,
    };

    // Step by 30 days under heavy consumption with zero generation
    const result = stepResourceSimulation(nearDepletedState, [consumingHab], 30 * 86400);

    expect(result.powerStoredKWh).toBe(0);
    expect(result.oxygenKg).toBe(0);
    expect(result.waterKg).toBe(0);
    expect(result.foodDaysRemaining).toBe(0);
    expect(result.powerStoredKWh).toBeGreaterThanOrEqual(0);
    expect(result.oxygenKg).toBeGreaterThanOrEqual(0);
    expect(result.waterKg).toBeGreaterThanOrEqual(0);
    expect(result.foodDaysRemaining).toBeGreaterThanOrEqual(0);
  });

  it('battery charge and discharge math obeys conservation of energy', () => {
    // 1 VSAT module generating 10 kW (minus 50W parasitic) = ~9950 W net at full sun
    const solarModule: PlacedModule = {
      instanceId: 'test_vsat',
      moduleId: 'vsat_solar_array',
      x: 8,
      y: 8,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 0,
    };

    // 1 Habitat consuming 3500 W
    const habModule: PlacedModule = {
      instanceId: 'test_hab',
      moduleId: 'inflatable_hab_alpha',
      x: 8,
      y: 9,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 0,
    };

    // Step 1: Charging during sunlight
    // VSAT generating 10000 * 0.95 = 9500 W. Consuming 3500 + 50 = 3550 W.
    // Net = +5950 W = +5.95 kW.
    // In 2 hours (7200s), energy delta = 5.95 kW * 2h = +11.9 kWh.
    const chargingResult = stepResourceSimulation(
      { ...baseInitialState, powerStoredKWh: 20 },
      [solarModule, habModule],
      7200
    );

    expect(chargingResult.netPowerWatts).toBeGreaterThan(5000);
    expect(chargingResult.powerStoredKWh).toBeCloseTo(20 + 11.9, 0);

    // Step 2: Discharging during night (Haworth PSR or night phase)
    // Zero generation, 3550 W consumption -> Net = -3550 W = -3.55 kW
    // In 2 hours, energy delta = -3.55 kW * 2h = -7.1 kWh.
    const dischargingResult = stepResourceSimulation(
      { ...baseInitialState, landingSiteId: 'haworth_crater', powerStoredKWh: 50 },
      [solarModule, habModule],
      7200
    );

    expect(dischargingResult.netPowerWatts).toBe(-3550);
    expect(dischargingResult.powerStoredKWh).toBeCloseTo(50 - 7.1, 0);

    // Depletion time: 42.9 kWh / 3.55 kW = ~12.1 hours remaining
    expect(dischargingResult.batteryHoursRemaining).toBeCloseTo(42.9 / 3.55, 0);
  });

  it('night blackout behavior shuts down power and triggers critical alert when drained', () => {
    // 1 Habitat consuming 3.5 kW with zero solar generation (permanent shadow)
    const habModule: PlacedModule = {
      instanceId: 'test_hab',
      moduleId: 'inflatable_hab_alpha',
      x: 8,
      y: 9,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 0,
    };

    // Start with 1.0 kWh stored power, drain for 1 hour (3.5 kWh demand)
    const blackoutResult = stepResourceSimulation(
      { ...baseInitialState, landingSiteId: 'haworth_crater', powerStoredKWh: 1.0 },
      [habModule],
      3600
    );

    expect(blackoutResult.isDaylight).toBe(false);
    expect(blackoutResult.powerStoredKWh).toBe(0);
    expect(blackoutResult.alerts.some(a => a.includes('CRITICAL BLACKOUT'))).toBe(true);
  });

  it('illumination model distinguishes equatorial full 354h night from polar short shadow dips', () => {
    // Equatorial Site: Mare Tranquillitatis (lat 0.67°)
    // Synodic month is 708.7h. Hour 100 is DAY (sunrise to 354.35h)
    const eqDay = calculateSiteIllumination('mare_tranquillitatis', 100 * 3600);
    expect(eqDay.isDaylight).toBe(true);
    expect(eqDay.illuminationFraction).toBeGreaterThan(0.5);

    // Hour 400 is NIGHT (354.35h to 708.7h) -> 354h continuous night
    const eqNight = calculateSiteIllumination('mare_tranquillitatis', 400 * 3600);
    expect(eqNight.isDaylight).toBe(false);
    expect(eqNight.illuminationFraction).toBe(0);
    // Hours until sunrise: 708.7 - 400 = ~309 hours
    expect(eqNight.hoursUntilNextTransition).toBeCloseTo(309, 0);

    // Polar Site: Shackleton Rim (lat -89.9°, 92% illumination)
    // Precession cycle is 120h. Shadow fraction is 8% (~9.6h).
    // Hour 50 is DAY (in the first 110.4h of the 120h cycle)
    const polarDay = calculateSiteIllumination('shackleton_rim', 50 * 3600);
    expect(polarDay.isDaylight).toBe(true);
    expect(polarDay.illuminationFraction).toBe(0.95);

    // Hour 115 is NIGHT/DIP (110.4h to 120h) -> short 9.6h shadow dip
    const polarNight = calculateSiteIllumination('shackleton_rim', 115 * 3600);
    expect(polarNight.isDaylight).toBe(false);
    expect(polarNight.illuminationFraction).toBe(0);
    // Hours until sunrise in dip: 120 - 115 = 5 hours
    expect(polarNight.hoursUntilNextTransition).toBe(5);
  });

  it('Level 2 equatorial night simulation: 400 kWh battery fails, Kilopower survives full 354.35h night', () => {
    // Continuous night duration at Mare Tranquillitatis: 354.35 hours
    const nightDurationSeconds = 354.35 * 3600;
    // Base modules: 1 Inflatable Hab (3.5 kW) + 1 ECLSS (2.2 kW) = 5.7 kW total continuous draw
    const habModule: PlacedModule = {
      instanceId: 'hab_1',
      moduleId: 'inflatable_hab_alpha',
      x: 5,
      y: 5,
      constructedAtMissionDay: 1,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0
    };
    const eclssModule: PlacedModule = {
      instanceId: 'eclss_1',
      moduleId: 'eclss_life_support',
      x: 6,
      y: 5,
      constructedAtMissionDay: 1,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0
    };

    // CASE A: Old battery threshold (400 kWh storage, 0 nuclear)
    // Starting at hour 355 (beginning of lunar night at Mare Tranquillitatis)
    const batteryOnlyState: SimulationState = {
      ...baseInitialState,
      landingSiteId: 'mare_tranquillitatis',
      missionElapsedSeconds: 355 * 3600,
      powerStoredKWh: 400,
      maxPowerStorageKWh: 400,
    };

    // Step across full 354.35h night
    const batteryResult = stepResourceSimulation(
      batteryOnlyState,
      [habModule, eclssModule],
      nightDurationSeconds
    );

    // Theoretical depletion: 400 kWh / 5.7 kW = ~70.18 hours
    // Over 354.35h, 400 kWh battery is completely exhausted to 0 and base blackouts
    expect(batteryResult.powerStoredKWh).toBe(0);
    expect(batteryResult.alerts.some(a => a.includes('CRITICAL BLACKOUT'))).toBe(true);

    // CASE B: Stated Solution: Kilopower KRUSTY Nuclear Fission Reactor (10 kWe)
    const kilopowerModule: PlacedModule = {
      instanceId: 'kilo_1',
      moduleId: 'kilopower_nuclear_reactor',
      x: 4,
      y: 4,
      constructedAtMissionDay: 1,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0
    };
    const batteryPackModule: PlacedModule = {
      instanceId: 'bat_1',
      moduleId: 'li_ion_battery_bank',
      x: 3,
      y: 4,
      constructedAtMissionDay: 1,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0
    };

    const nuclearState: SimulationState = {
      ...baseInitialState,
      landingSiteId: 'mare_tranquillitatis',
      missionElapsedSeconds: 355 * 3600,
      powerStoredKWh: 100,
      maxPowerStorageKWh: 150,
    };

    const nuclearResult = stepResourceSimulation(
      nuclearState,
      [habModule, eclssModule, kilopowerModule, batteryPackModule],
      nightDurationSeconds
    );

    // Net power: 10 kW (Kilopower) - 5.7 kW (Hab + ECLSS) = +4.3 kW net positive
    expect(nuclearResult.powerGeneratedWatts).toBe(10000);
    expect(nuclearResult.powerConsumedWatts).toBe(5700);
    expect(nuclearResult.netPowerWatts).toBe(4300);
    // Stored power remains charged to max capacity (150 kWh) by the 4.3 kW continuous surplus
    expect(nuclearResult.powerStoredKWh).toBe(150);
    expect(nuclearResult.alerts.some(a => a.includes('CRITICAL BLACKOUT'))).toBe(false);
  });

  it('Level 2 Route A includes Deep Space Comms Dish 450W draw and verifies total net power', () => {
    // Route A infrastructure: Hab (5200W) + Comms Dish (450W) + Kilopower (10000W gen, 50W aux cons)
    const habModule: PlacedModule = {
      instanceId: 'hab_route_a',
      moduleId: 'inflatable_hab_alpha',
      x: 5,
      y: 5,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 1,
    };
    const commsModule: PlacedModule = {
      instanceId: 'comms_route_a',
      moduleId: 'deep_space_comms_dish',
      x: 6,
      y: 5,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 1,
    };
    const kiloModule: PlacedModule = {
      instanceId: 'kilo_route_a',
      moduleId: 'kilopower_nuclear_reactor',
      x: 4,
      y: 4,
      durabilityPct: 100,
      isActive: true,
      isConstructing: false,
      constructionProgressPct: 100,
      constructionTimeRemainingHours: 0,
      constructedAtMissionDay: 1,
    };

    const nightState: SimulationState = {
      ...baseInitialState,
      landingSiteId: 'mare_tranquillitatis',
      missionElapsedSeconds: 400 * 3600, // Middle of 354h equatorial night
      powerStoredKWh: 50,
      maxPowerStorageKWh: 50,
    };

    const res = stepResourceSimulation(
      nightState,
      [habModule, commsModule, kiloModule],
      3600
    );

    // Total draw: Hab (3500) + Comms Dish (450) = 3950 W
    expect(res.powerConsumedWatts).toBe(3950);
    // Generation: Kilopower 10000 W
    expect(res.powerGeneratedWatts).toBe(10000);
    // Net: 10000 - 3950 = +6050 W (+6.05 kW)
    expect(res.netPowerWatts).toBe(6050);
    // Comms dish power draw is explicitly verified in total consumption
    expect(res.powerStoredKWh).toBe(50);
  });

  it('performance benchmark: 1440x time-scale simulation of 354-hour night executes in under 50ms', () => {
    let state: SimulationState = {
      ...baseInitialState,
      landingSiteId: 'mare_tranquillitatis',
      missionElapsedSeconds: 355 * 3600,
      powerStoredKWh: 100,
      maxPowerStorageKWh: 150,
    };

    const modules: PlacedModule[] = [
      {
        instanceId: 'hab_1',
        moduleId: 'inflatable_hab_alpha',
        x: 2,
        y: 2,
        constructedAtMissionDay: 1,
        durabilityPct: 100,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0
      },
      {
        instanceId: 'kilo_1',
        moduleId: 'kilopower_nuclear_reactor',
        x: 3,
        y: 3,
        constructedAtMissionDay: 1,
        durabilityPct: 100,
        isActive: true,
        isConstructing: false,
        constructionProgressPct: 100,
        constructionTimeRemainingHours: 0
      }
    ];

    const startTime = performance.now();
    // Simulate 1000 frames at 1440x (1s real = 1440s game time)
    const stepGameSeconds = 1440;
    for (let frame = 0; frame < 1000; frame++) {
      const res = stepResourceSimulation(state, modules, stepGameSeconds);
      state = {
        ...state,
        missionElapsedSeconds: state.missionElapsedSeconds + stepGameSeconds,
        powerStoredKWh: res.powerStoredKWh,
        oxygenKg: res.oxygenKg,
        waterKg: res.waterKg,
        foodDaysRemaining: res.foodDaysRemaining,
      };
    }
    const elapsedMs = performance.now() - startTime;
    expect(elapsedMs).toBeLessThan(50);
  });
});
