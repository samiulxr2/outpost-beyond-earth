import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../useGameStore';

describe('Headless Campaign Gameplay (Levels 1 to 10 + Mars)', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  // --- LEVEL 1 ---
  it('plays and wins Level 1: First Footsteps headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 1);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');
    expect(useGameStore.getState().selectedLevelNumber).toBe(1);

    // 1. Place Vertical Solar Array (VSAT) (+10 kW in daytime)
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 6, 6)).toBe(true);

    // 2. Place Li-ion Battery Bank (+100 kWh capacity)
    expect(useGameStore.getState().placeModuleOnGrid('li_ion_battery_bank', 6, 7)).toBe(true);

    // 3. Place Surface Habitat Alpha (-3.5 kW load)
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 7, 6)).toBe(true);

    // 4. Advance time by 1 day (24 hours) to charge battery above 50 kWh
    useGameStore.getState().fastForwardDays(1);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.missionReport?.stars).toBeGreaterThanOrEqual(1);
    expect(state.unlockedLevels).toContain(2);
  });

  // --- LEVEL 2 ---
  it('plays and wins Level 2: The 354-Hour Lunar Night headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 2);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');
    expect(useGameStore.getState().landingSiteId).toBe('mare_tranquillitatis');

    // 1. Place Habitat
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 6)).toBe(true);

    // 2. Deploy Kilopower Nuclear Reactor (10 kWe continuous power)
    expect(useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 7)).toBe(true);

    // 3. Fast-forward 15 days (day 0 -> day 15, enters 354h equatorial night)
    useGameStore.getState().fastForwardDays(15);
    expect(useGameStore.getState().hasExperiencedNight).toBe(true);

    // 4. Fast-forward another 15 days (day 15 -> day 30, sunrise occurs at day 29.53)
    useGameStore.getState().fastForwardDays(15);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.powerStoredKWh).toBeGreaterThan(0);
    expect(state.oxygenKg).toBeGreaterThanOrEqual(50);
    expect(state.unlockedLevels).toContain(3);
  });

  // --- LEVEL 3 ---
  it('plays and wins Level 3: Mining the Shadows headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 3);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');

    // 1. Place VSAT Solar Array (+10 kW)
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 6, 6)).toBe(true);

    // 2. Place Thermal Ice Drill (-4.5 kW, satisfies BUILD_MODULE)
    expect(useGameStore.getState().placeModuleOnGrid('thermal_ice_drill_plant', 6, 7)).toBe(true);

    // Step a small amount of time to let power balance compute
    useGameStore.getState().fastForwardDays(1);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.unlockedLevels).toContain(4);
  });

  // --- LEVEL 4 ---
  it('plays and wins Level 4: Breath of the Regolith headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 4);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');

    // 1. Place 2x Solar Arrays (+20 kW) to power the high-temperature smelter
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 6, 6)).toBe(true);
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 6, 7)).toBe(true);

    // 2. Place MRE Oxygen Smelter (-8 kW, produces 40 kg O2/day)
    expect(useGameStore.getState().placeModuleOnGrid('mre_oxygen_smelter', 7, 6)).toBe(true);

    // 3. Fast-forward 12 days to extract > 500 kg O2
    useGameStore.getState().fastForwardDays(12);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.oxygenKg).toBeGreaterThanOrEqual(500);
    expect(state.unlockedLevels).toContain(5);
  });

  // --- LEVEL 5 ---
  it('plays and wins Level 5: The Radiation Berm headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 5);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');
    expect(useGameStore.getState().activeHazards.length).toBeGreaterThan(0);

    // 1. Place VSAT Solar Array (+10 kW continuous power)
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 6, 5)).toBe(true);

    // 2. Place Habitat
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 6)).toBe(true);

    // 3. Place Microwave Sintering 3D Construction Drone
    expect(useGameStore.getState().placeModuleOnGrid('regolith_sintering_printer', 6, 7)).toBe(true);

    // 4. Sinter 36 cm thick regolith radiation berm (2x 18 cm passes)
    expect(useGameStore.getState().buildRegolithBerm(18)).toBe(true);
    expect(useGameStore.getState().buildRegolithBerm(18)).toBe(true);
    expect(useGameStore.getState().regolithBermThicknessCm).toBe(36);

    // 5. Command astronauts into radiation storm shelter
    useGameStore.getState().toggleCrewShelter();
    expect(useGameStore.getState().crewSheltered).toBe(true);

    // 6. Fast-forward 4 days through the Solar Particle Event
    useGameStore.getState().fastForwardDays(4);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.cumulativeRadiationDoseMSv).toBeLessThan(25);
    expect(state.hazardsSurvivedCount).toBeGreaterThanOrEqual(1);
    expect(state.unlockedLevels).toContain(6);
  });

  // --- LEVEL 6 ---
  it('plays and wins Level 6: The Volatiles Rover Network headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 6);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');

    // 1. Place Rover Garage
    expect(useGameStore.getState().placeModuleOnGrid('prospecting_rover_garage', 6, 6)).toBe(true);

    // 2. Drive Rover 2200m and locate 7.5% cryogenic ice
    useGameStore.getState().driveRover(2200, 7.5);
    expect(useGameStore.getState().roverDistanceTraversedMeters).toBeGreaterThanOrEqual(2000);
    expect(useGameStore.getState().iceProspectingDetectedPct).toBeGreaterThanOrEqual(5.0);

    // 3. Place Deep Space Comms Dish
    expect(useGameStore.getState().placeModuleOnGrid('deep_space_comms_dish', 6, 7)).toBe(true);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.unlockedLevels).toContain(7);
  });

  it('triggers defeat for Level 6 if operational duration expires without rover sorties', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 6);

    // Fast-forward past missionDurationDays (60 days)
    useGameStore.getState().fastForwardDays(65);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('DEFEAT');
    expect(state.missionReport?.defeatReason).toBeTruthy();
  });

  // --- LEVEL 7 ---
  it('plays and wins Level 7: In-Situ Fuel Depot headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 7);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');

    // 1. Deploy Kilopower Nuclear Reactor for continuous power
    expect(useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 6)).toBe(true);

    // 2. Build Cryogenic Propellant Depot (+50,000 kg capacity, +250 kg/day production)
    expect(useGameStore.getState().placeModuleOnGrid('cryo_propellant_depot', 6, 7)).toBe(true);

    // 3. Build Thermal Ice Drill
    expect(useGameStore.getState().placeModuleOnGrid('thermal_ice_drill_plant', 7, 6)).toBe(true);

    // 4. Fast-forward 18 days: 500 starting kg + (18 * 250 kg/day) = 5,000 kg propellant
    useGameStore.getState().fastForwardDays(18);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.propellantKg).toBeGreaterThanOrEqual(5000);
    expect(state.unlockedLevels).toContain(8);
  });

  it('triggers defeat for Level 7 if operational duration expires without building depot', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 7);

    // Fast-forward past missionDurationDays (80 days)
    useGameStore.getState().fastForwardDays(85);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('DEFEAT');
    expect(state.missionReport?.defeatReason).toBeTruthy();
  });

  // --- LEVEL 8 ---
  it('plays and wins Level 8: The Century Storm headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 8);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');

    // 1. Deploy Kilopower Nuclear Reactor
    expect(useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 6)).toBe(true);

    // 2. Deploy Surface Habitat
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 7)).toBe(true);

    // 3. Deploy Regolith Sintering Printer & build 36cm radiation berm
    expect(useGameStore.getState().placeModuleOnGrid('regolith_sintering_printer', 7, 6)).toBe(true);
    expect(useGameStore.getState().buildRegolithBerm(18)).toBe(true);
    expect(useGameStore.getState().buildRegolithBerm(18)).toBe(true);
    expect(useGameStore.getState().regolithBermThicknessCm).toBe(36);

    // 4. Shelter crew from extreme solar particle event
    useGameStore.getState().toggleCrewShelter();
    expect(useGameStore.getState().crewSheltered).toBe(true);

    // 5. Fast-forward 6 days through storm
    useGameStore.getState().fastForwardDays(6);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.cumulativeRadiationDoseMSv).toBeLessThan(25);
    expect(state.unlockedLevels).toContain(9);
  });

  it('triggers defeat for Level 8 if crew is unsheltered with no berm during storm', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 8);

    // Place hab, but no berm and crew remains unsheltered
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 6)).toBe(true);

    // Fast-forward past mission duration (90 days) with dose failing the <25 mSv threshold
    useGameStore.getState().fastForwardDays(95);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('DEFEAT');
    expect(state.missionReport?.defeatReason).toBeTruthy();
  });

  // --- LEVEL 9 ---
  it('plays and wins Level 9: Gateway Supply Relay headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 9);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');
    expect(useGameStore.getState().landingSiteId).toBe('malapert_mountain');

    // 1. Deploy Kilopower Nuclear Reactor
    expect(useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 6)).toBe(true);

    // 2. Deploy Deep Space Comms Dish
    expect(useGameStore.getState().placeModuleOnGrid('deep_space_comms_dish', 6, 7)).toBe(true);

    // 3. Deploy Cryo Propellant Depot (+50,000 kg capacity, +250 kg/day)
    expect(useGameStore.getState().placeModuleOnGrid('cryo_propellant_depot', 7, 6)).toBe(true);

    // 4. Deploy Thermal Ice Drill (+80 kg water/day)
    expect(useGameStore.getState().placeModuleOnGrid('thermal_ice_drill_plant', 7, 7)).toBe(true);

    // 5. Fast-forward 8 days: 1500 + (8 * 250) = 3500 kg propellant (>= 3000), water >= 600 kg
    useGameStore.getState().fastForwardDays(8);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.propellantKg).toBeGreaterThanOrEqual(3000);
    expect(state.waterKg).toBeGreaterThanOrEqual(600);
    expect(state.unlockedLevels).toContain(10);
  });

  it('triggers defeat for Level 9 if operational duration expires without supply depot', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 9);

    // Fast-forward past missionDurationDays (120 days)
    useGameStore.getState().fastForwardDays(125);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('DEFEAT');
    expect(state.missionReport?.defeatReason).toBeTruthy();
  });

  // --- LEVEL 10 ---
  it('plays and wins Level 10: Expedition Artemis Base Camp (180 Days) headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 10);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');

    // 1. Deploy continuous nuclear and solar power infrastructure
    expect(useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 6)).toBe(true);
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 5, 5)).toBe(true);
    expect(useGameStore.getState().placeModuleOnGrid('vsat_solar_array', 5, 6)).toBe(true);
    expect(useGameStore.getState().placeModuleOnGrid('li_ion_battery_bank', 5, 7)).toBe(true);

    // 2. Deploy Surface Habitat
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 7)).toBe(true);

    // 3. Deploy ECLSS Life Support (+3.36 kg O2/day, closed-loop water recovery)
    expect(useGameStore.getState().placeModuleOnGrid('eclss_life_support', 7, 6)).toBe(true);

    // 4. Deploy Microwave Sintering Drone & build 36cm radiation berm
    expect(useGameStore.getState().placeModuleOnGrid('regolith_sintering_printer', 7, 7)).toBe(true);
    expect(useGameStore.getState().buildRegolithBerm(18)).toBe(true);
    expect(useGameStore.getState().buildRegolithBerm(18)).toBe(true);
    expect(useGameStore.getState().regolithBermThicknessCm).toBe(36);

    // 5. Deploy Cryo Propellant Depot (+250 kg/day propellant)
    expect(useGameStore.getState().placeModuleOnGrid('cryo_propellant_depot', 8, 6)).toBe(true);

    // 6. Deploy Thermal Ice Drill (+80 kg water/day) to sustain 180-day consumption
    expect(useGameStore.getState().placeModuleOnGrid('thermal_ice_drill_plant', 8, 7)).toBe(true);

    // 7. Shelter crew in berm
    useGameStore.getState().toggleCrewShelter();

    // 8. Fast-forward full 180 days (crosses Day 30 MM, Day 70 Extreme SPE, Day 120 MM)
    useGameStore.getState().fastForwardDays(180);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.missionElapsedDays).toBeGreaterThanOrEqual(180);
    expect(state.propellantKg).toBeGreaterThanOrEqual(5000);
    expect(state.powerStoredKWh).toBeGreaterThan(0);
    expect(state.oxygenKg).toBeGreaterThan(0);
  });

  it('triggers defeat for Level 10 if habitat is placed without ECLSS life support', () => {
    const store = useGameStore.getState();
    store.loadLevel(1, 10);

    // Place habitat with 4 crew consuming 3.36 kg O2/day without ECLSS
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 6)).toBe(true);

    // Starting O2 is 500 kg. In 160 days, crew consumes 160 * 3.36 = 537.6 kg O2 -> depletion
    useGameStore.getState().fastForwardDays(160);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('DEFEAT');
    expect(state.missionReport?.defeatReason).toContain('Oxygen depletion');
  });

  // --- SEASON 2 MARS LEVEL 1 ---
  it('plays and wins Season 2 Mars Level 1: Jezero Delta & MOXIE Oxygen headlessly', () => {
    const store = useGameStore.getState();
    store.loadLevel(2, 1);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');
    expect(useGameStore.getState().landingSiteId).toBe('jezero_crater');

    // 1. Place Habitat
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 6)).toBe(true);

    // 2. Deploy Kilopower Nuclear Reactor (+10 kW continuous baseload on Mars)
    expect(useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 7)).toBe(true);

    // 3. Deploy MOXIE Atmospheric CO2 Solid Oxide Electrolyzer (-3.2 kW, +24 kg O2/day)
    expect(useGameStore.getState().placeModuleOnGrid('moxie_oxygen_generator', 7, 6)).toBe(true);

    // 4. Fast forward 6 days (24 kg/day - 3.36 kg/day crew = ~20.6 kg/day net * 6 = ~123 kg -> 100 + 123 = 223 kg >= 200 kg)
    useGameStore.getState().fastForwardDays(6);

    // Assert victory
    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('VICTORY');
    expect(state.oxygenKg).toBeGreaterThanOrEqual(200);
  });

  it('triggers defeat for Mars Level 1 if habitat is placed without MOXIE oxygen generation', () => {
    const store = useGameStore.getState();
    store.loadLevel(2, 1);

    // Place habitat with 4 crew consuming 3.36 kg O2/day without MOXIE
    expect(useGameStore.getState().placeModuleOnGrid('inflatable_hab_alpha', 6, 6)).toBe(true);

    // Starting O2 is 100 kg. In 35 days, crew consumes 35 * 3.36 = 117.6 kg O2 -> depletion
    useGameStore.getState().fastForwardDays(35);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('MISSION_REPORT');
    expect(state.missionReport?.status).toBe('DEFEAT');
    expect(state.missionReport?.defeatReason).toContain('Oxygen depletion');
  });

  // --- FAST 2-MINUTE NASA DEMO ---
  it('instant 2-minute demo mode initializes complete thriving settlement', () => {
    useGameStore.getState().startDemoMode();

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('BASE_BUILDER');
    expect(state.placedModules.length).toBe(9);
    expect(state.regolithBermThicknessCm).toBe(54);
    expect(state.crewSheltered).toBe(true);
    expect(state.activeHazards.length).toBe(1);
    expect(state.activeHazards[0].hazardId).toBe('solar_particle_event_x_class');
    expect(state.roverDistanceTraversedMeters).toBeGreaterThan(2000);
    expect(state.iceProspectingDetectedPct).toBeGreaterThan(5.0);
    expect(state.netPowerWatts).toBeGreaterThan(10000);
    expect(state.objectives.every(o => o.completed)).toBe(true);
  });
});
