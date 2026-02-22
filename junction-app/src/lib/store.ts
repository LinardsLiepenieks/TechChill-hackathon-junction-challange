import fs from "fs";
import path from "path";
import { Participant, ProjectFeedback } from "@/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const SEED_PATH = path.join(process.cwd(), "data", "seed.json");

interface Vote {
  winnerId: string;
  loserId: string;
  timestamp: number;
}

export interface Store {
  participants: Participant[];
  votes: Vote[];
  feedback: Record<string, ProjectFeedback>;
}

function loadSeed(): Participant[] {
  const data = fs.readFileSync(SEED_PATH, "utf-8");
  return JSON.parse(data);
}

export function getStore(): Store {
  try {
    const data = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    // First run — seed with JSON seed data
    const initial: Store = {
      participants: loadSeed(),
      votes: [],
      feedback: {},
    };
    saveStore(initial);
    return initial;
  }
}

export function saveStore(store: Store): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

const MIN_PARTICIPANTS = 10;

/**
 * Returns visible participants:
 * - If real (non-seed) count >= MIN_PARTICIPANTS, return only real ones
 * - Otherwise, pad with seed participants up to MIN_PARTICIPANTS
 */
export function getVisibleParticipants(store: Store): Participant[] {
  const real = store.participants.filter((p) => !p.seed);
  if (real.length >= MIN_PARTICIPANTS) return real;

  const seeds = store.participants.filter((p) => p.seed);
  const needed = MIN_PARTICIPANTS - real.length;
  return [...real, ...seeds.slice(0, needed)];
}
