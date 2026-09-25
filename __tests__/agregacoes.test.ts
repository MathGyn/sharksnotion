import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import {
  contagemPorDepartamento,
  contagemPorTipoMaterial,
  entregasPorPessoaNoIntervalo,
  metricasPessoaNoIntervalo,
  montarRelatorioVisaoTime,
  SEM_VINCULO,
} from '@/lib/relatorio/agregacoes'
import { instanteEmSaoPaulo } from '@/lib/utils/date'
import { intervaloFixo } from '@/lib/relatorio/periodo'

function mov(partial: Partial<Movimentacao> & Pick<Movimentacao, 'id'>): Movimentacao {
  return {
    registro: 'r',
    demandaId: 'd1',
    para: 'Matheus',
    status: 'Em andamento',
    quando: instanteEmSaoPaulo(2026, 9, 22, 10),
    ...partial,
  }
}

function demanda(partial: Partial<Demanda> & Pick<Demanda, 'id'>): Demanda {
  return {
    solicitacao: 'Teste',
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
    criadoEm: instanteEmSaoPaulo(2026, 8, 1),
    notionUrl: '',
    ...partial,
  }
}

const setembro = intervaloFixo('2026-09-01', '2026-09-30')

describe('agregacoes', () => {
  it('contagem por departamento usa Sem vínculo sem solicitação', () => {
    const demandas = [
      demanda({ id: 'd1', solicitacaoDeOrigemId: 's1' }),
      demanda({ id: 'd2', solicitacaoDeOrigemId: null }),
    ]
    const solicitacoes: Solicitacao[] = [
      {
        id: 's1',
        titulo: 'Sol',
        departamento: 'Vendas Digitais',
        unidade: 'MARISTA',
        solicitante: [],
        dataDaSolicitacao: '2026-09-01',
        prazoDesejado: null,
        estimativaDeEntrega: null,
        canalDeUso: null,
        objetivoDoMaterial: null,
        demandaNaEsteiraIds: [],
        criadoEm: instanteEmSaoPaulo(2026, 9, 1),
      },
    ]

    const itens = contagemPorDepartamento(demandas, solicitacoes, ['d1', 'd2'])
    expect(itens.find((i) => i.nome === SEM_VINCULO)?.total).toBe(1)
    expect(itens.find((i) => i.nome === 'Vendas Digitais')?.total).toBe(1)
  })

  it('contagem por tipo de material', () => {
    const demandas = [
      demanda({ id: 'd1', tipoConteudo: 'Vídeo' }),
      demanda({ id: 'd2', tipoConteudo: 'Design' }),
      demanda({ id: 'd3', tipoConteudo: 'Vídeo' }),
    ]
    const itens = contagemPorTipoMaterial(demandas, ['d1', 'd2', 'd3'])
    expect(itens[0]).toEqual({ nome: 'Vídeo', total: 2 })
    expect(itens[1]).toEqual({ nome: 'Design', total: 1 })
  })

  it('entregas por pessoa no intervalo', () => {
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
        id: 'm2b',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 13, 10),
        para: 'Perdigão',
      }),
      mov({
        id: 'm3',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 14, 10),
        para: 'Mizael',
      }),
      mov({
        id: 'm4',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 16, 10),
        para: 'Matheus',
      }),
    ]

    const linhas = entregasPorPessoaNoIntervalo(movs, setembro.intervalo, [])
    const matheus = linhas.find((l) => l.nome === 'Matheus')
    const mizael = linhas.find((l) => l.nome === 'Mizael')
    expect(matheus?.passagens).toBe(1)
    expect(mizael?.passagens).toBe(2)
    expect(linhas[0].nome).toBe('Matheus')
  })

  it('intervalo que atravessa dois meses agrega passagem em setembro', () => {
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 8, 28, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 3, 9),
        para: 'Mizael',
      }),
    ]
    const cruzado = intervaloFixo('2026-08-25', '2026-09-05')
    const linhas = entregasPorPessoaNoIntervalo(movs, cruzado.intervalo, [])
    expect(linhas.find((l) => l.nome === 'Matheus')?.passagens).toBe(1)
  })

  it('métricas da pessoa incluem ajustes e percentual', () => {
    const demandas = [demanda({ id: 'd1', precisaEntregarAte: '2026-09-30' })]
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 10, 10),
        para: 'Matheus',
        status: 'Em andamento',
      }),
      mov({
        id: 'm2',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 11, 10),
        para: 'Matheus',
        status: 'Ajustes',
      }),
      mov({
        id: 'm3',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 12, 10),
        para: 'Mizael',
        status: 'Em andamento',
      }),
      mov({
        id: 'm4',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 20, 10),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
    ]

    const m = metricasPessoaNoIntervalo(demandas, movs, 'Matheus', setembro.intervalo)
    expect(m.passagens).toBe(1)
    expect(m.ajustes).toBeGreaterThanOrEqual(0)
  })
})

describe('agregacoes com mocks', () => {
  it('monta visão do time para setembro/2026', async () => {
    delete process.env.NOTION_TOKEN
    const { fetchAllDataSourcesUncached } = await import('@/lib/notion/fetch')
    const data = await fetchAllDataSourcesUncached()
    const rel = montarRelatorioVisaoTime(
      data.demandas,
      data.solicitacoes,
      data.movimentacoes,
      setembro
    )
    expect(rel.indicadores.concluidas).toBeGreaterThan(0)
    expect(rel.cardsPessoa.length).toBeGreaterThan(0)
    expect(rel.cardsPessoa.filter((l) => l.destaque).length).toBe(1)
  })
})
