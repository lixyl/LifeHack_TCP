import type { Challenge } from "./analysis";

export type ScenarioStatus = "pass" | "partial" | "fail";

export type DimensionScore = {
  score: number;
  max_score: number;
};

export type StressTestScore = DimensionScore & {
  passed: number;
  partial: number;
  failed: number;
  total: number;
};

export type Readiness = {
  stress_test: StressTestScore;
  product_information: DimensionScore;
  context_use_case: DimensionScore;
  consumer_persona: DimensionScore;
  consistency_reliability: DimensionScore;
  total_score: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function calculateStressTestScore(statuses: ScenarioStatus[]): StressTestScore {
  const passed = statuses.filter((status) => status === "pass").length;
  const partial = statuses.filter((status) => status === "partial").length;
  const failed = statuses.filter((status) => status === "fail").length;
  return calculateStressTestFromCounts(passed, partial, failed, statuses.length);
}

export function calculateStressTestFromCounts(
  passedValue: number | undefined,
  partialValue: number | undefined,
  failedValue: number | undefined,
  totalValue?: number,
): StressTestScore {
  const safeCount = (value: number | undefined) => Math.max(0, Number.isFinite(value) ? Math.floor(value as number) : 0);
  const passed = safeCount(passedValue);
  const partial = safeCount(partialValue);
  const failed = safeCount(failedValue);
  const total = safeCount(totalValue ?? passed + partial + failed);
  const score = total === 0 ? 0 : ((passed + partial * 0.5) / total) * 40;
  return { score: clamp(score, 0, 40), max_score: 40, passed, partial, failed, total };
}

export function calculateReadiness(
  stressTest: StressTestScore,
  dimensions: Omit<Readiness, "stress_test" | "total_score">,
): Readiness {
  const normalized = {
    product_information: normalizeDimension(dimensions.product_information, 20),
    context_use_case: normalizeDimension(dimensions.context_use_case, 15),
    consumer_persona: normalizeDimension(dimensions.consumer_persona, 15),
    consistency_reliability: normalizeDimension(dimensions.consistency_reliability, 10),
  };
  const total = stressTest.score + Object.values(normalized).reduce((sum, item) => sum + item.score, 0);

  return { stress_test: stressTest, ...normalized, total_score: clamp(Math.round(total), 0, 100) };
}

export function normalizeReadiness(value: Readiness): Readiness {
  const stressTest = calculateStressTestFromCounts(
    value.stress_test?.passed,
    value.stress_test?.partial,
    value.stress_test?.failed,
    value.stress_test?.total,
  );
  return calculateReadiness(stressTest, value);
}

function normalizeDimension(value: DimensionScore | undefined, maxScore: number): DimensionScore {
  return { score: clamp(Number(value?.score), 0, maxScore), max_score: maxScore };
}

// Temporary non-product-specific scores used only until the readiness API is available.
export function getMockDimensionScores(): Omit<Readiness, "stress_test" | "total_score"> {
  return {
    product_information: { score: 18, max_score: 20 },
    context_use_case: { score: 12, max_score: 15 },
    consumer_persona: { score: 13, max_score: 15 },
    consistency_reliability: { score: 9, max_score: 10 },
  };
}

export function readinessFromChallenges(challenges: Challenge[]): Readiness {
  const statusMap = { PASSED: "pass", PARTIAL: "partial", FAILED: "fail" } as const;
  return calculateReadiness(
    calculateStressTestScore(challenges.map((challenge) => statusMap[challenge.status])),
    getMockDimensionScores(),
  );
}
