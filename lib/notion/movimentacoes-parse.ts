import type { ExclusaoDemandaRelatorio } from '@/lib/relatorio/exclusoes-demanda'
import { normalizeMovimentacao } from './normalize'
import type { Movimentacao, NotionPage } from './types'

export const PROP_TIPO_REGISTRO = 'Tipo de registro'
export const PROP_RELATORIO_PESSOA = 'Relatório pessoa'
export const TIPO_REGISTRO_EXCLUSAO = 'Exclusão do relatório'

function extractSelect(property: unknown): string | null {
  const p = property as { select?: { name?: string } | null }
  return p?.select?.name ?? null
}

function extractRichText(property: unknown): string {
  const p = property as { rich_text?: { text?: { content?: string } }[] }
  if (!p?.rich_text?.length) return ''
  return p.rich_text[0]?.text?.content ?? ''
}

function extractRelation(property: unknown): string[] {
  const p = property as { relation?: { id: string }[] }
  if (!p?.relation?.length) return []
  return p.relation.map((r) => r.id)
}

export function isPaginaExclusaoRelatorio(page: NotionPage): boolean {
  const props = page.properties as Record<string, unknown>
  const tipo = extractSelect(props[PROP_TIPO_REGISTRO])
  if (!tipo) return false
  return (
    tipo.localeCompare(TIPO_REGISTRO_EXCLUSAO, 'pt-BR', { sensitivity: 'base' }) === 0
  )
}

function paginaParaExclusao(page: NotionPage): ExclusaoDemandaRelatorio | null {
  const props = page.properties as Record<string, unknown>
  const demandaId = extractRelation(props['Demanda'])[0] ?? null
  const pessoaNome = extractRichText(props[PROP_RELATORIO_PESSOA]).trim()
  if (!demandaId || !pessoaNome) return null
  return {
    demandaId,
    pessoaNome,
    registroPageId: page.id,
  }
}

/**
 * Separa movimentações reais da esteira de registros administrativos de exclusão.
 * Deve rodar uma vez na normalização — antes de passagens e métricas.
 */
export function partitionMovimentacoesPages(pages: NotionPage[]): {
  movimentacoes: Movimentacao[]
  exclusoesDemanda: ExclusaoDemandaRelatorio[]
} {
  const movimentacoes: Movimentacao[] = []
  const exclusoesDemanda: ExclusaoDemandaRelatorio[] = []

  for (const page of pages) {
    if (isPaginaExclusaoRelatorio(page)) {
      const ex = paginaParaExclusao(page)
      if (ex) exclusoesDemanda.push(ex)
      continue
    }

    const mov = normalizeMovimentacao(page)
    if (mov.demandaId !== null) {
      movimentacoes.push(mov)
    }
  }

  return { movimentacoes, exclusoesDemanda }
}
