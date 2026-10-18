import { runTick, type TickResult } from "../../simulation/tickEngine.js";
import { updateWorldState } from "../world/worldService.js";

export async function runSingleTick(): Promise<
  TickResult & { graphSynced: boolean }
> {
  const result = await updateWorldState((state) => runTick(state));
  return { ...result, graphSynced: true };
}

let loopHandle: NodeJS.Timeout | null = null;

export function startTickLoop(intervalMs: number): void {
  if (loopHandle) return;
  loopHandle = setInterval(() => {
    void runSingleTick().catch((err) => {
      console.error("[tick] auto tick failed:", err);
    });
  }, intervalMs);
  console.log(`[tick] auto tick loop started (${intervalMs}ms)`);
}

export function stopTickLoop(): void {
  if (loopHandle) {
    clearInterval(loopHandle);
    loopHandle = null;
    console.log("[tick] auto tick loop stopped");
  }
}

export function isTickLoopRunning(): boolean {
  return loopHandle !== null;
}
