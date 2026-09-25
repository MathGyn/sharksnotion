import { describe, expect, it } from 'vitest'
import {
  formatarRotuloPeriodo,
  intervaloDeMesAno,
  resolverPeriodoConsulta,
} from '@/lib/relatorio/periodo'

describe('periodo', () => {
  it('?mes= converte para de/ate do mês', () => {
    const ref = new Date('2026-12-31')
    const r = resolverPeriodoConsulta({ mes: '2026-09' }, [], [], ref)
    expect(r.intervalo).toEqual(intervaloDeMesAno('2026-09'))
    expect(r.rotulo).toBe(formatarRotuloPeriodo(r.intervalo))
  })

  it('rótulo por extenso para mês inteiro', () => {
    expect(formatarRotuloPeriodo({ de: '2026-09-01', ate: '2026-09-30' })).toBe(
      '1 a 30 de setembro de 2026'
    )
  })
})
