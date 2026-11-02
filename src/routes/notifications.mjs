import { Router } from "express";

import { cleanText } from "../domain.mjs";
import {
  cancelNotification,
  createNotification,
  listNotifications,
} from "../notification-client.mjs";

export function notificationsRouter() {
  const router = Router();

  router.get("/notifications", async (_request, response) => {
    response.json({ data: await listNotifications() });
  });

  router.post("/notifications", async (request, response) => {
    response
      .status(201)
      .json({ data: await createNotification(request.body ?? {}) });
  });

  router.post("/notifications/test", async (request, response) => {
    const created = await createNotification({
      targetType: "SYSTEM",
      targetId: "manual-test",
      channel: "LOG",
      message:
        cleanText(request.body?.message, 500) || "TikTo test notification",
      scheduledAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
    response.status(201).json({ data: created });
  });

  router.delete("/notifications/:id", async (request, response) => {
    response.json({ data: await cancelNotification(request.params.id) });
  });

  return router;
}
