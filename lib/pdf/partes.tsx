import { Image, Text, View } from '@react-pdf/renderer'
import type { ItemContagem } from '@/lib/relatorio/agregacoes'
import { caminhoLogoPdfMarinho } from './logo'
import { estilosPdf } from './estilos'

export type MetricaPdf = { valor: string; rotulo: string }

export function CabecalhoPdf({
  titulo,
  periodoRotulo,
  geradoEm,
}: {
  titulo: string
  periodoRotulo: string
  geradoEm: string
}) {
  const s = estilosPdf()
  return (
    <>
      <View style={s.cabecalho}>
        <View>
          <Image style={s.logo} src={caminhoLogoPdfMarinho()} />
          <Text style={s.subtituloMarca}>Relatório de entregas · Marketing</Text>
        </View>
        <View style={s.metaDireita}>
          <Text>Período: {periodoRotulo}</Text>
          <Text>Gerado em {geradoEm}</Text>
        </View>
      </View>
      <Text style={s.tituloRelatorio}>{titulo}</Text>
    </>
  )
}

export function MetricasPdf({ itens }: { itens: MetricaPdf[] }) {
  const s = estilosPdf()
  return (
    <View style={s.metricasLinha}>
      {itens.map((item) => (
        <View key={item.rotulo} style={s.metricaBloco}>
          <Text style={s.metricaValor}>{item.valor}</Text>
          <Text style={s.metricaRotulo}>{item.rotulo}</Text>
        </View>
      ))}
    </View>
  )
}

export function SecaoTitulo({ children }: { children: string }) {
  const s = estilosPdf()
  return <Text style={s.secaoTitulo}>{children}</Text>
}

export function ListaContagemPdf({ titulo, itens }: { titulo: string; itens: ItemContagem[] }) {
  const s = estilosPdf()
  return (
    <View style={s.coluna}>
      <SecaoTitulo>{titulo}</SecaoTitulo>
      {itens.length === 0 ? (
        <Text style={s.nota}>Nenhum item no recorte.</Text>
      ) : (
        itens.map((item) => (
          <View key={item.nome} style={s.linhaContagem}>
            <Text style={s.linhaContagemNome}>{item.nome}</Text>
            <Text style={s.linhaContagemTotal}>{item.total}</Text>
          </View>
        ))
      )}
    </View>
  )
}

export function RodapePdf() {
  const s = estilosPdf()
  return (
    <View style={s.rodape} fixed>
      <Text>Sharks Notion · Uso interno</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}

export type LinhaPessoaPdf = {
  nome: string
  passagens: number
  demandas: number
  emAberto: number
  noPrazo: string
}

export function TabelaPessoasPdf({ linhas }: { linhas: LinhaPessoaPdf[] }) {
  const s = estilosPdf()
  const cols = [
    { key: 'nome', label: 'Pessoa', flex: 2.2 },
    { key: 'passagens', label: 'Passagens', flex: 0.9, align: 'right' as const },
    { key: 'demandas', label: 'Demandas', flex: 0.9, align: 'right' as const },
    { key: 'emAberto', label: 'Em aberto', flex: 0.9, align: 'right' as const },
    { key: 'noPrazo', label: 'No prazo', flex: 1, align: 'right' as const },
  ]

  return (
    <View>
      <View style={s.tabelaCabecalho}>
        {cols.map((c) => (
          <Text key={c.key} style={[s.tabelaCabecalhoTexto, { flex: c.flex, textAlign: c.align }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {linhas.map((linha, i) => (
        <View
          key={linha.nome}
          style={[s.tabelaLinha, i % 2 === 1 ? s.tabelaLinhaPar : undefined]}
        >
          <Text style={[s.tabelaCelula, { flex: 2.2 }]}>{linha.nome}</Text>
          <Text style={[s.tabelaCelula, { flex: 0.9, textAlign: 'right' }]}>{linha.passagens}</Text>
          <Text style={[s.tabelaCelula, { flex: 0.9, textAlign: 'right' }]}>{linha.demandas}</Text>
          <Text style={[s.tabelaCelula, { flex: 0.9, textAlign: 'right' }]}>{linha.emAberto}</Text>
          <Text style={[s.tabelaCelula, { flex: 1, textAlign: 'right' }]}>{linha.noPrazo}</Text>
        </View>
      ))}
    </View>
  )
}

export type LinhaDemandaPdf = {
  id: string
  titulo: string
  tipo: string
  departamento: string
  situacao: string
}

export function TabelaDemandasPdf({ linhas }: { linhas: LinhaDemandaPdf[] }) {
  const s = estilosPdf()
  const cols = [
    { label: 'Demanda', flex: 2.8 },
    { label: 'Tipo', flex: 1 },
    { label: 'Para quem', flex: 1.2 },
    { label: 'Entrega', flex: 1.1 },
  ]

  return (
    <View>
      <View style={s.tabelaCabecalho}>
        {cols.map((c) => (
          <Text key={c.label} style={[s.tabelaCabecalhoTexto, { flex: c.flex }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {linhas.map((linha, i) => (
        <View
          key={linha.id}
          style={[s.tabelaLinha, i % 2 === 1 ? s.tabelaLinhaPar : undefined]}
        >
          <Text style={[s.tabelaCelula, { flex: 2.8 }]}>{linha.titulo}</Text>
          <Text style={[s.tabelaCelula, { flex: 1 }]}>{linha.tipo}</Text>
          <Text style={[s.tabelaCelula, { flex: 1.2 }]}>{linha.departamento}</Text>
          <Text style={[s.tabelaCelula, { flex: 0.9 }]}>{linha.situacao}</Text>
        </View>
      ))}
    </View>
  )
}
