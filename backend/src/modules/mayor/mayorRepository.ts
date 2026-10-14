import { MAYOR_ID, PLAYER_ID } from "../../common/constants/index.js";
import { env } from "../../config/env.js";
import { graphQuery } from "../../config/falkordb.js";
import type { Policy } from "../../simulation/types.js";

export async function persistPolicy(policy: Policy): Promise<void> {
  const graph = env.FALKORDB_GRAPH;

  await graphQuery(
    graph,
    `MERGE (p:Policy {id: $id})
     SET p.name = $name,
         p.action = $action,
         p.reason = $reason,
         p.createdTick = $createdTick,
         p.createdAt = $createdAt,
         p.status = $status`,
    {
      id: policy.id,
      name: policy.name,
      action: policy.action,
      reason: policy.reason,
      createdTick: policy.createdTick,
      createdAt: policy.createdAt,
      status: policy.status,
    },
  );

  await graphQuery(
    graph,
    `MATCH (m:Mayor {id: $mayorId}), (p:Policy {id: $id})
     MERGE (m)-[:CREATED]->(p)`,
    { mayorId: MAYOR_ID, id: policy.id },
  );

  if (policy.triggeredByEventId) {
    await graphQuery(
      graph,
      `MATCH (p:Policy {id: $id}), (e:Event {id: $eventId})
       MERGE (p)-[:TRIGGERED_BY]->(e)`,
      { id: policy.id, eventId: policy.triggeredByEventId },
    );
  }
}

export async function persistApproval(
  policy: Policy,
  buildingId: string | null,
): Promise<void> {
  const graph = env.FALKORDB_GRAPH;

  await graphQuery(
    graph,
    `MERGE (p:Policy {id: $id})
     SET p.status = $status, p.approvedTick = $approvedTick`,
    {
      id: policy.id,
      status: policy.status,
      approvedTick: policy.approvedTick ?? 0,
    },
  );

  await graphQuery(
    graph,
    `MATCH (pl:Player {id: $playerId}), (p:Policy {id: $id})
     MERGE (pl)-[:APPROVED]->(p)`,
    { playerId: PLAYER_ID, id: policy.id },
  );

  if (buildingId) {
    await graphQuery(
      graph,
      `MATCH (pl:Player {id: $playerId}), (b:Building {id: $buildingId})
       MERGE (pl)-[:BUILT]->(b)`,
      { playerId: PLAYER_ID, buildingId },
    );
  }
}
