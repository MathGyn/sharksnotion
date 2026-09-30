import { Container } from '@/components/ui/container'

export default function RelatorioLoading() {
  return (
    <Container>
      <div className="animate-pulse" aria-busy="true" aria-label="Carregando relatório">
        <div className="mb-48 flex items-center justify-between border-b border-linha pb-24">
          <div className="h-32 w-120 rounded-interno bg-linha/50" />
          <div className="h-40 w-160 rounded-interno bg-linha/50" />
        </div>
        <div className="mb-32 h-28 w-3/4 max-w-md rounded-interno bg-linha/40" />
        <div className="mb-64 flex flex-wrap gap-16">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 min-w-[140px] flex-1 rounded-interno bg-linha/30" />
          ))}
        </div>
        <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-160 rounded-interno bg-linha/25" />
          ))}
        </div>
      </div>
    </Container>
  )
}
