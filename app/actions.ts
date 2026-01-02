"use server"

import { Index } from "@upstash/vector"
import Groq from "groq-sdk"

const upstashIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

interface SearchResult {
  id: string
  score: number
  metadata: {
    text: string
    category: string
    origin: string
  }
}

interface RAGResponse {
  sources: SearchResult[]
  answer: string
}

export async function ragQuery(question: string): Promise<RAGResponse> {
  try {
    // Vector search using Upstash
    const results = await upstashIndex.query({
      data: question,
      topK: 3,
      includeMetadata: true,
    })

    // Format sources
    const sources: SearchResult[] = results.map((result) => ({
      id: result.id,
      score: result.score,
      metadata: result.metadata as SearchResult["metadata"],
    }))

    // Build context from search results
    const context = sources.map((source, index) => `[${index + 1}] ${source.metadata.text}`).join("\n\n")

    // Generate AI response using Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful food knowledge assistant. Answer questions based on the provided context. Be concise and informative.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer based on the context above:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const answer = completion.choices[0]?.message?.content?.trim() || "No answer generated"

    return {
      sources,
      answer,
    }
  } catch (error) {
    console.error("[v0] RAG Query Error:", error)
    throw new Error("Failed to process your question. Please try again.")
  }
}
