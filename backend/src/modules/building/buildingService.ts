import { ConflictError } from "../../error/conflictError.js";
import { distributeJobWorkers } from "../../simulation/dynamicWorld.js";
import { worldState } from "../../simulation/worldState.js";
import type { Building, BuildingType } from "../../simulation/types.js";
import { persistBuilding } from "./buildingRepository.js";

export const BUILDING_COSTS: Record<BuildingType, number> = {
  House: 15,
  Farm: 20,
  Market: 30,
};

export async function build(
  type: BuildingType,
): Promise<{ building: Building; graphSynced: boolean }> {
  const cost = BUILDING_COSTS[type];
  if (worldState.resources.gold < cost) {
    throw new ConflictError(
      `Not enough gold to build ${type}. Need ${cost}, have ${worldState.resources.gold}.`,
    );
  }

  worldState.resources.gold -= cost;
  const building = worldState.addBuilding(type);

  if (type === "Farm" || type === "Market") {
    distributeJobWorkers(worldState);
  }

  worldState.addEvent({
    type: "BuildingBuilt",
    message: `${type} built (${building.id}) for ${cost} gold.`,
    buildingId: building.id,
  });

  let graphSynced = true;
  try {
    await persistBuilding(building);
  } catch {
    graphSynced = false;
  }

  return { building, graphSynced };
}

export function getBuildings(): Building[] {
  return [...worldState.buildings.values()];
}
