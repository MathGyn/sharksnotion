import { describe, expect, it } from 'vitest'
import { rotuloDataListaDemanda } from '@/lib/relatorio/formatadores'
import type { DemandaListagemItem } from '@/lib/relatorio/filtros-demandas'

function item(partial: Partial<DemandaListagemItem>): DemandaListagemItem {
  return {
    id: 'd1',
    titulo: 'Teste',
    tipoConteudo: 'Design',
    pessoaEntrega: null,
    departamento: 'RH',
    instanteConclusao: null,
    precisaEntregarAte: null,
    situacao: 'sem prazo',
    ...partial,
  }
}

describe('rotuloDataListaDemanda', () => {
  it('mostra data/hora de conclusão', () => {
    const rotulo = rotuloDataListaDemanda(
      item({ instanteConclusao: '2026-09-23T22:00:00.000Z', situacao: 'no prazo' })
    )
    expect(rotulo).toMatch(/23\/09\/2026/)
  })

  it('sem conclusão mostra prazo desejado', () => {
    expect(
      rotuloDataListaDemanda(item({ precisaEntregarAte: '2026-09-15' }))
    ).toBe('Prazo 15/09/2026')
  })
})
