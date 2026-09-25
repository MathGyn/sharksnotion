import { renderToBuffer } from '@react-pdf/renderer'
import { formatInTimeZone } from 'date-fns-tz'
import {
  entregasPorPessoaNoIntervalo,
  montarRelatorioVisaoPessoa,
  montarRelatorioVisaoTime,
} from '@/lib/relatorio/agregacoes'
import { carregarContextoRelatorio } from '@/lib/relatorio/contexto-relatorio'
import { filtrosBaseVisaoPessoa } from '@/lib/relatorio/drill-down'
import {
  rotuloDataListaDemanda,
  tituloEntregasPeriodo,
  tituloPessoaPeriodo,
} from '@/lib/relatorio/formatadores'
import { listarDemandasFiltradas } from '@/lib/relatorio/filtros-demandas'
import {
  indicadoresPessoaParaUi,
  indicadoresTimeParaUi,
} from '@/lib/relatorio/indicadores-ui'
import { resolverPessoaPorSlug } from '@/lib/utils/slug'
import { DocumentoPessoaPdf } from './documento-pessoa'
import { DocumentoTimePdf } from './documento-time'
import { initEstilosPdf } from './estilos'
import { registrarFontesPdf } from './fontes'

function prepararAmbientePdf(): void {
  const { family } = registrarFontesPdf()
  initEstilosPdf(family)
}

function geradoEmLabel(): string {
  return formatInTimeZone(new Date(), 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm")
}

function slugArquivo(base: string): string {
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function gerarPdfRelatorioTime(
  searchParams: Record<string, string | undefined>
): Promise<{ buffer: Buffer; filename: string }> {
  prepararAmbientePdf()
  const ctx = await carregarContextoRelatorio(searchParams)
  const relatorio = montarRelatorioVisaoTime(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    ctx.periodo
  )

  const buffer = await renderToBuffer(
    <DocumentoTimePdf
      titulo={tituloEntregasPeriodo(relatorio.periodo.rotulo)}
      periodoRotulo={relatorio.periodo.rotulo}
      geradoEm={geradoEmLabel()}
      metricas={indicadoresTimeParaUi(relatorio.indicadores)}
      cardsPessoa={relatorio.cardsPessoa}
      paraQuem={relatorio.paraQuem}
      tipoMaterial={relatorio.tipoMaterial}
      blocos={relatorio.blocos}
      mostrarParaQuem={relatorio.mostrarParaQuem}
    />
  )

  const filename = `relatorio-mkt-time-${slugArquivo(relatorio.periodo.rotulo)}.pdf`
  return { buffer: Buffer.from(buffer), filename }
}

export async function gerarPdfRelatorioPessoa(
  slug: string,
  searchParams: Record<string, string | undefined>
): Promise<{ buffer: Buffer; filename: string } | null> {
  prepararAmbientePdf()
  const ctx = await carregarContextoRelatorio(searchParams)
  const intervalo = ctx.periodo.intervalo
  const nomesNoPeriodo = entregasPorPessoaNoIntervalo(
    ctx.movimentacoes,
    intervalo,
    ctx.demandas
  ).map((l) => l.nome)
  const nomePessoa = resolverPessoaPorSlug(slug, nomesNoPeriodo)
  if (!nomePessoa) return null

  const relatorio = montarRelatorioVisaoPessoa(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    ctx.periodo,
    nomePessoa
  )

  const filtros = filtrosBaseVisaoPessoa(intervalo, nomePessoa)
  const lista = listarDemandasFiltradas(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    filtros
  ).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))

  const buffer = await renderToBuffer(
    <DocumentoPessoaPdf
      titulo={tituloPessoaPeriodo(relatorio.nome, relatorio.periodo.rotulo)}
      nomePessoa={nomePessoa}
      periodoRotulo={relatorio.periodo.rotulo}
      geradoEm={geradoEmLabel()}
      metricas={indicadoresPessoaParaUi(relatorio.indicadores)}
      paraQuem={relatorio.paraQuem}
      tipoMaterial={relatorio.tipoMaterial}
      demandas={lista.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        tipo: d.tipoConteudo,
        departamento: d.departamento,
        situacao: rotuloDataListaDemanda(d),
      }))}
    />
  )

  const filename = `relatorio-mkt-${slugArquivo(nomePessoa)}-${slugArquivo(relatorio.periodo.rotulo)}.pdf`
  return { buffer: Buffer.from(buffer), filename }
}
