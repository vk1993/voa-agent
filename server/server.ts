// server/server.ts
import { createServer } from "./app";

const PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 8080;

async function start() {
  try {
    const app = await createServer();
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Fastify server listening on http://0.0.0.0:${PORT}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
