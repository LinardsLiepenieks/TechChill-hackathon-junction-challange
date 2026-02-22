"use client";

import { useState, useEffect, useCallback } from "react";
import { Participant, ProjectFeedback } from "@/types";
import { Modal } from "@/components/ui/Modal";

interface LeaderboardData {
  ranked: Participant[];
  totalVotes: number;
  feedback: Record<string, ProjectFeedback>;
}

export function TotalLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedParticipant = selectedId && data ? data.ranked.find((p) => p.id === selectedId) : null;
  const selectedFb = selectedId && data ? data.feedback[selectedId] : null;
  const hasFb = selectedFb && (selectedFb.strengths.length > 0 || selectedFb.weaknesses.length > 0);

  if (loading) {
    return <p className="text-sm text-muted animate-pulse py-8 text-center">Loading leaderboard...</p>;
  }

  if (!data || data.totalVotes === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">No votes yet.</p>
        <p className="text-xs text-muted/50 mt-1">Start judging to see rankings here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          Based on {data.totalVotes} pairwise comparison{data.totalVotes !== 1 ? "s" : ""} from all judges
        </p>
        <button
          onClick={fetchData}
          className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {data.ranked.map((p, index) => {
          const fb = data.feedback[p.id];
          const hasItemFb = fb && (fb.strengths.length > 0 || fb.weaknesses.length > 0);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => hasItemFb && setSelectedId(p.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-border text-left transition-colors ${
                hasItemFb ? "cursor-pointer hover:border-accent/40 hover:bg-accent/5" : "cursor-default"
              }`}
            >
              <span
                className={`text-lg font-semibold w-8 text-center ${
                  index === 0 ? "text-accent" : "text-muted"
                }`}
              >
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.projectName}</span>
                  {p.seed && <span className="text-[10px] text-muted/40">sample</span>}
                  {hasItemFb && (
                    <span className="text-[10px] text-accent/70 ml-1">feedback</span>
                  )}
                </div>
                <p className="text-xs text-muted truncate">{p.teamName}</p>
              </div>

              <div className="flex items-center gap-3 w-40">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${p.score ?? 0}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-8 text-right">{p.score ?? 0}</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted mt-6 text-center">
        Scores computed using the Bradley-Terry pairwise comparison model
      </p>

      <Modal
        isOpen={!!selectedId && !!hasFb}
        onClose={() => setSelectedId(null)}
        title={selectedParticipant?.projectName ?? "Feedback"}
      >
        {selectedFb && hasFb && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted">{selectedParticipant?.teamName}</span>
              <span className="text-xs text-muted ml-auto">Score: {selectedParticipant?.score ?? 0}</span>
            </div>

            {selectedFb.strengths.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-green font-medium">Strengths</span>
                <ul className="mt-1.5 space-y-1">
                  {[...new Set(selectedFb.strengths)].map((s, i) => (
                    <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                      <span className="text-green mt-0.5 shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedFb.weaknesses.length > 0 && (
              <div>
                <span className="text-xs text-red-400 font-medium">Weaknesses</span>
                <ul className="mt-1.5 space-y-1">
                  {[...new Set(selectedFb.weaknesses)].map((w, i) => (
                    <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5 shrink-0">-</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
