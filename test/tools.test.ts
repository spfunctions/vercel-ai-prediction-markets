import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  predictionMarketTools,
  getContext,
  getWorldState,
  getWorldChanges,
  getMarketEdges,
  getUncertaintyIndex,
  getIdeas,
  sfFetch,
} from '../src/index.js'

// ── Helpers ───────────────────────────────────────────────

function mockFetchOnce(body: unknown, opts: { contentType?: string; status?: number } = {}) {
  const isString = typeof body === 'string'
  const ct = opts.contentType ?? (isString ? 'text/markdown' : 'application/json')
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(isString ? body : JSON.stringify(body), {
      status: opts.status ?? 200,
      headers: { 'content-type': ct },
    }),
  )
}

function lastCalledUrl(spy: ReturnType<typeof vi.spyOn>): string {
  const call = spy.mock.calls[0]
  return typeof call[0] === 'string' ? call[0] : (call[0] as URL).toString()
}

afterEach(() => vi.restoreAllMocks())

// ── Bundle shape ──────────────────────────────────────────

describe('predictionMarketTools()', () => {
  it('exports six tools', () => {
    const tools = predictionMarketTools()
    expect(Object.keys(tools).sort()).toEqual(
      [
        'getContext',
        'getIdeas',
        'getMarketEdges',
        'getUncertaintyIndex',
        'getWorldChanges',
        'getWorldState',
      ].sort(),
    )
  })

  it('every tool has a description and a parameters schema', () => {
    for (const t of Object.values(predictionMarketTools())) {
      expect(t.description).toBeTruthy()
      expect(t.parameters).toBeDefined()
    }
  })
})

// ── Per-tool URL + behavior ──────────────────────────────

describe('getContext', () => {
  it('hits /api/public/context', async () => {
    const spy = mockFetchOnce({ edges: [], movers: [] })
    const out = await (getContext as any).execute({}, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/public/context')
    expect(out).toEqual({ edges: [], movers: [] })
  })
})

describe('getWorldState', () => {
  it('defaults to format=markdown', async () => {
    const spy = mockFetchOnce('# World State', { contentType: 'text/markdown' })
    await (getWorldState as any).execute({}, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/agent/world?format=markdown')
  })

  it('passes format=json when requested', async () => {
    const spy = mockFetchOnce({ regime: 'neutral' })
    const out = await (getWorldState as any).execute({ format: 'json' }, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/agent/world?format=json')
    expect(out).toEqual({ regime: 'neutral' })
  })
})

describe('getWorldChanges', () => {
  it('defaults to no since param', async () => {
    const spy = mockFetchOnce('# Delta', { contentType: 'text/markdown' })
    await (getWorldChanges as any).execute({}, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/agent/world/delta?format=markdown')
  })

  it('passes since when set', async () => {
    const spy = mockFetchOnce('# Delta', { contentType: 'text/markdown' })
    await (getWorldChanges as any).execute({ since: '6h' }, { messages: [] })
    expect(lastCalledUrl(spy)).toBe(
      'https://simplefunctions.dev/api/agent/world/delta?format=markdown&since=6h',
    )
  })
})

describe('getMarketEdges', () => {
  it('hits /api/edges', async () => {
    const spy = mockFetchOnce({ edges: [{ ticker: 'KX', executableEdge: 12 }] })
    const out = await (getMarketEdges as any).execute({}, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/edges')
    expect((out as any).edges).toHaveLength(1)
  })
})

describe('getUncertaintyIndex', () => {
  it('hits /api/public/index and returns the index shape', async () => {
    const spy = mockFetchOnce({ uncertainty: 22, geopolitical: 0, momentum: -0.08, activity: 99 })
    const out = await (getUncertaintyIndex as any).execute({}, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/public/index')
    expect(out).toMatchObject({ uncertainty: 22, activity: 99 })
  })
})

describe('getIdeas', () => {
  it('hits /api/public/ideas', async () => {
    const spy = mockFetchOnce({ ideas: [{ id: 'a', headline: 'h', conviction: 'high' }] })
    const out = await (getIdeas as any).execute({}, { messages: [] })
    expect(lastCalledUrl(spy)).toBe('https://simplefunctions.dev/api/public/ideas')
    expect((out as any).ideas[0].conviction).toBe('high')
  })
})

// ── Error handling ────────────────────────────────────────

describe('sfFetch error handling', () => {
  it('throws on non-2xx with status code in message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('not found', { status: 404, headers: { 'content-type': 'text/html' } }),
    )
    await expect(sfFetch('/api/missing')).rejects.toThrow(/404/)
  })

  it('returns text for non-json content type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('# hello', { status: 200, headers: { 'content-type': 'text/markdown' } }),
    )
    const out = await sfFetch('/foo')
    expect(out).toBe('# hello')
  })
})
