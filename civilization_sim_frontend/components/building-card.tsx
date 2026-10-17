import { BUILDING_EMOJI, BUILDING_HELP, BUILDING_LABEL } from "@/lib/labels";
import type { Building } from "@/lib/types";

export function BuildingCard({ building }: { building: Building }) {
  const isHouse = building.type === "House";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{BUILDING_EMOJI[building.type]}</span>
        <div>
          <p className="text-base font-bold text-[#16181c]">
            {BUILDING_LABEL[building.type]}
          </p>
          <p className="text-xs font-semibold text-[#484d55]">
            {BUILDING_HELP[building.type]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {isHouse ? (
          <div className="mc-inset px-3 py-2">
            <p className="text-xs font-semibold text-[#484d55]">
              🏠 Space for
            </p>
            <p className="text-lg font-bold">
              {building.capacity} people
            </p>
          </div>
        ) : (
          <>
            <div className="mc-inset px-3 py-2">
              <p className="text-xs font-semibold text-[#484d55]">👷 Workers</p>
              <p className="text-lg font-bold">
                {building.workerIds.length}
                {building.capacity > 0 ? ` / ${building.capacity}` : ""}
              </p>
            </div>
            {building.type === "Farm" ? (
              <div className="mc-inset px-3 py-2">
                <p className="text-xs font-semibold text-[#484d55]">
                  🍎 Food / worker
                </p>
                <p className="text-lg font-bold">
                  {building.foodPerWorkerTick}
                </p>
              </div>
            ) : (
              <div className="mc-inset px-3 py-2">
                <p className="text-xs font-semibold text-[#484d55]">
                  🍎 Food in stock
                </p>
                <p className="text-lg font-bold">{building.food}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
