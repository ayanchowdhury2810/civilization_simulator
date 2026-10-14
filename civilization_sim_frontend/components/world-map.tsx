"use client";

import { Panel } from "./ui/panel";
import type { SelectedEntity, WorldSnapshot } from "@/lib/types";
import {
  BUILDING_COLORS,
  BUILDING_GLYPHS,
  JOB_DOTS,
} from "@/lib/format";

export function WorldMap({
  world,
  selected,
  onSelect,
}: {
  world: WorldSnapshot | null;
  selected: SelectedEntity;
  onSelect: (entity: SelectedEntity) => void;
}) {
  return (
    <Panel
      title="World Map"
      subtitle="Click a citizen or building to inspect it"
      actions={
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Citizen
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-indigo-400" /> Building
          </span>
        </div>
      }
      bodyClassName="p-0"
      className="min-h-[320px]"
    >
      <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.08),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(99,102,241,0.10),transparent_55%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {world?.buildings.map((building) => {
          const active =
            selected?.kind === "building" && selected.id === building.id;
          return (
            <button
              key={building.id}
              type="button"
              title={`${building.type} ${building.id}`}
              onClick={() => onSelect({ kind: "building", id: building.id })}
              className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border text-[10px] font-bold text-zinc-950 transition-transform hover:scale-110 ${
                BUILDING_COLORS[building.type]
              } ${active ? "ring-2 ring-amber-300 ring-offset-1 ring-offset-zinc-950" : ""}`}
              style={{ left: `${building.x}%`, top: `${building.y}%` }}
            >
              {BUILDING_GLYPHS[building.type]}
            </button>
          );
        })}

        {world?.citizens.map((citizen) => {
          const active =
            selected?.kind === "citizen" && selected.id === citizen.id;
          return (
            <button
              key={citizen.id}
              type="button"
              title={`${citizen.name} — ${citizen.job}`}
              onClick={() => onSelect({ kind: "citizen", id: citizen.id })}
              className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-transform hover:scale-150 ${
                JOB_DOTS[citizen.job]
              } ${active ? "ring-2 ring-amber-300 ring-offset-1 ring-offset-zinc-950" : ""}`}
              style={{ left: `${citizen.x}%`, top: `${citizen.y}%` }}
            />
          );
        })}

        {!world ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Loading world…
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
