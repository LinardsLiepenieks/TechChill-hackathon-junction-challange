"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Participant, ChatMessage } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { organizerRulebook, challengeRulebook } from "@/data/rulebooks";

interface PresentationModalProps {
  participant: Participant;
  isOpen: boolean;
  onClose: () => void;
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

export function PresentationModal({ participant, isOpen, onClose }: PresentationModalProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fetchedRef = useRef<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!participant.presentationUrl) return;

    // Don't re-fetch if already loaded for this participant
    if (fetchedRef.current === participant.id) return;
    fetchedRef.current = participant.id;

    setIsLoading(true);
    setError(null);
    setContent("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const systemMsg: ChatMessage = {
      role: "system",
      content: `You are a hackathon judging assistant. Evaluate a project based on its presentation.

PROJECT:
- Name: ${participant.projectName}
- Team: ${participant.teamName} (${participant.teamMembers.join(", ")})
- Description: ${participant.description}
- Presentation PDF: ${participant.presentationUrl}

JUDGING CRITERIA:
${organizerRulebook.content}

CHALLENGE BRIEF:
${challengeRulebook.content}`,
    };

    const userMsg: ChatMessage = {
      role: "user",
      content: `Visit and read the presentation PDF at: ${participant.presentationUrl}

Based on the presentation content, provide a structured evaluation:
1. **Presentation Summary** — What does the presentation cover?
2. **Strengths** — What stands out positively from the presentation?
3. **Weaknesses / Gaps** — What's missing or could be improved?
4. **Alignment with Criteria** — How well does it match the judging criteria?

Be concise and use bullet points.`,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [systemMsg, userMsg] }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get response");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";
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
              accumulated += delta;
              setContent(accumulated);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
      fetchedRef.current = null; // allow retry
    } finally {
      if (abortRef.current === controller) setIsLoading(false);
    }
  }, [participant]);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen) fetchAnalysis();
  }, [isOpen, fetchAnalysis]);

  // Reset when participant changes
  useEffect(() => {
    fetchedRef.current = null;
    setContent("");
    setError(null);
  }, [participant.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${participant.projectName} — Presentation`}
    >
      <div>
        {participant.presentationUrl && (
          <a
            href={participant.presentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Presentation
          </a>
        )}

        {isLoading && !content && (
          <p className="text-sm text-muted/50 animate-pulse">Reading presentation and analyzing...</p>
        )}

        {content && (
          <div className="text-sm text-foreground/85 leading-relaxed">
            {renderMarkdown(content)}
          </div>
        )}

        {isLoading && content && (
          <span className="inline-block text-muted/50 animate-pulse text-sm mt-1">...</span>
        )}

        {error && (
          <div className="text-sm text-red-400/80 px-3 py-2 border border-red-400/20 rounded-lg mt-2">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
