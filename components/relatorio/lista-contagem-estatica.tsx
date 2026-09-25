import type { ItemContagem } from '@/lib/relatorio/agregacoes'
import { Texto } from '@/components/ui/texto'

type ListaContagemEstaticaProps = {
  titulo: string
  itens: ItemContagem[]
}

export function ListaContagemEstatica({ titulo, itens }: ListaContagemEstaticaProps) {
  return (
    <div>
      <Texto tamanho={16} className="mb-16 font-medium">
        {titulo}
      </Texto>
      <ul>
        {itens.map((item) => (
          <li
            key={item.nome}
            className="flex items-baseline justify-between gap-16 border-b border-linha py-12"
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
