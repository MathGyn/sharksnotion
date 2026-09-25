import { iniciaisDePessoa } from './iniciais'

const MAX_PESSOAS = 6

function normalizarNome(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR')
}

/**
 * Ordena pessoas distintas alfabeticamente (pt-BR, sem diferenciar maiúsculas)
 * e devolve o índice 1–6 para mapear em var(--pessoa-N).
 */
export function indiceCorPessoa(nome: string, pessoasNosDados: string[]): number {
  const unicas = [
    ...new Set(pessoasNosDados.map(normalizarNome).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const alvo = normalizarNome(nome)
  const idx = unicas.indexOf(alvo)

  if (idx === -1) return 1
  return (idx % MAX_PESSOAS) + 1
}

export function cssVarCorPessoa(nome: string, pessoasNosDados: string[]): string {
  const indice = indiceCorPessoa(nome, pessoasNosDados)
  return `var(--pessoa-${indice})`
}

export { iniciaisDePessoa }
