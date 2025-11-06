import { Hono } from "hono";
import { answerQuestion } from "../services/rag.js";

const chatRouter = new Hono();

chatRouter.post("/chat", async (c) => {
  try {
    const { message } = await c.req.json();

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    console.log(`Processing chat message: ${message}`);

    const result = await answerQuestion(message);

    return c.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process message",
      },
      500
    );
  }
});

export default chatRouter;
