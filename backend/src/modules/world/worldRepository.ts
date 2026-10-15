import {
  BASE_FOOD_PRICE,
  FARM_FOOD_PER_WORKER,
  MARKET_DEMAND_DEFAULT,
  MAX_EVENT_FEED,
  MAX_POLICIES,
  MAX_TRADE_LOG,
  MAYOR_ID,
  PLAYER_ID,
} from "../../common/constants/index.js";
import { extractNodeProperties, graphQuery } from "../../config/falkordb.js";
import { env } from "../../config/env.js";
import type {
  Building,
  BuildingType,
  Citizen,
  CitizenAction,
  Job,
  PersistedWorld,
  Policy,
  PolicyAction,
  PolicyStatus,
  SimEvent,
  Trade,
} from "../../simulation/types.js";
import type { WorldState } from "../../simulation/worldState.js";

const POLICY_BUILDING_BY_ACTION: Record<PolicyAction, BuildingType | null> = {
  BuildFarm: "Farm",
  BuildHouse: "House",
  DoNothing: null,
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}

function toNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}


export async function syncWorldState(state: WorldState): Promise<void> {
  const graph = env.FALKORDB_GRAPH;

  await graphQuery(
    graph,
    `MERGE (m:Mayor {id: $mayorId}) SET m.role = "AI Mayor"`,
    { mayorId: MAYOR_ID },
  );

  await graphQuery(
    graph,
    `MERGE (p:Player {id: $playerId}) SET p.role = "King"`,
    { playerId: PLAYER_ID },
  );

  await graphQuery(
    graph,
    `MERGE (w:World {id: $id})
     SET w.tick = $tick,
         w.food = $food,
         w.gold = $gold,
         w.population = $population,
         w.foodPrice = $foodPrice,
         w.demand = $demand,
         w.lastTickAt = $lastTickAt`,
    {
      id: "main",
      tick: state.tick,
      food: state.resources.food,
      gold: state.resources.gold,
      population: state.resources.population,
      foodPrice: state.market.foodPrice,
      demand: state.market.demand,
      lastTickAt: state.lastTickAt ?? "",
    },
  );

  for (const citizen of state.citizens.values()) {
    await graphQuery(
      graph,
      `MERGE (c:Citizen {id: $id})
       SET c.name = $name,
           c.job = $job,
           c.foodLevel = $foodLevel,
           c.money = $money,
           c.happiness = $happiness,
           c.currentAction = $currentAction,
           c.x = $x,
           c.y = $y`,
      {
        id: citizen.id,
        name: citizen.name,
        job: citizen.job,
        foodLevel: Math.round(citizen.foodLevel),
        money: Math.round(citizen.money),
        happiness: Math.round(citizen.happiness),
        currentAction: citizen.currentAction ?? "WANDER",
        x: citizen.x,
        y: citizen.y,
      },
    );
  }

  for (const building of state.buildings.values()) {
    await graphQuery(
      graph,
      `MERGE (b:Building {id: $id})
       SET b.type = $type,
           b.capacity = $capacity,
           b.workerCount = $workerCount,
           b.x = $x,
           b.y = $y`,
      {
        id: building.id,
        type: building.type,
        capacity: building.capacity,
        workerCount: building.workerIds.length,
        x: building.x,
        y: building.y,
      },
    );
  }

  for (const citizen of state.citizens.values()) {
    if (citizen.livesInBuildingId) {
      await graphQuery(
        graph,
        `MATCH (c:Citizen {id: $citizenId}), (b:Building {id: $buildingId})
         MERGE (c)-[:LIVES_IN]->(b)`,
        { citizenId: citizen.id, buildingId: citizen.livesInBuildingId },
      );
    }
    if (citizen.worksAtBuildingId) {
      await graphQuery(
        graph,
        `MATCH (c:Citizen {id: $citizenId}), (b:Building {id: $buildingId})
         MERGE (c)-[:WORKS_AT]->(b)`,
        { citizenId: citizen.id, buildingId: citizen.worksAtBuildingId },
      );
    }
  }

  for (const trade of state.unsyncedTrades()) {
    await graphQuery(
      graph,
      `MATCH (buyer:Citizen {id: $buyerId}), (seller:Citizen {id: $sellerId})
       MERGE (buyer)-[t:TRADED_WITH]->(seller)
       SET t.item = $item,
           t.count = coalesce(t.count, 0) + 1,
           t.lastPrice = $price,
           t.lastTick = $tick`,
      {
        buyerId: trade.buyerId,
        sellerId: trade.sellerId,
        item: trade.item,
        price: trade.price,
        tick: trade.tick,
      },
    );
    trade.synced = true;
  }
}

export async function fetchPersistedWorld(): Promise<PersistedWorld | null> {
  const graph = env.FALKORDB_GRAPH;

  const worldResult = await graphQuery(
    graph,
    `MATCH (w:World {id: "main"})
     RETURN w.tick, w.food, w.gold, w.population, w.foodPrice, w.demand, w.lastTickAt
     LIMIT 1`,
  );
  if (worldResult.rows.length === 0) return null;
  const worldRow = worldResult.rows[0];

  const [
    citizenRows,
    buildingRows,
    eventRows,
    policyRows,
    causeRows,
    triggerRows,
    tradeRows,
  ] = await Promise.all([
    graphQuery(
      graph,
      `MATCH (c:Citizen)
       OPTIONAL MATCH (c)-[:LIVES_IN]->(home:Building)
       OPTIONAL MATCH (c)-[:WORKS_AT]->(work:Building)
       RETURN c.id, c.name, c.job, coalesce(c.foodLevel, c.hunger), c.money, c.happiness,
              c.currentAction, c.x, c.y, home.id, work.id`,
    ),
    graphQuery(
      graph,
      `MATCH (b:Building) RETURN b.id, b.type, b.capacity, b.x, b.y`,
    ),
    graphQuery(
      graph,
      `MATCH (e:Event)
       RETURN e.id, e.type, e.message, e.timestamp, e.tick, e.citizenId, e.buildingId
       ORDER BY e.tick DESC, e.timestamp DESC
       LIMIT $limit`,
      { limit: MAX_EVENT_FEED },
    ),
    graphQuery(
      graph,
      `MATCH (p:Policy)
       RETURN p.id, p.name, p.action, p.reason, p.createdTick, p.createdAt,
              p.status, p.approvedTick
       ORDER BY p.createdTick DESC, p.createdAt DESC
       LIMIT $limit`,
      { limit: MAX_POLICIES },
    ),
    graphQuery(
      graph,
      `MATCH (cause:Event)-[:CAUSED]->(effect:Event)
       RETURN effect.id, cause.id`,
    ),
    graphQuery(
      graph,
      `MATCH (p:Policy)-[:TRIGGERED_BY]->(e:Event)
       RETURN p.id, e.id`,
    ),
    graphQuery(
      graph,
      `MATCH (buyer:Citizen)-[t:TRADED_WITH]->(seller:Citizen)
       RETURN buyer.id, seller.id, t.item, t.lastPrice, t.lastTick
       ORDER BY t.lastTick DESC
       LIMIT $limit`,
      { limit: MAX_TRADE_LOG },
    ),
  ]);

  const buildings: Building[] = buildingRows.rows.map((row) => {
    const type = toString(row[1], "House") as BuildingType;
    return {
      id: toString(row[0]),
      type,
      capacity: toNumber(row[2]),
      workerIds: [],
      foodPerWorkerTick: type === "Farm" ? FARM_FOOD_PER_WORKER : 0,
      x: toNumber(row[3]),
      y: toNumber(row[4]),
    };
  });
  const buildingById = new Map(buildings.map((building) => [building.id, building]));

  const citizens: Citizen[] = citizenRows.rows.map((row) => {
    const worksAtBuildingId = toNullableString(row[10]);
    const citizen: Citizen = {
      id: toString(row[0]),
      name: toString(row[1], "Citizen"),
      job: toString(row[2], "Unemployed") as Job,
      foodLevel: toNumber(row[3]),
      money: toNumber(row[4]),
      happiness: toNumber(row[5]),
      currentAction:
        (toNullableString(row[6]) as CitizenAction | null) ?? "WANDER",
      worksAtBuildingId,
      livesInBuildingId: toNullableString(row[9]),
      x: toNumber(row[7]),
      y: toNumber(row[8]),
    };
    if (worksAtBuildingId) {
      buildingById.get(worksAtBuildingId)?.workerIds.push(citizen.id);
    }
    return citizen;
  });

  const causeByEffect = new Map<string, string>();
  for (const row of causeRows.rows) {
    causeByEffect.set(toString(row[0]), toString(row[1]));
  }
  const events: SimEvent[] = eventRows.rows
    .map((row) => {
      const id = toString(row[0]);
      return {
        id,
        type: toString(row[1]),
        message: toString(row[2]),
        timestamp: toString(row[3]),
        tick: toNumber(row[4]),
        citizenId: toNullableString(row[5]) ?? undefined,
        buildingId: toNullableString(row[6]) ?? undefined,
        causedByEventId: causeByEffect.get(id),
        synced: true,
      };
    })
    .reverse();

  const triggerByPolicy = new Map<string, string>();
  for (const row of triggerRows.rows) {
    triggerByPolicy.set(toString(row[0]), toString(row[1]));
  }
  const policies: Policy[] = policyRows.rows
    .map((row) => {
      const id = toString(row[0]);
      const action = toString(row[2], "DoNothing") as PolicyAction;
      return {
        id,
        name: toString(row[1], "Do Nothing"),
        action,
        buildingType: POLICY_BUILDING_BY_ACTION[action] ?? null,
        reason: toString(row[3]),
        createdTick: toNumber(row[4]),
        createdAt: toString(row[5]),
        triggeredByEventId: triggerByPolicy.get(id) ?? null,
        status: toString(row[6], "pending") as PolicyStatus,
        approvedTick:
          row[7] === null || row[7] === undefined ? null : toNumber(row[7]),
      };
    })
    .reverse();

  const trades: Trade[] = tradeRows.rows
    .map((row, index) => ({
      id: `trade_${toString(row[0])}_${toString(row[1])}_${index}`,
      buyerId: toString(row[0]),
      sellerId: toString(row[1]),
      item: toString(row[2], "food"),
      price: toNumber(row[3]),
      tick: toNumber(row[4]),
      timestamp: "",
      synced: true,
    }))
    .reverse();

  return {
    tick: toNumber(worldRow[0]),
    lastTickAt: toNullableString(worldRow[6]),
    resources: {
      food: toNumber(worldRow[1]),
      gold: toNumber(worldRow[2]),
      population: toNumber(worldRow[3]),
    },
    market: {
      foodPrice: toNumber(worldRow[4], BASE_FOOD_PRICE),
      demand: toNumber(worldRow[5], MARKET_DEMAND_DEFAULT),
    },
    citizens,
    buildings,
    events,
    trades,
    policies,
  };
}

export async function fetchCitizenGraphProps(
  id: string,
): Promise<Record<string, unknown> | null> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (c:Citizen {id: $id}) RETURN c LIMIT 1`,
    { id },
  );
  if (rows.length === 0) return null;
  return extractNodeProperties(rows[0][0]);
}

export async function fetchBuildingGraphProps(
  id: string,
): Promise<Record<string, unknown> | null> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (b:Building {id: $id}) RETURN b LIMIT 1`,
    { id },
  );
  if (rows.length === 0) return null;
  return extractNodeProperties(rows[0][0]);
}
