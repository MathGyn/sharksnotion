import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao } from '@/lib/notion/types'
import {
  derivarPessoasDosPara,
  isEtapa,
  isPessoa,
  resolverNomePessoa,
} from '@/lib/relatorio/classificacao'
import {
  demandaConcluidaNoIntervalo,
  listarDemandasConcluidasNoIntervalo,
  obterInstanteConclusao,
} from '@/lib/relatorio/conclusoes'
import { calcularPercentualNoPrazo } from '@/lib/relatorio/indicadores'
import {
  calcularPassagensDeDemanda,
  mediaHorasPassagensPessoa,
} from '@/lib/relatorio/passagens'
import { contarRetrabalho } from '@/lib/relatorio/retrabalho'
import { entregasPessoaNoIntervalo } from '@/lib/relatorio/tempo'
import {
  estaDentroDoMes,
  estaNoIntervalo,
  estaNoPrazo,
  instanteEmSaoPaulo,
} from '@/lib/utils/date'
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
    status: 'Em andamento',
    tipoConteudo: 'Vídeo',
    urgencia: 'Média',
    responsavel: [],
    precisaEntregarAte: null,
    dataDeEntrega: null,
    dataGravacaoEdicao: null,
    solicitacaoDeOrigemId: null,
    historicoIds: [],
    criadoEm: instanteEmSaoPaulo(2026, 8, 1),
    notionUrl: '',
    ...partial,
  }
}

describe('fuso — no prazo', () => {
  it('23/09 às 22h em São Paulo com prazo 2026-09-23 = no prazo', () => {
    const conclusao = instanteEmSaoPaulo(2026, 9, 23, 22)
    expect(estaNoPrazo(conclusao, '2026-09-23')).toBe(true)
  })

  it('24/09 às 00h30 em São Paulo com prazo 2026-09-23 = atrasada', () => {
    const conclusao = instanteEmSaoPaulo(2026, 9, 24, 0, 30)
    expect(estaNoPrazo(conclusao, '2026-09-23')).toBe(false)
  })
})

describe('recorte de intervalo', () => {
  it('30/09 às 23h em São Paulo pertence a setembro', () => {
    const t = instanteEmSaoPaulo(2026, 9, 30, 23)
    const setembro = intervaloFixo('2026-09-01', '2026-09-30').intervalo
    expect(estaNoIntervalo(t, setembro)).toBe(true)
    expect(estaDentroDoMes(t, '2026-09')).toBe(true)
  })
})

describe('passagens', () => {
  it('passagem em aberto não quebra a média', () => {
    const pessoas = derivarPessoasDosPara(['Matheus'])
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        quando: instanteEmSaoPaulo(2026, 9, 22, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        quando: instanteEmSaoPaulo(2026, 9, 22, 14),
        para: 'Matheus',
        status: 'Em andamento',
      }),
    ]

    const passagens = calcularPassagensDeDemanda('d1', movs, pessoas)
    expect(passagens).toHaveLength(1)
    expect(passagens[0].saida).toBeNull()

    const media = mediaHorasPassagensPessoa(passagens, 'Matheus')
    expect(media).toBeNull()
  })

  it('passagem que atravessa virada do mês conta entrega no intervalo de setembro', () => {
    const pessoas = derivarPessoasDosPara(['Matheus'])
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

    const cruzado = intervaloFixo('2026-08-25', '2026-09-05').intervalo
    expect(entregasPessoaNoIntervalo(movs, 'Matheus', cruzado)).toBe(1)
    expect(entregasPessoaNoIntervalo(movs, 'Matheus', intervaloFixo('2026-08-01', '2026-08-31').intervalo)).toBe(0)
  })
})

describe('conclusões no intervalo', () => {
  it('reaberta e concluída de novo — conta uma vez, última conclusão', () => {
    const d = demanda({ id: 'd1', precisaEntregarAte: '2026-09-30' })
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        quando: instanteEmSaoPaulo(2026, 9, 10, 12),
        status: 'Concluído',
      }),
      mov({
        id: 'm2',
        quando: instanteEmSaoPaulo(2026, 9, 12, 12),
        status: 'Em andamento',
      }),
      mov({
        id: 'm3',
        quando: instanteEmSaoPaulo(2026, 9, 20, 15),
        status: 'Concluído',
      }),
    ]

    const intervalo = intervaloFixo('2026-09-01', '2026-09-30').intervalo
    const concluidas = listarDemandasConcluidasNoIntervalo([d], movs, intervalo)
    expect(concluidas).toHaveLength(1)
    expect(obterInstanteConclusao(d, movs)).toBe(movs[2].quando)
  })

  it('sem movimentação e sem Data De entrega não entra em nenhum intervalo', () => {
    const d = demanda({ id: 'd1' })
    const intervalo = intervaloFixo('2026-09-01', '2026-09-30').intervalo
    expect(demandaConcluidaNoIntervalo(d, [], intervalo)).toBe(false)
    expect(obterInstanteConclusao(d, [])).toBeNull()
  })

  it('agosto concluída só com Data De entrega (sem histórico)', () => {
    const d = demanda({
      id: 'd-agosto',
      dataDeEntrega: '2026-08-15',
      status: 'Concluído',
    })
    expect(
      demandaConcluidaNoIntervalo(
        d,
        [],
        intervaloFixo('2026-08-01', '2026-08-31').intervalo
      )
    ).toBe(true)
    expect(
      demandaConcluidaNoIntervalo(
        d,
        [],
        intervaloFixo('2026-09-01', '2026-09-30').intervalo
      )
    ).toBe(false)
  })
})

describe('percentual no prazo', () => {
  it('nenhuma demanda com prazo → sem prazo (não NaN, não 0%)', () => {
    const d = demanda({
      id: 'd1',
      precisaEntregarAte: null,
      dataDeEntrega: '2026-09-10',
    })
    const movs = [
      mov({
        id: 'm1',
        quando: instanteEmSaoPaulo(2026, 9, 10, 12),
        status: 'Concluído',
      }),
    ]
    const r = calcularPercentualNoPrazo(
      [d],
      movs,
      intervaloFixo('2026-09-01', '2026-09-30').intervalo
    )
    expect(r.tipo).toBe('sem prazo')
  })
})

describe('classificação', () => {
  it('Concluído - Setembro é etapa; MATHEUS e matheus são a mesma pessoa', () => {
    expect(isEtapa('Concluído - Setembro')).toBe(true)
    expect(isPessoa('Concluído - Setembro')).toBe(false)

    const pessoas = derivarPessoasDosPara(['Matheus', 'MATHEUS', 'matheus'])
    expect(pessoas).toHaveLength(1)
    expect(resolverNomePessoa('MATHEUS', pessoas)).toBe('Matheus')
    expect(resolverNomePessoa('matheus', pessoas)).toBe('Matheus')
  })
})

describe('retrabalho (caso difícil dos mocks)', () => {
  it('conta entradas em Ajustes vindas de outro status', () => {
    const movs: Movimentacao[] = [
      mov({ id: 'a', status: 'Em andamento', para: 'Aprovação' }),
      mov({ id: 'b', status: 'Ajustes', para: 'Matheus' }),
      mov({ id: 'c', status: 'Aprovação', para: 'Aprovação' }),
      mov({ id: 'd', status: 'Ajustes', para: 'Mizael' }),
    ]
    expect(contarRetrabalho('d1', movs)).toBe(2)
  })
})

describe('mocks integrados', () => {
  it('8 demandas de agosto concluídas têm Data De entrega e zero movimentações', async () => {
    delete process.env.NOTION_TOKEN
    const { fetchRawAllPages } = await import('@/lib/notion/client')
    const { normalizeDemanda, normalizeMovimentacao } = await import('@/lib/notion/normalize')

    const raw = await fetchRawAllPages()
    const demandas = raw.demandasPages.map(normalizeDemanda)
    const movs = raw.movimentacoesPages.map(normalizeMovimentacao)

    const agostoSemHist = demandas.filter(
      (d) => d.dataDeEntrega?.startsWith('2026-08') && d.status === 'Concluído'
    )

    const idsAgosto = new Set(agostoSemHist.map((d) => d.id))
    const movsNessas = movs.filter((m) => m.demandaId && idsAgosto.has(m.demandaId))

    expect(agostoSemHist.length).toBeGreaterThanOrEqual(8)
    expect(movsNessas).toHaveLength(0)
  })
})
