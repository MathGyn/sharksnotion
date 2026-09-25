import { afterEach, describe, expect, it } from 'vitest'
import { shouldUseNotionMocks, chaveCacheNotionDados } from '@/lib/notion/data-source'

describe('fonte de dados Notion', () => {
  const tokenAnterior = process.env.NOTION_TOKEN

  afterEach(() => {
    if (tokenAnterior === undefined) {
      delete process.env.NOTION_TOKEN
    } else {
      process.env.NOTION_TOKEN = tokenAnterior
    }
  })

  it('usa mocks só sem token', () => {
    delete process.env.NOTION_TOKEN
    expect(shouldUseNotionMocks()).toBe(true)
    expect(chaveCacheNotionDados()).toEqual(['notion-raw-pages', 'mock'])

    process.env.NOTION_TOKEN = 'secret_test'
    expect(shouldUseNotionMocks()).toBe(false)
    expect(chaveCacheNotionDados()).toEqual(['notion-raw-pages', 'live-memory'])
  })
})
