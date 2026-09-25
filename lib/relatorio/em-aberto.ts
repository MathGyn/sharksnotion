import type { Demanda, Movimentacao } from '@/lib/notion/types'
import { isPessoa, resolverNomePessoa } from './classificacao'
import { derivarPessoasDosPara } from './classificacao'

function normalizarStatus(status: string): string {
  return status.trim().toLocaleLowerCase('pt-BR')
}

/** Nem concluído nem cancelado (status ou etapa atual). */
export function demandaEmAberto(demanda: Demanda): boolean {
  const status = normalizarStatus(demanda.status)
  if (status.startsWith('concluído')) return false
  if (status.includes('cancel')) return false

  const etapa = normalizarStatus(demanda.estaComAtual)
  if (etapa.startsWith('concluído')) return false
  if (etapa === 'cancelados') return false

  return true
}

export function contarEmAbertoHoje(demandas: Demanda[]): number {
  return demandas.filter(demandaEmAberto).length
}

export function contarEmAbertoComPessoa(demandas: Demanda[], nomePessoa: string): number {
  const alvo = nomePessoa.trim().toLocaleLowerCase('pt-BR')
  return demandas.filter((d) => {
    if (!demandaEmAberto(d)) return false
    return d.estaComAtual.trim().toLocaleLowerCase('pt-BR') === alvo
  }).length
}

export function filaAtualPorPessoa(
  demandas: Demanda[],
  movimentacoes: Movimentacao[]
): { nome: string; total: number }[] {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const mapa = new Map<string, number>()

  for (const d of demandas) {
    if (!demandaEmAberto(d)) continue
    if (!isPessoa(d.estaComAtual)) continue
    const nome = resolverNomePessoa(d.estaComAtual, pessoas)
    if (!nome) continue
    mapa.set(nome, (mapa.get(nome) ?? 0) + 1)
  }

  return [...mapa.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
}
