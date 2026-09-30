import { unstable_cache } from 'next/cache'
import {
  fetchRawAllPages,
  fetchRawDemandasPages,
  fetchRawMovimentacoesPages,
  fetchRawSolicitacoesPages,
} from './client'
import { shouldUseNotionMocks } from './data-source'
import { NotionDataSourceError, extrairMensagemNotionApi } from './errors'
import { deduplicarExclusoesDemanda } from '@/lib/relatorio/exclusoes-demanda'
import { partitionMovimentacoesPages } from './movimentacoes-parse'
import { normalizeDemanda, normalizeSolicitacao } from './normalize'
import type { NotionDataSources, NotionRawBundle } from './types'

/**
 * O JSON cru de Solicitações passa de 2MB. O unstable_cache do Next recusa isso,
 * a function busca de novo e estoura o limite de 10s da Netlify — as três bases
 * caem com "fetch failed" e o erro ficava cacheado. Guardamos o dado já normalizado.
 */
export const TAG_CACHE_NOTION = 'notion'
export const REVALIDATE_NOTION_SEGUNDOS = 60
const LIVE_TTL_MS = REVALIDATE_NOTION_SEGUNDOS * 1000
/** Se a atualização falhar, a última leitura boa desta instância ainda serve. */
const STALE_TTL_MS = 15 * 60 * 1000

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
  const { movimentacoes, exclusoesDemanda, contagensEntregas, observacoesPessoa } =
    partitionMovimentacoesPages(raw.movimentacoesPages)

  return {
    demandas: raw.demandasPages.map(normalizeDemanda),
    solicitacoes: raw.solicitacoesPages.map(normalizeSolicitacao),
    movimentacoes,
    exclusoesDemanda: deduplicarExclusoesDemanda(exclusoesDemanda),
    contagensEntregas,
    observacoesPessoa,
    avisosNotion: raw.avisos ?? [],
  }
}

function erroLimiteDataCacheNext(error: unknown): boolean {
  return (
    error instanceof Error && /items over 2MB can not be cached/i.test(error.message)
  )
}

function avisoFonte(rotulo: string, error: unknown): string {
  const detalhe =
    extrairMensagemNotionApi(error) ||
    (error instanceof Error ? error.message.trim() : '')
  if (!detalhe) return `${rotulo}: falha ao consultar o Notion.`
  if (detalhe.startsWith(rotulo)) return detalhe
  return `${rotulo}: ${detalhe}`
}

/**
 * Falha do Notion propaga (o unstable_cache não grava throw).
 * Acima de 2MB, uma busca direta — sem segunda tentativa quando a API já falhou.
 */
async function lerFonteCacheada<T>(
  rotulo: string,
  cachedFn: () => Promise<T>,
  buscarDireto: () => Promise<T>
): Promise<{ data: T | null; aviso: string | null }> {
  try {
    return { data: await cachedFn(), aviso: null }
  } catch (error) {
    if (!erroLimiteDataCacheNext(error)) {
      return { data: null, aviso: avisoFonte(rotulo, error) }
    }
    console.warn(
      `[notion] ${rotulo}: resposta > 2MB — data cache do Next ignorado; usando busca direta.`
    )
    try {
      return { data: await buscarDireto(), aviso: null }
    } catch (errorDireto) {
      return { data: null, aviso: avisoFonte(rotulo, errorDireto) }
    }
  }
}

const cachedLiveDemandas = unstable_cache(
  async () => (await fetchRawDemandasPages()).map(normalizeDemanda),
  ['notion-live', 'demandas-norm-v2'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

const cachedLiveSolicitacoes = unstable_cache(
  async () => (await fetchRawSolicitacoesPages()).map(normalizeSolicitacao),
  ['notion-live', 'solicitacoes-norm-v2'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

const cachedLiveMovimentacoes = unstable_cache(
  async () => partitionMovimentacoesPages(await fetchRawMovimentacoesPages()),
  ['notion-live', 'movimentacoes-norm-v2'],
  { revalidate: REVALIDATE_NOTION_SEGUNDOS, tags: [TAG_CACHE_NOTION] }
)

function erroTotalNotion(avisos: string[]): NotionDataSourceError {
  return new NotionDataSourceError(
    `Nenhuma das três bases respondeu no Notion. Confira NOTION_TOKEN e o compartilhamento com a integração.\n\n${avisos.join('\n\n')}`
  )
}

async function fetchNormalizadoViaDataCache(): Promise<NotionDataSources> {
  const [dem, sol, mov] = await Promise.all([
    lerFonteCacheada('Esteira (demandas)', cachedLiveDemandas, async () =>
      (await fetchRawDemandasPages()).map(normalizeDemanda)
    ),
    lerFonteCacheada('Solicitações', cachedLiveSolicitacoes, async () =>
      (await fetchRawSolicitacoesPages()).map(normalizeSolicitacao)
    ),
    lerFonteCacheada('Movimentações', cachedLiveMovimentacoes, () =>
      fetchRawMovimentacoesPages().then(partitionMovimentacoesPages)
    ),
  ])

  const avisos = [dem.aviso, sol.aviso, mov.aviso].filter((a): a is string => Boolean(a))
  if (avisos.length === 3) throw erroTotalNotion(avisos)

  const part = mov.data ?? {
    movimentacoes: [],
    exclusoesDemanda: [],
    contagensEntregas: [],
    observacoesPessoa: [],
  }

  return {
    demandas: dem.data ?? [],
    solicitacoes: sol.data ?? [],
    movimentacoes: part.movimentacoes,
    exclusoesDemanda: deduplicarExclusoesDemanda(part.exclusoesDemanda),
    contagensEntregas: part.contagensEntregas,
    observacoesPessoa: part.observacoesPessoa,
    avisosNotion: avisos,
  }
}

function leituraStaleAindaServe(now: number): NotionDataSources | null {
  if (!liveMemoryCache) return null
  if (now - liveMemoryCache.fetchedAt > STALE_TTL_MS) return null
  if (liveMemoryCache.normalized.avisosNotion.length > 0) return null
  return liveMemoryCache.normalized
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

function comAvisoStale(base: NotionDataSources, detalhe: string): NotionDataSources {
  return {
    ...base,
    avisosNotion: [
      'Não foi possível atualizar o Notion agora. Os números são da última leitura bem-sucedida.',
      detalhe,
    ],
  }
}

/** Normaliza antes de cachear. Falha total usa a última leitura boa desta instância. */
export async function fetchAllDataSources(): Promise<NotionDataSources> {
  if (shouldUseNotionMocks()) {
    return normalizeBundle(await fetchRawCachedMock())
  }

  const now = Date.now()
  const geracao = await geracaoCacheNotion()
  if (
    liveMemoryCache &&
    liveMemoryCache.geracao === geracao &&
    now - liveMemoryCache.fetchedAt < LIVE_TTL_MS &&
    liveMemoryCache.normalized.avisosNotion.length === 0
  ) {
    return liveMemoryCache.normalized
  }

  try {
    const normalized = await fetchNormalizadoViaDataCache()
    if (normalized.avisosNotion.length === 0) {
      liveMemoryCache = { fetchedAt: now, geracao, normalized }
    }
    return normalized
  } catch (error) {
    const stale = leituraStaleAindaServe(now)
    if (!stale) throw error
    const detalhe = error instanceof Error ? error.message : 'falha ao consultar o Notion'
    return comAvisoStale(stale, detalhe)
  }
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
