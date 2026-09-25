import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type PilulaProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ativa?: boolean
}

/** Navegação 3.4 — ativa marinho; inativa borda linha, fundo transparente. */
export function Pilula({
  className,
  children,
  ativa = false,
  type = 'button',
  ...props
}: PilulaProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center rounded-pill border px-16 py-8 text-14 font-medium leading-texto transition-colors duration-120',
        ativa
          ? 'border-marinho bg-marinho text-branco'
          : 'border-linha bg-transparent text-marinho hover:border-marinho-fumo',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
