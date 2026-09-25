import type { Intervalo } from '@/lib/utils/date'
import { nomeParaSlug } from '@/lib/utils/slug'
import { queryStringDeParams } from './filtros-demandas'

export function queryPeriodo(intervalo: Intervalo): Record<string, string> {
  return { de: intervalo.de, ate: intervalo.ate }
}

export function hrefRelatorio(
  chave: string,
  caminho: string,
  params: Record<string, string>
): string {
  const qs = queryStringDeParams(params)
  return `/r/${chave}${caminho}${qs ? `?${qs}` : ''}`
}

export function hrefVisaoGeral(chave: string, intervalo: Intervalo): string {
  return hrefRelatorio(chave, '', queryPeriodo(intervalo))
}

export function hrefPessoa(chave: string, slug: string, intervalo: Intervalo): string {
  return hrefRelatorio(chave, `/pessoa/${slug}`, queryPeriodo(intervalo))
}

export function hrefImprimirTime(chave: string, intervalo: Intervalo): string {
  return hrefRelatorio(chave, '/imprimir', queryPeriodo(intervalo))
}

export function hrefImprimirPessoa(
  chave: string,
  slug: string,
  intervalo: Intervalo
): string {
  return hrefRelatorio(chave, `/imprimir/pessoa/${slug}`, queryPeriodo(intervalo))
}

/** Download do PDF gerado no servidor (`?pessoa=` opcional). */
export function hrefPdfRelatorio(
  chave: string,
  intervalo: Intervalo,
  slugPessoa?: string
): string {
  const params = { ...queryPeriodo(intervalo) }
  if (slugPessoa) params.pessoa = slugPessoa
  return hrefRelatorio(chave, '/pdf', params)
}

export function normalizarSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const [key, val] of Object.entries(searchParams)) {
    if (val === undefined) continue
    out[key] = Array.isArray(val) ? val[0] : val
  }
  return out
}

export function slugPessoaAtual(nome: string | null): string | undefined {
  return nome ? nomeParaSlug(nome) : undefined
}
