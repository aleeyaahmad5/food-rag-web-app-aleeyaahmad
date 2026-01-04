"use client"

import { useEffect, useState } from "react"
import { 
  BarChart3, 
  Database, 
  Brain, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Activity,
  Search,
  Clock,
  ArrowLeft,
  Download,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  MessageSquare,
  PieChart
} from "lucide-react"
import Link from "next/link"
import { getAnalyticsSummary, exportAnalytics, clearAnalytics, type AnalyticsSummary } from "@/lib/analytics"

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadAnalytics = () => {
    setIsLoading(true)
    const summary = getAnalyticsSummary()
    setAnalytics(summary)
    setLastRefresh(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const handleExport = () => {
    const data = exportAnalytics()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `food-rag-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all analytics data? This cannot be undone.")) {
      clearAnalytics()
      loadAnalytics()
    }
  }

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Loading Analytics...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to App
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={loadAnalytics}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Queries */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">All Time</span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalQueries}</p>
            <p className="text-sm text-blue-300/70">Total Queries</p>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8 text-emerald-400" />
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                analytics.successRate >= 90 
                  ? "bg-emerald-500/30 text-emerald-300" 
                  : analytics.successRate >= 70 
                  ? "bg-yellow-500/30 text-yellow-300"
                  : "bg-red-500/30 text-red-300"
              }`}>
                {analytics.successRate >= 90 ? "Excellent" : analytics.successRate >= 70 ? "Good" : "Needs Attention"}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.successRate}%</p>
            <p className="text-sm text-emerald-300/70">Success Rate</p>
          </div>

          {/* Avg Response Time */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Timer className="w-8 h-8 text-purple-400" />
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                analytics.averageResponseTime < 1000 
                  ? "bg-emerald-500/30 text-emerald-300" 
                  : analytics.averageResponseTime < 2000 
                  ? "bg-yellow-500/30 text-yellow-300"
                  : "bg-red-500/30 text-red-300"
              }`}>
                {analytics.averageResponseTime < 1000 ? "Fast" : analytics.averageResponseTime < 2000 ? "Normal" : "Slow"}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.averageResponseTime}ms</p>
            <p className="text-sm text-purple-300/70">Avg Response Time</p>
          </div>

          {/* Sources Retrieved */}
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Database className="w-8 h-8 text-orange-400" />
              <span className="text-xs bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full">
                {analytics.averageSourcesPerQuery} avg/query
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalSourcesRetrieved}</p>
            <p className="text-sm text-orange-300/70">Total Sources Retrieved</p>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Success/Failure Breakdown */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Query Status Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">Successful</span>
                </div>
                <span className="text-white font-bold">{analytics.successfulQueries}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all" 
                  style={{ width: `${analytics.successRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-slate-300">Failed</span>
                </div>
                <span className="text-white font-bold">{analytics.failedQueries}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all" 
                  style={{ width: `${100 - analytics.successRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance Breakdown
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Vector Search
                  </span>
                  <span className="text-sm font-bold text-white">{analytics.averageVectorSearchTime}ms</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((analytics.averageVectorSearchTime / analytics.averageResponseTime) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    LLM Processing
                  </span>
                  <span className="text-sm font-bold text-white">{analytics.averageLlmProcessingTime}ms</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((analytics.averageLlmProcessingTime / analytics.averageResponseTime) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-emerald-400" />
                    Total Response
                  </span>
                  <span className="text-sm font-bold text-white">{analytics.averageResponseTime}ms</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Model Usage */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Model Usage
            </h3>
            {analytics.modelUsage.length > 0 ? (
              <div className="space-y-3">
                {analytics.modelUsage.map((model, i) => (
                  <div key={model.model} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        i === 0 ? "bg-blue-400" : i === 1 ? "bg-purple-400" : "bg-slate-400"
                      }`} />
                      <span className="text-sm text-slate-300 truncate max-w-[140px]">{model.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{model.count}</span>
                      <span className="text-xs text-slate-500">
                        ({Math.round((model.count / analytics.totalQueries) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No model usage data yet</p>
            )}
          </div>
        </div>

        {/* Queries Over Time Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Queries Over Last 7 Days
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {analytics.queriesOverTime.map((day, i) => {
              const maxCount = Math.max(...analytics.queriesOverTime.map(d => d.count), 1)
              const height = (day.count / maxCount) * 100
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex justify-center">
                    <span className="text-xs text-slate-400">{day.count}</span>
                  </div>
                  <div 
                    className={`w-full rounded-t-lg transition-all ${
                      day.count > 0 
                        ? "bg-gradient-to-t from-blue-600 to-blue-400" 
                        : "bg-slate-700"
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-slate-500">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Queries */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Popular Queries
            </h3>
            {analytics.popularQueries.length > 0 ? (
              <div className="space-y-3">
                {analytics.popularQueries.map((query, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-yellow-500 text-yellow-900" :
                        i === 1 ? "bg-slate-400 text-slate-800" :
                        i === 2 ? "bg-amber-700 text-amber-100" :
                        "bg-slate-600 text-slate-300"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-300 truncate">{query.query}</span>
                    </div>
                    <span className="text-sm font-bold text-white ml-2">{query.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">No queries recorded yet. Start asking questions!</p>
            )}
          </div>

          {/* Recent Queries */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Queries
            </h3>
            {analytics.recentQueries.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analytics.recentQueries.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-3 rounded-lg border transition-colors ${
                      log.success 
                        ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10" 
                        : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">{log.query}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          {log.responseTime && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {log.responseTime}ms
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {log.sourceCount} sources
                          </span>
                        </div>
                      </div>
                      {log.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-red-400 mt-2 truncate">{log.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">No queries recorded yet. Start asking questions!</p>
            )}
          </div>
        </div>

        {/* Vector DB Health Section */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Health & Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-slate-300">Vector Database</span>
              </div>
              <p className="text-xs text-slate-500">Upstash Vector</p>
              <p className="text-lg font-bold text-white mt-1">Connected ✓</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">LLM Provider</span>
              </div>
              <p className="text-xs text-slate-500">Groq API</p>
              <p className="text-lg font-bold text-white mt-1">llama-3.1-8b-instant</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium text-slate-300">Deployment</span>
              </div>
              <p className="text-xs text-slate-500">Vercel Edge</p>
              <p className="text-lg font-bold text-white mt-1">Production ✓</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          Food RAG Admin Dashboard • Analytics stored locally in browser
        </div>
      </footer>
    </div>
  )
}
