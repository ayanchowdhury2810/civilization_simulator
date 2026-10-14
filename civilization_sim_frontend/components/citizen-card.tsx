import { Meter } from "./ui/meter";
import { Badge } from "./ui/badge";
import type { CitizenDetail } from "@/lib/types";
import { JOB_COLORS } from "@/lib/format";

export function CitizenCard({ citizen }: { citizen: CitizenDetail }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{citizen.name}</p>
          <p className="font-mono text-[11px] text-zinc-500">{citizen.id}</p>
        </div>
        <span className={`text-xs font-medium ${JOB_COLORS[citizen.job]}`}>
          {citizen.job}
        </span>
      </div>

      <div className="space-y-2">
        <Meter label="Hunger" value={citizen.hunger} />
        <Meter label="Happiness" value={citizen.happiness} />
        <Meter label="Money" value={citizen.money} max={200} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {citizen.currentAction ? (
          <Badge tone="sky">{citizen.currentAction.replace("_", " ")}</Badge>
        ) : null}
        {citizen.livesIn ? (
          <Badge tone="indigo">Lives in {citizen.livesIn.id}</Badge>
        ) : (
          <Badge tone="rose">Homeless</Badge>
        )}
        {citizen.worksAt ? (
          <Badge tone="emerald">Works at {citizen.worksAt.id}</Badge>
        ) : (
          <Badge tone="zinc">No workplace</Badge>
        )}
      </div>
    </div>
  );
}
