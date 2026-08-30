import type { AnalysisResult, EvaluationScores } from "./analysis";

export const scoreEntries = [
  ["Clarity", "Clarity", "#7c6aff"],
  ["Completeness", "Completeness", "#22d3ee"],
  ["Persuasiveness", "Persuasiveness", "#f472b6"],
  ["SEO_Potential", "SEO Potential", "#34d399"],
  ["LLM_Fit", "LLM Fit", "#fb923c"],
] as const;

export function normalizeResult(raw: any): AnalysisResult {
  const scores = raw?.scores as EvaluationScores | undefined;
  if (
    !scores ||
    scoreEntries.some(
      ([key]) => !Number.isInteger(scores[key]) || scores[key] < 1 || scores[key] > 100,
    )
  ) {
    throw new Error("The analysis API returned incomplete or invalid scores.");
  }

  const overall = Math.round(
    scoreEntries.reduce((sum, [key]) => sum + scores[key], 0) / scoreEntries.length,
  );
  const grade =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";
  const llmVerdict =
    scores.LLM_Fit >= 75 ? "Strong fit" : scores.LLM_Fit >= 50 ? "Moderate fit" : "Needs improvement";

  return {
    ...raw,
    scores,
    overall,
    grade,
    summary: `Five-dimension evaluation for ${raw.product_category || "this product"}.`,
    llmScore: scores.LLM_Fit,
    llmVerdict,
    llmRationale:
      "This score measures how clearly the data identifies target customers and situational use cases.",
    categories: scoreEntries.map(([key, label, color]) => ({
      label,
      score: scores[key],
      note: `${scores[key]}/100`,
      color,
    })),
  };
}
