import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { chatModel } from "./chat.js";
import { searchSimilarDocuments } from "./vectorStore.js";
import { performWebSearch, webSearchToolDefinition } from "./webSearch.js";

export async function answerQuestion(
  question: string,
  useRAG = true,
  enableWebSearch = false
) {
  try {
    if (!useRAG) {
      const messages: any[] = [
        new SystemMessage(
          "You are a helpful AI assistant. Answer questions naturally and helpfully. When you need current information or real-time data, use the web_search tool."
        ),
        new HumanMessage(question),
      ];

      const modelConfig: any = {};
      if (enableWebSearch) {
        modelConfig.tools = [webSearchToolDefinition];
      }

      const response = await chatModel.invoke(messages, modelConfig);

      const toolCalls: any[] = [];
      if (response.additional_kwargs?.tool_calls) {
        for (const toolCall of response.additional_kwargs.tool_calls) {
          if (toolCall.function.name === "web_search") {
            const args = JSON.parse(toolCall.function.arguments);
            const searchResults = await performWebSearch(args.query);

            toolCalls.push({
              tool: "web_search",
              query: args.query,
              results: searchResults,
            });

            messages.push(response);
            messages.push({
              role: "tool",
              content: JSON.stringify(searchResults),
              tool_call_id: toolCall.id,
            });

            const finalResponse = await chatModel.invoke(messages);
            return {
              answer: finalResponse.content as string,
              sources: [],
              mode: "simple",
              toolCalls,
            };
          }
        }
      }

      return {
        answer: response.content as string,
        sources: [],
        mode: "simple",
        toolCalls,
      };
    }

    const relevantDocs = await searchSimilarDocuments(question, 50);

    if (relevantDocs.length === 0) {
      return {
        answer:
          "I don't have any context to answer this question. Please provide a URL first or use simple chat mode.",
        sources: [],
        mode: "rag",
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
      mode: "rag",
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
