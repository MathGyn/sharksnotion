import type { DataISO, Demanda, Movimentacao } from '@/lib/notion/types'
import { estaNoPrazo } from '@/lib/utils/date'
import {
  conclusoesNoIntervaloComPrazo,
  listarDemandasConcluidasNoIntervalo,
} from './conclusoes'
import type { Intervalo } from '@/lib/utils/date'

export type ResultadoPercentualNoPrazo =
  | { tipo: 'percentual'; valor: number }
  | { tipo: 'sem prazo' }

export function calcularPercentualNoPrazo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): ResultadoPercentualNoPrazo {
  const conclusoes = conclusoesNoIntervaloComPrazo(demandas, movimentacoes, intervalo)
  const comPrazo = conclusoes.filter((c) => c.prazo !== null)

  if (comPrazo.length === 0) {
    return { tipo: 'sem prazo' }
  }

  const noPrazo = comPrazo.filter((c) =>
    estaNoPrazo(c.instanteConclusao, c.prazo as DataISO)
  ).length

  return {
    tipo: 'percentual',
    valor: Math.round((noPrazo / comPrazo.length) * 100),
  }
}

export function contarConcluidasNoIntervalo(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): number {
  return listarDemandasConcluidasNoIntervalo(demandas, movimentacoes, intervalo).length
}
