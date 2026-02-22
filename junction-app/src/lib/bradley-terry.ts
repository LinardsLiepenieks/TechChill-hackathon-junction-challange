import { ProjectRating } from "@/types";

const K = 0.4;

export function updateRatings(
  winner: ProjectRating,
  loser: ProjectRating,
): { updatedWinner: ProjectRating; updatedLoser: ProjectRating } {
  const pWin = Math.exp(winner.mu) / (Math.exp(winner.mu) + Math.exp(loser.mu));

  return {
    updatedWinner: {
      ...winner,
      mu: winner.mu + K * (1 - pWin),
      sigma2: winner.sigma2 * 0.9,
    },
    updatedLoser: {
      ...loser,
      mu: loser.mu - K * pWin,
      sigma2: loser.sigma2 * 0.9,
    },
  };
}

export function muToScore(mu: number, allMus: number[]): number {
  const min = Math.min(...allMus);
  const max = Math.max(...allMus);
  if (max === min) return 50;
  return Math.round(((mu - min) / (max - min)) * 100);
}
