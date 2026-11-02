import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanText,
  createPlannerItem,
  patchPlannerItem,
} from "../src/domain.mjs";

test("cleanText trims input and enforces the maximum length", () => {
  assert.equal(cleanText("  calendar  ", 5), "calen");
  assert.equal(cleanText(null), "");
});

test("createPlannerItem applies safe task defaults", () => {
  const task = createPlannerItem("tasks", { title: "  Ship release  " });

  assert.equal(task.title, "Ship release");
  assert.equal(task.status, "TODO");
  assert.equal(task.priority, "MEDIUM");
  assert.equal(task.dueAt, null);
});

test("createPlannerItem rejects an invalid event range", () => {
  assert.throws(
    () =>
      createPlannerItem("events", {
        title: "Invalid",
        startAt: "2026-11-02T11:00:00Z",
        endAt: "2026-11-02T10:00:00Z",
      }),
    /kết thúc phải sau/,
  );
});

test("patchPlannerItem updates allowed task fields", () => {
  const task = createPlannerItem("tasks", { title: "Initial" });
  const updated = patchPlannerItem("tasks", task, {
    status: "DONE",
    priority: "HIGH",
  });

  assert.equal(updated.status, "DONE");
  assert.equal(updated.priority, "HIGH");
});
