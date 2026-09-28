import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { Movimentacao } from '@/lib/notion/types'
import type { ItemContagem, RelatorioVisaoTime } from '@/lib/relatorio/agregacoes'
import { formatarDias, formatarPercentualNoPrazo } from '@/lib/relatorio/formatadores'
import { mediaTempoPessoaNoIntervaloEmDias } from '@/lib/relatorio/tempo'
import type { MetricaPdf } from './partes'
import { CabecalhoPdf, ListaContagemPdf, MetricasPdf, SecaoTitulo } from './partes'
import { estilosPdf } from './estilos'

export type LinhaPessoaMensalPdf = {
  nome: string
  passagens: number
  tempoMedio: string
  noPrazo: string
}

export type DocumentoRelatorioMensalProps = {
  titulo: string
  periodoRotulo: string
  geradoEm: string
  metricas: MetricaPdf[]
  linhasPessoa: LinhaPessoaMensalPdf[]
  tipoMaterial: ItemContagem[]
  porUrgencia: ItemContagem[]
  entradasSaidas: RelatorioVisaoTime['blocos']['entradasSaidas']
}

function RodapeMensal() {
  const s = estilosPdf()
  return (
    <View style={s.rodape} fixed>
      <Text>Gerado automaticamente a partir da Esteira de Demandas no Notion.</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}

function TabelaPessoasMensal({ linhas }: { linhas: LinhaPessoaMensalPdf[] }) {
  const s = estilosPdf()
  const cols = [
    { key: 'nome', label: 'Pessoa', flex: 2.4 },
    { key: 'passagens', label: 'Passagens', flex: 1, align: 'right' as const },
    { key: 'tempoMedio', label: 'Tempo médio', flex: 1.1, align: 'right' as const },
    { key: 'noPrazo', label: '% no prazo', flex: 1, align: 'right' as const },
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
          <Text style={[s.tabelaCelula, { flex: 2.4 }]}>{linha.nome}</Text>
          <Text style={[s.tabelaCelula, { flex: 1, textAlign: 'right' }]}>{linha.passagens}</Text>
          <Text style={[s.tabelaCelula, { flex: 1.1, textAlign: 'right' }]}>{linha.tempoMedio}</Text>
          <Text style={[s.tabelaCelula, { flex: 1, textAlign: 'right' }]}>{linha.noPrazo}</Text>
        </View>
      ))}
    </View>
  )
}

export function DocumentoRelatorioMensal(props: DocumentoRelatorioMensalProps) {
  const s = estilosPdf()
  const { entradasSaidas } = props

  return (
    <Document title={props.titulo} author="Sharks Imobiliária">
      <Page size="A4" style={s.page}>
        <CabecalhoPdf
          titulo={props.titulo}
          periodoRotulo={props.periodoRotulo}
          geradoEm={props.geradoEm}
        />

        <MetricasPdf itens={props.metricas} />

        <SecaoTitulo>Por pessoa</SecaoTitulo>
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <TabelaPessoasMensal linhas={props.linhasPessoa} />
        </View>

        <View style={s.duasColunas}>
          <ListaContagemPdf titulo="Tipo de material" itens={props.tipoMaterial} />
          <ListaContagemPdf titulo="Urgência" itens={props.porUrgencia} />
        </View>

        <View style={[s.blocoEntradas, { marginTop: 14 }]}>
          <SecaoTitulo>Entradas e saídas no período</SecaoTitulo>
          <View style={s.entradasLinha}>
            <Text>Entraram</Text>
            <Text>{entradasSaidas.entraram}</Text>
          </View>
          <View style={s.entradasLinha}>
            <Text>Concluídas (saíram)</Text>
            <Text>{entradasSaidas.sairam}</Text>
          </View>
          <View style={[s.entradasLinha, { marginTop: 4, marginBottom: 0 }]}>
            <Text style={s.entradasSaldoLabel}>Saldo</Text>
            <Text style={s.entradasSaldoValor}>
              {entradasSaidas.saldo > 0 ? '+' : ''}
              {entradasSaidas.saldo}
            </Text>
          </View>
        </View>

        <RodapeMensal />
      </Page>
    </Document>
  )
}

export function montarLinhasPessoaMensal(
  relatorio: RelatorioVisaoTime,
  movimentacoes: Movimentacao[]
): LinhaPessoaMensalPdf[] {
  const intervalo = relatorio.periodo.intervalo
  return relatorio.cardsPessoa.map((c) => ({
    nome: c.nome,
    passagens: c.passagens,
    tempoMedio: formatarDias(
      mediaTempoPessoaNoIntervaloEmDias(movimentacoes, c.nome, intervalo)
    ),
    noPrazo: formatarPercentualNoPrazo(c.percentualNoPrazo),
  }))
}
