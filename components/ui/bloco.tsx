import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BlocoProps = HTMLAttributes<HTMLDivElement> & {
  /** Destaque único areia — só o card de quem mais entregou (3.3). */
  variant?: 'padrao' | 'destaque'
}

/**
 * Superfície grande (raio 28px). Profundidade por borda, sem sombra.
 */
export function Bloco({
  className,
  children,
  variant = 'padrao',
  ...props
}: BlocoProps) {
  return (
    <div
      className={cn(
        'rounded-bloco border border-linha',
        variant === 'padrao' && 'bg-branco text-marinho',
        variant === 'destaque' && 'bg-areia text-marinho',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
