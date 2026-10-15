import { randomUUID } from "node:crypto";
import {
  BASE_FOOD_PRICE,
  HOUSE_CAPACITY,
  MARKET_DEMAND_DEFAULT,
  MAX_EVENT_FEED,
  MAX_POLICIES,
  MAX_TRADE_LOG,
} from "../common/constants/index.js";
import type {
  Building,
  BuildingType,
  Citizen,
  Job,
  MarketState,
  PersistedWorld,
  Policy,
  SimEvent,
  Trade,
  WorldResources,
} from "./types.js";
import { inferCause } from "./eventGraph.js";

function maxNumericSuffix(ids: Iterable<string>): number {
  let max = 0;
  for (const id of ids) {
    const match = /_(\d+)$/.exec(id);
    if (match) {
      const value = Number(match[1]);
      if (value > max) max = value;
    }
  }
  return max;
}

export class WorldState {
  tick = 0;
  lastTickAt: string | null = null;
  resources: WorldResources = { food: 0, gold: 0, population: 0 };
  market: MarketState = {
    foodPrice: BASE_FOOD_PRICE,
    demand: MARKET_DEMAND_DEFAULT,
  };
  citizens = new Map<string, Citizen>();
  buildings = new Map<string, Building>();
  events: SimEvent[] = [];
  trades: Trade[] = [];
  policies: Policy[] = [];
  currentPolicy: Policy | null = null;

  private buildingCounter = 0;
  private citizenCounter = 0;
  private policyCounter = 0;

  reset(): void {
    this.tick = 0;
    this.lastTickAt = null;
    this.resources = { food: 0, gold: 0, population: 0 };
    this.market = {
      foodPrice: BASE_FOOD_PRICE,
      demand: MARKET_DEMAND_DEFAULT,
    };
    this.citizens.clear();
    this.buildings.clear();
    this.events = [];
    this.trades = [];
    this.policies = [];
    this.currentPolicy = null;
    this.buildingCounter = 0;
    this.citizenCounter = 0;
    this.policyCounter = 0;
  }

  restore(data: PersistedWorld): void {
    this.reset();
    this.tick = data.tick;
    this.lastTickAt = data.lastTickAt;
    this.resources = { ...data.resources };
    this.market = { ...data.market };
    for (const building of data.buildings) {
      this.buildings.set(building.id, building);
    }
    for (const citizen of data.citizens) {
      this.citizens.set(citizen.id, citizen);
    }
    this.events = [...data.events];
    this.trades = [...data.trades];
    this.policies = [...data.policies];
    this.resources.population = this.citizens.size;
    this.currentPolicy =
      [...this.policies].reverse().find((policy) => policy.status === "pending") ??
      null;
    this.recomputeCounters();
  }

  private recomputeCounters(): void {
    this.buildingCounter = maxNumericSuffix(this.buildings.keys());
    this.citizenCounter = maxNumericSuffix(this.citizens.keys());
    this.policyCounter = maxNumericSuffix(this.policies.map((policy) => policy.id));
  }

  addBuilding(type: BuildingType): Building {
    this.buildingCounter += 1;
    const id = `${type.toLowerCase()}_${this.buildingCounter}`;
    const building: Building = {
      id,
      type,
      capacity: type === "House" ? HOUSE_CAPACITY : 0,
      workerIds: [],
      foodPerWorkerTick: type === "Farm" ? 2 : 0,
      x: 10 + Math.round(Math.random() * 80),
      y: 10 + Math.round(Math.random() * 80),
    };
    this.buildings.set(id, building);
    return building;
  }

  addCitizen(
    partial: Pick<Citizen, "name" | "job"> &
      Partial<Pick<Citizen, "foodLevel" | "money" | "happiness">>,
  ): Citizen {
    this.citizenCounter += 1;
    const id = `citizen_${this.citizenCounter}`;
    const citizen: Citizen = {
      id,
      name: partial.name,
      job: partial.job,
      foodLevel: partial.foodLevel ?? 70,
      money: partial.money ?? 50,
      happiness: partial.happiness ?? 80,
      currentAction: null,
      worksAtBuildingId: null,
      livesInBuildingId: null,
      x: 10 + Math.round(Math.random() * 80),
      y: 10 + Math.round(Math.random() * 80),
    };
    this.citizens.set(id, citizen);
    this.resources.population = this.citizens.size;
    return citizen;
  }

  addEvent(
    event: Omit<
      SimEvent,
      "id" | "timestamp" | "tick" | "synced" | "causedByEventId"
    >,
  ): SimEvent {
    const cause = inferCause(event.type, this.events);
    const full: SimEvent = {
      ...event,
      id: `event_${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      tick: this.tick,
      synced: false,
      causedByEventId: cause?.id,
    };
    this.events.push(full);
    if (this.events.length > MAX_EVENT_FEED) {
      this.events.splice(0, this.events.length - MAX_EVENT_FEED);
    }
    return full;
  }

  getEventById(id: string): SimEvent | null {
    for (const event of this.events) {
      if (event.id === id) return event;
    }
    return null;
  }

  unsyncedEvents(): SimEvent[] {
    return this.events.filter((event) => !event.synced);
  }

  get housingCapacity(): number {
    let capacity = 0;
    for (const building of this.buildings.values()) {
      if (building.type === "House") {
        capacity += building.capacity;
      }
    }
    return capacity;
  }

  recentEvents(limit = 50): SimEvent[] {
    return [...this.events].reverse().slice(0, limit);
  }

  addTrade(input: Omit<Trade, "id" | "timestamp" | "synced">): Trade {
    const trade: Trade = {
      ...input,
      id: `trade_${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    this.trades.push(trade);
    if (this.trades.length > MAX_TRADE_LOG) {
      this.trades.splice(0, this.trades.length - MAX_TRADE_LOG);
    }
    return trade;
  }

  recentTrades(limit = 50): Trade[] {
    return [...this.trades].reverse().slice(0, limit);
  }

  unsyncedTrades(): Trade[] {
    return this.trades.filter((trade) => !trade.synced);
  }

  addPolicy(
    input: Omit<
      Policy,
      "id" | "createdTick" | "createdAt" | "status" | "approvedTick"
    >,
  ): Policy {
    this.policyCounter += 1;
    const policy: Policy = {
      ...input,
      id: `policy_${this.policyCounter}`,
      createdTick: this.tick,
      createdAt: new Date().toISOString(),
      status: "pending",
      approvedTick: null,
    };
    this.policies.push(policy);
    if (this.policies.length > MAX_POLICIES) {
      this.policies.splice(0, this.policies.length - MAX_POLICIES);
    }
    return policy;
  }

  setCurrentPolicy(policy: Policy | null): void {
    this.currentPolicy = policy;
  }

  recentPolicies(limit = 20): Policy[] {
    return [...this.policies].reverse().slice(0, limit);
  }

  firstBuildingOfType(type: BuildingType): Building | null {
    for (const building of this.buildings.values()) {
      if (building.type === type) return building;
    }
    return null;
  }

  buildingsOfType(type: BuildingType): Building[] {
    const result: Building[] = [];
    for (const building of this.buildings.values()) {
      if (building.type === type) result.push(building);
    }
    return result;
  }

  leastStaffedOfType(type: BuildingType): Building | null {
    let best: Building | null = null;
    for (const building of this.buildings.values()) {
      if (building.type !== type) continue;
      if (!best || building.workerIds.length < best.workerIds.length) {
        best = building;
      }
    }
    return best;
  }

  countResidents(buildingId: string): number {
    let count = 0;
    for (const citizen of this.citizens.values()) {
      if (citizen.livesInBuildingId === buildingId) count += 1;
    }
    return count;
  }

  findVacantHouse(): Building | null {
    for (const building of this.buildings.values()) {
      if (
        building.type === "House" &&
        this.countResidents(building.id) < building.capacity
      ) {
        return building;
      }
    }
    return null;
  }

  assignWorker(citizen: Citizen, buildingId: string | null): void {
    const previousId = citizen.worksAtBuildingId;
    if (previousId) {
      const previous = this.buildings.get(previousId);
      if (previous) {
        previous.workerIds = previous.workerIds.filter(
          (id) => id !== citizen.id,
        );
      }
    }
    citizen.worksAtBuildingId = null;
    if (!buildingId) return;
    const building = this.buildings.get(buildingId);
    if (!building) return;
    if (!building.workerIds.includes(citizen.id)) {
      building.workerIds.push(citizen.id);
    }
    citizen.worksAtBuildingId = buildingId;
  }

  assignHouse(citizen: Citizen, buildingId: string | null): void {
    if (!buildingId) {
      citizen.livesInBuildingId = null;
      return;
    }
    const building = this.buildings.get(buildingId);
    citizen.livesInBuildingId =
      building && building.type === "House" ? buildingId : null;
  }
}

export const worldState = new WorldState();
