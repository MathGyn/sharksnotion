import { describe, expect, it } from 'vitest'
import { extrairMensagemNotionApi } from '@/lib/notion/errors'

describe('extrairMensagemNotionApi', () => {
  it('inclui a causa de um fetch failed', () => {
    const error = new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect ECONNRESET'), { code: 'ECONNRESET' }),
    })
    expect(extrairMensagemNotionApi(error)).toBe('fetch failed (connect ECONNRESET)')
  })

  it('devolve só a mensagem quando não há causa útil', () => {
    expect(extrairMensagemNotionApi(new Error('Request to Notion API has timed out'))).toBe(
      'Request to Notion API has timed out'
    )
  })
})
