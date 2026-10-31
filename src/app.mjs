import express from "express";

import { notificationsRouter } from "./routes/notifications.mjs";
import { plannerRouter } from "./routes/planner.mjs";
import { systemRouter } from "./routes/system.mjs";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", systemRouter());
  app.use("/api", plannerRouter());
  app.use("/api", notificationsRouter());

  app.use((_request, response) => {
    response.status(404).json({ error: "API route not found." });
  });

  app.use((error, _request, response, _next) => {
    const status = Number.isInteger(error?.status) ? error.status : 400;
    const message = error instanceof SyntaxError ? "JSON không hợp lệ." : error.message;
    response.status(status).json({ error: message || "Request failed." });
  });

  return app;
}
