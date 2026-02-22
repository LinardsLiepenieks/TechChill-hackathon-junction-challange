"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Participant, ProjectRating, Comparison, AppView, ProjectFeedback } from "@/types";
import { updateRatings } from "@/lib/bradley-terry";
import { selectNextPair, totalPairsNeeded } from "@/lib/pair-selector";

interface JudgingContextValue {
  participants: Participant[];
  ratings: Record<string, ProjectRating>;
  comparisons: Comparison[];
  currentPair: [string, string] | null;
  view: AppView;
  maxPairs: number;
  feedback: Record<string, ProjectFeedback>;
  startJudging: () => void;
  recordVote: (winnerId: string) => void;
  setView: (view: AppView) => void;
  getRankedParticipants: () => Participant[];
  addFeedback: (participantId: string, fb: ProjectFeedback) => void;
  addParticipant: (p: Omit<Participant, "id" | "score">) => void;
}

const JudgingContext = createContext<JudgingContextValue | null>(null);

export function useJudging() {
  const ctx = useContext(JudgingContext);
  if (!ctx) throw new Error("useJudging must be used within JudgingProvider");
  return ctx;
}

export function JudgingProvider({
  participants: initialParticipants,
  children,
}: {
  participants: Participant[];
  children: React.ReactNode;
}) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);

  const initialRatings = useMemo(() => {
    const r: Record<string, ProjectRating> = {};
    for (const p of initialParticipants) {
      r[p.id] = { participantId: p.id, mu: 0, sigma2: 1 };
    }
    return r;
  }, [initialParticipants]);

  const [ratings, setRatings] = useState<Record<string, ProjectRating>>(initialRatings);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [view, setView] = useState<AppView>("dashboard");
  const [feedback, setFeedback] = useState<Record<string, ProjectFeedback>>({});
  const maxPairs = useMemo(() => totalPairsNeeded(participants.length), [participants.length]);

  const addFeedback = useCallback((participantId: string, fb: ProjectFeedback) => {
    setFeedback((prev) => {
      const existing = prev[participantId] || { strengths: [], weaknesses: [] };
      return {
        ...prev,
        [participantId]: {
          strengths: [...existing.strengths, ...fb.strengths],
          weaknesses: [...existing.weaknesses, ...fb.weaknesses],
        },
      };
    });

    // Persist feedback to server
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, ...fb }),
    }).catch(() => {});
  }, []);

  const addParticipant = useCallback((p: Omit<Participant, "id" | "score">) => {
    const id = `team-${Date.now()}`;
    const newParticipant: Participant = { ...p, id, score: null };
    setParticipants((prev) => [...prev, newParticipant]);
    setRatings((prev) => ({ ...prev, [id]: { participantId: id, mu: 0, sigma2: 1 } }));

    // Persist to server (include the client-generated id so both sides match)
    fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, id }),
    }).catch(() => {});
  }, []);

  const startJudging = useCallback(() => {
    const pair = selectNextPair(ratings, comparisons, maxPairs);
    if (pair) {
      setCurrentPair(pair);
      setView("judging");
    } else {
      setView("leaderboard");
    }
  }, [ratings, comparisons, maxPairs]);

  const recordVote = useCallback(
    (winnerId: string) => {
      if (!currentPair) return;
      const loserId = currentPair[0] === winnerId ? currentPair[1] : currentPair[0];

      const { updatedWinner, updatedLoser } = updateRatings(ratings[winnerId], ratings[loserId]);
      const newRatings = { ...ratings, [winnerId]: updatedWinner, [loserId]: updatedLoser };
      setRatings(newRatings);

      const newComparisons = [...comparisons, { winnerId, loserId, timestamp: Date.now() }];
      setComparisons(newComparisons);

      // Persist vote to server
      fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, loserId }),
      }).catch(() => {});

      const nextPair = selectNextPair(newRatings, newComparisons, maxPairs);
      if (nextPair) {
        setCurrentPair(nextPair);
      } else {
        setCurrentPair(null);
        setView("leaderboard");
      }
    },
    [currentPair, ratings, comparisons, maxPairs],
  );

  const getRankedParticipants = useCallback((): Participant[] => {
    const allMus = Object.values(ratings).map((r) => r.mu);
    const min = Math.min(...allMus);
    const max = Math.max(...allMus);
    const range = max - min || 1;

    return participants
      .map((p) => ({
        ...p,
        score: Math.round(((ratings[p.id].mu - min) / range) * 100),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [participants, ratings]);

  return (
    <JudgingContext.Provider
      value={{
        participants,
        ratings,
        comparisons,
        currentPair,
        view,
        maxPairs,
        feedback,
        startJudging,
        recordVote,
        setView,
        getRankedParticipants,
        addFeedback,
        addParticipant,
      }}
    >
      {children}
    </JudgingContext.Provider>
  );
}
