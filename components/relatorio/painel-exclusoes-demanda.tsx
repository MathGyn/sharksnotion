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
    <section className="mt-48 border-t border-linha pt-32" aria-label="Demandas excluídas do relatório">
      <Texto tamanho={16} className="mb-8 font-medium">
        Excluídas deste relatório
      </Texto>
      <Texto tamanho={14} tom="secundario" className="mb-16">
        Estas demandas não entram em passagens, entregas nem listas abaixo. A demanda na Esteira
        continua igual; só há um registro em Movimentações marcado como exclusão.
      </Texto>
      {erro && (
        <p className="mb-12 text-14 text-atraso" role="alert">
          {erro}
        </p>
      )}
      <ul className="border-t border-linha">
        {itens.map((item) => (
          <li
            key={item.demandaId}
            className="flex flex-wrap items-center justify-between gap-12 border-b border-linha py-12"
          >
            <span className="text-16 text-marinho-fumo">{item.titulo}</span>
            <button
              type="button"
              disabled={processandoId === item.demandaId}
              onClick={() => void restaurar(item)}
              className="shrink-0 text-14 text-marinho underline-offset-2 hover:underline disabled:opacity-50"
            >
              {processandoId === item.demandaId ? 'Restaurando…' : 'Restaurar'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
