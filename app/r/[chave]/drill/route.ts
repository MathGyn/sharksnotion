import { notFound } from 'next/navigation'
import {
  entregasPorPessoaNoIntervalo,
} from '@/lib/relatorio/agregacoes'
import { chaveRelatorioValida } from '@/lib/relatorio/contexto-relatorio'
import { carregarContextoRelatorioCached } from '@/lib/relatorio/contexto-relatorio-cache'
import {
  filtrosBaseVisaoPessoa,
  filtrosBaseVisaoTime,
  montarDetalheDemandaInline,
  montarListaPorChaveAberto,
} from '@/lib/relatorio/drill-down'
import { normalizarSearchParams } from '@/lib/relatorio/url-relatorio'
import { resolverPessoaPorSlug } from '@/lib/utils/slug'

export const dynamic = 'force-dynamic'

type RouteContext = { params: { chave: string } }

export async function GET(request: Request, { params }: RouteContext) {
  if (!chaveRelatorioValida(params.chave)) {
    notFound()
  }

  const url = new URL(request.url)
  const sp = normalizarSearchParams(Object.fromEntries(url.searchParams.entries()))
  const tipo = sp.tipo
  const aberto = sp.aberto
  const demandaId = sp.demanda

  let ctx
  try {
    ctx = await carregarContextoRelatorioCached(params.chave, sp)
  } catch (error) {
    console.error('[drill] Falha ao carregar contexto:', error)
    const msg =
      error instanceof Error ? error.message : 'Erro ao carregar dados do relatório'
    return Response.json({ erro: msg }, { status: 500 })
  }
  const intervalo = ctx.periodo.intervalo

  let filtrosBase = filtrosBaseVisaoTime(intervalo)
  const slugPessoa = sp.pessoa?.trim()
  if (slugPessoa) {
    const nomesNoPeriodo = entregasPorPessoaNoIntervalo(
      ctx.movimentacoes,
      intervalo,
      ctx.demandas,
      ctx.exclusoesDemanda
    ).map((l) => l.nome)
    const nomePessoa = resolverPessoaPorSlug(slugPessoa, nomesNoPeriodo)
    if (!nomePessoa) {
      return Response.json({ erro: 'Pessoa não encontrada' }, { status: 404 })
    }
    filtrosBase = filtrosBaseVisaoPessoa(intervalo, nomePessoa, ctx.exclusoesDemanda)
  }

  if (tipo === 'lista') {
    if (!aberto) {
      return Response.json({ erro: 'Parâmetro aberto obrigatório' }, { status: 400 })
    }
    const rows = montarListaPorChaveAberto(
      aberto,
      ctx.demandas,
      ctx.solicitacoes,
      ctx.movimentacoes,
      filtrosBase
    )
    if (rows === null) {
      return Response.json({ erro: 'Categoria inválida' }, { status: 404 })
    }
    return Response.json({ rows })
  }

  if (tipo === 'detalhe') {
    if (!demandaId) {
      return Response.json({ erro: 'Parâmetro demanda obrigatório' }, { status: 400 })
    }
    const detalhe = montarDetalheDemandaInline(
      demandaId,
      ctx.demandas,
      ctx.solicitacoes,
      ctx.movimentacoes
    )
    if (!detalhe) {
      return Response.json({ erro: 'Demanda não encontrada' }, { status: 404 })
    }
    return Response.json({ detalhe })
  }

  return Response.json({ erro: 'tipo inválido' }, { status: 400 })
}
