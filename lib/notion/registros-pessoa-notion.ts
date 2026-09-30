import type { MesAno } from '@/lib/relatorio/registros-pessoa'
import { NOTION_DATA_SOURCE_MOVIMENTACOES, criarClienteNotion } from './client'
import { shouldUseNotionMocks } from './data-source'
import {
  PROP_AUTOR_OBSERVACAO,
  PROP_MES_REFERENCIA,
  PROP_OBSERVACAO,
  PROP_QUANTIDADE_ENTREGAS,
  PROP_RELATORIO_PESSOA,
  PROP_TIPO_REGISTRO,
  TIPO_REGISTRO_CONTAGEM_ENTREGAS,
  TIPO_REGISTRO_OBSERVACAO,
} from './movimentacoes-parse'

/** Limite da API do Notion por bloco de rich_text. */
const LIMITE_BLOCO_RICH_TEXT = 2000

function richText(texto: string) {
  const blocos: { type: 'text'; text: { content: string } }[] = []
  for (let i = 0; i < texto.length; i += LIMITE_BLOCO_RICH_TEXT) {
    blocos.push({ type: 'text', text: { content: texto.slice(i, i + LIMITE_BLOCO_RICH_TEXT) } })
  }
  return blocos.length > 0 ? blocos : [{ type: 'text' as const, text: { content: '' } }]
}

function primeiroDiaDoMes(mesAno: MesAno): string {
  return `${mesAno}-01`
}

function exigirNotionReal(acao: string): void {
  if (shouldUseNotionMocks()) {
    throw new Error(`${acao} via Notion indisponível em modo mock.`)
  }
}

/** O ID vem do navegador — só aceita páginas das Movimentações do tipo esperado e da mesma pessoa. */
async function garantirRegistroDoTipo(
  pageId: string,
  tipo: string,
  pessoaNome: string
): Promise<void> {
  const client = criarClienteNotion()
  const page = (await client.pages.retrieve({ page_id: pageId })) as {
    parent?: { data_source_id?: string }
    properties?: Record<string, unknown>
  }
  const props = page.properties ?? {}
  const tipoAtual = (props[PROP_TIPO_REGISTRO] as { select?: { name?: string } | null })?.select
    ?.name
  const pessoaAtual = (
    props[PROP_RELATORIO_PESSOA] as { rich_text?: { plain_text?: string }[] }
  )?.rich_text
    ?.map((r) => r.plain_text ?? '')
    .join('')
    .trim()

  const mesmaBase =
    !page.parent?.data_source_id ||
    page.parent.data_source_id.replace(/-/g, '') ===
      NOTION_DATA_SOURCE_MOVIMENTACOES.replace(/-/g, '')
  const mesmaPessoa =
    pessoaAtual?.localeCompare(pessoaNome, 'pt-BR', { sensitivity: 'base' }) === 0

  if (!mesmaBase || tipoAtual !== tipo || !mesmaPessoa) {
    throw new Error('Registro não pertence a esta pessoa ou não é do tipo esperado.')
  }
}

async function buscarRegistroContagem(
  pessoaNome: string,
  mesAno: MesAno
): Promise<string | null> {
  const client = criarClienteNotion()
  const resposta = (await client.dataSources.query({
    data_source_id: NOTION_DATA_SOURCE_MOVIMENTACOES,
    page_size: 10,
    filter: {
      and: [
        { property: PROP_TIPO_REGISTRO, select: { equals: TIPO_REGISTRO_CONTAGEM_ENTREGAS } },
        { property: PROP_RELATORIO_PESSOA, rich_text: { equals: pessoaNome } },
        { property: PROP_MES_REFERENCIA, date: { equals: primeiroDiaDoMes(mesAno) } },
      ],
    },
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
  })) as { results: { id: string }[] }
  return resposta.results[0]?.id ?? null
}

/**
 * Grava a quantidade absoluta do mês (upsert). Com `registroPageId` conhecido atualiza direto —
 * evita duplicata quando a busca do Notion ainda não indexou a página recém-criada.
 */
export async function salvarContagemEntregasNotion(params: {
  pessoaNome: string
  mesAno: MesAno
  quantidade: number
  registroPageId?: string
}): Promise<{ registroPageId: string }> {
  exigirNotionReal('Contagem de entregas')
  const client = criarClienteNotion()

  if (params.registroPageId) {
    await garantirRegistroDoTipo(
      params.registroPageId,
      TIPO_REGISTRO_CONTAGEM_ENTREGAS,
      params.pessoaNome
    )
  }
  const existente =
    params.registroPageId ?? (await buscarRegistroContagem(params.pessoaNome, params.mesAno))

  if (existente) {
    await client.pages.update({
      page_id: existente,
      properties: {
        [PROP_QUANTIDADE_ENTREGAS]: { number: params.quantidade },
      },
    })
    return { registroPageId: existente }
  }

  const criada = await client.pages.create({
    parent: { type: 'data_source_id', data_source_id: NOTION_DATA_SOURCE_MOVIMENTACOES },
    properties: {
      Registro: {
        title: richText(`Entregas ${params.mesAno} — ${params.pessoaNome}`),
      },
      [PROP_TIPO_REGISTRO]: { select: { name: TIPO_REGISTRO_CONTAGEM_ENTREGAS } },
      [PROP_RELATORIO_PESSOA]: { rich_text: richText(params.pessoaNome) },
      [PROP_MES_REFERENCIA]: { date: { start: primeiroDiaDoMes(params.mesAno) } },
      [PROP_QUANTIDADE_ENTREGAS]: { number: params.quantidade },
      Para: { rich_text: richText('—') },
      Status: { rich_text: richText('Contagem de entregas') },
    },
  })
  return { registroPageId: criada.id }
}

export async function criarObservacaoNotion(params: {
  pessoaNome: string
  mesAno: MesAno
  texto: string
  autor: string
}): Promise<{ registroPageId: string; criadoEm: string }> {
  exigirNotionReal('Observação')
  const client = criarClienteNotion()
  const resumo = params.texto.replace(/\s+/g, ' ').slice(0, 80)

  const criada = (await client.pages.create({
    parent: { type: 'data_source_id', data_source_id: NOTION_DATA_SOURCE_MOVIMENTACOES },
    properties: {
      Registro: {
        title: richText(`Observação ${params.mesAno} — ${params.pessoaNome}: ${resumo}`),
      },
      [PROP_TIPO_REGISTRO]: { select: { name: TIPO_REGISTRO_OBSERVACAO } },
      [PROP_RELATORIO_PESSOA]: { rich_text: richText(params.pessoaNome) },
      [PROP_MES_REFERENCIA]: { date: { start: primeiroDiaDoMes(params.mesAno) } },
      [PROP_OBSERVACAO]: { rich_text: richText(params.texto) },
      [PROP_AUTOR_OBSERVACAO]: { rich_text: richText(params.autor) },
      Para: { rich_text: richText('—') },
      Status: { rich_text: richText('Observação do relatório') },
    },
  })) as { id: string; created_time?: string }

  return {
    registroPageId: criada.id,
    criadoEm: criada.created_time ?? new Date().toISOString(),
  }
}

export async function removerObservacaoNotion(
  registroPageId: string,
  pessoaNome: string
): Promise<void> {
  exigirNotionReal('Remover observação')
  await garantirRegistroDoTipo(registroPageId, TIPO_REGISTRO_OBSERVACAO, pessoaNome)
  const client = criarClienteNotion()
  await client.pages.update({ page_id: registroPageId, in_trash: true })
}
