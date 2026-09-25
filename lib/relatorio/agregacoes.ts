import type { DataISO, Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import { estaNoIntervalo, estaNoPrazo, type Intervalo } from '@/lib/utils/date'
import { nomeParaSlug } from '@/lib/utils/slug'
import { derivarPessoasDosPara } from './classificacao'
import { SEM_TIPO, SEM_VINCULO } from './constantes'
import {
  conclusoesNoIntervaloComPrazo,
  demandaConcluidaNoIntervalo,
  listarDemandasConcluidasNoIntervalo,
} from './conclusoes'
import {
  calcularPercentualNoPrazo,
  contarConcluidasNoIntervalo,
  type ResultadoPercentualNoPrazo,
} from './indicadores'
import type { PeriodoResolvido } from './periodo'
import {
  calcularTodasPassagens,
  passagemTerminouNoIntervalo,
} from './passagens'
import { contarRetrabalho } from './retrabalho'
import {
  contarEmAbertoComPessoa,
  contarEmAbertoHoje,
  filaAtualPorPessoa,
} from './em-aberto'
import { compararPessoaHierarquia, marcarDestaqueCardPrincipal } from './ordem-pessoas'
import {
  idsDemandasContagemVisaoPessoa,
  idsDemandasContagemVisaoTime,
  idsDemandasMetricasPessoa,
  idsDemandasRecortePassagemPessoa,
} from './recorte-contagens'
import { entregasPessoaNoIntervalo, leadTimeEmDias } from './tempo'

export { SEM_VINCULO, SEM_TIPO }

export interface ItemContagem {
  nome: string
  total: number
}

export interface CardPessoaAgregado {
  nome: string
  slug: string
  passagens: number
  demandas: number
  emAbertoAgora: number
  percentualNoPrazo: ResultadoPercentualNoPrazo
  destaque: boolean
}

export interface IndicadoresTime {
  concluidas: number
  entraram: number
  emAbertoHoje: number
  percentualNoPrazo: ResultadoPercentualNoPrazo
  /** Mantido para uso futuro; não exibido por padrão na UI. */
  leadTimeMedioDias: number | null
  ajustes: number
}

export interface IndicadoresPessoa {
  passagens: number
  demandas: number
  percentualNoPrazo: ResultadoPercentualNoPrazo
  ajustes: number
}

export interface EntradasSaidasPeriodo {
  entraram: number
  sairam: number
  saldo: number
}

export interface BlocosVisaoTime {
  entradasSaidas: EntradasSaidasPeriodo
  porUrgencia: ItemContagem[]
  filaPorPessoa: ItemContagem[]
}

export interface RelatorioVisaoTime {
  periodo: PeriodoResolvido
  indicadores: IndicadoresTime
  cardsPessoa: CardPessoaAgregado[]
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
  blocos: BlocosVisaoTime
  mostrarParaQuem: boolean
}

export interface RelatorioVisaoPessoa {
  periodo: PeriodoResolvido
  nome: string
  slug: string
  indicadores: IndicadoresPessoa
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
}

function mapaSolicitacoes(solicitacoes: Solicitacao[]): Map<string, Solicitacao> {
  return new Map(solicitacoes.map((s) => [s.id, s]))
}

export function demandaIdsPassagemPessoaNoIntervalo(
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo,
  _pessoas?: string[]
): string[] {
  return idsDemandasMetricasPessoa(movimentacoes, nomePessoa, intervalo)
}

/** Demandas concluídas no intervalo, dentro do recorte, que têm prazo. */
function percentualNoPrazoRecorte(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  demandaIds: string[],
  intervalo: Intervalo
): ResultadoPercentualNoPrazo {
  const idSet = new Set(demandaIds)
  const comPrazo = conclusoesNoIntervaloComPrazo(demandas, movimentacoes, intervalo).filter(
    (c) => idSet.has(c.demandaId) && c.prazo !== null
  )

  if (comPrazo.length === 0) return { tipo: 'sem prazo' }

  const noPrazo = comPrazo.filter((c) =>
    estaNoPrazo(c.instanteConclusao, c.prazo as DataISO)
  ).length
  return { tipo: 'percentual', valor: Math.round((noPrazo / comPrazo.length) * 100) }
}

function totalAjustesDemandas(
  demandaIds: string[],
  movimentacoes: Movimentacao[]
): number {
  return demandaIds.reduce((acc, id) => acc + contarRetrabalho(id, movimentacoes), 0)
}

function ordenarContagens(mapa: Map<string, number>): ItemContagem[] {
  return [...mapa.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function contagemPorDepartamento(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  demandaIds: string[]
): ItemContagem[] {
  const solMap = mapaSolicitacoes(solicitacoes)
  const mapa = new Map<string, number>()

  for (const id of demandaIds) {
    const d = demandas.find((x) => x.id === id)
    if (!d) continue
    const sol = d.solicitacaoDeOrigemId ? solMap.get(d.solicitacaoDeOrigemId) : null
    const chave = sol?.departamento ?? SEM_VINCULO
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
  }

  return ordenarContagens(mapa)
}

export function contagemPorTipoMaterial(
  demandas: Demanda[],
  demandaIds: string[]
): ItemContagem[] {
  const mapa = new Map<string, number>()

  for (const id of demandaIds) {
    const d = demandas.find((x) => x.id === id)
    if (!d) continue
    const chave = d.tipoConteudo ?? SEM_TIPO
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
  }

  return ordenarContagens(mapa)
}

export function entregasPorPessoaNoIntervalo(
  movimentacoes: Movimentacao[],
  intervalo: Intervalo,
  demandas: Demanda[]
): Omit<CardPessoaAgregado, 'destaque' | 'slug'>[] {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))

  return pessoas
    .map((nome) => {
      const ids = idsDemandasRecortePassagemPessoa(movimentacoes, nome, intervalo)
      return {
        nome,
        passagens: entregasPessoaNoIntervalo(movimentacoes, nome, intervalo),
        demandas: ids.length,
        emAbertoAgora: contarEmAbertoComPessoa(demandas, nome),
        percentualNoPrazo: percentualNoPrazoRecorte(
          demandas,
          movimentacoes,
          ids,
          intervalo
        ),
      }
    })
    .filter((l) => l.passagens > 0)
    .sort((a, b) => compararPessoaHierarquia(a.nome, b.nome))
}

export function metricasPessoaNoIntervalo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): IndicadoresPessoa {
  const ids = idsDemandasMetricasPessoa(movimentacoes, nomePessoa, intervalo)

  return {
    passagens: entregasPessoaNoIntervalo(movimentacoes, nomePessoa, intervalo),
    demandas: ids.length,
    percentualNoPrazo: percentualNoPrazoRecorte(
      demandas,
      movimentacoes,
      ids,
      intervalo
    ),
    ajustes: totalAjustesDemandas(ids, movimentacoes),
  }
}

const LIMIAR_EXIBIR_PARA_QUEM = 0.3

export function contarEntraramNoIntervalo(demandas: Demanda[], intervalo: Intervalo): number {
  return demandas.filter((d) => estaNoIntervalo(d.criadoEm, intervalo)).length
}

export function idsDemandasAtivasNoPeriodo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): string[] {
  const ids = new Set<string>()
  for (const d of demandas) {
    if (estaNoIntervalo(d.criadoEm, intervalo)) ids.add(d.id)
    if (demandaConcluidaNoIntervalo(d, movimentacoes, intervalo)) ids.add(d.id)
  }
  return [...ids]
}

export function calcularEntradasSaidasPeriodo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): EntradasSaidasPeriodo {
  const entraram = contarEntraramNoIntervalo(demandas, intervalo)
  const sairam = contarConcluidasNoIntervalo(demandas, movimentacoes, intervalo)
  return { entraram, sairam, saldo: entraram - sairam }
}

export function contagemPorUrgencia(
  demandas: Demanda[],
  demandaIds: string[]
): ItemContagem[] {
  const ordem = ['Alta', 'Média', 'Baixa'] as const
  const mapa = new Map<string, number>()
  for (const rotulo of ordem) mapa.set(rotulo, 0)

  for (const id of demandaIds) {
    const d = demandas.find((x) => x.id === id)
    if (!d?.urgencia) continue
    mapa.set(d.urgencia, (mapa.get(d.urgencia) ?? 0) + 1)
  }

  return ordem
    .map((nome) => ({ nome, total: mapa.get(nome) ?? 0 }))
    .filter((i) => i.total > 0)
}

export function percentualDemandasComSolicitacao(
  demandas: Demanda[],
  demandaIds: string[]
): number {
  if (demandaIds.length === 0) return 0
  const comVinculo = demandaIds.filter((id) => {
    const d = demandas.find((x) => x.id === id)
    return Boolean(d?.solicitacaoDeOrigemId)
  }).length
  return comVinculo / demandaIds.length
}

export function deveExibirParaQuem(
  demandas: Demanda[],
  demandaIdsRecorte: string[]
): boolean {
  return percentualDemandasComSolicitacao(demandas, demandaIdsRecorte) >= LIMIAR_EXIBIR_PARA_QUEM
}

function leadTimeMedioTime(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): number | null {
  const solMap = mapaSolicitacoes(solicitacoes)
  const concluidas = listarDemandasConcluidasNoIntervalo(demandas, movimentacoes, intervalo)
  const dias: number[] = []

  for (const d of concluidas) {
    const sol = d.solicitacaoDeOrigemId ? solMap.get(d.solicitacaoDeOrigemId) ?? null : null
    const lt = leadTimeEmDias(d, sol, movimentacoes)
    if (lt !== null) dias.push(lt)
  }

  if (dias.length === 0) return null
  const media = dias.reduce((a, b) => a + b, 0) / dias.length
  return Math.round(media * 10) / 10
}

export function idsDemandasRecorteTime(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): string[] {
  return idsDemandasContagemVisaoTime(demandas, movimentacoes, intervalo)
}

export function idsDemandasRecortePessoa(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): string[] {
  return idsDemandasContagemVisaoPessoa(demandas, movimentacoes, nomePessoa, intervalo)
}

export function montarRelatorioVisaoTime(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  periodo: PeriodoResolvido
): RelatorioVisaoTime {
  const intervalo = periodo.intervalo
  const concluidasIds = idsDemandasRecorteTime(demandas, movimentacoes, intervalo)

  const cardsRaw = entregasPorPessoaNoIntervalo(movimentacoes, intervalo, demandas)
  const cardsPessoa: CardPessoaAgregado[] = marcarDestaqueCardPrincipal(
    cardsRaw.map((l) => ({
      ...l,
      slug: nomeParaSlug(l.nome),
      destaque: false,
    }))
  )

  const idsPeriodo = idsDemandasAtivasNoPeriodo(demandas, movimentacoes, intervalo)

  return {
    periodo,
    indicadores: {
      concluidas: contarConcluidasNoIntervalo(demandas, movimentacoes, intervalo),
      entraram: contarEntraramNoIntervalo(demandas, intervalo),
      emAbertoHoje: contarEmAbertoHoje(demandas),
      percentualNoPrazo: calcularPercentualNoPrazo(demandas, movimentacoes, intervalo),
      leadTimeMedioDias: leadTimeMedioTime(demandas, solicitacoes, movimentacoes, intervalo),
      ajustes: totalAjustesDemandas(concluidasIds, movimentacoes),
    },
    cardsPessoa,
    paraQuem: contagemPorDepartamento(demandas, solicitacoes, concluidasIds),
    tipoMaterial: contagemPorTipoMaterial(demandas, concluidasIds),
    blocos: {
      entradasSaidas: calcularEntradasSaidasPeriodo(demandas, movimentacoes, intervalo),
      porUrgencia: contagemPorUrgencia(demandas, idsPeriodo),
      filaPorPessoa: filaAtualPorPessoa(demandas, movimentacoes),
    },
    mostrarParaQuem: deveExibirParaQuem(demandas, concluidasIds),
  }
}

export function montarRelatorioVisaoPessoa(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  periodo: PeriodoResolvido,
  nomePessoa: string
): RelatorioVisaoPessoa {
  const intervalo = periodo.intervalo
  const ids = idsDemandasRecortePassagemPessoa(movimentacoes, nomePessoa, intervalo)

  return {
    periodo,
    nome: nomePessoa,
    slug: nomeParaSlug(nomePessoa),
    indicadores: metricasPessoaNoIntervalo(
      demandas,
      movimentacoes,
      nomePessoa,
      intervalo
    ),
    paraQuem: contagemPorDepartamento(demandas, solicitacoes, ids),
    tipoMaterial: contagemPorTipoMaterial(demandas, ids),
  }
}
