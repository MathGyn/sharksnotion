import { renderToBuffer } from '@react-pdf/renderer'
import { formatInTimeZone } from 'date-fns-tz'
import { montarRelatorioVisaoTime } from '@/lib/relatorio/agregacoes'
import { carregarContextoRelatorio } from '@/lib/relatorio/contexto-relatorio'
import { tituloEntregasPeriodo } from '@/lib/relatorio/formatadores'
import { indicadoresTimeParaUi } from '@/lib/relatorio/indicadores-ui'
import {
  intervaloFixo,
  mesAnoDeIntervalo,
  type Intervalo,
} from '@/lib/relatorio/periodo'
import {
  DocumentoRelatorioMensal,
  montarLinhasPessoaMensal,
  montarObservacoesPorPessoaMensal,
} from './documento-relatorio-mensal'
import { initEstilosPdf } from './estilos'
import { registrarFonteArchivoPdf } from './fontes-archivo'

function prepararPdfMensal(): void {
  const family = registrarFonteArchivoPdf()
  initEstilosPdf(family)
}

function geradoEmLabel(): string {
  return formatInTimeZone(new Date(), 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm")
}

export function nomeArquivoRelatorioMensal(intervalo: Intervalo): string {
  const mesAno = mesAnoDeIntervalo(intervalo)
  return `relatorio-marketing-${mesAno}.pdf`
}

export async function gerarPdfRelatorioMensal(
  intervalo: Intervalo
): Promise<{ buffer: Buffer; filename: string; relatorio: ReturnType<typeof montarRelatorioVisaoTime> }> {
  prepararPdfMensal()

  const de = intervalo.de
  const ate = intervalo.ate
  const chave = process.env.REPORT_ACCESS_KEY?.trim()
  if (!chave) {
    throw new Error('REPORT_ACCESS_KEY não configurada')
  }
  const ctx = await carregarContextoRelatorio(chave, { de, ate })
  const periodo =
    ctx.periodo.intervalo.de === de && ctx.periodo.intervalo.ate === ate
      ? ctx.periodo
      : intervaloFixo(de, ate)

  const relatorio = montarRelatorioVisaoTime(
    ctx.demandas,
    ctx.solicitacoes,
    ctx.movimentacoes,
    periodo,
    ctx.exclusoesDemanda
  )

  const linhasPessoa = montarLinhasPessoaMensal(
    relatorio,
    ctx.movimentacoes,
    ctx.contagensEntregas,
    ctx.observacoesPessoa
  )

  const buffer = await renderToBuffer(
    <DocumentoRelatorioMensal
      titulo={tituloEntregasPeriodo(relatorio.periodo.rotulo)}
      periodoRotulo={relatorio.periodo.rotulo}
      geradoEm={geradoEmLabel()}
      metricas={indicadoresTimeParaUi(relatorio.indicadores)}
      linhasPessoa={linhasPessoa}
      observacoesPorPessoa={montarObservacoesPorPessoaMensal(
        linhasPessoa,
        ctx.observacoesPessoa,
        relatorio.periodo.intervalo
      )}
      tipoMaterial={relatorio.tipoMaterial}
      porUrgencia={relatorio.blocos.porUrgencia}
      entradasSaidas={relatorio.blocos.entradasSaidas}
    />
  )

  return {
    buffer: Buffer.from(buffer),
    filename: nomeArquivoRelatorioMensal(intervalo),
    relatorio,
  }
}
