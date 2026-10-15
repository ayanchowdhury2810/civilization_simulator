import { BUILDING_EMOJI, BUILDING_HELP, BUILDING_LABEL } from "@/lib/labels";
import type { Building } from "@/lib/types";

export function BuildingCard({ building }: { building: Building }) {
  const isHouse = building.type === "House";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{BUILDING_EMOJI[building.type]}</span>
        <div>
          <p className="text-base font-extrabold text-slate-800">
            {BUILDING_LABEL[building.type]}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {BUILDING_HELP[building.type]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {isHouse ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">
              🏠 Space for
            </p>
            <p className="text-lg font-extrabold text-slate-800">
              {building.capacity} people
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">👷 Workers</p>
              <p className="text-lg font-extrabold text-slate-800">
                {building.workerIds.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">
                🍎 Food / worker
              </p>
              <p className="text-lg font-extrabold text-slate-800">
                {building.foodPerWorkerTick}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
