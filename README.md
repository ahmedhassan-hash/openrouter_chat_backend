# OpenRouter Chat Backend

A powerful, flexible chat backend with RAG (Retrieval Augmented Generation), web search, and streaming support.

## Features

- 💬 **Simple Chat Mode** - Direct conversation without RAG
- 🔍 **RAG Mode** - Chat with scraped web content
- 🌐 **Web Search Tool** - AI can search the web when needed
- 📡 **Streaming Responses** - Real-time progress indicators
- 🧠 Document embeddings with Hugging Face
- 💬 Multiple LLM options via OpenRouter (free tier)
- 🗄️ Vector storage with Neon PostgreSQL + pgvector
- ⚡ Fast API with Hono
- 🔗 LangChain.js for RAG pipeline

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
# OpenRouter API Key - Get from https://openrouter.ai/
OPENROUTER_API_KEY=sk-your-openrouter-key-here

# Hugging Face API Key - Get from https://huggingface.co/settings/tokens
HUGGING_FACE_ACCESS_TOKEN=your_huggingface_token_here

# Tavily API Key (optional, for web search) - Get from https://tavily.com/
TAVILY_API_KEY=your_tavily_api_key_here

# Database URL (PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Run this SQL to enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Run the Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

## API Endpoints

### POST /api/scrape
Scrape a URL and process it for RAG mode.

```json
{
  "url": "https://example.com/docs"
}
```

### POST /api/chat
Chat with the AI (non-streaming).

```json
{
  "message": "Your question here",
  "mode": "simple",           // "simple" or "rag" (default: "simple")
  "enableWebSearch": false    // true to enable web search (default: false)
}
```

**Modes:**
- `simple` - Direct chat without RAG
- `rag` - Chat with scraped content (requires `/api/scrape` first)

**Web Search:**
- Set `enableWebSearch: true` to allow the AI to search the web
- Requires `TAVILY_API_KEY` in `.env`

### POST /api/chat/stream
Streaming chat with real-time progress indicators.

Same request body as `/api/chat`, but returns Server-Sent Events (SSE).

**Event Types:**
- `status` - Status updates ("Thinking...", "Analyzing...")
- `tool_call` - When AI uses tools (web search)
- `searching_rag` - Searching knowledge base
- `found_documents` - Found relevant documents
- `token` - Streaming response tokens
- `complete` - Response complete with full data
- `error` - Error occurred

See [API.md](./API.md) for detailed documentation and frontend integration examples.

## Tech Stack

- **Hono** - Fast web framework with streaming support
- **LangChain.js** - RAG orchestration and AI tools
- **Hugging Face** - Embeddings (msmarco-cotmae-MiniLM-L12)
- **OpenRouter** - Multiple free LLM options (Gemini 2.0 Flash, DeepSeek, etc.)
- **Tavily** - Web search API for AI agents
- **Neon** - PostgreSQL with pgvector
- **Cheerio** - Web scraping
- **TypeScript** - Type safety

## How It Works

### Simple Chat Mode
1. User sends a message
2. AI responds directly without context
3. Optional: AI can use web search tool for current information

### RAG Mode
1. User provides a URL via `/api/scrape`
2. Backend scrapes content with Cheerio
3. Content is split into chunks (1000 chars, 200 overlap)
4. Chunks are embedded using Hugging Face embeddings
5. Embeddings stored in Neon with pgvector
6. User asks questions
7. Relevant chunks retrieved via similarity search
8. Context + question sent to AI model
9. AI responds with context-aware answer

### Streaming Mode
- Real-time token streaming
- Progress indicators at each step
- Tool usage visibility (web searches)
- Better UX with instant feedback

## Examples

### Simple Chat
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "mode": "simple"}'
```

### Chat with Web Search
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the latest AI news?", "mode": "simple", "enableWebSearch": true}'
```

### RAG Mode
```bash
# First scrape a URL
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.example.com"}'

# Then chat with it
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What does the documentation say?", "mode": "rag"}'
```

### Streaming
See [API.md](./API.md) for frontend integration examples with React/Next.js.

## License

MIT
