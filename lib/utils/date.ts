import { format, parseISO } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import type { DataISO } from '@/lib/notion/types'

export const TIMEZONE = 'America/Sao_Paulo'

export function getMesAnoAtualSP(): string {
  return format(toZonedTime(new Date(), TIMEZONE), 'yyyy-MM')
}

export function parseISOToSaoPaulo(isoString: string): Date {
  return toZonedTime(parseISO(isoString), TIMEZONE)
}

export function dataISOToDate(dataISO: DataISO): Date {
  return fromZonedTime(new Date(`${dataISO}T00:00:00`), TIMEZONE)
}

/** Instante usado quando só existe Data De entrega (meio-dia em São Paulo). */
export function dataISOToInstanteConclusao(dataISO: DataISO): string {
  return fromZonedTime(new Date(`${dataISO}T12:00:00`), TIMEZONE).toISOString()
}

export function getMesAnoDeInstante(isoString: string): string {
  const zoned = parseISOToSaoPaulo(isoString)
  return format(zoned, 'yyyy-MM')
}

export function getMesAnoDeDataISO(dataISO: DataISO): string {
  return dataISO.slice(0, 7)
}

export interface Intervalo {
  de: DataISO
  ate: DataISO
}

export function estaNoIntervalo(instanteISO: string, intervalo: Intervalo): boolean {
  const dia =
    instanteISO.length === 10
      ? instanteISO
      : format(toZonedTime(parseISO(instanteISO), TIMEZONE), 'yyyy-MM-dd')
  return dia >= intervalo.de && dia <= intervalo.ate
}

export function dataISOEstaNoIntervalo(data: DataISO, intervalo: Intervalo): boolean {
  return data >= intervalo.de && data <= intervalo.ate
}

export function estaDentroDoMes(instanteOuData: string, mesAno: string): boolean {
  if (instanteOuData.length === 10) {
    return instanteOuData.startsWith(mesAno)
  }
  return getMesAnoDeInstante(instanteOuData) === mesAno
}

export function estaNoPrazo(dataConclusaoIso: string, prazo: DataISO): boolean {
  const conclusaoDataISO = format(parseISOToSaoPaulo(dataConclusaoIso), 'yyyy-MM-dd')
  return conclusaoDataISO <= prazo
}

export function diferencaEmHoras(inicioIso: string, fimIso: string): number {
  const inicio = parseISO(inicioIso)
  const fim = parseISO(fimIso)
  return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
}

export function horasParaDiasUmaCasa(horas: number): number {
  return Math.round((horas / 24) * 10) / 10
}

export function formatarDataHoraBR(isoString: string): string {
  return format(parseISOToSaoPaulo(isoString), 'dd/MM/yyyy HH:mm')
}

export function formatarDataISOBR(dataISO: DataISO): string {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
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

export function getNomeMes(mesAno: string): string {
  const [ano, mes] = mesAno.split('-')
  const idx = parseInt(mes, 10) - 1
  return `${MESES_PT[idx]} de ${ano}`
}

/** Timestamp ISO às h/min no fuso de São Paulo (para testes e fixtures). */
export function instanteEmSaoPaulo(
  ano: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0
): string {
  return fromZonedTime(
    new Date(ano, mes - 1, dia, hora, minuto, 0),
    TIMEZONE
  ).toISOString()
}
