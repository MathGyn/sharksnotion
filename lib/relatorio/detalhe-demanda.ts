import type { DataISO, Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import { formatarDataHoraBR, horasParaDiasUmaCasa } from '@/lib/utils/date'
import { derivarPessoasDosPara } from './classificacao'
import { obterInstanteConclusao } from './conclusoes'
import type { SituacaoLista } from './filtros-demandas'
import { obterPessoaQueEntregou } from './pessoa-entrega'
import { calcularPassagensDeDemanda } from './passagens'
import { SEM_VINCULO } from './constantes'
import { estaNoPrazo } from '@/lib/utils/date'

export const INICIO_REGISTRO_MOVIMENTACOES: DataISO = '2026-09-21'

export interface SolicitacaoResumo {
  titulo: string
  departamento: string
  unidade: string | null
  solicitante: string[]
  dataSolicitacao: DataISO | null
  prazoDesejado: DataISO | null
}

export interface HistoricoMovimentacaoItem {
  movimentacaoId: string
  quando: string
  quandoFormatado: string
  para: string
  status: string
  duracaoPassagemDias: number | null
}

export interface DetalheDemanda {
  id: string
  titulo: string
  tipoConteudo: string
  urgencia: string
  departamento: string
  unidade: string | null
  solicitante: string[]
  prazo: DataISO | null
  instanteConclusao: string | null
  situacao: SituacaoLista
  pessoaEntrega: string | null
  notionUrl: string
  solicitacao: SolicitacaoResumo | null
  historicoVazioPorAntiguidade: boolean
  historico: HistoricoMovimentacaoItem[]
}

function situacaoDemanda(
  demanda: Demanda,
  movimentacoes: Movimentacao[]
): SituacaoLista {
  if (!demanda.precisaEntregarAte) return 'sem prazo'
  const instante = obterInstanteConclusao(demanda, movimentacoes)
  if (!instante) return 'sem prazo'
  return estaNoPrazo(instante, demanda.precisaEntregarAte) ? 'no prazo' : 'atraso'
}

export function montarDetalheDemanda(
  demandaId: string,
  demandas: Demanda[],
  solicitacoes: Solicitacao[],
  movimentacoes: Movimentacao[]
): DetalheDemanda | null {
  const demanda = demandas.find((d) => d.id === demandaId)
  if (!demanda) return null

  const sol = demanda.solicitacaoDeOrigemId
    ? solicitacoes.find((s) => s.id === demanda.solicitacaoDeOrigemId) ?? null
    : null

  const movs = movimentacoes
    .filter((m) => m.demandaId === demandaId)
    .sort((a, b) => a.quando.localeCompare(b.quando))

  const historicoVazioPorAntiguidade =
    movs.length === 0 &&
    (demanda.criadoEm.slice(0, 10) < INICIO_REGISTRO_MOVIMENTACOES ||
      (demanda.dataDeEntrega !== null &&
        demanda.dataDeEntrega < INICIO_REGISTRO_MOVIMENTACOES))

  const pessoas = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const passagens = calcularPassagensDeDemanda(demandaId, movimentacoes, pessoas)

  const historico: HistoricoMovimentacaoItem[] = movs.map((m) => {
    const passagemEncerrada = passagens.find((p) => p.saida === m.quando)
    const duracao =
      passagemEncerrada?.duracaoHoras != null
        ? horasParaDiasUmaCasa(passagemEncerrada.duracaoHoras)
        : null

    return {
      movimentacaoId: m.id,
      quando: m.quando,
      quandoFormatado: formatarDataHoraBR(m.quando),
      para: m.para,
      status: m.status,
      duracaoPassagemDias: duracao,
    }
  })

  return {
    id: demanda.id,
    titulo: demanda.solicitacao,
    tipoConteudo: demanda.tipoConteudo ?? 'Sem tipo',
    urgencia: demanda.urgencia ?? '—',
    departamento: sol?.departamento ?? SEM_VINCULO,
    unidade: sol?.unidade ?? null,
    solicitante: sol?.solicitante ?? [],
    prazo: demanda.precisaEntregarAte,
    instanteConclusao: obterInstanteConclusao(demanda, movimentacoes),
    situacao: situacaoDemanda(demanda, movimentacoes),
    pessoaEntrega: obterPessoaQueEntregou(demanda, movimentacoes),
    notionUrl: demanda.notionUrl,
    solicitacao: sol
      ? {
          titulo: sol.titulo,
          departamento: sol.departamento ?? '—',
          unidade: sol.unidade,
          solicitante: sol.solicitante,
          dataSolicitacao: sol.dataDaSolicitacao,
          prazoDesejado: sol.prazoDesejado,
        }
      : null,
    historicoVazioPorAntiguidade,
    historico,
  }
}
