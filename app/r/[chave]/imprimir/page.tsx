import { Container, GridRelatorio } from '@/components/ui/container'
import { Texto } from '@/components/ui/texto'
import { CabecalhoRelatorio } from '@/components/relatorio/cabecalho-relatorio'
import { GradeCardsPessoa } from '@/components/relatorio/grade-cards-pessoa'
import { IndicadoresLinha } from '@/components/relatorio/indicadores-linha'
import { ListaContagemEstatica } from '@/components/relatorio/lista-contagem-estatica'
import { carregarContextoRelatorio } from '@/lib/relatorio/contexto-relatorio'
import { montarRelatorioVisaoTime } from '@/lib/relatorio/agregacoes'
import { tituloEntregasPeriodo } from '@/lib/relatorio/formatadores'
import { indicadoresTimeParaUi } from '@/lib/relatorio/indicadores-ui'
import { hrefPessoa, normalizarSearchParams } from '@/lib/relatorio/url-relatorio'

type PageProps = {
  params: { chave: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ImprimirTimePage({ params, searchParams }: PageProps) {
  const sp = normalizarSearchParams(searchParams)
  const ctx = await carregarContextoRelatorio(sp)
  const relatorio = montarRelatorioVisaoTime(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    ctx.periodo
  )
  const intervalo = ctx.periodo.intervalo

  return (
    <Container className="print:max-w-none">
      <CabecalhoRelatorio
        chave={params.chave}
        rotuloPeriodo={ctx.periodo.rotulo}
        intervalo={intervalo}
        presets={[]}
        mostrarControles={false}
      />

      <Texto as="p" tamanho={16} className="mb-32 text-26 font-semibold leading-titulo tracking-titulo">
        {tituloEntregasPeriodo(relatorio.periodo.rotulo)}
      </Texto>

      <div className="mb-64 break-inside-avoid">
        <IndicadoresLinha itens={indicadoresTimeParaUi(relatorio.indicadores)} />
      </div>

      <section className="mb-64 break-inside-avoid" aria-label="Entregas por pessoa">
        <GradeCardsPessoa
          cards={relatorio.cardsPessoa}
          pessoasReferencia={ctx.pessoasReferencia}
          hrefPorSlug={(slug) => hrefPessoa(params.chave, slug, intervalo)}
        />
      </section>

      <GridRelatorio className="mb-48 break-inside-avoid">
        <div className="col-span-12 md:col-span-6">
          <ListaContagemEstatica titulo="Para quem" itens={relatorio.paraQuem} />
        </div>
        <div className="col-span-12 md:col-span-6">
          <ListaContagemEstatica
            titulo="Tipo de material"
            itens={relatorio.tipoMaterial}
          />
        </div>
      </GridRelatorio>
    </Container>
  )
}
