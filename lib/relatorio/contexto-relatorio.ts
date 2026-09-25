import { fetchAllDataSources } from '@/lib/notion/fetch'
import { fetchAvatarsPorNome } from '@/lib/notion/users'
import { derivarPessoasDosPara } from './classificacao'
import { resolverPeriodoConsulta, type PeriodoResolvido } from './periodo'

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
}> {
  const { demandas, solicitacoes, movimentacoes, avisosNotion } =
    await fetchAllDataSources()
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
  const avatarsPorNome = await fetchAvatarsPorNome(pessoasReferencia)

  return {
    demandas,
    solicitacoes,
    movimentacoes,
    periodo,
    pessoasReferencia,
    avatarsPorNome,
    avisosNotion,
  }
}
