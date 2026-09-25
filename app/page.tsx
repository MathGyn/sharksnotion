import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Acesso negado',
  description: 'Apenas tubarões por aqui.',
}

export default function PaginaInicial() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a1628]">
      <Image
        src="/acesso-negado-sharks.jpg"
        alt="Acesso negado. Apenas tubarões por aqui."
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
    </main>
  )
}
