import type { Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import { format } from 'date-fns'
import {
  dataISOToInstanteConclusao,
  diferencaEmHoras,
  horasParaDiasUmaCasa,
  parseISOToSaoPaulo,
} from '@/lib/utils/date'
import { obterInstanteConclusao } from './conclusoes'
import {
  calcularTodasPassagens,
  mediaHorasPassagensPessoa,
  passagemTerminouNoIntervalo,
  passagensFechadas,
} from './passagens'
import { derivarPessoasDosPara } from './classificacao'
import type { Intervalo } from '@/lib/utils/date'

export function calcularLeadTimeHoras(
  demanda: Demanda,
  solicitacao: Solicitacao | null,
  movimentacoes: Movimentacao[]
): number | null {
  if (!solicitacao) return null

  const inicio = solicitacao.dataDaSolicitacao
    ? dataISOToInstanteConclusao(solicitacao.dataDaSolicitacao)
    : solicitacao.criadoEm

  const fim = obterInstanteConclusao(demanda, movimentacoes)
  if (!fim) return null

  return diferencaEmHoras(inicio, fim)
}

export function leadTimeEmDias(
  demanda: Demanda,
  solicitacao: Solicitacao | null,
  movimentacoes: Movimentacao[]
): number | null {
  const horas = calcularLeadTimeHoras(demanda, solicitacao, movimentacoes)
  if (horas === null) return null
  return horasParaDiasUmaCasa(horas)
}

export function mediaTempoComPessoaEmDias(
  movimentacoes: Movimentacao[],
  nomePessoa: string
): number | null {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const passagens = calcularTodasPassagens(movimentacoes, pessoas)
  const mediaHoras = mediaHorasPassagensPessoa(passagens, nomePessoa)
  if (mediaHoras === null) return null
  return horasParaDiasUmaCasa(mediaHoras)
}

/** Tempo médio (dias) que a pessoa ficou com a demanda, passagens encerradas no intervalo. */
export function mediaTempoPessoaNoIntervaloEmDias(
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): number | null {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const passagens = calcularTodasPassagens(movimentacoes, pessoas)
  const alvo = nomePessoa.toLocaleLowerCase('pt-BR')
  const noIntervalo = passagensFechadas(passagens).filter(
    (p) =>
      p.pessoa !== null &&
      p.pessoa.toLocaleLowerCase('pt-BR') === alvo &&
      passagemTerminouNoIntervalo(p, intervalo)
  )
  if (noIntervalo.length === 0) return null
  const mediaHoras =
    noIntervalo.reduce((acc, p) => acc + (p.duracaoHoras ?? 0), 0) / noIntervalo.length
  return horasParaDiasUmaCasa(mediaHoras)
}

export function entregasPessoaNoIntervalo(
  movimentacoes: Movimentacao[],
  nomePessoa: string,
  intervalo: Intervalo
): number {
  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const passagens = calcularTodasPassagens(movimentacoes, pessoas)

  return passagens.filter(
    (p) =>
      p.pessoa !== null &&
      p.pessoa.toLocaleLowerCase('pt-BR') === nomePessoa.toLocaleLowerCase('pt-BR') &&
      passagemTerminouNoIntervalo(p, intervalo)
  ).length
}

export function formatarInstanteParaDataISO(instante: string): string {
  return format(parseISOToSaoPaulo(instante), 'yyyy-MM-dd')
}
