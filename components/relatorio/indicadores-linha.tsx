import { Fragment } from 'react'
import { Numero, RotuloIndicador } from '@/components/ui/texto'
import { SeparadorVertical } from '@/components/ui/separador-vertical'

export type IndicadorItem = {
  valor: string
  rotulo: string
}

type IndicadoresLinhaProps = {
  itens: IndicadorItem[]
}

/** Quatro números em linha, sem caixa — só fio vertical entre eles. */
export function IndicadoresLinha({ itens }: IndicadoresLinhaProps) {
  return (
    <div className="flex flex-wrap items-start gap-x-24 gap-y-32 lg:flex-nowrap">
      {itens.map((item, index) => (
        <Fragment key={item.rotulo}>
          {index > 0 && <SeparadorVertical className="min-h-[72px]" />}
          <div>
            <Numero tamanho={64}>{item.valor}</Numero>
            <RotuloIndicador>{item.rotulo}</RotuloIndicador>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
