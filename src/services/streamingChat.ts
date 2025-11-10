import { chatModel } from "./chat.js";
import { searchSimilarDocuments } from "./vectorStore.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { performWebSearch, webSearchToolDefinition } from "./webSearch.js";

export interface StreamEvent {
  type:
    | "status"
    | "tool_call"
    | "token"
    | "complete"
    | "error"
    | "searching_rag"
    | "found_documents"
    | "usage";
  content?: string;
  data?: any;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function* streamAnswer(
  question: string,
  useRAG = true,
  enableWebSearch = false,
  chatHistory: ChatMessage[] = []
): AsyncGenerator<StreamEvent> {
  try {
    if (!useRAG) {
      yield {
        type: "status",
        content: "Thinking...",
      };

      const historyMessages = chatHistory.map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else if (msg.role === "assistant") {
          return new SystemMessage(msg.content);
        } else {
          return new SystemMessage(msg.content);
        }
      });

      const messages: any[] = [
        new SystemMessage(
          "You are a helpful AI assistant. Answer questions naturally and helpfully. When you need current information or real-time data, use the web_search tool."
        ),
        ...historyMessages,
        new HumanMessage(question),
      ];

      const modelConfig: any = { streaming: true };
      if (enableWebSearch) {
        modelConfig.tools = [webSearchToolDefinition];
      }

      const stream = await chatModel.stream(messages, modelConfig);

      let fullResponse = "";
      let hasToolCalls = false;
      let inputTokens = 0;
      let outputTokens = 0;
      let totalTokens = 0;

      for await (const chunk of stream) {
        if (chunk.usage_metadata) {
          inputTokens = chunk.usage_metadata.input_tokens || 0;
          outputTokens = chunk.usage_metadata.output_tokens || 0;
          totalTokens = chunk.usage_metadata.total_tokens || 0;

          yield {
            type: "usage",
            data: {
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              total_tokens: totalTokens,
            },
          };
        }

        if (chunk.additional_kwargs?.tool_calls) {
          hasToolCalls = true;
          for (const toolCall of chunk.additional_kwargs.tool_calls) {
            if (toolCall.function.name === "web_search") {
              const args = JSON.parse(toolCall.function.arguments);

              yield {
                type: "tool_call",
                content: `Searching the web for: ${args.query}`,
                data: { tool: "web_search", query: args.query },
              };

              const searchResults = await performWebSearch(args.query);

              yield {
                type: "tool_call",
                content: `Found ${searchResults.results?.length || 0} results`,
                data: { tool: "web_search", results: searchResults },
              };

              messages.push(chunk);
              messages.push({
                role: "tool",
                content: JSON.stringify(searchResults),
                tool_call_id: toolCall.id,
              });

              yield {
                type: "status",
                content: "Analyzing search results...",
              };

              const finalStream = await chatModel.stream(messages);
              for await (const finalChunk of finalStream) {
                const content =
                  typeof finalChunk.content === "string"
                    ? finalChunk.content
                    : "";
                if (content) {
                  fullResponse += content;
                  yield {
                    type: "token",
                    content,
                  };
                }
              }
            }
          }
        } else {
          const content =
            typeof chunk.content === "string" ? chunk.content : "";
          if (content) {
            fullResponse += content;
            yield {
              type: "token",
              content,
            };
          }
        }
      }

      if (!hasToolCalls && fullResponse) {
        yield {
          type: "complete",
          data: {
            answer: fullResponse,
            sources: [],
            mode: "simple",
            usage: {
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              total_tokens: totalTokens,
            },
          },
        };
      }

      return;
    }

    yield {
      type: "searching_rag",
      content: "Searching knowledge base...",
    };

    const relevantDocs = await searchSimilarDocuments(question, 100);

    if (relevantDocs.length === 0) {
      yield {
        type: "complete",
        data: {
          answer:
            "I don't have any context to answer this question. Please provide a URL first or use simple chat mode.",
          sources: [],
          mode: "rag",
        },
      };
      return;
    }

    yield {
      type: "found_documents",
      content: `Found ${relevantDocs.length} relevant documents`,
      data: { count: relevantDocs.length },
    };

    yield {
      type: "status",
      content: "Generating answer...",
    };

    const context = relevantDocs
      .map((doc, idx) => `[${idx + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const systemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use the context below to answer the user's question. If the answer is not in the context, say so.
Always be concise and accurate.

Context:
${context}`;

    const historyMessages = chatHistory.map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "assistant") {
        return new SystemMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    });

    const stream = await chatModel.stream([
      new SystemMessage(systemPrompt),
      ...historyMessages,
      new HumanMessage(question),
    ]);

    let fullResponse = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    for await (const chunk of stream) {
      // Track token usage if available
      if (chunk.usage_metadata) {
        inputTokens = chunk.usage_metadata.input_tokens || 0;
        outputTokens = chunk.usage_metadata.output_tokens || 0;
        totalTokens = chunk.usage_metadata.total_tokens || 0;

        yield {
          type: "usage",
          data: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: totalTokens,
          },
        };
      }

      const content = typeof chunk.content === "string" ? chunk.content : "";
      if (content) {
        fullResponse += content;
        yield {
          type: "token",
          content,
        };
      }
    }

    yield {
      type: "complete",
      data: {
        answer: fullResponse,
        sources: relevantDocs.map((doc, idx) => ({
          index: idx + 1,
          content: doc.pageContent.substring(0, 200) + "...",
          metadata: doc.metadata,
        })),
        mode: "rag",
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
        },
      },
    };
  } catch (error) {
    console.error("Streaming error:", error);
    yield {
      type: "error",
      content:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
