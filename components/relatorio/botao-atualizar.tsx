'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

type BotaoAtualizarProps = {
  chave: string
}

function IconeAtualizar({ className }: { className?: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M21 3v6h-6"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BotaoAtualizar({ chave }: BotaoAtualizarProps) {
  const router = useRouter()
  const [atualizando, setAtualizando] = useState(false)

  async function atualizar() {
    if (atualizando) return
    setAtualizando(true)
    try {
      const res = await fetch(`/r/${encodeURIComponent(chave)}/atualizar`, {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      router.refresh()
    } catch {
      window.alert('Não foi possível atualizar agora. Tente de novo em instantes.')
    } finally {
      setAtualizando(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void atualizar()}
      disabled={atualizando}
      aria-label={atualizando ? 'Atualizando dados do Notion' : 'Atualizar dados do Notion'}
      title="Atualizar dados do Notion"
      className={cn(
        'inline-flex h-40 w-40 shrink-0 items-center justify-center rounded-interno border border-linha bg-branco text-marinho-fumo transition-colors duration-120',
        'hover:border-marinho-fumo hover:text-marinho disabled:cursor-wait disabled:opacity-70'
      )}
    >
      <IconeAtualizar
        className={cn(atualizando && 'motion-safe:animate-[tubarao-atualizar-girar_0.85s_linear_infinite]')}
      />
    </button>
  )
}
