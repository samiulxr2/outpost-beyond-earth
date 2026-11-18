/**
 * Bilingual Dictionary & Localization Helpers for Outpost: Beyond Earth
 * English (en) and Bangla (bn)
 * Provides comprehensive translations for UI, mission briefings, objectives, and telemetry.
 */

export type Locale = 'en' | 'bn';

export const translations = {
  en: {
    gameTitle: "Outpost: Beyond Earth",
    subtitle: "NASA International Space Apps Challenge 2027",
    newGame: "Start Artemis Mission",
    seasonSelect: "Season Select",
    missionPlanner: "Mission Planner & Trajectory",
    baseBuilder: "Surface Base Builder",
    techTree: "Technology Tree",
    credits: "Data & NASA Credits",
    back: "Back",
    launch: "Authorize Launch & Transit",
    launching: "Trans-Injection Burn Active...",
    pause: "Pause",
    play: "Resume",
    speed: "Speed",
    skip1Day: "+1 Day",
    skip7Days: "+7 Days",
    pass: "PASS: FLIGHT TRAJECTORY NOMINAL",
    fail: "FAIL: INSUFFICIENT DELTA-V / PAYLOAD MASS EXCEEDED",
    destination: "Target Destination",
    rocket: "Launch Vehicle",
    payloadMass: "Payload Mass",
    launchDate: "Launch Window Date",
    deltaVRequired: "Required Delta-V",
    deltaVAvailable: "Rocket Delta-V Margin",
    transferTime: "Hohmann Transfer Time",
    fuelRequired: "Propellant Mass Needed",
    payloadCapacity: "Max Payload to Injection",
    engineersPanel: "Engineer's Panel",
    whyThisIsReal: "Why This Is Real (NASA Science)",
    simplifiedForGameplay: "Simplified for gameplay",
    moon: "The Moon (Artemis Outpost)",
    mars: "Mars (Jezero Crater)",
    level1Title: "Level 1: First Footsteps (Tutorial)",
    level1Desc: "Establish NASA's first permanent base at Shackleton Crater rim, South Pole. Build a VSAT vertical solar array and battery storage.",
    budget: "Mission Budget",
    sciencePoints: "Science Points",
    missionDay: "Mission Sol/Day",
    statusNominal: "SYSTEMS NOMINAL",
    statusWarning: "ENVIRONMENTAL HAZARD ALERT",
    landingSites: "Candidate Landing Sites",
    touchdown: "Initiate Powered Touchdown",
    buildMenu: "Module Catalog",
    radiationDose: "Radiation Exposure",
    bermShielding: "Regolith Shielding Berm",
    crewShelter: "Radiation Storm Shelter",
    demoRun: "2-Min Demo Run",
    repair: "Perform Maintenance",
    missionVictory: "MISSION VICTORY",
    missionDefeat: "MISSION DEFEAT",
    nextMission: "Next Expedition",
    retryMission: "Retry Expedition",
    moxie: "MOXIE Oxygen Generator",
    lightLag: "Speed-of-Light Comms Delay",
    totalScore: "Total Score",
    crewSafety: "Crew Safety",
    efficiency: "Efficiency",
    scienceEarned: "Science Earned",
    flightEvaluation: "Flight Evaluation",
    techUnlocks: "Tech Unlocks",
    powerAndBudget: "Power & Budget",
    stormsEndured: "Storms Endured",
    totalRadDose: "Total Rad Dose",
    peakShelterDose: "Peak Shelter Dose",
    missionDirectives: "Mission Directives",
    primaryObjectives: "Primary Flight Objectives",
    completed: "Completed",
    progress: "Progress",
    saveBase: "Save Base",
    loadBase: "Load Base",
    fastForward: "Fast Forward",
    commsQueue: "Command in Transit",
    briefing: "Briefing",
    unlocked: "UNLOCKED",
    cleared: "CLEARED",
    locked: "LOCKED",
    sol: "Sol",
    day: "Day",
    duration: "Duration",
    cause: "Cause",
    days: "Days",
  },
  bn: {
    gameTitle: "আউটপোস্ট: বিয়ন্ড আর্থ",
    subtitle: "নাসা ইন্টারন্যাশনাল স্পেস অ্যাপস চ্যালেঞ্জ ২০২৭",
    newGame: "আর্টেমিস মিশন শুরু করুন",
    seasonSelect: "সিজন নির্বাচন",
    missionPlanner: "মিশন ও ট্র্যাজেক্টরি প্ল্যানার",
    baseBuilder: "বেস বিল্ডার",
    techTree: "প্রযুক্তি বৃক্ষ",
    credits: "উপাত্ত ও নাসা কৃতজ্ঞতা",
    back: "ফিরে যান",
    launch: "লঞ্চ অনুমোদন ও ট্রানজিট শুরু",
    launching: "ট্রান্স-ইনজেকশন বার্ন চলছে...",
    pause: "বিরতি",
    play: "চালিয়ে যান",
    speed: "গতি",
    skip1Day: "+১ দিন",
    skip7Days: "+৭ দিন",
    pass: "সফল: ট্র্যাজেক্টরি ও ডেল্টা-ভি সঠিক",
    fail: "ব্যর্থ: অপর্যাপ্ত জ্বালানি / অতিরিক্ত পেলোড",
    destination: "লক্ষ্যবস্তু",
    rocket: "উৎক্ষেপণ রকেট",
    payloadMass: "পেলোড ভর",
    launchDate: "লঞ্চ উইন্ডো তারিখ",
    deltaVRequired: "প্রয়োজনীয় ডেল্টা-ভি",
    deltaVAvailable: "উপলব্ধ ডেল্টা-ভি মার্জিন",
    transferTime: "ট্রান্সফার সময়কাল",
    fuelRequired: "প্রয়োজনীয় জ্বালানি",
    payloadCapacity: "সর্বোচ্চ পেলোড ক্ষমতা",
    engineersPanel: "প্রকৌশলী প্যানেল",
    whyThisIsReal: "বিজ্ঞানের সত্যতা (নাসা গবেষণা)",
    simplifiedForGameplay: "গেমপ্লের জন্য সরলীকৃত",
    moon: "চাঁদ (আর্টেমিস আউটপোস্ট)",
    mars: "মঙ্গল গ্রহ (জেজেরো ক্রেটার)",
    level1Title: "লেভেল ১: প্রথম পদক্ষেপ (টিউটোরিয়াল)",
    level1Desc: "চাঁদের দক্ষিণ মেরুর শ্যাকলটন ক্রেটারের রীমে নাসার স্থায়ী ঘাঁটি স্থাপন করুন। ভিএসএটি সোলার অ্যারে ও ব্যাটারি বসান।",
    budget: "মিশন বাজেট",
    sciencePoints: "বিজ্ঞান পয়েন্ট",
    missionDay: "মিশন দিন",
    statusNominal: "সিস্টেম স্বাভাবিক",
    statusWarning: "পরিবেশগত বিপদ সতর্কবার্তা",
    landingSites: "অবতরণ এলাকা নির্বাচন",
    touchdown: "অবতরণ শুরু করুন",
    buildMenu: "মডিউল ক্যাটালগ",
    radiationDose: "তেজস্ক্রিয়তার মাত্রা",
    bermShielding: "রেগোলিথ বেষ্টনী",
    crewShelter: "বাংকার আশ্রয়",
    demoRun: "২ মিনিটের ডেমো রান",
    repair: "মেরামত ও রক্ষণাবেক্ষণ",
    missionVictory: "মিশন সফল",
    missionDefeat: "মিশন ব্যর্থ",
    nextMission: "পরবর্তী অভিযান",
    retryMission: "পুনরায় চেষ্টা করুন",
    moxie: "মক্সি বায়ুমণ্ডলীয় অক্সিজেন",
    lightLag: "আলোর গতিতে সংকেত বিলম্ব",
    totalScore: "সর্বমোট স্কোর",
    crewSafety: "ক্রু নিরাপত্তা",
    efficiency: "দক্ষতা",
    scienceEarned: "অর্জিত বিজ্ঞান",
    flightEvaluation: "ফ্লাইট মূল্যায়ন",
    techUnlocks: "প্রযুক্তি আনলক",
    powerAndBudget: "বিদ্যুৎ ও বাজেট",
    stormsEndured: "মোকাবেলাকৃত ঝড়",
    totalRadDose: "মোট তেজস্ক্রিয় ডোজ",
    peakShelterDose: "সর্বোচ্চ আশ্রয় ডোজ",
    missionDirectives: "মিশন নির্দেশিকা",
    primaryObjectives: "প্রধান ফ্লাইট উদ্দেশ্য",
    completed: "সম্পন্ন",
    progress: "অগ্রগতি",
    saveBase: "বেস সংরক্ষণ",
    loadBase: "বেস পুনরুদ্ধার",
    fastForward: "দ্রুত এগিয়ে যান",
    commsQueue: "সংকেত ট্রানজিটে রয়েছে",
    briefing: "ব্রিফিং",
    unlocked: "উন্মুক্ত",
    cleared: "সম্পন্ন",
    locked: "লক করা",
    sol: "সল",
    day: "দিন",
    duration: "সময়কাল",
    cause: "কারণ",
    days: "দিন",
  }
} as const;

/**
 * Bengali localized level titles
 */
const BENGALI_LEVEL_TITLES: Record<string, string> = {
  "1_1": "লেভেল ১: প্রথম পদক্ষেপ (টিউটোরিয়াল)",
  "1_2": "লেভেল ২: ৩৫৪ ঘণ্টার চন্দ্র রজনী",
  "1_3": "লেভেল ৩: ছায়ায় বরফ খনি",
  "1_4": "লেভেল ৪: রেগোলিথের শ্বাসপ্রশ্বাস",
  "1_5": "লেভেল ৫: তেজস্ক্রিয়তা প্রতিরোধী বাঁধ",
  "1_6": "লেভেল ৬: উদ্বায়ী পদার্থের রোভার নেটওয়ার্ক",
  "1_7": "লেভেল ৭: ইন-সিটু জ্বালানি ডিপো",
  "1_8": "লেভেল ৮: শতাব্দীর ভয়াবহ ঝড়",
  "1_9": "লেভেল ৯: গেটওয়ে সরবরাহ রিলে",
  "1_10": "লেভেল ১০: আর্টেমিস বেস ক্যাম্প অভিযান",
  "2_1": "মঙ্গল লেভেল ১: জেজেরো ডেল্টা ও মক্সি অক্সিজেন",
};

/**
 * Bengali localized objective descriptions
 */
const BENGALI_OBJECTIVES: Record<string, string> = {
  // Season 1
  "obj_place_solar": "উঁচু রীম টালিতে ১টি উলম্ব সৌর প্যানেল (ভিএসএটি) স্থাপন করুন",
  "obj_place_battery": "১টি রিজেনারেটিভ লি-আয়ন ব্যাটারি সঞ্চয় ব্যবস্থা বসান",
  "obj_place_hab": "১টি ৪-সদস্যের চাপযুক্ত সারফেস হ্যাবিট্যাট নির্মাণ করুন",
  "obj_generate_power": "নেট পজিটিভ বিদ্যুৎ উৎপাদন (> ৮ কিলোওয়াট) এবং ৫০ কিলোওয়াট-ঘণ্টা সঞ্চয় অর্জন করুন",
  "obj_power_strategy": "বিদ্যুৎ সমাধান: কিলো-পাওয়ার পারমাণবিক চুল্লি নির্মাণ করুন অথবা ২০০০ কিলোওয়াট-ঘণ্টার ব্যাটারি গ্রিড তৈরি করুন",
  "obj_survive_night": "বেস ব্ল্যাকআউট ছাড়া ৩৫৪ ঘণ্টার চন্দ্র রজনী পার করুন (বিদ্যুৎ > ০)",
  "obj_maintain_oxygen": "১৪ দিনের দীর্ঘ রাতে ৫০ কেজির বেশি লাইফ সাপোর্ট অক্সিজেন মজুদ বজায় রাখুন",
  "obj_build_drill": "ক্রেটারের শীতল ছায়া অঞ্চলে ১টি থার্মাল আইস ড্রিল ও কনডেনসার রিগ স্থাপন করুন",
  "obj_extract_water": "বরফযুক্ত রেগোলিথ থেকে ২৫০ কেজি বিশুদ্ধ পানি নিষ্কাশন ও সঞ্চয় করুন",
  "obj_power_shadow": "ছায়া অঞ্চলের ড্রিলে নিরবচ্ছিন্ন বিদ্যুৎ সরবরাহ (>= ৪.৫ কিলোওয়াট) বজায় রাখুন",
  "obj_mre": "১টি গলিত রেগোলিথ তড়িৎ-বিশ্লেষণ (MRE) অক্সিজেন স্মেল্টার নির্মাণ করুন",
  "obj_produce_o2": "চন্দ্র ব্যাসাল্ট থেকে ৫০০ কেজি বিশুদ্ধ অক্সিজেন (O2) নিষ্কাশন ও সঞ্চয় করুন",
  "obj_power_mre": "১৬০০° সে. ফার্নেস চালানোর জন্য গ্রিডে বিদ্যুৎ সরবরাহ (> ৮ কিলোওয়াট) সচল রাখুন",
  "obj_hab_alpha": "১টি চাপযুক্ত সারফেস হ্যাবিট্যাট এবং ইসিএলএসএস জীবন রক্ষা ব্যবস্থা স্থাপন করুন",
  "obj_sinter_berm": "রেগোলিথ সিন্টারিং ৩ডি কনস্ট্রাকশন ড্রোন মোতায়েন করুন",
  "obj_berm_thickness": "তেজস্ক্রিয়তা প্রতিরোধী রেগোলিথ বাঁধ তৈরি করুন (>= ৩৬ সেমি পুরুত্ব, >৭৫% বিকিরণ হ্রাস)",
  "obj_survive_spe": "ক্রুর মোট ডোজ < ২৫ মিলিসিভার্ট রেখে শক্তিশালী সৌর কণা ঝড় (SPE) মোকাবিলা করুন",
  "obj_build_garage": "১টি চাপযুক্ত রোভার গ্যারেজ ও চার্জিং বে নির্মাণ করুন",
  "obj_traverse_distance": "ভাইপার-ক্লাস রোভার ছায়া অঞ্চলের গভীরে >= ২০০০ মিটার চালান",
  "obj_detect_ice": "উদ্বায়ী ক্রায়োজেনিক বরফের ঘনত্ব >= ৫.০% চিহ্নিত করুন",
  "obj_build_dish": "টেলিমেট্রি ডাউনলিঙ্কের জন্য ডিপ স্পেস যোগাযোগ অ্যান্টেনা স্থাপন করুন",
  "obj_build_depot": "১টি জিরো-বয়েল-অফ ক্রায়োজেনিক প্রপেলান্ট সংরক্ষণাগার ডিপো নির্মাণ করুন",
  "obj_propellant_threshold": "ডিপোতে >= ৫,০০০ কেজি ক্রায়োজেনিক জ্বালানি উৎপাদন ও সঞ্চয় করুন",
  "obj_berm_shield": "হ্যাবিট্যাটের চারপাশে >= ৩৬ সেমি পুরুত্বের সুরক্ষামূলক রেগোলিথ বাঁধ তৈরি করুন",
  "obj_survive_storm": "ক্রুকে নিরাপদে রেখে চরম সৌর কণা ঝড়ে মোট রেডিয়েশন ডোজ < ২৫ মিলিসিভার্টের নিচে রাখুন",
  "obj_supply_propellant": "লুনার গেটওয়েতে উড্ডয়নের জন্য >= ৩,০০০ কেজি ক্রায়োজেনিক প্রপেলান্ট প্রস্তুত রাখুন",
  "obj_supply_water": "কমপক্ষে ৬০০ কেজি বিশুদ্ধ পানির মজুদ বজায় রাখুন",
  "obj_hab": "১টি ৪-সদস্যের চাপযুক্ত সারফেস হ্যাবিট্যাট নির্মাণ করুন",
  "obj_eclss": "১টি ইসিএলএসএস ক্লোজড-লুপ জীবন সমর্থন ব্যবস্থা স্থাপন করুন",
  "obj_kilopower": "১টি কিলো-পাওয়ার ক্রাস্টি ফিশন পারমাণবিক চুল্লি (১০ কিলোওয়াট অবিচ্ছিন্ন) স্থাপন করুন",
  "obj_berm": "সুরক্ষামূলক রেগোলিথ বাঁধ তৈরি করুন (>= ৩৬ সেমি পুরুত্ব)",
  "obj_propellant_stockpile": "রিটার্ন যানের জন্য >= ৫,০০০ কেজি ক্রায়োজেনিক প্রপেলান্ট উৎপাদন ও মজুদ করুন",
  "obj_survive_expedition": "পরিবর্তনশীল মহাকাশ আবহাওয়া মোকাবিলা করে ১৮০ দিনের পূর্ণ অভিযান সম্পন্ন করুন",
  // Season 2 Mars
  "obj_jezero_hab": "জেজেরো ক্রেটারে ১টি চাপযুক্ত সারফেস হ্যাবিট্যাট নির্মাণ করুন",
  "obj_build_moxie": "১টি মক্সি বায়ুমণ্ডলীয় CO2 সলিড অক্সাইড ইলেক্ট্রোলাইজার স্থাপন করুন",
  "obj_extract_moxie_o2": "মঙ্গলের বাতাস থেকে >= ২০০ কেজি শ্বাসযোগ্য অক্সিজেন নিষ্কাশন ও সঞ্চয় করুন",
  "obj_power_mars_grid": "মঙ্গলের সূর্যালোক (৫৮৬ ওয়াট/বর্গমিটার) বিবেচনা করে গ্রিডে বিদ্যুৎ (>= ৩.০ কিলোওয়াট) নিশ্চিত করুন",
};

/**
 * Helper to get localized level title
 */
export function getLocalizedLevelTitle(seasonId: number, levelNumber: number, fallback: string, locale: Locale): string {
  if (locale !== 'bn') return fallback;
  const key = `${seasonId}_${levelNumber}`;
  return BENGALI_LEVEL_TITLES[key] || fallback;
}

/**
 * Helper to get localized objective description
 */
export function getLocalizedObjectiveDescription(objectiveId: string, fallback: string, locale: Locale): string {
  if (locale !== 'bn') return fallback;
  return BENGALI_OBJECTIVES[objectiveId] || fallback;
}

/**
 * Helper to get localized season title
 */
export function getLocalizedSeasonTitle(seasonId: number, fallback: string, locale: Locale): string {
  if (locale !== 'bn') return fallback;
  if (seasonId === 1) return "সিজন ১: আর্টেমিস আউটপোস্ট (চাঁদ)";
  if (seasonId === 2) return "সিজন ২: দ্য রেড ফ্রন্টিয়ার (মঙ্গল গ্রহ)";
  if (seasonId === 3) return "সিজন ৩: গ্রহাণু বলয় (সেরেস ও সাইকি)";
  if (seasonId === 4) return "সিজন ৪: চরম তাপমাত্রা (শুক্র ও বুধ)";
  if (seasonId === 5) return "সিজন ৫: বরফ সমুদ্র বিশ্ব (ইউরোপা ও গ্যানিমিড)";
  if (seasonId === 6) return "সিজন ৬: মিথেন সাগর (টাইটান ও এনসেলাডাস)";
  return fallback;
}
