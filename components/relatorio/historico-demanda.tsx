import type { HistoricoMovimentacaoItem } from '@/lib/relatorio/detalhe-demanda'
import { Texto } from '@/components/ui/texto'

type HistoricoDemandaProps = {
  vazioAntiguidade: boolean
  itens: HistoricoMovimentacaoItem[]
}

export function HistoricoDemanda({ vazioAntiguidade, itens }: HistoricoDemandaProps) {
  if (vazioAntiguidade) {
    return (
      <Texto tom="secundario">Esta demanda é anterior ao registro de movimentações</Texto>
    )
  }

  if (itens.length === 0) {
    return <Texto tom="secundario">Nenhuma movimentação registrada.</Texto>
  }

  return (
    <ul className="divide-y divide-linha border-t border-linha">
      {itens.map((item, index) => (
        <li
          key={item.movimentacaoId || `${item.quando}-${index}`}
          className="flex flex-wrap items-baseline justify-between gap-16 py-16"
        >
          <span className="font-archivo-normal tabular-nums text-14 text-marinho-fumo">
            {item.quandoFormatado}
          </span>
          <div className="min-w-0 flex-1 text-right text-14 text-marinho">
            <span>{item.para}</span>
            <span className="text-marinho-fumo"> · {item.status}</span>
            {item.duracaoPassagemDias !== null && (
              <span className="block text-12 text-marinho-fumo">
                {item.duracaoPassagemDias.toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                dias nesta passagem
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
