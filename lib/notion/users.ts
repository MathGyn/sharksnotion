import { unstable_cache } from 'next/cache'
import { criarClienteNotion } from './client'

export interface PerfilNotion {
  id: string
  nome: string
  avatarUrl: string | null
}

function normalizarNome(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR')
}

function partesNome(nome: string): string[] {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => normalizarNome(parte))
}

/** 0 = nome completo, 1 = sobrenome, 2 = primeiro nome. */
function rankCorrespondencia(nomeEsteira: string, perfil: PerfilNotion): number | null {
  const chave = normalizarNome(nomeEsteira)
  if (!chave) return null

  const partes = partesNome(perfil.nome)
  if (partes.length === 0) return null
  if (partes.join(' ') === chave) return 0
  if (partes.slice(1).includes(chave)) return 1
  if (partes[0] === chave) return 2
  return null
}

/**
 * Associa nomes da esteira a perfis do workspace.
 * Sobrenome ganha do primeiro nome, e cada perfil entra em um card só —
 * assim "Perdigão" fica com Guilherme Perdigão e "Guilherme" com o outro Guilherme.
 */
export function mapaAvatarPorNome(
  perfis: PerfilNotion[],
  nomesEsteira: string[]
): Record<string, string | null> {
  const mapa: Record<string, string | null> = {}
  const usados = new Set<string>()
  const pares: { nome: string; perfil: PerfilNotion; rank: number }[] = []

  for (const nome of nomesEsteira) {
    for (const perfil of perfis) {
      const rank = rankCorrespondencia(nome, perfil)
      if (rank === null) continue
      pares.push({ nome, perfil, rank })
    }
  }

  pares.sort(
    (a, b) =>
      a.rank - b.rank || a.perfil.nome.localeCompare(b.perfil.nome, 'pt-BR')
  )

  for (const par of pares) {
    if (par.nome in mapa || usados.has(par.perfil.id)) continue
    mapa[par.nome] = par.perfil.avatarUrl
    usados.add(par.perfil.id)
  }

  for (const nome of nomesEsteira) {
    if (!(nome in mapa)) mapa[nome] = null
  }

  return mapa
}

export function resolverAvatarUrl(nome: string, perfis: PerfilNotion[]): string | null {
  return mapaAvatarPorNome(perfis, [nome])[nome] ?? null
}

async function fetchPerfisNotion(): Promise<PerfilNotion[]> {
  if (!process.env.NOTION_TOKEN) return []

  const client = criarClienteNotion()
  const perfis: PerfilNotion[] = []
  let cursor: string | undefined

  try {
    do {
      const response = await client.users.list({ start_cursor: cursor, page_size: 100 })

      for (const user of response.results) {
        if (user.type !== 'person') continue
        const nome = user.name?.trim()
        if (!nome) continue
        perfis.push({
          id: user.id,
          nome,
          avatarUrl: user.avatar_url ?? null,
        })
      }

      cursor = response.next_cursor ?? undefined
    } while (cursor)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[dev] Não foi possível listar usuários do Notion para avatares.', error)
      return []
    }
    throw error
  }

  return perfis
}

const perfisCached = unstable_cache(fetchPerfisNotion, ['notion-workspace-users'], {
  revalidate: 60,
  tags: ['notion', 'notion-users'],
})

export async function fetchPerfisWorkspace(): Promise<PerfilNotion[]> {
  return perfisCached()
}

export async function fetchAvatarsPorNome(
  nomesEsteira: string[]
): Promise<Record<string, string | null>> {
  const perfis = await fetchPerfisWorkspace()
  return mapaAvatarPorNome(perfis, nomesEsteira)
}
