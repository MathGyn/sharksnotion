import { describe, expect, it } from 'vitest'
import {
  PROP_RELATORIO_PESSOA,
  PROP_TIPO_REGISTRO,
  TIPO_REGISTRO_EXCLUSAO,
  partitionMovimentacoesPages,
} from '@/lib/notion/movimentacoes-parse'
import type { NotionPage } from '@/lib/notion/types'

function paginaMov(partial: {
  id: string
  demandaId?: string
  para?: string
  tipoRegistro?: string | null
  relatorioPessoa?: string
}): NotionPage {
  const props: Record<string, unknown> = {
    Registro: {
      type: 'title',
      title: [{ type: 'text', text: { content: 'Registro' } }],
    },
    Demanda: {
      type: 'relation',
      relation: partial.demandaId ? [{ id: partial.demandaId }] : [],
    },
    Para: {
      type: 'rich_text',
      rich_text: [{ type: 'text', text: { content: partial.para ?? 'Matheus' } }],
    },
    Status: {
      type: 'rich_text',
      rich_text: [{ type: 'text', text: { content: 'Em andamento' } }],
    },
  }

  if (partial.tipoRegistro) {
    props[PROP_TIPO_REGISTRO] = {
      type: 'select',
      select: { name: partial.tipoRegistro },
    }
  }

  if (partial.relatorioPessoa) {
    props[PROP_RELATORIO_PESSOA] = {
      type: 'rich_text',
      rich_text: [{ type: 'text', text: { content: partial.relatorioPessoa } }],
    }
  }

  return {
    object: 'page',
    id: partial.id,
    created_time: '2026-09-28T12:00:00.000Z',
    url: '',
    properties: props,
  }
}

describe('partitionMovimentacoesPages', () => {
  it('separa exclusão do relatório das movimentações reais', () => {
    const pages = [
      paginaMov({ id: 'm1', demandaId: 'd1', para: 'Matheus' }),
      paginaMov({
        id: 'ex1',
        demandaId: 'd2',
        tipoRegistro: TIPO_REGISTRO_EXCLUSAO,
        relatorioPessoa: 'Matheus',
        para: '',
      }),
    ]

    const { movimentacoes, exclusoesDemanda } = partitionMovimentacoesPages(pages)
    expect(movimentacoes).toHaveLength(1)
    expect(movimentacoes[0].id).toBe('m1')
    expect(exclusoesDemanda).toEqual([
      { demandaId: 'd2', pessoaNome: 'Matheus', registroPageId: 'ex1' },
    ])
  })

  it('trata tipo vazio como movimentação normal', () => {
    const { movimentacoes, exclusoesDemanda } = partitionMovimentacoesPages([
      paginaMov({ id: 'm1', demandaId: 'd1' }),
    ])
    expect(movimentacoes).toHaveLength(1)
    expect(exclusoesDemanda).toHaveLength(0)
  })
})
