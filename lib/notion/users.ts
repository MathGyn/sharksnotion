import { unstable_cache } from 'next/cache'
import { Client } from '@notionhq/client'

export interface PerfilNotion {
  id: string
  nome: string
  avatarUrl: string | null
}

function normalizarNome(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR')
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}

/** Associa nomes da esteira a perfis do workspace (nome exato ou primeiro nome). */
export function mapaAvatarPorNome(
  perfis: PerfilNotion[],
  nomesEsteira: string[]
): Record<string, string | null> {
  const mapa: Record<string, string | null> = {}

  for (const nome of nomesEsteira) {
    mapa[nome] = resolverAvatarUrl(nome, perfis)
  }

  return mapa
}

export function resolverAvatarUrl(nome: string, perfis: PerfilNotion[]): string | null {
  const chave = normalizarNome(nome)
  if (!chave) return null

  const exato = perfis.find((p) => normalizarNome(p.nome) === chave)
  if (exato?.avatarUrl) return exato.avatarUrl

  const porPrimeiro = perfis.find(
    (p) => normalizarNome(primeiroNome(p.nome)) === chave
  )
  return porPrimeiro?.avatarUrl ?? null
}

async function fetchPerfisNotion(): Promise<PerfilNotion[]> {
  if (!process.env.NOTION_TOKEN) return []

  const client = new Client({ auth: process.env.NOTION_TOKEN })
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
  revalidate: 3600,
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
