'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { Bloco } from '@/components/ui/bloco'
import { Texto } from '@/components/ui/texto'
import {
  LIMITE_AUTOR_OBSERVACAO,
  LIMITE_TEXTO_OBSERVACAO,
  type ObservacaoPessoaMensal,
} from '@/lib/relatorio/registros-pessoa'
import { formatarDataHoraBR, getNomeMes } from '@/lib/utils/date'

type ObservacoesPessoaProps = {
  chaveRelatorio: string
  pessoaNome: string
  /** Mês que recebe novas observações. Nulo quando o período cobre vários meses. */
  mesAno: string | null
  rotuloMes: string
  observacoesIniciais: ObservacaoPessoaMensal[]
}

const CHAVE_AUTOR_LOCAL = 'sharks:autor-observacao'

function agruparPorMes(itens: ObservacaoPessoaMensal[]): [string, ObservacaoPessoaMensal[]][] {
  const grupos = new Map<string, ObservacaoPessoaMensal[]>()
  for (const item of itens) {
    grupos.set(item.mesAno, [...(grupos.get(item.mesAno) ?? []), item])
  }
  return [...grupos.entries()].sort(([a], [b]) => b.localeCompare(a))
}

export function ObservacoesPessoa({
  chaveRelatorio,
  pessoaNome,
  mesAno,
  rotuloMes,
  observacoesIniciais,
}: ObservacoesPessoaProps) {
  const idTexto = useId()
  const idAutor = useId()
  const [itens, setItens] = useState(observacoesIniciais)
  const [texto, setTexto] = useState('')
  const [autor, setAutor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setItens(observacoesIniciais)
  }, [observacoesIniciais])

  useEffect(() => {
    setAutor(window.localStorage.getItem(CHAVE_AUTOR_LOCAL) ?? '')
  }, [])

  const grupos = useMemo(() => agruparPorMes(itens), [itens])
  const variosMeses = mesAno === null

  async function enviar(conteudo: string, autorAtual: string) {
    const limpo = conteudo.trim()
    if (!mesAno || !limpo || enviando) return
    setErro(null)
    setEnviando(true)
    try {
      const res = await fetch(`/r/${chaveRelatorio}/registros-pessoa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'adicionar-observacao',
          pessoaNome,
          mesAno,
          texto: limpo,
          autor: autorAtual.trim(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        erro?: string
        observacao?: ObservacaoPessoaMensal
      }
      if (!res.ok || !data.observacao) {
        setErro(data.erro ?? 'Não foi possível salvar a observação.')
        return
      }
      window.localStorage.setItem(CHAVE_AUTOR_LOCAL, autorAtual.trim())
      setItens((prev) => [data.observacao!, ...prev])
      setTexto('')
    } finally {
      setEnviando(false)
    }
  }

  async function remover(item: ObservacaoPessoaMensal) {
    if (
      !window.confirm(
        'Remover esta observação? Ela sai do relatório e vai para a lixeira do Notion.',
      )
    ) {
      return
    }
    setErro(null)
    setRemovendoId(item.id)
    try {
      const res = await fetch(`/r/${chaveRelatorio}/registros-pessoa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'remover-observacao',
          pessoaNome,
          observacaoId: item.registroPageId ?? item.id,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { erro?: string }
        setErro(data.erro ?? 'Não foi possível remover.')
        return
      }
      setItens((prev) => prev.filter((o) => o.id !== item.id))
    } finally {
      setRemovendoId(null)
    }
  }

  return (
    <Bloco className="grid grid-cols-12 gap-32 p-32">
      <div className="col-span-12 lg:col-span-5">
        <div className="mb-4 flex items-baseline justify-between gap-12">
          <Texto tamanho={16} className="font-medium">
            Observações
          </Texto>
          <Texto as="span" tamanho={12} tom="secundario" className="tabular-nums">
            {itens.length === 1 ? '1 registro' : `${itens.length} registros`}
          </Texto>
        </div>
        <Texto tamanho={14} tom="secundario" className="mb-16">
          O contexto que os números não mostram — vai junto no relatório mensal.
        </Texto>

        {mesAno ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void enviar(texto, autor)
            }}
          >
            <label htmlFor={idTexto} className="sr-only">
              Nova observação para {rotuloMes}
            </label>
            <textarea
              id={idTexto}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void enviar(texto, autor)
                }
              }}
              maxLength={LIMITE_TEXTO_OBSERVACAO}
              rows={6}
              placeholder="Ex.: o vídeo da Mega City voltou 4 vezes para ajuste antes da aprovação."
              className="block w-full resize-y rounded-interno border border-linha bg-papel p-12 text-14 text-marinho outline-none transition-colors duration-120 placeholder:text-marinho-fumo focus:border-marinho"
            />
            <div className="mt-8 flex flex-wrap items-center gap-8">
              <label htmlFor={idAutor} className="sr-only">
                Seu nome
              </label>
              <input
                id={idAutor}
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                maxLength={LIMITE_AUTOR_OBSERVACAO}
                placeholder="Seu nome"
                className="min-w-0 flex-1 rounded-pill border border-linha bg-papel px-16 py-8 text-14 text-marinho outline-none transition-colors duration-120 placeholder:text-marinho-fumo focus:border-marinho"
              />
              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                className="shrink-0 rounded-pill bg-marinho px-16 py-8 text-14 font-medium text-branco transition-colors duration-120 hover:bg-marinho-fumo disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? 'Salvando…' : 'Adicionar'}
              </button>
            </div>
            <Texto tamanho={12} tom="secundario" className="mt-8">
              Entra em {rotuloMes}. Atalho: ⌘/Ctrl + Enter.
            </Texto>
          </form>
        ) : (
          <Texto tamanho={12} tom="secundario" className="rounded-interno bg-papel p-12">
            Para adicionar uma observação, selecione um único mês no período.
          </Texto>
        )}

        {erro && (
          <p className="mt-12 text-14 text-atraso" role="alert">
            {erro}
          </p>
        )}
      </div>

      <div className="col-span-12 lg:col-span-7 lg:border-l lg:border-linha lg:pl-32">
        <Texto tamanho={14} tom="secundario" className="mb-16 font-medium">
          Histórico{mesAno ? ` de ${rotuloMes}` : ''}
        </Texto>
        {itens.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center rounded-interno border border-linha p-16 text-center">
            <Texto tamanho={14} tom="secundario">
              Nenhuma observação neste período.
            </Texto>
          </div>
        ) : (
          <div className="max-h-[480px] space-y-24 overflow-y-auto pr-8">
            {grupos.map(([mes, lista]) => (
              <section key={mes} aria-label={`Observações de ${getNomeMes(mes)}`}>
                {variosMeses && (
                  <Texto tamanho={12} tom="secundario" className="mb-8 font-medium capitalize">
                    {getNomeMes(mes)}
                  </Texto>
                )}
                <ol className="relative space-y-16 border-l border-linha pl-16">
                  {lista.map((item) => (
                    <li key={item.id} className="relative">
                      <span
                        className="absolute left-[-21px] top-[7px] h-[9px] w-[9px] rounded-pill bg-areia ring-2 ring-branco"
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-8">
                        <Texto as="span" tamanho={12} tom="secundario">
                          <span className="font-medium text-marinho">
                            {item.autor || 'Sem autor'}
                          </span>
                          {' · '}
                          <time dateTime={item.criadoEm}>{formatarDataHoraBR(item.criadoEm)}</time>
                        </Texto>
                        <button
                          type="button"
                          onClick={() => void remover(item)}
                          disabled={removendoId === item.id}
                          className="text-12 text-marinho-fumo underline-offset-2 hover:text-atraso hover:underline disabled:opacity-50"
                        >
                          {removendoId === item.id ? 'Removendo…' : 'Remover'}
                        </button>
                      </div>
                      <Texto tamanho={14} className="mt-4 whitespace-pre-wrap break-words">
                        {item.texto}
                      </Texto>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </Bloco>
  )
}
