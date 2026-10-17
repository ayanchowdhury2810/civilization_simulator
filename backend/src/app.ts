import express from "express";
import helmet from "helmet";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { env } from "./config/env.js";
import { pingFalkorDB } from "./config/falkordb.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(async (_req, res, next) => {
  const up = await pingFalkorDB();
  if (up) {
    next();
    return;
  }
  res.status(503).json({
    success: false,
    error: {
      message: `FalkorDB is not running at ${env.FALKORDB_HOST}:${env.FALKORDB_PORT}. Start FalkorDB, then refresh.`,
      code: "FALKORDB_DOWN",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api", router);

app.use(errorMiddleware);
