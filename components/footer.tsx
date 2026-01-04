import { Heart, Zap, Database, BarChart3 } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-4">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-green-500" />
              Upstash Vector
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              Groq LLM
            </span>
            <Link 
              href="/admin" 
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
              title="Admin Dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              Analytics
            </Link>
          </div>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" /> using Next.js
          </p>
        </div>
      </div>
    </footer>
  )
}
