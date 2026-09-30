import { fetchAllDataSources } from '@/lib/notion/fetch'
import { fetchPerfisWorkspace, mapaAvatarPorNome } from '@/lib/notion/users'
import { derivarPessoasDosPara } from './classificacao'
import type { ExclusaoDemandaRelatorio } from './exclusoes-demanda'
import { listarExclusoesDemandaMockLocal } from './exclusoes-demanda-store'
import { mergeExclusoesDemanda } from './merge-exclusoes'
import { resolverPeriodoConsulta, type PeriodoResolvido } from './periodo'
import type { ContagemEntregasMensal, ObservacaoPessoaMensal } from './registros-pessoa'
import { listarRegistrosPessoaMockLocal } from './registros-pessoa-store'

export function chaveRelatorioValida(chave: string): boolean {
  const esperada = process.env.REPORT_ACCESS_KEY?.trim()
  if (!esperada) return false
  return chave.trim() === esperada
}

export async function carregarContextoRelatorio(
  searchParams: Record<string, string | undefined> = {}
): Promise<{
  demandas: Awaited<ReturnType<typeof fetchAllDataSources>>['demandas']
  solicitacoes: Awaited<ReturnType<typeof fetchAllDataSources>>['solicitacoes']
  movimentacoes: Awaited<ReturnType<typeof fetchAllDataSources>>['movimentacoes']
  periodo: PeriodoResolvido
  pessoasReferencia: string[]
  avatarsPorNome: Record<string, string | null>
  avisosNotion: string[]
  exclusoesDemanda: ExclusaoDemandaRelatorio[]
  contagensEntregas: ContagemEntregasMensal[]
  observacoesPessoa: ObservacaoPessoaMensal[]
}> {
  // Avatares em paralelo com as bases — um users.list lento não soma no tempo do relatório.
  const perfisPromise = fetchPerfisWorkspace()
  const {
    demandas,
    solicitacoes,
    movimentacoes,
    avisosNotion,
    exclusoesDemanda: doNotion,
    contagensEntregas,
    observacoesPessoa,
  } = await fetchAllDataSources()
  const [extrasMock, registrosMock, perfis] = await Promise.all([
    listarExclusoesDemandaMockLocal(),
    listarRegistrosPessoaMockLocal(),
    perfisPromise,
  ])
  const exclusoesDemanda = mergeExclusoesDemanda(doNotion, extrasMock)
  const periodo = resolverPeriodoConsulta(
    {
      de: searchParams.de,
      ate: searchParams.ate,
      mes: searchParams.mes,
    },
    demandas,
    movimentacoes
  )
  const pessoasReferencia = derivarPessoasDosPara(movimentacoes.map((m) => m.para))
  const avatarsPorNome = mapaAvatarPorNome(perfis, pessoasReferencia)

  return {
    demandas,
    solicitacoes,
    movimentacoes,
    periodo,
    pessoasReferencia,
    avatarsPorNome,
    avisosNotion,
    exclusoesDemanda,
    contagensEntregas: [...contagensEntregas, ...registrosMock.contagens],
    observacoesPessoa: [...observacoesPessoa, ...registrosMock.observacoes],
  }
}
