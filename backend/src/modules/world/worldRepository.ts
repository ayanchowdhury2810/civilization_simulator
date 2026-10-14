import {
  MAYOR_ID,
  PLAYER_ID,
} from "../../common/constants/index.js";
import { extractNodeProperties, graphQuery } from "../../config/falkordb.js";
import { env } from "../../config/env.js";
import type { WorldState } from "../../simulation/worldState.js";

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
           c.hunger = $hunger,
           c.money = $money,
           c.happiness = $happiness,
           c.currentAction = $currentAction,
           c.x = $x,
           c.y = $y`,
      {
        id: citizen.id,
        name: citizen.name,
        job: citizen.job,
        hunger: Math.round(citizen.hunger),
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
