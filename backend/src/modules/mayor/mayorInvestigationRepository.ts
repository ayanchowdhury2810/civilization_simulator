import { env } from "../../config/env.js";
import { graphQuery } from "../../config/falkordb.js";
import type { MayorGraphEvidence } from "./mayorInvestigationTypes.js";

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value: unknown): string {
  return value == null ? "" : String(value);
}

export async function fetchMayorGraphEvidence(
  policyId: string,
): Promise<MayorGraphEvidence> {
  const graph = env.FALKORDB_GRAPH;
  const [worldResult, eventResult, policyRelationshipResult, eventRelationshipResult] = await Promise.all([
    graphQuery(
      graph,
      `MATCH (w:World {id: $id})
       RETURN w.tick, w.food, w.population
       LIMIT 1`,
      { id: "main" },
    ).then((result) => ({ result, failed: false as const })).catch(() => ({ result: null, failed: true as const })),
    graphQuery(
      graph,
      `MATCH (e:Event)
       RETURN e.id, e.type, e.message, e.tick, e.timestamp, e.citizenId, e.buildingId
       ORDER BY e.tick DESC, e.timestamp DESC
       LIMIT 40`,
    ).then((result) => ({ result, failed: false as const })).catch(() => ({ result: null, failed: true as const })),
    graphQuery(
      graph,
      `MATCH (p:Policy {id: $policyId})-[r]-(n)
       RETURN p.id, type(r), n.id, labels(n)
       LIMIT 40`,
      { policyId },
    ).then((result) => ({ result, failed: false as const })).catch(() => ({ result: null, failed: true as const })),
    graphQuery(
      graph,
      `MATCH (a)-[r:CAUSED|INVOLVED_IN]-(b)
       WHERE (a:Event OR b:Event)
       RETURN a.id, labels(a), type(r), b.id, labels(b)
       LIMIT 60`,
    ).then((result) => ({ result, failed: false as const })).catch(() => ({ result: null, failed: true as const })),
  ]);

  const worldRow = worldResult.result?.rows[0];
  const events = (eventResult.result?.rows ?? []).map((row) => ({
    id: textValue(row[0]),
    type: textValue(row[1]),
    message: textValue(row[2]),
    tick: numberValue(row[3]),
    timestamp: textValue(row[4]),
    citizenId: row[5] == null ? null : String(row[5]),
    buildingId: row[6] == null ? null : String(row[6]),
  }));
  const relationships = [
    ...(policyRelationshipResult.result?.rows ?? []).map((row) => ({
      fromId: textValue(row[0]),
      fromType: "Policy",
      relationshipType: textValue(row[1]),
      toId: textValue(row[2]),
      toType: Array.isArray(row[3]) ? textValue(row[3][0]) || "Unknown" : "Unknown",
    })),
    ...(eventRelationshipResult.result?.rows ?? []).map((row) => ({
      fromId: textValue(row[0]),
      fromType: Array.isArray(row[1]) ? textValue(row[1][0]) || "Unknown" : "Unknown",
      relationshipType: textValue(row[2]),
      toId: textValue(row[3]),
      toType: Array.isArray(row[4]) ? textValue(row[4][0]) || "Unknown" : "Unknown",
    })),
  ];

  return {
    graphAvailable: [worldResult, eventResult, policyRelationshipResult, eventRelationshipResult].some((item) => !item.failed),
    partial: [worldResult, eventResult, policyRelationshipResult, eventRelationshipResult].some((item) => item.failed),
    world: worldRow
      ? {
          tick: numberValue(worldRow[0]),
          food: numberValue(worldRow[1]),
          population: numberValue(worldRow[2]),
        }
      : null,
    events,
    relationships,
  };
}
