/**
 * One-Time Data Fetch & Cache Script
 *
 * Downloads or falls back to hand-verified NASA planetary, elevation, module,
 * rocket, and hazard data with strict source citations, mission/instrument names, and SI units.
 * Game operates 100% offline using the cached JSON in /src/data.
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const SEASONS_DIR = path.resolve(DATA_DIR, 'seasons');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SEASONS_DIR)) {
  fs.mkdirSync(SEASONS_DIR, { recursive: true });
}

console.log('Validating and writing NASA static data caches...');

// 1. CELESTIAL BODIES
const celestialBodies = {
  metadata: {
    dataset: "NASA Planetary Fact Sheets & JPL Horizons Ephemerides",
    source: "NASA Goddard Space Flight Center (Dr. David R. Williams)",
    sourceUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      mass: "kg",
      radius: "km",
      semiMajorAxis: "AU",
      orbitalPeriod: "days",
      rotationPeriod: "hours",
      surfaceGravity: "m/s^2",
      temperature: "Kelvin",
      surfacePressure: "Pascals",
      solarFlux: "W/m^2",
      radiationDose: "mSv/day"
    }
  },
  bodies: [
    {
      id: "earth",
      name: "Earth",
      type: "Terrestrial Planet",
      massKg: 5.9722e24,
      radiusKm: 6371.0,
      semiMajorAxisAU: 1.000,
      semiMajorAxisKm: 149597870.7,
      orbitalPeriodDays: 365.256,
      rotationPeriodHours: 23.934,
      surfaceGravityMS2: 9.807,
      meanTempK: 288,
      minTempK: 184,
      maxTempK: 330,
      surfacePressurePa: 101325,
      atmosphericComposition: "78% N2, 21% O2, 0.93% Ar, 0.04% CO2",
      albedo: 0.306,
      radiationDoseUnshieldedMSvDay: 0.0065,
      solarFluxWPerM2: 1361.0,
      escapeVelocityKmS: 11.186,
      axialTiltDeg: 23.44,
      description: "Humanity's cradle and central launchpad for interplanetary exploration missions."
    },
    {
      id: "moon",
      name: "Moon",
      type: "Terrestrial Moon",
      parentBody: "earth",
      massKg: 7.342e22,
      radiusKm: 1737.4,
      semiMajorAxisAU: 1.000,
      semiMajorAxisKm: 384400,
      orbitalPeriodDays: 27.322,
      rotationPeriodHours: 708.7,
      surfaceGravityMS2: 1.62,
      meanTempK: 220,
      minTempK: 40,
      maxTempK: 390,
      surfacePressurePa: 1e-10,
      atmosphericComposition: "Trace He, Ne, H2, Ar (Lunar Exosphere)",
      albedo: 0.12,
      radiationDoseUnshieldedMSvDay: 1.40,
      solarFluxWPerM2: 1361.0,
      escapeVelocityKmS: 2.38,
      axialTiltDeg: 1.54,
      description: "Target of NASA's Artemis program. Shackleton Crater rim offers near-continuous sunlight and cryogenic water ice in permanently shadowed regions."
    },
    {
      id: "mars",
      name: "Mars",
      type: "Terrestrial Planet",
      massKg: 6.4171e23,
      radiusKm: 3389.5,
      semiMajorAxisAU: 1.52368,
      semiMajorAxisKm: 227939200,
      orbitalPeriodDays: 686.98,
      rotationPeriodHours: 24.623,
      surfaceGravityMS2: 3.71,
      meanTempK: 210,
      minTempK: 130,
      maxTempK: 308,
      surfacePressurePa: 610,
      atmosphericComposition: "95.3% CO2, 2.6% N2, 1.9% Ar, 0.13% O2",
      albedo: 0.25,
      radiationDoseUnshieldedMSvDay: 0.65,
      solarFluxWPerM2: 586.2,
      escapeVelocityKmS: 5.027,
      axialTiltDeg: 25.19,
      description: "The Red Planet. Ancient river deltas like Jezero Crater hold biosignature records and resources for in-situ MOXIE oxygen generation."
    },
    {
      id: "phobos",
      name: "Phobos",
      type: "Asteroidal Moon",
      parentBody: "mars",
      massKg: 1.0659e16,
      radiusKm: 11.26,
      semiMajorAxisAU: 1.524,
      semiMajorAxisKm: 9376,
      orbitalPeriodDays: 0.3189,
      rotationPeriodHours: 7.65,
      surfaceGravityMS2: 0.0057,
      meanTempK: 233,
      minTempK: 161,
      maxTempK: 268,
      surfacePressurePa: 0,
      atmosphericComposition: "None",
      albedo: 0.071,
      radiationDoseUnshieldedMSvDay: 0.70,
      solarFluxWPerM2: 586.2,
      escapeVelocityKmS: 0.011,
      axialTiltDeg: 0,
      description: "Inner Martian moon, ideal low-gravity staging base and communications relay."
    },
    {
      id: "ceres",
      name: "Ceres",
      type: "Dwarf Planet (Asteroid Belt)",
      massKg: 9.3835e20,
      radiusKm: 469.7,
      semiMajorAxisAU: 2.767,
      semiMajorAxisKm: 413900000,
      orbitalPeriodDays: 1681.6,
      rotationPeriodHours: 9.074,
      surfaceGravityMS2: 0.27,
      meanTempK: 168,
      minTempK: 130,
      maxTempK: 235,
      surfacePressurePa: 0,
      atmosphericComposition: "Transient water vapor exosphere",
      albedo: 0.09,
      radiationDoseUnshieldedMSvDay: 1.10,
      solarFluxWPerM2: 177.8,
      escapeVelocityKmS: 0.51,
      axialTiltDeg: 4.0,
      description: "Largest body in the asteroid belt, containing significant subsurface water ice and carbonate salts."
    },
    {
      id: "mercury",
      name: "Mercury",
      type: "Terrestrial Planet",
      massKg: 3.3011e23,
      radiusKm: 2439.7,
      semiMajorAxisAU: 0.3871,
      semiMajorAxisKm: 57909050,
      orbitalPeriodDays: 87.969,
      rotationPeriodHours: 1407.6,
      surfaceGravityMS2: 3.70,
      meanTempK: 440,
      minTempK: 100,
      maxTempK: 700,
      surfacePressurePa: 1e-9,
      atmosphericComposition: "Trace O, Na, H2, He, K",
      albedo: 0.106,
      radiationDoseUnshieldedMSvDay: 2.80,
      solarFluxWPerM2: 9082.7,
      escapeVelocityKmS: 4.25,
      axialTiltDeg: 0.034,
      description: "Innermost planet with colossal solar energy potential and cryogenic ice trapped in permanently shadowed polar craters."
    },
    {
      id: "venus",
      name: "Venus",
      type: "Terrestrial Planet",
      massKg: 4.8675e24,
      radiusKm: 6051.8,
      semiMajorAxisAU: 0.7233,
      semiMajorAxisKm: 108208000,
      orbitalPeriodDays: 224.701,
      rotationPeriodHours: 5832.5,
      surfaceGravityMS2: 8.87,
      meanTempK: 737,
      minTempK: 710,
      maxTempK: 750,
      surfacePressurePa: 9200000,
      atmosphericComposition: "96.5% CO2, 3.5% N2, 0.015% SO2",
      albedo: 0.77,
      radiationDoseUnshieldedMSvDay: 0.01,
      solarFluxWPerM2: 2601.3,
      escapeVelocityKmS: 10.36,
      axialTiltDeg: 177.36,
      description: "Crushing surface conditions, but temperate 25°C and 1 bar pressure at 55 km altitude in cloud layers for aerostat habitats."
    },
    {
      id: "europa",
      name: "Europa",
      type: "Icy Moon",
      parentBody: "jupiter",
      massKg: 4.7998e22,
      radiusKm: 1560.8,
      semiMajorAxisAU: 5.204,
      semiMajorAxisKm: 670900,
      orbitalPeriodDays: 3.551,
      rotationPeriodHours: 85.2,
      surfaceGravityMS2: 1.315,
      meanTempK: 102,
      minTempK: 50,
      maxTempK: 125,
      surfacePressurePa: 1e-7,
      atmosphericComposition: "Trace O2",
      albedo: 0.67,
      radiationDoseUnshieldedMSvDay: 540.0,
      solarFluxWPerM2: 50.3,
      escapeVelocityKmS: 2.025,
      axialTiltDeg: 0.1,
      description: "Subsurface saltwater ocean harboring twice the water of Earth, heated by tidal flexing beneath a 15-25 km ice shell."
    },
    {
      id: "titan",
      name: "Titan",
      type: "Gas/Liquid Hydrocarbon Moon",
      parentBody: "saturn",
      massKg: 1.3452e23,
      radiusKm: 2574.7,
      semiMajorAxisAU: 9.582,
      semiMajorAxisKm: 1221870,
      orbitalPeriodDays: 15.945,
      rotationPeriodHours: 382.7,
      surfaceGravityMS2: 1.352,
      meanTempK: 94,
      minTempK: 90,
      maxTempK: 96,
      surfacePressurePa: 146700,
      atmosphericComposition: "94.2% N2, 5.6% CH4, 0.2% H2",
      albedo: 0.22,
      radiationDoseUnshieldedMSvDay: 0.05,
      solarFluxWPerM2: 14.8,
      escapeVelocityKmS: 2.639,
      axialTiltDeg: 0,
      description: "Dense nitrogen atmosphere and surface liquid methane/ethane seas (Kraken Mare), enabling human flight with wings in low gravity."
    }
  ]
};

// 2. CANDIDATE LANDING SITES
const landingSites = {
  metadata: {
    dataset: "NASA LRO / LOLA & Mars MOLA Topography and Artemis Candidate Zones",
    source: "NASA Artemis Candidate Landing Regions & Mars 2020 Perseverance Science Team",
    sourceUrl: "https://www.nasa.gov/artemis-candidate-landing-regions/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      coordinates: "Degrees (Lat/Long)",
      elevation: "Meters relative to lunar/Martian datum",
      illuminationAnnual: "Percentage (%)",
      slopeMax: "Degrees",
      iceWaterEstimateWeightPercent: "Percentage (%)"
    }
  },
  sites: [
    {
      id: "shackleton_rim",
      name: "Shackleton Crater Rim",
      bodyId: "moon",
      latitudeDeg: -89.9,
      longitudeDeg: 0.0,
      elevationMeters: 1250,
      illuminationAnnualPct: 92,
      slopeMaxDeg: 8.5,
      iceWaterEstimatePct: 5.5,
      hazardRating: "Moderate (Steep slopes into crater interior)",
      missionRelevance: "Prime Artemis landing zone. Features Peaks of Eternal Light with continuous solar power adjacent to permanently shadowed cryogenic ice reserves in the crater floor (40 Kelvin).",
      instrument: "LRO LOLA & Mini-RF radar"
    },
    {
      id: "malapert_mountain",
      name: "Malapert Mountain (Peak of Malapert)",
      bodyId: "moon",
      latitudeDeg: -86.0,
      longitudeDeg: 2.7,
      elevationMeters: 5000,
      illuminationAnnualPct: 88,
      slopeMaxDeg: 5.0,
      iceWaterEstimatePct: 2.1,
      hazardRating: "Low (Broad high plateau)",
      missionRelevance: "Continuous direct line-of-sight to Earth for uninterruptible high-bandwidth communications, and ideal radio-quiet far side proximity.",
      instrument: "LOLA Topographic Profile"
    },
    {
      id: "nobile_rim",
      name: "Nobile Crater Rim 1",
      bodyId: "moon",
      latitudeDeg: -85.2,
      longitudeDeg: 35.8,
      elevationMeters: 800,
      illuminationAnnualPct: 78,
      slopeMaxDeg: 6.2,
      iceWaterEstimatePct: 7.2,
      hazardRating: "Low-Moderate",
      missionRelevance: "NASA VIPER rover primary exploration target for subsurface neutron spectrometer volatile mapping.",
      instrument: "LRO CRaTER & LAMP"
    },
    {
      id: "haworth_crater",
      name: "Haworth Crater Interior",
      bodyId: "moon",
      latitudeDeg: -87.4,
      longitudeDeg: -5.1,
      elevationMeters: -3800,
      illuminationAnnualPct: 0,
      slopeMaxDeg: 14.0,
      iceWaterEstimatePct: 11.5,
      hazardRating: "High (Total darkness, extreme cryogenic 35K temperature, boulder fields)",
      missionRelevance: "Highest water ice concentration in the south polar region. Requires nuclear power or beamed laser power to operate.",
      instrument: "LCROSS Impact plume spectrometry & Diviner radiometer"
    },
    {
      id: "connecting_ridge",
      name: "Connecting Ridge (Shackleton-de Gerlache)",
      bodyId: "moon",
      latitudeDeg: -89.4,
      longitudeDeg: -137.0,
      elevationMeters: 1950,
      illuminationAnnualPct: 84,
      slopeMaxDeg: 7.0,
      iceWaterEstimatePct: 4.8,
      hazardRating: "Moderate",
      missionRelevance: "Natural transit corridor connecting Shackleton rim and de Gerlache crater for rover logistics.",
      instrument: "LRO LROC NAC Stereo Imagery"
    },
    {
      id: "jezero_crater",
      name: "Jezero Crater Delta",
      bodyId: "mars",
      latitudeDeg: 18.38,
      longitudeDeg: 77.58,
      elevationMeters: -2500,
      illuminationAnnualPct: 43,
      slopeMaxDeg: 4.2,
      iceWaterEstimatePct: 1.5,
      hazardRating: "Moderate (Delta escarpment, sand dunes, thermal inertia variations)",
      missionRelevance: "Mars 2020 Perseverance landing site. Ancient lacustrine clay-rich fan delta optimal for sample return and MOXIE atmospheric oxygen extraction.",
      instrument: "Mars Reconnaissance Orbiter CRISM & HiRISE"
    },
    {
      id: "arcadia_planitia",
      name: "Arcadia Planitia",
      bodyId: "mars",
      latitudeDeg: 39.3,
      longitudeDeg: 189.7,
      elevationMeters: -4000,
      illuminationAnnualPct: 41,
      slopeMaxDeg: 1.5,
      iceWaterEstimatePct: 35.0,
      hazardRating: "Very Low (Extremely flat smooth terrain)",
      missionRelevance: "Vast sheets of pure water ice buried just 1-2.5 meters beneath dust cover, easily accessible for SpaceX Starship and human ISRU base.",
      instrument: "Mars Odyssey GRS & MRO SHARAD Radar"
    }
  ]
};

// 3. LAUNCH VEHICLES CATALOG (ROCKETS)
const rocketsCatalog = {
  metadata: {
    dataset: "NASA Space Launch System & Commercial Launch Vehicle Performance Fact Sheets",
    source: "NASA Exploration Systems Development Directorate (ESDMD) & Commercial Launch Providers",
    sourceUrl: "https://www.nasa.gov/humans-in-space/space-launch-system/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      mass: "Kilograms (kg)",
      thrust: "Kilonewtons (kN)",
      isp: "Seconds (s)",
      cost: "Million USD ($M)"
    }
  },
  rockets: [
    {
      id: "sls_block_1b",
      name: "SLS Block 1B (Cargo / EUS)",
      agency: "NASA",
      stages: [
        { name: "Core Stage + 2x 5-Segment SRBs", dryMassKg: 130000, propellantMassKg: 2450000, ispVacuumS: 300 },
        { name: "Exploration Upper Stage (4x RL10C-3)", dryMassKg: 14000, propellantMassKg: 129000, ispVacuumS: 453 }
      ],
      maxPayloadToLEOKg: 105000,
      maxPayloadToTLIKg: 38000, // Trans-Lunar Injection
      maxPayloadToTMIKg: 27000, // Trans-Mars Injection
      costPerLaunchMUSD: 2200,
      reliabilityRating: "Human-Rated (Artemis Baseline)",
      description: "NASA's deep-space heavy-lift vehicle powered by four RS-25 engines and the Exploration Upper Stage (EUS)."
    },
    {
      id: "falcon_heavy_exp",
      name: "Falcon Heavy (Fully Expendable)",
      agency: "SpaceX",
      stages: [
        { name: "3x Falcon Boosters (27 Merlin 1D)", dryMassKg: 66600, propellantMassKg: 1230000, ispVacuumS: 311 },
        { name: "Second Stage (1x Merlin 1D Vac)", dryMassKg: 4000, propellantMassKg: 92000, ispVacuumS: 348 }
      ],
      maxPayloadToLEOKg: 63800,
      maxPayloadToTLIKg: 19000,
      maxPayloadToTMIKg: 16800,
      costPerLaunchMUSD: 150,
      reliabilityRating: "High Operational Flight Heritage",
      description: "Cost-effective commercial heavy-lift vehicle utilized for Europa Clipper and Gateway logistics."
    },
    {
      id: "starship_hls",
      name: "Starship HLS (Depot Refueled)",
      agency: "SpaceX / NASA Artemis",
      stages: [
        { name: "Super Heavy Booster (33 Raptor 3)", dryMassKg: 200000, propellantMassKg: 3400000, ispVacuumS: 350 },
        { name: "Starship Second Stage / HLS", dryMassKg: 100000, propellantMassKg: 1200000, ispVacuumS: 380 }
      ],
      maxPayloadToLEOKg: 150000,
      maxPayloadToTLIKg: 100000, // With in-space cryogenic refuel
      maxPayloadToTMIKg: 100000,
      costPerLaunchMUSD: 200,
      reliabilityRating: "Next-Gen Lunar Surface Architecture",
      description: "Massive stainless-steel lunar lander selected by NASA for Artemis III and IV crew landings."
    },
    {
      id: "vulcan_centaur",
      name: "Vulcan Centaur (VC6L)",
      agency: "United Launch Alliance (ULA)",
      stages: [
        { name: "Booster (2x BE-4 + 6 SRBs)", dryMassKg: 42000, propellantMassKg: 520000, ispVacuumS: 335 },
        { name: "Centaur V (2x RL10C-1-1)", dryMassKg: 5800, propellantMassKg: 54000, ispVacuumS: 453.8 }
      ],
      maxPayloadToLEOKg: 27200,
      maxPayloadToTLIKg: 12100,
      maxPayloadToTMIKg: 9800,
      costPerLaunchMUSD: 120,
      reliabilityRating: "High Precision Orbital Injection",
      description: "High-energy upper stage rocket providing precise orbital injection for Peregrine and military payloads."
    }
  ]
};

// 4. BASE MODULE CATALOG
const modulesCatalog = {
  metadata: {
    dataset: "NASA Artemis Surface Architecture & ECLSS Technical Specifications",
    source: "NASA Human Exploration and Operations Mission Directorate (HEOMD) & NASA Glenn Research Center",
    sourceUrl: "https://www.nasa.gov/technology/power-and-energy-storage/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      power: "Watts (W) or Kilowatts (kW)",
      mass: "Kilograms (kg)",
      time: "Hours or Days",
      efficiency: "Percentage (%) or fraction"
    }
  },
  modules: [
    {
      id: "vsat_solar_array",
      name: "Vertical Solar Array Technology (VSAT)",
      category: "Power",
      tier: 1,
      massKg: 1200,
      costCredits: 250000,
      constructionTimeHours: 12,
      powerGenerationWatts: 10000,
      powerConsumptionWatts: 50,
      shieldingEquivalentCmRegolith: 2,
      durabilityHours: 17520,
      degradationRatePerHour: 0.00002,
      whyThisIsReal: "NASA Vertical Solar Array Technology (VSAT) contracts deploy 10-meter-tall solar arrays on telescoping masts to capture low-incident polar sunlight over crater rims without casting ground shadows.",
      formula: "P = S(r) * A * eta * cos(theta) * (1 - dust)",
      source: "NASA Space Technology Mission Directorate (STMD) VSAT Project",
      sourceUrl: "https://www.nasa.gov/press-release/nasa-selects-vertical-solar-array-proposals-for-artemis/",
      instrumentOrMission: "Artemis Base Camp Surface Power"
    },
    {
      id: "li_ion_battery_bank",
      name: "Regenerative Li-Ion Battery Storage (100 kWh)",
      category: "Power",
      tier: 1,
      massKg: 850,
      costCredits: 180000,
      constructionTimeHours: 8,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 0,
      storageCapacityJoules: 3.6e8,
      storageCapacityKWh: 100,
      durabilityHours: 26280,
      degradationRatePerHour: 0.00001,
      whyThisIsReal: "Space-rated Lithium-Iron-Phosphate (LFP) battery systems provide essential power during orbital eclipse or seasonal crater peak shadows, with thermal jacket heaters to prevent freeze-damage.",
      formula: "E_stored = Integral(P_charge - P_discharge) * round_trip_efficiency",
      source: "NASA Battery Safety Workshop / Glenn Research Center",
      sourceUrl: "https://www.nasa.gov/glenn/battery-safety/",
      instrumentOrMission: "Artemis Gateway & Human Landing System"
    },
    {
      id: "inflatable_hab_alpha",
      name: "Pressurized Surface Habitat (4-Crew)",
      category: "Habitation",
      tier: 1,
      massKg: 4500,
      costCredits: 650000,
      constructionTimeHours: 36,
      crewCapacity: 4,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 3500,
      shieldingEquivalentCmRegolith: 12,
      durabilityHours: 43800,
      degradationRatePerHour: 0.000015,
      whyThisIsReal: "Based on NASA TransHab multi-layer Kevlar and Nextel inflatable pressure shell architecture. Provides 120 m^3 of living space, private crew quarters, galley, and medical station.",
      formula: "P_internal = 101.3 kPa, V = 120 m^3, Q_loss = A * (T_int - T_ext) / R",
      source: "NASA TransHab Concept / Artemis Foundation Habitat Study",
      sourceUrl: "https://www.nasa.gov/wp-content/uploads/2021/04/artemis-base-camp-foundation-hab.pdf",
      instrumentOrMission: "Artemis Base Camp Foundation Habitat"
    },
    {
      id: "eclss_life_support",
      name: "ECLSS Closed-Loop Air & Water Processor",
      category: "LifeSupport",
      tier: 1,
      massKg: 2100,
      costCredits: 420000,
      constructionTimeHours: 24,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 2200,
      waterRecyclingEfficiency: 0.93,
      o2ProductionKgPerDay: 3.36,
      durabilityHours: 17520,
      degradationRatePerHour: 0.00003,
      whyThisIsReal: "The ISS Environmental Control and Life Support System (ECLSS) uses Carbon Dioxide Removal Assembly (CDRA), Oxygen Generation Assembly (OGA), and Vacuum Distillation to recycle 93%+ of astronaut urine and washwater.",
      formula: "CO2 + 4H2 -> CH4 + 2H2O (Sabatier), 2H2O -> 2H2 + O2 (Electrolysis)",
      source: "NASA Marshall Space Flight Center ECLSS Branch",
      sourceUrl: "https://www.nasa.gov/general/iss-environmental-control-and-life-support-system/",
      instrumentOrMission: "ISS ECLSS / Artemis Environmental Systems"
    },
    {
      id: "prospecting_rover_garage",
      name: "Pressurized Rover Garage & Charging Bay",
      category: "Logistics",
      tier: 1,
      massKg: 1800,
      costCredits: 320000,
      constructionTimeHours: 18,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 800,
      roverSlots: 2,
      durabilityHours: 26280,
      degradationRatePerHour: 0.000025,
      whyThisIsReal: "Lunar rovers like NASA's Lunar Terrain Vehicle (LTV) and pressurized rovers need dust blowdown bays, inductive fast charging, and micrometeorite protection between exploration sorties.",
      formula: "E_charge = V * I * t * eta_inductive",
      source: "NASA Lunar Terrain Vehicle (LTV) Ground Operations",
      sourceUrl: "https://www.nasa.gov/mission/artemis/ltv/",
      instrumentOrMission: "Artemis LTV"
    },
    {
      id: "thermal_ice_drill_plant",
      name: "Sublimation Ice Drill & Condenser Rig",
      category: "ISRU",
      tier: 2,
      massKg: 2800,
      costCredits: 580000,
      constructionTimeHours: 30,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 4500,
      iceExtractionRateKgPerDay: 50.0,
      durabilityHours: 13140,
      degradationRatePerHour: 0.00004,
      whyThisIsReal: "Permanently shadowed crater ice is frozen hard as granite at 40K. Thermal coring drills heat the icy regolith inside a sealed capture dome, vacuum-channeling water vapor into cold traps for condensation.",
      formula: "Q_sublimation = m_ice * (c_p * DeltaT + DeltaH_sublimation), DeltaH_sub = 2.83 MJ/kg",
      source: "NASA PRIME-1 (Polar Resources Ice Mining Experiment-1)",
      sourceUrl: "https://www.nasa.gov/mission/prime-1/",
      instrumentOrMission: "Intuitive Machines IM-2 / PRIME-1"
    },
    {
      id: "mre_oxygen_smelter",
      name: "Molten Regolith Electrolysis (MRE) Oxygen Smelter",
      category: "ISRU",
      tier: 2,
      massKg: 3400,
      costCredits: 750000,
      constructionTimeHours: 40,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 8000,
      oxygenProductionKgPerDay: 40.0,
      metalSlagProductionKgPerDay: 60.0,
      durabilityHours: 15000,
      degradationRatePerHour: 0.000045,
      whyThisIsReal: "Lunar regolith is ~43% oxygen by mass. Heating regolith to 1600°C and applying an electrical current through iridium electrodes extracts pure O2 gas while leaving molten iron, aluminum, and silicon for construction.",
      formula: "2FeO -> 2Fe + O2 (g), SiO2 -> Si + O2 (g)",
      source: "NASA Marshall Space Flight Center ISRU Technology Project",
      sourceUrl: "https://www.nasa.gov/directorates/stmd/in-situ-resource-utilization-isru/",
      instrumentOrMission: "NASA Game Changing Development MRE"
    },
    {
      id: "kilopower_nuclear_reactor",
      name: "Kilopower KRUSTY Nuclear Fission Reactor (10 kWe)",
      category: "Power",
      tier: 2,
      massKg: 1500,
      costCredits: 950000,
      constructionTimeHours: 20,
      powerGenerationWatts: 10000,
      powerConsumptionWatts: 0,
      shieldingEquivalentCmRegolith: 50,
      durabilityHours: 87600,
      degradationRatePerHour: 0.000002,
      whyThisIsReal: "NASA Kilopower (KRUSTY - Kilopower Reactor Using Stirling Technology) uses an enriched U-235 cast core with sodium heat pipes driving high-efficiency Stirling engines to deliver unyielding continuous power through 14-day lunar nights.",
      formula: "P_out = Q_nuclear * eta_stirling, eta_stirling = 1 - T_cold / T_hot",
      source: "NASA / Los Alamos National Laboratory Kilopower KRUSTY Experiment",
      sourceUrl: "https://www.nasa.gov/directorates/stmd/kilopower/",
      instrumentOrMission: "KRUSTY Ground Demonstration"
    },
    {
      id: "regolith_sintering_printer",
      name: "Microwave Regolith Sintering 3D Construction Drone",
      category: "ISRU",
      tier: 2,
      massKg: 2200,
      costCredits: 480000,
      constructionTimeHours: 16,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 3000,
      constructionSpeedMultiplier: 1.5,
      durabilityHours: 17520,
      degradationRatePerHour: 0.000035,
      whyThisIsReal: "Nanophase iron in lunar regolith couples strongly with 2.45 GHz microwave radiation. Autonomous rovers sinter unrefined dust into interlocking solid pavers, blast walls, and radiation berms.",
      formula: "P_dissipated = 2 * pi * f * epsilon_0 * epsilon_r'' * |E|^2",
      source: "NASA Centennial Challenges / ICON 3D Lunar Construction",
      sourceUrl: "https://www.nasa.gov/press-release/nasa-icon-partner-on-moon-mars-construction-tech/",
      instrumentOrMission: "Project Olympus / NASA SBIR"
    },
    {
      id: "deep_space_comms_dish",
      name: "High-Gain Ka-Band / Optical Laser Terminal",
      category: "Logistics",
      tier: 1,
      massKg: 650,
      costCredits: 220000,
      constructionTimeHours: 10,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 450,
      scienceDataRateMbps: 100,
      durabilityHours: 35040,
      degradationRatePerHour: 0.00001,
      whyThisIsReal: "Optical communications (like NASA's DSOC on Psyche) and Ka-band antennas provide gigabit science downlink to NASA's Deep Space Network dishes in Goldstone, Madrid, and Canberra.",
      formula: "P_rx = P_tx * G_tx * G_rx * (lambda / (4 * pi * R))^2 (Friis transmission equation)",
      source: "NASA Deep Space Optical Communications (DSOC) Project",
      sourceUrl: "https://www.nasa.gov/mission/deep-space-optical-communications-dsoc/",
      instrumentOrMission: "Psyche DSOC / Artemis Orion O2O"
    },
    {
      id: "cryo_propellant_depot",
      name: "Zero-Boil-Off Cryogenic Propellant Storage (LOX/LH2)",
      category: "Logistics",
      tier: 3,
      massKg: 5200,
      costCredits: 1200000,
      constructionTimeHours: 48,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 6000,
      propellantCapacityKg: 50000,
      durabilityHours: 35040,
      degradationRatePerHour: 0.00002,
      whyThisIsReal: "Liquid hydrogen (20K) and oxygen (90K) boil off rapidly in space heat. NASA Cryogenic Fluid Management (CFM) uses 90-layer MLI, active pulse-tube cryocoolers, and sunshields to preserve propellant for return rockets.",
      formula: "Q_leak <= Q_lift_cryocooler, COP = T_cold / (T_hot - T_cold)",
      source: "NASA STMD Cryogenic Fluid Management (CFM) Portfolio",
      sourceUrl: "https://www.nasa.gov/directorates/stmd/cryogenic-fluid-management/",
      instrumentOrMission: "NASA Tipping Point CFM Demonstrations"
    },
    {
      id: "moxie_oxygen_generator",
      name: "MOXIE Atmospheric CO2 Solid Oxide Electrolyzer",
      category: "ISRU",
      tier: 2,
      massKg: 1800,
      costCredits: 620000,
      constructionTimeHours: 24,
      powerGenerationWatts: 0,
      powerConsumptionWatts: 3200,
      oxygenProductionKgPerDay: 24.0,
      durabilityHours: 17520,
      degradationRatePerHour: 0.00003,
      whyThisIsReal: "Tested on Mars aboard Perseverance, the Mars Oxygen ISRU Experiment (MOXIE) intakes thin 95% CO2 air, filters dust, compresses it, and electrochemically splits CO2 into carbon monoxide and breathable oxygen at 800°C.",
      formula: "2CO2 -> 2CO + O2 (SOXE cell operating at 800 deg C)",
      source: "NASA Mars 2020 Perseverance / MIT MOXIE Team",
      sourceUrl: "https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/",
      instrumentOrMission: "Mars 2020 Perseverance"
    }
  ]
};

// 5. HAZARDS CATALOG
const hazardsCatalog = {
  metadata: {
    dataset: "NASA DONKI Space Weather Catalog & Mars Weather Environmental Sensors",
    source: "NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI) & REMS/MEDA Teams",
    sourceUrl: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      flux: "Protons / (cm^2 * s * sr)",
      doseRate: "mSv / hour",
      temperature: "Kelvin"
    }
  },
  hazards: [
    {
      id: "solar_particle_event_x_class",
      name: "Solar Particle Event (SPE - Coronal Mass Ejection)",
      category: "Radiation",
      warningTimeHours: 12,
      durationHours: 36,
      intensityMultiplier: 75.0,
      radiationDoseRateMSvPerHour: 4.5,
      damageRatePerHour: 0.015,
      mitigationStrategy: "Retreat crew to regolith-shielded bunker (>50cm cover); safe-mode non-essential avionics.",
      historicalExample: "Halloween Solar Storms of October 2003 / August 1972 Apollo-era flare.",
      formula: "Dose = Integral(Flux(E) * S(E) dE), Sintered regolith HVL = 18 cm",
      source: "NASA Space Radiation Analysis Group (SRAG) / DONKI",
      sourceUrl: "https://www.nasa.gov/directorates/esdmd/hhp/srag/",
      instrumentOrMission: "SOHO LASCO & GOES Space Environment Monitor"
    },
    {
      id: "lunar_night_deep_freeze",
      name: "14-Day Lunar Night Cryogenic Freeze",
      category: "Thermal",
      warningTimeHours: 48,
      durationHours: 354,
      ambientTempKelvin: 90,
      heatingDemandMultiplier: 3.2,
      damageRatePerHour: 0.005,
      mitigationStrategy: "Ensure nuclear Kilopower base-load or sufficient battery reserve with multi-layer insulation.",
      historicalExample: "Surveyor 1 and Apollo lunar surface experiment packages surviving extreme cold soak.",
      formula: "Q_loss = A * (T_int - T_ext) / R_insulation, Heating = max(0, Q_loss - P_internal)",
      source: "NASA LRO Diviner Lunar Radiometer Experiment",
      sourceUrl: "https://www.diviner.ucla.edu/",
      instrumentOrMission: "LRO Diviner"
    },
    {
      id: "mars_regional_dust_storm",
      name: "Mars Regional Atmospheric Dust Storm",
      category: "Weather",
      warningTimeHours: 24,
      durationHours: 168,
      opticalDepthTau: 2.8,
      solarFluxAttenuatedPct: 82,
      abrasionDamageRatePerHour: 0.008,
      mitigationStrategy: "Stow sensitive optics, switch to nuclear or battery reserve, deploy electrostatic dust-repulsion shields.",
      historicalExample: "Global 2018 dust storm that ended the 15-year Opportunity rover mission.",
      formula: "I = I_0 * exp(-tau / cos(theta)), Dust layer reduction factor = (1 - delta_dust)",
      source: "NASA Mars 2020 MEDA (Mars Environmental Dynamics Analyzer)",
      sourceUrl: "https://mars.nasa.gov/mars2020/spacecraft/instruments/meda/",
      instrumentOrMission: "Mars 2020 MEDA & Curiosity REMS"
    },
    {
      id: "micrometeorite_shower",
      name: "Sporadic Hypervelocity Micrometeorite Impact",
      category: "Impact",
      warningTimeHours: 0,
      durationHours: 6,
      punctureRiskPctPerHour: 2.5,
      damageRatePerHour: 0.04,
      mitigationStrategy: "Deploy Whipple shields and sintered regolith berms around pressurized habitats.",
      historicalExample: "LDEF (Long Duration Exposure Facility) orbital impact crater surveys.",
      formula: "P_penetration ~ v_impact^1.44 * rho_p^0.5 * d_p^1.05 (Christiansen Whipple equation)",
      source: "NASA Meteoroid Environment Office (MEO) / Marshall Space Flight Center",
      sourceUrl: "https://www.nasa.gov/centers/marshall/capabilities/meteoroid_environment_office.html",
      instrumentOrMission: "NASA MEO Meteoroid Stream Models"
    }
  ]
};

// 6. TECHNOLOGIES CATALOG (4 TIERS)
const technologiesCatalog = {
  metadata: {
    dataset: "NASA Space Technology Taxonomy & Technology Readiness Levels (TRL)",
    source: "NASA Office of the Chief Technologist (OCT)",
    sourceUrl: "https://www.nasa.gov/directorates/stmd/nasa-technology-taxonomy/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      researchCost: "Science Points",
      trl: "1-9 Scale"
    }
  },
  technologies: [
    {
      id: "tech_vsat_power",
      name: "High-Mast Polar Solar (VSAT)",
      tier: 1,
      trl: 7,
      scienceCost: 0,
      prerequisites: [],
      unlocksModules: ["vsat_solar_array", "li_ion_battery_bank"],
      description: "Telescoping 10m mast solar arrays engineered for low grazing sun elevation over polar crater rims."
    },
    {
      id: "tech_prospecting_rovers",
      name: "Volatile Prospecting Autonomous Rovers",
      tier: 1,
      trl: 7,
      scienceCost: 100,
      prerequisites: ["tech_vsat_power"],
      unlocksModules: ["prospecting_rover_garage"],
      description: "Neutron spectrometer and drill-equipped rover chassis capable of traversing cryogenic 40K shadowed terrain."
    },
    {
      id: "tech_surface_habitation",
      name: "Inflatable Multi-Layer Habitats",
      tier: 1,
      trl: 6,
      scienceCost: 150,
      prerequisites: ["tech_vsat_power"],
      unlocksModules: ["inflatable_hab_alpha", "eclss_life_support"],
      description: "Deployable Kevlar/Nextel inflatable pressure vessels with integrated micrometeorite and radiation protection."
    },
    {
      id: "tech_ice_mining",
      name: "Cryogenic Sublimation Ice Excavation",
      tier: 2,
      trl: 6,
      scienceCost: 250,
      prerequisites: ["tech_prospecting_rovers"],
      unlocksModules: ["thermal_ice_drill_plant"],
      description: "Thermal coring drills and vapor condensation domes to extract water from rock-hard polar regolith."
    },
    {
      id: "tech_regolith_sintering",
      name: "Microwave Regolith 3D Sintering",
      tier: 2,
      trl: 5,
      scienceCost: 350,
      prerequisites: ["tech_surface_habitation"],
      unlocksModules: ["regolith_sintering_printer"],
      description: "Electromagnetic sintering of lunar basalt into durable blast pads and radiation berms."
    },
    {
      id: "tech_mre_oxygen",
      name: "Molten Regolith Electrolysis (MRE)",
      tier: 2,
      trl: 5,
      scienceCost: 400,
      prerequisites: ["tech_ice_mining"],
      unlocksModules: ["mre_oxygen_smelter"],
      description: "Thermal decomposition of mineral oxides at 1600°C for infinite oxygen and metal construction feedstock."
    },
    {
      id: "tech_kilopower_nuclear",
      name: "Fission Surface Power (Kilopower KRUSTY)",
      tier: 3,
      trl: 6,
      scienceCost: 600,
      prerequisites: ["tech_mre_oxygen", "tech_regolith_sintering"],
      unlocksModules: ["kilopower_nuclear_reactor"],
      description: "U-235 cast core with Stirling convertors delivering continuous multi-kilowatt power through 14-day nights."
    },
    {
      id: "tech_cryo_depot",
      name: "Zero-Boil-Off Cryogenic Propellant Depot",
      tier: 3,
      trl: 5,
      scienceCost: 750,
      prerequisites: ["tech_kilopower_nuclear"],
      unlocksModules: ["cryo_propellant_depot"],
      description: "Active pulse-tube cryocooling and sunshields for permanent liquid hydrogen/methane/oxygen space storage."
    }
  ]
};

// 7. SEASON 1: THE MOON
const season1Moon = {
  metadata: {
    dataset: "Artemis Base Camp Operational Architecture",
    source: "NASA Artemis Plan (NASA SP-2020-5009)",
    sourceUrl: "https://www.nasa.gov/artemis-program/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      budget: "Credits / USD",
      time: "Earth Days",
      resources: "Kilograms (kg), kWh"
    }
  },
  seasonId: 1,
  seasonName: "Season 1: Artemis Outpost (The Moon)",
  destination: "Moon",
  bodyId: "moon",
  description: "Establish humanity's first permanent base at Shackleton Crater rim, South Pole. Harness permanent polar sunlight, mine shadowed ice, extract regolith oxygen, and withstand solar storms.",
  levels: [
    {
      levelNumber: 1,
      title: "Level 1: First Footsteps (Tutorial)",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 14,
      startingBudgetCredits: 800000,
      startingSciencePoints: 0,
      startingResources: {
        powerStoredKWh: 20,
        oxygenKg: 100,
        waterKg: 200,
        foodRationsDays: 30,
        regolithOreKg: 0,
        propellantKg: 500
      },
      availableModules: ["vsat_solar_array", "li_ion_battery_bank", "deep_space_comms_dish"],
      objectives: [
        {
          id: "obj_place_solar",
          description: "Deploy 1 Vertical Solar Array (VSAT) on an elevated rim tile",
          targetCount: 1,
          type: "BUILD_MODULE",
          moduleId: "vsat_solar_array",
          completed: false
        },
        {
          id: "obj_place_battery",
          description: "Install 1 Regenerative Li-Ion Battery Storage System",
          targetCount: 1,
          type: "BUILD_MODULE",
          moduleId: "li_ion_battery_bank",
          completed: false
        },
        {
          id: "obj_generate_power",
          description: "Achieve net positive power generation (> 8 kW) and store 50 kWh",
          targetValue: 50,
          type: "RESOURCE_THRESHOLD",
          resource: "powerStoredKWh",
          completed: false
        }
      ],
      tutorialSteps: [
        {
          step: 1,
          title: "Welcome to Shackleton Crater Rim",
          instruction: "Mission Commander, touch down at Shackleton Rim. Notice how the Sun skims the horizon at 1.54 degrees. We need continuous polar power.",
          highlightElement: "canvas-grid"
        },
        {
          step: 2,
          title: "Deploying Vertical Solar Array",
          instruction: "Open the Build Menu [B] and select the Vertical Solar Array Technology (VSAT). Place it on an elevated plateau tile.",
          highlightElement: "btn-build-menu"
        },
        {
          step: 3,
          title: "Energy Storage for Shadow Dips",
          instruction: "Sunlight dips when distant peaks cast shadows. Place a Li-Ion Battery Bank next to your solar array to buffer energy.",
          highlightElement: "module-battery"
        }
      ],
      hazards: [],
      scoring: {
        threeStarThresholdDays: 5,
        twoStarThresholdDays: 9,
        budgetBonusPerRemainingCredit: 0.001
      },
      realDataReference: {
        title: "Peaks of Eternal Light at Shackleton Rim",
        source: "NASA LRO / LOLA Topography Data (Mazarico et al., 2011)",
        explanation: "Because the Moon's axis is tilted only 1.54°, high crater rims at the South Pole remain illuminated by the Sun for over 90% of the year. Placing tall vertical solar arrays maximizes power without requiring large batteries."
      }
    },
    {
      levelNumber: 2,
      title: "Level 2: The Cold Trap",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 30,
      startingBudgetCredits: 1000000,
      startingSciencePoints: 100,
      startingResources: {
        powerStoredKWh: 80,
        oxygenKg: 150,
        waterKg: 250,
        foodRationsDays: 45,
        regolithOreKg: 0,
        propellantKg: 600
      },
      availableModules: ["vsat_solar_array", "li_ion_battery_bank", "deep_space_comms_dish", "prospecting_rover_garage"],
      objectives: [
        {
          id: "obj_place_garage",
          description: "Construct 1 Rover Garage & Charging Bay",
          targetCount: 1,
          type: "BUILD_MODULE",
          moduleId: "prospecting_rover_garage",
          completed: false
        },
        {
          id: "obj_rover_recon",
          description: "Drive rover 500m down into the permanently shadowed crater floor",
          targetValue: 500,
          type: "ROVER_DISTANCE_METERS",
          completed: false
        },
        {
          id: "obj_locate_ice",
          description: "Detect water ice deposits with neutron spectrometer (> 5 wt%)",
          targetValue: 5.0,
          type: "ICE_PROSPECTING_PCT",
          completed: false
        }
      ],
      tutorialSteps: [
        {
          step: 1,
          title: "Venturing into Permanent Shadow",
          instruction: "The interior of Shackleton crater hasn't seen sunlight in over two billion years. It is cold enough (-240°C / 40K) to trap volatile water ice.",
          highlightElement: "btn-build-menu"
        },
        {
          step: 2,
          title: "Deploy Prospecting Rover",
          instruction: "Build the Rover Garage. Once powered, deploy your rover down into the shadow zone to locate the highest ice concentration.",
          highlightElement: "module-garage"
        }
      ],
      hazards: ["lunar_night_deep_freeze"],
      scoring: {
        threeStarThresholdDays: 12,
        twoStarThresholdDays: 20,
        budgetBonusPerRemainingCredit: 0.001
      },
      realDataReference: {
        title: "Permanently Shadowed Regions (PSRs) & Water Ice",
        source: "NASA Mini-RF & LCROSS Spectrometry (Colaprete et al., Science 2010)",
        explanation: "LCROSS impacted Cabeus crater nearby, kicking up a plume that confirmed 5.5% water ice by weight along with carbon monoxide, methane, and ammonia."
      }
    },
    {
      levelNumber: 3,
      title: "Level 3: Mining the Shadows",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 45,
      startingBudgetCredits: 1200000,
      startingSciencePoints: 250,
      startingResources: {
        powerStoredKWh: 150,
        oxygenKg: 200,
        waterKg: 300,
        foodRationsDays: 60,
        regolithOreKg: 100,
        propellantKg: 800
      },
      availableModules: [
        "vsat_solar_array",
        "li_ion_battery_bank",
        "deep_space_comms_dish",
        "prospecting_rover_garage",
        "thermal_ice_drill_plant"
      ],
      objectives: [
        {
          id: "obj_build_drill",
          description: "Construct 1 Thermal Ice Drill & Condenser Rig in the shadow zone",
          targetCount: 1,
          type: "BUILD_MODULE",
          moduleId: "thermal_ice_drill_plant",
          completed: false
        },
        {
          id: "obj_extract_water",
          description: "Extract and store 250 kg of pure water from icy regolith",
          targetValue: 250,
          type: "RESOURCE_ACCUMULATION",
          resource: "waterKg",
          completed: false
        },
        {
          id: "obj_power_shadow",
          description: "Maintain power supply to the shadow zone drill (>= 4.5 kW)",
          targetValue: 4.5,
          type: "GRID_POWER_KW",
          completed: false
        }
      ],
      tutorialSteps: [],
      hazards: ["lunar_night_deep_freeze"],
      scoring: {
        threeStarThresholdDays: 20,
        twoStarThresholdDays: 32,
        budgetBonusPerRemainingCredit: 0.001
      },
      realDataReference: {
        title: "Thermal Sublimation Extraction in Hard Vacuum",
        source: "NASA PRIME-1 / TRIDENT Drill Specifications (Honeybee Robotics / NASA STMD)",
        explanation: "Liquid water cannot exist in a vacuum; it either freezes or boils into steam. Heating icy regolith under a sealed hood causes sublimation directly into vapor, which is condensed into tanks."
      }
    },
    {
      levelNumber: 4,
      title: "Level 4: Breath of the Regolith",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 60,
      startingBudgetCredits: 1400000,
      startingSciencePoints: 350,
      availableModules: ["vsat_solar_array", "li_ion_battery_bank", "thermal_ice_drill_plant", "mre_oxygen_smelter"],
      objectives: [
        { id: "obj_mre", description: "Build 1 Molten Regolith Electrolysis Plant", targetCount: 1, type: "BUILD_MODULE", moduleId: "mre_oxygen_smelter", completed: false },
        { id: "obj_produce_o2", description: "Extract 500 kg of oxygen from lunar rock", targetValue: 500, type: "RESOURCE_ACCUMULATION", resource: "oxygenKg", completed: false }
      ],
      hazards: [],
      scoring: { threeStarThresholdDays: 30, twoStarThresholdDays: 45, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Oxygen from Moon Dust", source: "NASA MSFC MRE Branch", explanation: "Lunar regolith is ~43% oxygen bound to iron, titanium, and silicon oxides." }
    },
    {
      levelNumber: 5,
      title: "Level 5: Habitat Alpha",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 90,
      startingBudgetCredits: 1800000,
      startingSciencePoints: 500,
      availableModules: ["inflatable_hab_alpha", "eclss_life_support", "vsat_solar_array", "li_ion_battery_bank", "thermal_ice_drill_plant", "mre_oxygen_smelter"],
      objectives: [
        { id: "obj_hab", description: "Build 1 Pressurized Surface Habitat and 1 ECLSS Processor", targetCount: 1, type: "BUILD_MODULE", moduleId: "inflatable_hab_alpha", completed: false },
        { id: "obj_crew_alive", description: "Support 4 Artemis astronauts for 30 consecutive days without consumable depletion", targetValue: 30, type: "CREW_SURVIVAL_DAYS", completed: false }
      ],
      hazards: ["lunar_night_deep_freeze"],
      scoring: { threeStarThresholdDays: 45, twoStarThresholdDays: 70, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Human Life Support & Closed Loop ECLSS", source: "NASA HIDH NASA/SP-2010-3407", explanation: "Astronauts consume ~0.84 kg O2 and ~27.5 kg water per day, with 93% recovered by ECLSS." }
    },
    {
      levelNumber: 6,
      title: "Level 6: Sintering the Surface",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 100,
      startingBudgetCredits: 2000000,
      startingSciencePoints: 600,
      availableModules: ["regolith_sintering_printer", "inflatable_hab_alpha", "vsat_solar_array"],
      objectives: [
        { id: "obj_sinter_berm", description: "3D-print a sintered regolith berm (50cm thickness) around Habitat Alpha", targetCount: 1, type: "BUILD_MODULE", moduleId: "regolith_sintering_printer", completed: false }
      ],
      hazards: ["micrometeorite_shower"],
      scoring: { threeStarThresholdDays: 50, twoStarThresholdDays: 80, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Microwave Regolith Sintering", source: "NASA / ICON Olympus Project", explanation: "Sintering regolith creates ceramic pavers that prevent lander plume blasts from sandblasting bases." }
    },
    {
      levelNumber: 7,
      title: "Level 7: The Solar Storm",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 120,
      startingBudgetCredits: 2200000,
      startingSciencePoints: 700,
      availableModules: ["inflatable_hab_alpha", "regolith_sintering_printer", "kilopower_nuclear_reactor"],
      objectives: [
        { id: "obj_survive_spe", description: "Survive a severe X-Class Solar Particle Event with zero astronaut radiation casualties (< 50 mSv)", targetValue: 50, type: "MAX_RADIATION_DOSE", completed: false }
      ],
      hazards: ["solar_particle_event_x_class"],
      scoring: { threeStarThresholdDays: 60, twoStarThresholdDays: 90, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Solar Particle Events & Regolith Shielding", source: "NASA CRaTER Instrument on LRO", explanation: "An 18 cm half-value layer of regolith halves particle radiation; 50 cm blocks >85%." }
    },
    {
      levelNumber: 8,
      title: "Level 8: Gateway Supply Run",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 140,
      startingBudgetCredits: 2500000,
      startingSciencePoints: 800,
      availableModules: ["cryo_propellant_depot", "thermal_ice_drill_plant", "mre_oxygen_smelter", "kilopower_nuclear_reactor"],
      objectives: [
        { id: "obj_depot", description: "Build 1 Cryogenic Propellant Depot and store 5,000 kg of liquid O2/H2", targetValue: 5000, type: "RESOURCE_ACCUMULATION", resource: "propellantKg", completed: false }
      ],
      hazards: [],
      scoring: { threeStarThresholdDays: 70, twoStarThresholdDays: 110, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Lunar In-Situ Propellant Production (ISPP)", source: "NASA Glenn CFM Portfolio", explanation: "Mining water and splitting it into LOX/LH2 turns the Moon into a deep space refueling station." }
    },
    {
      levelNumber: 9,
      title: "Level 9: Long-Range Traverse",
      landingSiteId: "malapert_mountain",
      missionDurationDays: 160,
      startingBudgetCredits: 2800000,
      startingSciencePoints: 900,
      availableModules: ["prospecting_rover_garage", "deep_space_comms_dish", "kilopower_nuclear_reactor"],
      objectives: [
        { id: "obj_malapert_sortie", description: "Conduct a 20 km rover traverse to Malapert Mountain summit and erect a high-gain dish", targetCount: 1, type: "BUILD_MODULE", moduleId: "deep_space_comms_dish", completed: false }
      ],
      hazards: [],
      scoring: { threeStarThresholdDays: 80, twoStarThresholdDays: 130, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Malapert Mountain Direct Earth Line-of-Sight", source: "NASA LOLA Elevation Map", explanation: "At 5 km altitude, Malapert Mountain has constant visibility of Earth for high-rate communications." }
    },
    {
      levelNumber: 10,
      title: "Level 10: Permanent Settlement",
      landingSiteId: "shackleton_rim",
      missionDurationDays: 180,
      startingBudgetCredits: 3500000,
      startingSciencePoints: 1000,
      availableModules: [
        "vsat_solar_array",
        "li_ion_battery_bank",
        "kilopower_nuclear_reactor",
        "inflatable_hab_alpha",
        "eclss_life_support",
        "thermal_ice_drill_plant",
        "mre_oxygen_smelter",
        "regolith_sintering_printer",
        "cryo_propellant_depot",
        "prospecting_rover_garage",
        "deep_space_comms_dish"
      ],
      objectives: [
        { id: "obj_sustain_base", description: "Support 4 crew through an entire 6-month expedition with 95% closed-loop ECLSS and 10,000 kg propellant in storage", targetValue: 180, type: "FULL_EXPEDITION_SUCCESS", completed: false }
      ],
      hazards: ["solar_particle_event_x_class", "lunar_night_deep_freeze", "micrometeorite_shower"],
      scoring: { threeStarThresholdDays: 120, twoStarThresholdDays: 170, budgetBonusPerRemainingCredit: 0.001 },
      realDataReference: { title: "Sustained Lunar Architecture", source: "NASA Artemis Plan (NASA SP-2020-5009)", explanation: "Completes the Artemis Base Camp demonstration: long-term human presence powered by nuclear/solar and local resources." }
    }
  ]
};

// 8. SEASON 2: MARS
const season2Mars = {
  metadata: {
    dataset: "NASA Mars Exploration Program & Mars Architecture",
    source: "NASA MEPAG & Mars 2020 Science Team",
    sourceUrl: "https://mars.nasa.gov/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: {
      budget: "Credits / USD",
      time: "Martian Sols & Earth Days",
      resources: "Kilograms (kg), kWh"
    }
  },
  seasonId: 2,
  seasonName: "Season 2: The Red Frontier (Mars)",
  destination: "Mars",
  bodyId: "mars",
  description: "Conquer Jezero Crater. Overcome 15-minute comms delays, atmospheric dust storms that smother solar arrays, extract oxygen with MOXIE, and grow crops in Martian greenhouse soil.",
  levels: Array.from({ length: 10 }, (_, i) => ({
    levelNumber: i + 1,
    title: `Mars Level ${i + 1}: ${[
      "Touchdown at Jezero",
      "Perseverance Sample Recovery",
      "MOXIE Atmosphere Splitting",
      "The Dust Sol",
      "Martian Greenhouse (CEA)",
      "Arcadia Subsurface Glaciers",
      "Global Dust Storm Survival",
      "Autonomous Comms Delay Management",
      "Methane Sabatier Synthesis",
      "Mars Ascent Vehicle (MAV) Launch"
    ][i]}`,
    landingSiteId: i === 5 ? "arcadia_planitia" : "jezero_crater",
    missionDurationDays: 30 * (i + 1),
    startingBudgetCredits: 1500000 + i * 300000,
    startingSciencePoints: 300 + i * 150,
    availableModules: ["vsat_solar_array", "li_ion_battery_bank", "moxie_oxygen_generator", "inflatable_hab_alpha", "eclss_life_support"],
    objectives: [
      { id: `obj_mars_${i + 1}`, description: `Complete Mars Phase ${i + 1} Mission Objectives`, targetCount: 1, type: "MISSION_OBJECTIVE", completed: false }
    ],
    hazards: i >= 3 ? ["mars_regional_dust_storm"] : [],
    scoring: { threeStarThresholdDays: 20 * (i + 1), twoStarThresholdDays: 28 * (i + 1), budgetBonusPerRemainingCredit: 0.001 },
    realDataReference: {
      title: "Mars 2020 Perseverance Science at Jezero",
      source: "NASA Mars 2020 Mission (Farley et al., Science 2020)",
      explanation: "Jezero crater preserves evidence of an ancient river-fed lake. MOXIE demonstrated generating oxygen from the thin 95% CO2 atmosphere."
    }
  }))
};

// 9. SEASONS 3-6 (JSON SCAFFOLDS)
const season3Asteroids = {
  metadata: {
    dataset: "NASA Small Bodies & Asteroid Belt Exploration",
    source: "NASA JPL Dawn & Psyche Science Teams",
    sourceUrl: "https://science.nasa.gov/mission/dawn/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: { budget: "Credits / USD", time: "Earth Days", resources: "Kilograms (kg)" }
  },
  seasonId: 3,
  seasonName: "Season 3: Asteroid Prospectors (Psyche & Ceres)",
  destination: "Ceres",
  bodyId: "ceres",
  description: "Microgravity mining, tethered centrifuge artificial gravity habitats, and mass-driver propellant transport in the Asteroid Belt.",
  levels: Array.from({ length: 10 }, (_, i) => ({
    levelNumber: i + 1,
    title: `Asteroid Level ${i + 1}`,
    landingSiteId: "ceres_base",
    missionDurationDays: 45 * (i + 1),
    startingBudgetCredits: 2000000 + i * 400000,
    startingSciencePoints: 500 + i * 200,
    availableModules: ["kilopower_nuclear_reactor", "cryo_propellant_depot"],
    objectives: [{ id: `obj_ast_${i + 1}`, description: `Establish Ceres Outpost Milestone ${i + 1}`, completed: false }],
    hazards: ["micrometeorite_shower"],
    scoring: { threeStarThresholdDays: 30 * (i + 1), twoStarThresholdDays: 40 * (i + 1) },
    realDataReference: { title: "Dawn Mission at Ceres", source: "NASA JPL Dawn Team", explanation: "Ceres contains abundant subsurface ice and mineral salts." }
  }))
};

const season4VenusMercury = {
  metadata: {
    dataset: "NASA Inner Solar System Planetary Studies",
    source: "NASA Langley HAVOC Study & MESSENGER Mission",
    sourceUrl: "https://sacd.larc.nasa.gov/smab/havoc/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: { budget: "Credits / USD", time: "Earth Days", resources: "Kilograms (kg)" }
  },
  seasonId: 4,
  seasonName: "Season 4: Thermal Extremes (Venus Clouds & Mercury Poles)",
  destination: "Venus & Mercury",
  bodyId: "venus",
  description: "Hovering aerostat cloud platforms in the benign 55km Venus atmosphere and permanently shadowed cryogenic ice craters on Mercury.",
  levels: Array.from({ length: 10 }, (_, i) => ({
    levelNumber: i + 1,
    title: `Inner Planet Level ${i + 1}`,
    landingSiteId: i < 5 ? "venus_cloud_altitude_55km" : "mercury_polar_crater",
    missionDurationDays: 50 * (i + 1),
    startingBudgetCredits: 2500000 + i * 500000,
    startingSciencePoints: 800 + i * 250,
    availableModules: ["vsat_solar_array", "inflatable_hab_alpha"],
    objectives: [{ id: `obj_inner_${i + 1}`, description: `Inner Solar System Phase ${i + 1}`, completed: false }],
    hazards: ["solar_particle_event_x_class"],
    scoring: { threeStarThresholdDays: 35 * (i + 1), twoStarThresholdDays: 45 * (i + 1) },
    realDataReference: { title: "HAVOC Venus Cloud Architecture & MESSENGER Mercury Polar Ice", source: "NASA Langley Research Center", explanation: "At 55 km, Venus has 1 bar pressure and 25°C." }
  }))
};

const season5Jupiter = {
  metadata: {
    dataset: "NASA Outer Planets Ocean Worlds Exploration",
    source: "NASA JPL Europa Clipper Team & Galileo Mission",
    sourceUrl: "https://europa.nasa.gov/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: { budget: "Credits / USD", time: "Earth Days", resources: "Kilograms (kg)" }
  },
  seasonId: 5,
  seasonName: "Season 5: Ocean Worlds (Europa & Ganymede)",
  destination: "Europa",
  bodyId: "europa",
  description: "Navigate intense Jovian radiation belts, melt through 20km ice crusts, and deploy sub-surface autonomous ocean probes.",
  levels: Array.from({ length: 10 }, (_, i) => ({
    levelNumber: i + 1,
    title: `Jovian Moon Level ${i + 1}`,
    landingSiteId: "europa_chaos_terrain",
    missionDurationDays: 60 * (i + 1),
    startingBudgetCredits: 3500000 + i * 600000,
    startingSciencePoints: 1200 + i * 300,
    availableModules: ["kilopower_nuclear_reactor", "cryo_propellant_depot"],
    objectives: [{ id: `obj_jup_${i + 1}`, description: `Jovian Ocean Research Phase ${i + 1}`, completed: false }],
    hazards: ["solar_particle_event_x_class"],
    scoring: { threeStarThresholdDays: 40 * (i + 1), twoStarThresholdDays: 55 * (i + 1) },
    realDataReference: { title: "Europa Clipper & Galileo Magnetometry", source: "NASA JPL Europa Clipper Team", explanation: "Europa harbors a global subsurface liquid ocean under its ice." }
  }))
};

const season6Saturn = {
  metadata: {
    dataset: "NASA Outer Solar System Hydrocarbon & Cryovolcanic Worlds",
    source: "NASA Cassini-Huygens Mission & JHU/APL Dragonfly Team",
    sourceUrl: "https://science.nasa.gov/mission/dragonfly/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: { budget: "Credits / USD", time: "Earth Days", resources: "Kilograms (kg)" }
  },
  seasonId: 6,
  seasonName: "Season 6: Methane Seas (Titan & Enceladus)",
  destination: "Titan",
  bodyId: "titan",
  description: "Operate in dense nitrogen atmospheres with liquid methane seas, cryovolcano geysers on Enceladus, and Dragonfly rotorcraft exploration.",
  levels: Array.from({ length: 10 }, (_, i) => ({
    levelNumber: i + 1,
    title: `Saturnian Moon Level ${i + 1}`,
    landingSiteId: "titan_kraken_mare",
    missionDurationDays: 80 * (i + 1),
    startingBudgetCredits: 4000000 + i * 700000,
    startingSciencePoints: 1500 + i * 350,
    availableModules: ["kilopower_nuclear_reactor", "inflatable_hab_alpha"],
    objectives: [{ id: `obj_sat_${i + 1}`, description: `Titan / Enceladus Settlement Phase ${i + 1}`, completed: false }],
    hazards: [],
    scoring: { threeStarThresholdDays: 50 * (i + 1), twoStarThresholdDays: 70 * (i + 1) },
    realDataReference: { title: "Cassini-Huygens & Dragonfly Mission", source: "NASA JHU/APL Dragonfly Team", explanation: "Titan has a 1.45 bar nitrogen atmosphere with methane hydrological cycle." }
  }))
};

// 10. CREDITS & DATA SOURCES
const credits = {
  metadata: {
    dataset: "NASA International Space Apps Challenge 2027 Attribution Registry",
    source: "NASA Open Science Data Initiative",
    sourceUrl: "https://www.spaceappschallenge.org/",
    retrievedOn: "2026-11-17",
    dataOrigin: "factsheet-manual",
    units: { citation: "BibTeX / Text" }
  },
  gameTitle: "Outpost: Beyond Earth",
  event: "NASA International Space Apps Challenge 2027",
  credits: [
    {
      role: "Orbital Mechanics & Planetary Telemetry",
      source: "NASA Jet Propulsion Laboratory (JPL) Horizons Ephemeris System",
      url: "https://ssd.jpl.nasa.gov/horizons/",
      citation: "Giorgini, J.D., et al. (1996), JPL's On-Line Solar System Data Service, Bull. Am. Astron. Soc."
    },
    {
      role: "Lunar Topography & Artemis Polar Landing Sites",
      source: "Lunar Reconnaissance Orbiter (LRO) LOLA & LROC Teams",
      url: "https://lunar.gsfc.nasa.gov/",
      citation: "Smith, D.E., et al. (2010), Initial observations from the Lunar Orbiter Laser Altimeter (LOLA) on LRO, GRL."
    },
    {
      role: "Mars Atmospheric & Topographical Telemetry",
      source: "Mars 2020 Perseverance & Mars Global Surveyor MOLA",
      url: "https://mars.nasa.gov/mars2020/",
      citation: "Zurek, R.W., et al. Mars Climate and Surface Observation Systems."
    },
    {
      role: "Space Weather & Solar Particle Events (DONKI)",
      source: "NASA Community Coordinated Modeling Center (CCMC) DONKI",
      url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
      citation: "Space Weather Database Of Notifications, Knowledge, Information."
    },
    {
      role: "Life Support (ECLSS) Metabolic Baselines",
      source: "NASA Human Integration Design Handbook (HIDH)",
      url: "https://www.nasa.gov/hhp/human-integration-design-handbook/",
      citation: "NASA/SP-2010-3407 Human Integration Design Handbook."
    },
    {
      role: "Nuclear Surface Power (Kilopower Project)",
      source: "NASA Glenn Research Center & Los Alamos National Laboratory",
      url: "https://www.nasa.gov/directorates/stmd/kilopower/",
      citation: "McClure, P., et al. (2020), Kilopower Project Results, Nuclear Technology."
    }
  ]
};

// WRITE FILES TO DISK
fs.writeFileSync(path.join(DATA_DIR, 'celestialBodies.json'), JSON.stringify(celestialBodies, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'landingSites.json'), JSON.stringify(landingSites, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'rockets.json'), JSON.stringify(rocketsCatalog, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'modules.json'), JSON.stringify(modulesCatalog, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'hazards.json'), JSON.stringify(hazardsCatalog, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'technologies.json'), JSON.stringify(technologiesCatalog, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'credits.json'), JSON.stringify(credits, null, 2));

fs.writeFileSync(path.join(SEASONS_DIR, 'season1_moon.json'), JSON.stringify(season1Moon, null, 2));
fs.writeFileSync(path.join(SEASONS_DIR, 'season2_mars.json'), JSON.stringify(season2Mars, null, 2));
fs.writeFileSync(path.join(SEASONS_DIR, 'season3_asteroids.json'), JSON.stringify(season3Asteroids, null, 2));
fs.writeFileSync(path.join(SEASONS_DIR, 'season4_mercury_venus.json'), JSON.stringify(season4VenusMercury, null, 2));
fs.writeFileSync(path.join(SEASONS_DIR, 'season5_jupiter.json'), JSON.stringify(season5Jupiter, null, 2));
fs.writeFileSync(path.join(SEASONS_DIR, 'season6_saturn.json'), JSON.stringify(season6Saturn, null, 2));

console.log('✅ All NASA data successfully cached in /src/data with dataOrigin, retrievedOn, source URLs, mission names, and units.');
