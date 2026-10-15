export type Job = "Farmer" | "Merchant" | "Builder" | "Unemployed";

export type BuildingType = "House" | "Farm" | "Market";

export type CitizenAction = "BUY_FOOD" | "WORK" | "WANDER";

export type PolicyAction = "BuildFarm" | "BuildHouse" | "DoNothing";

export type PolicyStatus = "pending" | "approved" | "ignored";

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

export interface MayorView {
  playerId: string;
  mayorId: string;
  currentPolicy: Policy | null;
  recentPolicies: Policy[];
  loopRunning: boolean;
}

export interface ApprovalResult {
  policy: Policy;
  building: Building | null;
  graphSynced: boolean;
}

export interface BuildResult {
  building: Building;
  graphSynced: boolean;
}

export interface CitizenDetail extends Citizen {
  worksAt: { id: string; type: string } | null;
  livesIn: { id: string; type: string } | null;
}

export interface ChatContext {
  origin: "graph" | "memory";
  tick: number;
  food: number;
  gold: number;
  population: number;
  foodPrice: number;
  demand: number;
  stats: { population: number; avgHappiness: number; avgFoodLevel: number };
  events: { id: string; type: string; message: string; tick: number }[];
  causeChains: {
    causeType: string;
    causeMessage: string;
    effectType: string;
    effectMessage: string;
    tick: number;
  }[];
  trades: {
    buyer: string;
    seller: string;
    item: string;
    count: number;
    lastPrice: number;
    tick: number;
  }[];
}

export interface ChatAnswer {
  question: string;
  answer: string;
  source: "llm" | "graph";
  context: ChatContext;
}

export type SelectedEntity =
  | { kind: "citizen"; id: string }
  | { kind: "building"; id: string }
  | null;
