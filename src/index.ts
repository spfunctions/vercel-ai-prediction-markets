import { tool } from 'ai'
import { z } from 'zod'

const BASE = 'https://simplefunctions.dev'
async function sf(path: string, params?: Record<string, string>) {
  const url = new URL(path, BASE)
  if (params) for (const [k,v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const getWorldState = tool({
  description: 'Get real-time prediction market world state from 30,000+ markets. Returns uncertainty index, regime summary, actionable edges, movers, contagion signals, and divergences.',
  parameters: z.object({ format: z.enum(['json', 'markdown']).optional().describe('Output format') }),
  execute: async ({ format }) => sf('/api/agent/world', { format: format || 'json' }),
})

export const getUncertaintyIndex = tool({
  description: 'Get the prediction market uncertainty index: uncertainty (0-100), geopolitical risk (0-100), momentum (-1 to +1), activity (0-100).',
  parameters: z.object({}),
  execute: async () => sf('/api/public/index'),
})

export const getMarketEdges = tool({
  description: 'Get actionable edges — markets where thesis-implied price diverges from market price. Includes reasoning, causal path, age, and absorption.',
  parameters: z.object({}),
  execute: async () => sf('/api/edges'),
})

export const getMarketDetail = tool({
  description: 'Get detailed data for a specific prediction market by ticker.',
  parameters: z.object({ ticker: z.string().describe('Market ticker or ID'), depth: z.boolean().optional().describe('Include orderbook') }),
  execute: async ({ ticker, depth }) => sf(`/api/public/market/${encodeURIComponent(ticker)}`, depth ? { depth: 'true' } : {}),
})

export const getWorldChanges = tool({
  description: 'Get incremental world state changes since a given time (~30-50 tokens vs 800 for full state).',
  parameters: z.object({ since: z.string().optional().describe('1h, 6h, 24h, or ISO') }),
  execute: async ({ since }) => sf('/api/agent/world/delta', { format: 'json', ...(since ? { since } : {}) }),
})

export function predictionMarketTools() {
  return { getWorldState, getUncertaintyIndex, getMarketEdges, getMarketDetail, getWorldChanges }
}
