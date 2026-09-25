/**
 * Gera mocks no formato de resposta da API Notion (dataSources.query).
 * Executar: npm run generate-mocks
 */
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const PESSOAS = ['Matheus', 'Mizael', 'Perdigão', 'Thamara', 'Guilherme', 'Regiane']
const ETAPAS = ['Não iniciado', 'Aprovação', 'Cancelados']
const TIPOS = ['Vídeo', 'Fotos', 'Design', 'Briefing', 'Administrativo', 'INTERNO']
const DEPTS = ['RH', 'Sec Vendas', 'Vendas Digitais', 'Financeiro', 'GI']
const UNIDADES = ['MARISTA', 'JARDIM GOIÁS', 'BUENO', 'TODAS']
const STATUS_DEMANDA = [
  'Não iniciado',
  'Aguardando Retorno',
  'Em andamento',
  'Ajustes',
  'Aprovação',
  'Concluído',
  'Cancelado',
]

let seq = 0
function uuid(prefix) {
  seq += 1
  const n = String(seq).padStart(12, '0')
  return `${prefix.slice(0, 8)}-${n.slice(0, 4)}-4000-8000-${n.slice(4)}`
}

function titleProp(name, value) {
  return {
    id: name,
    type: 'title',
    title: value ? [{ type: 'text', text: { content: value } }] : [],
  }
}

function richTextProp(name, value) {
  return {
    id: name,
    type: 'rich_text',
    rich_text: value ? [{ type: 'text', text: { content: value } }] : [],
  }
}

function selectProp(name, value) {
  return {
    id: name,
    type: 'select',
    select: value ? { name: value } : null,
  }
}

function statusProp(name, value) {
  return {
    id: name,
    type: 'status',
    status: value ? { name: value } : null,
  }
}

function dateProp(name, value) {
  return {
    id: name,
    type: 'date',
    date: value ? { start: value } : null,
  }
}

function peopleProp(name, names) {
  return {
    id: name,
    type: 'people',
    people: (names || []).map((n, i) => ({ object: 'user', id: `user-${n}`, name: n })),
  }
}

function relationProp(name, ids) {
  return {
    id: name,
    type: 'relation',
    relation: (ids || []).map((id) => ({ id })),
  }
}

function page(id, createdTime, url, properties) {
  return {
    object: 'page',
    id,
    created_time: createdTime,
    last_edited_time: createdTime,
    url,
    properties,
  }
}

function listResponse(results) {
  return {
    object: 'list',
    results,
    next_cursor: null,
    has_more: false,
  }
}

function isoDay(y, m, d, h = 12, min = 0) {
  return new Date(Date.UTC(y, m - 1, d, h + 3, min)).toISOString()
}

// --- Solicitações (~25) ---
const solicitacaoIds = []
const solicitacoes = []

for (let i = 0; i < 25; i += 1) {
  const id = uuid('b1000000')
  solicitacaoIds.push(id)
  const day = 1 + (i % 28)
  const month = i < 12 ? 8 : 9
  solicitacoes.push(
    page(
      id,
      isoDay(2026, month, day, 9),
      `https://notion.so/solic-${i}`,
      {
        Titulo: titleProp('Titulo', `Solicitação MKT ${i + 1}`),
        Departamento: selectProp('Departamento', DEPTS[i % DEPTS.length]),
        'Unidade/Loja': selectProp('Unidade/Loja', UNIDADES[i % UNIDADES.length]),
        Solicitante: peopleProp('Solicitante', ['Solicitante Loja']),
        'Data da Solicitação': dateProp('Data da Solicitação', `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`),
        'Prazo Desejado': dateProp('Prazo Desejado', `2026-09-${String(Math.min(28, day + 5)).padStart(2, '0')}`),
        'Estimativa de entrega ': dateProp('Estimativa de entrega ', i % 4 === 0 ? null : `2026-09-${String(Math.min(30, day + 7)).padStart(2, '0')}`),
        'Canal de uso ': selectProp('Canal de uso ', i % 3 === 0 ? 'Instagram' : 'WhatsApp'),
        'Objetivo do material': selectProp('Objetivo do material', 'Divulgação'),
        'Demanda na Esteira': relationProp('Demanda na Esteira', []),
      }
    )
  )
}

// --- Demandas (~40) ---
const demandaSpecs = []
const demandaIds = []

/** Concluídas em agosto sem movimentação (histórico só a partir de 21/09). */
const AGOSTO_SEM_MOV = new Set([9, 12, 15, 18, 21, 24, 27, 30])

const namedScenarios = [
  { key: 'ajustes-duplo', titulo: 'Vídeo Mega City 2 — retrabalho', tipo: 'Vídeo', sol: 0 },
  { key: 'dois-donos', titulo: 'Captação Ronivia', tipo: 'Vídeo', sol: 1 },
  { key: 'sem-solicitacao', titulo: 'Arte avulsa sem origem', tipo: 'Design', sol: null },
  { key: 'sem-prazo', titulo: 'Post interno equipe', tipo: 'INTERNO', sol: 2 },
  { key: 'atrasada', titulo: 'Tour Bueno atrasado', tipo: 'Vídeo', sol: 3 },
  { key: 'matheus-maiusculo', titulo: 'Stories Marista', tipo: 'Design', sol: 4 },
  { key: 'concluido-setembro', titulo: 'Fechamento setembro', tipo: 'Administrativo', sol: 5 },
  { key: 'fantasma', titulo: 'Demanda fantasma sem histórico', tipo: 'Briefing', sol: 6 },
]

for (let i = 0; i < 40; i += 1) {
  const id = uuid('a2000000')
  demandaIds.push(id)
  const scenario = i < namedScenarios.length ? namedScenarios[i] : null
  const titulo = scenario?.titulo ?? `${TIPOS[i % TIPOS.length]} demanda ${i + 1}`
  const tipo = scenario?.tipo ?? TIPOS[i % TIPOS.length]
  const solIdx = scenario ? scenario.sol : i % solicitacaoIds.length
  const solId = solIdx === null ? null : solicitacaoIds[solIdx]

  const month = i % 3 === 0 ? 8 : 9
  const day = 1 + (i % 27)

  let estaCom = PESSOAS[i % PESSOAS.length]
  let status = 'Em andamento'
  let prazo = `2026-09-${String(15 + (i % 10)).padStart(2, '0')}`
  let entrega = null

  let semMovimentacao = AGOSTO_SEM_MOV.has(i)

  if (semMovimentacao) {
    status = 'Concluído'
    estaCom = 'Concluído - Setembro'
    entrega = `2026-08-${String(day).padStart(2, '0')}`
    prazo = `2026-08-${String(Math.min(28, day + 3)).padStart(2, '0')}`
  }

  if (scenario?.key === 'sem-prazo') prazo = null
  if (scenario?.key === 'fantasma') {
    semMovimentacao = true
    status = 'Em andamento'
    estaCom = PESSOAS[i % PESSOAS.length]
    entrega = null
    prazo = null
  }
  if (scenario?.key === 'concluido-setembro') {
    estaCom = 'Concluído - Setembro'
    status = 'Concluído'
    entrega = '2026-09-30'
  }
  if (scenario?.key === 'atrasada') {
    status = 'Concluído'
    estaCom = 'Concluído - Setembro'
    prazo = '2026-09-10'
    entrega = '2026-09-14'
  }
  if (i > 30) {
    status = 'Concluído'
    estaCom = i % 2 === 0 ? 'Concluído - Setembro' : PESSOAS[i % PESSOAS.length]
    entrega = `2026-09-${String(5 + (i % 20)).padStart(2, '0')}`
  }

  demandaSpecs.push({
    id,
    titulo,
    tipo,
    solId,
    estaCom,
    status,
    prazo,
    entrega,
    created: isoDay(2026, month, day),
    scenario: scenario?.key ?? null,
    semMovimentacao,
  })
}

const demandas = demandaSpecs.map((d) =>
  page(d.id, d.created, `https://notion.so/dem-${d.id.slice(0, 8)}`, {
    Solicitação: titleProp('Solicitação', d.titulo),
    'Está com': selectProp('Está com', d.estaCom),
    Status: statusProp('Status', d.status),
    'Tipo de Conteúdo': selectProp('Tipo de Conteúdo', d.tipo),
    Urgência: selectProp('Urgência', d.scenario === 'atrasada' ? 'Alta' : 'Média'),
    Responsável: peopleProp('Responsável', [PESSOAS[demandaSpecs.indexOf(d) % PESSOAS.length]]),
    'Precisa entregar até ': dateProp('Precisa entregar até ', d.prazo),
    'Data De entrega': dateProp('Data De entrega', d.entrega),
    'Data gravação / edição': dateProp('Data gravação / edição', null),
    'Solicitação de Origem': relationProp('Solicitação de Origem', d.solId ? [d.solId] : []),
    Histórico: relationProp('Histórico', []),
  })
)

// Vincular solicitações → demandas
demandaSpecs.forEach((d, i) => {
  if (!d.solId) return
  const sol = solicitacoes.find((s) => s.id === d.solId)
  if (sol) {
    sol.properties['Demanda na Esteira'] = relationProp('Demanda na Esteira', [d.id])
  }
})

// --- Movimentações (~150, a partir de 21/09/2026) ---
const movimentacoes = []
let movSeq = 0

function addMov(demandaId, quando, para, status, registro) {
  movSeq += 1
  movimentacoes.push(
    page(
      uuid('c3000000'),
      quando,
      `https://notion.so/mov-${movSeq}`,
      {
        Registro: titleProp('Registro', registro),
        Demanda: relationProp('Demanda', demandaId ? [demandaId] : []),
        Para: richTextProp('Para', para),
        Status: richTextProp('Status', status),
      }
    )
  )
}

function timelineForDemanda(spec) {
  if (spec.semMovimentacao) return

  const baseDay = 21 + (demandaSpecs.indexOf(spec) % 10)
  const h = 10 + (demandaSpecs.indexOf(spec) % 8)
  let t = isoDay(2026, 9, Math.min(baseDay, 30), h)

  addMov(spec.id, t, 'Não iniciado', 'Não iniciado', spec.titulo)
  t = isoDay(2026, 9, Math.min(baseDay, 30), h + 1)
  addMov(spec.id, t, PESSOAS[demandaSpecs.indexOf(spec) % PESSOAS.length], 'Em andamento', spec.titulo)

  if (spec.scenario === 'matheus-maiusculo') {
    t = isoDay(2026, 9, Math.min(baseDay + 1, 30), h)
    addMov(spec.id, t, 'MATHEUS', 'Em andamento', spec.titulo)
  }

  if (spec.scenario === 'dois-donos') {
    t = isoDay(2026, 9, Math.min(baseDay + 1, 30), h)
    addMov(spec.id, t, 'Matheus', 'Em andamento', spec.titulo)
    t = isoDay(2026, 9, Math.min(baseDay + 1, 30), h + 2)
    addMov(spec.id, t, 'Mizael', 'Em andamento', spec.titulo)
  }

  if (spec.scenario === 'ajustes-duplo') {
    t = isoDay(2026, 9, Math.min(baseDay + 2, 30), h)
    addMov(spec.id, t, 'Aprovação', 'Aprovação', spec.titulo)
    t = isoDay(2026, 9, Math.min(baseDay + 2, 30), h + 1)
    addMov(spec.id, t, 'Matheus', 'Ajustes', spec.titulo)
    t = isoDay(2026, 9, Math.min(baseDay + 3, 30), h)
    addMov(spec.id, t, 'Aprovação', 'Aprovação', spec.titulo)
    t = isoDay(2026, 9, Math.min(baseDay + 3, 30), h + 1)
    addMov(spec.id, t, 'Mizael', 'Ajustes', spec.titulo)
  }

  if (spec.status === 'Concluído' || spec.scenario === 'atrasada' || spec.scenario === 'concluido-setembro') {
    const entregaDay = spec.entrega ? parseInt(spec.entrega.split('-')[2], 10) : Math.min(baseDay + 4, 30)
    t = isoDay(2026, 9, entregaDay, 18)
    addMov(spec.id, t, spec.estaCom.startsWith('Concluído') ? spec.estaCom : 'Concluído - Setembro', 'Concluído', spec.titulo)
  }
}

demandaSpecs.forEach(timelineForDemanda)

// Linha órfã (Demanda vazia)
addMov(null, isoDay(2026, 9, 22, 14), 'Matheus', 'Em andamento', 'Registro órfão')

// Completar até ~150 movimentações
const demandasComMov = demandaSpecs.filter((s) => !s.semMovimentacao)

while (movimentacoes.length < 150) {
  const spec = demandasComMov[movimentacoes.length % demandasComMov.length]
  const day = 21 + (movimentacoes.length % 9)
  addMov(
    spec.id,
    isoDay(2026, 9, Math.min(day, 30), 8 + (movimentacoes.length % 10)),
    PESSOAS[movimentacoes.length % PESSOAS.length],
    STATUS_DEMANDA[movimentacoes.length % STATUS_DEMANDA.length],
    `${spec.titulo} (extra ${movimentacoes.length})`
  )
}

const outDir = path.join(process.cwd(), 'mocks')
await mkdir(outDir, { recursive: true })

await writeFile(
  path.join(outDir, 'esteira-demandas.json'),
  JSON.stringify(listResponse(demandas), null, 2)
)
await writeFile(path.join(outDir, 'solicitacoes.json'), JSON.stringify(listResponse(solicitacoes), null, 2))
await writeFile(
  path.join(outDir, 'movimentacoes.json'),
  JSON.stringify(listResponse(movimentacoes), null, 2)
)

console.log(
  `Mocks gerados: ${demandas.length} demandas, ${solicitacoes.length} solicitações, ${movimentacoes.length} movimentações`
)
