import { Participant } from "@/types";

export type CardState = "idle" | "winner" | "loser" | "exit";

interface ProjectCardProps {
  participant: Participant;
  onClick: () => void;
  state?: CardState;
  disabled?: boolean;
}

export function ProjectCard({
  participant,
  onClick,
  state = "idle",
  disabled = false,
}: ProjectCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-state={state !== "idle" ? state : undefined}
      className="judge-card w-full text-left rounded-lg border px-5 py-4 cursor-pointer group disabled:pointer-events-none"
    >
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs text-muted">{participant.teamName}</span>
      </div>

      <h3 className="text-base font-semibold mb-1.5 group-hover:text-green transition-colors duration-200">
        {participant.projectName}
      </h3>

      <p className="text-xs text-muted/80 leading-relaxed mb-3">{participant.description}</p>

      <div className="flex flex-wrap gap-1">
        {participant.teamMembers.map((member) => (
          <span
            key={member}
            className="text-[11px] px-1.5 py-0.5 rounded-full border border-border text-muted"
          >
            {member}
          </span>
        ))}
      </div>
    </button>
  );
}
