import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";

let notificationService;
let receivedRequest;
let sendTestNotification;

before(async () => {
  notificationService = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    receivedRequest = {
      method: request.method,
      path: request.url,
      body: JSON.parse(body),
    };

    response.writeHead(201, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        data: {
          id: "notification-test-id",
          message: receivedRequest.body.message,
          status: "SENT",
          sentAt: "2026-11-03T10:00:00Z",
        },
      }),
    );
  });
  notificationService.listen(0, "127.0.0.1");
  await new Promise((resolve) =>
    notificationService.once("listening", resolve),
  );

  process.env.NOTIFICATION_SERVICE_URL = `http://127.0.0.1:${notificationService.address().port}`;
  ({ sendTestNotification } = await import(
    `../src/notification-client.mjs?test=${Date.now()}`
  ));
});

after(async () => {
  delete process.env.NOTIFICATION_SERVICE_URL;
  await new Promise((resolve, reject) =>
    notificationService.close((error) => (error ? reject(error) : resolve())),
  );
});

test("sendTestNotification forwards a simple message and returns SENT", async () => {
  const notification = await sendTestNotification("TikTo test notification");

  assert.deepEqual(receivedRequest, {
    method: "POST",
    path: "/notifications/test",
    body: { message: "TikTo test notification" },
  });
  assert.equal(notification.status, "SENT");
  assert.equal(notification.message, "TikTo test notification");
});
