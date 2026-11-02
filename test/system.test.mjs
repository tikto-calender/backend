import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createApp } from "../src/app.mjs";

let baseUrl;
let server;

before(async () => {
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("health exposes the backend source version", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "tikto-backend");
  assert.match(body.version, /^\d+\.\d+\.\d+$/);
});

test("status includes backend, database and notification health", async () => {
  const response = await fetch(`${baseUrl}/api/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.backend.status, "ok");
  assert.equal(body.data.database.status, "ok");
  assert.equal(body.data.notification.status, "disabled");
  assert.equal(body.data.notification.account.connected, false);
});
