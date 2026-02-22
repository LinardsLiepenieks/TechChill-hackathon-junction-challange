"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Participant, ChatMessage } from "@/types";
import { organizerRulebook, challengeRulebook } from "@/data/rulebooks";

interface CompareDrawerProps {
  projectA: Participant;
  projectB: Participant;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

function buildCompareSystem(a: Participant, b: Participant): string {
  return `You are a hackathon judging assistant helping a judge compare two projects side by side.

PROJECT A:
- Name: ${a.projectName}
- Team: ${a.teamName} (${a.teamMembers.join(", ")})
- Description: ${a.description}
- Demo: ${a.demoUrl}${a.presentationUrl ? `\n- Presentation: ${a.presentationUrl}` : ""}

PROJECT B:
- Name: ${b.projectName}
- Team: ${b.teamName} (${b.teamMembers.join(", ")})
- Description: ${b.description}
- Demo: ${b.demoUrl}${b.presentationUrl ? `\n- Presentation: ${b.presentationUrl}` : ""}

${a.presentationUrl || b.presentationUrl ? "IMPORTANT: For any project that has a Presentation URL, visit that URL, read the PDF content, and use it as primary context for your comparison.\n" : ""}

JUDGING CRITERIA (Project Guidelines):
${organizerRulebook.content}

CHALLENGE BRIEF:
${challengeRulebook.content}

Help the judge compare these projects. Be concise and balanced. Use short paragraphs and bullet points.
When asked, you can search the internet for context about technologies or similar projects.`;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1.5">{applyInline(line.slice(4))}</h4>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1.5">{applyInline(line.slice(3))}</h3>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">{applyInline(line.slice(2))}</h2>);
      i++; continue;
    }

    if (/^[\s]*[-*]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\s]*[-*]\s/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 pl-1">{applyInline(lines[i].replace(/^[\s]*[-*]\s/, ""))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc space-y-1 my-2">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 pl-1">{applyInline(lines[i].replace(/^\d+\.\s/, ""))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal space-y-1 my-2">{items}</ol>);
      continue;
    }

    elements.push(<p key={i} className="my-1.5">{applyInline(line)}</p>);
    i++;
  }
  return elements;
}

function applyInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="font-semibold text-foreground">{match[2]}</strong>);
    else if (match[3]) parts.push(<code key={match.index} className="text-xs px-1 py-0.5 rounded bg-foreground/10 font-mono">{match[3]}</code>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 ? parts[0] : parts;
}

export function CompareDrawer({ projectA, projectB }: CompareDrawerProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pairKey = `${projectA.id}-${projectB.id}`;
  const prevPairRef = useRef<string | null>(null);

  // Reset on pair change
  useEffect(() => {
    if (prevPairRef.current === pairKey) return;
    prevPairRef.current = pairKey;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setOpen(false);
  }, [pairKey]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessages = useCallback(
    async (apiMessages: ChatMessage[], displayMessages: DisplayMessage[]) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get response");
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let assistantContent = "";
        setMessages([...displayMessages, { role: "assistant", content: "" }]);

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (controller.signal.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (abortRef.current === controller) setIsLoading(false);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const systemMsg: ChatMessage = { role: "system", content: buildCompareSystem(projectA, projectB) };
    const userMsg: ChatMessage = { role: "user", content: trimmed };

    const apiMessages: ChatMessage[] = [
      systemMsg,
      ...messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
      userMsg,
    ];

    const newDisplay: DisplayMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newDisplay);
    setInput("");
    sendMessages(apiMessages, newDisplay);
  };

  return (
    <div
      className="shrink-0 border border-border rounded-t-lg overflow-hidden transition-all duration-300 ease-out"
      style={{ maxHeight: open ? "50vh" : "36px" }}
    >
      {/* Drawer handle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <span
          className="text-[10px] transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▲
        </span>
        <span>Compare</span>
      </button>

      {/* Chat body */}
      {open && (
        <div className="border-t border-border flex flex-col" style={{ height: "calc(50vh - 36px)" }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-sm text-foreground/20 text-center py-8">
                Ask anything to compare {projectA.projectName} vs {projectB.projectName}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-foreground/10 text-foreground">
                      {msg.content}
                    </div>
                  </div>
                )}
                {msg.role === "assistant" && (
                  <div className="text-sm text-foreground/85 leading-relaxed">
                    {msg.content ? renderMarkdown(msg.content) : (
                      <span className="text-muted/50 animate-pulse">Thinking...</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="text-sm text-red-400/80 px-3 py-2 border border-red-400/20 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2.5 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Compare these projects..."
              disabled={isLoading}
              className="flex-1 bg-foreground/5 text-sm text-foreground placeholder:text-foreground/30 outline-none rounded-md border border-border px-3 py-1.5 focus:border-accent/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-xs font-medium text-muted hover:text-foreground disabled:text-muted/30 transition-colors cursor-pointer px-3 py-1.5 rounded-md border border-border hover:border-accent/40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
