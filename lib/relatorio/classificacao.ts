const ETAPAS_NOMES_EXATOS = new Set(['não iniciado', 'aprovação', 'cancelados'])

function normalizarChave(valor: string): string {
  return valor.trim().toLocaleLowerCase('pt-BR')
}

/** Etapas do kanban — única fonte de verdade (seção 7). */
export function isEtapa(para: string): boolean {
  const chave = normalizarChave(para)
  if (ETAPAS_NOMES_EXATOS.has(chave)) return true
  if (chave.startsWith('concluído')) return true
  return false
}

export function isPessoa(para: string): boolean {
  const trimmed = para.trim()
  return trimmed.length > 0 && !isEtapa(trimmed)
}

/** Lista pessoas distintas derivadas dos dados (comparação sem maiúsculas). */
export function derivarPessoasDosPara(valoresPara: string[]): string[] {
  const porChave = new Map<string, string>()

  for (const para of valoresPara) {
    if (!isPessoa(para)) continue
    const chave = normalizarChave(para)
    if (!porChave.has(chave)) {
      porChave.set(chave, para.trim())
    }
  }

  return [...porChave.values()].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  )
}

/** Resolve para o nome canônico já visto nos dados (ex.: MATHEUS → Matheus). */
export function resolverNomePessoa(para: string, pessoasDerivadas: string[]): string | null {
  if (!isPessoa(para)) return null
  const chave = normalizarChave(para)
  const encontrada = pessoasDerivadas.find((p) => normalizarChave(p) === chave)
  return encontrada ?? para.trim()
}
