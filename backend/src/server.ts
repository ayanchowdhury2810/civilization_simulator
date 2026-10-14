import { app } from "./app.js";
import { env } from "./config/env.js";
import { closeFalkorDB, pingFalkorDB } from "./config/falkordb.js";
import { ensureWorldSeeded, syncWorldToGraph } from "./modules/world/worldService.js";
import {
  startTickLoop,
  stopTickLoop,
} from "./modules/tick/tickService.js";
import {
  evaluateAndStore as evaluateMayor,
  startMayorLoop,
  stopMayorLoop,
} from "./modules/mayor/mayorService.js";

async function bootstrap(): Promise<void> {
  ensureWorldSeeded();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });

  const dbUp = await Promise.race([
    pingFalkorDB(),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 3000)),
  ]);
  if (dbUp) {
    await syncWorldToGraph();
  } else {
    console.warn(
      `[startup] FalkorDB unreachable at ${env.FALKORDB_HOST}:${env.FALKORDB_PORT} — running in memory only`,
    );
  }

  if (env.AUTO_TICK) {
    startTickLoop(env.TICK_INTERVAL_MS);
  }

  evaluateMayor();
  if (env.AUTO_MAYOR) {
    startMayorLoop(env.MAYOR_INTERVAL_MS);
  }

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down`);
    stopTickLoop();
    stopMayorLoop();
    server.close();
    await closeFalkorDB();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("[server] fatal bootstrap error:", err);
  process.exit(1);
});
