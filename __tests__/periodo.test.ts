import { describe, expect, it } from 'vitest'
import {
  formatarRotuloPeriodo,
  intervaloDeMesAno,
  presetEsteMes,
  resolverPeriodoConsulta,
} from '@/lib/relatorio/periodo'

describe('periodo', () => {
  it('?mes= converte para de/ate do mês', () => {
    const ref = new Date('2026-12-31')
    const r = resolverPeriodoConsulta({ mes: '2026-09' }, { referencia: ref })
    expect(r.intervalo).toEqual(intervaloDeMesAno('2026-09'))
    expect(r.rotulo).toBe(formatarRotuloPeriodo(r.intervalo))
  })

  it('rótulo por extenso para mês inteiro', () => {
    expect(formatarRotuloPeriodo({ de: '2026-09-01', ate: '2026-09-30' })).toBe(
      '1 a 30 de setembro de 2026'
    )
  })

  it('sem params nem cookie usa este mês (São Paulo)', () => {
    const ref = new Date('2026-10-02T15:00:00.000Z')
    const r = resolverPeriodoConsulta({}, { referencia: ref })
    expect(r.preset).toBe('este-mes')
    expect(r.intervalo).toEqual(presetEsteMes(ref))
  })

  it('cookie de preferência quando não há query de período', () => {
    const ref = new Date('2026-10-02T15:00:00.000Z')
    const r = resolverPeriodoConsulta(
      {},
      {
        referencia: ref,
        intervaloPreferencia: { de: '2026-09-01', ate: '2026-09-30' },
      }
    )
    expect(r.intervalo).toEqual({ de: '2026-09-01', ate: '2026-09-30' })
    expect(r.preset).toBe('mes-passado')
  })

  it('query de/ate tem prioridade sobre cookie', () => {
    const ref = new Date('2026-10-02T15:00:00.000Z')
    const r = resolverPeriodoConsulta(
      { de: '2026-08-01', ate: '2026-08-31' },
      {
        referencia: ref,
        intervaloPreferencia: { de: '2026-09-01', ate: '2026-09-30' },
      }
    )
    expect(r.intervalo.de).toBe('2026-08-01')
  })
})
