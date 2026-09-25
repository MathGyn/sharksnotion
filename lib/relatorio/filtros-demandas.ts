import type { DataISO, Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import { estaNoPrazo, type Intervalo } from '@/lib/utils/date'
import { nomeParaSlug, resolverPessoaPorSlug } from '@/lib/utils/slug'
import { SEM_VINCULO } from './constantes'
import {
  listarDemandasConcluidasNoIntervalo,
  obterInstanteConclusao,
} from './conclusoes'
import { obterPessoaQueEntregou } from './pessoa-entrega'
import { idsDemandasRecortePassagemPessoa } from './recorte-contagens'
import type { PeriodoResolvido } from './periodo'
import {
  departamentoParaSlug,
  listarDepartamentosConhecidos,
  listarTiposConhecidos,
  resolverDepartamentoPorSlug,
  resolverTipoPorSlug,
  SLUG_SEM_VINCULO,
  tipoConteudoParaSlug,
} from './slugs-filtro'
import { derivarPessoasDosPara } from './classificacao'

export interface FiltrosDemandaResolvidos {
  intervalo: Intervalo
  pessoaNome: string | null
  departamento: string | null
  tipoConteudo: string | null
}

export type ChipFiltro =
  | { chave: 'pessoa'; slug: string; rotulo: string }
  | { chave: 'departamento'; slug: string; rotulo: string }
  | { chave: 'tipo'; slug: string; rotulo: string }

export type SituacaoLista = 'no prazo' | 'atraso' | 'sem prazo'

export interface DemandaListagemItem {
  id: string
  titulo: string
  tipoConteudo: string
  pessoaEntrega: string | null
  departamento: string
  instanteConclusao: string | null
  precisaEntregarAte: DataISO | null
  situacao: SituacaoLista
}

function mapaSolicitacoes(solicitacoes: Solicitacao[]): Map<string, Solicitacao> {
  return new Map(solicitacoes.map((s) => [s.id, s]))
}

function departamentoDaDemanda(
  demanda: Demanda,
  solMap: Map<string, Solicitacao>
): string {
  if (!demanda.solicitacaoDeOrigemId) return SEM_VINCULO
  const sol = solMap.get(demanda.solicitacaoDeOrigemId)
  return sol?.departamento ?? SEM_VINCULO
}

function calcularSituacao(
  demanda: Demanda,
  movimentacoes: Movimentacao[]
): SituacaoLista {
  if (!demanda.precisaEntregarAte) return 'sem prazo'
  const instante = obterInstanteConclusao(demanda, movimentacoes)
  if (!instante) return 'sem prazo'
  return estaNoPrazo(instante, demanda.precisaEntregarAte) ? 'no prazo' : 'atraso'
}

export function parseFiltrosDemanda(
  searchParams: Record<string, string | undefined>,
  periodo: PeriodoResolvido,
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[]
): FiltrosDemandaResolvidos {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const deptos = listarDepartamentosConhecidos(solicitacoes)
  const tipos = listarTiposConhecidos(demandas)

  const pessoaSlug = searchParams.pessoa?.trim().toLowerCase()
  const deptSlug = searchParams.departamento?.trim().toLowerCase()
  const tipoSlug = searchParams.tipo?.trim().toLowerCase()

  return {
    intervalo: periodo.intervalo,
    pessoaNome: pessoaSlug
      ? resolverPessoaPorSlug(pessoaSlug, pessoas)
      : null,
    departamento: deptSlug ? resolverDepartamentoPorSlug(deptSlug, deptos) : null,
    tipoConteudo: tipoSlug ? resolverTipoPorSlug(tipoSlug, tipos) : null,
  }
}

export function chipsDeFiltros(filtros: FiltrosDemandaResolvidos): ChipFiltro[] {
  const chips: ChipFiltro[] = []
  if (filtros.pessoaNome) {
    chips.push({
      chave: 'pessoa',
      slug: nomeParaSlug(filtros.pessoaNome),
      rotulo: filtros.pessoaNome,
    })
  }
  if (filtros.departamento) {
    chips.push({
      chave: 'departamento',
      slug: departamentoParaSlug(filtros.departamento),
      rotulo: filtros.departamento,
    })
  }
  if (filtros.tipoConteudo) {
    chips.push({
      chave: 'tipo',
      slug: tipoConteudoParaSlug(filtros.tipoConteudo),
      rotulo: filtros.tipoConteudo,
    })
  }
  return chips
}

export function removerChip(
  filtros: FiltrosDemandaResolvidos,
  chave: ChipFiltro['chave']
): FiltrosDemandaResolvidos {
  if (chave === 'pessoa') return { ...filtros, pessoaNome: null }
  if (chave === 'departamento') return { ...filtros, departamento: null }
  return { ...filtros, tipoConteudo: null }
}

function demandaPassaFiltros(
  demanda: Demanda,
  movimentacoes: Movimentacao[],
  solMap: Map<string, Solicitacao>,
  filtros: FiltrosDemandaResolvidos
): boolean {
  // Recorte por passagem é aplicado na base da lista, não por quem entregou.

  if (filtros.departamento) {
    const dept = departamentoDaDemanda(demanda, solMap)
    if (dept !== filtros.departamento) return false
  }

  if (filtros.tipoConteudo) {
    const tipo = demanda.tipoConteudo ?? 'Sem tipo'
    if (tipo !== filtros.tipoConteudo) return false
  }

  return true
}

function demandasBaseDoRecorte(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  filtros: FiltrosDemandaResolvidos
): Demanda[] {
  if (filtros.pessoaNome) {
    const ids = new Set(
      idsDemandasRecortePassagemPessoa(
        movimentacoes,
        filtros.pessoaNome,
        filtros.intervalo
      )
    )
    return demandas.filter((d) => ids.has(d.id))
  }

  return listarDemandasConcluidasNoIntervalo(
    demandas,
    movimentacoes,
    filtros.intervalo
  )
}

export function listarDemandasFiltradas(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  filtros: FiltrosDemandaResolvidos
): DemandaListagemItem[] {
  const solMap = mapaSolicitacoes(solicitacoes)
  const base = demandasBaseDoRecorte(demandas, movimentacoes, filtros).filter((d) =>
    demandaPassaFiltros(d, movimentacoes, solMap, filtros)
  )

  const itens: DemandaListagemItem[] = base.map((d) => ({
    id: d.id,
    titulo: d.solicitacao,
    tipoConteudo: d.tipoConteudo ?? 'Sem tipo',
    pessoaEntrega: obterPessoaQueEntregou(d, movimentacoes),
    departamento: departamentoDaDemanda(d, solMap),
    instanteConclusao: obterInstanteConclusao(d, movimentacoes),
    precisaEntregarAte: d.precisaEntregarAte,
    situacao: calcularSituacao(d, movimentacoes),
  }))

  return itens.sort((a, b) => {
    const ia = a.instanteConclusao ?? ''
    const ib = b.instanteConclusao ?? ''
    return ib.localeCompare(ia)
  })
}

export function serializarFiltrosQuery(
  filtros: FiltrosDemandaResolvidos
): Record<string, string> {
  const q: Record<string, string> = {
    de: filtros.intervalo.de,
    ate: filtros.intervalo.ate,
  }
  if (filtros.pessoaNome) q.pessoa = nomeParaSlug(filtros.pessoaNome)
  if (filtros.departamento) q.departamento = departamentoParaSlug(filtros.departamento)
  if (filtros.tipoConteudo) q.tipo = tipoConteudoParaSlug(filtros.tipoConteudo)
  return q
}

export function queryStringDeParams(params: Record<string, string>): string {
  const sp = new URLSearchParams(params)
  return sp.toString()
}

export { SLUG_SEM_VINCULO }
