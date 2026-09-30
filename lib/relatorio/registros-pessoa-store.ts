import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { shouldUseNotionMocks } from '@/lib/notion/data-source'
import {
  criarObservacaoNotion,
  removerObservacaoNotion,
  salvarContagemEntregasNotion,
} from '@/lib/notion/registros-pessoa-notion'
import { pessoasIguais } from './exclusoes-demanda'
import type {
  ContagemEntregasMensal,
  MesAno,
  ObservacaoPessoaMensal,
} from './registros-pessoa'

const ARQUIVO_LOCAL = path.join(process.cwd(), 'data', 'relatorio-registros-pessoa.json')

type ArquivoLocal = {
  contagens: ContagemEntregasMensal[]
  observacoes: ObservacaoPessoaMensal[]
}

async function lerArquivoLocal(): Promise<ArquivoLocal> {
  try {
    const parsed = JSON.parse(await fs.readFile(ARQUIVO_LOCAL, 'utf8')) as Partial<ArquivoLocal>
    return {
      contagens: Array.isArray(parsed.contagens) ? parsed.contagens : [],
      observacoes: Array.isArray(parsed.observacoes) ? parsed.observacoes : [],
    }
  } catch {
    return { contagens: [], observacoes: [] }
  }
}

async function gravarArquivoLocal(dados: ArquivoLocal): Promise<void> {
  await fs.mkdir(path.dirname(ARQUIVO_LOCAL), { recursive: true })
  await fs.writeFile(ARQUIVO_LOCAL, `${JSON.stringify(dados, null, 2)}\n`, 'utf8')
}

/** Registros extras só em dev/mock (JSON); live vem das Movimentações no fetch. */
export async function listarRegistrosPessoaMockLocal(): Promise<ArquivoLocal> {
  if (!shouldUseNotionMocks()) return { contagens: [], observacoes: [] }
  return lerArquivoLocal()
}

export async function definirContagemEntregas(params: {
  pessoaNome: string
  mesAno: MesAno
  quantidade: number
  registroPageId?: string
}): Promise<{ registroPageId?: string }> {
  if (!shouldUseNotionMocks()) {
    return salvarContagemEntregasNotion(params)
  }

  const dados = await lerArquivoLocal()
  const outras = dados.contagens.filter(
    (c) => !(c.mesAno === params.mesAno && pessoasIguais(c.pessoaNome, params.pessoaNome))
  )
  await gravarArquivoLocal({
    ...dados,
    contagens: [
      ...outras,
      {
        pessoaNome: params.pessoaNome,
        mesAno: params.mesAno,
        quantidade: params.quantidade,
        atualizadoEm: new Date().toISOString(),
      },
    ],
  })
  return {}
}

export async function adicionarObservacao(params: {
  pessoaNome: string
  mesAno: MesAno
  texto: string
  autor: string
}): Promise<ObservacaoPessoaMensal> {
  if (!shouldUseNotionMocks()) {
    const { registroPageId, criadoEm } = await criarObservacaoNotion(params)
    return { ...params, id: registroPageId, registroPageId, criadoEm }
  }

  const nova: ObservacaoPessoaMensal = {
    ...params,
    id: randomUUID(),
    criadoEm: new Date().toISOString(),
  }
  const dados = await lerArquivoLocal()
  await gravarArquivoLocal({ ...dados, observacoes: [...dados.observacoes, nova] })
  return nova
}

export async function removerObservacao(params: {
  id: string
  pessoaNome: string
}): Promise<void> {
  if (!shouldUseNotionMocks()) {
    await removerObservacaoNotion(params.id, params.pessoaNome)
    return
  }

  const dados = await lerArquivoLocal()
  await gravarArquivoLocal({
    ...dados,
    observacoes: dados.observacoes.filter((o) => o.id !== params.id),
  })
}
