import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
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
import {
  indicadorEntregasManuais,
  indicadoresPessoaParaUi,
} from '@/lib/relatorio/indicadores-ui'
import { registrosPessoaNoPeriodo } from '@/lib/relatorio/registros-pessoa'
import { formatarDataHoraBR } from '@/lib/utils/date'
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
    ctx.demandas,
    ctx.exclusoesDemanda
  ).map((l) => l.nome)
  const nomePessoa =
    resolverPessoaPorSlug(params.slug, nomesNoPeriodo) ??
    resolverPessoaPorSlug(params.slug, ctx.pessoasReferencia)

  if (!nomePessoa) {
    notFound()
  }

  const relatorio = montarRelatorioVisaoPessoa(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    ctx.periodo,
    nomePessoa,
    ctx.exclusoesDemanda
  )
  const registros = registrosPessoaNoPeriodo(
    ctx.contagensEntregas,
    ctx.observacoesPessoa,
    nomePessoa,
    intervalo
  )
  const observacoes = [...registros.observacoes].reverse()

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
        <IndicadoresLinha
          itens={[
            indicadorEntregasManuais(registros.totalEntregas),
            ...indicadoresPessoaParaUi(relatorio.indicadores),
          ]}
        />
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

      <section className="mb-48" aria-label="Observações">
        <Texto tamanho={16} className="mb-16 font-medium">
          Observações
        </Texto>
        {observacoes.length === 0 ? (
          <Texto tamanho={14} tom="secundario">
            Nenhuma observação registrada no período.
          </Texto>
        ) : (
          <ol className="space-y-16 border-l border-areia pl-16">
            {observacoes.map((o) => (
              <li key={o.id} className="break-inside-avoid">
                <Texto tamanho={12} tom="secundario">
                  {o.autor || 'Sem autor'} · {formatarDataHoraBR(o.criadoEm)}
                </Texto>
                <Texto tamanho={14} className="whitespace-pre-wrap">
                  {o.texto}
                </Texto>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Container>
  )
}
