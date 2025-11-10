import { Hono } from "hono";
import { stream } from "hono/streaming";
import { answerQuestion } from "../services/rag.js";
import { streamAnswer } from "../services/streamingChat.js";

const chatRouter = new Hono();

chatRouter.post("/chat", async (c) => {
  try {
    const {
      message,
      mode = "simple",
      enableWebSearch = false,
      chatHistory = [],
    } = await c.req.json();

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    const useRAG = mode === "rag";
    console.log(
      `Processing chat message in ${mode} mode${
        enableWebSearch ? " with web search" : ""
      } with ${chatHistory.length} history messages: ${message}`
    );

    const result = await answerQuestion(
      message,
      useRAG,
      enableWebSearch,
      chatHistory
    );

    return c.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      mode: result.mode,
      toolCalls: result.toolCalls || [],
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

chatRouter.post("/chat/stream", async (c) => {
  try {
    const {
      message,
      mode = "simple",
      enableWebSearch = false,
      chatHistory = [],
    } = await c.req.json();

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    const useRAG = mode === "rag";
    console.log(
      `Streaming chat message in ${mode} mode${
        enableWebSearch ? " with web search" : ""
      } with ${chatHistory.length} history messages: ${message}`
    );

    return stream(c, async (stream) => {
      try {
        for await (const event of streamAnswer(
          message,
          useRAG,
          enableWebSearch,
          chatHistory
        )) {
          await stream.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        await stream.write(`data: [DONE]\n\n`);
      } catch (error) {
        console.error("Stream error:", error);
        await stream.write(
          `data: ${JSON.stringify({
            type: "error",
            content:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          })}\n\n`
        );
      }
    });
  } catch (error) {
    console.error("Chat stream endpoint error:", error);
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
