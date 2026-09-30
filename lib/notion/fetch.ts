import { unstable_cache } from 'next/cache'
import {
  fetchRawAllPages,
  fetchRawDemandasPages,
  fetchRawMovimentacoesPages,
  fetchRawSolicitacoesPages,
} from './client'
import { shouldUseNotionMocks } from './data-source'
import { NotionDataSourceError, extrairMensagemNotionApi } from './errors'
import type { NotionPage } from './types'
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

let liveMemoryCache: {
  fetchedAt: number
  geracao: number
  raw: NotionRawBundle
  normalized: NotionDataSources
} | null = null

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

  const raw = await fetchRawAllPagesViaDataCache()
  if (!raw.avisos?.length) {
    liveMemoryCache = {
      fetchedAt: now,
      geracao,
      raw,
      normalized: normalizeBundle(raw),
    }
  } else {
    liveMemoryCache = null
  }
  return raw
}

type FonteNotionCacheada = { pages: NotionPage[]; aviso: string | null }

async function buscarFonteLiveComFallback(
  rotulo: string,
  buscar: () => Promise<NotionPage[]>
): Promise<FonteNotionCacheada> {
  try {
    return { pages: await buscar(), aviso: null }
  } catch (error) {
    const detalhe = extrairMensagemNotionApi(error)
    return {
      pages: [],
      aviso: detalhe ? `${rotulo}: ${detalhe}` : `${rotulo}: falha ao consultar o Notion.`,
    }
  }
}

/** Cache compartilhado entre instâncias (cada base separada — cabe no limite do Next). */
const cachedLiveDemandas = unstable_cache(
  () => buscarFonteLiveComFallback('Esteira (demandas)', fetchRawDemandasPages),
  ['notion-live', 'demandas'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

const cachedLiveSolicitacoes = unstable_cache(
  () => buscarFonteLiveComFallback('Solicitações', fetchRawSolicitacoesPages),
  ['notion-live', 'solicitacoes'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

const cachedLiveMovimentacoes = unstable_cache(
  () => buscarFonteLiveComFallback('Movimentações', fetchRawMovimentacoesPages),
  ['notion-live', 'movimentacoes'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

async function fetchRawAllPagesViaDataCache(): Promise<NotionRawBundle> {
  const [dem, sol, mov] = await Promise.all([
    cachedLiveDemandas(),
    cachedLiveSolicitacoes(),
    cachedLiveMovimentacoes(),
  ])

  const avisos = [dem.aviso, sol.aviso, mov.aviso].filter((a): a is string => Boolean(a))

  if (!shouldUseNotionMocks() && avisos.length === 3) {
    throw new NotionDataSourceError(
      `Nenhuma das três bases respondeu no Notion. Confira NOTION_TOKEN e o compartilhamento com a integração.\n\n${avisos.join('\n\n')}`
    )
  }

  return {
    demandasPages: dem.pages,
    solicitacoesPages: sol.pages,
    movimentacoesPages: mov.pages,
    avisos,
  }
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

/** Normaliza após ler do cache de páginas cruas (bundle normalizado fica em memória no live). */
export async function fetchAllDataSources(): Promise<NotionDataSources> {
  if (shouldUseNotionMocks()) {
    const raw = await fetchRawParaAmbiente()
    return normalizeBundle(raw)
  }

  const now = Date.now()
  const geracao = await geracaoCacheNotion()
  if (
    liveMemoryCache &&
    liveMemoryCache.geracao === geracao &&
    now - liveMemoryCache.fetchedAt < LIVE_TTL_MS &&
    !liveMemoryCache.raw.avisos?.length
  ) {
    return liveMemoryCache.normalized
  }

  const raw = await fetchRawLiveComCacheMemoria()
  if (
    liveMemoryCache &&
    liveMemoryCache.geracao === geracao &&
    now - liveMemoryCache.fetchedAt < LIVE_TTL_MS
  ) {
    return liveMemoryCache.normalized
  }

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
