import { describe, expect, it } from 'vitest'
import { marcarDestaqueCardPrincipal } from '@/lib/relatorio/ordem-pessoas'

describe('marcarDestaqueCardPrincipal', () => {
  it('destaca Guilherme quando está na grade', () => {
    const cards = marcarDestaqueCardPrincipal([
      { nome: 'Guilherme', passagens: 1 },
      { nome: 'Mizael', passagens: 9 },
    ])
    expect(cards.find((c) => c.nome === 'Guilherme')?.destaque).toBe(true)
    expect(cards.find((c) => c.nome === 'Mizael')?.destaque).toBe(false)
  })

  it('sem Guilherme, destaca o primeiro da lista', () => {
    const cards = marcarDestaqueCardPrincipal([{ nome: 'Matheus', passagens: 2 }])
    expect(cards[0].destaque).toBe(true)
  })
})
