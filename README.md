# vercel-ai-prediction-markets

[![npm](https://img.shields.io/npm/v/vercel-ai-prediction-markets)](https://www.npmjs.com/package/vercel-ai-prediction-markets)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Vercel AI SDK tools for **real-time prediction market data**. Drop-in tools that give any
`generateText`, `streamText`, or `useChat` agent world-awareness from the active Kalshi
and Polymarket contracts — no auth required.

```ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { predictionMarketTools } from 'vercel-ai-prediction-markets'

const { text } = await generateText({
  model: openai('gpt-4o'),
  tools: predictionMarketTools(),
  prompt: "What's the market saying about geopolitical risk right now?",
})
```

---

## Install

```bash
npm install vercel-ai-prediction-markets ai
```

Peer dep: `ai >= 3.0.0`. Works with all model providers (`@ai-sdk/openai`,
`@ai-sdk/anthropic`, `@ai-sdk/google`, etc.).

## Tools

All six tools hit the public SimpleFunctions API. **No API key, no rate limit, no
auth.** Every endpoint below is verified live.

| Tool | Endpoint | When to use |
|------|----------|-------------|
| `getContext` | `/api/public/context` | **Start here.** Single bundle: edges, movers, highlights, traditional-market context. |
| `getWorldState` | `/api/agent/world` | ~800-token compressed snapshot of all markets, ideal for system-prompt injection. |
| `getWorldChanges` | `/api/agent/world/delta` | ~30-50 token incremental delta — cheap polling loops. |
| `getMarketEdges` | `/api/edges` | Raw mispricings (thesis price vs market price) with reasoning. |
| `getUncertaintyIndex` | `/api/public/index` | Single numeric pulse: uncertainty, geopolitical risk, momentum, activity. |
| `getIdeas` | `/api/public/ideas` | LLM-generated trade ideas with conviction, catalyst, time horizon. |

## Quick start: `streamText` in a Next.js route

```ts
// app/api/chat/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { predictionMarketTools } from 'vercel-ai-prediction-markets'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({
    model: openai('gpt-4o'),
    tools: predictionMarketTools(),
    system:
      'You are a market intelligence assistant. Use the tools to ground every claim in real-time prediction-market data. Cite tickers explicitly.',
    messages,
  })
  return result.toDataStreamResponse()
}
```

## Quick start: `generateText` (one-shot)

```ts
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { predictionMarketTools } from 'vercel-ai-prediction-markets'

const { text, toolResults } = await generateText({
  model: anthropic('claude-sonnet-4-5'),
  tools: predictionMarketTools(),
  maxSteps: 5,
  prompt: 'Find the highest-conviction trade idea right now and explain the catalyst.',
})

console.log(text)
console.log('Tools called:', toolResults.map((r) => r.toolName))
```

## Use individual tools

```ts
import { getContext, getMarketEdges } from 'vercel-ai-prediction-markets'

// Use just two tools instead of the full bundle
const { text } = await generateText({
  model: openai('gpt-4o'),
  tools: { getContext, getMarketEdges },
  prompt: 'What edges are open right now?',
})
```

## Response shapes

### `getContext` → object
```ts
{
  edges: Edge[]            // top mispricings
  movers: Mover[]          // 24h price movers
  highlights: Highlight[]  // recent narrative-shaping events
  traditionalMarkets: { [topic: string]: TraditionalMarket[] }
}
```

### `getUncertaintyIndex` → object
```ts
{
  uncertainty: number    // 0-100
  geopolitical: number   // 0-100
  momentum: number       // -1 to +1
  activity: number       // 0-100
  components: { medianSpread: number; avgSpread: number; ... }
  timestamp: string      // ISO
}
```

### `getMarketEdges` → object
```ts
{
  edges: {
    ticker: string
    venue: 'kalshi' | 'polymarket'
    title: string
    marketPrice: number      // cents
    thesisPrice: number      // cents
    executableEdge: number   // cents (after spread)
    confidence: number       // 0-1
    liquidityScore: 'high' | 'medium' | 'low'
    direction: 'yes' | 'no'
    reasoning: string
    edgeAgeHours: number | null
    marketAbsorption: number | null
  }[]
}
```

### `getIdeas` → object
```ts
{
  generatedAt: string
  cached: boolean
  ideas: {
    headline: string
    pitch: string
    conviction: 'high' | 'medium' | 'low'
    direction: 'buy_yes' | 'buy_no'
    markets: { url: string; ticker: string; currentPrice: number; venue: string }[]
    catalyst: string
    timeHorizon: string
    risk: string
    edgeSize: number
  }[]
}
```

### `getWorldState` / `getWorldChanges` → string (markdown)
Compact human/LLM-readable text. Pass `format: 'json'` to `getWorldState` for the
structured version.

## Errors

All tools throw `Error("SimpleFunctions API error <status> for <path>")` on non-2xx
responses. Wrap in try/catch if your agent should degrade gracefully:

```ts
import { tool } from 'ai'
import { z } from 'zod'
import { getContext } from 'vercel-ai-prediction-markets'

const safeContext = tool({
  description: 'Get prediction-market context, gracefully degrading if the API is down.',
  parameters: z.object({}),
  execute: async () => {
    try {
      return await (getContext as any).execute({}, { messages: [] })
    } catch (e) {
      return { error: String(e), edges: [], movers: [] }
    }
  },
})
```

## Sister packages

If you're not on the Vercel AI SDK, use the wrapper for your stack:

| Stack | Package |
|-------|---------|
| LangChain / LangGraph | [`langchain-prediction-markets`](https://github.com/spfunctions/langchain-prediction-markets) |
| OpenAI Agents SDK / function calling | [`openai-agents-prediction-markets`](https://github.com/spfunctions/openai-agents-prediction-markets) |
| CrewAI (Python) | [`crewai-prediction-markets`](https://github.com/spfunctions/crewai-prediction-markets) |
| MCP / Claude / Cursor | [`simplefunctions-cli`](https://github.com/spfunctions/simplefunctions-cli) |
| Bare Python SDK | [`simplefunctions-python`](https://github.com/spfunctions/simplefunctions-python) |

## Testing

```bash
npm test
```

12 tests, all `fetch`-mocked — no network required.

## License

MIT — built by [SimpleFunctions](https://simplefunctions.dev).
