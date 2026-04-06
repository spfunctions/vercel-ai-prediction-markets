import { describe, it, expect } from 'vitest'
import { predictionMarketTools, getWorldState } from '../src/index.js'
describe('vercel-ai tools', () => {
  it('exports 5 tools', () => {
    const tools = predictionMarketTools()
    expect(Object.keys(tools)).toHaveLength(5)
  })
})
