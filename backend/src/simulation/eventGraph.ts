import type { SimEvent } from "./types.js";

export const CAUSE_RULES: Record<string, string[]> = {
  FoodShortage: ["FarmYieldLow", "WorkerLeftJob", "CitizenArrived", "MarketBoom"],
  FoodBought: ["FoodShortage", "MarketBoom"],
  Trade: ["MarketBoom", "FoodShortage"],
  FarmYieldLow: ["WorkerLeftJob", "CitizenSick"],
  JobChanged: ["WorkerLeftJob", "FoodShortage"],
  CitizenArrived: ["BuildingBuilt"],
  WorkerLeftJob: ["CitizenSick"],
  MarketBoom: ["FoodShortage"],
  BuildingBuilt: ["PolicyApproved"],
  PolicyProposed: ["FoodShortage", "FarmYieldLow", "CitizenArrived"],
  PolicyApproved: ["PolicyProposed", "FoodShortage", "CitizenArrived"],
  CitizenSick: [],
  WorldCreated: [],
};

const CAUSE_WINDOW = 20;

export function inferCause(type: string, recent: SimEvent[]): SimEvent | null {
  const candidateTypes = CAUSE_RULES[type];
  if (!candidateTypes || candidateTypes.length === 0) return null;

  const window = recent.slice(-CAUSE_WINDOW);
  for (let i = window.length - 1; i >= 0; i -= 1) {
    if (candidateTypes.includes(window[i].type)) return window[i];
  }
  return null;
}
