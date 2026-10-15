"use client";

import { Panel } from "./ui/panel";
import type { BuildingType, SelectedEntity, WorldSnapshot } from "@/lib/types";
import { JOB_DOTS } from "@/lib/format";
import { BUILDING_EMOJI, BUILDING_LABEL } from "@/lib/labels";

const BUILDING_ORDER: BuildingType[] = ["Farm", "House", "Market"];

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
      title="The Town"
      subtitle="Tap a person or a building to learn about it"
      actions={
        <div className="hidden items-center gap-3 text-xs font-semibold text-slate-500 sm:flex">
          {BUILDING_ORDER.map((type) => (
            <span key={type} className="inline-flex items-center gap-1">
              <span className="text-base">{BUILDING_EMOJI[type]}</span>
              {BUILDING_LABEL[type]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            Person
          </span>
        </div>
      }
      bodyClassName="p-0"
      className="min-h-[360px]"
    >
      <div className="relative h-full min-h-[320px] w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.12),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(56,189,248,0.16),transparent_55%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />

        {world?.buildings.map((building) => {
          const active =
            selected?.kind === "building" && selected.id === building.id;
          return (
            <button
              key={building.id}
              type="button"
              title={BUILDING_LABEL[building.type]}
              onClick={() => onSelect({ kind: "building", id: building.id })}
              className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 bg-white text-lg shadow-md transition-transform hover:scale-110 ${
                active
                  ? "border-amber-400 ring-4 ring-amber-200"
                  : "border-slate-200"
              }`}
              style={{ left: `${building.x}%`, top: `${building.y}%` }}
            >
              {BUILDING_EMOJI[building.type]}
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
              title={citizen.name}
              onClick={() => onSelect({ kind: "citizen", id: citizen.id })}
              className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-transform hover:scale-150 ${
                JOB_DOTS[citizen.job]
              } ${active ? "ring-4 ring-amber-200" : ""}`}
              style={{ left: `${citizen.x}%`, top: `${citizen.y}%` }}
            />
          );
        })}

        {!world ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-500">
            Starting your town…
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
