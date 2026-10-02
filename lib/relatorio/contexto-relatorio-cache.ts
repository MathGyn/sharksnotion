import { cache } from 'react'
import { carregarContextoRelatorio } from './contexto-relatorio'

/** Dedup por request (ex.: página + Suspense filho no mesmo render). */
export const carregarContextoRelatorioCached = cache(
  (chave: string, searchParams: Record<string, string | undefined> = {}) =>
    carregarContextoRelatorio(chave, searchParams)
)
