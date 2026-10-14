import type { Citizen, CitizenAction } from "./types.js";

export const HUNGER_BUY_THRESHOLD = 30;
export const MONEY_WORK_THRESHOLD = 20;

export function decideAction(citizen: Citizen): CitizenAction {
  if (citizen.hunger < HUNGER_BUY_THRESHOLD) {
    return "BUY_FOOD";
  }
  if (citizen.money < MONEY_WORK_THRESHOLD) {
    return "WORK";
  }
  return "WANDER";
}
