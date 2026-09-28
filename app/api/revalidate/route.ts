import { revalidatePath, revalidateTag } from 'next/cache'
import { revalidateSecretValido } from '@/lib/auth/revalidate-secret'
import {
  REVALIDATE_NOTION_SEGUNDOS,
  TAG_CACHE_NOTION,
  limparCacheNotionLiveMemoria,
} from '@/lib/notion/fetch'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!revalidateSecretValido(request)) {
    return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })
  }

  limparCacheNotionLiveMemoria()
  revalidateTag(TAG_CACHE_NOTION)

  const chave = process.env.REPORT_ACCESS_KEY?.trim()
  const rotas = chave ? [`/r/${chave}`] : []
  for (const rota of rotas) {
    revalidatePath(rota, 'layout')
  }

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
