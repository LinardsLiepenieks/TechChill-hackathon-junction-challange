import { Participant } from "@/types";
import { ParticipantRow } from "@/components/ParticipantRow";

interface ParticipantTableProps {
  participants: Participant[];
}

export function ParticipantTable({ participants }: ParticipantTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Project</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Description</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Team</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Members</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted text-center">Score</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Demo</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
