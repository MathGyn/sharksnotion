import type { Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import type { ItemContagem } from './agregacoes'
import {
  type DemandaListagemItem,
  type FiltrosDemandaResolvidos,
  listarDemandasFiltradas,
} from './filtros-demandas'
import { montarDetalheDemanda } from './detalhe-demanda'
import type { DetalheDemandaInline } from './drill-down-types'
export type { DetalheDemandaInline }
import {
  chaveAbertoDepartamento,
  chaveAbertoTipo,
} from './drill-down-chaves'
export { chaveAbertoDepartamento, chaveAbertoTipo }
import {
  demandaIdsExcluirParaPessoa,
  type ExclusaoDemandaRelatorio,
} from './exclusoes-demanda'
import {
  listarDepartamentosConhecidos,
  listarTiposConhecidos,
  resolverDepartamentoPorSlug,
  resolverTipoPorSlug,
} from './slugs-filtro'

export interface PayloadDrillDown {
  listasPorAberto: Record<string, DemandaListagemItem[]>
  detalhesPorId: Record<string, DetalheDemandaInline>
}

export function montarDetalheDemandaInline(
  demandaId: string,
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[]
): DetalheDemandaInline | null {
  const detalhe = montarDetalheDemanda(demandaId, demandas, solicitacoes, movimentacoes)
  if (!detalhe) return null
  return {
    id: detalhe.id,
    historicoVazioPorAntiguidade: detalhe.historicoVazioPorAntiguidade,
    historico: detalhe.historico,
    notionUrl: detalhe.notionUrl,
  }
}

export function montarListaPorChaveAberto(
  aberto: string,
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  filtrosBase: FiltrosDemandaResolvidos
): DemandaListagemItem[] | null {
  if (aberto.startsWith('departamento:')) {
    const slug = aberto.slice('departamento:'.length)
    const nome = resolverDepartamentoPorSlug(
      slug,
      listarDepartamentosConhecidos(solicitacoes)
    )
    if (!nome) return null
    return listarDemandasFiltradas(demandas, solicitacoes, movimentacoes, {
      ...filtrosBase,
      departamento: nome,
      tipoConteudo: null,
    })
  }

  if (aberto.startsWith('tipo:')) {
    const slug = aberto.slice('tipo:'.length)
    const nome = resolverTipoPorSlug(slug, listarTiposConhecidos(demandas))
    if (!nome) return null
    return listarDemandasFiltradas(demandas, solicitacoes, movimentacoes, {
      ...filtrosBase,
      departamento: null,
      tipoConteudo: nome,
    })
  }

  return null
}

export function montarPayloadDrillDown(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  filtrosBase: FiltrosDemandaResolvidos,
  paraQuem: ItemContagem[],
  tipoMaterial: ItemContagem[]
): PayloadDrillDown {
  const listasPorAberto: Record<string, DemandaListagemItem[]> = {}

  for (const item of paraQuem) {
    const filtros: FiltrosDemandaResolvidos = {
      ...filtrosBase,
      departamento: item.nome,
      tipoConteudo: null,
    }
    listasPorAberto[chaveAbertoDepartamento(item.nome)] = listarDemandasFiltradas(
      demandas,
      solicitacoes,
      movimentacoes,
      filtros
    )
  }

  for (const item of tipoMaterial) {
    const filtros: FiltrosDemandaResolvidos = {
      ...filtrosBase,
      departamento: null,
      tipoConteudo: item.nome,
    }
    listasPorAberto[chaveAbertoTipo(item.nome)] = listarDemandasFiltradas(
      demandas,
      solicitacoes,
      movimentacoes,
      filtros
    )
  }

  const ids = new Set<string>()
  for (const lista of Object.values(listasPorAberto)) {
    for (const row of lista) ids.add(row.id)
  }

  const detalhesPorId: Record<string, DetalheDemandaInline> = {}
  for (const id of ids) {
    const inline = montarDetalheDemandaInline(id, demandas, solicitacoes, movimentacoes)
    if (inline) detalhesPorId[id] = inline
  }

  return { listasPorAberto, detalhesPorId }
}

export function filtrosBaseVisaoTime(
  intervalo: FiltrosDemandaResolvidos['intervalo']
): FiltrosDemandaResolvidos {
  return {
    intervalo,
    pessoaNome: null,
    departamento: null,
    tipoConteudo: null,
  }
}

export function filtrosBaseVisaoPessoa(
  intervalo: FiltrosDemandaResolvidos['intervalo'],
  nomePessoa: string,
  exclusoesDemanda: ExclusaoDemandaRelatorio[] = []
): FiltrosDemandaResolvidos {
  const demandaIdsExcluir = demandaIdsExcluirParaPessoa(exclusoesDemanda, nomePessoa)
  return {
    intervalo,
    pessoaNome: nomePessoa,
    departamento: null,
    tipoConteudo: null,
    demandaIdsExcluir:
      demandaIdsExcluir.size > 0 ? demandaIdsExcluir : undefined,
  }
}
