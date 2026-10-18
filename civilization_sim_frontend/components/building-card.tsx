import {
  BUILDING_EMOJI,
  BUILDING_HELP,
  BUILDING_LABEL,
  JOB_LABEL,
} from "@/lib/labels";
import type { Building, Citizen } from "@/lib/types";

function PersonRow({
  citizen,
  role,
  onSelect,
}: {
  citizen: Citizen;
  role: string;
  onSelect?: (citizen: Citizen) => void;
}) {
  const content = (
    <span className="flex items-center justify-between gap-2">
      <span className="truncate font-bold">{citizen.name}</span>
      <span className="shrink-0 text-xs text-[#484d55]">{role}</span>
    </span>
  );
  if (!onSelect) {
    return <li className="px-2 py-1.5 text-sm">{content}</li>;
  }
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(citizen)}
        className="w-full px-2 py-1.5 text-left text-sm hover:bg-[#b0b0b0]"
      >
        {content}
      </button>
    </li>
  );
}

export function BuildingCard({
  building,
  citizens,
  onSelectCitizen,
}: {
  building: Building;
  citizens: Citizen[];
  onSelectCitizen?: (citizen: Citizen) => void;
}) {
  const isHouse = building.type === "House";
  const residents = isHouse
    ? citizens.filter((citizen) => citizen.livesInBuildingId === building.id)
    : [];
  const workers = isHouse
    ? []
    : citizens.filter(
        (citizen) => citizen.worksAtBuildingId === building.id,
      );

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

      <div>
        <p className="mb-1 text-xs font-semibold text-[#484d55]">
          {isHouse ? "🏠 People who live here" : "👷 People who work here"}
        </p>
        {(isHouse ? residents : workers).length === 0 ? (
          <p className="text-sm text-[#4a4f57]">
            {isHouse ? "Nobody lives here yet." : "Nobody works here yet."}
          </p>
        ) : (
          <ul className="mc-inset divide-y divide-[#6f6f6f] text-[#16181c]">
            {(isHouse ? residents : workers).map((citizen) => (
              <PersonRow
                key={citizen.id}
                citizen={citizen}
                role={isHouse ? "resident" : JOB_LABEL[citizen.job]}
                onSelect={onSelectCitizen}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
