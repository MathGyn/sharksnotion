import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao } from '@/lib/notion/types'
import { metricasPessoaNoIntervalo } from '@/lib/relatorio/agregacoes'
import {
  deduplicarExclusoesDemanda,
  demandaIdsExcluirParaPessoa,
} from '@/lib/relatorio/exclusoes-demanda'
import { idsDemandasRecortePassagemPessoa } from '@/lib/relatorio/recorte-contagens'
import { intervaloFixo } from '@/lib/relatorio/periodo'
import { instanteEmSaoPaulo } from '@/lib/utils/date'

function demanda(partial: Partial<Demanda> & Pick<Demanda, 'id'>): Demanda {
  return {
    solicitacao: partial.solicitacao ?? 'Demanda',
    estaComAtual: 'Matheus',
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
    quando: instanteEmSaoPaulo(2026, 9, 10, 10),
    ...partial,
  }
}

describe('deduplicarExclusoesDemanda', () => {
  it('mantém uma linha por demanda+pessoa e prefere registro com page id', () => {
    const out = deduplicarExclusoesDemanda([
      { demandaId: 'd1', pessoaNome: 'Matheus' },
      { demandaId: 'd1', pessoaNome: 'Matheus', registroPageId: 'page-b' },
      { demandaId: 'd1', pessoaNome: 'Matheus', registroPageId: 'page-a' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].registroPageId).toBe('page-b')
  })
})

describe('exclusões de demanda no relatório pessoal', () => {
  it('remove demanda das métricas e passagens da pessoa', () => {
    const periodo = intervaloFixo('2026-09-01', '2026-09-30')
    const demandas = [demanda({ id: 'd1' }), demanda({ id: 'd2', solicitacao: 'Outra' })]
    const movs: Movimentacao[] = [
      mov({ id: 'm1', demandaId: 'd1', quando: instanteEmSaoPaulo(2026, 9, 12, 10) }),
      mov({
        id: 'm2',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 14, 12),
        para: 'Concluído - Setembro',
      }),
      mov({ id: 'm3', demandaId: 'd2', quando: instanteEmSaoPaulo(2026, 9, 16, 10) }),
      mov({
        id: 'm4',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 18, 12),
        para: 'Concluído - Setembro',
      }),
    ]

    const semExclusao = metricasPessoaNoIntervalo(demandas, movs, 'Matheus', periodo.intervalo)
    expect(semExclusao.passagens).toBe(2)
    expect(semExclusao.demandas).toBe(2)

    const exclusoes = [{ demandaId: 'd1', pessoaNome: 'Matheus' }]
    const comExclusao = metricasPessoaNoIntervalo(
      demandas,
      movs,
      'Matheus',
      periodo.intervalo,
      exclusoes
    )
    expect(comExclusao.passagens).toBe(1)
    expect(comExclusao.demandas).toBe(1)

    const ids = idsDemandasRecortePassagemPessoa(
      movs,
      'Matheus',
      periodo.intervalo,
      demandaIdsExcluirParaPessoa(exclusoes, 'Matheus')
    )
    expect(ids).toEqual(['d2'])
  })
})
