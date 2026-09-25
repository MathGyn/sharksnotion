'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { OpcaoPresetUi } from '@/lib/relatorio/presets-ui'

export type { OpcaoPresetUi }

type SeletorPeriodoProps = {
  rotuloAtual: string
  intervaloAtual: { de: string; ate: string }
  presets: OpcaoPresetUi[]
  className?: string
}

export function SeletorPeriodo({
  rotuloAtual,
  intervaloAtual,
  presets,
  className,
}: SeletorPeriodoProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [aberto, setAberto] = useState(false)
  const [deCustom, setDeCustom] = useState(intervaloAtual.de)
  const [ateCustom, setAteCustom] = useState(intervaloAtual.ate)

  const navegarIntervalo = (de: string, ate: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('mes')
    params.set('de', de)
    params.set('ate', ate)
    router.push(`${pathname}?${params.toString()}`)
    setAberto(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="shadow-seletor-mes rounded-interno border border-linha bg-branco px-16 py-10 text-left text-14 font-medium text-marinho"
        aria-expanded={aberto}
      >
        {rotuloAtual}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-8 min-w-[280px] rounded-interno border border-linha bg-branco p-16 shadow-seletor-mes">
          <p className="mb-12 text-12 text-marinho-fumo">Período</p>
          <ul className="mb-16 space-y-4">
            {presets.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full rounded-interno px-8 py-8 text-left text-14 text-marinho hover:text-marinho-fumo"
                  onClick={() => navegarIntervalo(p.de, p.ate)}
                >
                  {p.rotulo}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="border-t border-linha pt-16"
            onSubmit={(e) => {
              e.preventDefault()
              if (deCustom && ateCustom) navegarIntervalo(deCustom, ateCustom)
            }}
          >
            <p className="mb-8 text-12 text-marinho-fumo">Intervalo personalizado</p>
            <div className="flex flex-col gap-8">
              <label className="text-12 text-marinho-fumo">
                De
                <input
                  type="date"
                  value={deCustom}
                  onChange={(e) => setDeCustom(e.target.value)}
                  className="mt-4 block w-full rounded-interno border border-linha px-8 py-8 text-14 text-marinho"
                />
              </label>
              <label className="text-12 text-marinho-fumo">
                Até
                <input
                  type="date"
                  value={ateCustom}
                  onChange={(e) => setAteCustom(e.target.value)}
                  className="mt-4 block w-full rounded-interno border border-linha px-8 py-8 text-14 text-marinho"
                />
              </label>
              <button
                type="submit"
                className="mt-8 rounded-interno border border-marinho bg-marinho px-12 py-8 text-14 font-medium text-branco"
              >
                Aplicar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
