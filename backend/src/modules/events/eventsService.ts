import { worldState } from "../../simulation/worldState.js";
import type { SimEvent } from "../../simulation/types.js";

export function getRecentEvents(limit: number): SimEvent[] {
  return worldState.recentEvents(limit);
}
