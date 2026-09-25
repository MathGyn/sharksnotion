import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { ItemContagem } from '@/lib/relatorio/agregacoes'
import { subtituloVisaoPessoa } from '@/lib/relatorio/formatadores'
import type { MetricaPdf } from './partes'
import {
  CabecalhoPdf,
  ListaContagemPdf,
  MetricasPdf,
  RodapePdf,
  SecaoTitulo,
  TabelaDemandasPdf,
  type LinhaDemandaPdf,
} from './partes'
import { estilosPdf } from './estilos'

export type DocumentoPessoaPdfProps = {
  titulo: string
  nomePessoa: string
  periodoRotulo: string
  geradoEm: string
  metricas: MetricaPdf[]
  paraQuem: ItemContagem[]
  tipoMaterial: ItemContagem[]
  demandas: LinhaDemandaPdf[]
}

export function DocumentoPessoaPdf(props: DocumentoPessoaPdfProps) {
  const s = estilosPdf()
  return (
    <Document title={props.titulo} author="Sharks Imobiliária">
      <Page size="A4" style={s.page} wrap>
        <CabecalhoPdf
          titulo={props.titulo}
          periodoRotulo={props.periodoRotulo}
          geradoEm={props.geradoEm}
        />
        <Text style={s.descricaoRelatorio}>{subtituloVisaoPessoa(props.nomePessoa)}</Text>

        <MetricasPdf itens={props.metricas} />

        <View style={s.duasColunas}>
          <ListaContagemPdf titulo="Para quem" itens={props.paraQuem} />
          <ListaContagemPdf titulo="Tipo de material" itens={props.tipoMaterial} />
        </View>

        <SecaoTitulo>{`Demandas no recorte (${props.demandas.length})`}</SecaoTitulo>
        <Text style={s.nota}>
          Demandas distintas em que a passagem por {props.nomePessoa} terminou no período.
        </Text>
        <View style={{ marginTop: 10 }}>
          <TabelaDemandasPdf linhas={props.demandas} />
        </View>

        <RodapePdf />
      </Page>
    </Document>
  )
}
