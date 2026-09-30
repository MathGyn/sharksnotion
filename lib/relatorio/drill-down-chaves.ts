import { departamentoParaSlug, tipoConteudoParaSlug } from './slugs-filtro'

export function chaveAbertoDepartamento(nomeDepartamento: string): string {
  return `departamento:${departamentoParaSlug(nomeDepartamento)}`
}

export function chaveAbertoTipo(nomeTipo: string): string {
  return `tipo:${tipoConteudoParaSlug(nomeTipo)}`
}
