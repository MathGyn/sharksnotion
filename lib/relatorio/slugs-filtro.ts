import { SEM_TIPO, SEM_VINCULO } from './constantes'
import { nomeParaSlug } from '@/lib/utils/slug'

export const SLUG_SEM_VINCULO = 'sem-vinculo'

export function departamentoParaSlug(departamento: string): string {
  if (departamento === SEM_VINCULO) return SLUG_SEM_VINCULO
  return nomeParaSlug(departamento)
}

export function resolverDepartamentoPorSlug(
  slug: string,
  departamentosConhecidos: string[]
): string | null {
  const alvo = slug.toLowerCase()
  if (alvo === SLUG_SEM_VINCULO) return SEM_VINCULO
  return (
    departamentosConhecidos.find((d) => departamentoParaSlug(d) === alvo) ?? null
  )
}

export function tipoConteudoParaSlug(tipo: string): string {
  if (tipo === SEM_TIPO) return nomeParaSlug(SEM_TIPO)
  return nomeParaSlug(tipo)
}

export function resolverTipoPorSlug(slug: string, tiposConhecidos: string[]): string | null {
  const alvo = slug.toLowerCase()
  return tiposConhecidos.find((t) => tipoConteudoParaSlug(t) === alvo) ?? null
}

export function listarDepartamentosConhecidos(
  solicitacoes: { departamento: string | null }[]
): string[] {
  const set = new Set<string>()
  for (const s of solicitacoes) {
    if (s.departamento) set.add(s.departamento)
  }
  set.add(SEM_VINCULO)
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function listarTiposConhecidos(demandas: { tipoConteudo: string | null }[]): string[] {
  const set = new Set<string>()
  for (const d of demandas) {
    set.add(d.tipoConteudo ?? SEM_TIPO)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
