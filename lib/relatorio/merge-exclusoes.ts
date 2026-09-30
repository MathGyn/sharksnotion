import type { ExclusaoDemandaRelatorio } from './exclusoes-demanda'
import { deduplicarExclusoesDemanda, pessoasIguais } from './exclusoes-demanda'

/** Une exclusões do Notion com JSON local (mock), sem duplicar par demanda+pessoa. */
export function mergeExclusoesDemanda(
  doNotion: ExclusaoDemandaRelatorio[],
  extras: ExclusaoDemandaRelatorio[]
): ExclusaoDemandaRelatorio[] {
  const out = [...doNotion]
  for (const extra of extras) {
    const duplicata = out.some(
      (e) => e.demandaId === extra.demandaId && pessoasIguais(e.pessoaNome, extra.pessoaNome)
    )
    if (!duplicata) out.push(extra)
  }
  return deduplicarExclusoesDemanda(out)
}
