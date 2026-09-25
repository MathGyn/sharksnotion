export class NotionDataSourceError extends Error {
  readonly causaOriginal: unknown

  constructor(mensagem: string, causaOriginal?: unknown) {
    super(mensagem)
    this.name = 'NotionDataSourceError'
    this.causaOriginal = causaOriginal
  }
}

export function extrairMensagemNotionApi(error: unknown): string {
  if (!error || typeof error !== 'object') return ''

  const e = error as { message?: string; body?: string; code?: string }
  if (typeof e.message === 'string' && e.message.trim()) {
    return e.message.trim()
  }
  if (typeof e.body === 'string') {
    try {
      const parsed = JSON.parse(e.body) as { message?: string }
      if (parsed.message) return parsed.message
    } catch {
      /* ignore */
    }
  }
  if (typeof e.code === 'string') return e.code

  return ''
}

export function mensagemErroNotionParaUsuario(error: unknown): string {
  if (error instanceof NotionDataSourceError) {
    const extra = extrairMensagemNotionApi(error.causaOriginal)
    if (extra && !error.message.includes(extra)) {
      return `${error.message}\n\nDetalhe: ${extra}`
    }
    return error.message
  }
  const detalhe = extrairMensagemNotionApi(error)
  if (detalhe) {
    return `Não foi possível carregar os dados do Notion.\n\n${detalhe}`
  }
  if (error instanceof Error && error.message) {
    return `Não foi possível carregar os dados do Notion. ${error.message}`
  }
  return 'Não foi possível carregar os dados do Notion. Verifique o token e o compartilhamento das bases com a integração.'
}
