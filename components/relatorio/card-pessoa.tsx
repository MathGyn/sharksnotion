import Link from 'next/link'
import { AvatarPessoa } from '@/components/ui/avatar-pessoa'
import { Bloco } from '@/components/ui/bloco'
import { Numero, Texto } from '@/components/ui/texto'
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
  semMovimentacaoNoPeriodo?: boolean
  pessoasReferencia: string[]
  fotoUrl?: string | null
}

function MetricaPrincipal({
  valor,
  rotulo,
  tamanhoNumero,
  textoSecundario,
  tomNumero = 'principal',
  classNameNumero,
}: {
  valor: string | number
  rotulo: string
  tamanhoNumero: 26 | 64
  textoSecundario: string
  tomNumero?: 'principal' | 'secundario'
  classNameNumero?: string
}) {
  return (
    <div className="min-w-0">
      <Numero
        tamanho={tamanhoNumero}
        tom={tomNumero}
        className={cn('block leading-none', classNameNumero)}
      >
        {valor}
      </Numero>
      <Texto as="p" tamanho={14} className={cn('mt-4', textoSecundario)}>
        {rotulo}
      </Texto>
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
  semMovimentacaoNoPeriodo = false,
  pessoasReferencia,
  fotoUrl,
}: CardPessoaProps) {
  const textoSecundario = destaque ? 'text-marinho' : 'text-marinho-fumo'
  const linha = destaque ? 'border-areia-clara' : 'border-linha'

  const temPercentual = percentualNoPrazo.tipo === 'percentual'
  const valorPercentual =
    percentualNoPrazo.tipo === 'percentual' ? `${percentualNoPrazo.valor}%` : '—'
  const rotuloPercentual = temPercentual ? 'entregas no prazo' : 'sem prazo definido'

  return (
    <Link
      href={href}
      className={cn(
        'group block h-full transition-opacity duration-120 motion-reduce:transition-none',
        semMovimentacaoNoPeriodo && 'opacity-45 hover:opacity-70'
      )}
    >
      <Bloco
        variant={destaque ? 'destaque' : 'padrao'}
        className={cn(
          'flex h-full flex-col p-24 transition-[border-color,transform] duration-120 motion-reduce:transition-none',
          'motion-safe:group-hover:-translate-y-4 motion-safe:group-hover:border-marinho-fumo',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-marinho'
        )}
      >
        <div className="mb-20 flex min-w-0 items-center gap-12">
          <AvatarPessoa
            nome={nome}
            pessoasReferencia={pessoasReferencia}
            fotoUrl={fotoUrl}
            destaque={destaque}
          />
          <Texto as="span" tamanho={16} className="min-w-0 truncate font-medium">
            {nome}
          </Texto>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-0">
          <MetricaPrincipal
            valor={demandas}
            rotulo="demandas entregues"
            tamanhoNumero={64}
            textoSecundario={textoSecundario}
          />
          <MetricaPrincipal
            valor={valorPercentual}
            rotulo={rotuloPercentual}
            tamanhoNumero={26}
            textoSecundario={textoSecundario}
            tomNumero={temPercentual ? 'principal' : 'secundario'}
            classNameNumero={!temPercentual && destaque ? 'text-marinho' : undefined}
          />
        </div>

        <dl className={cn('mt-16 grid grid-cols-2 gap-x-16 gap-y-0 border-t pt-12', linha)}>
          <div>
            <dd>
              <Numero tamanho={20} className="leading-none">
                {emAbertoAgora}
              </Numero>
            </dd>
            <dt className={cn('mt-4 text-14 leading-texto', textoSecundario)}>em aberto agora</dt>
          </div>
          <div>
            <dd>
              <Numero tamanho={20} className="leading-none">
                {passagens}
              </Numero>
            </dd>
            <dt className={cn('mt-4 text-14 leading-texto', textoSecundario)}>
              passagens no período
            </dt>
          </div>
        </dl>
      </Bloco>
    </Link>
  )
}
