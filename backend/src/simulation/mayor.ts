import {
  MAYOR_LOW_FOOD_PER_CITIZEN,
  MAYOR_LOW_HAPPINESS,
} from "../common/constants/index.js";
import type { MayorEvaluation } from "./types.js";
import type { WorldState } from "./worldState.js";

function averageHappiness(state: WorldState): number {
  if (state.citizens.size === 0) return 0;
  let total = 0;
  for (const citizen of state.citizens.values()) {
    total += citizen.happiness;
  }
  return total / state.citizens.size;
}

function latestEventId(state: WorldState, types: string[]): string | null {
  for (let i = state.events.length - 1; i >= 0; i -= 1) {
    if (types.includes(state.events[i].type)) return state.events[i].id;
  }
  return null;
}

export function evaluateWorld(state: WorldState): MayorEvaluation {
  const population = state.citizens.size;
  const foodPerCitizen =
    population > 0 ? state.resources.food / population : 0;
  const avgHappiness = averageHappiness(state);
  const housingCapacity = state.housingCapacity;

  if (population > 0 && foodPerCitizen < MAYOR_LOW_FOOD_PER_CITIZEN) {
    return {
      action: "BuildFarm",
      buildingType: "Farm",
      reason:
        `Food per citizen is ${foodPerCitizen.toFixed(1)}, below the target of ` +
        `${MAYOR_LOW_FOOD_PER_CITIZEN.toFixed(1)}. A new farm will raise food output.`,
      triggeredByEventId: latestEventId(state, [
        "FoodShortage",
        "FarmYieldLow",
        "WorkerLeftJob",
      ]),
    };
  }

  if (population >= housingCapacity) {
    return {
      action: "BuildHouse",
      buildingType: "House",
      reason:
        `Population ${population} has reached housing capacity ${housingCapacity}. ` +
        `New homes are needed before more citizens can arrive.`,
      triggeredByEventId: latestEventId(state, [
        "CitizenArrived",
        "BuildingBuilt",
      ]),
    };
  }

  if (avgHappiness < MAYOR_LOW_HAPPINESS) {
    return {
      action: "BuildFarm",
      buildingType: "Farm",
      reason:
        `Average happiness is ${Math.round(avgHappiness)}, below the target of ` +
        `${MAYOR_LOW_HAPPINESS}. More food should steady the citizens.`,
      triggeredByEventId: latestEventId(state, [
        "FoodShortage",
        "CitizenSick",
      ]),
    };
  }

  return {
    action: "DoNothing",
    buildingType: null,
    reason:
      "Food supply, housing and happiness are stable. The mayor recommends no action.",
    triggeredByEventId: null,
  };
}
