import {
  MAYOR_LOW_FOOD_PER_CITIZEN,
  MAYOR_LOW_HAPPINESS,
} from "../../common/constants/index.js";
import { loadWorldStateFromGraph } from "../world/worldService.js";
import type { WorldState } from "../../simulation/worldState.js";
import type { Policy } from "../../simulation/types.js";
import type {
  InvestigationFindingKey,
  MayorGraphEvidence,
  MayorInvestigation,
} from "./mayorInvestigationTypes.js";
import { fetchMayorGraphEvidence } from "./mayorInvestigationRepository.js";

const EVENT_TYPES_BY_FINDING: Record<InvestigationFindingKey, string[]> = {
  food_shortage: ["FoodShortage", "FarmYieldLow", "FoodBought", "Trade", "MarketBoom", "WorkerLeftJob"],
  housing_shortage: ["CitizenArrived", "BuildingBuilt"],
  low_happiness: ["CitizenSick", "FoodShortage", "WorkerLeftJob"],
  no_urgent_issue: [],
  insufficient_evidence: [],
};

function averageHappiness(state: WorldState): number {
  const citizens = [...state.citizens.values()];
  if (citizens.length === 0) return 0;
  return citizens.reduce((total, citizen) => total + citizen.happiness, 0) / citizens.length;
}

function determineFinding(state: WorldState): { key: InvestigationFindingKey; title: string; summary: string } {
  const population = state.citizens.size;
  const foodPerCitizen = population > 0 ? state.resources.food / population : 0;
  if (population > 0 && foodPerCitizen < MAYOR_LOW_FOOD_PER_CITIZEN) {
    return {
      key: "food_shortage",
      title: "Food availability is low",
      summary: `Current food per citizen is ${foodPerCitizen.toFixed(1)}, below the Mayor's configured threshold of ${MAYOR_LOW_FOOD_PER_CITIZEN.toFixed(1)}.`,
    };
  }
  if (population >= state.housingCapacity) {
    return {
      key: "housing_shortage",
      title: "Housing capacity is reached",
      summary: `The population is ${population} and current housing capacity is ${state.housingCapacity}.`,
    };
  }
  const happiness = averageHappiness(state);
  if (happiness < MAYOR_LOW_HAPPINESS) {
    return {
      key: "low_happiness",
      title: "Average happiness is low",
      summary: `Average happiness is ${Math.round(happiness)}, below the Mayor's configured threshold of ${MAYOR_LOW_HAPPINESS}.`,
    };
  }
  return {
    key: "no_urgent_issue",
    title: "No urgent issue detected",
    summary: "The current food, housing, and happiness rules did not identify an urgent issue.",
  };
}

function actionForPolicy(policy: Policy): MayorInvestigation["recommendation"]["action"] {
  if (policy.action === "BuildFarm") return "build_farm";
  if (policy.action === "BuildHouse") return "build_house";
  return "no_action";
}

function titleForAction(action: MayorInvestigation["recommendation"]["action"]): string {
  if (action === "build_farm") return "Build a farm";
  if (action === "build_house") return "Build a house";
  return "Take no action";
}

function connectedType(type: string): MayorInvestigation["connectedEntities"][number]["type"] {
  const known = ["Citizen", "Building", "Event", "Policy", "World", "Mayor", "Player"] as const;
  return known.find((candidate) => candidate === type) ?? "Unknown";
}

function assembleInvestigation(policy: Policy, graph: MayorGraphEvidence, state: WorldState): MayorInvestigation {
  const finding = determineFinding(state);
  const recommendationAction = actionForPolicy(policy);
  const evidence: MayorInvestigation["evidence"] = [
    {
      id: `world-food-${state.tick}`,
      kind: "metric",
      label: "Food per citizen",
      detail: `${state.resources.food} food across ${state.citizens.size} citizens (${state.citizens.size ? (state.resources.food / state.citizens.size).toFixed(1) : "0.0"} per citizen).`,
      provenance: "world_state",
      interpretation: finding.key === "food_shortage" ? "supports" : "context",
    },
    {
      id: `world-housing-${state.tick}`,
      kind: "metric",
      label: "Housing capacity",
      detail: `${state.citizens.size} citizens and ${state.housingCapacity} housing spaces.`,
      provenance: "world_state",
      interpretation: finding.key === "housing_shortage" ? "supports" : "context",
    },
    {
      id: `world-happiness-${state.tick}`,
      kind: "metric",
      label: "Average happiness",
      detail: `${Math.round(averageHappiness(state))} average happiness across ${state.citizens.size} citizens.`,
      provenance: "world_state",
      interpretation: finding.key === "low_happiness" ? "supports" : "context",
    },
  ];
  if (graph.world) {
    evidence.push({
      id: `graph-world-${graph.world.tick}`,
      kind: "metric",
      label: "Persisted world snapshot",
      detail: `FalkorDB World record at tick ${graph.world.tick}: food ${graph.world.food}, population ${graph.world.population}.`,
      sourceNodeIds: ["main"],
      provenance: "falkordb_record",
      interpretation: "context",
    });
  }

  const relevantTypes = EVENT_TYPES_BY_FINDING[finding.key];
  const relevantEvents = graph.events
    .filter((event) => relevantTypes.includes(event.type))
    .slice(0, 8);
  const relevantEventIds = new Set(relevantEvents.map((event) => event.id));
  const relevantRelationships = graph.relationships.filter((relationship) =>
    relationship.fromType === "Policy"
      ? relationship.fromId === policy.id
      : relevantEventIds.has(relationship.fromId) || relevantEventIds.has(relationship.toId),
  );
  for (const event of relevantEvents) {
    evidence.push({
      id: event.id,
      kind: "event",
      label: event.type,
      detail: event.message,
      timestamp: event.timestamp || undefined,
      sourceNodeIds: [event.id],
      provenance: "falkordb_record",
      interpretation: finding.key === "no_urgent_issue" ? "context" : "supports",
    });
  }

  for (const relationship of relevantRelationships) {
    evidence.push({
      id: `${relationship.fromId}-${relationship.relationshipType}-${relationship.toId}`,
      kind: "relationship",
      label: relationship.relationshipType,
      detail: `${relationship.fromId} — ${relationship.relationshipType} → ${relationship.toId}`,
      sourceNodeIds: [relationship.fromId, relationship.toId],
      relationshipType: relationship.relationshipType,
      provenance: "falkordb_record",
      interpretation: "context",
    });
  }

  const connectedEntities = new Map<string, MayorInvestigation["connectedEntities"][number]>();
  if (graph.world) connectedEntities.set("main", { id: "main", type: "World", label: "World" });
  for (const event of relevantEvents) {
    connectedEntities.set(event.id, { id: event.id, type: "Event", label: event.type });
    if (event.citizenId) connectedEntities.set(event.citizenId, { id: event.citizenId, type: "Citizen", label: event.citizenId });
    if (event.buildingId) connectedEntities.set(event.buildingId, { id: event.buildingId, type: "Building", label: event.buildingId });
  }
  for (const relationship of relevantRelationships) {
    connectedEntities.set(relationship.fromId, { id: relationship.fromId, type: "Policy", label: "Policy" });
    connectedEntities.set(relationship.toId, { id: relationship.toId, type: connectedType(relationship.toType), label: relationship.toId });
  }
  if (!graph.graphAvailable || (!graph.world && relevantEvents.length === 0 && relevantRelationships.length === 0)) {
    connectedEntities.clear();
  }

  const limitations: string[] = [];
  if (!graph.graphAvailable) limitations.push("The town records could not be retrieved.");
  else if (graph.partial) limitations.push("Some FalkorDB evidence queries failed; the investigation may be incomplete.");
  if (graph.graphAvailable && !graph.world) limitations.push("No saved town summary was found.");
  if (relevantEvents.length === 0) limitations.push("No relevant persisted event records were found for this finding.");
  if (!relevantRelationships.some((relationship) => relationship.relationshipType === "CAUSED")) {
    limitations.push("No explicit CAUSED relationship was returned. Event timing or association does not prove causation.");
  }

  const mismatch =
    (finding.key === "food_shortage" && recommendationAction !== "build_farm") ||
    (finding.key === "housing_shortage" && recommendationAction !== "build_house") ||
    (finding.key === "no_urgent_issue" && recommendationAction !== "no_action");
  evidence.push({
    id: `recommendation-alignment-${policy.id}`,
    kind: "entity",
    label: mismatch ? "Recommendation differs from current finding" : "Rule-based recommendation",
    detail: mismatch
      ? `The current finding is ${finding.title.toLowerCase()}, while the active rule recommends ${titleForAction(recommendationAction).toLowerCase()}.`
      : `The existing rule-based Mayor recommends ${titleForAction(recommendationAction).toLowerCase()} for this finding.`,
    sourceNodeIds: [policy.id],
    provenance: "rule_inference",
    interpretation: mismatch ? "contradicts" : "context",
  });
  const reasoning = [
    `The current town metrics identify: ${finding.title.toLowerCase()}.`,
    `The active rule-based recommendation is “${policy.name}”: ${policy.reason}`,
    relevantEvents.length > 0
      ? `${relevantEvents.length} relevant persisted event record(s) were found.`
      : "No relevant persisted event records were available to add context.",
  ];
  if (mismatch) reasoning.push("The finding and active recommendation do not align; the recommendation remains the existing rule-based decision.");

  const quality: MayorInvestigation["evidenceQuality"] =
    !graph.graphAvailable
      ? { level: "limited", explanation: "Town records could not be checked." }
      : relevantEvents.length >= 2 && relevantRelationships.length > 0
        ? { level: "moderate", explanation: "Current measurements are accompanied by multiple persisted event records and at least one recorded graph relationship." }
        : relevantEvents.length > 0 || graph.world
          ? { level: "limited", explanation: "Some persisted graph evidence is available, but the finding has few linked supporting records." }
          : { level: "limited", explanation: "The saved town records contain little supporting information." };

  return {
    recommendationId: policy.id,
    generatedAt: new Date().toISOString(),
    status:
      !graph.graphAvailable || (!graph.world && relevantEvents.length === 0 && relevantRelationships.length === 0)
        ? "unavailable"
        : graph.partial || !graph.world
          ? "partial"
          : "complete",
    finding,
    recommendation: {
      action: recommendationAction,
      title: titleForAction(recommendationAction),
      rationale: policy.reason,
    },
    evidence,
    connectedEntities: [...connectedEntities.values()],
    reasoning,
    limitations,
    evidenceQuality: quality,
  };
}

export async function investigateMayorPolicy(policy: Policy): Promise<MayorInvestigation> {
  const [graph, state] = await Promise.all([
    fetchMayorGraphEvidence(policy.id),
    loadWorldStateFromGraph(),
  ]);
  return assembleInvestigation(policy, graph, state);
}
