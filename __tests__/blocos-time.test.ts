import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao } from '@/lib/notion/types'
import {
  calcularEntradasSaidasPeriodo,
  contagemPorUrgencia,
  contarEntraramNoIntervalo,
  deveExibirParaQuem,
  idsDemandasAtivasNoPeriodo,
} from '@/lib/relatorio/agregacoes'
import { contarEmAbertoHoje, filaAtualPorPessoa } from '@/lib/relatorio/em-aberto'
import { intervaloFixo } from '@/lib/relatorio/periodo'
import { instanteEmSaoPaulo } from '@/lib/utils/date'

function demanda(partial: Partial<Demanda> & Pick<Demanda, 'id'>): Demanda {
  return {
    solicitacao: 'Teste',
    estaComAtual: 'Matheus',
    status: 'Em andamento',
    tipoConteudo: 'Vídeo',
    urgencia: 'Alta',
    responsavel: [],
    precisaEntregarAte: null,
    dataDeEntrega: null,
    dataGravacaoEdicao: null,
    solicitacaoDeOrigemId: null,
    historicoIds: [],
    criadoEm: instanteEmSaoPaulo(2026, 9, 5),
    notionUrl: '',
    ...partial,
  }
}

describe('blocos e indicadores do time', () => {
  const periodo = intervaloFixo('2026-09-01', '2026-09-30')

  it('entraram, saíram e saldo', () => {
    const demandas = [
      demanda({ id: 'd1', criadoEm: instanteEmSaoPaulo(2026, 9, 2) }),
      demanda({ id: 'd2', criadoEm: instanteEmSaoPaulo(2026, 9, 8) }),
      demanda({ id: 'd3', criadoEm: instanteEmSaoPaulo(2026, 8, 1), status: 'Concluído' }),
    ]
    const movs: Movimentacao[] = [
      {
        id: 'm1',
        registro: 'r',
        demandaId: 'd3',
        para: 'Concluído - Setembro',
        status: 'Concluído',
        quando: instanteEmSaoPaulo(2026, 9, 20, 12),
      },
    ]

    expect(contarEntraramNoIntervalo(demandas, periodo.intervalo)).toBe(2)
    const es = calcularEntradasSaidasPeriodo(demandas, movs, periodo.intervalo)
    expect(es.entraram).toBe(2)
    expect(es.sairam).toBe(1)
    expect(es.saldo).toBe(1)
  })

  it('urgência no recorte do período', () => {
    const demandas = [
      demanda({ id: 'd1', urgencia: 'Alta' }),
      demanda({
        id: 'd2',
        urgencia: 'Baixa',
        criadoEm: instanteEmSaoPaulo(2026, 8, 1),
      }),
    ]
    const ids = idsDemandasAtivasNoPeriodo(demandas, [], periodo.intervalo)
    expect(ids).toEqual(['d1'])
    expect(contagemPorUrgencia(demandas, ids)).toEqual([{ nome: 'Alta', total: 1 }])
  })

  it('fila atual e em aberto hoje', () => {
    const demandas = [
      demanda({ id: 'd1', estaComAtual: 'Matheus' }),
      demanda({ id: 'd2', estaComAtual: 'Matheus', status: 'Concluído' }),
      demanda({ id: 'd3', estaComAtual: 'Mizael' }),
    ]
    expect(contarEmAbertoHoje(demandas)).toBe(2)
    expect(filaAtualPorPessoa(demandas, [])).toEqual([
      { nome: 'Matheus', total: 1 },
      { nome: 'Mizael', total: 1 },
    ])
  })

  it('Para quem só aparece com ≥30% de vínculo', () => {
    const demandas = [
      demanda({ id: 'd1', solicitacaoDeOrigemId: 's1' }),
      demanda({ id: 'd2', solicitacaoDeOrigemId: null }),
      demanda({ id: 'd3', solicitacaoDeOrigemId: null }),
      demanda({ id: 'd4', solicitacaoDeOrigemId: null }),
    ]
    expect(deveExibirParaQuem(demandas, ['d1', 'd2', 'd3', 'd4'])).toBe(false)
    expect(deveExibirParaQuem(demandas, ['d1', 'd2', 'd3'])).toBe(true)
  })
})
