import express from "express";
import helmet from "helmet";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api", router);

app.use(errorMiddleware);
