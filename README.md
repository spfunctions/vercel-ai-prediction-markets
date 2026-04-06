# vercel-ai-prediction-markets

Vercel AI SDK tools for prediction market data. Drop-in tools for `generateText`, `streamText`, and `useChat`.

[![npm](https://img.shields.io/npm/v/vercel-ai-prediction-markets)](https://www.npmjs.com/package/vercel-ai-prediction-markets)

## Install
```bash
npm install vercel-ai-prediction-markets ai
```

## With generateText
```ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { predictionMarketTools } from 'vercel-ai-prediction-markets'

const { text } = await generateText({
  model: openai('gpt-4o'),
  tools: predictionMarketTools(),
  prompt: 'What are the key geopolitical risks right now?',
})
```

## With streamText (Next.js route)
```ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { predictionMarketTools } from 'vercel-ai-prediction-markets'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({
    model: openai('gpt-4o'),
    tools: predictionMarketTools(),
    messages,
  })
  return result.toDataStreamResponse()
}
```

## Tools
| Tool | Description |
|------|-------------|
| `getWorldState` | Full prediction market world state |
| `getUncertaintyIndex` | Four-signal uncertainty index |
| `getMarketEdges` | Actionable mispricings |
| `getMarketDetail` | Single market with orderbook |
| `getWorldChanges` | Incremental changes |

## License
MIT — [SimpleFunctions](https://simplefunctions.dev)
