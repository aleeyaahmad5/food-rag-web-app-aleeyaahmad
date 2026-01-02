# API Documentation

## Overview

The Food RAG Web Application provides two main API interfaces for querying the food knowledge base:

1. **Server Action** (`ragQuery`) - Non-streaming, full response
2. **API Route** (`/api/chat`) - Streaming, real-time response

---

## Server Action: `ragQuery`

### Location
`app/actions.ts`

### Usage

```typescript
import { ragQuery } from "@/app/actions"

const response = await ragQuery("What fruits are popular in tropical regions?")
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | `string` | Yes | The user's food-related question |

### Response Type

```typescript
interface RAGResponse {
  sources: SearchResult[]
  answer: string
  metrics: PerformanceMetrics
}

interface SearchResult {
  id: string
  score: number  // 0-1 relevance score
  metadata: {
    text: string
    category: string
    origin: string
  }
}

interface PerformanceMetrics {
  vectorSearchTime: number    // milliseconds
  llmProcessingTime: number   // milliseconds
  totalResponseTime: number   // milliseconds
  tokensUsed?: number         // total tokens used
}
```

### Example Response

```json
{
  "sources": [
    {
      "id": "mango_001",
      "score": 0.92,
      "metadata": {
        "text": "Mango is a popular tropical fruit known for its sweet taste...",
        "category": "fruit",
        "origin": "India, Southeast Asia"
      }
    },
    {
      "id": "coconut_002",
      "score": 0.85,
      "metadata": {
        "text": "Coconut is widely grown in tropical regions...",
        "category": "fruit",
        "origin": "Tropical regions worldwide"
      }
    }
  ],
  "answer": "Popular tropical fruits include mangoes, which originated in India...",
  "metrics": {
    "vectorSearchTime": 145,
    "llmProcessingTime": 892,
    "totalResponseTime": 1037,
    "tokensUsed": 423
  }
}
```

---

## Streaming API: `POST /api/chat`

### Location
`app/api/chat/route.ts`

### Endpoint
```
POST /api/chat
Content-Type: application/json
```

### Request Body

```json
{
  "question": "What fruits are popular in tropical regions?"
}
```

### Response

Returns a text stream with the AI response. Sources and metrics are included in response headers.

### Response Headers

| Header | Description |
|--------|-------------|
| `X-Sources` | URL-encoded JSON array of source documents |
| `X-Vector-Search-Time` | Vector search duration in milliseconds |
| `X-LLM-Start-Time` | Timestamp when LLM processing started |
| `X-Start-Time` | Timestamp when request was received |

### Client-Side Usage

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "What are tropical fruits?" }),
})

// Get sources from headers
const sourcesHeader = response.headers.get("X-Sources")
const sources = sourcesHeader 
  ? JSON.parse(decodeURIComponent(sourcesHeader)) 
  : []

// Read the stream
const reader = response.body?.getReader()
const decoder = new TextDecoder()
let fullText = ""

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value, { stream: true })
  fullText += chunk
  // Update UI with partial response
}
```

---

## Upstash Vector Integration

### Configuration

```typescript
import { Index } from "@upstash/vector"

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})
```

### Query Method

```typescript
const results = await index.query({
  data: question,      // Text to search for
  topK: 3,             // Number of results
  includeMetadata: true // Include metadata in response
})
```

### Metadata Schema

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | Full text description of the food item |
| `category` | `string` | Category (fruit, vegetable, protein, etc.) |
| `origin` | `string` | Geographic origin or cultural association |

---

## Groq LLM Integration

### Configuration

```typescript
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})
```

### Chat Completion (Non-Streaming)

```typescript
const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content: "You are a helpful food knowledge assistant..."
    },
    {
      role: "user",
      content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`
    }
  ],
  temperature: 0.7,
  max_tokens: 500,
})
```

### Streaming (Vercel AI SDK)

```typescript
import { createGroq } from "@ai-sdk/groq"
import { streamText } from "ai"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

const result = streamText({
  model: groq("llama-3.1-8b-instant"),
  system: "You are a helpful food knowledge assistant...",
  prompt: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
  temperature: 0.7,
  maxOutputTokens: 500,
})

return result.toTextStreamResponse()
```

---

## Error Handling

### Server Action Errors

```typescript
try {
  const result = await ragQuery(question)
} catch (error) {
  // Error: "Failed to process your question. Please try again."
}
```

### API Route Errors

| Status Code | Description |
|-------------|-------------|
| `400` | Missing or invalid question parameter |
| `500` | Internal server error (DB or LLM failure) |

### Error Response Format

```json
{
  "error": "Failed to process your question. Please try again."
}
```

---

## Rate Limits & Performance

### Upstash Vector
- Serverless, auto-scaling
- No explicit rate limits for reasonable usage
- Response time: 100-200ms typical

### Groq API
- High throughput LLM inference
- Model: llama-3.1-8b-instant (optimized for speed)
- Response time: 500-1500ms typical

### Recommendations
- Use streaming for better perceived performance
- Implement client-side caching for repeated queries
- Consider debouncing rapid user inputs

---

## Environment Variables

```bash
# Required for Upstash Vector
UPSTASH_VECTOR_REST_URL=https://your-index.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_token_here

# Required for Groq
GROQ_API_KEY=gsk_your_api_key_here
```

All environment variables are server-side only and never exposed to the client.
