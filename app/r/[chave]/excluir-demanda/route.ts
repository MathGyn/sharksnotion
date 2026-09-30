import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { revalidarCacheNotionRelatorio } from '@/lib/notion/revalidar-cache-relatorio'
import { chaveRelatorioValida } from '@/lib/relatorio/contexto-relatorio'
import {
  excluirDemandaDoRelatorioPessoa,
  restaurarDemandaNoRelatorioPessoa,
} from '@/lib/relatorio/exclusoes-demanda-store'
import { nomeParaSlug } from '@/lib/utils/slug'

export const dynamic = 'force-dynamic'

type RouteContext = { params: { chave: string } }

type BodyExclusao = {
  acao?: 'excluir' | 'restaurar'
  demandaId?: string
  pessoaNome?: string
  tituloDemanda?: string
  registroPageId?: string
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!chaveRelatorioValida(params.chave)) {
    notFound()
  }

  let body: BodyExclusao
  try {
    body = (await request.json()) as BodyExclusao
  } catch {
    return Response.json({ erro: 'JSON inválido' }, { status: 400 })
  }

  const acao = body.acao ?? 'excluir'
  const demandaId = body.demandaId?.trim()
  const pessoaNome = body.pessoaNome?.trim()

  if (!demandaId || !pessoaNome) {
    return Response.json({ erro: 'demandaId e pessoaNome são obrigatórios' }, { status: 400 })
  }

  try {
    if (acao === 'restaurar') {
      await restaurarDemandaNoRelatorioPessoa({
        demandaId,
        pessoaNome,
        registroPageId: body.registroPageId?.trim() || undefined,
      })
    } else if (acao === 'excluir') {
      const titulo = body.tituloDemanda?.trim() || demandaId
      await excluirDemandaDoRelatorioPessoa(demandaId, pessoaNome, titulo)
    } else {
      return Response.json({ erro: 'acao inválida' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao salvar exclusão'
    return Response.json({ erro: msg }, { status: 500 })
  }

  revalidarCacheNotionRelatorio(params.chave)
  const slug = nomeParaSlug(pessoaNome)
  revalidatePath(`/r/${params.chave}`, 'layout')

  return Response.json({ ok: true, slug })
}
