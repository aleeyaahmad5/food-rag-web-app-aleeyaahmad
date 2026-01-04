import { Index } from "@upstash/vector"
import Groq from "groq-sdk"

// Set longer timeout for Edge runtime (especially for 70B model)
export const maxDuration = 60 // 60 seconds max for Vercel

// Lazy initialization to avoid build-time errors
let upstashIndex: Index | null = null
let groq: Groq | null = null

function getUpstashIndex() {
  if (!upstashIndex) {
    upstashIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    })
  }
  return upstashIndex
}

function getGroq() {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    })
  }
  return groq
}

interface SearchResult {
  id: string
  score: number
  metadata: {
    text: string
    category: string
    origin: string
  }
}

export async function POST(req: Request) {
  const startTime = performance.now()

  try {
    const { question, model = "llama-3.1-8b-instant" } = await req.json()

    if (!question || typeof question !== "string") {
      return Response.json({ error: "Question is required" }, { status: 400 })
    }

    // Validate model selection
    const validModels = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile"]
    const selectedModel = validModels.includes(model) ? model : "llama-3.1-8b-instant"

    const index = getUpstashIndex()
    const groqClient = getGroq()

    // Vector search using Upstash
    const vectorSearchStart = performance.now()
    const results = await index.query({
      data: question,
      topK: 3,
      includeMetadata: true,
    })
    const vectorSearchTime = performance.now() - vectorSearchStart

    // Format sources
    const sources: SearchResult[] = results.map((result) => ({
      id: String(result.id),
      score: result.score,
      metadata: result.metadata as SearchResult["metadata"],
    }))

    // Build context from search results
    const context = sources
      .map((source, index) => `[${index + 1}] ${source.metadata.text}`)
      .join("\n\n")

    // Generate AI response using Groq (simple, no streaming)
    const llmStart = performance.now()
    const maxTokens = selectedModel.includes("70b") ? 800 : 500
    
    const completion = await groqClient.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: "You are a helpful food knowledge assistant. Answer questions based on the provided context. Be concise and informative.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer based on the context above:`,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    })
    
    const llmProcessingTime = performance.now() - llmStart
    const answer = completion.choices[0]?.message?.content?.trim() || "No answer generated"
    const totalResponseTime = performance.now() - startTime

    return Response.json({
      answer,
      sources: sources.map(s => ({
        text: s.metadata.text,
        relevance: s.score,
        region: s.metadata.origin
      })),
      metrics: {
        vectorSearchTime: Math.round(vectorSearchTime),
        llmProcessingTime: Math.round(llmProcessingTime),
        totalResponseTime: Math.round(totalResponseTime),
        tokensUsed: completion.usage?.total_tokens
      }
    })
  } catch (error) {
    console.error("[API] Error:", error)
    return Response.json(
      { error: "Failed to process your question. Please try again." },
      { status: 500 }
    )
  }
}
