# Python Reference Code

This folder contains the original Python implementation of the Food RAG system
developed during Weeks 2-3 of the course.

## Purpose

These files serve as a reference to compare the Python implementation with the
Next.js/TypeScript web application. They demonstrate:

1. **Core RAG Pipeline** - Vector search + LLM generation
2. **Database Seeding** - How food data was indexed
3. **API Integration** - Upstash Vector and Groq client usage

## Files

| File | Description |
|------|-------------|
| `rag_system.py` | Main RAG implementation with vector search and LLM generation |
| `seed_data.py` | Database seeder script for adding food items to vector index |

## Key Differences: Python vs Next.js

### Python Implementation
```python
# Direct Groq SDK usage
client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))
response = client.chat.completions.create(...)
```

### Next.js Implementation
```typescript
// Using Vercel AI SDK for streaming support
import { createGroq } from "@ai-sdk/groq"
import { streamText } from "ai"

const result = streamText({
  model: groq("llama-3.1-8b-instant"),
  messages: [...],
})
```

## Running the Python Code

### Prerequisites
```bash
pip install upstash-vector groq python-dotenv
```

### Environment Variables
Create a `.env` file:
```
UPSTASH_VECTOR_REST_URL=your_url
UPSTASH_VECTOR_REST_TOKEN=your_token
GROQ_API_KEY=your_key
```

### Usage
```bash
# Seed the database
python seed_data.py

# Run a test query
python rag_system.py
```

## Architecture Comparison

| Aspect | Python | Next.js |
|--------|--------|---------|
| Runtime | Python 3.x | Node.js / Edge |
| Framework | Script-based | Next.js App Router |
| LLM Client | groq SDK | @ai-sdk/groq |
| Streaming | Not implemented | Full streaming support |
| UI | CLI only | React web interface |
| Hosting | Local/Server | Vercel serverless |

## Why Next.js for Production?

1. **Better UX** - Real-time streaming responses
2. **Modern UI** - React components with Tailwind CSS
3. **Serverless** - Auto-scaling on Vercel
4. **Type Safety** - TypeScript catches errors at compile time
5. **Edge Runtime** - Faster cold starts globally
