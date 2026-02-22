import { Participant } from "@/types";

interface ParticipantRowProps {
  participant: Participant;
}

export function ParticipantRow({ participant }: ParticipantRowProps) {
  return (
    <tr className="border-b border-border hover:bg-foreground/[0.03] transition-colors">
      <td className="px-4 py-3 font-medium text-sm">
        {participant.projectName}
        {participant.seed && (
          <span className="ml-1.5 text-[10px] text-muted/40">sample</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted max-w-xs truncate">
        {participant.description}
      </td>
      <td className="px-4 py-3 text-sm">{participant.teamName}</td>
      <td className="px-4 py-3 text-sm text-muted">{participant.teamMembers.join(", ")}</td>
      <td className="px-4 py-3 text-center font-mono text-sm">
        {participant.score !== null ? (
          participant.score
        ) : (
          <span className="text-muted/40">--</span>
        )}
      </td>
      <td className="px-4 py-3">
        <a
          href={participant.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted hover:text-foreground transition-colors underline underline-offset-2"
        >
          Demo
        </a>
      </td>
    </tr>
  );
}
