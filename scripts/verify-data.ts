import { fetchRawAllPages } from '../lib/notion/client'
import {
  normalizeDemanda,
  normalizeMovimentacao,
  normalizeSolicitacao,
} from '../lib/notion/normalize'
import { indiceCorPessoa } from '../lib/utils/pessoa-cor'

async function main() {
  delete process.env.NOTION_TOKEN

  const raw = await fetchRawAllPages()
  const demandas = raw.demandasPages.map(normalizeDemanda)
  const solicitacoes = raw.solicitacoesPages.map(normalizeSolicitacao)
  const movimentacoes = raw.movimentacoesPages
    .map(normalizeMovimentacao)
    .filter((m) => m.demandaId !== null)

  const semSol = demandas.filter((d) => !d.solicitacaoDeOrigemId).length
  const semPrazo = demandas.filter((d) => !d.precisaEntregarAte).length
  const concluidoSetembro = demandas.filter((d) =>
    d.estaComAtual.toLowerCase().startsWith('concluído')
  ).length

  const pessoas = [...new Set(movimentacoes.map((m) => m.para))].filter(
    (p) => !['Não iniciado', 'Aprovação', 'Cancelados'].includes(p) && !p.toLowerCase().startsWith('concluído')
  )

  console.log('Normalizado (mocks):')
  console.log('  demandas:', demandas.length)
  console.log('  solicitações:', solicitacoes.length)
  console.log('  movimentações (com Demanda):', movimentacoes.length)
  console.log('  sem solicitação vinculada:', semSol)
  console.log('  sem prazo:', semPrazo)
  console.log('  coluna Concluído*:', concluidoSetembro)
  console.log('  Matheus → índice cor:', indiceCorPessoa('MATHEUS', pessoas))
  console.log('  Guilherme → índice cor:', indiceCorPessoa('Guilherme', pessoas))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
