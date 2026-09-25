import { describe, expect, it } from 'vitest'
import { partesMetadadosDemandaListagem } from '@/lib/relatorio/formatadores'
import type { DemandaListagemItem } from '@/lib/relatorio/filtros-demandas'

function item(partial: Partial<DemandaListagemItem>): DemandaListagemItem {
  return {
    id: 'd1',
    titulo: 'Teste',
    tipoConteudo: 'Vídeo',
    pessoaEntrega: 'Guilherme',
    departamento: 'RH',
    instanteConclusao: '2026-09-28T15:00:00.000Z',
    precisaEntregarAte: '2026-09-30',
    situacao: 'no prazo',
    ...partial,
  }
}

describe('metadados da lista expandida', () => {
  it('omite campos vazios', () => {
    expect(
      partesMetadadosDemandaListagem(
        item({ pessoaEntrega: null, instanteConclusao: null, tipoConteudo: 'Sem tipo' })
      )
    ).toEqual([])
  })

  it('ordem tipo · entregue (data fica à direita da linha)', () => {
    const partes = partesMetadadosDemandaListagem(item({}))
    expect(partes).toHaveLength(2)
    expect(partes[0]).toBe('Vídeo')
    expect(partes[1]).toBe('Guilherme')
  })
})
