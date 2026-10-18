import { INITIAL_RESOURCES } from "../../common/constants/index.js";
import { seedWorld } from "../../simulation/seed.js";
import { worldState } from "../../simulation/worldState.js";
import type { WorldSnapshot } from "../../simulation/types.js";
import { syncUnsyncedEvents } from "../events/eventsRepository.js";
import { fetchPersistedWorld, syncWorldState } from "./worldRepository.js";

export function getWorldSnapshot(): WorldSnapshot {
  return {
    tick: worldState.tick,
    lastTickAt: worldState.lastTickAt,
    resources: { ...worldState.resources },
    market: { ...worldState.market },
    housingCapacity: worldState.housingCapacity,
    citizens: [...worldState.citizens.values()],
    buildings: [...worldState.buildings.values()],
    recentEvents: worldState.recentEvents(20),
    recentTrades: worldState.recentTrades(20),
  };
}

export function ensureWorldSeeded(): void {
  if (worldState.citizens.size > 0) return;
  worldState.resources.food = INITIAL_RESOURCES.food;
  worldState.resources.gold = INITIAL_RESOURCES.gold;
  seedWorld(worldState);
  worldState.addEvent({
    type: "WorldCreated",
    message: `Civilization founded with ${worldState.citizens.size} citizens.`,
  });
}

export async function syncWorldToGraph(): Promise<boolean> {
  const synced = await trySyncWorld();
  if (!synced) {
    console.error(
      "[world] FalkorDB sync failed — persistence unavailable",
    );
  }
  return synced;
}

export async function trySyncWorld(): Promise<boolean> {
  try {
    await syncWorldState(worldState);
    await syncUnsyncedEvents(worldState);
    return true;
  } catch {
    return false;
  }
}

export async function loadWorldFromGraph(): Promise<boolean> {
  try {
    const persisted = await fetchPersistedWorld();
    if (!persisted) return false;
    worldState.restore(persisted);
    return true;
  } catch {
    return false;
  }
}
