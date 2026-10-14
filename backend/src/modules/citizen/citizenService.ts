import { NotFoundError } from "../../error/notFoundError.js";
import { worldState } from "../../simulation/worldState.js";
import type { Citizen } from "../../simulation/types.js";
import { fetchCitizenFromGraph } from "./citizenRepository.js";

export interface CitizenDetail extends Citizen {
  worksAt: { id: string; type: string } | null;
  livesIn: { id: string; type: string } | null;
}

export async function getCitizenById(id: string): Promise<CitizenDetail> {
  const citizen = worldState.citizens.get(id);
  if (citizen) {
    return enrich(citizen);
  }

  const graphProps = await fetchCitizenFromGraph(id).catch(() => null);
  if (!graphProps) {
    throw new NotFoundError(`Citizen ${id} not found`);
  }
  return {
    id: String(graphProps.id),
    name: String(graphProps.name),
    job: String(graphProps.job) as Citizen["job"],
    hunger: Number(graphProps.hunger),
    money: Number(graphProps.money),
    happiness: Number(graphProps.happiness),
    currentAction: (graphProps.currentAction as Citizen["currentAction"]) ?? null,
    worksAtBuildingId: null,
    livesInBuildingId: null,
    x: Number(graphProps.x),
    y: Number(graphProps.y),
    worksAt: null,
    livesIn: null,
  };
}

function enrich(citizen: Citizen): CitizenDetail {
  const worksAt = citizen.worksAtBuildingId
    ? worldState.buildings.get(citizen.worksAtBuildingId)
    : null;
  const livesIn = citizen.livesInBuildingId
    ? worldState.buildings.get(citizen.livesInBuildingId)
    : null;
  return {
    ...citizen,
    worksAt: worksAt ? { id: worksAt.id, type: worksAt.type } : null,
    livesIn: livesIn ? { id: livesIn.id, type: livesIn.type } : null,
  };
}
