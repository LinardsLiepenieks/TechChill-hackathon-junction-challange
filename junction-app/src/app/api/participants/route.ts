import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore, getVisibleParticipants } from "@/lib/store";
import { Participant } from "@/types";

export async function GET() {
  const store = getStore();
  return NextResponse.json(getVisibleParticipants(store));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<Participant, "score"> & { id?: string };
  const store = getStore();

  const id = body.id || `team-${Date.now()}`;
  const participant: Participant = { ...body, id, score: null };
  store.participants.push(participant);
  saveStore(store);

  return NextResponse.json(participant);
}
