export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { Texto } from '@/components/ui/texto'
import { AvisosNotion } from '@/components/relatorio/avisos-notion'
import { CabecalhoRelatorio } from '@/components/relatorio/cabecalho-relatorio'
import { IndicadoresLinha } from '@/components/relatorio/indicadores-linha'
import { ListasContagemExpansivel } from '@/components/relatorio/listas-contagem-expansivel'
import { PainelExclusoesDemanda } from '@/components/relatorio/painel-exclusoes-demanda'
import {
  demandaIdsExcluirParaPessoa,
  pessoasIguais,
} from '@/lib/relatorio/exclusoes-demanda'
import { NavegacaoPessoas } from '@/components/relatorio/navegacao-pessoas'
import {
  entregasPorPessoaNoIntervalo,
  montarRelatorioVisaoPessoa,
} from '@/lib/relatorio/agregacoes'
import { carregarContextoRelatorioCached } from '@/lib/relatorio/contexto-relatorio-cache'
import { subtituloVisaoPessoa, tituloPessoaPeriodo } from '@/lib/relatorio/formatadores'
import { indicadoresPessoaParaUi } from '@/lib/relatorio/indicadores-ui'
import { presetsPeriodoParaUi } from '@/lib/relatorio/presets-ui'
import { nomeParaSlug, resolverPessoaPorSlug } from '@/lib/utils/slug'
import { normalizarSearchParams } from '@/lib/relatorio/url-relatorio'

type PageProps = {
  params: { chave: string; slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function RelatorioPessoaPage({ params, searchParams }: PageProps) {
  const sp = normalizarSearchParams(searchParams)
  const ctx = await carregarContextoRelatorioCached(sp)
  const intervalo = ctx.periodo.intervalo
  const nomesNoPeriodo = entregasPorPessoaNoIntervalo(
    ctx.movimentacoes,
    intervalo,
    ctx.demandas,
    ctx.exclusoesDemanda
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
    nomePessoa,
    ctx.exclusoesDemanda
  )

  const pessoasNav = nomesNoPeriodo.map((nome) => ({
    nome,
    slug: nomeParaSlug(nome),
  }))

  const idsExcluidos = demandaIdsExcluirParaPessoa(ctx.exclusoesDemanda, nomePessoa)
  const itensExcluidos = ctx.exclusoesDemanda
    .filter((e) => pessoasIguais(e.pessoaNome, nomePessoa))
    .map((e) => {
      const d = ctx.demandas.find((x) => x.id === e.demandaId)
      return {
        demandaId: e.demandaId,
        titulo: d?.solicitacao ?? e.demandaId,
        registroPageId: e.registroPageId,
      }
    })
    .filter((item) => idsExcluidos.has(item.demandaId))

  return (
    <Container>
      <CabecalhoRelatorio
        chave={params.chave}
        rotuloPeriodo={ctx.periodo.rotulo}
        intervalo={intervalo}
        presets={presetsPeriodoParaUi()}
        slugPessoa={params.slug}
      />

      <AvisosNotion avisos={ctx.avisosNotion} />

      <NavegacaoPessoas
        chave={params.chave}
        intervalo={intervalo}
        pessoaAtual={nomePessoa}
        pessoas={pessoasNav}
      />

      <Texto as="p" tamanho={16} className="mb-8 text-26 font-semibold leading-titulo tracking-titulo">
        {tituloPessoaPeriodo(relatorio.nome, relatorio.periodo.rotulo)}
      </Texto>
      <Texto as="p" tamanho={14} tom="secundario" className="mb-32">
        {subtituloVisaoPessoa(relatorio.nome)}
      </Texto>

      <div className="mb-64">
        <IndicadoresLinha itens={indicadoresPessoaParaUi(relatorio.indicadores)} />
      </div>

      <ListasContagemExpansivel
        chaveRelatorio={params.chave}
        slugPessoa={params.slug}
        nomePessoa={nomePessoa}
        paraQuem={relatorio.paraQuem}
        tipoMaterial={relatorio.tipoMaterial}
      />

      <PainelExclusoesDemanda
        chaveRelatorio={params.chave}
        pessoaNome={nomePessoa}
        itens={itensExcluidos}
      />
    </Container>
  )
}
