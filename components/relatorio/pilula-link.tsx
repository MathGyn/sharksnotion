import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

type PilulaLinkProps = {
  href: string
  ativa?: boolean
  children: React.ReactNode
}

export function PilulaLink({ href, ativa = false, children }: PilulaLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center rounded-pill border px-16 py-8 text-14 font-medium leading-texto transition-colors duration-120',
        ativa
          ? 'border-marinho bg-marinho text-branco'
          : 'border-linha bg-transparent text-marinho hover:border-marinho-fumo'
      )}
    >
      {children}
    </Link>
  )
}
