import type { Intervalo } from '@/lib/utils/date'
import { opcoesPresetPeriodo } from './periodo'

/** Preferência de período escolhida pelo usuário (cookie). */
export const PERIODO_PREFERENCIA_MAX_AGE_S = 12 * 60 * 60

export const PERIODO_PREFERENCIA_COOKIE = 'sharks-relatorio-periodo'

export function pathCookieRelatorio(chave: string): string {
  return `/r/${chave}`
}

export function parseValorCookiePeriodo(raw: string | undefined): Intervalo | null {
  if (!raw) return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const [de, ate] = decoded.split('|')
  if (
    !de ||
    !ate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(de) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(ate)
  ) {
    return null
  }
  return { de, ate }
}

export function serializarValorCookiePeriodo(intervalo: Intervalo): string {
  return encodeURIComponent(`${intervalo.de}|${intervalo.ate}`)
}

/** Grava preferência no navegador; `null` apaga (volta ao padrão “este mês”). */
export function gravarPreferenciaPeriodoCliente(
  chave: string,
  intervalo: Intervalo | null
): void {
  const path = pathCookieRelatorio(chave)
  const base = `Path=${path}; SameSite=Lax`
  if (!intervalo) {
    document.cookie = `${PERIODO_PREFERENCIA_COOKIE}=; ${base}; Max-Age=0`
    return
  }
  document.cookie = `${PERIODO_PREFERENCIA_COOKIE}=${serializarValorCookiePeriodo(intervalo)}; ${base}; Max-Age=${PERIODO_PREFERENCIA_MAX_AGE_S}`
}

export function intervaloEquivaleEsteMes(
  intervalo: Intervalo,
  referencia: Date = new Date()
): boolean {
  const este = opcoesPresetPeriodo(referencia).find((p) => p.id === 'este-mes')
  if (!este) return false
  return intervalo.de === este.intervalo.de && intervalo.ate === este.intervalo.ate
}
