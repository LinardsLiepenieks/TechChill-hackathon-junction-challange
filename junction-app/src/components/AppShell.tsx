"use client";

import { useState } from "react";
import { DashboardTab } from "@/types";
import { useJudging } from "@/context/JudgingContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ParticipantTable } from "@/components/ParticipantTable";
import { JudgingView } from "@/components/JudgingView";
import { Leaderboard } from "@/components/Leaderboard";
import { Button } from "@/components/ui/Button";
import { SubmitProjectForm } from "@/components/SubmitProjectForm";
import { TotalLeaderboard } from "@/components/TotalLeaderboard";

export function AppShell() {
  const { view, participants, startJudging, comparisons, maxPairs, setView } = useJudging();
  const [activeTab, setActiveTab] = useState<DashboardTab>("peer-review");

  if (view === "judging") return <JudgingView />;
  if (view === "leaderboard") return <Leaderboard />;

  const isDone = comparisons.length >= maxPairs;

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "apply" ? (
          <SubmitProjectForm onSubmitted={() => setActiveTab("peer-review")} />
        ) : activeTab === "leaderboard" ? (
          <TotalLeaderboard />
        ) : (
          <>
            <div>
              <h2 className="text-sm font-medium text-muted mb-4">
                Submissions ({participants.length})
              </h2>
              <ParticipantTable participants={participants} />
            </div>
            <div className="mt-8 flex justify-center">
              {isDone ? (
                <Button onClick={() => setView("leaderboard")}>View Leaderboard</Button>
              ) : (
                <Button onClick={startJudging}>
                  {comparisons.length > 0
                    ? `Continue Judging (${comparisons.length}/${maxPairs})`
                    : "Judge"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
