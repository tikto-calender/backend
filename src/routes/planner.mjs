import { Router } from "express";

import { createPlannerItem, patchPlannerItem } from "../domain.mjs";
import { createItem, deleteItem, readStore, updateItem } from "../store.mjs";

export function plannerRouter() {
  const router = Router();

  router.get("/overview", async (_request, response) => {
    response.json({ data: await readStore() });
  });

  for (const collection of ["tasks", "events"]) {
    router.get(`/${collection}`, async (_request, response) => {
      const store = await readStore();
      response.json({ data: store[collection] });
    });

    router.post(`/${collection}`, async (request, response) => {
      const created = createPlannerItem(collection, request.body ?? {});
      await createItem(collection, created);
      response.status(201).json({ data: created });
    });

    router.patch(`/${collection}/:id`, async (request, response) => {
      const updated = await updateItem(collection, request.params.id, (item) => patchPlannerItem(collection, item, request.body ?? {}));
      if (!updated) return response.status(404).json({ error: "Không tìm thấy dữ liệu." });
      return response.json({ data: updated });
    });

    router.delete(`/${collection}/:id`, async (request, response) => {
      const deleted = await deleteItem(collection, request.params.id);
      if (!deleted) return response.status(404).json({ error: "Không tìm thấy dữ liệu." });
      return response.json({ data: { id: request.params.id } });
    });
  }

  return router;
}
