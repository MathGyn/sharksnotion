import { AvatarPessoa } from '@/components/ui/avatar-pessoa'
import { Bloco } from '@/components/ui/bloco'
import { Numero, Texto } from '@/components/ui/texto'
import type { IndicadoresPessoa } from '@/lib/relatorio/agregacoes'
import { formatarDias } from '@/lib/relatorio/formatadores'

type CabecalhoPessoaProps = {
  nome: string
  rotuloPeriodo: string
  pessoasReferencia: string[]
  fotoUrl?: string | null
  emAbertoAgora: number
}

export function CabecalhoPessoa({
  nome,
  rotuloPeriodo,
  pessoasReferencia,
  fotoUrl,
  emAbertoAgora,
}: CabecalhoPessoaProps) {
  return (
    <div className="mb-32 flex flex-wrap items-center justify-between gap-24">
      <div className="flex min-w-0 items-center gap-16">
        <AvatarPessoa nome={nome} pessoasReferencia={pessoasReferencia} fotoUrl={fotoUrl} />
        <div className="min-w-0">
          <h1 className="truncate text-40 font-semibold leading-titulo tracking-titulo">{nome}</h1>
          <Texto tamanho={14} tom="secundario" className="first-letter:uppercase">
            {rotuloPeriodo}
          </Texto>
        </div>
      </div>
      <div className="inline-flex items-center gap-8 rounded-pill border border-linha bg-branco px-16 py-8">
        <span
          className={`h-[8px] w-[8px] rounded-pill ${emAbertoAgora > 0 ? 'bg-areia' : 'bg-linha'}`}
          aria-hidden
        />
        <Texto as="span" tamanho={14}>
          <span className="font-archivo-expanded tabular-nums">{emAbertoAgora}</span>{' '}
          {emAbertoAgora === 1 ? 'demanda em aberto agora' : 'demandas em aberto agora'}
        </Texto>
      </div>
    </div>
  )
}

function Metrica({
  valor,
  rotulo,
  dica,
  tom = 'principal',
  children,
}: {
  valor: string
  rotulo: string
  dica: string
  tom?: 'principal' | 'secundario'
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col p-16" title={dica}>
      <Texto as="span" tamanho={14} tom="secundario">
        {rotulo}
      </Texto>
      <Numero tamanho={48} tom={tom} className="mt-8 block leading-none">
        {valor}
      </Numero>
      {children}
    </div>
  )
}

type ResumoPessoaProps = {
  indicadores: IndicadoresPessoa
  tempoMedioDias: number | null
  /** Célula da contagem manual (client component). */
  contador: React.ReactNode
}

/** Contagem manual + números automáticos da Esteira num único bloco. */
export function ResumoPessoa({ indicadores, tempoMedioDias, contador }: ResumoPessoaProps) {
  const pct = indicadores.percentualNoPrazo
  const temPercentual = pct.tipo === 'percentual'
  const valorPct = pct.tipo === 'percentual' ? pct.valor : 0

  return (
    <Bloco className="p-16">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {contador}

        <Metrica
          valor={String(indicadores.demandas)}
          rotulo="Demandas entregues"
          dica="Demandas distintas que passaram pela pessoa e saíram no período."
        />

        <Metrica
          valor={temPercentual ? `${valorPct}%` : '—'}
          rotulo="No prazo"
          tom={temPercentual ? 'principal' : 'secundario'}
          dica="Das entregas com prazo definido, quantas saíram até a data."
        >
          <div
            className="mt-12 h-[4px] w-full overflow-hidden rounded-pill bg-linha"
            role="img"
            aria-label={
              temPercentual ? `${valorPct}% das entregas no prazo` : 'Nenhuma entrega com prazo'
            }
          >
            <div className="h-full rounded-pill bg-no-prazo" style={{ width: `${valorPct}%` }} />
          </div>
        </Metrica>

        <Metrica
          valor={String(indicadores.passagens)}
          rotulo="Passagens"
          dica="Quantas vezes uma demanda passou pelas mãos da pessoa e seguiu adiante no período."
        />
      </div>

      <dl className="mx-16 mt-8 flex flex-wrap gap-x-24 gap-y-4 border-t border-linha pb-4 pt-12 text-14">
        <div className="flex gap-4" title="Média de tempo que cada demanda ficou com a pessoa.">
          <dt className="text-marinho-fumo">Tempo médio com a pessoa</dt>
          <dd className="font-medium tabular-nums">{formatarDias(tempoMedioDias)}</dd>
        </div>
        <div className="flex gap-4" title="Vezes em que as demandas voltaram para retrabalho.">
          <dt className="text-marinho-fumo">Ajustes (idas e voltas)</dt>
          <dd className="font-medium tabular-nums">{indicadores.ajustes}</dd>
        </div>
        <div className="ml-auto text-12 text-marinho-fumo">
          Entregas lançadas são manuais; o resto vem da Esteira.
        </div>
      </dl>
    </Bloco>
  )
}
