import { Suspense } from 'react'
import { BotaoPdf } from './botao-pdf'
import { SeletorPeriodo, type OpcaoPresetUi } from './seletor-periodo'
import { Texto } from '@/components/ui/texto'

type CabecalhoRelatorioProps = {
  chave: string
  rotuloPeriodo: string
  intervalo: { de: string; ate: string }
  presets: OpcaoPresetUi[]
  mostrarControles?: boolean
  slugPessoa?: string
}

export function CabecalhoRelatorio({
  chave,
  rotuloPeriodo,
  intervalo,
  presets,
  mostrarControles = true,
  slugPessoa,
}: CabecalhoRelatorioProps) {
  return (
    <header
      className={`mb-48 flex flex-wrap items-center justify-between gap-16 border-b border-linha pb-24 ${mostrarControles ? '' : 'print:border-0'}`}
    >
      <div className="flex min-w-0 items-center gap-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sharks-logo.svg"
          alt="Sharks Imobiliária"
          width={120}
          height={32}
          className="h-32 w-auto"
          decoding="async"
        />
      </div>
      {mostrarControles && (
        <div className="flex flex-wrap items-center gap-12 no-print">
          <Suspense fallback={<Texto tamanho={14}>Carregando…</Texto>}>
            <SeletorPeriodo
              rotuloAtual={rotuloPeriodo}
              intervaloAtual={intervalo}
              presets={presets}
            />
          </Suspense>
          <BotaoPdf chave={chave} intervalo={intervalo} slugPessoa={slugPessoa} />
        </div>
      )}
    </header>
  )
}
