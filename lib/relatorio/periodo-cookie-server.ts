import { cookies } from 'next/headers'
import type { Intervalo } from '@/lib/utils/date'
import {
  PERIODO_PREFERENCIA_COOKIE,
  parseValorCookiePeriodo,
} from './periodo-preferencia'

export function lerIntervaloPreferenciaCookie(): Intervalo | null {
  const raw = cookies().get(PERIODO_PREFERENCIA_COOKIE)?.value
  return parseValorCookiePeriodo(raw)
}
