export interface ExclusaoDemandaRelatorio {
  demandaId: string
  pessoaNome: string
  /** Página na base Movimentações (tipo Exclusão do relatório). */
  registroPageId?: string
}

export function pessoasIguais(a: string, b: string): boolean {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0
}

export function demandaIdsExcluirParaPessoa(
  exclusoes: ExclusaoDemandaRelatorio[],
  pessoaNome: string
): Set<string> {
  return new Set(
    exclusoes.filter((e) => pessoasIguais(e.pessoaNome, pessoaNome)).map((e) => e.demandaId)
  )
}

export function filtrarDemandaIdsExcluidas(
  ids: string[],
  demandaIdsExcluir?: ReadonlySet<string>
): string[] {
  if (!demandaIdsExcluir || demandaIdsExcluir.size === 0) return ids
  return ids.filter((id) => !demandaIdsExcluir.has(id))
}
