import { FoodChat } from "@/components/food-chat"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <span className="text-2xl">🍽️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-balance">Food RAG Assistant</h1>
              <p className="text-sm text-muted-foreground">AI-powered food knowledge search</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <FoodChat />
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by Upstash Vector & Groq AI
        </div>
      </footer>
    </div>
  )
}
