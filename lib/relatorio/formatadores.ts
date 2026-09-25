import { formatarDataHoraBR, formatarDataISOBR } from '@/lib/utils/date'
import type { ResultadoPercentualNoPrazo } from './indicadores'
import { SEM_TIPO } from './constantes'
import type { DemandaListagemItem, SituacaoLista } from './filtros-demandas'

export function tituloEntregasPeriodo(rotuloPeriodo: string): string {
  return `Entregas · ${rotuloPeriodo}`
}

export function tituloPessoaPeriodo(nome: string, rotuloPeriodo: string): string {
  return `${nome} · ${rotuloPeriodo}`
}

/** Rótulo nos indicadores grandes (topo da página). */
export const rotuloPercentualEntregasNoPrazo = 'entregas feitas no prazo'

/** Rótulo compacto nos cards da grade. */
export const rotuloPercentualEntregasNoPrazoCurto = 'entregas no prazo'

export function formatarPercentualNoPrazo(r: ResultadoPercentualNoPrazo): string {
  if (r.tipo === 'sem prazo') return 'sem prazo'
  return `${r.valor}%`
}

export function formatarDias(valor: number | null): string {
  if (valor === null) return '—'
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dias`
}

export function formatarSituacaoLista(s: SituacaoLista): string {
  if (s === 'no prazo') return 'No prazo'
  if (s === 'atraso') return 'Atraso'
  return 'Sem prazo'
}

/** Data exibida à direita na lista (em vez de só “No prazo” / “Atraso”). */
export function rotuloDataListaDemanda(item: DemandaListagemItem): string {
  if (item.instanteConclusao) {
    return formatarDataHoraBR(item.instanteConclusao)
  }
  if (item.precisaEntregarAte) {
    return `Prazo ${formatarDataISOBR(item.precisaEntregarAte)}`
  }
  return 'Sem prazo'
}

export function formatarConclusaoLista(instante: string | null): string {
  if (!instante) return '—'
  return formatarDataHoraBR(instante)
}

export function subtituloVisaoPessoa(nome: string): string {
  return `Demandas que passaram por ${nome} e saíram no período.`
}

export function notaDuplaContagemTime(): string {
  return 'Uma demanda que passou por mais de uma pessoa conta para cada uma.'
}

/** Tipo, quem entregou e conclusão — só campos preenchidos (para a lista expandida). */
export function partesMetadadosDemandaListagem(item: DemandaListagemItem): string[] {
  const partes: string[] = []

  const tipo = item.tipoConteudo?.trim()
  if (tipo && tipo !== SEM_TIPO && tipo !== 'Sem tipo') {
    partes.push(tipo)
  }

  const entregue = item.pessoaEntrega?.trim()
  if (entregue) {
    partes.push(entregue)
  }

  return partes
}
