export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Bloco } from '@/components/ui/bloco'
import { Container } from '@/components/ui/container'
import { Texto } from '@/components/ui/texto'
import { AvisosNotion } from '@/components/relatorio/avisos-notion'
import { CabecalhoRelatorio } from '@/components/relatorio/cabecalho-relatorio'
import { ContadorEntregas } from '@/components/relatorio/contador-entregas'
import { ListasContagemExpansivel } from '@/components/relatorio/listas-contagem-expansivel'
import { ObservacoesPessoa } from '@/components/relatorio/observacoes-pessoa'
import { PainelExclusoesDemanda } from '@/components/relatorio/painel-exclusoes-demanda'
import { CabecalhoPessoa, ResumoPessoa } from '@/components/relatorio/resumo-pessoa'
import { demandaIdsExcluirParaPessoa, pessoasIguais } from '@/lib/relatorio/exclusoes-demanda'
import { NavegacaoPessoas } from '@/components/relatorio/navegacao-pessoas'
import {
  entregasPorPessoaNoIntervalo,
  montarRelatorioVisaoPessoa,
} from '@/lib/relatorio/agregacoes'
import { carregarContextoRelatorioCached } from '@/lib/relatorio/contexto-relatorio-cache'
import { contarEmAbertoComPessoa } from '@/lib/relatorio/em-aberto'
import { subtituloVisaoPessoa } from '@/lib/relatorio/formatadores'
import { rotuloMesAnoPorExtenso } from '@/lib/relatorio/periodo'
import { presetsPeriodoParaUi } from '@/lib/relatorio/presets-ui'
import { registrosPessoaNoPeriodo } from '@/lib/relatorio/registros-pessoa'
import { mediaTempoPessoaNoIntervaloEmDias } from '@/lib/relatorio/tempo'
import { getMesAnoAtualSP } from '@/lib/utils/date'
import { nomeParaSlug, resolverPessoaPorSlug } from '@/lib/utils/slug'
import { normalizarSearchParams } from '@/lib/relatorio/url-relatorio'

type PageProps = {
  params: { chave: string; slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function RelatorioPessoaPage({ params, searchParams }: PageProps) {
  const sp = normalizarSearchParams(searchParams)
  const ctx = await carregarContextoRelatorioCached(params.chave, sp)
  const intervalo = ctx.periodo.intervalo
  const nomesNoPeriodo = entregasPorPessoaNoIntervalo(
    ctx.movimentacoes,
    intervalo,
    ctx.demandas,
    ctx.exclusoesDemanda,
  ).map((l) => l.nome)
  // Sem passagem no período a página ainda abre — é onde se lança a contagem do mês novo.
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
    ctx.exclusoesDemanda,
  )

  const nomesNav = nomesNoPeriodo.some((n) => pessoasIguais(n, nomePessoa))
    ? nomesNoPeriodo
    : [...nomesNoPeriodo, nomePessoa]
  const pessoasNav = nomesNav.map((nome) => ({ nome, slug: nomeParaSlug(nome) }))

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

  const registros = registrosPessoaNoPeriodo(
    ctx.contagensEntregas,
    ctx.observacoesPessoa,
    nomePessoa,
    intervalo,
  )
  const mesRef = registros.mesReferencia
  const rotuloMes = mesRef ? rotuloMesAnoPorExtenso(mesRef) : ctx.periodo.rotulo

  return (
    <Container className="pb-96">
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
        pessoaAtual={nomePessoa}
        pessoas={pessoasNav}
      />

      <CabecalhoPessoa
        nome={relatorio.nome}
        rotuloPeriodo={relatorio.periodo.rotulo}
        pessoasReferencia={ctx.pessoasReferencia}
        fotoUrl={ctx.avatarsPorNome[nomePessoa]}
        emAbertoAgora={contarEmAbertoComPessoa(ctx.demandas, nomePessoa)}
      />

      <section aria-label="Resumo do período" className="mb-24">
        <ResumoPessoa
          indicadores={relatorio.indicadores}
          tempoMedioDias={mediaTempoPessoaNoIntervaloEmDias(
            ctx.movimentacoes,
            nomePessoa,
            intervalo,
          )}
          contador={
            <ContadorEntregas
              key={`${nomePessoa}-${mesRef ?? intervalo.de}`}
              chaveRelatorio={params.chave}
              pessoaNome={nomePessoa}
              mesAno={mesRef}
              rotuloMes={rotuloMes}
              valorInicial={registros.contagemMes?.quantidade ?? 0}
              registroPageIdInicial={registros.contagemMes?.registroPageId}
              totalPeriodo={registros.totalEntregas}
              ehMesAtual={mesRef === getMesAnoAtualSP()}
            />
          }
        />
      </section>

      <section className="mb-24" aria-label="O que foi entregue">
        <Bloco className="p-32">
          <Texto tamanho={16} className="font-medium">
            O que foi entregue
          </Texto>
          <Texto tamanho={14} tom="secundario" className="mb-24">
            {subtituloVisaoPessoa(relatorio.nome)} Clique numa linha para ver as demandas.
          </Texto>
          <ListasContagemExpansivel
            chaveRelatorio={params.chave}
            chavePeriodoResolvido={`${intervalo.de}|${intervalo.ate}`}
            slugPessoa={params.slug}
            nomePessoa={nomePessoa}
            paraQuem={relatorio.paraQuem}
            tipoMaterial={relatorio.tipoMaterial}
            comBarras
          />
        </Bloco>
      </section>

      <section aria-label="Observações do período">
        <ObservacoesPessoa
          key={`${nomePessoa}-${intervalo.de}-${intervalo.ate}`}
          chaveRelatorio={params.chave}
          pessoaNome={nomePessoa}
          mesAno={mesRef}
          rotuloMes={rotuloMes}
          observacoesIniciais={registros.observacoes}
        />
      </section>

      <PainelExclusoesDemanda
        chaveRelatorio={params.chave}
        pessoaNome={nomePessoa}
        itens={itensExcluidos}
      />
    </Container>
  )
}
