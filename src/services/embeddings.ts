import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "../config.js";

export const embeddings = new OpenAIEmbeddings({
  apiKey: config.openai.apiKey,
  model: "text-embedding-3-small",
  dimensions: 1536,
});
