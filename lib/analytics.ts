/**
 * Analytics System for Food RAG Application
 * Tracks queries, performance, and user behavior
 */

export interface QueryLog {
  id: string
  query: string
  model: string
  timestamp: Date
  success: boolean
  errorMessage?: string
  responseTime?: number
  vectorSearchTime?: number
  llmProcessingTime?: number
  sourceCount: number
  tokensUsed?: number
}

export interface AnalyticsSummary {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  successRate: number
  averageResponseTime: number
  averageVectorSearchTime: number
  averageLlmProcessingTime: number
  popularQueries: { query: string; count: number }[]
  modelUsage: { model: string; count: number }[]
  queriesOverTime: { date: string; count: number }[]
  recentQueries: QueryLog[]
  totalSourcesRetrieved: number
  averageSourcesPerQuery: number
}

const ANALYTICS_KEY = "food-rag-analytics"
const MAX_LOGS = 500 // Keep last 500 queries

/**
 * Get all query logs from localStorage
 */
export function getQueryLogs(): QueryLog[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY)
    if (!stored) return []
    
    const logs = JSON.parse(stored) as QueryLog[]
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }))
  } catch (e) {
    console.error("Failed to load analytics:", e)
    return []
  }
}

/**
 * Save query logs to localStorage
 */
function saveQueryLogs(logs: QueryLog[]): void {
  if (typeof window === "undefined") return
  
  try {
    // Keep only the most recent logs
    const trimmedLogs = logs.slice(-MAX_LOGS)
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmedLogs))
  } catch (e) {
    console.error("Failed to save analytics:", e)
  }
}

/**
 * Log a new query
 */
export function logQuery(data: {
  query: string
  model: string
  success: boolean
  errorMessage?: string
  responseTime?: number
  vectorSearchTime?: number
  llmProcessingTime?: number
  sourceCount: number
  tokensUsed?: number
}): void {
  const logs = getQueryLogs()
  
  const newLog: QueryLog = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...data
  }
  
  logs.push(newLog)
  saveQueryLogs(logs)
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): AnalyticsSummary {
  const logs = getQueryLogs()
  
  if (logs.length === 0) {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      successRate: 0,
      averageResponseTime: 0,
      averageVectorSearchTime: 0,
      averageLlmProcessingTime: 0,
      popularQueries: [],
      modelUsage: [],
      queriesOverTime: [],
      recentQueries: [],
      totalSourcesRetrieved: 0,
      averageSourcesPerQuery: 0
    }
  }
  
  const successfulQueries = logs.filter(l => l.success)
  const failedQueries = logs.filter(l => !l.success)
  
  // Calculate averages from successful queries
  const responseTimes = successfulQueries.map(l => l.responseTime).filter((t): t is number => t !== undefined)
  const vectorTimes = successfulQueries.map(l => l.vectorSearchTime).filter((t): t is number => t !== undefined)
  const llmTimes = successfulQueries.map(l => l.llmProcessingTime).filter((t): t is number => t !== undefined)
  
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
    : 0
  const avgVectorTime = vectorTimes.length > 0 
    ? Math.round(vectorTimes.reduce((a, b) => a + b, 0) / vectorTimes.length) 
    : 0
  const avgLlmTime = llmTimes.length > 0 
    ? Math.round(llmTimes.reduce((a, b) => a + b, 0) / llmTimes.length) 
    : 0
  
  // Popular queries (normalize and count)
  const queryCount = new Map<string, number>()
  logs.forEach(log => {
    const normalized = log.query.toLowerCase().trim()
    queryCount.set(normalized, (queryCount.get(normalized) || 0) + 1)
  })
  const popularQueries = Array.from(queryCount.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Model usage
  const modelCount = new Map<string, number>()
  logs.forEach(log => {
    modelCount.set(log.model, (modelCount.get(log.model) || 0) + 1)
  })
  const modelUsage = Array.from(modelCount.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
  
  // Queries over time (last 7 days)
  const now = new Date()
  const queriesOverTime: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const count = logs.filter(l => {
      const logDate = new Date(l.timestamp).toISOString().split('T')[0]
      return logDate === dateStr
    }).length
    queriesOverTime.push({ date: dateStr, count })
  }
  
  // Total sources
  const totalSources = logs.reduce((acc, l) => acc + l.sourceCount, 0)
  const avgSources = logs.length > 0 ? Math.round((totalSources / logs.length) * 10) / 10 : 0
  
  return {
    totalQueries: logs.length,
    successfulQueries: successfulQueries.length,
    failedQueries: failedQueries.length,
    successRate: logs.length > 0 ? Math.round((successfulQueries.length / logs.length) * 100) : 0,
    averageResponseTime: avgResponseTime,
    averageVectorSearchTime: avgVectorTime,
    averageLlmProcessingTime: avgLlmTime,
    popularQueries,
    modelUsage,
    queriesOverTime,
    recentQueries: [...logs].reverse().slice(0, 20),
    totalSourcesRetrieved: totalSources,
    averageSourcesPerQuery: avgSources
  }
}

/**
 * Clear all analytics data
 */
export function clearAnalytics(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ANALYTICS_KEY)
}

/**
 * Export analytics as JSON
 */
export function exportAnalytics(): string {
  const logs = getQueryLogs()
  const summary = getAnalyticsSummary()
  
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    summary,
    logs
  }, null, 2)
}
