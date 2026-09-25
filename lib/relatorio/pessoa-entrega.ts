import type { Demanda, Movimentacao } from '@/lib/notion/types'
import { derivarPessoasDosPara, isPessoa, resolverNomePessoa } from './classificacao'
import { obterInstanteConclusao } from './conclusoes'

/**
 * Última pessoa (não etapa) que esteve com o card antes da conclusão,
 * percorrendo o histórico de trás para frente a partir do instante de conclusão.
 */
export function obterPessoaQueEntregou(
  demanda: Demanda,
  movimentacoes: Movimentacao[]
): string | null {
  const instanteConclusao = obterInstanteConclusao(demanda, movimentacoes)
  if (!instanteConclusao) return null

  const movs = movimentacoes
    .filter((m) => m.demandaId === demanda.id)
    .filter((m) => m.quando.localeCompare(instanteConclusao) <= 0)
    .sort((a, b) => a.quando.localeCompare(b.quando))

  if (movs.length === 0) return null

  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))

  for (let i = movs.length - 1; i >= 0; i -= 1) {
    const para = movs[i].para
    if (!isPessoa(para)) continue
    return resolverNomePessoa(para, pessoas)
  }

  return null
}

export const ROTULO_PESSOA_NAO_REGISTRADA = 'Não registrado'
