import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { BlocosVisaoTime, CardPessoaAgregado, ItemContagem } from '@/lib/relatorio/agregacoes'
import { formatarPercentualNoPrazo, notaDuplaContagemTime } from '@/lib/relatorio/formatadores'
import type { MetricaPdf } from './partes'
import {
  CabecalhoPdf,
  ListaContagemPdf,
  MetricasPdf,
  RodapePdf,
  SecaoTitulo,
  TabelaPessoasPdf,
} from './partes'
import { estilosPdf } from './estilos'

export type DocumentoTimePdfProps = {
  titulo: string
  periodoRotulo: string
  geradoEm: string
  metricas: MetricaPdf[]
  cardsPessoa: CardPessoaAgregado[]
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
  blocos: BlocosVisaoTime
  mostrarParaQuem: boolean
}

export function DocumentoTimePdf(props: DocumentoTimePdfProps) {
  const s = estilosPdf()
  const linhasPessoas = props.cardsPessoa.map((c) => ({
    nome: c.nome,
    passagens: c.passagens,
    demandas: c.demandas,
    emAberto: c.emAbertoAgora,
    noPrazo: formatarPercentualNoPrazo(c.percentualNoPrazo),
  }))

  const { entradasSaidas, porUrgencia, filaPorPessoa } = props.blocos

  return (
    <Document title={props.titulo} author="Sharks Imobiliária">
      <Page size="A4" style={s.page}>
        <CabecalhoPdf
          titulo={props.titulo}
          periodoRotulo={props.periodoRotulo}
          geradoEm={props.geradoEm}
        />
        <Text style={s.descricaoRelatorio}>
          Visão consolidada do time no período selecionado.
        </Text>

        <MetricasPdf itens={props.metricas} />

        <SecaoTitulo>Passagens por pessoa</SecaoTitulo>
        <Text style={s.nota}>{notaDuplaContagemTime()}</Text>
        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <TabelaPessoasPdf linhas={linhasPessoas} />
        </View>

        <View style={s.blocoEntradas}>
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

        <View style={s.duasColunas}>
          <ListaContagemPdf titulo="Por urgência" itens={porUrgencia} />
          <ListaContagemPdf titulo="Fila atual (Está com)" itens={filaPorPessoa} />
        </View>

        {props.mostrarParaQuem ? (
          <View style={s.duasColunas}>
            <ListaContagemPdf titulo="Para quem (concluídas)" itens={props.paraQuem} />
            <ListaContagemPdf titulo="Tipo de material" itens={props.tipoMaterial} />
          </View>
        ) : (
          <View style={s.duasColunas}>
            <ListaContagemPdf titulo="Tipo de material" itens={props.tipoMaterial} />
            <View style={s.coluna} />
          </View>
        )}

        <RodapePdf />
      </Page>
    </Document>
  )
}
