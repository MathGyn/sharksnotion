import { AvatarIniciais } from '@/components/ui/avatar-iniciais'
import {
  AVATAR_TAMANHO_PX,
  estiloCaixaAvatarTravada,
  type AvatarTamanho,
} from '@/components/ui/avatar-tamanho'
import { cn } from '@/lib/utils/cn'

type AvatarPessoaProps = {
  nome: string
  pessoasReferencia: string[]
  fotoUrl?: string | null
  className?: string
  tamanho?: AvatarTamanho
  destaque?: boolean
}

export function AvatarPessoa({
  nome,
  pessoasReferencia,
  fotoUrl,
  className,
  tamanho = 'md',
  destaque = false,
}: AvatarPessoaProps) {
  const px = AVATAR_TAMANHO_PX[tamanho]

  if (fotoUrl) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-pill bg-linha',
          destaque && 'ring-2 ring-marinho ring-offset-2 ring-offset-areia',
          className
        )}
        style={estiloCaixaAvatarTravada(px)}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotoUrl}
          alt=""
          width={px}
          height={px}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </span>
    )
  }

  return (
    <AvatarIniciais
      nome={nome}
      pessoasReferencia={pessoasReferencia}
      tamanho={tamanho}
      destaque={destaque}
      className={className}
    />
  )
}
