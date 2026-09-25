/** Data sem hora — sempre AAAA-MM-DD */
export type DataISO = string

export type Departamento =
  | 'RH'
  | 'Sec Vendas'
  | 'Vendas Digitais'
  | 'Financeiro'
  | 'GI'

export type UnidadeLoja = 'MARISTA' | 'JARDIM GOIÁS' | 'BUENO' | 'TODAS'

export type TipoConteudo =
  | 'Vídeo'
  | 'Fotos'
  | 'Design'
  | 'Briefing'
  | 'Administrativo'
  | 'INTERNO'

export type Urgencia = 'Alta' | 'Média' | 'Baixa'

export interface Demanda {
  id: string
  solicitacao: string
  estaComAtual: string
  status: string
  tipoConteudo: TipoConteudo | null
  urgencia: Urgencia | null
  responsavel: string[]
  precisaEntregarAte: DataISO | null
  dataDeEntrega: DataISO | null
  dataGravacaoEdicao: DataISO | null
  solicitacaoDeOrigemId: string | null
  historicoIds: string[]
  criadoEm: string
  notionUrl: string
}

export interface Solicitacao {
  id: string
  titulo: string
  departamento: Departamento | null
  unidade: UnidadeLoja | null
  solicitante: string[]
  dataDaSolicitacao: DataISO | null
  prazoDesejado: DataISO | null
  estimativaDeEntrega: DataISO | null
  canalDeUso: string | null
  objetivoDoMaterial: string | null
  demandaNaEsteiraIds: string[]
  criadoEm: string
}

export interface Movimentacao {
  id: string
  registro: string
  demandaId: string | null
  para: string
  status: string
  quando: string
}

export interface NotionDataSources {
  demandas: Demanda[]
  solicitacoes: Solicitacao[]
  movimentacoes: Movimentacao[]
  avisosNotion: string[]
}

/** Resposta paginada crua da API (dataSources.query ou mock) */
export interface NotionListResponse {
  object: 'list'
  results: NotionPage[]
  next_cursor: string | null
  has_more: boolean
}

/** Página Notion antes da normalização */
export interface NotionPage {
  object: 'page'
  id: string
  created_time: string
  url: string
  properties: Record<string, unknown>
}

export interface NotionRawBundle {
  demandasPages: NotionPage[]
  solicitacoesPages: NotionPage[]
  movimentacoesPages: NotionPage[]
  /** Bases que falharam com NOTION_TOKEN (não usa mock). */
  avisos?: string[]
}
