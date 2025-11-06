# OpenRouter Chat Backend

A RAG (Retrieval Augmented Generation) backend for chatting with web content.

## Features

- 🔍 Web scraping with Cheerio
- 🧠 Document embeddings with OpenAI (text-embedding-3-small)
- 💬 Chat with DeepSeek via OpenRouter (free tier)
- 🗄️ Vector storage with Neon PostgreSQL + pgvector
- ⚡ Fast API with Hono
- 🔗 LangChain.js for RAG pipeline

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-key-here
OPENROUTER_API_KEY=sk-your-openrouter-key-here
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
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
Scrape a URL and process it for chat.

```json
{
  "url": "https://example.com/docs"
}
```

### POST /api/chat
Chat with the scraped content.

```json
{
  "message": "What is this about?"
}
```

## Tech Stack

- **Hono** - Fast web framework
- **LangChain.js** - RAG orchestration
- **OpenAI** - Embeddings (text-embedding-3-small, 1536 dims)
- **OpenRouter** - Free DeepSeek chat model
- **Neon** - PostgreSQL with pgvector
- **Cheerio** - Web scraping
- **TypeScript** - Type safety

## How It Works

1. User provides a URL
2. Backend scrapes content with Cheerio
3. Content is split into chunks (1000 chars, 200 overlap)
4. Chunks are embedded using OpenAI embeddings
5. Embeddings stored in Neon with pgvector
6. User asks questions
7. Relevant chunks retrieved via similarity search
8. Context + question sent to DeepSeek
9. DeepSeek responds with context-aware answer
