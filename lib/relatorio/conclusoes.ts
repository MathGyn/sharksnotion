import type { DataISO, Demanda, Movimentacao } from '@/lib/notion/types'
import {
  dataISOToInstanteConclusao,
  getMesAnoDeInstante,
} from '@/lib/utils/date'
import { estaNoIntervalo, type Intervalo } from '@/lib/utils/date'

function isStatusConcluido(status: string): boolean {
  const s = status.trim().toLocaleLowerCase('pt-BR')
  return s === 'concluído' || s.startsWith('concluído')
}

function movimentacoesDaDemanda(
  demandaId: string,
  movimentacoes: Movimentacao[]
): Movimentacao[] {
  return movimentacoes
    .filter((m) => m.demandaId === demandaId)
    .sort((a, b) => a.quando.localeCompare(b.quando))
}

/** Data/hora efetiva de conclusão (última mov. Concluído ou Data De entrega). */
export function obterInstanteConclusao(
  demanda: Demanda,
  movimentacoes: Movimentacao[]
): string | null {
  const movs = movimentacoesDaDemanda(demanda.id, movimentacoes)
  const concluidos = movs.filter((m) => isStatusConcluido(m.status))

  if (concluidos.length > 0) {
    return concluidos[concluidos.length - 1].quando
  }

  if (movs.length === 0 && demanda.dataDeEntrega) {
    return dataISOToInstanteConclusao(demanda.dataDeEntrega)
  }

  return null
}

export function demandaConcluidaNoIntervalo(
  demanda: Demanda,
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): boolean {
  const instante = obterInstanteConclusao(demanda, movimentacoes)
  if (!instante) return false
  return estaNoIntervalo(instante, intervalo)
}

export function listarDemandasConcluidasNoIntervalo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): Demanda[] {
  return demandas.filter((d) => demandaConcluidaNoIntervalo(d, movimentacoes, intervalo))
}

export function mesAnoDaConclusao(
  demanda: Demanda,
  movimentacoes: Movimentacao[]
): string | null {
  const instante = obterInstanteConclusao(demanda, movimentacoes)
  if (!instante) return null
  return getMesAnoDeInstante(instante)
}

export interface ConclusaoComPrazo {
  demandaId: string
  instanteConclusao: string
  prazo: DataISO | null
}

export function conclusoesNoIntervaloComPrazo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): ConclusaoComPrazo[] {
  return listarDemandasConcluidasNoIntervalo(demandas, movimentacoes, intervalo).map((d) => {
    const instante = obterInstanteConclusao(d, movimentacoes)!
    return {
      demandaId: d.id,
      instanteConclusao: instante,
      prazo: d.precisaEntregarAte,
    }
  })
}
