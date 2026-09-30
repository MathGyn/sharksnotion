import { revalidateSecretValido } from '@/lib/auth/revalidate-secret'
import { REVALIDATE_NOTION_SEGUNDOS, TAG_CACHE_NOTION } from '@/lib/notion/fetch'
import { revalidarCacheNotionRelatorio } from '@/lib/notion/revalidar-cache-relatorio'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!revalidateSecretValido(request)) {
    return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })
  }

  const chave = process.env.REPORT_ACCESS_KEY?.trim()
  revalidarCacheNotionRelatorio(chave)
  const rotas = chave ? [`/r/${chave}`] : []

  return Response.json({
    ok: true,
    revalidado: {
      tag: TAG_CACHE_NOTION,
      revalidateSegundos: REVALIDATE_NOTION_SEGUNDOS,
      cacheMemoria: true,
      rotas,
    },
  })
}
