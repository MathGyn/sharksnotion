import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao } from '@/lib/notion/types'
import { obterPessoaQueEntregou } from '@/lib/relatorio/pessoa-entrega'
import { instanteEmSaoPaulo } from '@/lib/utils/date'

function demanda(partial: Partial<Demanda> & Pick<Demanda, 'id'>): Demanda {
  return {
    solicitacao: 'Card teste',
    estaComAtual: 'Mizael',
    status: 'Concluído',
    tipoConteudo: 'Vídeo',
    urgencia: 'Média',
    responsavel: [],
    precisaEntregarAte: '2026-09-30',
    dataDeEntrega: null,
    dataGravacaoEdicao: null,
    solicitacaoDeOrigemId: null,
    historicoIds: [],
    criadoEm: instanteEmSaoPaulo(2026, 9, 1),
    notionUrl: '',
    ...partial,
  }
}

function mov(partial: Partial<Movimentacao> & Pick<Movimentacao, 'id'>): Movimentacao {
  return {
    registro: 'r',
    demandaId: 'd1',
    para: 'Matheus',
    status: 'Em andamento',
    quando: instanteEmSaoPaulo(2026, 9, 1, 10),
    ...partial,
  }
}

describe('obterPessoaQueEntregou', () => {
  it('muito tempo com A e 10 minutos com B antes de concluir → entrega de B', () => {
    const d = demanda({ id: 'd1' })
    const conclusao = instanteEmSaoPaulo(2026, 9, 20, 12, 0)
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        quando: instanteEmSaoPaulo(2026, 9, 1, 9, 0),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        quando: instanteEmSaoPaulo(2026, 9, 20, 11, 50),
        para: 'Mizael',
      }),
      mov({
        id: 'm3',
        quando: conclusao,
        para: 'Concluído - Setembro',
        status: 'Concluído',
      }),
    ]

    expect(obterPessoaQueEntregou(d, movs)).toBe('Mizael')
  })

  it('sem pessoa no histórico antes da conclusão → null', () => {
    const d = demanda({ id: 'd1', dataDeEntrega: '2026-08-10', status: 'Concluído' })
    expect(obterPessoaQueEntregou(d, [])).toBeNull()
  })
})
