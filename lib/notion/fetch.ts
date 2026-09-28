import { unstable_cache } from 'next/cache'
import { fetchRawAllPages } from './client'
import { shouldUseNotionMocks } from './data-source'
import {
  normalizeDemanda,
  normalizeMovimentacao,
  normalizeSolicitacao,
} from './normalize'
import type { NotionDataSources, NotionRawBundle } from './types'

/** Payload bruto do Notion passa de 2MB — unstable_cache do Next não aceita o bundle. */
export const TAG_CACHE_NOTION = 'notion'
export const REVALIDATE_NOTION_SEGUNDOS = 60
const LIVE_TTL_MS = REVALIDATE_NOTION_SEGUNDOS * 1000

/**
 * Número compartilhado pelo data cache do Next (tag `notion`, 60s).
 * revalidateTag troca o número em todas as instâncias; o bundle em si fica na memória do processo.
 */
const lerGeracaoCacheNotion = unstable_cache(
  async () => Date.now(),
  ['notion-cache-generation'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

let liveMemoryCache: { fetchedAt: number; geracao: number; raw: NotionRawBundle } | null = null

async function geracaoCacheNotion(): Promise<number> {
  try {
    return await lerGeracaoCacheNotion()
  } catch {
    return Math.floor(Date.now() / LIVE_TTL_MS)
  }
}

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
  const geracao = await geracaoCacheNotion()
  if (
    liveMemoryCache &&
    liveMemoryCache.geracao === geracao &&
    now - liveMemoryCache.fetchedAt < LIVE_TTL_MS &&
    !liveMemoryCache.raw.avisos?.length
  ) {
    return liveMemoryCache.raw
  }

  const raw = await fetchRawAllPages()
  if (!raw.avisos?.length) {
    liveMemoryCache = { fetchedAt: now, geracao, raw }
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
    revalidate: REVALIDATE_NOTION_SEGUNDOS,
    tags: [TAG_CACHE_NOTION],
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

/** Limpa o bundle em memória deste processo. A tag `notion` cobre as outras instâncias. */
export function limparCacheNotionLiveMemoria(): void {
  liveMemoryCache = null
}
