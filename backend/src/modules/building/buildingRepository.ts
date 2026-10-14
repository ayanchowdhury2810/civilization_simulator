import { PLAYER_ID } from "../../common/constants/index.js";
import { env } from "../../config/env.js";
import { graphQuery } from "../../config/falkordb.js";
import type { Building } from "../../simulation/types.js";

export async function persistBuilding(building: Building): Promise<void> {
  await graphQuery(
    env.FALKORDB_GRAPH,
    `MERGE (b:Building {id: $id})
     SET b.type = $type,
         b.capacity = $capacity,
         b.workerCount = 0,
         b.x = $x,
         b.y = $y`,
    {
      id: building.id,
      type: building.type,
      capacity: building.capacity,
      x: building.x,
      y: building.y,
    },
  );

  await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (w:World {id: "main"}), (b:Building {id: $id})
     MERGE (w)-[:HAS_BUILDING]->(b)`,
    { id: building.id },
  );

  await graphQuery(
    env.FALKORDB_GRAPH,
    `MERGE (p:Player {id: $playerId})
     SET p.role = "King"
     WITH p
     MATCH (b:Building {id: $id})
     MERGE (p)-[:BUILT]->(b)`,
    { playerId: PLAYER_ID, id: building.id },
  );
}
