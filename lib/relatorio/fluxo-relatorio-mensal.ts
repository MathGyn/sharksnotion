import { gerarPdfRelatorioMensal } from '@/lib/pdf/gerar-relatorio-mensal-pdf'
import { enviarRelatorioMensalPorEmail } from '@/lib/email/relatorio-mensal-email'
import {
  intervaloMesAnteriorFechado,
  intervaloFixo,
  type Intervalo,
} from '@/lib/relatorio/periodo'

export type OpcoesFluxoRelatorioMensal = {
  de?: string
  ate?: string
  apenasPdf?: boolean
}

function resolverIntervalo(opcoes: OpcoesFluxoRelatorioMensal): Intervalo {
  if (
    opcoes.de &&
    opcoes.ate &&
    /^\d{4}-\d{2}-\d{2}$/.test(opcoes.de) &&
    /^\d{4}-\d{2}-\d{2}$/.test(opcoes.ate)
  ) {
    return intervaloFixo(opcoes.de, opcoes.ate).intervalo
  }
  return intervaloMesAnteriorFechado()
}

export async function executarFluxoRelatorioMensal(opcoes: OpcoesFluxoRelatorioMensal = {}) {
  const intervalo = resolverIntervalo(opcoes)
  const { buffer, filename, relatorio } = await gerarPdfRelatorioMensal(intervalo)

  if (opcoes.apenasPdf) {
    return {
      ok: true as const,
      modo: 'pdf' as const,
      intervalo,
      filename,
      buffer,
      relatorio,
    }
  }

  const email = await enviarRelatorioMensalPorEmail(relatorio, { filename, buffer })

  return {
    ok: true as const,
    modo: 'email' as const,
    intervalo,
    filename,
    email,
    relatorio,
  }
}
