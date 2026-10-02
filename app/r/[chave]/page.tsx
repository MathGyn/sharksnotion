export const dynamic = 'force-dynamic'
import { Container } from '@/components/ui/container'
import { Texto } from '@/components/ui/texto'
import { AvisosNotion } from '@/components/relatorio/avisos-notion'
import { CabecalhoRelatorio } from '@/components/relatorio/cabecalho-relatorio'
import { GradeCardsPessoa } from '@/components/relatorio/grade-cards-pessoa'
import { IndicadoresLinha } from '@/components/relatorio/indicadores-linha'
import { BlocosVisaoTimeSection } from '@/components/relatorio/blocos-visao-time'
import { ListasContagemExpansivel } from '@/components/relatorio/listas-contagem-expansivel'
import { carregarContextoRelatorioCached } from '@/lib/relatorio/contexto-relatorio-cache'
import { montarRelatorioVisaoTime } from '@/lib/relatorio/agregacoes'
import { notaDuplaContagemTime, tituloEntregasPeriodo } from '@/lib/relatorio/formatadores'
import { indicadoresTimeParaUi } from '@/lib/relatorio/indicadores-ui'
import { presetsPeriodoParaUi } from '@/lib/relatorio/presets-ui'
import { hrefPessoa, normalizarSearchParams } from '@/lib/relatorio/url-relatorio'

type PageProps = {
  params: { chave: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function RelatorioTimePage({ params, searchParams }: PageProps) {
  const sp = normalizarSearchParams(searchParams)
  const ctx = await carregarContextoRelatorioCached(params.chave, sp)
  const relatorio = montarRelatorioVisaoTime(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    ctx.periodo,
    ctx.exclusoesDemanda
  )
  const intervalo = ctx.periodo.intervalo

  return (
    <Container>
      <CabecalhoRelatorio
        chave={params.chave}
        rotuloPeriodo={ctx.periodo.rotulo}
        intervalo={intervalo}
        presets={presetsPeriodoParaUi()}
      />

      <AvisosNotion avisos={ctx.avisosNotion} />

      <Texto as="p" tamanho={16} className="mb-32 text-26 font-semibold leading-titulo tracking-titulo">
        {tituloEntregasPeriodo(relatorio.periodo.rotulo)}
      </Texto>

      <div className="mb-64">
        <IndicadoresLinha itens={indicadoresTimeParaUi(relatorio.indicadores)} />
      </div>

      <Texto as="p" tamanho={14} tom="secundario" className="mb-16">
        {notaDuplaContagemTime()}
      </Texto>

      <section className="mb-64" aria-label="Passagens por pessoa">
        <GradeCardsPessoa
          cards={relatorio.cardsPessoa}
          pessoasReferencia={ctx.pessoasReferencia}
          avatarsPorNome={ctx.avatarsPorNome}
          hrefPorSlug={(slug) => hrefPessoa(params.chave, slug)}
        />
      </section>

      <BlocosVisaoTimeSection blocos={relatorio.blocos} />

      <ListasContagemExpansivel
        chaveRelatorio={params.chave}
        chavePeriodoResolvido={`${intervalo.de}|${intervalo.ate}`}
        paraQuem={relatorio.paraQuem}
        tipoMaterial={relatorio.tipoMaterial}
        mostrarParaQuem={relatorio.mostrarParaQuem}
      />
    </Container>
  )
}
