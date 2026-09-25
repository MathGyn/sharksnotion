import { Client } from '@notionhq/client'
import { readFile } from 'fs/promises'
import path from 'path'
import { shouldUseNotionMocks } from './data-source'
import { NotionDataSourceError, extrairMensagemNotionApi } from './errors'
import type { NotionListResponse, NotionPage, NotionRawBundle } from './types'

const DATA_SOURCE_IDS = {
  esteira: '1af2f1ec-ec89-8168-a97e-000b54ea5304',
  solicitacoes: 'ac6dbaf1-6cc6-4e1b-a3ab-4c3d587d8940',
  movimentacoes: '0b2bfe8c-0dad-4345-897f-74c9657d9594',
} as const

const ROTULOS_FONTES = {
  esteira: 'Esteira (demandas)',
  solicitacoes: 'Solicitações',
  movimentacoes: 'Movimentações',
} as const

async function readMock(filename: string): Promise<NotionListResponse> {
  const mockPath = path.join(process.cwd(), 'mocks', filename)
  const content = await readFile(mockPath, 'utf-8')
  return JSON.parse(content) as NotionListResponse
}

async function fetchAllFromNotion(client: Client, dataSourceId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = []
  let cursor: string | undefined

  do {
    if (cursor) {
      await new Promise((resolve) => setTimeout(resolve, 350))
    }

    try {
      const response = (await client.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        start_cursor: cursor,
      })) as { results: NotionPage[]; next_cursor: string | null }

      pages.push(...response.results)
      cursor = response.next_cursor || undefined
    } catch (error: unknown) {
      const err = error as { status?: number; headers?: Record<string, string> }
      if (err.status === 429) {
        const retryAfter = parseInt(err.headers?.['retry-after'] || '1', 10)
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
        continue
      }
      throw error
    }
  } while (cursor)

  return pages
}

function notionClient(): Client {
  const token = process.env.NOTION_TOKEN?.trim()
  if (!token) {
    throw new NotionDataSourceError(
      'NOTION_TOKEN não está definido, mas a aplicação tentou buscar dados reais.'
    )
  }
  return new Client({ auth: token })
}

type ResultadoFonte = { pages: NotionPage[]; aviso: string | null }

async function buscarFonteNotion(
  rotulo: string,
  dataSourceId: string,
  mockFilename: string
): Promise<ResultadoFonte> {
  if (shouldUseNotionMocks()) {
    const mockData = await readMock(mockFilename)
    return { pages: mockData.results, aviso: null }
  }

  try {
    const pages = await fetchAllFromNotion(notionClient(), dataSourceId)
    return { pages, aviso: null }
  } catch (error) {
    const detalhe = extrairMensagemNotionApi(error)
    return {
      pages: [],
      aviso: detalhe ? `${rotulo}: ${detalhe}` : `${rotulo}: falha ao consultar o Notion.`,
    }
  }
}

export async function fetchRawDemandasPages(): Promise<NotionPage[]> {
  const r = await buscarFonteNotion(
    ROTULOS_FONTES.esteira,
    DATA_SOURCE_IDS.esteira,
    'esteira-demandas.json'
  )
  if (r.aviso) throw new NotionDataSourceError(r.aviso)
  return r.pages
}

export async function fetchRawSolicitacoesPages(): Promise<NotionPage[]> {
  const r = await buscarFonteNotion(
    ROTULOS_FONTES.solicitacoes,
    DATA_SOURCE_IDS.solicitacoes,
    'solicitacoes.json'
  )
  if (r.aviso) throw new NotionDataSourceError(r.aviso)
  return r.pages
}

export async function fetchRawMovimentacoesPages(): Promise<NotionPage[]> {
  const r = await buscarFonteNotion(
    ROTULOS_FONTES.movimentacoes,
    DATA_SOURCE_IDS.movimentacoes,
    'movimentacoes.json'
  )
  if (r.aviso) throw new NotionDataSourceError(r.aviso)
  return r.pages
}

/** Busca as três fontes (sem normalizar). Com token, falha parcial vira aviso — não mock. */
export async function fetchRawAllPages(): Promise<NotionRawBundle> {
  const [dem, sol, mov] = await Promise.all([
    buscarFonteNotion(ROTULOS_FONTES.esteira, DATA_SOURCE_IDS.esteira, 'esteira-demandas.json'),
    buscarFonteNotion(
      ROTULOS_FONTES.solicitacoes,
      DATA_SOURCE_IDS.solicitacoes,
      'solicitacoes.json'
    ),
    buscarFonteNotion(
      ROTULOS_FONTES.movimentacoes,
      DATA_SOURCE_IDS.movimentacoes,
      'movimentacoes.json'
    ),
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
