import type { HistoricoMovimentacaoItem } from '@/lib/relatorio/detalhe-demanda'
import { Texto } from '@/components/ui/texto'
import { cn } from '@/lib/utils/cn'

type HistoricoDemandaProps = {
  vazioAntiguidade: boolean
  itens: HistoricoMovimentacaoItem[]
  /** Linhas menores, para uso dentro da lista expandida. */
  compacto?: boolean
}

export function HistoricoDemanda({ vazioAntiguidade, itens, compacto = false }: HistoricoDemandaProps) {
  const tamanho = compacto ? 12 : 14

  if (vazioAntiguidade) {
    return (
      <Texto tamanho={tamanho} tom="secundario">
        Esta demanda é anterior ao registro de movimentações
      </Texto>
    )
  }

  if (itens.length === 0) {
    return (
      <Texto tamanho={tamanho} tom="secundario">
        Nenhuma movimentação registrada.
      </Texto>
    )
  }

  return (
    <ul className={cn(!compacto && 'divide-y divide-linha border-t border-linha')}>
      {itens.map((item, index) => (
        <li
          key={item.movimentacaoId || `${item.quando}-${index}`}
          className={cn(
            'flex flex-wrap items-baseline justify-between',
            compacto ? 'gap-8 py-4 text-12' : 'gap-16 py-16 text-14'
          )}
        >
          <span className="font-archivo-normal tabular-nums text-marinho-fumo">
            {item.quandoFormatado}
          </span>
          <div className="min-w-0 flex-1 text-right text-marinho">
            <span>{item.para}</span>
            <span className="text-marinho-fumo"> · {item.status}</span>
            {item.duracaoPassagemDias !== null && (
              <span className={cn('text-12 text-marinho-fumo', compacto ? 'ml-8' : 'block')}>
                {item.duracaoPassagemDias.toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                {compacto ? 'dias' : 'dias nesta passagem'}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
