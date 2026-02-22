import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  const { messages, projectName } = (await req.json()) as {
    messages: ChatMessage[];
    projectName: string;
  };

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || apiKey === "pplx-your-key-here") {
    return NextResponse.json({ error: "PERPLEXITY_API_KEY not configured" }, { status: 500 });
  }

  const summarizePrompt: ChatMessage = {
    role: "user",
    content: `Based on the conversation above, extract concise feedback for "${projectName}" as bullet points.

List 2-3 strengths and 2-3 weaknesses.

Each point must be very concise (3-8 words max), like:
- "Strong technical architecture"
- "Unclear revenue model"
- "Innovative use of AI"
- "Limited market research"

Respond ONLY with valid JSON, no markdown, no explanation:
{"strengths":["...","..."],"weaknesses":["...","..."]}`,
  };

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [...messages, summarizePrompt],
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse feedback" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summarization failed" },
      { status: 500 },
    );
  }
}
