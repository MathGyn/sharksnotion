import { CardPessoa } from './card-pessoa'
import type { CardPessoaAgregado } from '@/lib/relatorio/agregacoes'

type GradeCardsPessoaProps = {
  cards: CardPessoaAgregado[]
  hrefPorSlug: (slug: string) => string
  pessoasReferencia: string[]
  avatarsPorNome?: Record<string, string | null>
}

export function GradeCardsPessoa({
  cards,
  hrefPorSlug,
  pessoasReferencia,
  avatarsPorNome = {},
}: GradeCardsPessoaProps) {
  return (
    <div className="grid grid-cols-1 gap-24 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <CardPessoa
          key={card.slug}
          href={hrefPorSlug(card.slug)}
          nome={card.nome}
          passagens={card.passagens}
          demandas={card.demandas}
          emAbertoAgora={card.emAbertoAgora}
          percentualNoPrazo={card.percentualNoPrazo}
          destaque={card.destaque}
          pessoasReferencia={pessoasReferencia}
          fotoUrl={avatarsPorNome[card.nome] ?? null}
        />
      ))}
    </div>
  )
}
