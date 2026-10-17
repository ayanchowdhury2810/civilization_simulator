import type { BuildingType, CitizenAction, Job, PolicyAction } from "./types";

export const JOB_EMOJI: Record<Job, string> = {
  Farmer: "🌾",
  Merchant: "🛒",
  Unemployed: "🚶",
};

export const JOB_LABEL: Record<Job, string> = {
  Farmer: "Farmer",
  Merchant: "Shopkeeper",
  Unemployed: "No job",
};

export const JOB_HELP: Record<Job, string> = {
  Farmer: "Grows food on the farm",
  Merchant: "Sells food at the shop",
  Unemployed: "Looking for something to do",
};

export const BUILDING_EMOJI: Record<BuildingType, string> = {
  Farm: "🌾",
  House: "🏠",
  Market: "🏪",
};

export const BUILDING_LABEL: Record<BuildingType, string> = {
  Farm: "Farm",
  House: "House",
  Market: "Shop",
};

export const BUILDING_HELP: Record<BuildingType, string> = {
  Farm: "Makes food when farmers work here",
  House: "A home where people can live",
  Market: "Where shopkeepers sell food",
};

export const ACTION_EMOJI: Record<CitizenAction, string> = {
  BUY_FOOD: "🍎",
  WORK: "💪",
  WANDER: "🚶",
};

export const ACTION_LABEL: Record<CitizenAction, string> = {
  BUY_FOOD: "Buying food",
  WORK: "Working hard",
  WANDER: "Walking around",
};

const EVENT_EMOJI: Record<string, string> = {
  WorldCreated: "🌍",
  CitizenArrived: "👋",
  JobChanged: "🔁",
  WorkerLeftJob: "🚪",
  CitizenSick: "🤒",
  MarketBoom: "📈",
  Trade: "🤝",
  FoodBought: "🍎",
  FoodShortage: "⚠️",
  FarmYieldLow: "🌾",
  BuildingBuilt: "🏗️",
  PolicyProposed: "💡",
  PolicyApproved: "✅",
};

export function eventEmoji(type: string): string {
  return EVENT_EMOJI[type] ?? "📌";
}

function replaceBuildingIds(message: string): string {
  return message
    .replace(/\b(farm)_\d+/gi, "a farm")
    .replace(/\b(house)_\d+/gi, "a house")
    .replace(/\b(market)_\d+/gi, "the shop")
    .replace(/\b(building)_\d+/gi, "a building")
    .replace(/\b(policy)_\d+/gi, "the idea")
    .replace(/\b(event)_[0-9a-f]+/gi, "something");
}

export function plainMessage(message: string): string {
  return replaceBuildingIds(message)
    .replace(/\s*\(\s*(a farm|a house|the shop|a building)\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function policyPlainReason(action: PolicyAction): string {
  switch (action) {
    case "BuildFarm":
      return "People are hungry. A new farm grows more food.";
    case "BuildHouse":
      return "Homes are full. We need more houses so new people can move in.";
    case "DoNothing":
      return "Everything looks fine. No need to do anything right now.";
    default:
      return "";
  }
}

export function policyButtonLabel(action: PolicyAction): string {
  switch (action) {
    case "BuildFarm":
      return "Yes! Build a farm 🌾";
    case "BuildHouse":
      return "Yes! Build a house 🏠";
    case "DoNothing":
      return "Okay 👍";
    default:
      return "Do it";
  }
}

export function policyBenefit(action: PolicyAction): string {
  switch (action) {
    case "BuildFarm":
      return "A farm needs a farmer to make food.";
    case "BuildHouse":
      return "Each house can hold 4 people.";
    default:
      return "";
  }
}
