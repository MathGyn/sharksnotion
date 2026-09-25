import type { Movimentacao } from '@/lib/notion/types'

function normalizarStatus(status: string): string {
  return status.trim().toLocaleLowerCase('pt-BR')
}

/** Vezes em que o status entrou em Ajustes vindo de outro status. */
export function contarRetrabalho(
  demandaId: string,
  movimentacoes: Movimentacao[]
): number {
  const movs = movimentacoes
    .filter((m) => m.demandaId === demandaId)
    .sort((a, b) => a.quando.localeCompare(b.quando))

  let count = 0
  let statusAnterior: string | null = null

  for (const mov of movs) {
    const status = normalizarStatus(mov.status)
    if (status === 'ajustes' && statusAnterior !== null && statusAnterior !== 'ajustes') {
      count += 1
    }
    statusAnterior = status
  }

  return count
}
