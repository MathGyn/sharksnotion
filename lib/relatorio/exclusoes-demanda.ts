export interface ExclusaoDemandaRelatorio {
  demandaId: string
  pessoaNome: string
  /** Página na base Movimentações (tipo Exclusão do relatório). */
  registroPageId?: string
}

export function pessoasIguais(a: string, b: string): boolean {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0
}

function chaveExclusaoDemanda(e: ExclusaoDemandaRelatorio): string {
  return `${e.demandaId}|${e.pessoaNome.toLocaleLowerCase('pt-BR')}`
}

/**
 * Várias páginas "Exclusão do relatório" no Notion para o mesmo par demanda+pessoa
 * geram duplicata na UI. Mantém uma entrada; prefere a que tem registroPageId (restaurar).
 */
export function deduplicarExclusoesDemanda(
  exclusoes: ExclusaoDemandaRelatorio[]
): ExclusaoDemandaRelatorio[] {
  const porChave = new Map<string, ExclusaoDemandaRelatorio>()
  for (const e of exclusoes) {
    const chave = chaveExclusaoDemanda(e)
    const atual = porChave.get(chave)
    if (!atual) {
      porChave.set(chave, e)
      continue
    }
    if (!atual.registroPageId && e.registroPageId) {
      porChave.set(chave, e)
    }
  }
  return [...porChave.values()]
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
