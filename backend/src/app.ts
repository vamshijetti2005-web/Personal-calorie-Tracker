import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { aiRouter } from "./routes/ai.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { entriesRouter } from "./routes/entries.js";
import { goalsRouter } from "./routes/goals.js";
import { reportsRouter } from "./routes/reports.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "calorie-tracker" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/goals", goalsRouter);
  app.use("/api/entries", entriesRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/chat", chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
