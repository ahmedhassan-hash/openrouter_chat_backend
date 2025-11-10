import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config.js";

export const chatModel = new ChatOpenAI({
  apiKey: config.openrouter.apiKey,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },

  // modelName: "deepseek/deepseek-r1:free",
  modelName: "minimax/minimax-m2:free",
  // modelName: "openrouter/polaris-alpha",
  // modelName: "deepseek/deepseek-chat-v3.1:free",
  // modelName: "openai/gpt-oss-20b:free",
  // modelName: "meta-llama/llama-3.3-8b-instruct:free",
  // modelName: "mistralai/mistral-7b-instruct:free",
  // modelName: "z-ai/glm-4.5-air:free",

  temperature: 0.7,
  streamUsage: true,
});
