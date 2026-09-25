import {
  AVATAR_TAMANHO_PX,
  estiloCaixaAvatarTravada,
  type AvatarTamanho,
} from '@/components/ui/avatar-tamanho'
import { cssVarCorPessoa, iniciaisDePessoa } from '@/lib/utils/pessoa-cor'
import { cn } from '@/lib/utils/cn'

type AvatarIniciaisProps = {
  nome: string
  /** Lista de pessoas do relatório — define ordem alfabética da cor. */
  pessoasReferencia: string[]
  className?: string
  tamanho?: AvatarTamanho
  /** Card em destaque (areia): avatar marinho com iniciais em areia clara. */
  destaque?: boolean
}

export function AvatarIniciais({
  nome,
  pessoasReferencia,
  className,
  tamanho = 'md',
  destaque = false,
}: AvatarIniciaisProps) {
  const iniciais = iniciaisDePessoa(nome)
  const cor = cssVarCorPessoa(nome, pessoasReferencia)

  const px = AVATAR_TAMANHO_PX[tamanho]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill font-medium',
        destaque ? 'bg-marinho text-areia-clara' : 'text-branco',
        tamanho === 'md' && 'text-16',
        tamanho === 'sm' && 'text-12',
        className
      )}
      style={{
        ...estiloCaixaAvatarTravada(px),
        ...(destaque ? {} : { backgroundColor: cor }),
      }}
      aria-hidden
    >
      {iniciais}
    </span>
  )
}
