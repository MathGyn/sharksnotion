import type { DataISO, Demanda, Movimentacao, NotionPage, Solicitacao } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractTitle(property: any): string {
  if (!property?.title || property.title.length === 0) return ''
  return property.title[0]?.text?.content || ''
}

function extractRichText(property: any): string {
  if (!property?.rich_text || property.rich_text.length === 0) return ''
  return property.rich_text[0]?.text?.content || ''
}

function extractSelect(property: any): string | null {
  return property?.select?.name || null
}

function extractStatus(property: any): string {
  return property?.status?.name || ''
}

function extractPeople(property: any): string[] {
  if (!property?.people || property.people.length === 0) return []
  return property.people.map((person: any) => person.name || '').filter(Boolean)
}

function extractDate(property: any): DataISO | null {
  return property?.date?.start || null
}

function extractRelation(property: any): string[] {
  if (!property?.relation || property.relation.length === 0) return []
  return property.relation.map((rel: any) => rel.id).filter(Boolean)
}

export function normalizeDemanda(page: NotionPage): Demanda {
  const props = page.properties as Record<string, any>

  return {
    id: page.id,
    solicitacao: extractTitle(props['Solicitação']),
    estaComAtual: extractSelect(props['Está com']) || '',
    status: extractStatus(props['Status']),
    tipoConteudo: extractSelect(props['Tipo de Conteúdo']) as Demanda['tipoConteudo'],
    urgencia: extractSelect(props['Urgência']) as Demanda['urgencia'],
    responsavel: extractPeople(props['Responsável']),
    precisaEntregarAte: extractDate(props['Precisa entregar até ']),
    dataDeEntrega: extractDate(props['Data De entrega']),
    dataGravacaoEdicao: extractDate(props['Data gravação / edição']),
    solicitacaoDeOrigemId: extractRelation(props['Solicitação de Origem'])[0] || null,
    historicoIds: extractRelation(props['Histórico']),
    criadoEm: page.created_time,
    notionUrl: page.url,
  }
}

export function normalizeSolicitacao(page: NotionPage): Solicitacao {
  const props = page.properties as Record<string, any>

  return {
    id: page.id,
    titulo: extractTitle(props['Titulo']),
    departamento: extractSelect(props['Departamento']) as Solicitacao['departamento'],
    unidade: extractSelect(props['Unidade/Loja']) as Solicitacao['unidade'],
    solicitante: extractPeople(props['Solicitante']),
    dataDaSolicitacao: extractDate(props['Data da Solicitação']),
    prazoDesejado: extractDate(props['Prazo Desejado']),
    estimativaDeEntrega: extractDate(props['Estimativa de entrega ']),
    canalDeUso: extractSelect(props['Canal de uso ']),
    objetivoDoMaterial: extractSelect(props['Objetivo do material']),
    demandaNaEsteiraIds: extractRelation(props['Demanda na Esteira']),
    criadoEm: page.created_time,
  }
}

export function normalizeMovimentacao(page: NotionPage): Movimentacao {
  const props = page.properties as Record<string, any>

  return {
    id: page.id,
    registro: extractTitle(props['Registro']),
    demandaId: extractRelation(props['Demanda'])[0] || null,
    para: extractRichText(props['Para']),
    status: extractRichText(props['Status']),
    quando: page.created_time,
  }
}
