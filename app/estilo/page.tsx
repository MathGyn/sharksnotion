import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Estilo — Sharks (interno)',
  robots: { index: false, follow: false },
}

const CORES_MARCA = [
  { nome: 'marinho', var: '--marinho', hex: '#10203F' },
  { nome: 'marinho-fumo', var: '--marinho-fumo', hex: '#3A4D70' },
  { nome: 'areia', var: '--areia', hex: '#B8A27A' },
  { nome: 'areia-clara', var: '--areia-clara', hex: '#EDE5D6' },
  { nome: 'papel', var: '--papel', hex: '#EFEDE7' },
  { nome: 'branco', var: '--branco', hex: '#FFFFFF' },
  { nome: 'nevoa', var: '--nevoa', hex: '#DCE0E8' },
  { nome: 'linha', var: '--linha', hex: '#E3E0D8' },
  { nome: 'atraso', var: '--atraso', hex: '#A8402F' },
  { nome: 'no-prazo', var: '--no-prazo', hex: '#2F6B4F' },
] as const

const CORES_PESSOA = [
  { n: 1, hex: '#10203F' },
  { n: 2, hex: '#B8A27A' },
  { n: 3, hex: '#6D7F9E' },
  { n: 4, hex: '#8C7651' },
  { n: 5, hex: '#3A4D70' },
  { n: 6, hex: '#A8A29A' },
] as const

const TAMANHOS = [12, 14, 16, 20, 26, 40, 64, 96] as const
const ESPACOS = [4, 8, 12, 16, 24, 32, 48, 64, 96] as const

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-64">
      <h2 className="mb-24 font-archivo-expanded text-26 text-marinho">{titulo}</h2>
      {children}
    </section>
  )
}

export default function EstiloPage() {
  return (
    <main className="mx-auto max-w-conteudo px-24 py-48">
      <header className="mb-64 border-b border-linha pb-32">
        <p className="mb-8 text-14 text-marinho-fumo">Página interna — não publicar</p>
        <h1 className="font-archivo-expanded text-40 tracking-titulo text-marinho">
          Tokens do relatório
        </h1>
      </header>

      <Secao titulo="Cores da marca (10)">
        <ul className="grid grid-cols-2 gap-16 sm:grid-cols-3 md:grid-cols-5">
          {CORES_MARCA.map((c) => (
            <li key={c.nome}>
              <div
                className="mb-8 h-64 w-full rounded-interno border border-linha"
                style={{ backgroundColor: `var(${c.var})` }}
              />
              <p className="text-14 text-marinho">{c.nome}</p>
              <p className="font-archivo-expanded tabular-nums text-12 text-marinho-fumo">
                {c.hex}
              </p>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Cores de pessoa (6)">
        <ul className="flex flex-wrap gap-16">
          {CORES_PESSOA.map((c) => (
            <li key={c.n} className="w-[96px]">
              <div
                className="mb-8 h-48 w-full rounded-pill"
                style={{ backgroundColor: `var(--pessoa-${c.n})` }}
              />
              <p className="text-14 text-marinho">Pessoa {c.n}</p>
              <p className="font-archivo-expanded tabular-nums text-12 text-marinho-fumo">
                {c.hex}
              </p>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Tipografia — Archivo">
        <p className="mb-24 max-w-[36rem] text-14 text-marinho-fumo">
          Coluna esquerda: largura normal (wdth 100). Coluna direita: expandida (wdth 125, peso
          600, tracking −0,02em). Números com tabular-nums.
        </p>
        <div className="grid gap-32 md:grid-cols-2">
          <div>
            <p className="mb-16 text-14 font-medium text-marinho-fumo">Interface</p>
            <ul className="space-y-16">
              {TAMANHOS.map((px) => (
                <li key={`n-${px}`} className="border-b border-linha pb-12">
                  <span
                    className="font-archivo-normal text-marinho tabular-nums"
                    style={{ fontSize: `${px}px`, lineHeight: px >= 20 ? 1.2 : 1.5 }}
                  >
                    {px}px — Entregas de setembro 42
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-16 text-14 font-medium text-marinho-fumo">Títulos e números grandes</p>
            <ul className="space-y-16">
              {TAMANHOS.map((px) => (
                <li key={`e-${px}`} className="border-b border-linha pb-12">
                  <span
                    className="font-archivo-expanded text-marinho tabular-nums"
                    style={{ fontSize: `${px}px`, lineHeight: 1.2 }}
                  >
                    {px}px — 86%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Secao>

      <Secao titulo="Raios (3)">
        <div className="flex flex-wrap items-end gap-24">
          <div>
            <div className="mb-8 h-64 w-[160px] rounded-bloco border border-linha bg-branco" />
            <p className="text-14 text-marinho">Bloco — 28px</p>
          </div>
          <div>
            <div className="mb-8 h-64 w-[160px] rounded-interno border border-linha bg-branco" />
            <p className="text-14 text-marinho">Interno — 12px</p>
          </div>
          <div>
            <div className="mb-8 h-48 w-[160px] rounded-pill border border-linha bg-branco" />
            <p className="text-14 text-marinho">Pílula — total</p>
          </div>
        </div>
      </Secao>

      <Secao titulo="Escala de espaço">
        <ul className="flex flex-col gap-16">
          {ESPACOS.map((px) => (
            <li key={px} className="flex items-center gap-16">
              <span className="w-32 tabular-nums text-14 text-marinho-fumo">{px}px</span>
              <div className="h-16 bg-areia" style={{ width: `${px}px` }} />
            </li>
          ))}
        </ul>
        <p className="mt-24 text-14 text-marinho-fumo">
          Largura máxima do conteúdo: 1240px · medianiz da grade: 24px
        </p>
      </Secao>

      <Secao titulo="Sombra única da aplicação">
        <div className="inline-block rounded-interno border border-linha bg-branco px-24 py-16 shadow-seletor-mes">
          <p className="text-14 text-marinho">Seletor de mês fixo no topo</p>
          <p className="tabular-nums text-12 text-marinho-fumo">0 8px 24px rgba(16,32,63,.08)</p>
        </div>
      </Secao>
    </main>
  )
}
