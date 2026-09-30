'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { ItemContagem } from '@/lib/relatorio/agregacoes'
import type { DemandaListagemItem } from '@/lib/relatorio/filtros-demandas'
import {
  chaveAbertoDepartamento,
  chaveAbertoTipo,
  type DetalheDemandaInline,
} from '@/lib/relatorio/drill-down'
import {
  partesMetadadosDemandaListagem,
  rotuloDataListaDemanda,
} from '@/lib/relatorio/formatadores'
import { Texto } from '@/components/ui/texto'
import { cn } from '@/lib/utils/cn'
import { HistoricoDemanda } from './historico-demanda'

type ListasContagemExpansivelProps = {
  chaveRelatorio: string
  slugPessoa?: string
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
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
  carregandoLista,
  carregandoDemanda,
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
  carregandoLista: string | null
  carregandoDemanda: string | null
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
          const rows = listas[chave]
          const listaCarregando = carregandoLista === chave

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
                  {listaCarregando && rows === undefined && (
                    <li className="py-16 text-14 text-marinho-fumo">Carregando…</li>
                  )}
                  {(rows ?? []).map((row) => {
                    const detalheAberto = demandaAberta === row.id
                    const detalhe = detalhes[row.id]
                    const detalheCarregando = carregandoDemanda === row.id

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
                          detalheAberto,
                          <div className="border-t border-linha pl-24 pb-16 pt-12">
                            {detalheCarregando && !detalhe && (
                              <p className="text-14 text-marinho-fumo">Carregando histórico…</p>
                            )}
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
                            {detalhe && (
                              <HistoricoDemanda
                                vazioAntiguidade={detalhe.historicoVazioPorAntiguidade}
                                itens={detalhe.historico}
                              />
                            )}
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

function paramsPeriodoDrill(searchParams: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams()
  for (const key of ['de', 'ate', 'mes'] as const) {
    const val = searchParams.get(key)
    if (val) out.set(key, val)
  }
  return out
}

export function ListasContagemExpansivel({
  chaveRelatorio,
  slugPessoa,
  paraQuem,
  tipoMaterial,
  mostrarParaQuem = true,
}: ListasContagemExpansivelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const abertoAtual = searchParams.get('aberto')
  const demandaAberta = searchParams.get('demanda')

  const [listasPorAberto, setListasPorAberto] = useState<
    Record<string, DemandaListagemItem[]>
  >({})
  const [detalhesPorId, setDetalhesPorId] = useState<Record<string, DetalheDemandaInline>>({})
  const [carregandoLista, setCarregandoLista] = useState<string | null>(null)
  const [carregandoDemanda, setCarregandoDemanda] = useState<string | null>(null)
  const listasJaCarregadas = useRef(new Set<string>())
  const detalhesJaCarregados = useRef(new Set<string>())

  const chavePeriodo = `${searchParams.get('de') ?? ''}|${searchParams.get('ate') ?? ''}|${searchParams.get('mes') ?? ''}`

  useEffect(() => {
    setListasPorAberto({})
    setDetalhesPorId({})
    listasJaCarregadas.current.clear()
    detalhesJaCarregados.current.clear()
  }, [chavePeriodo])

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

  const carregarLista = useCallback(
    async (chave: string) => {
      if (listasJaCarregadas.current.has(chave)) return
      listasJaCarregadas.current.add(chave)
      setCarregandoLista(chave)
      try {
        const qs = paramsPeriodoDrill(searchParams)
        qs.set('tipo', 'lista')
        qs.set('aberto', chave)
        if (slugPessoa) qs.set('pessoa', slugPessoa)
        const res = await fetch(`/r/${chaveRelatorio}/drill?${qs.toString()}`)
        if (!res.ok) return
        const data = (await res.json()) as { rows?: DemandaListagemItem[] }
        setListasPorAberto((prev) => ({ ...prev, [chave]: data.rows ?? [] }))
      } finally {
        setCarregandoLista((atual) => (atual === chave ? null : atual))
      }
    },
    [chaveRelatorio, searchParams, slugPessoa]
  )

  const carregarDetalhe = useCallback(
    async (demandaId: string) => {
      if (detalhesJaCarregados.current.has(demandaId)) return
      detalhesJaCarregados.current.add(demandaId)
      setCarregandoDemanda(demandaId)
      try {
        const qs = paramsPeriodoDrill(searchParams)
        qs.set('tipo', 'detalhe')
        qs.set('demanda', demandaId)
        if (slugPessoa) qs.set('pessoa', slugPessoa)
        const res = await fetch(`/r/${chaveRelatorio}/drill?${qs.toString()}`)
        if (!res.ok) return
        const data = (await res.json()) as { detalhe?: DetalheDemandaInline }
        if (data.detalhe) {
          setDetalhesPorId((prev) => ({ ...prev, [demandaId]: data.detalhe! }))
        }
      } finally {
        setCarregandoDemanda((atual) => (atual === demandaId ? null : atual))
      }
    },
    [chaveRelatorio, searchParams, slugPessoa]
  )

  useEffect(() => {
    if (!abertoAtual) return
    void carregarLista(abertoAtual)
  }, [abertoAtual, carregarLista])

  useEffect(() => {
    if (!demandaAberta) return
    void carregarDetalhe(demandaAberta)
  }, [demandaAberta, carregarDetalhe])

  const onToggleCategoria = (chave: string) => {
    if (abertoAtual === chave) {
      pushParams({ aberto: null, demanda: null })
    } else {
      pushParams({ aberto: chave, demanda: null })
      void carregarLista(chave)
    }
  }

  const onToggleDemanda = (id: string) => {
    if (demandaAberta === id) {
      pushParams({ demanda: null })
    } else {
      pushParams({ demanda: id })
      void carregarDetalhe(id)
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
            listas={listasPorAberto}
            detalhes={detalhesPorId}
            carregandoLista={carregandoLista}
            carregandoDemanda={carregandoDemanda}
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
          listas={listasPorAberto}
          detalhes={detalhesPorId}
          carregandoLista={carregandoLista}
          carregandoDemanda={carregandoDemanda}
          onToggleCategoria={onToggleCategoria}
          onToggleDemanda={onToggleDemanda}
        />
      </div>
    </div>
  )
}
