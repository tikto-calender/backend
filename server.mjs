import { createApp } from "./src/app.mjs";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const server = createApp().listen(port, () => {
  console.log(`TikTo backend running at http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing HTTP server.`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
