import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { winnerId, loserId } = (await req.json()) as {
    winnerId: string;
    loserId: string;
  };

  const store = getStore();
  store.votes.push({ winnerId, loserId, timestamp: Date.now() });
  saveStore(store);

  return NextResponse.json({ ok: true });
}
