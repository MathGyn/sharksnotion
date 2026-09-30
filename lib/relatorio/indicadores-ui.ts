import type { IndicadorItem } from '@/components/relatorio/indicadores-linha'
import type { IndicadoresPessoa, IndicadoresTime } from './agregacoes'
import { formatarPercentualNoPrazo, rotuloPercentualEntregasNoPrazo } from './formatadores'

export function indicadoresTimeParaUi(ind: IndicadoresTime): IndicadorItem[] {
  return [
    { valor: String(ind.concluidas), rotulo: 'concluídas no período' },
    { valor: String(ind.entraram), rotulo: 'entraram no período' },
    { valor: String(ind.emAbertoHoje), rotulo: 'em aberto hoje' },
    {
      valor: formatarPercentualNoPrazo(ind.percentualNoPrazo),
      rotulo: rotuloPercentualEntregasNoPrazo,
    },
  ]
}

/** Contagem manual (página da pessoa) — entra primeiro no relatório impresso/PDF. */
export function indicadorEntregasManuais(total: number): IndicadorItem {
  return { valor: String(total), rotulo: 'entregas lançadas' }
}

export function indicadoresPessoaParaUi(ind: IndicadoresPessoa): IndicadorItem[] {
  return [
    { valor: String(ind.passagens), rotulo: 'passagens' },
    { valor: String(ind.demandas), rotulo: 'demandas entregues' },
    {
      valor: formatarPercentualNoPrazo(ind.percentualNoPrazo),
      rotulo: rotuloPercentualEntregasNoPrazo,
    },
  ]
}
