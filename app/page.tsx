import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acesso negado',
  description: 'Apenas tubarões por aqui.',
}

export default function PaginaInicial() {
  return (
    <main className="relative h-dvh min-h-screen w-full overflow-hidden bg-[#0a1628]">
      <img
        src="/acesso-negado-sharks-1920.jpg"
        srcSet="/acesso-negado-sharks-hq.jpg 1024w, /acesso-negado-sharks-1920.jpg 1920w, /acesso-negado-sharks-2560.jpg 2560w"
        sizes="100vw"
        alt="Acesso negado. Apenas tubarões por aqui."
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="high"
      />
    </main>
  )
}
