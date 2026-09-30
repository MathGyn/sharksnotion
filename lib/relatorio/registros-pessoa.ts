import type { Intervalo } from '@/lib/utils/date'
import { pessoasIguais } from './exclusoes-demanda'

/** AAAA-MM */
export type MesAno = string

/** Contagem manual de entregas de uma pessoa num mês (registro em Movimentações). */
export interface ContagemEntregasMensal {
  pessoaNome: string
  mesAno: MesAno
  quantidade: number
  registroPageId?: string
  atualizadoEm: string
}

/** Comentário do gestor/pessoa sobre o mês — vai para o relatório mensal. */
export interface ObservacaoPessoaMensal {
  id: string
  pessoaNome: string
  mesAno: MesAno
  texto: string
  autor: string
  criadoEm: string
  registroPageId?: string
}

export const LIMITE_QUANTIDADE_ENTREGAS = 100_000
export const LIMITE_TEXTO_OBSERVACAO = 4000
export const LIMITE_AUTOR_OBSERVACAO = 80

const REGEX_MES_ANO = /^\d{4}-(0[1-9]|1[0-2])$/

export function mesAnoValido(valor: unknown): valor is MesAno {
  return typeof valor === 'string' && REGEX_MES_ANO.test(valor)
}

export function quantidadeEntregasValida(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= 0 &&
    valor <= LIMITE_QUANTIDADE_ENTREGAS
  )
}

/** Mês editável da página: só quando o período cabe inteiro num mês civil. */
export function mesReferenciaDoIntervalo(intervalo: Intervalo): MesAno | null {
  const inicio = intervalo.de.slice(0, 7)
  return inicio === intervalo.ate.slice(0, 7) ? inicio : null
}

export function mesAnterior(mesAno: MesAno): MesAno {
  const [ano, mes] = mesAno.split('-').map(Number)
  return mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, '0')}`
}

/** Meses civis tocados pelo intervalo, em ordem crescente. */
export function mesesDoIntervalo(intervalo: Intervalo): MesAno[] {
  const meses: MesAno[] = []
  let [ano, mes] = intervalo.de.slice(0, 7).split('-').map(Number)
  const fim = intervalo.ate.slice(0, 7)

  for (let guarda = 0; guarda < 240; guarda++) {
    const atual = `${ano}-${String(mes).padStart(2, '0')}`
    meses.push(atual)
    if (atual >= fim) break
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return meses
}

/**
 * Um registro por pessoa+mês. Se o Notion tiver duplicatas (duas abas salvando ao mesmo
 * tempo), vale o mais recente.
 */
export function deduplicarContagensEntregas(
  contagens: ContagemEntregasMensal[]
): ContagemEntregasMensal[] {
  const porChave = new Map<string, ContagemEntregasMensal>()
  for (const c of contagens) {
    const chave = `${c.pessoaNome.toLocaleLowerCase('pt-BR')}|${c.mesAno}`
    const atual = porChave.get(chave)
    if (!atual || c.atualizadoEm > atual.atualizadoEm) porChave.set(chave, c)
  }
  return [...porChave.values()]
}

export function contagemEntregasDoMes(
  contagens: ContagemEntregasMensal[],
  pessoaNome: string,
  mesAno: MesAno
): ContagemEntregasMensal | null {
  return (
    deduplicarContagensEntregas(contagens).find(
      (c) => c.mesAno === mesAno && pessoasIguais(c.pessoaNome, pessoaNome)
    ) ?? null
  )
}

export function totalEntregasManuaisNoIntervalo(
  contagens: ContagemEntregasMensal[],
  pessoaNome: string,
  intervalo: Intervalo
): number {
  const meses = new Set(mesesDoIntervalo(intervalo))
  return deduplicarContagensEntregas(contagens)
    .filter((c) => meses.has(c.mesAno) && pessoasIguais(c.pessoaNome, pessoaNome))
    .reduce((acc, c) => acc + c.quantidade, 0)
}

/** Observações da pessoa nos meses do intervalo — mais recentes primeiro. */
export function observacoesDaPessoaNoIntervalo(
  observacoes: ObservacaoPessoaMensal[],
  pessoaNome: string,
  intervalo: Intervalo
): ObservacaoPessoaMensal[] {
  const meses = new Set(mesesDoIntervalo(intervalo))
  return observacoes
    .filter((o) => meses.has(o.mesAno) && pessoasIguais(o.pessoaNome, pessoaNome))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

export interface RegistrosPessoaNoPeriodo {
  /** Mês editável na página; nulo quando o período cobre vários meses. */
  mesReferencia: MesAno | null
  contagemMes: ContagemEntregasMensal | null
  totalEntregas: number
  observacoes: ObservacaoPessoaMensal[]
}

export function registrosPessoaNoPeriodo(
  contagens: ContagemEntregasMensal[],
  observacoes: ObservacaoPessoaMensal[],
  pessoaNome: string,
  intervalo: Intervalo
): RegistrosPessoaNoPeriodo {
  const mesReferencia = mesReferenciaDoIntervalo(intervalo)
  return {
    mesReferencia,
    contagemMes: mesReferencia ? contagemEntregasDoMes(contagens, pessoaNome, mesReferencia) : null,
    totalEntregas: totalEntregasManuaisNoIntervalo(contagens, pessoaNome, intervalo),
    observacoes: observacoesDaPessoaNoIntervalo(observacoes, pessoaNome, intervalo),
  }
}

/** Pessoas com entrega manual ou observação no intervalo (para incluir no relatório mensal). */
export function pessoasComRegistrosNoIntervalo(
  contagens: ContagemEntregasMensal[],
  observacoes: ObservacaoPessoaMensal[],
  intervalo: Intervalo
): string[] {
  const meses = new Set(mesesDoIntervalo(intervalo))
  const nomes: string[] = []
  const adicionar = (nome: string) => {
    if (!nomes.some((n) => pessoasIguais(n, nome))) nomes.push(nome)
  }
  for (const c of deduplicarContagensEntregas(contagens)) {
    if (meses.has(c.mesAno) && c.quantidade > 0) adicionar(c.pessoaNome)
  }
  for (const o of observacoes) {
    if (meses.has(o.mesAno)) adicionar(o.pessoaNome)
  }
  return nomes
}
