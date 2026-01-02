"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { SendHorizontal, Loader2 } from "lucide-react"
import { ragQuery } from "@/app/actions"

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

export function FoodChat() {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<RAGResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await ragQuery(question)
      setResponse(result)
      setQuestion("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about food... (e.g., 'What fruits are yellow?')"
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Card>

        {error && (
          <Card className="border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {response && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Sources</h2>
              <div className="space-y-3">
                {response.sources.map((source, index) => (
                  <div key={source.id} className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Source {index + 1}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {Math.round(source.score * 100)}% match
                      </span>
                    </div>
                    <p className="mb-2 text-sm leading-relaxed">{source.metadata.text}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-secondary/20 px-2 py-0.5">{source.metadata.category}</span>
                      <span className="rounded bg-accent/20 px-2 py-0.5">{source.metadata.origin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
              <h2 className="mb-4 text-lg font-semibold">AI Response</h2>
              <p className="leading-relaxed text-pretty">{response.answer}</p>
            </Card>
          </div>
        )}

        {!response && !loading && !error && (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Ask anything about food</h3>
            <p className="text-sm text-muted-foreground text-balance">
              Get AI-powered answers with relevant sources from our food knowledge base
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
