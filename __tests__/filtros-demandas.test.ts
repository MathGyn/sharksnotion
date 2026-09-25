import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import { SEM_VINCULO } from '@/lib/relatorio/constantes'
import {
  listarDemandasFiltradas,
  parseFiltrosDemanda,
} from '@/lib/relatorio/filtros-demandas'
import { obterPessoaQueEntregou } from '@/lib/relatorio/pessoa-entrega'
import { intervaloFixo } from '@/lib/relatorio/periodo'
import { SLUG_SEM_VINCULO } from '@/lib/relatorio/slugs-filtro'
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

const periodo = intervaloFixo('2026-09-01', '2026-09-30')

describe('filtros-demandas', () => {
  it('filtra departamento sem-vinculo', () => {
    const demandas = [
      demanda({ id: 'd1', solicitacao: 'Com sol', solicitacaoDeOrigemId: 's1' }),
      demanda({ id: 'd2', solicitacao: 'Sem sol', solicitacaoDeOrigemId: null }),
    ]
    const solicitacoes: Solicitacao[] = [
      {
        id: 's1',
        titulo: 'Sol',
        departamento: 'Sec Vendas',
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
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 15, 10),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
      mov({
        id: 'm2',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 16, 10),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
    ]

    const filtros = parseFiltrosDemanda(
      { departamento: SLUG_SEM_VINCULO },
      periodo,
      demandas,
      solicitacoes,
      movs
    )
    expect(filtros.departamento).toBe(SEM_VINCULO)

    const lista = listarDemandasFiltradas(demandas, solicitacoes, movs, filtros)
    expect(lista).toHaveLength(1)
    expect(lista[0].id).toBe('d2')
    expect(lista[0].departamento).toBe(SEM_VINCULO)
  })

  it('ordena por conclusão mais recente primeiro', () => {
    const demandas = [
      demanda({ id: 'd1', solicitacao: 'Antiga' }),
      demanda({ id: 'd2', solicitacao: 'Recente' }),
    ]
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 10, 10),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
      mov({
        id: 'm2',
        demandaId: 'd2',
        quando: instanteEmSaoPaulo(2026, 9, 25, 10),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
    ]

    const filtros = parseFiltrosDemanda({}, periodo, demandas, [], movs)
    const lista = listarDemandasFiltradas(demandas, [], movs, filtros)
    expect(lista[0].id).toBe('d2')
    expect(lista[1].id).toBe('d1')
  })

  it('usa pessoa que entregou no item da lista', () => {
    const d = demanda({ id: 'd1' })
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
        quando: instanteEmSaoPaulo(2026, 9, 19, 11, 50),
        para: 'Mizael',
      }),
      mov({
        id: 'm3',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 20, 12),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
    ]
    expect(obterPessoaQueEntregou(d, movs)).toBe('Mizael')

    const filtros = parseFiltrosDemanda({}, periodo, [d], [], movs)
    const lista = listarDemandasFiltradas([d], [], movs, filtros)
    expect(lista[0].pessoaEntrega).toBe('Mizael')
  })
})
