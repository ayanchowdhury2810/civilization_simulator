import { INITIAL_RESOURCES } from "../../common/constants/index.js";
import { seedWorld } from "../../simulation/seed.js";
import { WorldState } from "../../simulation/worldState.js";
import type { WorldSnapshot } from "../../simulation/types.js";
import { syncUnsyncedEvents } from "../events/eventsRepository.js";
import { fetchPersistedWorld, syncWorldState } from "./worldRepository.js";

let mutationQueue: Promise<void> = Promise.resolve();
let initialization: Promise<void> | null = null;

export function initializeWorldInGraph(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    if (await fetchPersistedWorld()) return;
    const state = createSeededWorld();
    await persistWorldState(state);
  })().finally(() => {
    initialization = null;
  });
  return initialization;
}

export async function loadWorldStateFromGraph(): Promise<WorldState> {
  let persisted = await fetchPersistedWorld();
  if (!persisted) {
    await initializeWorldInGraph();
    persisted = await fetchPersistedWorld();
  }
  if (!persisted) throw new Error("No world is stored in FalkorDB");
  const state = new WorldState();
  state.restore(persisted);
  return state;
}

export async function updateWorldState<T>(
  update: (state: WorldState) => Promise<T> | T,
): Promise<T> {
  let release!: () => void;
  const previous = mutationQueue;
  mutationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const state = await loadWorldStateFromGraph();
    const result = await update(state);
    await persistWorldState(state);
    return result;
  } finally {
    release();
  }
}

async function persistWorldState(state: WorldState): Promise<void> {
  await syncWorldState(state);
  await syncUnsyncedEvents(state);
}

function createSeededWorld(): WorldState {
  const state = new WorldState();
  state.resources.food = INITIAL_RESOURCES.food;
  state.resources.gold = INITIAL_RESOURCES.gold;
  seedWorld(state);
  state.addEvent({
    type: "WorldCreated",
    message: `Civilization founded with ${state.citizens.size} citizens.`,
  });
  return state;
}

export async function getWorldSnapshot(): Promise<WorldSnapshot> {
  const state = await loadWorldStateFromGraph();
  return {
    tick: state.tick,
    lastTickAt: state.lastTickAt,
    resources: { ...state.resources },
    market: { ...state.market },
    housingCapacity: state.housingCapacity,
    citizens: [...state.citizens.values()],
    buildings: [...state.buildings.values()],
    recentEvents: state.recentEvents(20),
    recentTrades: state.recentTrades(20),
  };
}
