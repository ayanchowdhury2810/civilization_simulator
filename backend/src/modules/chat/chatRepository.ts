import { env } from "../../config/env.js";
import { graphQuery } from "../../config/falkordb.js";

export interface GraphWorldRow {
  tick: number;
  food: number;
  gold: number;
  population: number;
  foodPrice: number;
  demand: number;
  lastTickAt: string;
}

export interface GraphEventRow {
  id: string;
  type: string;
  message: string;
  tick: number;
  timestamp: string;
  citizenId: string | null;
  buildingId: string | null;
}

export interface GraphCauseRow {
  causeType: string;
  causeMessage: string;
  effectType: string;
  effectMessage: string;
  effectTick: number;
}

export interface GraphTradeRow {
  buyerName: string;
  sellerName: string;
  item: string;
  count: number;
  lastPrice: number;
  lastTick: number;
}

export interface GraphCitizenStats {
  population: number;
  avgHappiness: number;
  avgFoodLevel: number;
}

export interface GraphCitizenPlace {
  id: string;
  name: string;
  job: string;
  homeId: string | null;
  homeType: string | null;
  workId: string | null;
  workType: string | null;
}

export async function fetchWorldNode(): Promise<GraphWorldRow | null> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (w:World {id: $id})
     RETURN w.tick, w.food, w.gold, w.population, w.foodPrice, w.demand, w.lastTickAt`,
    { id: "main" },
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    tick: toNumber(row[0]),
    food: toNumber(row[1]),
    gold: toNumber(row[2]),
    population: toNumber(row[3]),
    foodPrice: toNumber(row[4]),
    demand: toNumber(row[5]),
    lastTickAt: toText(row[6]),
  };
}

export async function fetchRecentEvents(
  limit: number,
): Promise<GraphEventRow[]> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (e:Event)
     RETURN e.id, e.type, e.message, e.tick, e.timestamp, e.citizenId, e.buildingId
     ORDER BY e.tick DESC, e.timestamp DESC
     LIMIT $limit`,
    { limit },
  );
  return rows.map((row) => ({
    id: toText(row[0]),
    type: toText(row[1]),
    message: toText(row[2]),
    tick: toNumber(row[3]),
    timestamp: toText(row[4]),
    citizenId: row[5] == null ? null : String(row[5]),
    buildingId: row[6] == null ? null : String(row[6]),
  }));
}

export async function fetchCauseChains(
  limit: number,
): Promise<GraphCauseRow[]> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (cause:Event)-[:CAUSED]->(effect:Event)
     RETURN cause.type, cause.message, effect.type, effect.message, effect.tick
     ORDER BY effect.tick DESC
     LIMIT $limit`,
    { limit },
  );
  return rows.map((row) => ({
    causeType: toText(row[0]),
    causeMessage: toText(row[1]),
    effectType: toText(row[2]),
    effectMessage: toText(row[3]),
    effectTick: toNumber(row[4]),
  }));
}

export async function fetchRecentTrades(
  limit: number,
): Promise<GraphTradeRow[]> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (buyer:Citizen)-[t:TRADED_WITH]->(seller:Citizen)
     RETURN buyer.name, seller.name, t.item, t.count, t.lastPrice, t.lastTick
     ORDER BY t.lastTick DESC
     LIMIT $limit`,
    { limit },
  );
  return rows.map((row) => ({
    buyerName: toText(row[0]),
    sellerName: toText(row[1]),
    item: toText(row[2]),
    count: toNumber(row[3]),
    lastPrice: toNumber(row[4]),
    lastTick: toNumber(row[5]),
  }));
}

export async function fetchCitizenStats(): Promise<GraphCitizenStats | null> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (c:Citizen)
     RETURN count(c), avg(c.happiness), avg(coalesce(c.foodLevel, c.hunger))`,
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    population: toNumber(row[0]),
    avgHappiness: toNumber(row[1]),
    avgFoodLevel: toNumber(row[2]),
  };
}

export async function fetchCitizenPlaces(
  limit: number,
): Promise<GraphCitizenPlace[]> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (c:Citizen)
     OPTIONAL MATCH (c)-[:LIVES_IN]->(home:Building)
     OPTIONAL MATCH (c)-[:WORKS_AT]->(work:Building)
     RETURN c.id, c.name, c.job, home.id, home.type, work.id, work.type
     LIMIT $limit`,
    { limit },
  );
  return rows.map((row) => ({
    id: toText(row[0]),
    name: toText(row[1]),
    job: toText(row[2]),
    homeId: row[3] == null ? null : String(row[3]),
    homeType: row[4] == null ? null : String(row[4]),
    workId: row[5] == null ? null : String(row[5]),
    workType: row[6] == null ? null : String(row[6]),
  }));
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}
