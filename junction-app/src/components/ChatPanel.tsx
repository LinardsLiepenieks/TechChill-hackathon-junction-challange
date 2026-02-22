"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Participant, ChatMessage } from "@/types";
import { organizerRulebook, challengeRulebook } from "@/data/rulebooks";

interface ChatPanelProps {
  project: Participant;
  messagesRef?: React.MutableRefObject<ChatMessage[]>;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
}

function buildSystemMessage(p: Participant): string {
  return `You are a hackathon judging assistant helping a judge evaluate a project.

PROJECT:
- Name: ${p.projectName}
- Team: ${p.teamName} (${p.teamMembers.join(", ")})
- Description: ${p.description}
- Demo: ${p.demoUrl}

JUDGING CRITERIA (Project Guidelines):
${organizerRulebook.content}

CHALLENGE BRIEF:
${challengeRulebook.content}

Help the judge evaluate this project. Be concise and direct. Use short paragraphs and bullet points.
When asked, you can search the internet for context about technologies or similar projects.`;
}

const INITIAL_PROMPT =
  "Analyze this project. Briefly summarize it, then evaluate how it aligns with the judging criteria (Innovation, Technical Execution, Design & UX, Impact). Note key strengths and concerns.";

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1.5">
          {applyInline(line.slice(4))}
        </h4>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1.5">
          {applyInline(line.slice(3))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">
          {applyInline(line.slice(2))}
        </h2>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\s]*[-*]\s/.test(lines[i])) {
        items.push(
          <li key={i} className="ml-4 pl-1">
            {applyInline(lines[i].replace(/^[\s]*[-*]\s/, ""))}
          </li>,
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 my-2">
          {items}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="ml-4 pl-1">
            {applyInline(lines[i].replace(/^\d+\.\s/, ""))}
          </li>,
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal space-y-1 my-2">
          {items}
        </ol>,
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="my-1.5">
        {applyInline(line)}
      </p>,
    );
    i++;
  }

  return elements;
}

function applyInline(text: string): React.ReactNode {
  // Process bold and inline code
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // bold
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // inline code
      parts.push(
        <code
          key={match.index}
          className="text-xs px-1 py-0.5 rounded bg-foreground/10 font-mono"
        >
          {match[3]}
        </code>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}

export function ChatPanel({ project, messagesRef }: ChatPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const projectKey = project.id;
  const sentRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep external ref in sync with full message history (including system message)
  useEffect(() => {
    if (!messagesRef) return;
    const systemMsg: ChatMessage = { role: "system", content: buildSystemMessage(project) };
    const userInit: ChatMessage = { role: "user", content: INITIAL_PROMPT };
    messagesRef.current = [
      systemMsg,
      userInit,
      ...messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    ];
  }, [messages, messagesRef, project]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessages = useCallback(
    async (apiMessages: ChatMessage[], displayMessages: DisplayMessage[]) => {
      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
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

          // Check if aborted between chunks
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
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (err) {
        // Silently ignore aborted requests
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        // Only clear loading if this controller wasn't replaced
        if (abortRef.current === controller) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (sentRef.current === projectKey) return;
    sentRef.current = projectKey;

    // Abort previous stream before starting new project
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const systemMsg: ChatMessage = {
      role: "system",
      content: buildSystemMessage(project),
    };
    const userMsg: ChatMessage = { role: "user", content: INITIAL_PROMPT };

    setMessages([]);
    setInput("");
    setError(null);
    setCollapsed(false);
    sendMessages([systemMsg, userMsg], []);
  }, [projectKey, project, sendMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const systemMsg: ChatMessage = {
      role: "system",
      content: buildSystemMessage(project),
    };

    // Build API messages from all messages (including hidden initial prompt)
    const apiMessages: ChatMessage[] = [
      systemMsg,
      { role: "user", content: INITIAL_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      userMsg,
    ];

    const newDisplay: DisplayMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newDisplay);
    setInput("");
    sendMessages(apiMessages, newDisplay);
  };

  const visibleMessages = messages.filter((m) => !m.hidden);

  return (
    <div className="h-full flex flex-col border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
      >
        <span className="truncate">{project.projectName}</span>
        <span className="text-xs">{collapsed ? "Show" : "Hide"}</span>
      </button>

      {!collapsed && (
        <div className="border-t border-border flex-1 flex flex-col min-h-0">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
          >
            {visibleMessages.length === 0 && isLoading && (
              <div className="text-sm text-muted/50 animate-pulse">
                Analyzing {project.projectName}...
              </div>
            )}

            {visibleMessages.map((msg, i) => (
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
                    {msg.content ? (
                      renderMarkdown(msg.content)
                    ) : (
                      <span className="text-muted/50 animate-pulse">
                        Thinking...
                      </span>
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

          <form
            onSubmit={handleSubmit}
            className="border-t border-border px-3 py-2.5 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this project..."
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
