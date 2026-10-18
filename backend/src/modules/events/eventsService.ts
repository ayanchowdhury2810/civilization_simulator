import type { SimEvent } from "../../simulation/types.js";
import { loadWorldStateFromGraph } from "../world/worldService.js";

export async function getRecentEvents(limit: number): Promise<SimEvent[]> {
  const state = await loadWorldStateFromGraph();
  return state.recentEvents(limit);
}
