import { CITIZEN_NAMES } from "../common/constants/index.js";
import type { WorldState } from "./worldState.js";
import type { Job } from "./types.js";

const SEED_JOBS: Job[] = [
  "Farmer",
  "Merchant",
  "Farmer",
  "Builder",
  "Unemployed",
  "Farmer",
];

export function seedWorld(state: WorldState): void {
  const farm = state.addBuilding("Farm");
  const market = state.addBuilding("Market");
  const house1 = state.addBuilding("House");
  const house2 = state.addBuilding("House");
  const houses = [house1, house2];

  SEED_JOBS.forEach((job, index) => {
    const citizen = state.addCitizen({
      name: CITIZEN_NAMES[index % CITIZEN_NAMES.length],
      job,
      foodLevel: 55 + Math.round(Math.random() * 30),
      money: 20 + Math.round(Math.random() * 40),
      happiness: 60 + Math.round(Math.random() * 30),
    });

    citizen.livesInBuildingId = houses[index % houses.length].id;

    if (job === "Farmer") {
      citizen.worksAtBuildingId = farm.id;
      farm.workerIds.push(citizen.id);
    } else if (job === "Merchant") {
      citizen.worksAtBuildingId = market.id;
      market.workerIds.push(citizen.id);
    }
  });

  state.resources.population = state.citizens.size;
}
