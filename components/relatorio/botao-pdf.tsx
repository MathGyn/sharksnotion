'use client'

import { useState } from 'react'
import { Botao } from '@/components/ui/botao'
import { hrefPdfRelatorio } from '@/lib/relatorio/url-relatorio'
import type { Intervalo } from '@/lib/utils/date'

type BotaoPdfProps = {
  chave: string
  intervalo: Intervalo
  slugPessoa?: string
}

export function BotaoPdf({ chave, intervalo, slugPessoa }: BotaoPdfProps) {
  const [gerando, setGerando] = useState(false)

  async function baixarPdf() {
    setGerando(true)
    try {
      const url = hrefPdfRelatorio(chave, intervalo, slugPessoa)
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? 'relatorio-mkt.pdf'

      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.alert('Não foi possível gerar o PDF. Tente de novo em instantes.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <Botao type="button" onClick={() => void baixarPdf()} disabled={gerando} className="no-print">
      {gerando ? 'Gerando PDF…' : 'Baixar PDF'}
    </Botao>
  )
}
