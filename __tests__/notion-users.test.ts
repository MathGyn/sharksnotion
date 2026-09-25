import { describe, expect, it } from 'vitest'
import { mapaAvatarPorNome, resolverAvatarUrl } from '@/lib/notion/users'

describe('avatares Notion', () => {
  const perfis = [
    { id: '1', nome: 'Guilherme Souza', avatarUrl: 'https://example.com/gui.jpg' },
    { id: '2', nome: 'Matheus', avatarUrl: 'https://example.com/matheus.jpg' },
    { id: '3', nome: 'Mizael', avatarUrl: null },
  ]

  it('resolve por nome exato', () => {
    expect(resolverAvatarUrl('Matheus', perfis)).toBe('https://example.com/matheus.jpg')
  })

  it('resolve por primeiro nome do perfil', () => {
    expect(resolverAvatarUrl('Guilherme', perfis)).toBe('https://example.com/gui.jpg')
  })

  it('monta mapa para nomes da esteira', () => {
    expect(mapaAvatarPorNome(perfis, ['Matheus', 'Mizael', 'Regiane'])).toEqual({
      Matheus: 'https://example.com/matheus.jpg',
      Mizael: null,
      Regiane: null,
    })
  })
})
