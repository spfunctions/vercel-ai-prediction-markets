import { tool } from 'ai'
import { z } from 'zod'

const BASE = 'https://simplefunctions.dev'

/** Internal fetch helper. Exported for advanced use and tests. */
export async function sfFetch(path: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(path, BASE)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`SimpleFunctions API error ${res.status} for ${path}`)
  const ct = res.headers.get('content-type') || ''
  return ct.includes('json') ? res.json() : res.text()
}

// ── Tools ──────────────────────────────────────────────────

export const getContext = tool({
  description:
    "START HERE — single entry point that returns a global prediction-market snapshot bundle: top mispriced edges, 24h price movers, highlights, and traditional-market context. Read-only, no auth. Use this first when the user asks 'what's happening in markets right now' — it's the most token-efficient way to get everything at once. Use the more specific tools (getMarketEdges, getWorldChanges, getUncertaintyIndex) only if the user wants one slice in isolation.",
  parameters: z.object({}),
  execute: async () => sfFetch('/api/public/context'),
})

export const getWorldState = tool({
  description:
    "Get the calibrated world model: ~9,700 prediction markets distilled into ~800 tokens of real-money probabilities across geopolitics, economics, tech, and policy. Read-only, no auth. Use when you need a compact 'what the market believes right now' for system-prompt injection. Use getWorldChanges instead for cheap polling, or getContext for the broader bundle that includes edges and movers.",
  parameters: z.object({
    format: z
      .enum(['markdown', 'json'])
      .optional()
      .describe("Output format. Default: 'markdown' (human/LLM-readable). Use 'json' for programmatic parsing."),
  }),
  execute: async ({ format }) => sfFetch('/api/agent/world', { format: format || 'markdown' }),
})

export const getWorldChanges = tool({
  description:
    "Get the incremental world-model delta since a given time — only the markets whose probability moved. ~30-50 tokens vs ~800 for the full state. Read-only, no auth. Use for cheap polling loops; use getWorldState for an absolute snapshot.",
  parameters: z.object({
    since: z
      .string()
      .optional()
      .describe("Lookback window. Either a relative duration ('30m', '1h', '6h', '24h') or an ISO-8601 timestamp. Default: '1h'."),
  }),
  execute: async ({ since }) =>
    sfFetch('/api/agent/world/delta', { format: 'markdown', ...(since ? { since } : {}) }),
})

export const getMarketEdges = tool({
  description:
    "Get currently actionable mispricings — markets where SimpleFunctions' causal model disagrees with the market price. Returns an array of edges, each with ticker, venue, thesis vs market price, executableEdge in cents, confidence, liquidity, reasoning, age, and absorption. Read-only, no auth. Use after getContext if the user wants the raw edge list without bundled context.",
  parameters: z.object({}),
  execute: async () => sfFetch('/api/edges'),
})

export const getUncertaintyIndex = tool({
  description:
    'Get the four-signal prediction-market uncertainty index: uncertainty (0-100), geopolitical risk (0-100), momentum (-1 to +1), activity (0-100). Derived from real-money orderbook spreads across 30,000+ markets. Read-only, no auth. Use when you need a single numeric pulse; use getContext for the full bundle.',
  parameters: z.object({}),
  execute: async () => sfFetch('/api/public/index'),
})

export const getIdeas = tool({
  description:
    "Get LLM-generated, ready-to-act trade ideas derived from current edges, market changes, and source highlights. Each idea includes headline, pitch, conviction (high/medium/low), direction (buy_yes/buy_no), target market(s) with current price, catalyst, time horizon, and risk. Read-only, no auth. Cached server-side (~12h). Use when the user wants pre-packaged actionable suggestions; use getMarketEdges for raw mispricings without LLM commentary.",
  parameters: z.object({}),
  execute: async () => sfFetch('/api/public/ideas'),
})

// ── Bundle ─────────────────────────────────────────────────

/**
 * Returns all six prediction-market tools as a Vercel AI SDK tool bundle.
 * Pass directly into `generateText`, `streamText`, or `useChat`.
 */
export function predictionMarketTools() {
  return {
    getContext,
    getWorldState,
    getWorldChanges,
    getMarketEdges,
    getUncertaintyIndex,
    getIdeas,
  }
}
