import { PilulaLink } from './pilula-link'
import { hrefPessoa, hrefVisaoGeral } from '@/lib/relatorio/url-relatorio'
type NavegacaoPessoasProps = {
  chave: string
  pessoaAtual: string
  pessoas: { nome: string; slug: string }[]
}

export function NavegacaoPessoas({
  chave,
  pessoaAtual,
  pessoas,
}: NavegacaoPessoasProps) {
  return (
    <nav className="mb-32 flex flex-wrap gap-8" aria-label="Pessoas do time">
      <PilulaLink href={hrefVisaoGeral(chave)} ativa={false}>
        Visão geral
      </PilulaLink>
      {pessoas.map((p) => (
        <PilulaLink
          key={p.slug}
          href={hrefPessoa(chave, p.slug)}
          ativa={p.nome === pessoaAtual}
        >
          {p.nome}
        </PilulaLink>
      ))}
    </nav>
  )
}
