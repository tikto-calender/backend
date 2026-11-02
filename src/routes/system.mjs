import { createRequire } from "node:module";

import { Router } from "express";

import {
  checkNotificationHealth,
  notificationConfiguration,
} from "../notification-client.mjs";
import { checkStoreHealth, storeBackend } from "../store.mjs";

const require = createRequire(import.meta.url);
const { version: appVersion } = require("../../package.json");

const runtime = Object.freeze({
  environment: process.env.APP_ENV ?? "local",
  version: appVersion,
  store: storeBackend,
  notification: notificationConfiguration(),
});

export function systemRouter() {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "tikto-backend", ...runtime });
  });

  router.get("/runtime", (_request, response) => {
    response.json({ data: runtime });
  });

  router.get("/status", async (_request, response) => {
    const [database, notification] = await Promise.all([
      checkStoreHealth(),
      checkNotificationHealth(),
    ]);
    const status =
      database.status === "ok" &&
      ["ok", "disabled"].includes(notification.status)
        ? "ok"
        : "degraded";
    const backend = {
      status: "ok",
      service: "tikto-backend",
      version: appVersion,
    };
    response.json({ data: { status, backend, database, notification } });
  });

  return router;
}
