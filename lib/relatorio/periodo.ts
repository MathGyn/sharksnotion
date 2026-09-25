import type { Demanda, Movimentacao } from '@/lib/notion/types'
import type { DataISO } from '@/lib/notion/types'
import {
  TIMEZONE,
  dataISOToDate,
  formatarDataISOBR,
  getMesAnoAtualSP,
  getMesAnoDeInstante,
  type Intervalo,
} from '@/lib/utils/date'
import { format, lastDayOfMonth, startOfMonth, subMonths } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { derivarPessoasDosPara } from './classificacao'
import { obterInstanteConclusao } from './conclusoes'
import { calcularTodasPassagens } from './passagens'

export type { DataISO, Intervalo }

export type PresetPeriodo =
  | 'este-mes'
  | 'mes-passado'
  | 'ultimos-3-meses'
  | 'este-ano'
  | 'personalizado'

export interface PeriodoResolvido {
  intervalo: Intervalo
  preset: PresetPeriodo | null
  rotulo: string
}

const MESES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

function referenciaSP(referencia?: Date): Date {
  return referencia ? toZonedTime(referencia, TIMEZONE) : toZonedTime(new Date(), TIMEZONE)
}

function toDataISO(d: Date): DataISO {
  return format(d, 'yyyy-MM-dd')
}

export function intervaloDeMesAno(mesAno: string): Intervalo {
  const [anoStr, mesStr] = mesAno.split('-')
  const ano = parseInt(anoStr, 10)
  const mes = parseInt(mesStr, 10)
  const inicio = startOfMonth(new Date(ano, mes - 1, 1))
  const fim = lastDayOfMonth(inicio)
  return { de: toDataISO(inicio), ate: toDataISO(fim) }
}

export function clampIntervaloSemFuturo(
  intervalo: Intervalo,
  referencia: Date = new Date()
): Intervalo {
  const hoje = toDataISO(referenciaSP(referencia))
  const ate = intervalo.ate > hoje ? hoje : intervalo.ate
  const de = intervalo.de > ate ? ate : intervalo.de
  return { de, ate }
}

export function formatarRotuloPeriodo(intervalo: Intervalo): string {
  const [y1, m1, d1] = intervalo.de.split('-').map(Number)
  const [y2, m2, d2] = intervalo.ate.split('-').map(Number)

  if (intervalo.de === intervalo.ate) {
    return `${d1} de ${MESES_PT[m1 - 1]} de ${y1}`
  }

  if (y1 === y2 && m1 === m2) {
    return `${d1} a ${d2} de ${MESES_PT[m1 - 1]} de ${y1}`
  }

  if (y1 === y2) {
    return `${d1} de ${MESES_PT[m1 - 1]} a ${d2} de ${MESES_PT[m2 - 1]} de ${y1}`
  }

  return `${formatarDataISOBR(intervalo.de)} a ${formatarDataISOBR(intervalo.ate)}`
}

function presetEsteMes(ref: Date): Intervalo {
  const z = referenciaSP(ref)
  const inicio = startOfMonth(z)
  const fim = lastDayOfMonth(z)
  return clampIntervaloSemFuturo(
    {
      de: toDataISO(inicio),
      ate: toDataISO(fim),
    },
    ref
  )
}

function presetMesPassado(ref: Date): Intervalo {
  const z = referenciaSP(ref)
  const alvo = subMonths(z, 1)
  const inicio = startOfMonth(alvo)
  const fim = lastDayOfMonth(alvo)
  return { de: toDataISO(inicio), ate: toDataISO(fim) }
}

function presetUltimos3Meses(ref: Date): Intervalo {
  const z = referenciaSP(ref)
  const fim = lastDayOfMonth(z)
  const inicio = startOfMonth(subMonths(z, 2))
  return clampIntervaloSemFuturo(
    {
      de: toDataISO(inicio),
      ate: toDataISO(fim),
    },
    ref
  )
}

function presetEsteAno(ref: Date): Intervalo {
  const z = referenciaSP(ref)
  const ano = z.getFullYear()
  return clampIntervaloSemFuturo({ de: `${ano}-01-01`, ate: `${ano}-12-31` }, ref)
}

export function opcoesPresetPeriodo(referencia: Date = new Date()): {
  id: PresetPeriodo
  rotulo: string
  intervalo: Intervalo
}[] {
  return [
    { id: 'este-mes', rotulo: 'Este mês', intervalo: presetEsteMes(referencia) },
    { id: 'mes-passado', rotulo: 'Mês passado', intervalo: presetMesPassado(referencia) },
    {
      id: 'ultimos-3-meses',
      rotulo: 'Últimos 3 meses',
      intervalo: presetUltimos3Meses(referencia),
    },
    { id: 'este-ano', rotulo: 'Este ano', intervalo: presetEsteAno(referencia) },
  ]
}

function intervaloPadraoComDado(
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  referencia: Date
): Intervalo {
  const meses = new Set<string>()
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const passagens = calcularTodasPassagens(movimentacoes, pessoas)

  for (const d of demandas) {
    const instante = obterInstanteConclusao(d, movimentacoes)
    if (instante) meses.add(getMesAnoDeInstante(instante))
  }
  for (const p of passagens) {
    if (p.saida) meses.add(getMesAnoDeInstante(p.saida))
  }

  const atual = getMesAnoAtualSP()
  const ordenados = [...meses].filter((m) => m <= atual).sort((a, b) => b.localeCompare(a))

  if (ordenados.length > 0) {
    return intervaloDeMesAno(ordenados[0])
  }

  return presetEsteMes(referencia)
}

export function resolverPeriodoConsulta(
  params: { de?: string; ate?: string; mes?: string },
  demandas: Demanda[],
  movimentacoes: Movimentacao[],
  referencia: Date = new Date()
): PeriodoResolvido {
  let intervalo: Intervalo
  let preset: PresetPeriodo | null = null

  if (params.mes && /^\d{4}-\d{2}$/.test(params.mes)) {
    intervalo = intervaloDeMesAno(params.mes)
  } else if (
    params.de &&
    params.ate &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.de) &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.ate)
  ) {
    intervalo = clampIntervaloSemFuturo({ de: params.de, ate: params.ate }, referencia)
    preset = 'personalizado'
  } else {
    intervalo = intervaloPadraoComDado(demandas, movimentacoes, referencia)
    preset = 'este-mes'
  }

  intervalo = clampIntervaloSemFuturo(intervalo, referencia)

  if (dataISOToDate(intervalo.de) > dataISOToDate(intervalo.ate)) {
    intervalo = { de: intervalo.ate, ate: intervalo.ate }
  }

  return {
    intervalo,
    preset,
    rotulo: formatarRotuloPeriodo(intervalo),
  }
}

export function intervaloFixo(de: DataISO, ate: DataISO): PeriodoResolvido {
  const intervalo = clampIntervaloSemFuturo({ de, ate }, new Date('2026-12-31'))
  return { intervalo, preset: 'personalizado', rotulo: formatarRotuloPeriodo(intervalo) }
}
