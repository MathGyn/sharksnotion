import type { Movimentacao } from '@/lib/notion/types'
import { diferencaEmHoras } from '@/lib/utils/date'
import { resolverNomePessoa } from './classificacao'
import { estaNoIntervalo, type Intervalo } from '@/lib/utils/date'

export interface Passagem {
  demandaId: string
  para: string
  pessoa: string | null
  entrada: string
  saida: string | null
  duracaoHoras: number | null
}

function ordenarMovimentacoes(movs: Movimentacao[]): Movimentacao[] {
  return [...movs].sort((a, b) => a.quando.localeCompare(b.quando))
}

function mesmoPara(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
}

export function calcularPassagensDeDemanda(
  demandaId: string,
  movimentacoes: Movimentacao[],
  pessoasDerivadas: string[]
): Passagem[] {
  const movs = ordenarMovimentacoes(
    movimentacoes.filter((m) => m.demandaId === demandaId)
  )

  if (movs.length === 0) return []

  const passagens: Passagem[] = []
  let i = 0

  while (i < movs.length) {
    const paraAtual = movs[i].para
    const entrada = movs[i].quando
    i += 1

    while (i < movs.length && mesmoPara(movs[i].para, paraAtual)) {
      i += 1
    }

    const saida = i < movs.length ? movs[i].quando : null
    const duracaoHoras =
      saida !== null ? diferencaEmHoras(entrada, saida) : null

    passagens.push({
      demandaId,
      para: paraAtual,
      pessoa: resolverNomePessoa(paraAtual, pessoasDerivadas),
      entrada,
      saida,
      duracaoHoras,
    })
  }

  return passagens
}

export function calcularTodasPassagens(
  movimentacoes: Movimentacao[],
  pessoasDerivadas: string[]
): Passagem[] {
  const ids = [...new Set(movimentacoes.map((m) => m.demandaId).filter(Boolean))] as string[]

  return ids.flatMap((id) =>
    calcularPassagensDeDemanda(id, movimentacoes, pessoasDerivadas)
  )
}

export function passagensFechadas(passagens: Passagem[]): Passagem[] {
  return passagens.filter((p) => p.saida !== null && p.duracaoHoras !== null)
}

export function passagemTerminouNoIntervalo(
  passagem: Passagem,
  intervalo: Intervalo
): boolean {
  if (!passagem.saida) return false
  return estaNoIntervalo(passagem.saida, intervalo)
}

export function mediaHorasPassagensPessoa(
  passagens: Passagem[],
  nomePessoa: string
): number | null {
  const fechadas = passagensFechadas(passagens).filter(
    (p) => p.pessoa !== null && p.pessoa.toLowerCase() === nomePessoa.toLowerCase()
  )

  if (fechadas.length === 0) return null

  const total = fechadas.reduce((acc, p) => acc + (p.duracaoHoras ?? 0), 0)
  return total / fechadas.length
}
