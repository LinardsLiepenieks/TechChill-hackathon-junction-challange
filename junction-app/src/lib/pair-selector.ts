import { ProjectRating, Comparison } from "@/types";

export function totalPairsNeeded(n: number): number {
  return Math.ceil((n * 3) / 2);
}

export function selectNextPair(
  ratings: Record<string, ProjectRating>,
  comparisons: Comparison[],
  maxComparisons: number,
): [string, string] | null {
  if (comparisons.length >= maxComparisons) return null;

  const compared = new Set<string>();
  for (const c of comparisons) {
    compared.add([c.winnerId, c.loserId].sort().join("|"));
  }

  const ids = Object.keys(ratings);
  let bestPair: [string, string] | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const key = [ids[i], ids[j]].sort().join("|");
      if (compared.has(key)) continue;

      const score = ratings[ids[i]].sigma2 + ratings[ids[j]].sigma2;
      if (score > bestScore) {
        bestScore = score;
        bestPair = [ids[i], ids[j]];
      }
    }
  }

  return bestPair;
}
