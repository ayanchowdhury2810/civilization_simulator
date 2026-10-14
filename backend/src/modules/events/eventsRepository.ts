import { env } from "../../config/env.js";
import { graphQuery } from "../../config/falkordb.js";
import type { SimEvent } from "../../simulation/types.js";
import type { WorldState } from "../../simulation/worldState.js";

export async function syncUnsyncedEvents(state: WorldState): Promise<number> {
  const events = state.unsyncedEvents();
  for (const event of events) {
    await persistEvent(event);
    await persistInvolvement(event);
    await persistCause(event);
    event.synced = true;
  }
  return events.length;
}

async function persistEvent(event: SimEvent): Promise<void> {
  await graphQuery(
    env.FALKORDB_GRAPH,
    `MERGE (e:Event {id: $id})
     SET e.type = $type,
         e.message = $message,
         e.timestamp = $timestamp,
         e.tick = $tick,
         e.citizenId = $citizenId,
         e.buildingId = $buildingId`,
    {
      id: event.id,
      type: event.type,
      message: event.message,
      timestamp: event.timestamp,
      tick: event.tick,
      citizenId: event.citizenId ?? null,
      buildingId: event.buildingId ?? null,
    },
  );
}

async function persistInvolvement(event: SimEvent): Promise<void> {
  if (event.citizenId) {
    await graphQuery(
      env.FALKORDB_GRAPH,
      `MATCH (c:Citizen {id: $citizenId}), (e:Event {id: $eventId})
       MERGE (c)-[:INVOLVED_IN]->(e)`,
      { citizenId: event.citizenId, eventId: event.id },
    );
  }

  if (event.buildingId) {
    await graphQuery(
      env.FALKORDB_GRAPH,
      `MATCH (b:Building {id: $buildingId}), (e:Event {id: $eventId})
       MERGE (b)-[:INVOLVED_IN]->(e)`,
      { buildingId: event.buildingId, eventId: event.id },
    );
  }
}

async function persistCause(event: SimEvent): Promise<void> {
  if (!event.causedByEventId) return;
  await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (cause:Event {id: $causeId}), (effect:Event {id: $effectId})
     MERGE (cause)-[:CAUSED]->(effect)`,
    { causeId: event.causedByEventId, effectId: event.id },
  );
}
