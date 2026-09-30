import { notFound } from 'next/navigation'
import { revalidarCacheNotionRelatorio } from '@/lib/notion/revalidar-cache-relatorio'
import { chaveRelatorioValida } from '@/lib/relatorio/contexto-relatorio'
import {
  LIMITE_AUTOR_OBSERVACAO,
  LIMITE_TEXTO_OBSERVACAO,
  mesAnoValido,
  quantidadeEntregasValida,
} from '@/lib/relatorio/registros-pessoa'
import {
  adicionarObservacao,
  definirContagemEntregas,
  removerObservacao,
} from '@/lib/relatorio/registros-pessoa-store'

export const dynamic = 'force-dynamic'

type RouteContext = { params: { chave: string } }

type Body = {
  acao?: 'definir-entregas' | 'adicionar-observacao' | 'remover-observacao'
  pessoaNome?: unknown
  mesAno?: unknown
  quantidade?: unknown
  registroPageId?: unknown
  texto?: unknown
  autor?: unknown
  observacaoId?: unknown
}

const LIMITE_NOME_PESSOA = 80
const REGEX_ID_NOTION = /^[0-9a-f-]{32,36}$/i

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function erro(mensagem: string, status = 400) {
  return Response.json({ erro: mensagem }, { status })
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!chaveRelatorioValida(params.chave)) {
    notFound()
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return erro('JSON inválido')
  }

  const pessoaNome = texto(body.pessoaNome)
  if (!pessoaNome || pessoaNome.length > LIMITE_NOME_PESSOA) {
    return erro('pessoaNome é obrigatório')
  }

  try {
    if (body.acao === 'definir-entregas') {
      if (!mesAnoValido(body.mesAno)) return erro('mesAno deve ser AAAA-MM')
      if (!quantidadeEntregasValida(body.quantidade)) return erro('quantidade inválida')
      const registroPageId = texto(body.registroPageId)
      if (registroPageId && !REGEX_ID_NOTION.test(registroPageId)) {
        return erro('registroPageId inválido')
      }

      const resultado = await definirContagemEntregas({
        pessoaNome,
        mesAno: body.mesAno,
        quantidade: body.quantidade,
        registroPageId: registroPageId || undefined,
      })
      revalidarCacheNotionRelatorio(params.chave)
      return Response.json({ ok: true, ...resultado })
    }

    if (body.acao === 'adicionar-observacao') {
      if (!mesAnoValido(body.mesAno)) return erro('mesAno deve ser AAAA-MM')
      const conteudo = texto(body.texto)
      const autor = texto(body.autor)
      if (!conteudo) return erro('Escreva a observação antes de salvar.')
      if (conteudo.length > LIMITE_TEXTO_OBSERVACAO) {
        return erro(`Observação passa de ${LIMITE_TEXTO_OBSERVACAO} caracteres.`)
      }
      if (autor.length > LIMITE_AUTOR_OBSERVACAO) return erro('Nome do autor muito longo.')

      const observacao = await adicionarObservacao({
        pessoaNome,
        mesAno: body.mesAno,
        texto: conteudo,
        autor,
      })
      revalidarCacheNotionRelatorio(params.chave)
      return Response.json({ ok: true, observacao })
    }

    if (body.acao === 'remover-observacao') {
      const id = texto(body.observacaoId)
      if (!id || id.length > 64) return erro('observacaoId é obrigatório')

      await removerObservacao({ id, pessoaNome })
      revalidarCacheNotionRelatorio(params.chave)
      return Response.json({ ok: true })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao salvar no Notion'
    console.error('[registros-pessoa]', msg)
    return erro(msg, 500)
  }

  return erro('acao inválida')
}
