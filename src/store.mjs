import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(moduleDirectory, "../data");
const storePath = path.join(dataDirectory, "store.json");
const temporaryStorePath = path.join(dataDirectory, "store.json.tmp");
const collections = new Set(["tasks", "events"]);
const emptyStore = () => ({ tasks: [], events: [] });

export const storeBackend =
  process.env.STORE_BACKEND?.toLowerCase() === "dynamodb"
    ? "dynamodb"
    : "local";

const tableName = process.env.DYNAMODB_TABLE;
const environment = process.env.APP_ENV ?? "local";
const dynamo =
  storeBackend === "dynamodb"
    ? DynamoDBDocumentClient.from(
        new DynamoDBClient({
          region: process.env.AWS_REGION ?? "ap-southeast-2",
        }),
        {
          marshallOptions: { removeUndefinedValues: true },
        },
      )
    : null;

let writeQueue = Promise.resolve();

function assertCollection(collection) {
  if (!collections.has(collection))
    throw new Error(`Unsupported collection: ${collection}`);
}

function assertDynamoConfiguration() {
  if (!tableName)
    throw new Error("DYNAMODB_TABLE is required when STORE_BACKEND=dynamodb.");
}

function scopeFor(collection) {
  return `${environment}#${collection}`;
}

function withoutDynamoKeys(item) {
  if (!item) return null;
  const { scope: _scope, ...value } = item;
  return value;
}

async function readLocalStore() {
  try {
    const data = JSON.parse(await readFile(storePath, "utf8"));
    return {
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      events: Array.isArray(data.events) ? data.events : [],
    };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await saveLocalStore(emptyStore());
    return emptyStore();
  }
}

async function saveLocalStore(store) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(
    temporaryStorePath,
    `${JSON.stringify(store, null, 2)}\n`,
    "utf8",
  );
  await rename(temporaryStorePath, storePath);
}

function mutateLocalStore(update) {
  const operation = async () => {
    const store = await readLocalStore();
    const result = await update(store);
    await saveLocalStore(store);
    return result;
  };

  writeQueue = writeQueue.then(operation, operation);
  return writeQueue;
}

async function readDynamoCollection(collection) {
  assertDynamoConfiguration();
  const items = [];
  let exclusiveStartKey;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#scope = :scope",
        ExpressionAttributeNames: { "#scope": "scope" },
        ExpressionAttributeValues: { ":scope": scopeFor(collection) },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    items.push(...(result.Items ?? []).map(withoutDynamoKeys));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

export async function readStore() {
  if (storeBackend === "local") {
    await writeQueue.catch(() => undefined);
    return readLocalStore();
  }

  const [tasks, events] = await Promise.all([
    readDynamoCollection("tasks"),
    readDynamoCollection("events"),
  ]);
  return { tasks, events };
}

export async function checkStoreHealth() {
  const startedAt = performance.now();
  try {
    if (storeBackend === "local") {
      await readLocalStore();
    } else {
      assertDynamoConfiguration();
      await dynamo.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "#scope = :scope",
          ExpressionAttributeNames: { "#scope": "scope" },
          ExpressionAttributeValues: { ":scope": scopeFor("tasks") },
          Limit: 1,
        }),
      );
    }
    return {
      status: "ok",
      backend: storeBackend,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      status: "down",
      backend: storeBackend,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}

export async function createItem(collection, item) {
  assertCollection(collection);

  if (storeBackend === "local") {
    return mutateLocalStore((store) => {
      store[collection].push(item);
      return item;
    });
  }

  assertDynamoConfiguration();
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: { ...item, scope: scopeFor(collection) },
      ConditionExpression:
        "attribute_not_exists(#scope) AND attribute_not_exists(#id)",
      ExpressionAttributeNames: { "#scope": "scope", "#id": "id" },
    }),
  );
  return item;
}

export async function deleteItem(collection, id) {
  assertCollection(collection);

  if (storeBackend === "local") {
    return mutateLocalStore((store) => {
      const index = store[collection].findIndex((item) => item.id === id);
      if (index < 0) return false;
      store[collection].splice(index, 1);
      return true;
    });
  }

  assertDynamoConfiguration();
  const result = await dynamo.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { scope: scopeFor(collection), id },
      ReturnValues: "ALL_OLD",
    }),
  );
  return Boolean(result.Attributes);
}

export async function updateItem(collection, id, update) {
  assertCollection(collection);

  if (storeBackend === "local") {
    return mutateLocalStore(async (store) => {
      const item = store[collection].find((candidate) => candidate.id === id);
      if (!item) return null;
      await update(item);
      return item;
    });
  }

  assertDynamoConfiguration();
  const key = { scope: scopeFor(collection), id };
  const result = await dynamo.send(
    new GetCommand({ TableName: tableName, Key: key }),
  );
  const existing = withoutDynamoKeys(result.Item);
  if (!existing) return null;

  const expectedUpdatedAt = existing.updatedAt;
  const next = { ...existing };
  await update(next);

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: { ...next, ...key },
      ConditionExpression: expectedUpdatedAt
        ? "#updatedAt = :expectedUpdatedAt"
        : "attribute_not_exists(#updatedAt)",
      ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
      ExpressionAttributeValues: expectedUpdatedAt
        ? { ":expectedUpdatedAt": expectedUpdatedAt }
        : undefined,
    }),
  );
  return next;
}
