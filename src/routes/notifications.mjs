import { Router } from "express";

import { cleanText } from "../domain.mjs";
import {
  cancelNotification,
  createNotification,
  listNotifications,
  sendTestNotification,
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
    const message =
      cleanText(request.body?.message, 500) || "TikTo test notification";
    response.status(201).json({
      data: await sendTestNotification(message),
    });
  });

  router.delete("/notifications/:id", async (request, response) => {
    response.json({ data: await cancelNotification(request.params.id) });
  });

  return router;
}
