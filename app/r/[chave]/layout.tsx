import { notFound } from 'next/navigation'
import { chaveRelatorioValida } from '@/lib/relatorio/contexto-relatorio'

type LayoutProps = {
  children: React.ReactNode
  params: { chave: string }
}

export default function RelatorioLayout({ children, params }: LayoutProps) {
  if (!chaveRelatorioValida(params.chave)) {
    notFound()
  }

  return <div className="min-h-screen bg-papel py-48 print:bg-branco print:py-24">{children}</div>
}
