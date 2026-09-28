import { revalidateSecretValido } from '@/lib/auth/revalidate-secret'
import { executarFluxoRelatorioMensal } from '@/lib/relatorio/fluxo-relatorio-mensal'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!revalidateSecretValido(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const de = url.searchParams.get('de') ?? undefined
  const ate = url.searchParams.get('ate') ?? undefined
  const apenasPdf = url.searchParams.get('apenasPdf') === '1'

  try {
    const resultado = await executarFluxoRelatorioMensal({ de, ate, apenasPdf })

    if (resultado.modo === 'pdf') {
      return new Response(new Uint8Array(resultado.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${resultado.filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return Response.json({
      ok: true,
      intervalo: resultado.intervalo,
      arquivo: resultado.filename,
      email: resultado.email,
    })
  } catch (erro) {
    console.error('[api/enviar-relatorio]', erro)
    return Response.json(
      { ok: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
