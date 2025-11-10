import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config.js";

export const chatModel = new ChatOpenAI({
  apiKey: config.openrouter.apiKey,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  // modelName: "deepseek/deepseek-r1:free",
  // modelName: "openrouter/polaris-alpha",
  // modelName: "minimax/minimax-m2:free",
  modelName: "google/gemini-2.0-flash-exp:free",
  temperature: 0.7,
});
