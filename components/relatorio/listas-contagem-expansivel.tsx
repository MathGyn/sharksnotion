'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Fragment, useCallback } from 'react'
import type { ItemContagem } from '@/lib/relatorio/agregacoes'
import type { DemandaListagemItem } from '@/lib/relatorio/filtros-demandas'
import {
  chaveAbertoDepartamento,
  chaveAbertoTipo,
  type DetalheDemandaInline,
  type PayloadDrillDown,
} from '@/lib/relatorio/drill-down'
import {
  partesMetadadosDemandaListagem,
  rotuloDataListaDemanda,
} from '@/lib/relatorio/formatadores'
import { Texto } from '@/components/ui/texto'
import { cn } from '@/lib/utils/cn'
import { HistoricoDemanda } from './historico-demanda'

type ListasContagemExpansivelProps = {
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
  drill: PayloadDrillDown
  mostrarParaQuem?: boolean
}

function MetadadosLinhaDemanda({ row }: { row: DemandaListagemItem }) {
  const metadados = partesMetadadosDemandaListagem(row)
  if (metadados.length === 0) return null

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-14 text-marinho-fumo">
      {metadados.map((texto, idx) => (
        <Fragment key={`${row.id}-meta-${idx}`}>
          {idx > 0 && (
            <span className="text-linha" aria-hidden>
              ·
            </span>
          )}
          <span>{texto}</span>
        </Fragment>
      ))}
    </div>
  )
}

function painelExpansivel(aberto: boolean, children: React.ReactNode) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-[160ms] motion-reduce:transition-none',
        aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

function ListaCategoria({
  titulo,
  itens,
  chaveItem,
  abertoAtual,
  demandaAberta,
  listas,
  detalhes,
  onToggleCategoria,
  onToggleDemanda,
}: {
  titulo: string
  itens: ItemContagem[]
  chaveItem: (nome: string) => string
  abertoAtual: string | null
  demandaAberta: string | null
  listas: Record<string, DemandaListagemItem[]>
  detalhes: Record<string, DetalheDemandaInline>
  onToggleCategoria: (chave: string) => void
  onToggleDemanda: (id: string) => void
}) {
  return (
    <div>
      <Texto tamanho={16} className="mb-16 font-medium">
        {titulo}
      </Texto>
      <ul>
        {itens.map((item) => {
          const chave = chaveItem(item.nome)
          const categoriaAberta = abertoAtual === chave
          const rows = listas[chave] ?? []

          return (
            <li key={item.nome} className="border-b border-linha">
              <button
                type="button"
                onClick={() => onToggleCategoria(chave)}
                className={cn(
                  'group flex w-full items-baseline gap-8 py-12 text-left transition-colors duration-120',
                  categoriaAberta
                    ? 'font-medium text-marinho'
                    : 'text-marinho-fumo hover:text-marinho'
                )}
              >
                <span className="shrink-0 text-14">{item.nome}</span>
                <span
                  className={cn(
                    'min-w-[24px] flex-1 border-b border-dotted border-linha',
                    !categoriaAberta && 'group-hover:border-marinho-fumo'
                  )}
                  aria-hidden
                />
                <span className="shrink-0 font-archivo-expanded tabular-nums text-16">
                  {item.total}
                </span>
              </button>

              {painelExpansivel(
                categoriaAberta,
                <ul className="border-t border-linha pl-24">
                  {rows.map((row) => {
                    const detalheAberto = demandaAberta === row.id
                    const detalhe = detalhes[row.id]

                    return (
                      <li key={row.id} className="border-b border-linha last:border-b-0">
                        <button
                          type="button"
                          onClick={() => onToggleDemanda(row.id)}
                          className="w-full py-16 text-left transition-colors duration-120 hover:text-marinho-fumo"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-12">
                            <span className="text-16 font-medium text-marinho">{row.titulo}</span>
                            <span
                              className={cn(
                                'shrink-0 text-14 tabular-nums',
                                row.situacao === 'no prazo' && 'text-no-prazo',
                                row.situacao === 'atraso' && 'text-atraso',
                                row.situacao === 'sem prazo' && 'text-marinho-fumo'
                              )}
                            >
                              {rotuloDataListaDemanda(row)}
                            </span>
                          </div>
                          <MetadadosLinhaDemanda row={row} />
                        </button>

                        {painelExpansivel(
                          detalheAberto && !!detalhe,
                          <div className="border-t border-linha pl-24 pb-16 pt-12">
                            {detalhe?.notionUrl && (
                              <Link
                                href={detalhe.notionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-12 inline-block text-14 text-marinho underline-offset-2 hover:underline"
                              >
                                Abrir no Notion
                              </Link>
                            )}
                            <HistoricoDemanda
                              vazioAntiguidade={detalhe?.historicoVazioPorAntiguidade ?? false}
                              itens={detalhe?.historico ?? []}
                            />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ListasContagemExpansivel({
  paraQuem,
  tipoMaterial,
  drill,
  mostrarParaQuem = true,
}: ListasContagemExpansivelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const abertoAtual = searchParams.get('aberto')
  const demandaAberta = searchParams.get('demanda')

  const pushParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, val] of Object.entries(patch)) {
        if (val === null) params.delete(key)
        else params.set(key, val)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const onToggleCategoria = (chave: string) => {
    if (abertoAtual === chave) {
      pushParams({ aberto: null, demanda: null })
    } else {
      pushParams({ aberto: chave, demanda: null })
    }
  }

  const onToggleDemanda = (id: string) => {
    if (demandaAberta === id) {
      pushParams({ demanda: null })
    } else {
      pushParams({ demanda: id })
    }
  }

  return (
    <div
      className={
        mostrarParaQuem
          ? 'grid grid-cols-12 gap-24'
          : 'grid grid-cols-12 gap-24 md:max-w-[50%]'
      }
    >
      {mostrarParaQuem && (
        <div className="col-span-12 md:col-span-6">
          <ListaCategoria
            titulo="Para quem"
            itens={paraQuem}
            chaveItem={chaveAbertoDepartamento}
            abertoAtual={abertoAtual}
            demandaAberta={demandaAberta}
            listas={drill.listasPorAberto}
            detalhes={drill.detalhesPorId}
            onToggleCategoria={onToggleCategoria}
            onToggleDemanda={onToggleDemanda}
          />
        </div>
      )}
      <div className={mostrarParaQuem ? 'col-span-12 md:col-span-6' : 'col-span-12'}>
        <ListaCategoria
          titulo="Tipo de material"
          itens={tipoMaterial}
          chaveItem={chaveAbertoTipo}
          abertoAtual={abertoAtual}
          demandaAberta={demandaAberta}
          listas={drill.listasPorAberto}
          detalhes={drill.detalhesPorId}
          onToggleCategoria={onToggleCategoria}
          onToggleDemanda={onToggleDemanda}
        />
      </div>
    </div>
  )
}
