import { Meter } from "./ui/meter";
import { Badge } from "./ui/badge";
import type { BuildingType, CitizenDetail } from "@/lib/types";
import {
  ACTION_EMOJI,
  ACTION_LABEL,
  BUILDING_EMOJI,
  BUILDING_LABEL,
  JOB_EMOJI,
  JOB_LABEL,
} from "@/lib/labels";

function buildingName(type: string | undefined): string {
  if (!type) return "a building";
  return BUILDING_LABEL[type as BuildingType] ?? "a building";
}

function buildingIcon(type: string | undefined): string {
  if (!type) return "🏠";
  return BUILDING_EMOJI[type as BuildingType] ?? "🏠";
}

export function CitizenCard({ citizen }: { citizen: CitizenDetail }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{JOB_EMOJI[citizen.job]}</span>
        <div>
          <p className="text-base font-extrabold text-slate-800">
            {citizen.name}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {JOB_LABEL[citizen.job]}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Meter label="🍎 Food level" value={citizen.foodLevel} />
        <Meter label="😊 Happy" value={citizen.happiness} />
        <Meter label="🪙 Money" value={citizen.money} max={200} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {citizen.currentAction ? (
          <Badge tone="sky">
            {ACTION_EMOJI[citizen.currentAction]}{" "}
            {ACTION_LABEL[citizen.currentAction]}
          </Badge>
        ) : null}
        {citizen.livesIn ? (
          <Badge tone="indigo">
            {buildingIcon(citizen.livesIn.type)} Lives in a{" "}
            {buildingName(citizen.livesIn.type)}
          </Badge>
        ) : (
          <Badge tone="rose">🏚️ No home</Badge>
        )}
        {citizen.worksAt ? (
          <Badge tone="emerald">
            {buildingIcon(citizen.worksAt.type)} Works at a{" "}
            {buildingName(citizen.worksAt.type)}
          </Badge>
        ) : (
          <Badge tone="zinc">🚶 No job place</Badge>
        )}
      </div>
    </div>
  );
}
