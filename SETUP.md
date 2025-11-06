# Setup Guide

## Step 1: Get Your API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it to your `.env` file

### OpenRouter API Key
1. Go to https://openrouter.ai/keys
2. Create a new API key
3. Copy it to your `.env` file

## Step 2: Set Up Neon Database

### Create Neon Project
1. Go to https://console.neon.tech/
2. Sign up or log in
3. Click "Create Project"
4. Choose a name (e.g., "openrouter-chat")
5. Select region (closest to you)
6. Click "Create Project"

### Get Connection String
1. In your Neon dashboard, click "Connection Details"
2. Copy the connection string
3. It looks like: `postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Paste it in your `.env` as `DATABASE_URL`

### Enable pgvector Extension
1. In Neon dashboard, go to "SQL Editor"
2. Run this command:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Verify it worked:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see the vector extension listed.

## Step 3: Create .env File

In the backend root directory, create `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=3001
NODE_ENV=development
```

## Step 4: Install and Run

```bash
npm install
npm run dev
```

You should see:
```
✅ Server running at http://localhost:3001
📝 API endpoints:
   POST /api/scrape - Scrape a URL
   POST /api/chat - Chat with scraped content
```

## Step 5: Test the API

### Test scraping:
```bash
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Test chat:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is this page about?"}'
```

## Troubleshooting

### "Vector extension not found"
- Make sure you ran `CREATE EXTENSION vector;` in Neon SQL Editor
- Restart the backend server

### "Connection refused"
- Check your DATABASE_URL is correct
- Make sure Neon project is active (not suspended)

### "API key invalid"
- Verify your API keys are correct in `.env`
- Make sure there are no extra spaces or quotes

## Next Steps

Once backend is working:
1. Update frontend to call backend API
2. Add URL input field in frontend
3. Connect chat to backend instead of direct OpenRouter calls
