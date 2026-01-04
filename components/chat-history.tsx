"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react"

export interface ChatSession {
  id: string
  title: string
  messages: any[]
  createdAt: Date
  updatedAt: Date
}

interface ChatHistoryProps {
  currentChatId?: string | null
  onSelectChat: (chat: ChatSession) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  chats: ChatSession[]
  collapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
}

export function ChatHistory({ 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  chats, 
  collapsed = false, 
  setCollapsed 
}: ChatHistoryProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768 && setCollapsed) {
        setCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [setCollapsed])

  const formatDate = (date: Date) => {
    const now = new Date()
    const chatDate = new Date(date)
    const diffDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return chatDate.toLocaleDateString()
  }

  const truncateTitle = (title: string, maxLength: number = 25) => {
    if (title.length <= maxLength) return title
    return title.slice(0, maxLength) + "..."
  }

  if (isMobile) return null

  return (
    <div 
      className={`hidden lg:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed?.(!collapsed)}
        className="absolute -right-3 top-20 z-10 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        {collapsed ? (
          <Button
            onClick={onNewChat}
            size="icon"
            className="w-8 h-8 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Chat History</h2>
            <Button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          !collapsed && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation!</p>
            </div>
          )
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  currentChatId === chat.id
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
                onClick={() => onSelectChat(chat)}
              >
                {collapsed ? (
                  <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto" />
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {truncateTitle(chat.title)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(chat.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteChat(chat.id)
                      }}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
