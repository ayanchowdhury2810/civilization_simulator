import { NotFoundError } from "../../error/notFoundError.js";
import type { Citizen } from "../../simulation/types.js";
import { loadWorldStateFromGraph } from "../world/worldService.js";

export interface CitizenDetail extends Citizen {
  worksAt: { id: string; type: string } | null;
  livesIn: { id: string; type: string } | null;
}

export async function getCitizenById(id: string): Promise<CitizenDetail> {
  const state = await loadWorldStateFromGraph();
  const citizen = state.citizens.get(id);
  if (!citizen) {
    throw new NotFoundError(`Citizen ${id} not found`);
  }
  const worksAt = citizen.worksAtBuildingId
    ? state.buildings.get(citizen.worksAtBuildingId)
    : null;
  const livesIn = citizen.livesInBuildingId
    ? state.buildings.get(citizen.livesInBuildingId)
    : null;
  return {
    ...citizen,
    worksAt: worksAt ? { id: worksAt.id, type: worksAt.type } : null,
    livesIn: livesIn ? { id: livesIn.id, type: livesIn.type } : null,
  };
}
