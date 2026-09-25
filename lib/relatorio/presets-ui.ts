import type { PresetPeriodo } from './periodo'
import { opcoesPresetPeriodo } from './periodo'

export type OpcaoPresetUi = {
  id: PresetPeriodo | 'personalizado'
  rotulo: string
  de: string
  ate: string
}

export function presetsPeriodoParaUi(referencia: Date = new Date()): OpcaoPresetUi[] {
  return opcoesPresetPeriodo(referencia).map((p) => ({
    id: p.id,
    rotulo: p.rotulo,
    de: p.intervalo.de,
    ate: p.intervalo.ate,
  }))
}
