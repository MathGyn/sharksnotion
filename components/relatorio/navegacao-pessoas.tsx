import { PilulaLink } from './pilula-link'
import { hrefPessoa, hrefVisaoGeral } from '@/lib/relatorio/url-relatorio'
import type { Intervalo } from '@/lib/utils/date'

type NavegacaoPessoasProps = {
  chave: string
  intervalo: Intervalo
  pessoaAtual: string
  pessoas: { nome: string; slug: string }[]
}

export function NavegacaoPessoas({
  chave,
  intervalo,
  pessoaAtual,
  pessoas,
}: NavegacaoPessoasProps) {
  return (
    <nav className="mb-32 flex flex-wrap gap-8" aria-label="Pessoas do time">
      <PilulaLink href={hrefVisaoGeral(chave, intervalo)} ativa={false}>
        Visão geral
      </PilulaLink>
      {pessoas.map((p) => (
        <PilulaLink
          key={p.slug}
          href={hrefPessoa(chave, p.slug, intervalo)}
          ativa={p.nome === pessoaAtual}
        >
          {p.nome}
        </PilulaLink>
      ))}
    </nav>
  )
}
