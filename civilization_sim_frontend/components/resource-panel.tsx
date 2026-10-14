import { Panel } from "./ui/panel";
import type { WorldSnapshot } from "@/lib/types";
import { formatTime } from "@/lib/format";

function Resource({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-lg font-semibold ${accent}`}>
        {value}
      </p>
    </div>
  );
}

export function ResourcePanel({ world }: { world: WorldSnapshot | null }) {
  const resources = world?.resources;
  const housing = world
    ? `${world.resources.population}/${world.housingCapacity}`
    : "—";

  return (
    <Panel
      title="Resources"
      subtitle={world ? `Tick ${world.tick}` : "awaiting world"}
      actions={
        <span className="font-mono text-[10px] text-zinc-500">
          {formatTime(world?.lastTickAt ?? null)}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <Resource
          label="Food"
          value={resources ? String(resources.food) : "—"}
          accent="text-emerald-300"
        />
        <Resource
          label="Gold"
          value={resources ? String(resources.gold) : "—"}
          accent="text-amber-300"
        />
        <Resource
          label="Population"
          value={resources ? String(resources.population) : "—"}
          accent="text-sky-300"
        />
        <Resource label="Housing" value={housing} accent="text-indigo-300" />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Food price
          </p>
          <p className="font-mono text-sm text-zinc-100">
            {world ? world.market.foodPrice : "—"} gold
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Demand
          </p>
          <p className="font-mono text-sm text-zinc-100">
            {world ? Math.round(world.market.demand) : "—"}
          </p>
        </div>
      </div>
    </Panel>
  );
}
