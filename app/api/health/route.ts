import { Index } from "@upstash/vector"
import Groq from "groq-sdk"

export async function GET() {
  const checks: Record<string, any> = {}

  // Check environment variables
  checks.env = {
    hasUpstashUrl: !!process.env.UPSTASH_VECTOR_REST_URL,
    hasUpstashToken: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
    hasGroqKey: !!process.env.GROQ_API_KEY,
  }

  // Test Upstash connection
  try {
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    })
    
    const testResult = await index.query({
      data: "test",
      topK: 1,
      includeMetadata: true,
    })
    
    checks.upstash = {
      status: "connected",
      resultsFound: testResult.length,
    }
  } catch (error) {
    checks.upstash = {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    }
  }

  // Test Groq connection
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    })
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Say 'OK' in one word",
        },
      ],
      max_tokens: 10,
    })
    
    checks.groq = {
      status: "connected",
      response: completion.choices[0]?.message?.content,
    }
  } catch (error) {
    checks.groq = {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    }
  }

  return Response.json(checks)
}
