export interface Participant {
  id: string;
  projectName: string;
  description: string;
  teamName: string;
  teamMembers: string[];
  score: number | null;
  demoUrl: string;
  seed?: boolean;
}

export interface Rulebook {
  title: string;
  content: string;
}

export interface ProjectRating {
  participantId: string;
  mu: number;
  sigma2: number;
}

export interface Comparison {
  winnerId: string;
  loserId: string;
  timestamp: number;
}

export type AppView = "dashboard" | "judging" | "leaderboard";

export type DashboardTab = "peer-review" | "challenge" | "apply" | "leaderboard";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProjectFeedback {
  strengths: string[];
  weaknesses: string[];
}
