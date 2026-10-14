import { CITIZEN_FOOD_PER_TICK } from "../common/constants/index.js";
import { decideAction } from "./citizenAi.js";
import {
  completePurchase,
  produceFood,
  runArrivals,
  runJobSwitching,
  runMinorEvents,
  runTrading,
  updateMarket,
} from "./dynamicWorld.js";
import type { WorldState } from "./worldState.js";

export const FOOD_BUY_HUNGER_RESTORE = 30;
export const WORK_MONEY_EARNED = 4;
export const HUNGER_PER_TICK = 4;
export const WANDER_HAPPINESS_GAIN = 1;
export const STARVING_HAPPINESS_PENALTY = 3;
export const FOOD_SHORTAGE_HAPPINESS_PENALTY = 5;

export interface TickDynamicSummary {
  arrivals: number;
  jobChanges: number;
  trades: number;
  farmYieldEvents: number;
  minorEvents: string[];
}

export interface TickResult {
  tick: number;
  lastTickAt: string;
  actions: { citizenId: string; name: string; action: string }[];
  dynamic: TickDynamicSummary;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function runTick(state: WorldState): TickResult {
  state.tick += 1;
  const actions: TickResult["actions"] = [];

  const farmYieldEvents = produceFood(state);
  updateMarket(state);
  const price = state.market.foodPrice;
  let trades = 0;

  for (const citizen of state.citizens.values()) {
    citizen.hunger = clamp(citizen.hunger + HUNGER_PER_TICK, 0, 100);
    const action = decideAction(citizen);
    citizen.currentAction = action;
    actions.push({ citizenId: citizen.id, name: citizen.name, action });

    if (action === "BUY_FOOD") {
      if (citizen.money >= price && state.resources.food > 0) {
        citizen.money -= price;
        citizen.hunger = clamp(
          citizen.hunger + FOOD_BUY_HUNGER_RESTORE,
          0,
          100,
        );
        state.resources.food -= 1;
        citizen.happiness = clamp(citizen.happiness + 2, 0, 100);
        const seller = completePurchase(state, citizen, price);
        if (seller) trades += 1;
        state.addEvent({
          type: seller ? "Trade" : "FoodBought",
          message: seller
            ? `${citizen.name} bought food from ${seller.name} for ${price} gold.`
            : `${citizen.name} bought food for ${price} gold.`,
          citizenId: citizen.id,
          buildingId: seller?.worksAtBuildingId ?? undefined,
        });
      } else {
        citizen.happiness = clamp(
          citizen.happiness - STARVING_HAPPINESS_PENALTY,
          0,
          100,
        );
        if (state.resources.food <= 0) {
          citizen.happiness = clamp(
            citizen.happiness - FOOD_SHORTAGE_HAPPINESS_PENALTY,
            0,
            100,
          );
          state.addEvent({
            type: "FoodShortage",
            message: `No food available for ${citizen.name}.`,
            citizenId: citizen.id,
          });
        }
      }
    } else if (action === "WORK") {
      citizen.money += WORK_MONEY_EARNED;
      citizen.hunger = clamp(citizen.hunger - 2, 0, 100);
    } else {
      citizen.happiness = clamp(
        citizen.happiness + WANDER_HAPPINESS_GAIN,
        0,
        100,
      );
    }

    const eaten = Math.min(CITIZEN_FOOD_PER_TICK, state.resources.food);
    state.resources.food -= eaten;
    if (eaten === 0) {
      citizen.happiness = clamp(
        citizen.happiness - STARVING_HAPPINESS_PENALTY,
        0,
        100,
      );
    }
  }

  const marketTrades = runTrading(state, price);
  const arrivals = runArrivals(state);
  const jobChanges = runJobSwitching(state);
  const minorEvents = runMinorEvents(state);

  state.resources.population = state.citizens.size;
  state.lastTickAt = new Date().toISOString();

  return {
    tick: state.tick,
    lastTickAt: state.lastTickAt,
    actions,
    dynamic: {
      arrivals,
      jobChanges,
      trades: trades + marketTrades,
      farmYieldEvents,
      minorEvents,
    },
  };
}
