"use client";

import { useState } from "react";
import { DashboardTab } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { organizerRulebook, challengeRulebook } from "@/data/rulebooks";

type ActiveRulebook = "organizer" | "challenge" | null;

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardHeader({ activeTab, onTabChange }: DashboardHeaderProps) {
  const [activeRulebook, setActiveRulebook] = useState<ActiveRulebook>(null);

  const currentRulebook =
    activeRulebook === "organizer"
      ? organizerRulebook
      : activeRulebook === "challenge"
        ? challengeRulebook
        : null;

  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Judging Dashboard</h1>
      <p className="text-muted text-sm mb-5">Junction Hackathon</p>

      <div className="flex items-center gap-6 mb-6 border-b border-border">
        <button
          onClick={() => onTabChange("peer-review")}
          className={`pb-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "peer-review"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Peer Review
        </button>
        <button
          onClick={() => onTabChange("challenge")}
          className={`pb-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "challenge"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Challenge (Demo)
        </button>
        <button
          onClick={() => onTabChange("apply")}
          className={`pb-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "apply"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Apply
        </button>
        <button
          onClick={() => onTabChange("leaderboard")}
          className={`pb-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "leaderboard"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === "challenge" && (
        <p className="text-sm text-muted mb-4">
          Judges receive the challenge track brief alongside project details, providing specific
          context for evaluating submissions against the challenge criteria.
        </p>
      )}

      {activeTab !== "apply" && activeTab !== "leaderboard" && (
        <div className="flex gap-2">
          <Button onClick={() => setActiveRulebook("organizer")}>Project Guidelines</Button>
          {activeTab === "challenge" && (
            <Button variant="outline" onClick={() => setActiveRulebook("challenge")}>
              Challenge Brief
            </Button>
          )}
        </div>
      )}

      {currentRulebook && (
        <Modal
          isOpen={!!currentRulebook}
          onClose={() => setActiveRulebook(null)}
          title={currentRulebook.title}
        >
          {currentRulebook.content}
        </Modal>
      )}
    </header>
  );
}
