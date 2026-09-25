import type { CSSProperties } from 'react'

/** Foto/iniciais nos cards de pessoa (md) e variantes menores (sm). */
export const AVATAR_TAMANHO_PX = {
  sm: 32,
  md: 70,
} as const

export type AvatarTamanho = keyof typeof AVATAR_TAMANHO_PX

/** Trava largura/altura no flex — evita foto do Notion estourar o layout. */
export function estiloCaixaAvatarTravada(px: number): CSSProperties {
  return {
    width: px,
    height: px,
    minWidth: px,
    maxWidth: px,
    minHeight: px,
    maxHeight: px,
    flex: `0 0 ${px}px`,
  }
}
