import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "./config.js";
import scrapeRouter from "./routes/scrape.js";
import chatRouter from "./routes/chat.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "OpenRouter Chat Backend API",
    version: "1.0.0",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

app.route("/api", scrapeRouter);
app.route("/api", chatRouter);

app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
    },
    500
  );
});

const port = config.server.port;
console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
console.log(`📝 API endpoints:`);
console.log(`   POST /api/scrape - Scrape a URL`);
console.log(`   POST /api/chat - Chat with scraped content`);
