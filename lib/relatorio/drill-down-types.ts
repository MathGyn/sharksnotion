import type { HistoricoMovimentacaoItem } from './detalhe-demanda'

/** Resposta leve do drill (lista expandida no client). */
export interface DetalheDemandaInline {
  id: string
  historicoVazioPorAntiguidade: boolean
  historico: HistoricoMovimentacaoItem[]
  notionUrl: string
}
