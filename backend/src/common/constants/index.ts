export const BUILDING_TYPES = ["House", "Farm", "Market"] as const;

export const JOBS = ["Farmer", "Merchant", "Builder", "Unemployed"] as const;

export const HOUSE_CAPACITY = 4;

export const FARM_FOOD_PER_WORKER = 2;

export const CITIZEN_FOOD_PER_TICK = 1;

export const INITIAL_RESOURCES = {
  food: 100,
  gold: 50,
} as const;

export const MAX_EVENT_FEED = 200;

export const FARM_YIELD_VARIATION = 0.1;

export const MARKET_DEMAND_DEFAULT = 50;
export const MARKET_DEMAND_MIN = 0;
export const MARKET_DEMAND_MAX = 100;
export const BASE_FOOD_PRICE = 5;
export const MIN_FOOD_PRICE = 2;
export const MAX_FOOD_PRICE = 15;
export const MARKET_BOOM_DEMAND_GAIN = 15;
export const MARKET_BOOM_MERCHANT_BONUS = 6;

export const CITIZEN_ARRIVAL_CHANCE = 0.15;
export const JOB_SWITCH_CHANCE = 0.1;
export const MINOR_EVENT_CHANCE = 0.12;
export const CITIZEN_SICK_HAPPINESS_PENALTY = 8;

export const MAX_CITIZENS = 80;
export const MAX_TRADE_LOG = 200;
export const MAX_POLICIES = 50;

export const MAYOR_ID = "mayor_1";
export const PLAYER_ID = "player_1";
export const MAYOR_LOW_FOOD_PER_CITIZEN = 1.5;
export const MAYOR_LOW_HAPPINESS = 50;
export const MAYOR_EVAL_INTERVAL_MS = 120000;
export const TRADES_PER_MERCHANT_PER_TICK = 1;
export const TRADE_HUNGER_RESTORE = 20;
export const TRADE_HAPPINESS_GAIN = 1;

export const CITIZEN_NAMES = [
  "John",
  "Mary",
  "Alice",
  "Bob",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Henry",
  "Ivy",
  "Jack",
  "Karen",
  "Leo",
  "Mona",
  "Nathan",
  "Olga",
  "Paul",
  "Quinn",
  "Rosa",
  "Sam",
] as const;
