/** Hierarquia fixa dos cards de pessoa (antes do restante em ordem alfabética). */
export const ORDEM_HIERARQUIA_PESSOAS = [
  'Guilherme',
  'Thamara',
  'Perdigão',
  'Matheus',
  'Mizael',
  'Regiane',
] as const

function chaveNome(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR')
}

function indiceHierarquia(nome: string): number {
  const chave = chaveNome(nome)
  const idx = ORDEM_HIERARQUIA_PESSOAS.findIndex((n) => chaveNome(n) === chave)
  return idx === -1 ? ORDEM_HIERARQUIA_PESSOAS.length : idx
}

export function compararPessoaHierarquia(a: string, b: string): number {
  const ia = indiceHierarquia(a)
  const ib = indiceHierarquia(b)
  if (ia !== ib) return ia - ib
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
}

export function ordenarNomesHierarquia(nomes: string[]): string[] {
  return [...nomes].sort(compararPessoaHierarquia)
}

/** Único card em areia: Guilherme quando está na grade; senão o primeiro da hierarquia. */
export function marcarDestaqueCardPrincipal<T extends { nome: string }>(
  cards: T[]
): (T & { destaque: boolean })[] {
  if (cards.length === 0) return []

  const guilherme = cards.find((c) => chaveNome(c.nome) === chaveNome('Guilherme'))
  const nomeDestaque = guilherme?.nome ?? cards[0].nome

  return cards.map((c) => ({
    ...c,
    destaque: chaveNome(c.nome) === chaveNome(nomeDestaque),
  }))
}
