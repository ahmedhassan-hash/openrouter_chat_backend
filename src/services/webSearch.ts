import { tavily } from "@tavily/core";
import { config } from "../config.js";

let tavilyClient: any = null;

function getTavilyClient(): any {
  if (!tavilyClient && config.tavily.apiKey) {
    tavilyClient = tavily({ apiKey: config.tavily.apiKey });
  }
  if (!tavilyClient) {
    throw new Error("Tavily API key not configured");
  }
  return tavilyClient;
}

export async function performWebSearch(
  query: string
): Promise<{ results: any[]; answer?: string }> {
  try {
    const client = getTavilyClient();
    const response = await client.search(query, {
      maxResults: 5,
      includeAnswer: true,
    });

    return {
      results: response.results || [],
      answer: response.answer,
    };
  } catch (error) {
    console.error("Web search error:", error);
    throw new Error(
      `Failed to perform web search: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const webSearchToolDefinition = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the web for current information, news, facts, or any real-time data. Use this when the user asks about recent events, current information, or anything you don't have in your knowledge base.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to look up on the web",
        },
      },
      required: ["query"],
    },
  },
};
