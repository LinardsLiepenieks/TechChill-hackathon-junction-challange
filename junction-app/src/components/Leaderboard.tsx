"use client";

import { useState, useEffect, useCallback } from "react";
import { useJudging } from "@/context/JudgingContext";
import { ComparisonGraph } from "@/components/ComparisonGraph";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Participant, ProjectFeedback } from "@/types";

interface TotalData {
  ranked: Participant[];
  totalVotes: number;
  feedback: Record<string, ProjectFeedback>;
}

export function Leaderboard() {
  const { getRankedParticipants, comparisons, feedback, setView } = useJudging();
  const ranked = getRankedParticipants();
  const [showGraph, setShowGraph] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTotal, setShowTotal] = useState(false);
  const [totalData, setTotalData] = useState<TotalData | null>(null);
  const [loadingTotal, setLoadingTotal] = useState(false);

  const fetchTotal = useCallback(async () => {
    setLoadingTotal(true);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) setTotalData(await res.json());
    } catch { /* ignore */ }
    setLoadingTotal(false);
  }, []);

  useEffect(() => {
    if (showTotal) fetchTotal();
  }, [showTotal, fetchTotal]);

  const displayRanked = showTotal && totalData ? totalData.ranked : ranked;
  const displayFeedback = showTotal && totalData ? totalData.feedback : feedback;
  const displayVoteCount = showTotal && totalData ? totalData.totalVotes : comparisons.length;

  const selectedParticipant = selectedId ? displayRanked.find((p) => p.id === selectedId) : null;
  const selectedFb = selectedId ? displayFeedback[selectedId] : null;
  const hasFb = selectedFb && (selectedFb.strengths.length > 0 || selectedFb.weaknesses.length > 0);

  return (
    <div className={`bg-background font-sans ${showGraph ? "h-screen flex flex-col" : "min-h-screen"}`}>
      <div className={`mx-auto w-full px-6 ${showGraph ? "max-w-6xl py-6 flex flex-col flex-1 min-h-0" : "max-w-4xl py-10"}`}>
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border shrink-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              {showTotal ? "Total Leaderboard" : "Leaderboard"}
            </h1>
            <p className="text-muted text-sm">
              {loadingTotal ? "Loading..." : `Based on ${displayVoteCount} pairwise comparisons${showTotal ? " (all judges)" : ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showTotal ? "primary" : "outline"}
              onClick={() => { setShowTotal(!showTotal); setSelectedId(null); }}
            >
              {showTotal ? "My Results" : "Total"}
            </Button>
            {!showTotal && (
              <Button variant="outline" onClick={() => setShowGraph(!showGraph)}>
                {showGraph ? "List View" : "Context Graph"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setView("dashboard")}>
              Back
            </Button>
          </div>
        </div>

        {showGraph && !showTotal ? (
          <ComparisonGraph />
        ) : (
          <>
            <div className="space-y-2">
              {displayRanked.map((p, index) => {
                const fb = displayFeedback[p.id];
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

            <p className="text-xs text-muted mt-8 text-center">
              Scores computed using the Bradley-Terry pairwise comparison model
            </p>
          </>
        )}
      </div>

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
    </div>
  );
}
