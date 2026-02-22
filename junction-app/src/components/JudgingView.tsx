"use client";

import { useState, useCallback, useRef } from "react";
import { useJudging } from "@/context/JudgingContext";
import { ProjectCard, CardState } from "@/components/ProjectCard";
import { ChatPanel } from "@/components/ChatPanel";
import { CompareDrawer } from "@/components/CompareDrawer";
import { Button } from "@/components/ui/Button";
import { PresentationModal } from "@/components/PresentationModal";
import { ChatMessage } from "@/types";

type AnimPhase = "idle" | "selected" | "exiting";

export function JudgingView() {
  const { currentPair, participants, recordVote, comparisons, maxPairs, setView, addFeedback } =
    useJudging();
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const chatMessagesRefA = useRef<ChatMessage[]>([]);
  const chatMessagesRefB = useRef<ChatMessage[]>([]);
  const [presentationTarget, setPresentationTarget] = useState<"A" | "B" | null>(null);

  const summarizeProject = useCallback(
    async (projectId: string, projectName: string, messagesRef: React.MutableRefObject<ChatMessage[]>) => {
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesRef.current,
            projectName,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.strengths || data.weaknesses) {
          addFeedback(projectId, {
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
          });
        }
      } catch {
        // Summarization is best-effort, don't block judging
      }
    },
    [addFeedback],
  );

  const handleVote = useCallback(
    (winnerId: string) => {
      if (phase !== "idle" || !currentPair) return;

      const projectA = participants.find((p) => p.id === currentPair[0])!;
      const projectB = participants.find((p) => p.id === currentPair[1])!;

      // Fire summarization for each project in background (don't await)
      summarizeProject(projectA.id, projectA.projectName, chatMessagesRefA);
      summarizeProject(projectB.id, projectB.projectName, chatMessagesRefB);

      setChosenId(winnerId);
      setPhase("selected");

      // Phase 1: show winner/loser for 500ms
      timerRef.current = setTimeout(() => {
        setPhase("exiting");

        // Phase 2: fade out for 250ms, then advance
        timerRef.current = setTimeout(() => {
          recordVote(winnerId);
          setPhase("idle");
          setChosenId(null);
        }, 250);
      }, 500);
    },
    [phase, currentPair, participants, recordVote, summarizeProject],
  );

  if (!currentPair) return null;

  const projectA = participants.find((p) => p.id === currentPair[0])!;
  const projectB = participants.find((p) => p.id === currentPair[1])!;
  const progress = (comparisons.length / maxPairs) * 100;

  const cardState = (id: string): CardState => {
    if (phase === "exiting") return "exit";
    if (phase === "selected" && chosenId) {
      return id === chosenId ? "winner" : "loser";
    }
    return "idle";
  };

  return (
    <div className="h-screen bg-background font-sans flex flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 py-6 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight mb-0.5">Pairwise Judging</h1>
            <p className="text-muted text-xs">
              Comparison {comparisons.length + 1} of {maxPairs}
            </p>
          </div>
          <Button variant="outline" onClick={() => setView("dashboard")}>
            Back
          </Button>
        </div>

        <p className="text-center text-muted text-xs mb-4 shrink-0">
          Which project is better? Click to choose.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          <div>
            <ProjectCard
              participant={projectA}
              onClick={() => handleVote(projectA.id)}
              state={cardState(projectA.id)}
              disabled={phase !== "idle"}
            />
            {projectA.presentationUrl && (
              <button
                type="button"
                onClick={() => setPresentationTarget("A")}
                className="mt-1.5 text-xs text-accent/70 hover:text-accent transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Presentation Evaluation
              </button>
            )}
          </div>
          <div>
            <ProjectCard
              participant={projectB}
              onClick={() => handleVote(projectB.id)}
              state={cardState(projectB.id)}
              disabled={phase !== "idle"}
            />
            {projectB.presentationUrl && (
              <button
                type="button"
                onClick={() => setPresentationTarget("B")}
                className="mt-1.5 text-xs text-accent/70 hover:text-accent transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Presentation Evaluation
              </button>
            )}
          </div>
        </div>

        {/* Presentation evaluation modal */}
        <PresentationModal
          participant={presentationTarget === "B" ? projectB : projectA}
          isOpen={presentationTarget !== null}
          onClose={() => setPresentationTarget(null)}
        />

        {/* Chat panels */}
        <div className="flex-1 min-h-0 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChatPanel project={projectA} messagesRef={chatMessagesRefA} />
          <ChatPanel project={projectB} messagesRef={chatMessagesRefB} />
        </div>

        {/* Compare drawer */}
        <CompareDrawer projectA={projectA} projectB={projectB} />

        {/* Progress bar */}
        <div className="py-3 shrink-0">
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted mt-1.5 text-center">
            {comparisons.length} of {maxPairs} comparisons completed
          </p>
        </div>
      </div>
    </div>
  );
}
