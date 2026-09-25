import { unstable_cache } from 'next/cache'
import { fetchRawAllPages } from './client'
import { shouldUseNotionMocks } from './data-source'
import {
  normalizeDemanda,
  normalizeMovimentacao,
  normalizeSolicitacao,
} from './normalize'
import type { NotionDataSources, NotionRawBundle } from './types'

/** Payload bruto do Notion passa de 2MB — unstable_cache do Next não aceita. */
const LIVE_TTL_MS = 600_000
let liveMemoryCache: { fetchedAt: number; raw: NotionRawBundle } | null = null

function normalizeBundle(raw: NotionRawBundle): NotionDataSources {
  return {
    demandas: raw.demandasPages.map(normalizeDemanda),
    solicitacoes: raw.solicitacoesPages.map(normalizeSolicitacao),
    movimentacoes: raw.movimentacoesPages
      .map(normalizeMovimentacao)
      .filter((m) => m.demandaId !== null),
    avisosNotion: raw.avisos ?? [],
  }
}

async function fetchRawLiveComCacheMemoria(): Promise<NotionRawBundle> {
  const now = Date.now()
  if (
    liveMemoryCache &&
    now - liveMemoryCache.fetchedAt < LIVE_TTL_MS &&
    !liveMemoryCache.raw.avisos?.length
  ) {
    return liveMemoryCache.raw
  }

  const raw = await fetchRawAllPages()
  if (!raw.avisos?.length) {
    liveMemoryCache = { fetchedAt: now, raw }
  } else {
    liveMemoryCache = null
  }
  return raw
}

const fetchRawCachedMock = unstable_cache(
  async (): Promise<NotionRawBundle> => {
    if (!shouldUseNotionMocks()) {
      throw new Error('Cache mock invocado com NOTION_TOKEN definido.')
    }
    return fetchRawAllPages()
  },
  ['notion-raw-pages', 'mock'],
  {
    revalidate: 600,
    tags: ['notion'],
  }
)

async function fetchRawParaAmbiente(): Promise<NotionRawBundle> {
  if (shouldUseNotionMocks()) {
    return fetchRawCachedMock()
  }
  return fetchRawLiveComCacheMemoria()
}

/** Normaliza após ler do cache de páginas cruas. */
export async function fetchAllDataSources(): Promise<NotionDataSources> {
  const raw = await fetchRawParaAmbiente()
  return normalizeBundle(raw)
}

/** Útil fora do Next (scripts de verificação) — sem cache. */
export async function fetchAllDataSourcesUncached(): Promise<NotionDataSources> {
  const raw = await fetchRawAllPages()
  return normalizeBundle(raw)
}

/** Apenas testes — limpa cache em memória entre casos. */
export function limparCacheNotionLiveMemoria(): void {
  liveMemoryCache = null
}
