import {
  BASE_FOOD_PRICE,
  CITIZEN_ARRIVAL_CHANCE,
  CITIZEN_NAMES,
  CITIZEN_SICK_HAPPINESS_PENALTY,
  FARM_YIELD_VARIATION,
  JOB_SWITCH_CHANCE,
  MARKET_BOOM_DEMAND_GAIN,
  MARKET_BOOM_MERCHANT_BONUS,
  MARKET_DEMAND_DEFAULT,
  MARKET_DEMAND_MAX,
  MARKET_DEMAND_MIN,
  MAX_CITIZENS,
  MAX_FOOD_PRICE,
  MIN_FOOD_PRICE,
  MINOR_EVENT_CHANCE,
} from "../common/constants/index.js";
import type { Citizen, Job } from "./types.js";
import type { WorldState } from "./worldState.js";

const ARRIVAL_JOBS: Job[] = ["Farmer", "Merchant", "Builder", "Unemployed"];

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function countJob(state: WorldState, job: Job): number {
  let count = 0;
  for (const citizen of state.citizens.values()) {
    if (citizen.job === job) count += 1;
  }
  return count;
}

function employForJob(state: WorldState, citizen: Citizen, job: Job): void {
  citizen.job = job;
  if (job === "Farmer") {
    const farm = state.leastStaffedOfType("Farm");
    state.assignWorker(citizen, farm ? farm.id : null);
    return;
  }
  if (job === "Merchant") {
    const market = state.leastStaffedOfType("Market");
    state.assignWorker(citizen, market ? market.id : null);
    return;
  }
  state.assignWorker(citizen, null);
}

export function distributeJobWorkers(state: WorldState): void {
  distributeAcross(state, "Farmer", "Farm");
  distributeAcross(state, "Merchant", "Market");
}

function distributeAcross(
  state: WorldState,
  job: Job,
  type: "Farm" | "Market",
): void {
  const buildings = state.buildingsOfType(type);
  if (buildings.length === 0) return;

  const workers: Citizen[] = [];
  for (const citizen of state.citizens.values()) {
    if (citizen.job === job) workers.push(citizen);
  }
  if (workers.length === 0) return;

  for (const building of buildings) {
    building.workerIds = building.workerIds.filter((id) => {
      const citizen = state.citizens.get(id);
      return citizen ? citizen.job === job : false;
    });
  }

  let index = 0;
  for (const worker of workers) {
    const building = buildings[index % buildings.length];
    state.assignWorker(worker, building.id);
    index += 1;
  }
}

export function produceFood(state: WorldState): number {
  let lowYieldEvents = 0;
  for (const building of state.buildings.values()) {
    if (building.type !== "Farm" || building.workerIds.length === 0) continue;
    const base = building.workerIds.length * building.foodPerWorkerTick;
    const variation = 1 + (Math.random() * 2 - 1) * FARM_YIELD_VARIATION;
    const produced = Math.max(0, Math.round(base * variation));
    state.resources.food += produced;
    if (produced < base && chance(0.25)) {
      state.addEvent({
        type: "FarmYieldLow",
        message: `${building.id} produced only ${produced} food this tick (below average).`,
        buildingId: building.id,
      });
      lowYieldEvents += 1;
    }
  }
  return lowYieldEvents;
}

export function updateMarket(state: WorldState): void {
  const population = state.citizens.size;
  const foodPerCitizen = population > 0 ? state.resources.food / population : 0;

  let demand = state.market.demand;
  if (foodPerCitizen < 2) {
    demand += 8;
  } else if (foodPerCitizen > 4) {
    demand -= 6;
  }
  state.market.demand = clamp(demand, MARKET_DEMAND_MIN, MARKET_DEMAND_MAX);

  const targetPrice =
    BASE_FOOD_PRICE +
    Math.round((state.market.demand - MARKET_DEMAND_DEFAULT) / 10);
  state.market.foodPrice = clamp(targetPrice, MIN_FOOD_PRICE, MAX_FOOD_PRICE);
}

export function completePurchase(
  state: WorldState,
  buyer: Citizen,
  price: number,
): Citizen | null {
  const sellers: Citizen[] = [];
  for (const citizen of state.citizens.values()) {
    if (citizen.job !== "Merchant") continue;
    const workplace = citizen.worksAtBuildingId
      ? state.buildings.get(citizen.worksAtBuildingId)
      : null;
    if (workplace?.type === "Market") sellers.push(citizen);
  }

  if (sellers.length === 0) {
    state.resources.gold += price;
    return null;
  }

  const seller = randomOf(sellers);
  seller.money += price;
  state.addTrade({
    buyerId: buyer.id,
    sellerId: seller.id,
    item: "Food",
    price,
    tick: state.tick,
  });
  return seller;
}

export function runArrivals(state: WorldState): number {
  if (!chance(CITIZEN_ARRIVAL_CHANCE)) return 0;
  if (state.citizens.size >= MAX_CITIZENS) return 0;

  const house = state.findVacantHouse();
  if (!house) return 0;

  const name = `${randomOf(CITIZEN_NAMES)} #${state.citizens.size + 1}`;
  const citizen = state.addCitizen({
    name,
    job: randomOf(ARRIVAL_JOBS),
  });
  state.assignHouse(citizen, house.id);
  employForJob(state, citizen, citizen.job);

  state.addEvent({
    type: "CitizenArrived",
    message: `${citizen.name} arrived and moved into ${house.id}.`,
    citizenId: citizen.id,
  });
  return 1;
}

export function runJobSwitching(state: WorldState): number {
  if (!chance(JOB_SWITCH_CHANCE)) return 0;

  const market = state.firstBuildingOfType("Market");
  const farm = state.firstBuildingOfType("Farm");

  if (market && countJob(state, "Merchant") === 0) {
    const candidate = pickSwitchCandidate(state, "Merchant");
    if (candidate) {
      const previous = candidate.job;
      employForJob(state, candidate, "Merchant");
      state.addEvent({
        type: "JobChanged",
        message: `${candidate.name} switched from ${previous} to Merchant.`,
        citizenId: candidate.id,
      });
      return 1;
    }
  }

  const population = state.citizens.size;
  const foodPerCitizen = population > 0 ? state.resources.food / population : 0;
  if (farm && foodPerCitizen < 1.5) {
    const candidate = pickSwitchCandidate(state, "Farmer");
    if (candidate) {
      const previous = candidate.job;
      employForJob(state, candidate, "Farmer");
      state.addEvent({
        type: "JobChanged",
        message: `${candidate.name} switched from ${previous} to Farmer.`,
        citizenId: candidate.id,
      });
      return 1;
    }
  }

  return 0;
}

export function runMinorEvents(state: WorldState): string[] {
  const effects: string[] = [];

  if (state.citizens.size > 0 && chance(MINOR_EVENT_CHANCE)) {
    const citizen = randomOf([...state.citizens.values()]);
    citizen.happiness = clamp(
      citizen.happiness - CITIZEN_SICK_HAPPINESS_PENALTY,
      0,
      100,
    );
    state.addEvent({
      type: "CitizenSick",
      message: `${citizen.name} is sick and unhappy.`,
      citizenId: citizen.id,
    });
    effects.push("CitizenSick");
  }

  if (chance(MINOR_EVENT_CHANCE)) {
    const employed = [...state.citizens.values()].filter(
      (citizen) => citizen.job !== "Unemployed",
    );
    if (employed.length > 1) {
      const citizen = randomOf(employed);
      const previous = citizen.job;
      employForJob(state, citizen, "Unemployed");
      state.addEvent({
        type: "WorkerLeftJob",
        message: `${citizen.name} left their job as ${previous}.`,
        citizenId: citizen.id,
      });
      effects.push("WorkerLeftJob");
    }
  }

  if (chance(MINOR_EVENT_CHANCE)) {
    const market = state.firstBuildingOfType("Market");
    if (market) {
      state.market.demand = clamp(
        state.market.demand + MARKET_BOOM_DEMAND_GAIN,
        MARKET_DEMAND_MIN,
        MARKET_DEMAND_MAX,
      );
      for (const citizen of state.citizens.values()) {
        if (
          citizen.job === "Merchant" &&
          citizen.worksAtBuildingId === market.id
        ) {
          citizen.money += MARKET_BOOM_MERCHANT_BONUS;
        }
      }
      state.addEvent({
        type: "MarketBoom",
        message: "A market boom raises food demand.",
        buildingId: market.id,
      });
      effects.push("MarketBoom");
    }
  }

  return effects;
}

function pickSwitchCandidate(state: WorldState, target: Job): Citizen | null {
  const pool = [...state.citizens.values()].filter(
    (citizen) => citizen.job !== target,
  );
  if (pool.length === 0) return null;
  return randomOf(pool);
}
