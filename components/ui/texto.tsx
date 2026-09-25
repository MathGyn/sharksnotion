import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type TextoProps = HTMLAttributes<HTMLParagraphElement> & {
  tamanho?: 12 | 14 | 16
  tom?: 'principal' | 'secundario'
  as?: 'p' | 'span'
}

export function Texto({
  className,
  children,
  tamanho = 14,
  tom = 'principal',
  as: Tag = 'p',
  ...props
}: TextoProps) {
  return (
    <Tag
      className={cn(
        'font-archivo-normal leading-texto',
        tamanho === 12 && 'text-12',
        tamanho === 14 && 'text-14',
        tamanho === 16 && 'text-16',
        tom === 'principal' && 'text-marinho',
        tom === 'secundario' && 'text-marinho-fumo',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

type NumeroProps = HTMLAttributes<HTMLSpanElement> & {
  tamanho?: 20 | 26 | 40 | 48 | 64 | 96
  tom?: 'principal' | 'secundario'
}

/** Números grandes — Archivo expandido + tabular-nums (3.5, cards 3.3). */
export function Numero({
  className,
  children,
  tamanho = 64,
  tom = 'principal',
  ...props
}: NumeroProps) {
  return (
    <span
      className={cn(
        'font-archivo-expanded tabular-nums leading-titulo tracking-titulo',
        tamanho === 20 && 'text-20',
        tamanho === 26 && 'text-26',
        tamanho === 40 && 'text-40',
        tamanho === 48 && 'text-48',
        tamanho === 64 && 'text-64',
        tamanho === 96 && 'text-96',
        tom === 'principal' && 'text-marinho',
        tom === 'secundario' && 'text-marinho-fumo',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/** Rótulo sob indicador — 14px marinho-fumo, frase normal (sem caixa alta). */
export function RotuloIndicador({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Texto
      as="p"
      tamanho={14}
      tom="secundario"
      className={className}
      {...props}
    >
      {children}
    </Texto>
  )
}
