import type { Demanda, Movimentacao } from '@/lib/notion/types'
import type { Intervalo } from '@/lib/utils/date'
import { listarDemandasConcluidasNoIntervalo } from './conclusoes'
import { derivarPessoasDosPara } from './classificacao'
import { calcularTodasPassagens, passagemTerminouNoIntervalo } from './passagens'

/** Concluídas no intervalo — visão do time (listas + drill-down). */
export function idsDemandasContagemVisaoTime(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  intervalo: Intervalo
): string[] {
  return listarDemandasConcluidasNoIntervalo(demandas, movimentacoes, intervalo).map(
    (d) => d.id
  )
}

/**
 * Demandas com passagem da pessoa encerrada no intervalo.
 * Mesmo conjunto para indicadores, contagens e drill-down na visão pessoa.
 */
export function idsDemandasRecortePassagemPessoa(
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): string[] {
  return idsDemandasMetricasPessoa(movimentacoes, nomePessoa, intervalo)
}

export function idsDemandasContagemVisaoPessoa(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): string[] {
  void demandas
  return idsDemandasRecortePassagemPessoa(movimentacoes, nomePessoa, intervalo)
}

/** Passagens encerradas no intervalo — recorte único da visão pessoa. */
export function idsDemandasMetricasPessoa(
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): string[] {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const passagens = calcularTodasPassagens(movimentacoes, pessoas)
  const ids = new Set<string>()

  for (const p of passagens) {
    if (
      p.pessoa !== null &&
      p.pessoa.localeCompare(nomePessoa, 'pt-BR', { sensitivity: 'base' }) === 0 &&
      passagemTerminouNoIntervalo(p, intervalo)
    ) {
      ids.add(p.demandaId)
    }
  }

  return [...ids]
}
