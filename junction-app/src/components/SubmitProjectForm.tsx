"use client";

import { useState } from "react";
import { useJudging } from "@/context/JudgingContext";
import { Button } from "@/components/ui/Button";

interface SubmitProjectFormProps {
  onSubmitted?: () => void;
}

export function SubmitProjectForm({ onSubmitted }: SubmitProjectFormProps) {
  const { addParticipant } = useJudging();
  const [submitted, setSubmitted] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  const canSubmit = projectName.trim() && description.trim() && teamName.trim() && members.length > 0;

  const addMember = () => {
    const name = memberInput.trim();
    if (!name || members.includes(name)) return;
    setMembers((prev) => [...prev, name]);
    setMemberInput("");
  };

  const removeMember = (name: string) => {
    setMembers((prev) => prev.filter((m) => m !== name));
  };

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    addParticipant({
      projectName: projectName.trim(),
      description: description.trim(),
      teamName: teamName.trim(),
      teamMembers: members,
      demoUrl: demoUrl.trim() || "https://example.com",
    });

    setProjectName("");
    setDescription("");
    setTeamName("");
    setMembers([]);
    setMemberInput("");
    setDemoUrl("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    onSubmitted?.();
  };

  const inputClass =
    "w-full bg-foreground/5 text-sm text-foreground placeholder:text-foreground/30 outline-none rounded-md border border-border px-3 py-2 focus:border-accent/50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Apply to Judging</h2>
        <p className="text-xs text-muted">Submit your project to be included in the judging pool.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Project Name *</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. EcoTrack"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Team Name *</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Green Bytes"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your project..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Team Members *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={handleMemberKeyDown}
            placeholder="Type a name and press Add"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={addMember}
            disabled={!memberInput.trim()}
            className="px-3 py-2 text-xs font-medium rounded-md border border-border text-muted hover:text-foreground hover:border-foreground/30 disabled:text-muted/30 disabled:border-border transition-colors cursor-pointer shrink-0"
          >
            Add
          </button>
        </div>
        {members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {members.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-border text-foreground/80 bg-foreground/5"
              >
                {m}
                <button
                  type="button"
                  onClick={() => removeMember(m)}
                  className="text-muted/50 hover:text-foreground transition-colors cursor-pointer ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Demo URL</label>
        <input
          type="url"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          placeholder="https://your-demo.com"
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={!canSubmit}>
          Submit Project
        </Button>
        {submitted && (
          <span className="text-xs text-green-400">Project added successfully!</span>
        )}
      </div>
    </form>
  );
}
