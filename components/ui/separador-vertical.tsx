import { cn } from '@/lib/utils/cn'

type SeparadorVerticalProps = {
  className?: string
}

/** Linha vertical 1px — indicadores 3.5. Altura vem do pai (flex/grid). */
export function SeparadorVertical({ className }: SeparadorVerticalProps) {
  return (
    <div
      role="presentation"
      className={cn('w-0 self-stretch border-l border-linha', className)}
    />
  )
}
