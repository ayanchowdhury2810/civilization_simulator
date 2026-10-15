import type { Citizen, CitizenAction } from "./types.js";

export const HUNGRY_FOOD_LEVEL = 30;
export const MONEY_WORK_THRESHOLD = 20;

export function decideAction(
  citizen: Citizen,
  foodPrice: number,
): CitizenAction {
  if (citizen.foodLevel < HUNGRY_FOOD_LEVEL && citizen.money >= foodPrice) {
    return "BUY_FOOD";
  }
  if (citizen.money < MONEY_WORK_THRESHOLD) {
    return "WORK";
  }
  return "WANDER";
}
