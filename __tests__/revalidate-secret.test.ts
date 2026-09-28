import { afterEach, describe, expect, it, vi } from 'vitest'
import { revalidateSecretValido } from '@/lib/auth/revalidate-secret'

describe('revalidateSecretValido', () => {
  const anterior = process.env.REVALIDATE_SECRET

  afterEach(() => {
    if (anterior === undefined) delete process.env.REVALIDATE_SECRET
    else process.env.REVALIDATE_SECRET = anterior
  })

  it('aceita cabeçalho x-revalidate-secret e query secret', () => {
    process.env.REVALIDATE_SECRET = 'segredo-teste'

    const porHeader = new Request('https://exemplo.test/api/revalidate', {
      method: 'POST',
      headers: { 'x-revalidate-secret': 'segredo-teste' },
    })
    const porQuery = new Request('https://exemplo.test/api/revalidate?secret=segredo-teste', {
      method: 'POST',
    })
    const invalido = new Request('https://exemplo.test/api/revalidate?secret=errado', {
      method: 'POST',
      headers: { 'x-revalidate-secret': 'errado' },
    })

    expect(revalidateSecretValido(porHeader)).toBe(true)
    expect(revalidateSecretValido(porQuery)).toBe(true)
    expect(revalidateSecretValido(invalido)).toBe(false)
  })
})

describe('POST /api/revalidate', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('limpa o cache do Notion e descreve o que revalidou', async () => {
    vi.resetModules()
    const limpar = vi.fn()
    const revalidateTag = vi.fn()
    const revalidatePath = vi.fn()

    vi.doMock('next/cache', () => ({
      revalidateTag,
      revalidatePath,
      unstable_cache: (fn: () => unknown) => fn,
    }))
    vi.doMock('@/lib/notion/fetch', () => ({
      limparCacheNotionLiveMemoria: limpar,
      TAG_CACHE_NOTION: 'notion',
      REVALIDATE_NOTION_SEGUNDOS: 60,
    }))

    vi.stubEnv('REVALIDATE_SECRET', 'segredo-teste')
    vi.stubEnv('REPORT_ACCESS_KEY', 'chave-relatorio')

    const { POST } = await import('@/app/api/revalidate/route')
    const resposta = await POST(
      new Request('https://exemplo.test/api/revalidate?secret=segredo-teste', { method: 'POST' })
    )

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toEqual({
      ok: true,
      revalidado: {
        tag: 'notion',
        revalidateSegundos: 60,
        cacheMemoria: true,
        rotas: ['/r/chave-relatorio'],
      },
    })
    expect(limpar).toHaveBeenCalledOnce()
    expect(revalidateTag).toHaveBeenCalledWith('notion')
    expect(revalidatePath).toHaveBeenCalledWith('/r/chave-relatorio', 'layout')
  })

  it('recusa sem o segredo', async () => {
    vi.resetModules()
    vi.doMock('next/cache', () => ({
      revalidateTag: vi.fn(),
      revalidatePath: vi.fn(),
      unstable_cache: (fn: () => unknown) => fn,
    }))
    vi.doMock('@/lib/notion/fetch', () => ({
      limparCacheNotionLiveMemoria: vi.fn(),
      TAG_CACHE_NOTION: 'notion',
      REVALIDATE_NOTION_SEGUNDOS: 60,
    }))
    vi.stubEnv('REVALIDATE_SECRET', 'segredo-teste')

    const { POST } = await import('@/app/api/revalidate/route')
    const resposta = await POST(new Request('https://exemplo.test/api/revalidate', { method: 'POST' }))

    expect(resposta.status).toBe(401)
  })
})
