import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { Movimentacao } from '@/lib/notion/types'
import type { ItemContagem, RelatorioVisaoTime } from '@/lib/relatorio/agregacoes'
import { pessoasIguais } from '@/lib/relatorio/exclusoes-demanda'
import { formatarDias, formatarPercentualNoPrazo } from '@/lib/relatorio/formatadores'
import {
  observacoesDaPessoaNoIntervalo,
  pessoasComRegistrosNoIntervalo,
  totalEntregasManuaisNoIntervalo,
  type ContagemEntregasMensal,
  type ObservacaoPessoaMensal,
} from '@/lib/relatorio/registros-pessoa'
import { mediaTempoPessoaNoIntervaloEmDias } from '@/lib/relatorio/tempo'
import type { MetricaPdf, ObservacaoPdf } from './partes'
import {
  CabecalhoPdf,
  ListaContagemPdf,
  ListaObservacoesPdf,
  MetricasPdf,
  SecaoTitulo,
  observacoesParaPdf,
} from './partes'
import { estilosPdf } from './estilos'

export type LinhaPessoaMensalPdf = {
  nome: string
  entregas: number
  passagens: number
  tempoMedio: string
  noPrazo: string
}

export type ObservacoesPessoaPdf = {
  nome: string
  itens: ObservacaoPdf[]
}

export type DocumentoRelatorioMensalProps = {
  titulo: string
  periodoRotulo: string
  geradoEm: string
  metricas: MetricaPdf[]
  linhasPessoa: LinhaPessoaMensalPdf[]
  observacoesPorPessoa: ObservacoesPessoaPdf[]
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
    { key: 'nome', label: 'Pessoa', flex: 2.2 },
    { key: 'entregas', label: 'Entregas', flex: 1, align: 'right' as const },
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
          <Text style={[s.tabelaCelula, { flex: 2.2 }]}>{linha.nome}</Text>
          <Text style={[s.tabelaCelula, { flex: 1, textAlign: 'right' }]}>{linha.entregas}</Text>
          <Text style={[s.tabelaCelula, { flex: 1, textAlign: 'right' }]}>{linha.passagens}</Text>
          <Text style={[s.tabelaCelula, { flex: 1.1, textAlign: 'right' }]}>{linha.tempoMedio}</Text>
          <Text style={[s.tabelaCelula, { flex: 1, textAlign: 'right' }]}>{linha.noPrazo}</Text>
        </View>
      ))}
      <Text style={s.nota}>
        Entregas: contagem lançada manualmente por cada pessoa no relatório. Passagens, tempo e
        prazo vêm da Esteira.
      </Text>
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

        {props.observacoesPorPessoa.length > 0 && (
          <View>
            <SecaoTitulo>Observações do mês</SecaoTitulo>
            {props.observacoesPorPessoa.map((grupo) => (
              <View key={grupo.nome}>
                <Text style={s.observacaoPessoa} minPresenceAhead={40}>
                  {grupo.nome}
                </Text>
                <ListaObservacoesPdf itens={grupo.itens} />
              </View>
            ))}
          </View>
        )}

        <RodapeMensal />
      </Page>
    </Document>
  )
}

/** Inclui quem só tem contagem manual/observação, mesmo sem passagem na esteira. */
export function montarLinhasPessoaMensal(
  relatorio: RelatorioVisaoTime,
  movimentacoes: Movimentacao[],
  contagensEntregas: ContagemEntregasMensal[],
  observacoesPessoa: ObservacaoPessoaMensal[]
): LinhaPessoaMensalPdf[] {
  const intervalo = relatorio.periodo.intervalo
  const linhas: LinhaPessoaMensalPdf[] = relatorio.cardsPessoa.map((c) => ({
    nome: c.nome,
    entregas: totalEntregasManuaisNoIntervalo(contagensEntregas, c.nome, intervalo),
    passagens: c.passagens,
    tempoMedio: formatarDias(
      mediaTempoPessoaNoIntervaloEmDias(movimentacoes, c.nome, intervalo)
    ),
    noPrazo: formatarPercentualNoPrazo(c.percentualNoPrazo),
  }))

  for (const nome of pessoasComRegistrosNoIntervalo(
    contagensEntregas,
    observacoesPessoa,
    intervalo
  )) {
    if (linhas.some((l) => pessoasIguais(l.nome, nome))) continue
    linhas.push({
      nome,
      entregas: totalEntregasManuaisNoIntervalo(contagensEntregas, nome, intervalo),
      passagens: 0,
      tempoMedio: '—',
      noPrazo: '—',
    })
  }

  return linhas
}

export function montarObservacoesPorPessoaMensal(
  linhas: LinhaPessoaMensalPdf[],
  observacoesPessoa: ObservacaoPessoaMensal[],
  intervalo: RelatorioVisaoTime['periodo']['intervalo']
): ObservacoesPessoaPdf[] {
  return linhas
    .map((l) => ({
      nome: l.nome,
      itens: observacoesParaPdf(observacoesDaPessoaNoIntervalo(observacoesPessoa, l.nome, intervalo)),
    }))
    .filter((g) => g.itens.length > 0)
}
