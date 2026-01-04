"use client"

import { useEffect, useState } from "react"
import { Keyboard } from "lucide-react"

interface KeyboardShortcutsProps {
  onNewChat?: () => void
  onFocusInput?: () => void
}

export function KeyboardShortcuts({ onNewChat, onFocusInput }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        onFocusInput?.()
      }
      // Ctrl+Shift+N for new chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault()
        onNewChat?.()
      }
      // Escape to close help
      if (e.key === "Escape") {
        setShowHelp(false)
      }
      // ? to toggle help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setShowHelp((prev) => !prev)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onNewChat, onFocusInput])

  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Focus search input" },
    { keys: ["Ctrl", "Shift", "N"], description: "Start new chat" },
    { keys: ["Enter"], description: "Send message" },
    { keys: ["?"], description: "Toggle shortcuts help" },
    { keys: ["Esc"], description: "Close dialogs" },
    { keys: ["←"], description: "Open chat history sidebar" },
  ]

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="hidden md:flex fixed bottom-20 right-4 z-30 items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-xs rounded-lg shadow-md backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
      >
        <Keyboard className="w-3.5 h-3.5" />
        Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">?</kbd> for shortcuts
      </button>

      {/* Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-500" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="text-slate-500 text-lg">×</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {shortcuts.map((shortcut, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-300">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <span key={j}>
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded font-mono shadow-sm">
                          {key}
                        </kbd>
                        {j < shortcut.keys.length - 1 && <span className="text-slate-400 mx-1">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </>
  )
}
