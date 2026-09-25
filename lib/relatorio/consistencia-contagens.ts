import type { Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import type { ItemContagem } from './agregacoes'
import { contagemPorDepartamento, contagemPorTipoMaterial } from './agregacoes'
import {
  type FiltrosDemandaResolvidos,
  listarDemandasFiltradas,
} from './filtros-demandas'

export function validarContagensConsistentesComFiltro(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  demandaIdsRecorte: string[],
  filtrosBase: Pick<FiltrosDemandaResolvidos, 'intervalo' | 'pessoaNome'>
): { ok: true } | { ok: false; categoria: string; nome: string; contagem: number; filtrado: number } {
  const paraQuem = contagemPorDepartamento(demandas, solicitacoes, demandaIdsRecorte)
  const tipos = contagemPorTipoMaterial(demandas, demandaIdsRecorte)

  for (const item of paraQuem) {
    const r = compararItem(demandas, solicitacoes, movimentacoes, filtrosBase, item, 'departamento')
    if (!r.ok) return { ...r, categoria: 'departamento' }
  }

  for (const item of tipos) {
    const r = compararItem(demandas, solicitacoes, movimentacoes, filtrosBase, item, 'tipo')
    if (!r.ok) return { ...r, categoria: 'tipo' }
  }

  return { ok: true }
}

function compararItem(
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[],
  filtrosBase: Pick<FiltrosDemandaResolvidos, 'intervalo' | 'pessoaNome'>,
  item: ItemContagem,
  dim: 'departamento' | 'tipo'
):
  | { ok: true }
  | { ok: false; nome: string; contagem: number; filtrado: number } {
  const filtros: FiltrosDemandaResolvidos = {
    intervalo: filtrosBase.intervalo,
    pessoaNome: filtrosBase.pessoaNome,
    departamento: dim === 'departamento' ? item.nome : null,
    tipoConteudo: dim === 'tipo' ? item.nome : null,
  }

  const filtrado = listarDemandasFiltradas(
    demandas,
    solicitacoes,
    movimentacoes,
    filtros
  ).length

  if (filtrado !== item.total) {
    return { ok: false, nome: item.nome, contagem: item.total, filtrado }
  }

  return { ok: true }
}
