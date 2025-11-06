import { NeonPostgres } from "@langchain/community/vectorstores/neon";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./embeddings.js";
import { config } from "../config.js";

let vectorStore: NeonPostgres | null = null;

export async function initializeVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }

  try {
    vectorStore = await NeonPostgres.initialize(embeddings, {
      connectionString: config.database.url,
    });
    console.log("✅ Vector store initialized with Neon DB (pgvector)");
    return vectorStore;
  } catch (error) {
    console.error("Failed to initialize vector store:", error);
    throw error;
  }
}

export async function addDocumentsToVectorStore(documents: Document[]) {
  const store = await initializeVectorStore();

  try {
    console.log(`📦 Adding ${documents.length} documents to Neon DB...`);
    await store.addDocuments(documents);
    console.log(
      `✅ Successfully saved ${documents.length} documents with embeddings to Neon DB`
    );
    return { success: true, count: documents.length };
  } catch (error) {
    console.error("Failed to add documents:", error);
    throw error;
  }
}

export async function searchSimilarDocuments(query: string, k: number = 4) {
  const store = await initializeVectorStore();

  try {
    console.log(
      `🔍 Searching for similar documents to query: "${query.substring(
        0,
        50
      )}..."`
    );
    const results = await store.similaritySearch(query, k);
    console.log(`✅ Found ${results.length} similar documents from Neon DB`);
    return results;
  } catch (error) {
    console.error("Failed to search documents:", error);
    throw error;
  }
}

export async function clearVectorStore() {
  try {
    if (vectorStore) {
      await vectorStore.delete({ deleteAll: true });
    }
    vectorStore = null;
    await initializeVectorStore();
    console.log("✅ Vector store cleared in Neon DB");
    return { success: true, message: "Vector store reset" };
  } catch (error) {
    console.error("Failed to clear vector store:", error);
    vectorStore = null;
    await initializeVectorStore();
    return { success: true, message: "Vector store reset (reinitialized)" };
  }
}
