import { notFound } from 'next/navigation'
import { Container, GridRelatorio } from '@/components/ui/container'
import { Texto } from '@/components/ui/texto'
import { CabecalhoRelatorio } from '@/components/relatorio/cabecalho-relatorio'
import { IndicadoresLinha } from '@/components/relatorio/indicadores-linha'
import { ListaContagemEstatica } from '@/components/relatorio/lista-contagem-estatica'
import {
  entregasPorPessoaNoIntervalo,
  montarRelatorioVisaoPessoa,
} from '@/lib/relatorio/agregacoes'
import { carregarContextoRelatorio } from '@/lib/relatorio/contexto-relatorio'
import { tituloPessoaPeriodo } from '@/lib/relatorio/formatadores'
import { indicadoresPessoaParaUi } from '@/lib/relatorio/indicadores-ui'
import { resolverPessoaPorSlug } from '@/lib/utils/slug'
import { normalizarSearchParams } from '@/lib/relatorio/url-relatorio'

type PageProps = {
  params: { chave: string; slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ImprimirPessoaPage({ params, searchParams }: PageProps) {
  const sp = normalizarSearchParams(searchParams)
  const ctx = await carregarContextoRelatorio(sp)
  const intervalo = ctx.periodo.intervalo
  const nomesNoPeriodo = entregasPorPessoaNoIntervalo(
    ctx.movimentacoes,
    intervalo,
    ctx.demandas
  ).map((l) => l.nome)
  const nomePessoa = resolverPessoaPorSlug(params.slug, nomesNoPeriodo)

  if (!nomePessoa) {
    notFound()
  }

  const relatorio = montarRelatorioVisaoPessoa(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    ctx.periodo,
    nomePessoa
  )
  return (
    <Container className="print:max-w-none">
      <CabecalhoRelatorio
        chave={params.chave}
        rotuloPeriodo={ctx.periodo.rotulo}
        intervalo={intervalo}
        presets={[]}
        mostrarControles={false}
        slugPessoa={params.slug}
      />

      <Texto as="p" tamanho={16} className="mb-32 text-26 font-semibold leading-titulo tracking-titulo">
        {tituloPessoaPeriodo(relatorio.nome, relatorio.periodo.rotulo)}
      </Texto>

      <div className="mb-64 break-inside-avoid">
        <IndicadoresLinha itens={indicadoresPessoaParaUi(relatorio.indicadores)} />
      </div>

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
