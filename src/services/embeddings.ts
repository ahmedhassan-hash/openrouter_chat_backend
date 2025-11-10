import { InferenceClient } from "@huggingface/inference";
import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
import { config } from "../config.js";

class HuggingFaceEmbeddings extends Embeddings {
  private readonly client: InferenceClient;
  private readonly model: string;

  constructor(params: EmbeddingsParams & { apiKey: string; model: string }) {
    super(params);
    this.client = new InferenceClient(params.apiKey);
    this.model = params.model;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const result = await this.client.featureExtraction({
        model: this.model,
        inputs: text,
      });

      const embedding = Array.isArray(result) ? result : [];
      embeddings.push(embedding as number[]);
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const result = await this.client.featureExtraction({
      model: this.model,
      inputs: text,
    });

    return Array.isArray(result) ? (result as number[]) : [];
  }
}

export const embeddings = new HuggingFaceEmbeddings({
  apiKey: config.huggingFace.apiKey,
  model: "sangmini/msmarco-cotmae-MiniLM-L12_en-ko-ja",
});
