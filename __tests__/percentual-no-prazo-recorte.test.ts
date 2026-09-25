import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao } from '@/lib/notion/types'
import { metricasPessoaNoIntervalo } from '@/lib/relatorio/agregacoes'
import { intervaloFixo } from '@/lib/relatorio/periodo'
import { instanteEmSaoPaulo } from '@/lib/utils/date'

function demanda(partial: Partial<Demanda> & { id: string }): Demanda {
  return {
    solicitacao: 'Teste',
    estaComAtual: 'Matheus',
    status: 'Concluído',
    tipoConteudo: 'Design',
    urgencia: 'Média',
    responsavel: [],
    precisaEntregarAte: null,
    dataDeEntrega: null,
    dataGravacaoEdicao: null,
    solicitacaoDeOrigemId: null,
    historicoIds: [],
    criadoEm: instanteEmSaoPaulo(2026, 9, 1, 10),
    notionUrl: '',
    ...partial,
  }
}

function mov(partial: Partial<Movimentacao> & { id: string; demandaId: string }): Movimentacao {
  return {
    registro: 'Registro',
    para: 'Matheus',
    status: 'Em andamento',
    quando: instanteEmSaoPaulo(2026, 9, 10, 10),
    ...partial,
  }
}

describe('percentual no prazo (recorte pessoa)', () => {
  const setembro = intervaloFixo('2026-09-01', '2026-09-30')

  it('só considera demandas concluídas no intervalo, com prazo', () => {
    const demandas = [
      demanda({ id: 'd1', precisaEntregarAte: '2026-09-20' }),
      demanda({ id: 'd2', precisaEntregarAte: '2026-09-10' }),
    ]
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 5, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 15, 10),
        para: 'Mizael',
        status: 'Em andamento',
      }),
      mov({
        id: 'm3',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 18, 10),
        para: 'Concluído - Setembro',
        status: 'Concluído',
      }),
      mov({
        id: 'm4',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 8, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm5',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 12, 10),
        para: 'Mizael',
      }),
      mov({
        id: 'm6',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 15, 10),
        para: 'Concluído - Setembro',
        status: 'Concluído',
      }),
    ]

    const m = metricasPessoaNoIntervalo(demandas, movs, 'Matheus', setembro.intervalo)
    expect(m.demandas).toBe(2)
    expect(m.percentualNoPrazo).toEqual({ tipo: 'percentual', valor: 50 })
  })

  it('ignora conclusão fora do intervalo mesmo com passagem no período', () => {
    const demandas = [demanda({ id: 'd1', precisaEntregarAte: '2026-09-30' })]
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 10, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 12, 10),
        para: 'Mizael',
      }),
      mov({
        id: 'm3',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 10, 5, 10),
        para: 'Concluído - Setembro',
        status: 'Concluído',
      }),
    ]

    const m = metricasPessoaNoIntervalo(demandas, movs, 'Matheus', setembro.intervalo)
    expect(m.passagens).toBe(1)
    expect(m.percentualNoPrazo).toEqual({ tipo: 'sem prazo' })
  })
})
