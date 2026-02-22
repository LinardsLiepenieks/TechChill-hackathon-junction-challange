import { NextResponse } from "next/server";
import { getStore, getVisibleParticipants } from "@/lib/store";
import { ProjectRating } from "@/types";
import { updateRatings } from "@/lib/bradley-terry";

export async function GET() {
  const store = getStore();
  const visible = getVisibleParticipants(store);

  // Run Bradley-Terry on ALL votes from all judges (only for visible participants)
  const visibleIds = new Set(visible.map((p) => p.id));
  const ratings: Record<string, ProjectRating> = {};
  for (const p of visible) {
    ratings[p.id] = { participantId: p.id, mu: 0, sigma2: 1 };
  }

  for (const vote of store.votes) {
    if (!visibleIds.has(vote.winnerId) || !visibleIds.has(vote.loserId)) continue;
    const { updatedWinner, updatedLoser } = updateRatings(
      ratings[vote.winnerId],
      ratings[vote.loserId],
    );
    ratings[vote.winnerId] = updatedWinner;
    ratings[vote.loserId] = updatedLoser;
  }

  // Compute normalized scores
  const allMus = Object.values(ratings).map((r) => r.mu);
  const min = Math.min(...allMus);
  const max = Math.max(...allMus);
  const range = max - min || 1;

  const ranked = visible
    .map((p) => ({
      ...p,
      score: Math.round(((ratings[p.id].mu - min) / range) * 100),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return NextResponse.json({
    ranked,
    totalVotes: store.votes.length,
    feedback: store.feedback,
  });
}
