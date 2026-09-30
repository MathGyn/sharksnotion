import { promises as fs } from 'fs'
import path from 'path'
import { shouldUseNotionMocks } from '@/lib/notion/data-source'
import {
  criarExclusaoRelatorioMovimentacao,
  restaurarExclusaoRelatorioMovimentacao,
} from '@/lib/notion/exclusoes-relatorio'
import { type ExclusaoDemandaRelatorio, pessoasIguais } from './exclusoes-demanda'

const ARQUIVO_LOCAL = path.join(process.cwd(), 'data', 'relatorio-exclusoes.json')

async function lerArquivoLocal(): Promise<ExclusaoDemandaRelatorio[]> {
  try {
    const raw = await fs.readFile(ARQUIVO_LOCAL, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is ExclusaoDemandaRelatorio =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ExclusaoDemandaRelatorio).demandaId === 'string' &&
        typeof (item as ExclusaoDemandaRelatorio).pessoaNome === 'string'
    )
  } catch {
    return []
  }
}

async function gravarArquivoLocal(exclusoes: ExclusaoDemandaRelatorio[]): Promise<void> {
  await fs.mkdir(path.dirname(ARQUIVO_LOCAL), { recursive: true })
  await fs.writeFile(ARQUIVO_LOCAL, `${JSON.stringify(exclusoes, null, 2)}\n`, 'utf8')
}

/** Exclusões extras só em dev/mock (JSON); live vem das Movimentações no fetch. */
export async function listarExclusoesDemandaMockLocal(): Promise<ExclusaoDemandaRelatorio[]> {
  if (!shouldUseNotionMocks()) return []
  return lerArquivoLocal()
}

export async function excluirDemandaDoRelatorioPessoa(
  demandaId: string,
  pessoaNome: string,
  tituloDemanda: string
): Promise<void> {
  if (shouldUseNotionMocks()) {
    const atual = await lerArquivoLocal()
    const jaExiste = atual.some(
      (e) => e.demandaId === demandaId && pessoasIguais(e.pessoaNome, pessoaNome)
    )
    if (!jaExiste) {
      await gravarArquivoLocal([...atual, { demandaId, pessoaNome }])
    }
    return
  }

  await criarExclusaoRelatorioMovimentacao(demandaId, pessoaNome, tituloDemanda)
}

export async function restaurarDemandaNoRelatorioPessoa(
  exclusao: ExclusaoDemandaRelatorio
): Promise<void> {
  if (shouldUseNotionMocks()) {
    const atual = await lerArquivoLocal()
    await gravarArquivoLocal(
      atual.filter(
        (e) =>
          !(
            e.demandaId === exclusao.demandaId &&
            pessoasIguais(e.pessoaNome, exclusao.pessoaNome)
          )
      )
    )
    return
  }

  await restaurarExclusaoRelatorioMovimentacao(exclusao)
}
