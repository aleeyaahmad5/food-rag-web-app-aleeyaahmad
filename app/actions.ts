"use server"

import { Index } from "@upstash/vector"
import Groq from "groq-sdk"

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
      timeout: 60000, // 60 second timeout for 70B model
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

export interface PerformanceMetrics {
  vectorSearchTime: number
  llmProcessingTime: number
  totalResponseTime: number
  tokensUsed?: number
}

interface RAGResponse {
  sources: SearchResult[]
  answer: string
  metrics: PerformanceMetrics
}

export async function ragQuery(question: string, model: string = "llama-3.1-8b-instant"): Promise<RAGResponse> {
  const startTime = performance.now()
  console.log("[ragQuery] Starting with question:", question, "model:", model)
  
  try {
    // Validate model selection - using currently available Groq models
    const validModels = ["llama-3.1-8b-instant", "llama-3.2-70b-versatile"]
    // Handle old model names for backward compatibility
    let selectedModel = model
    if (model === "llama-3.1-70b-versatile") selectedModel = "llama-3.2-70b-versatile"
    selectedModel = validModels.includes(selectedModel) ? selectedModel : "llama-3.1-8b-instant"
    console.log("[ragQuery] Using model:", selectedModel)
    
    // Adjust max tokens based on model - 70B can handle more
    const maxTokens = selectedModel.includes("70b") ? 800 : 500
    
    // Get lazily initialized clients
    console.log("[ragQuery] Initializing clients...")
    const index = getUpstashIndex()
    const groqClient = getGroq()
    console.log("[ragQuery] Clients initialized")
    
    try {
      // Vector search using Upstash
      console.log("[ragQuery] Starting vector search...")
      const vectorSearchStart = performance.now()
      const results = await index.query({
        data: question,
        topK: 3,
        includeMetadata: true,
      })
      const vectorSearchTime = performance.now() - vectorSearchStart
      console.log("[ragQuery] Vector search completed in", vectorSearchTime, "ms, found", results.length, "results")

      // Format sources
      const sources: SearchResult[] = results.map((result: any, idx: number) => ({
        id: String(result.id || idx),
        score: Number(result.score || 0),
        metadata: {
          text: String(result.metadata?.text || ""),
          category: String(result.metadata?.category || "Food"),
          origin: String(result.metadata?.origin || "Unknown")
        },
      }))
      console.log("[ragQuery] Formatted sources:", sources.length)

      // Build context from search results
      const context = sources
        .map((source, index) => `[${index + 1}] ${source.metadata.text}`)
        .join("\n\n")
      console.log("[ragQuery] Context built, length:", context.length)

      // Generate AI response using Groq with retry for 70B model
      const llmStart = performance.now()
      console.log("[ragQuery] Starting LLM call with", maxTokens, "max tokens...")
      
      let completion;
      let retries = selectedModel.includes("70b") ? 2 : 1;
      let lastError;
      
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`[ragQuery] LLM attempt ${i + 1}/${retries}`)
          completion = await groqClient.chat.completions.create({
            model: selectedModel,
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
            max_tokens: maxTokens,
          })
          console.log("[ragQuery] LLM call successful")
          break; // Success, exit retry loop
        } catch (err) {
          lastError = err;
          console.error(`[ragQuery] LLM attempt ${i + 1} failed:`, err);
          if (i < retries - 1) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
      
      if (!completion) {
        throw lastError || new Error("Failed to get response from AI model");
      }
      
      const llmProcessingTime = performance.now() - llmStart
      console.log("[ragQuery] LLM processing took", llmProcessingTime, "ms")

      const answer = completion.choices[0]?.message?.content?.trim() || "No answer generated"
      console.log("[ragQuery] Answer generated, length:", answer.length)
      
      const totalResponseTime = performance.now() - startTime
      
      // Extract token usage if available
      const tokensUsed = completion.usage?.total_tokens
      console.log("[ragQuery] Tokens used:", tokensUsed)

      const metrics: PerformanceMetrics = {
        vectorSearchTime: Math.round(vectorSearchTime),
        llmProcessingTime: Math.round(llmProcessingTime),
        totalResponseTime: Math.round(totalResponseTime),
        tokensUsed,
      }

      console.log("[ragQuery] Success! Total time:", totalResponseTime, "ms")
      return {
        sources,
        answer,
        metrics,
      }
    } catch (searchError) {
      console.error("[ragQuery] Search or LLM error:", searchError)
      throw searchError
    }
  } catch (error) {
    console.error("[ragQuery] Fatal error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to process your question: ${errorMessage}`)
  }
}
