import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type ContainerProps = HTMLAttributes<HTMLDivElement>

/** Largura máxima 1240px + medianiz 24px. Sem margem vertical/externa. */
export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-conteudo px-24', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** Grade de 12 colunas, gap 24px. */
export function GridRelatorio({ className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn('grid grid-cols-12 gap-24', className)}
      {...props}
    >
      {children}
    </div>
  )
}
