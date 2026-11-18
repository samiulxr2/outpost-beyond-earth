/**
 * Mission Performance & Scoring System
 *
 * Implements deterministic scoring based on NASA flight evaluation criteria:
 * - Mission Success: 1000 pts base (0 if mission was aborted/failed)
 * - Crew Safety: up to 500 pts (evaluated from minimum consumable reserves and radiation safety)
 * - Resource & Financial Efficiency: up to 500 pts (budget retained and energy storage margins)
 * - Science Yield: up to 500 pts (science points earned and objectives fulfilled)
 * Total Maximum: Exactly 2500 pts.
 *
 * Star Evaluation:
 * - 3 Stars: >= 2000 pts
 * - 2 Stars: >= 1500 pts
 * - 1 Star:  >= 1000 pts
 * - 0 Stars: < 1000 pts (Defeat)
 */

export interface ScoreInputs {
  status: 'VICTORY' | 'DEFEAT';
  levelNumber: number;
  missionDurationDays: number;
  elapsedDays: number;
  oxygenKg: number;
  waterKg: number;
  foodDaysRemaining: number;
  budgetCreditsRemaining: number;
  startingBudgetCredits: number;
  powerStoredKWh: number;
  maxPowerStorageKWh: number;
  crewCount: number;
  cumulativeRadiationDoseMSv?: number;
  hazardsSurvivedCount?: number;
}

export interface ScoreResult {
  status: 'VICTORY' | 'DEFEAT';
  missionSuccessScore: number; // 0 or 1000
  crewSafetyScore: number;     // 0 - 500
  efficiencyScore: number;     // 0 - 500
  scienceYieldScore: number;   // 0 - 500
  totalScore: number;          // 0 - 2500
  stars: number;               // 0 - 3
  sciencePointsEarned: number;
}

export function calculateMissionScore(inputs: ScoreInputs): ScoreResult {
  if (inputs.status === 'DEFEAT') {
    return {
      status: 'DEFEAT',
      missionSuccessScore: 0,
      crewSafetyScore: Math.min(200, Math.round((inputs.oxygenKg + inputs.waterKg) * 0.5)),
      efficiencyScore: Math.min(150, Math.round(inputs.budgetCreditsRemaining * 0.00015)),
      scienceYieldScore: 0,
      totalScore: Math.min(350, Math.round((inputs.oxygenKg + inputs.waterKg) * 0.5 + inputs.budgetCreditsRemaining * 0.00015)),
      stars: 0,
      sciencePointsEarned: 25,
    };
  }

  // 1. Mission Success Base Score
  const missionSuccessScore = 1000;

  // 2. Crew Safety Score (Max 500)
  // Evaluates life support reserves against minimum emergency margins
  const o2Score = Math.min(150, Math.round((inputs.oxygenKg / (inputs.crewCount * 0.84 * 7)) * 150));
  const waterScore = Math.min(150, Math.round((inputs.waterKg / (inputs.crewCount * 2.50 * 7)) * 150));
  const foodScore = Math.min(100, Math.round((inputs.foodDaysRemaining / 14) * 100));
  const radPenalty = inputs.cumulativeRadiationDoseMSv ? Math.min(100, Math.round(inputs.cumulativeRadiationDoseMSv * 2)) : 0;
  const crewSafetyScore = Math.max(0, Math.min(500, o2Score + waterScore + foodScore + 100 - radPenalty));

  // 3. Efficiency Score (Max 500)
  // Evaluates budget preservation and energy storage buffer
  const budgetRatio = inputs.startingBudgetCredits > 0 
    ? Math.max(0, Math.min(1, inputs.budgetCreditsRemaining / inputs.startingBudgetCredits)) 
    : 0.5;
  const budgetScore = Math.round(budgetRatio * 300);
  const powerRatio = inputs.maxPowerStorageKWh > 0
    ? Math.max(0, Math.min(1, inputs.powerStoredKWh / inputs.maxPowerStorageKWh))
    : 0.5;
  const powerScore = Math.round(powerRatio * 200);
  const efficiencyScore = Math.min(500, budgetScore + powerScore);

  // 4. Science Yield Score (Max 500)
  // Scale science points based on level complexity
  const levelBaseSP = inputs.levelNumber === 1 ? 150 : inputs.levelNumber === 2 ? 250 : inputs.levelNumber === 3 ? 350 : 450;
  const hazardBonus = (inputs.hazardsSurvivedCount || 0) * 50;
  const sciencePointsEarned = levelBaseSP + hazardBonus;
  const scienceYieldScore = Math.min(500, Math.round(sciencePointsEarned * 1.0));

  // Total Score (Exactly sum of 4 components, max 2500)
  const totalScore = missionSuccessScore + crewSafetyScore + efficiencyScore + scienceYieldScore;

  // Star Ratings
  let stars = 1;
  if (totalScore >= 2000) {
    stars = 3;
  } else if (totalScore >= 1500) {
    stars = 2;
  }

  return {
    status: 'VICTORY',
    missionSuccessScore,
    crewSafetyScore,
    efficiencyScore,
    scienceYieldScore,
    totalScore,
    stars,
    sciencePointsEarned,
  };
}
