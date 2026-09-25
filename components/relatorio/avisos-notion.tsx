import { Texto } from '@/components/ui/texto'

type AvisosNotionProps = {
  avisos: string[]
}

export function AvisosNotion({ avisos }: AvisosNotionProps) {
  if (avisos.length === 0) return null

  return (
    <div
      className="mb-32 rounded-interno border border-linha bg-branco px-16 py-12"
      role="status"
    >
      <Texto as="p" tamanho={14} className="mb-8 font-medium text-marinho">
        Parte dos dados do Notion não carregou
      </Texto>
      <ul className="space-y-8">
        {avisos.map((aviso) => (
          <li key={aviso} className="text-14 leading-texto text-marinho-fumo">
            {aviso}
          </li>
        ))}
      </ul>
      <Texto as="p" tamanho={12} tom="secundario" className="mt-12">
        Abra a base no Notion (não só a página de instruções), menu ⋯ → Conexões →
        Relatórios MKT. Se acabou de conectar, recarregue esta página.
      </Texto>
    </div>
  )
}
