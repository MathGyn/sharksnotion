import { NextRequest, NextResponse } from 'next/server'
import { chaveRelatorioValida } from '@/lib/relatorio/contexto-relatorio'
import { normalizarSearchParams } from '@/lib/relatorio/url-relatorio'
import {
  gerarPdfRelatorioPessoa,
  gerarPdfRelatorioTime,
} from '@/lib/pdf/gerar-relatorio-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: { chave: string } }

export async function GET(request: NextRequest, context: RouteContext) {
  if (!chaveRelatorioValida(context.params.chave)) {
    return new NextResponse('Não encontrado', { status: 404 })
  }

  const raw: Record<string, string | string[] | undefined> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    raw[key] = value
  })
  const searchParams = normalizarSearchParams(raw)
  const slugPessoa = searchParams.pessoa

  try {
    const resultado = slugPessoa
      ? await gerarPdfRelatorioPessoa(slugPessoa, searchParams)
      : await gerarPdfRelatorioTime(searchParams)

    if (!resultado) {
      return new NextResponse('Pessoa não encontrada no período', { status: 404 })
    }

    return new NextResponse(new Uint8Array(resultado.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resultado.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[pdf] falha ao gerar relatório', error)
    return new NextResponse('Erro ao gerar PDF', { status: 500 })
  }
}
