export type Job = "Farmer" | "Merchant" | "Builder" | "Unemployed";

export type BuildingType = "House" | "Farm" | "Market";

export type CitizenAction = "BUY_FOOD" | "WORK" | "WANDER";

export interface Citizen {
  id: string;
  name: string;
  job: Job;
  foodLevel: number;
  money: number;
  happiness: number;
  currentAction: CitizenAction | null;
  worksAtBuildingId: string | null;
  livesInBuildingId: string | null;
  x: number;
  y: number;
}

export interface Building {
  id: string;
  type: BuildingType;
  capacity: number;
  workerIds: string[];
  foodPerWorkerTick: number;
  x: number;
  y: number;
}

export interface WorldResources {
  food: number;
  gold: number;
  population: number;
}

export interface MarketState {
  foodPrice: number;
  demand: number;
}

export interface SimEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  tick: number;
  citizenId?: string;
  buildingId?: string;
  causedByEventId?: string;
  synced?: boolean;
}

export interface Trade {
  id: string;
  buyerId: string;
  sellerId: string;
  item: string;
  price: number;
  tick: number;
  timestamp: string;
  synced: boolean;
}

export type PolicyAction = "BuildFarm" | "BuildHouse" | "DoNothing";

export type PolicyStatus = "pending" | "approved" | "ignored";

export interface Policy {
  id: string;
  name: string;
  action: PolicyAction;
  buildingType: BuildingType | null;
  reason: string;
  createdTick: number;
  createdAt: string;
  triggeredByEventId: string | null;
  status: PolicyStatus;
  approvedTick: number | null;
}

export interface MayorEvaluation {
  action: PolicyAction;
  buildingType: BuildingType | null;
  reason: string;
  triggeredByEventId: string | null;
}

export interface WorldSnapshot {
  tick: number;
  lastTickAt: string | null;
  resources: WorldResources;
  market: MarketState;
  housingCapacity: number;
  citizens: Citizen[];
  buildings: Building[];
  recentEvents: SimEvent[];
  recentTrades: Trade[];
}

export interface PersistedWorld {
  tick: number;
  lastTickAt: string | null;
  resources: WorldResources;
  market: MarketState;
  citizens: Citizen[];
  buildings: Building[];
  events: SimEvent[];
  trades: Trade[];
  policies: Policy[];
}
