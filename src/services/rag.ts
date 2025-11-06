import { chatModel } from "./chat.js";
import { searchSimilarDocuments } from "./vectorStore.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function answerQuestion(question: string) {
  try {
    const relevantDocs = await searchSimilarDocuments(question, 4);

    if (relevantDocs.length === 0) {
      return {
        answer:
          "I don't have any context to answer this question. Please provide a URL first.",
        sources: [],
      };
    }

    const context = relevantDocs
      .map((doc, idx) => `[${idx + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const systemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use the context below to answer the user's question. If the answer is not in the context, say so.
Always be concise and accurate.

Context:
${context}`;

    const response = await chatModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(question),
    ]);

    return {
      answer: response.content as string,
      sources: relevantDocs.map((doc, idx) => ({
        index: idx + 1,
        content: doc.pageContent.substring(0, 200) + "...",
        metadata: doc.metadata,
      })),
    };
  } catch (error) {
    console.error("RAG error:", error);
    throw new Error(
      `Failed to answer question: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
