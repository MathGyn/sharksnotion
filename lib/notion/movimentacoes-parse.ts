import type { ExclusaoDemandaRelatorio } from '@/lib/relatorio/exclusoes-demanda'
import type {
  ContagemEntregasMensal,
  ObservacaoPessoaMensal,
} from '@/lib/relatorio/registros-pessoa'
import { normalizeMovimentacao } from './normalize'
import type { Movimentacao, NotionPage } from './types'

export const PROP_TIPO_REGISTRO = 'Tipo de registro'
export const PROP_RELATORIO_PESSOA = 'Relatório pessoa'
export const PROP_MES_REFERENCIA = 'Mês de referência'
export const PROP_QUANTIDADE_ENTREGAS = 'Quantidade de entregas'
export const PROP_OBSERVACAO = 'Observação'
export const PROP_AUTOR_OBSERVACAO = 'Autor da observação'

export const TIPO_REGISTRO_EXCLUSAO = 'Exclusão do relatório'
export const TIPO_REGISTRO_CONTAGEM_ENTREGAS = 'Contagem de entregas'
export const TIPO_REGISTRO_OBSERVACAO = 'Observação do relatório'

function extractSelect(property: unknown): string | null {
  const p = property as { select?: { name?: string } | null }
  return p?.select?.name ?? null
}

function extractRichText(property: unknown): string {
  const p = property as { rich_text?: { text?: { content?: string } }[] }
  if (!p?.rich_text?.length) return ''
  return p.rich_text[0]?.text?.content ?? ''
}

/** Texto longo vem em vários blocos de até 2000 caracteres. */
function extractRichTextCompleto(property: unknown): string {
  const p = property as {
    rich_text?: { plain_text?: string; text?: { content?: string } }[]
  }
  if (!p?.rich_text?.length) return ''
  return p.rich_text.map((r) => r.plain_text ?? r.text?.content ?? '').join('')
}

function extractRelation(property: unknown): string[] {
  const p = property as { relation?: { id: string }[] }
  if (!p?.relation?.length) return []
  return p.relation.map((r) => r.id)
}

function extractNumber(property: unknown): number | null {
  const p = property as { number?: number | null }
  return typeof p?.number === 'number' ? p.number : null
}

function extractMesAno(property: unknown): string | null {
  const p = property as { date?: { start?: string } | null }
  const inicio = p?.date?.start
  return inicio && /^\d{4}-\d{2}/.test(inicio) ? inicio.slice(0, 7) : null
}

function tipoRegistroIgual(page: NotionPage, tipo: string): boolean {
  const valor = extractSelect((page.properties as Record<string, unknown>)[PROP_TIPO_REGISTRO])
  if (!valor) return false
  return valor.localeCompare(tipo, 'pt-BR', { sensitivity: 'base' }) === 0
}

export function isPaginaExclusaoRelatorio(page: NotionPage): boolean {
  return tipoRegistroIgual(page, TIPO_REGISTRO_EXCLUSAO)
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

function paginaParaContagem(page: NotionPage): ContagemEntregasMensal | null {
  const props = page.properties as Record<string, unknown>
  const pessoaNome = extractRichText(props[PROP_RELATORIO_PESSOA]).trim()
  const mesAno = extractMesAno(props[PROP_MES_REFERENCIA])
  const quantidade = extractNumber(props[PROP_QUANTIDADE_ENTREGAS])
  if (!pessoaNome || !mesAno || quantidade === null) return null
  return {
    pessoaNome,
    mesAno,
    quantidade: Math.max(0, Math.round(quantidade)),
    registroPageId: page.id,
    atualizadoEm: page.last_edited_time ?? page.created_time,
  }
}

function paginaParaObservacao(page: NotionPage): ObservacaoPessoaMensal | null {
  const props = page.properties as Record<string, unknown>
  const pessoaNome = extractRichText(props[PROP_RELATORIO_PESSOA]).trim()
  const mesAno = extractMesAno(props[PROP_MES_REFERENCIA])
  const texto = extractRichTextCompleto(props[PROP_OBSERVACAO]).trim()
  if (!pessoaNome || !mesAno || !texto) return null
  return {
    id: page.id,
    pessoaNome,
    mesAno,
    texto,
    autor: extractRichText(props[PROP_AUTOR_OBSERVACAO]).trim(),
    criadoEm: page.created_time,
    registroPageId: page.id,
  }
}

export type MovimentacoesParticionadas = {
  movimentacoes: Movimentacao[]
  exclusoesDemanda: ExclusaoDemandaRelatorio[]
  contagensEntregas: ContagemEntregasMensal[]
  observacoesPessoa: ObservacaoPessoaMensal[]
}

/**
 * Separa movimentações reais da esteira de registros administrativos do relatório
 * (exclusões, contagem manual de entregas, observações).
 * Deve rodar uma vez na normalização — antes de passagens e métricas.
 */
export function partitionMovimentacoesPages(pages: NotionPage[]): MovimentacoesParticionadas {
  const out: MovimentacoesParticionadas = {
    movimentacoes: [],
    exclusoesDemanda: [],
    contagensEntregas: [],
    observacoesPessoa: [],
  }

  for (const page of pages) {
    if (isPaginaExclusaoRelatorio(page)) {
      const ex = paginaParaExclusao(page)
      if (ex) out.exclusoesDemanda.push(ex)
      continue
    }
    if (tipoRegistroIgual(page, TIPO_REGISTRO_CONTAGEM_ENTREGAS)) {
      const c = paginaParaContagem(page)
      if (c) out.contagensEntregas.push(c)
      continue
    }
    if (tipoRegistroIgual(page, TIPO_REGISTRO_OBSERVACAO)) {
      const o = paginaParaObservacao(page)
      if (o) out.observacoesPessoa.push(o)
      continue
    }

    const mov = normalizeMovimentacao(page)
    if (mov.demandaId !== null) {
      out.movimentacoes.push(mov)
    }
  }

  return out
}
