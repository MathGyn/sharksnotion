import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primario' | 'contorno'
}

/** Ações como “Baixar PDF” — pílula, sem seta decorativa. */
export function Botao({
  className,
  children,
  variant = 'primario',
  type = 'button',
  ...props
}: BotaoProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center rounded-pill border px-16 py-8 text-14 font-medium leading-texto transition-colors duration-120',
        variant === 'primario' &&
          'border-marinho bg-marinho text-branco hover:bg-marinho-fumo hover:border-marinho-fumo',
        variant === 'contorno' &&
          'border-linha bg-transparent text-marinho hover:border-marinho-fumo',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
