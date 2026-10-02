'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Numero, Texto } from '@/components/ui/texto'
import { LIMITE_QUANTIDADE_ENTREGAS } from '@/lib/relatorio/registros-pessoa'
import { cn } from '@/lib/utils/cn'

type ContadorEntregasProps = {
  chaveRelatorio: string
  pessoaNome: string
  /** Mês editável (AAAA-MM). Nulo quando o período cobre mais de um mês. */
  mesAno: string | null
  rotuloMes: string
  valorInicial: number
  registroPageIdInicial?: string
  /** Período com vários meses: soma somente leitura. */
  totalPeriodo: number
  ehMesAtual: boolean
}

type EstadoSalvamento = 'ocioso' | 'pendente' | 'salvando' | 'salvo' | 'erro'

const ATRASO_SALVAR_MS = 700

function limitar(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(LIMITE_QUANTIDADE_ENTREGAS, Math.max(0, Math.round(n)))
}

function BotaoPasso({
  children,
  rotulo,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  rotulo: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-32 w-32 shrink-0 select-none items-center justify-center rounded-pill border border-linha bg-branco text-16 leading-none text-marinho transition-colors duration-120',
        'hover:border-marinho focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marinho',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      <span aria-hidden>{children}</span>
    </button>
  )
}

/** Célula compacta dentro do resumo — salva sozinha no Notion (debounce + fila). */
export function ContadorEntregas({
  chaveRelatorio,
  pessoaNome,
  mesAno,
  rotuloMes,
  valorInicial,
  registroPageIdInicial,
  totalPeriodo,
  ehMesAtual,
}: ContadorEntregasProps) {
  const [valor, setValor] = useState(valorInicial)
  const [rascunho, setRascunho] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoSalvamento>('ocioso')

  const valorRef = useRef(valorInicial)
  const salvoRef = useRef(valorInicial)
  const pageIdRef = useRef(registroPageIdInicial)
  const emVooRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const corpoRequisicao = useCallback(
    (quantidade: number) =>
      JSON.stringify({
        acao: 'definir-entregas',
        pessoaNome,
        mesAno,
        quantidade,
        registroPageId: pageIdRef.current,
      }),
    [mesAno, pessoaNome]
  )

  /** Um salvamento por vez; ao terminar, envia de novo se o valor mudou no meio. */
  const salvar = useCallback(async () => {
    if (!mesAno || emVooRef.current) return
    const alvo = valorRef.current
    if (alvo === salvoRef.current) {
      setEstado('salvo')
      return
    }

    emVooRef.current = true
    setEstado('salvando')
    try {
      const res = await fetch(`/r/${chaveRelatorio}/registros-pessoa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: corpoRequisicao(alvo),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { registroPageId?: string }
      salvoRef.current = alvo
      if (data.registroPageId) pageIdRef.current = data.registroPageId
    } catch {
      emVooRef.current = false
      setEstado('erro')
      return
    }
    emVooRef.current = false

    if (valorRef.current !== salvoRef.current) {
      void salvar()
    } else {
      setEstado('salvo')
    }
  }, [chaveRelatorio, corpoRequisicao, mesAno])

  const alterar = useCallback(
    (proximo: number) => {
      const n = limitar(proximo)
      setValor(n)
      valorRef.current = n
      setEstado('pendente')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => void salvar(), ATRASO_SALVAR_MS)
    },
    [salvar]
  )

  useEffect(() => {
    const salvarAoSair = () => {
      if (!mesAno || valorRef.current === salvoRef.current) return
      void fetch(`/r/${chaveRelatorio}/registros-pessoa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: corpoRequisicao(valorRef.current),
        keepalive: true,
      })
    }
    window.addEventListener('pagehide', salvarAoSair)
    return () => {
      window.removeEventListener('pagehide', salvarAoSair)
      if (timerRef.current) clearTimeout(timerRef.current)
      salvarAoSair()
    }
  }, [chaveRelatorio, corpoRequisicao, mesAno])

  const confirmarRascunho = () => {
    if (rascunho === null) return
    const n = parseInt(rascunho, 10)
    setRascunho(null)
    if (!Number.isNaN(n) && limitar(n) !== valor) alterar(n)
  }

  const editavel = mesAno !== null
  const salvando = estado === 'pendente' || estado === 'salvando'

  return (
    <div className="flex h-full flex-col rounded-interno border border-linha bg-papel p-16">
      <div className="flex items-center justify-between gap-8">
        <Texto as="span" tamanho={14} tom="secundario">
          Entregas lançadas
        </Texto>
        <span
          className="rounded-pill border border-linha bg-branco px-8 text-12 text-marinho-fumo"
          title={
            ehMesAtual
              ? 'Contagem manual. Zera automaticamente no próximo mês.'
              : 'Contagem manual do mês.'
          }
        >
          manual
        </span>
      </div>

      {editavel ? (
        <>
          <div className="mt-8 flex items-center gap-8">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Quantidade de entregas em {rotuloMes}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITE_QUANTIDADE_ENTREGAS}
                value={rascunho ?? String(valor)}
                onChange={(e) => setRascunho(e.target.value)}
                onBlur={confirmarRascunho}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setRascunho(null)
                }}
                className={cn(
                  'w-full appearance-none rounded-interno bg-transparent font-archivo-expanded tabular-nums text-48 leading-none tracking-titulo text-marinho',
                  'outline-none focus-visible:bg-branco',
                  '[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                )}
              />
            </label>
            <BotaoPasso
              rotulo="Diminuir uma entrega"
              onClick={() => alterar(valor - 1)}
              disabled={valor <= 0}
            >
              −
            </BotaoPasso>
            <BotaoPasso
              rotulo="Somar uma entrega"
              onClick={() => alterar(valor + 1)}
              disabled={valor >= LIMITE_QUANTIDADE_ENTREGAS}
            >
              +
            </BotaoPasso>
          </div>

          {(estado === 'erro' || salvando) && (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                'mt-auto pt-8 text-12 leading-texto',
                estado === 'erro' ? 'text-atraso' : 'text-marinho-fumo'
              )}
            >
              {estado === 'erro' ? (
                <button type="button" onClick={() => void salvar()} className="underline">
                  Não salvou — tentar de novo
                </button>
              ) : (
                'Salvando…'
              )}
            </p>
          )}
        </>
      ) : (
        <>
          <Numero tamanho={48} className="mt-8 block leading-none">
            {totalPeriodo}
          </Numero>
          <Texto tamanho={12} tom="secundario" className="mt-auto pt-8">
            Soma do período. Para lançar, escolha um único mês.
          </Texto>
        </>
      )}
    </div>
  )
}
