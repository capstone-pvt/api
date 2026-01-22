export const PERFORMANCE_CLASSIFICATION_THRESHOLD = 3.5;

export enum PerformanceStatus {
  PERFORMING = 'Performing',
  NON_PERFORMING = 'Non-Performing',
}

export function classifyPerformance(
  predictedScore: number | string,
): PerformanceStatus {
  const score =
    typeof predictedScore === 'string'
      ? parseFloat(predictedScore)
      : predictedScore;

  if (isNaN(score)) {
    return PerformanceStatus.NON_PERFORMING;
  }

  return score >= PERFORMANCE_CLASSIFICATION_THRESHOLD
    ? PerformanceStatus.PERFORMING
    : PerformanceStatus.NON_PERFORMING;
}
