'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Fragment, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ItemContagem } from '@/lib/relatorio/agregacoes'
import type { DemandaListagemItem } from '@/lib/relatorio/filtros-demandas'
import {
  chaveAbertoDepartamento,
  chaveAbertoTipo,
} from '@/lib/relatorio/drill-down-chaves'
import type { DetalheDemandaInline } from '@/lib/relatorio/drill-down-types'
import {
  formatarSituacaoLista,
  partesMetadadosDemandaListagem,
  rotuloDataListaDemanda,
} from '@/lib/relatorio/formatadores'
import { Texto } from '@/components/ui/texto'
import { cn } from '@/lib/utils/cn'
import { HistoricoDemanda } from './historico-demanda'

type ListasContagemExpansivelProps = {
  chaveRelatorio: string
  slugPessoa?: string
  /** Nome canônico — necessário para excluir demanda só deste relatório pessoal. */
  nomePessoa?: string
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
  mostrarParaQuem?: boolean
  /** Barra proporcional ao maior total em cada linha. */
  comBarras?: boolean
}

function Spinner({ rotulo }: { rotulo: string }) {
  return (
    <span
      role="status"
      aria-label={rotulo}
      className="inline-block h-[12px] w-[12px] shrink-0 animate-spin self-center rounded-pill border border-marinho-fumo border-t-transparent motion-reduce:animate-none"
    />
  )
}

function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={12}
      height={12}
      aria-hidden
      className={cn(
        'shrink-0 self-center text-marinho-fumo transition-transform duration-120 motion-reduce:transition-none',
        aberto && 'rotate-180'
      )}
    >
      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const LARGURAS_ESQUELETO = ['78%', '62%', '70%']

function EsqueletoLinhasDemanda() {
  return (
    <>
      {LARGURAS_ESQUELETO.map((largura, i) => (
        <li key={i} className="flex items-center gap-8 px-8 py-8" aria-hidden>
          <span className="h-[6px] w-[6px] shrink-0 rounded-pill bg-linha" />
          <span
            className="h-[12px] animate-pulse rounded-pill bg-linha motion-reduce:animate-none"
            style={{ width: largura, animationDelay: `${i * 120}ms` }}
          />
          <span className="ml-auto h-[10px] w-[64px] animate-pulse rounded-pill bg-linha motion-reduce:animate-none" />
        </li>
      ))}
    </>
  )
}

function EsqueletoHistorico() {
  return (
    <div className="space-y-8 py-4" aria-hidden>
      {['55%', '70%'].map((largura) => (
        <div
          key={largura}
          className="h-[10px] animate-pulse rounded-pill bg-linha motion-reduce:animate-none"
          style={{ width: largura }}
        />
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
  podeExcluirDemanda,
  excluindoDemandaId,
  onExcluirDemanda,
  comBarras = false,
  falhasLista,
}: {
  comBarras?: boolean
  falhasLista: Record<string, boolean>
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
  podeExcluirDemanda: boolean
  excluindoDemandaId: string | null
  onExcluirDemanda: (demandaId: string, chaveLista: string, tituloDemanda: string) => void
}) {
  const maiorTotal = Math.max(1, ...itens.map((i) => i.total))

  return (
    <div>
      <Texto tamanho={16} className="mb-16 font-medium">
        {titulo}
      </Texto>
      {itens.length === 0 && (
        <p className="border-y border-linha py-16 text-14 text-marinho-fumo">
          Nada no período.
        </p>
      )}
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
                aria-expanded={categoriaAberta}
                className={cn(
                  'group w-full py-12 text-left transition-colors duration-120',
                  categoriaAberta
                    ? 'font-medium text-marinho'
                    : 'text-marinho-fumo hover:text-marinho'
                )}
              >
                <span className="flex w-full items-baseline gap-8">
                  <span className="shrink-0 text-14">{item.nome}</span>
                  <span
                    className={cn(
                      'min-w-[24px] flex-1',
                      !comBarras && 'border-b border-dotted border-linha',
                      !comBarras && !categoriaAberta && 'group-hover:border-marinho-fumo'
                    )}
                    aria-hidden
                  />
                  {listaCarregando && <Spinner rotulo={`Carregando demandas de ${item.nome}`} />}
                  <span className="shrink-0 font-archivo-expanded tabular-nums text-16">
                    {item.total}
                  </span>
                  <Chevron aberto={categoriaAberta} />
                </span>
                {comBarras && (
                  <span
                    className="mt-8 block h-[4px] w-full overflow-hidden rounded-pill bg-linha"
                    aria-hidden
                  >
                    <span
                      className={cn(
                        'block h-full rounded-pill transition-colors duration-120',
                        categoriaAberta ? 'bg-marinho' : 'bg-marinho-fumo group-hover:bg-marinho'
                      )}
                      style={{ width: `${(item.total / maiorTotal) * 100}%` }}
                    />
                  </span>
                )}
              </button>

              {painelExpansivel(
                categoriaAberta,
                <ul className="mb-12">
                  {rows === undefined &&
                    (falhasLista[chave] && !listaCarregando ? (
                      <li className="py-8 text-12 text-atraso" role="alert">
                        Não foi possível carregar. Feche e abra de novo para tentar outra vez.
                      </li>
                    ) : (
                      <EsqueletoLinhasDemanda />
                    ))}
                  {rows?.length === 0 && (
                    <li className="py-8 text-12 text-marinho-fumo">Nenhuma demanda.</li>
                  )}
                  {(rows ?? []).map((row) => {
                    const detalheAberto = demandaAberta === row.id
                    const detalhe = detalhes[row.id]
                    const detalheCarregando = carregandoDemanda === row.id
                    const metadados = partesMetadadosDemandaListagem(row)

                    return (
                      <li key={row.id} className="group/linha">
                        <div
                          className={cn(
                            'flex items-center gap-8 rounded-interno px-8 transition-colors duration-120',
                            detalheAberto ? 'bg-papel' : 'hover:bg-papel'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleDemanda(row.id)}
                            aria-expanded={detalheAberto}
                            className="flex min-w-0 flex-1 items-center gap-8 py-8 text-left"
                          >
                            <span
                              className={cn(
                                'h-[6px] w-[6px] shrink-0 rounded-pill',
                                row.situacao === 'no prazo' && 'bg-no-prazo',
                                row.situacao === 'atraso' && 'bg-atraso',
                                row.situacao === 'sem prazo' && 'bg-linha'
                              )}
                              title={formatarSituacaoLista(row.situacao)}
                            />
                            <span className="sr-only">{formatarSituacaoLista(row.situacao)}:</span>
                            <span className="min-w-0 flex-1 truncate text-14 text-marinho">
                              {row.titulo}
                            </span>
                            <span
                              className={cn(
                                'shrink-0 text-12 tabular-nums',
                                row.situacao === 'atraso' ? 'text-atraso' : 'text-marinho-fumo'
                              )}
                            >
                              {rotuloDataListaDemanda(row)}
                            </span>
                          </button>
                          {podeExcluirDemanda && (
                            <button
                              type="button"
                              disabled={excluindoDemandaId === row.id}
                              onClick={() => onExcluirDemanda(row.id, chave, row.titulo)}
                              className="shrink-0 text-12 text-marinho-fumo opacity-0 transition-opacity duration-120 hover:text-atraso focus-visible:opacity-100 group-hover/linha:opacity-100 disabled:opacity-50"
                              title="Remove esta demanda das suas métricas e listas (não altera o Notion)"
                            >
                              {excluindoDemandaId === row.id ? 'Excluindo…' : 'Excluir'}
                            </button>
                          )}
                        </div>

                        {painelExpansivel(
                          detalheAberto,
                          <div className="mx-8 mb-8 border-l border-linha pb-4 pl-16 pt-4">
                            <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-12 text-marinho-fumo">
                              {metadados.map((texto, idx) => (
                                <Fragment key={`${row.id}-meta-${idx}`}>
                                  {idx > 0 && <span aria-hidden>·</span>}
                                  <span>{texto}</span>
                                </Fragment>
                              ))}
                              {detalhe?.notionUrl && (
                                <Link
                                  href={detalhe.notionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto text-marinho underline-offset-2 hover:underline"
                                >
                                  Abrir no Notion ↗
                                </Link>
                              )}
                            </div>
                            {detalheCarregando && !detalhe && <EsqueletoHistorico />}
                            {detalhe && (
                              <HistoricoDemanda
                                compacto
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

function EsqueletoListasContagem() {
  return (
    <div
      className="grid grid-cols-12 gap-24"
      aria-hidden
    >
      <div className="col-span-12 md:col-span-6 space-y-16">
        <div className="h-24 w-[120px] animate-pulse rounded-interno bg-linha/40" />
        <div className="h-40 animate-pulse rounded-interno bg-linha/25" />
        <div className="h-40 animate-pulse rounded-interno bg-linha/25" />
      </div>
      <div className="col-span-12 md:col-span-6 space-y-16">
        <div className="h-24 w-160 animate-pulse rounded-interno bg-linha/40" />
        <div className="h-40 animate-pulse rounded-interno bg-linha/25" />
        <div className="h-40 animate-pulse rounded-interno bg-linha/25" />
      </div>
    </div>
  )
}

function ListasContagemExpansivelInner({
  chaveRelatorio,
  slugPessoa,
  nomePessoa,
  paraQuem,
  tipoMaterial,
  mostrarParaQuem = true,
  comBarras = false,
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
  const [falhasLista, setFalhasLista] = useState<Record<string, boolean>>({})
  const [carregandoDemanda, setCarregandoDemanda] = useState<string | null>(null)
  const [excluindoDemandaId, setExcluindoDemandaId] = useState<string | null>(null)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)
  const listasJaCarregadas = useRef(new Set<string>())
  const detalhesJaCarregados = useRef(new Set<string>())
  const podeExcluirDemanda = Boolean(nomePessoa)

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
        const res = await fetch(`/r/${chaveRelatorio}/drill?${qs.toString()}`).catch(() => null)
        if (!res?.ok) {
          listasJaCarregadas.current.delete(chave)
          setFalhasLista((prev) => ({ ...prev, [chave]: true }))
          return
        }
        const data = (await res.json()) as { rows?: DemandaListagemItem[] }
        setFalhasLista((prev) => ({ ...prev, [chave]: false }))
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

  const onExcluirDemanda = async (
    demandaId: string,
    chaveLista: string,
    tituloDemanda: string
  ) => {
    if (!nomePessoa) return
    const confirmou = window.confirm(
      'Excluir esta demanda do seu relatório? Passagens, entregas e percentual no prazo serão recalculados. Será criado um registro em Movimentações (exclusão do relatório).'
    )
    if (!confirmou) return

    setErroExclusao(null)
    setExcluindoDemandaId(demandaId)
    try {
      const res = await fetch(`/r/${chaveRelatorio}/excluir-demanda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'excluir',
          demandaId,
          pessoaNome: nomePessoa,
          tituloDemanda,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { erro?: string }
        setErroExclusao(data.erro ?? 'Não foi possível excluir.')
        return
      }

      setListasPorAberto((prev) => {
        const rows = prev[chaveLista]
        if (!rows) return prev
        return { ...prev, [chaveLista]: rows.filter((r) => r.id !== demandaId) }
      })
      if (demandaAberta === demandaId) {
        pushParams({ demanda: null })
      }
      router.refresh()
    } finally {
      setExcluindoDemandaId(null)
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
      {erroExclusao && (
        <p className="col-span-12 text-14 text-atraso" role="alert">
          {erroExclusao}
        </p>
      )}
      {mostrarParaQuem && (
        <div className="col-span-12 md:col-span-6">
          <ListaCategoria
            titulo="Para quem"
            itens={paraQuem}
            comBarras={comBarras}
            falhasLista={falhasLista}
            chaveItem={chaveAbertoDepartamento}
            abertoAtual={abertoAtual}
            demandaAberta={demandaAberta}
            listas={listasPorAberto}
            detalhes={detalhesPorId}
            carregandoLista={carregandoLista}
            carregandoDemanda={carregandoDemanda}
            onToggleCategoria={onToggleCategoria}
            onToggleDemanda={onToggleDemanda}
            podeExcluirDemanda={podeExcluirDemanda}
            excluindoDemandaId={excluindoDemandaId}
            onExcluirDemanda={(id, chave, titulo) => void onExcluirDemanda(id, chave, titulo)}
          />
        </div>
      )}
      <div className={mostrarParaQuem ? 'col-span-12 md:col-span-6' : 'col-span-12'}>
        <ListaCategoria
          titulo="Tipo de material"
          itens={tipoMaterial}
          comBarras={comBarras}
          falhasLista={falhasLista}
          chaveItem={chaveAbertoTipo}
          abertoAtual={abertoAtual}
          demandaAberta={demandaAberta}
          listas={listasPorAberto}
          detalhes={detalhesPorId}
          carregandoLista={carregandoLista}
          carregandoDemanda={carregandoDemanda}
          onToggleCategoria={onToggleCategoria}
          onToggleDemanda={onToggleDemanda}
          podeExcluirDemanda={podeExcluirDemanda}
          excluindoDemandaId={excluindoDemandaId}
          onExcluirDemanda={(id, chave, titulo) => void onExcluirDemanda(id, chave, titulo)}
        />
      </div>
    </div>
  )
}

/** useSearchParams exige Suspense — evita erro de hidratação com loading.tsx e navegação. */
export function ListasContagemExpansivel(props: ListasContagemExpansivelProps) {
  return (
    <Suspense fallback={<EsqueletoListasContagem />}>
      <ListasContagemExpansivelInner {...props} />
    </Suspense>
  )
}
