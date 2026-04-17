// Shared confidence color helper used across all screens.
// score is 0..1 (e.g. 0.82) — returns a Tailwind text color class.
export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "text-green-600";
  if (score >= 0.4) return "text-amber-500";
  return "text-red-500";
}
