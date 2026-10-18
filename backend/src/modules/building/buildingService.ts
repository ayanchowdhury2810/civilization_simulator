import { ConflictError } from "../../error/conflictError.js";
import { distributeJobWorkers } from "../../simulation/dynamicWorld.js";
import type { Building, BuildingType } from "../../simulation/types.js";
import type { WorldState } from "../../simulation/worldState.js";
import { loadWorldStateFromGraph, updateWorldState } from "../world/worldService.js";
import { persistBuilding } from "./buildingRepository.js";

export const BUILDING_COSTS: Record<BuildingType, number> = {
  House: 15,
  Farm: 20,
  Market: 30,
};

export function buildInWorld(
  state: WorldState,
  type: BuildingType,
): Building {
  const cost = BUILDING_COSTS[type];
  if (state.resources.gold < cost) {
    throw new ConflictError(
      `Not enough gold to build ${type}. Need ${cost}, have ${state.resources.gold}.`,
    );
  }

  state.resources.gold -= cost;
  const building = state.addBuilding(type);
  if (type === "Farm" || type === "Market") distributeJobWorkers(state);
  state.addEvent({
    type: "BuildingBuilt",
    message: `${type} built (${building.id}) for ${cost} gold.`,
    buildingId: building.id,
  });
  return building;
}

export async function build(
  type: BuildingType,
): Promise<{ building: Building; graphSynced: boolean }> {
  const building = await updateWorldState(async (state) => {
    const created = buildInWorld(state, type);
    await persistBuilding(created);
    return created;
  });
  return { building, graphSynced: true };
}

export async function getBuildings(): Promise<Building[]> {
  const state = await loadWorldStateFromGraph();
  return [...state.buildings.values()];
}
