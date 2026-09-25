export function nomeParaSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
}

export function resolverPessoaPorSlug(
  slug: string,
  nomes: string[]
): string | null {
  const alvo = slug.toLowerCase()
  return nomes.find((n) => nomeParaSlug(n) === alvo) ?? null
}
