import { notFound } from 'next/navigation'
import { revalidarCacheNotionRelatorio } from '@/lib/notion/revalidar-cache-relatorio'
import { chaveRelatorioValida } from '@/lib/relatorio/contexto-relatorio'

export const dynamic = 'force-dynamic'

type RouteContext = { params: { chave: string } }

export async function POST(_request: Request, { params }: RouteContext) {
  if (!chaveRelatorioValida(params.chave)) {
    notFound()
  }

  revalidarCacheNotionRelatorio(params.chave)

  return Response.json({ ok: true })
}
