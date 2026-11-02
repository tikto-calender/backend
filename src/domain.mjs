import { randomUUID } from "node:crypto";

export function cleanText(value, maximumLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function requireTitle(value) {
  const title = cleanText(value, 120);
  if (!title) throw new Error("Tiêu đề là bắt buộc.");
  return title;
}

export function createPlannerItem(collection, input) {
  const now = new Date().toISOString();

  if (collection === "tasks") {
    return {
      id: randomUUID(),
      title: requireTitle(input.title),
      description: cleanText(input.description, 1000),
      status: ["TODO", "IN_PROGRESS", "DONE"].includes(input.status)
        ? input.status
        : "TODO",
      priority: ["LOW", "MEDIUM", "HIGH"].includes(input.priority)
        ? input.priority
        : "MEDIUM",
      dueAt: cleanText(input.dueAt, 40) || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  const startAt = cleanText(input.startAt, 40);
  const endAt = cleanText(input.endAt, 40);
  if (!startAt || !endAt)
    throw new Error("Thời gian bắt đầu và kết thúc là bắt buộc.");
  if (new Date(endAt) <= new Date(startAt))
    throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu.");

  return {
    id: randomUUID(),
    title: requireTitle(input.title),
    description: cleanText(input.description, 1000),
    startAt,
    endAt,
    color: ["mint", "blue", "orange", "pink"].includes(input.color)
      ? input.color
      : "mint",
    createdAt: now,
    updatedAt: now,
  };
}

export function patchPlannerItem(collection, item, input) {
  if (input.title !== undefined) item.title = requireTitle(input.title);
  if (input.description !== undefined)
    item.description = cleanText(input.description, 1000);

  if (collection === "tasks") {
    if (["TODO", "IN_PROGRESS", "DONE"].includes(input.status))
      item.status = input.status;
    if (["LOW", "MEDIUM", "HIGH"].includes(input.priority))
      item.priority = input.priority;
    if (input.dueAt !== undefined)
      item.dueAt = cleanText(input.dueAt, 40) || null;
  } else {
    if (input.startAt !== undefined)
      item.startAt = cleanText(input.startAt, 40);
    if (input.endAt !== undefined) item.endAt = cleanText(input.endAt, 40);
    if (["mint", "blue", "orange", "pink"].includes(input.color))
      item.color = input.color;
    if (
      !item.startAt ||
      !item.endAt ||
      new Date(item.endAt) <= new Date(item.startAt)
    ) {
      throw new Error("Khoảng thời gian sự kiện không hợp lệ.");
    }
  }

  item.updatedAt = new Date().toISOString();
  return item;
}
