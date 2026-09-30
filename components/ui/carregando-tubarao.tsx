import type { CSSProperties } from 'react'
import { Texto } from './texto'

type CarregandoTubaraoProps = {
  rotulo?: string
}

const RAIOS = [
  { left: '12%', delay: '0s' },
  { left: '38%', delay: '-2.4s' },
  { left: '66%', delay: '-4.6s' },
]

const PARTICULAS = [
  { left: '8%', top: '70%', delay: '0s' },
  { left: '22%', top: '35%', delay: '-3s' },
  { left: '34%', top: '80%', delay: '-6s' },
  { left: '47%', top: '25%', delay: '-1.5s' },
  { left: '58%', top: '65%', delay: '-4.5s' },
  { left: '71%', top: '40%', delay: '-7s' },
  { left: '83%', top: '75%', delay: '-2s' },
  { left: '92%', top: '30%', delay: '-5.5s' },
]

function TubaraoSvg() {
  return (
    <svg width={260} height={98} viewBox="0 0 240 90" fill="var(--marinho)" aria-hidden>
      <path
        className="tubarao-cauda"
        d="M64 41C50 30 38 16 26 0C29 14 33 28 40 44C35 52 32 62 33 76C42 64 52 54 64 49Z"
      />
      <path d="M58 43C64 42 70 41 76 40C76 37 75 35 73 33C78 35 82 37 86 38.5C100 33 112 28 126 26C130 18 130 8 127 0C138 6 150 15 160 24C184 24 208 30 226 40C234 44 234 50 224 53C208 60 190 64 172 65C140 67 112 62 92 55C90 58 86 61 82 63C82 59 81 56 79 53C72 51 64 49 58 48Z" />
      <path className="tubarao-peitoral" d="M180 62C168 72 156 82 140 90C148 80 154 72 156 64Z" />
    </svg>
  )
}

export function CarregandoTubarao({ rotulo = 'Carregando relatório' }: CarregandoTubaraoProps) {
  return (
    <div
      className="flex min-h-[min(72vh,560px)] w-full flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={rotulo}
    >
      <div className="tubarao-cena mb-32 max-w-conteudo" aria-hidden>
        {RAIOS.map((r) => (
          <span
            key={r.left}
            className="tubarao-raio"
            style={{ left: r.left, animationDelay: r.delay } as CSSProperties}
          />
        ))}
        {PARTICULAS.map((p) => (
          <span
            key={`${p.left}-${p.top}`}
            className="tubarao-particula"
            style={{ left: p.left, top: p.top, animationDelay: p.delay } as CSSProperties}
          />
        ))}

        <div className="tubarao-nado">
          <div className="tubarao-corpo">
            <TubaraoSvg />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sharks-logo-marinho.svg"
          alt=""
          width={100}
          height={28}
          className="h-[28px] w-auto opacity-80"
          decoding="async"
        />
        <Texto tamanho={16} className="font-medium">
          {rotulo}
          <span className="tubarao-pontos" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </Texto>
        <Texto tamanho={14} tom="secundario">
          Buscando dados no Notion
        </Texto>
      </div>
    </div>
  )
}
