import nodemailer from 'nodemailer'
import type { RelatorioVisaoTime } from '@/lib/relatorio/agregacoes'
import { indicadoresTimeParaUi } from '@/lib/relatorio/indicadores-ui'
import { rotuloMesAnoPorExtenso, mesAnoDeIntervalo } from '@/lib/relatorio/periodo'
import { lerSmtpConfig } from './smtp-config'

function assuntoEmail(relatorio: RelatorioVisaoTime): string {
  const mesAno = mesAnoDeIntervalo(relatorio.periodo.intervalo)
  return `Relatório Marketing · ${rotuloMesAnoPorExtenso(mesAno)}`
}

function corpoTexto(relatorio: RelatorioVisaoTime): string {
  const metricas = indicadoresTimeParaUi(relatorio.indicadores)
  const linhas = metricas.map((m) => `${m.rotulo}: ${m.valor}`).join('\n')
  const mes = rotuloMesAnoPorExtenso(mesAnoDeIntervalo(relatorio.periodo.intervalo))

  return [
    `Segue em anexo o relatório de marketing de ${mes}.`,
    '',
    linhas,
  ].join('\n')
}

function corpoHtml(relatorio: RelatorioVisaoTime): string {
  const metricas = indicadoresTimeParaUi(relatorio.indicadores)
  const mes = rotuloMesAnoPorExtenso(mesAnoDeIntervalo(relatorio.periodo.intervalo))
  const linhas = metricas
    .map(
      (m) =>
        `<tr><td style="padding:6px 12px 6px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#10203f;">${m.rotulo}</td><td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#10203f;">${m.valor}</td></tr>`
    )
    .join('')

  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:16px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#10203f;"><p style="margin:0 0 16px;">Segue em anexo o relatório de marketing de ${mes}.</p><table cellpadding="0" cellspacing="0" border="0">${linhas}</table></body></html>`
}

export async function enviarRelatorioMensalPorEmail(
  relatorio: RelatorioVisaoTime,
  pdf: { filename: string; buffer: Buffer }
): Promise<{ enviado: boolean; motivo?: string }> {
  const smtp = lerSmtpConfig()
  if (!smtp) {
    console.warn(
      '[relatorio-mensal] SMTP incompleto (SMTP_* / EMAIL_REMETENTE / EMAIL_DESTINATARIOS). E-mail não enviado.'
    )
    return { enviado: false, motivo: 'smtp_ausente' }
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    requireTLS: !smtp.secure && smtp.port === 587,
  })

  await transporter.sendMail({
    from: smtp.remetente,
    to: smtp.destinatarios.join(', '),
    subject: assuntoEmail(relatorio),
    text: corpoTexto(relatorio),
    html: corpoHtml(relatorio),
    attachments: [
      {
        filename: pdf.filename,
        content: pdf.buffer,
        contentType: 'application/pdf',
      },
    ],
  })

  return { enviado: true }
}

