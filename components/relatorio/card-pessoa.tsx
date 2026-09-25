import Link from 'next/link'
import { AvatarPessoa } from '@/components/ui/avatar-pessoa'
import { Bloco } from '@/components/ui/bloco'
import { Numero, Texto } from '@/components/ui/texto'
import {
  formatarPercentualNoPrazo,
  rotuloPercentualEntregasNoPrazoCurto,
} from '@/lib/relatorio/formatadores'
import type { ResultadoPercentualNoPrazo } from '@/lib/relatorio/indicadores'
import { cn } from '@/lib/utils/cn'

type CardPessoaProps = {
  href: string
  nome: string
  passagens: number
  demandas: number
  emAbertoAgora: number
  percentualNoPrazo: ResultadoPercentualNoPrazo
  destaque: boolean
  pessoasReferencia: string[]
  fotoUrl?: string | null
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0 flex-1 px-16 first:pl-0 last:pr-0">
      <p className="mb-6 text-12 leading-texto text-marinho-fumo">{rotulo}</p>
      <p className="truncate text-14 font-medium tabular-nums text-marinho">{valor}</p>
    </div>
  )
}

export function CardPessoa({
  href,
  nome,
  passagens,
  demandas,
  emAbertoAgora,
  percentualNoPrazo,
  destaque,
  pessoasReferencia,
  fotoUrl,
}: CardPessoaProps) {
  return (
    <Link href={href} className="group block h-full">
      <Bloco
        variant={destaque ? 'destaque' : 'padrao'}
        className={cn(
          'flex h-full flex-col p-24 transition-[border-color,transform] duration-120 motion-reduce:transition-none',
          'motion-safe:group-hover:-translate-y-4',
          destaque
            ? 'motion-safe:group-hover:border-marinho-fumo'
            : 'motion-safe:group-hover:border-marinho-fumo'
        )}
      >
        <div className="mb-24 flex items-start justify-between gap-16">
          <div className="flex min-w-0 items-center gap-12">
            <AvatarPessoa
              nome={nome}
              pessoasReferencia={pessoasReferencia}
              fotoUrl={fotoUrl}
              destaque={destaque}
            />
            <Texto as="span" tamanho={16} className="truncate font-medium">
              {nome}
            </Texto>
          </div>
          <div className="shrink-0 text-right">
            <Numero tamanho={64} className="block leading-none">
              {passagens}
            </Numero>
            <Texto as="p" tamanho={12} tom="secundario" className="mt-4">
              passagens
            </Texto>
          </div>
        </div>

        <div className="mt-auto flex border-t border-linha pt-16">
          <Metrica rotulo="demandas" valor={String(demandas)} />
          <div className="w-px shrink-0 bg-linha" aria-hidden />
          <Metrica rotulo="em aberto" valor={String(emAbertoAgora)} />
          <div className="w-px shrink-0 bg-linha" aria-hidden />
          <Metrica
            rotulo={rotuloPercentualEntregasNoPrazoCurto}
            valor={formatarPercentualNoPrazo(percentualNoPrazo)}
          />
        </div>
      </Bloco>
    </Link>
  )
}
