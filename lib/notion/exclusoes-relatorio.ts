import type { ExclusaoDemandaRelatorio } from '@/lib/relatorio/exclusoes-demanda'
import { NOTION_DATA_SOURCE_MOVIMENTACOES, criarClienteNotion } from './client'
import {
  PROP_RELATORIO_PESSOA,
  PROP_TIPO_REGISTRO,
  TIPO_REGISTRO_EXCLUSAO,
} from './movimentacoes-parse'
import { shouldUseNotionMocks } from './data-source'

export async function criarExclusaoRelatorioMovimentacao(
  demandaId: string,
  pessoaNome: string,
  tituloDemanda: string
): Promise<void> {
  if (shouldUseNotionMocks()) {
    throw new Error('Exclusão via Notion indisponível em modo mock.')
  }

  const client = criarClienteNotion()
  const registro = `Exclusão relatório — ${tituloDemanda}`.slice(0, 2000)

  await client.pages.create({
    parent: {
      type: 'data_source_id',
      data_source_id: NOTION_DATA_SOURCE_MOVIMENTACOES,
    },
    properties: {
      Registro: {
        title: [{ type: 'text', text: { content: registro } }],
      },
      Demanda: {
        relation: [{ id: demandaId }],
      },
      [PROP_TIPO_REGISTRO]: {
        select: { name: TIPO_REGISTRO_EXCLUSAO },
      },
      [PROP_RELATORIO_PESSOA]: {
        rich_text: [{ type: 'text', text: { content: pessoaNome } }],
      },
      Para: {
        rich_text: [{ type: 'text', text: { content: '—' } }],
      },
      Status: {
        rich_text: [{ type: 'text', text: { content: 'Exclusão relatório' } }],
      },
    },
  })
}

export async function restaurarExclusaoRelatorioMovimentacao(
  exclusao: Pick<ExclusaoDemandaRelatorio, 'demandaId' | 'pessoaNome' | 'registroPageId'>
): Promise<void> {
  if (shouldUseNotionMocks()) {
    throw new Error('Restaurar exclusão via Notion indisponível em modo mock.')
  }

  const pageId = exclusao.registroPageId
  if (!pageId) {
    throw new Error('Registro de exclusão sem ID da página no Notion.')
  }

  const client = criarClienteNotion()
  await client.pages.update({
    page_id: pageId,
    in_trash: true,
  })
}
