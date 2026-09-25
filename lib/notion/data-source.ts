/** Mocks só quando não há token. Com token, falha do Notion deve propagar (nunca mock silencioso). */
export function shouldUseNotionMocks(): boolean {
  const token = process.env.NOTION_TOKEN?.trim()
  return !token
}

export function chaveCacheNotionDados(): string[] {
  return shouldUseNotionMocks()
    ? ['notion-raw-pages', 'mock']
    : ['notion-raw-pages', 'live-memory']
}
