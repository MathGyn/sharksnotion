'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Texto } from '@/components/ui/texto'

export type ItemExclusaoDemandaUi = {
  demandaId: string
  titulo: string
  registroPageId?: string
}

type PainelExclusoesDemandaProps = {
  chaveRelatorio: string
  pessoaNome: string
  itens: ItemExclusaoDemandaUi[]
}

export function PainelExclusoesDemanda({
  chaveRelatorio,
  pessoaNome,
  itens,
}: PainelExclusoesDemandaProps) {
  const router = useRouter()
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  if (itens.length === 0) return null

  async function restaurar(item: ItemExclusaoDemandaUi) {
    setErro(null)
    setProcessandoId(item.demandaId)
    try {
      const res = await fetch(`/r/${chaveRelatorio}/excluir-demanda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'restaurar',
          demandaId: item.demandaId,
          pessoaNome,
          registroPageId: item.registroPageId,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { erro?: string }
        setErro(data.erro ?? 'Não foi possível restaurar.')
        return
      }
      router.refresh()
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <details
      className="group mt-24 rounded-interno border border-linha px-16"
      aria-label="Demandas excluídas do relatório"
    >
      <summary className="flex cursor-pointer list-none items-center gap-8 py-12 text-14 text-marinho-fumo transition-colors duration-120 hover:text-marinho [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 12 12"
          width={12}
          height={12}
          aria-hidden
          className="shrink-0 transition-transform duration-120 group-open:rotate-90 motion-reduce:transition-none"
        >
          <path d="M4.5 3 7.5 6 4.5 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          {itens.length === 1
            ? '1 demanda excluída deste relatório'
            : `${itens.length} demandas excluídas deste relatório`}
        </span>
      </summary>

      <div className="border-t border-linha pb-12 pt-8">
        <Texto tamanho={12} tom="secundario" className="mb-8">
          Não entram nas métricas nem nas listas. A demanda na Esteira continua igual.
        </Texto>
        {erro && (
          <p className="mb-8 text-12 text-atraso" role="alert">
            {erro}
          </p>
        )}
        <ul>
          {itens.map((item) => (
            <li
              key={item.registroPageId ?? item.demandaId}
              className="flex items-center justify-between gap-12 py-4"
            >
              <span className="min-w-0 truncate text-14 text-marinho-fumo">{item.titulo}</span>
              <button
                type="button"
                disabled={processandoId === item.demandaId}
                onClick={() => void restaurar(item)}
                className="shrink-0 text-12 text-marinho underline-offset-2 hover:underline disabled:opacity-50"
              >
                {processandoId === item.demandaId ? 'Restaurando…' : 'Restaurar'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
