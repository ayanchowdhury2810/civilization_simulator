import { Panel } from "./ui/panel";
import type { WorldSnapshot } from "@/lib/types";

function Stat({
  emoji,
  label,
  value,
  hint,
  bg,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
  bg: string;
}) {
  return (
    <div className={`border-2 ${bg} px-3 py-2`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#484d55]">{label}</p>
          <p className="text-xl font-bold text-[#16181c]">{value}</p>
        </div>
      </div>
      {hint ? <p className="mt-1 text-xs text-[#484d55]">{hint}</p> : null}
    </div>
  );
}

export function ResourcePanel({ world }: { world: WorldSnapshot | null }) {
  const resources = world?.resources;
  const population = resources?.population ?? 0;
  const capacity = world?.housingCapacity ?? 0;
  const spaceLeft = Math.max(0, capacity - population);

  const homesHint = world
    ? spaceLeft > 0
      ? `Room for ${spaceLeft} more`
      : "All homes are full!"
    : undefined;

  const foodHint = resources
    ? resources.food > 0
      ? "Yum, there is food!"
      : "Oh no, no food left!"
    : undefined;

  return (
    <Panel title="Your Town" subtitle={world ? `Day ${world.tick}` : "Loading…"}>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          emoji="🍎"
          label="Food"
          value={resources ? String(resources.food) : "—"}
          hint={foodHint}
          bg="border-emerald-100 bg-emerald-50"
        />
        <Stat
          emoji="🪙"
          label="Gold"
          value={resources ? String(resources.gold) : "—"}
          hint="Use gold to build"
          bg="border-amber-100 bg-amber-50"
        />
        <Stat
          emoji="🧑‍🤝‍🧑"
          label="People"
          value={resources ? String(population) : "—"}
          hint="Everyone who lives here"
          bg="border-sky-100 bg-sky-50"
        />
        <Stat
          emoji="🏠"
          label="Homes"
          value={world ? `${population}/${capacity}` : "—"}
          hint={homesHint}
          bg="border-indigo-100 bg-indigo-50"
        />
      </div>
    </Panel>
  );
}
