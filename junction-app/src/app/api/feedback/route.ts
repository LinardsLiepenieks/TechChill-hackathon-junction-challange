import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { participantId, strengths, weaknesses } = (await req.json()) as {
    participantId: string;
    strengths: string[];
    weaknesses: string[];
  };

  const store = getStore();
  const existing = store.feedback[participantId] || { strengths: [], weaknesses: [] };
  store.feedback[participantId] = {
    strengths: [...existing.strengths, ...strengths],
    weaknesses: [...existing.weaknesses, ...weaknesses],
  };
  saveStore(store);

  return NextResponse.json({ ok: true });
}
