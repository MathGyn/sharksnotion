'use client'

import { Container } from '@/components/ui/container'
import { Texto } from '@/components/ui/texto'
import { mensagemErroNotionParaUsuario } from '@/lib/notion/errors'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RelatorioErrorPage({ error, reset }: ErrorProps) {
  return (
    <Container>
      <Texto as="p" tamanho={16} className="mb-16 text-26 font-semibold leading-titulo tracking-titulo">
        Não foi possível carregar o relatório
      </Texto>
      <Texto
        as="p"
        tamanho={14}
        tom="secundario"
        className="mb-24 max-w-[40rem] whitespace-pre-line"
      >
        {mensagemErroNotionParaUsuario(error)}
      </Texto>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-pill border border-linha bg-branco px-16 py-8 text-14 text-marinho transition-colors duration-120 hover:border-marinho-fumo"
      >
        Tentar de novo
      </button>
    </Container>
  )
}
