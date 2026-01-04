"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Share2, Check, Link2 } from "lucide-react"

interface Message {
  question: string
  answer: string
  sources: Array<{ text: string; relevance: number; region: string }>
  timestamp?: Date
}

interface ExportShareProps {
  messages: Message[]
}

export function ExportShare({ messages }: ExportShareProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const exportAsMarkdown = () => {
    const markdown = messages.map((msg, i) => 
      `## Question ${i + 1}\n${msg.question}\n\n### Answer\n${msg.answer}\n\n### Sources\n${
        msg.sources.map((s, j) => `${j + 1}. ${s.text} (${Math.round(s.relevance * 100)}% match)`).join('\n')
      }\n`
    ).join('\n---\n\n')
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `food-rag-chat-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }

  const exportAsJSON = () => {
    const json = JSON.stringify(messages, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `food-rag-chat-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (messages.length === 0) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowMenu(!showMenu)}
        className="h-9 w-9 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        title="Export & Share"
      >
        <Download className="w-4 h-4" />
      </Button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in">
            <button
              onClick={exportAsMarkdown}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as Markdown
            </button>
            <button
              onClick={exportAsJSON}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </button>
            <hr className="my-2 border-slate-200 dark:border-slate-700" />
            <button
              onClick={copyLink}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
              {copied ? "Link Copied!" : "Copy Link"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
