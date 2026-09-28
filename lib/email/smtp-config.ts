export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  remetente: string
  destinatarios: string[]
}

export function lerSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  const remetente = process.env.EMAIL_REMETENTE?.trim()
  const destRaw = process.env.EMAIL_DESTINATARIOS?.trim()

  if (!host || !user || !pass || !remetente || !destRaw) {
    return null
  }

  const port = parseInt(process.env.SMTP_PORT?.trim() || '587', 10)
  const secure = process.env.SMTP_SECURE?.trim() === 'true'

  const destinatarios = destRaw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (destinatarios.length === 0) return null

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    remetente,
    destinatarios,
  }
}
