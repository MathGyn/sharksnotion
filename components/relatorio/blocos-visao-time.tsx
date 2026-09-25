import type { BlocosVisaoTime } from '@/lib/relatorio/agregacoes'
import { Texto } from '@/components/ui/texto'
import { cn } from '@/lib/utils/cn'

type BlocosVisaoTimeProps = {
  blocos: BlocosVisaoTime
}

function ListaContagemCompacta({ titulo, itens }: { titulo: string; itens: { nome: string; total: number }[] }) {
  if (itens.length === 0) {
    return (
      <div>
        <Texto tamanho={16} className="mb-12 font-medium">
          {titulo}
        </Texto>
        <Texto tom="secundario">Nenhum item no recorte.</Texto>
      </div>
    )
  }

  return (
    <div>
      <Texto tamanho={16} className="mb-12 font-medium">
        {titulo}
      </Texto>
      <ul>
        {itens.map((item) => (
          <li
            key={item.nome}
            className="flex items-baseline justify-between gap-12 border-b border-linha py-10 last:border-b-0"
          >
            <span className="text-14 text-marinho">{item.nome}</span>
            <span className="font-archivo-expanded tabular-nums text-16 text-marinho">
              {item.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BlocosVisaoTimeSection({ blocos }: BlocosVisaoTimeProps) {
  const { entradasSaidas, porUrgencia, filaPorPessoa } = blocos
  const filaCresce = entradasSaidas.saldo > 0

  return (
    <div className="mb-64 grid grid-cols-12 gap-32">
      <div className="col-span-12 md:col-span-4">
        <Texto tamanho={16} className="mb-12 font-medium">
          Entradas e saídas
        </Texto>
        <div className="space-y-8 text-14">
          <div className="flex justify-between gap-12">
            <Texto tom="secundario">Entraram no período</Texto>
            <span className="font-archivo-expanded tabular-nums">{entradasSaidas.entraram}</span>
          </div>
          <div className="flex justify-between gap-12">
            <Texto tom="secundario">Saíram (concluídas)</Texto>
            <span className="font-archivo-expanded tabular-nums">{entradasSaidas.sairam}</span>
          </div>
          <div
            className={cn(
              'flex justify-between gap-12 border-t border-linha pt-12',
              filaCresce && 'font-medium text-marinho'
            )}
          >
            <span>Saldo</span>
            <span className="font-archivo-expanded tabular-nums">
              {entradasSaidas.saldo > 0 ? '+' : ''}
              {entradasSaidas.saldo}
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4">
        <ListaContagemCompacta titulo="Por urgência" itens={porUrgencia} />
      </div>

      <div className="col-span-12 md:col-span-4">
        <ListaContagemCompacta titulo="Fila atual por pessoa" itens={filaPorPessoa} />
      </div>
    </div>
  )
}
