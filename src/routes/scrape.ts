import { Hono } from "hono";
import { scrapeAndProcessUrl } from "../services/scraper.js";
import {
  addDocumentsToVectorStore,
  clearVectorStore,
} from "../services/vectorStore.js";

const scrapeRouter = new Hono();

scrapeRouter.post("/scrape", async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    try {
      new URL(url);
    } catch {
      return c.json({ error: "Invalid URL format" }, 400);
    }

    console.log(`Processing scrape request for: ${url}`);

    await clearVectorStore();

    const result = await scrapeAndProcessUrl(url);

    await addDocumentsToVectorStore(result.documents);

    return c.json({
      success: true,
      message: "URL scraped and processed successfully",
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Scrape endpoint error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to scrape URL",
      },
      500
    );
  }
});

export default scrapeRouter;
