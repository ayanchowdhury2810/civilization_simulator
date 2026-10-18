export type InvestigationFindingKey =
  | "food_shortage"
  | "housing_shortage"
  | "low_happiness"
  | "no_urgent_issue"
  | "insufficient_evidence";

export interface MayorInvestigation {
  recommendationId: string;
  generatedAt: string;
  status: "complete" | "partial" | "unavailable";
  finding: {
    key: InvestigationFindingKey;
    title: string;
    summary: string;
  };
  recommendation: {
    action: "build_farm" | "build_house" | "no_action";
    title: string;
    rationale: string;
  };
  evidence: Array<{
    id: string;
    kind: "metric" | "event" | "relationship" | "entity";
    label: string;
    detail: string;
    timestamp?: string;
    sourceNodeIds?: string[];
    relationshipType?: string;
    provenance: "falkordb_record" | "world_state" | "rule_inference";
    interpretation: "supports" | "contradicts" | "context";
  }>;
  connectedEntities: Array<{
    id: string;
    type: "Citizen" | "Building" | "Event" | "Policy" | "World" | "Mayor" | "Player" | "Unknown";
    label: string;
  }>;
  reasoning: string[];
  limitations: string[];
  evidenceQuality: {
    level: "strong" | "moderate" | "limited" | "none";
    explanation: string;
  };
}

export interface MayorGraphEvidence {
  graphAvailable: boolean;
  partial: boolean;
  world: {
    tick: number;
    food: number;
    population: number;
  } | null;
  events: Array<{
    id: string;
    type: string;
    message: string;
    tick: number;
    timestamp: string;
    citizenId: string | null;
    buildingId: string | null;
  }>;
  relationships: Array<{
    fromId: string;
    fromType: string;
    relationshipType: string;
    toId: string;
    toType: string;
  }>;
}
