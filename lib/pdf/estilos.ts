import { StyleSheet } from '@react-pdf/renderer'
import { pdfCores } from './cores'
import { estiloPdfNegrito } from './fontes'

type EstilosPdf = ReturnType<typeof criarEstilosPdf>

let cache: EstilosPdf = criarEstilosPdf('Helvetica')

function criarEstilosPdf(fontFamily: string) {
  const bold = estiloPdfNegrito(fontFamily)

  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 52,
      paddingHorizontal: 44,
      fontFamily,
      fontSize: 10,
      color: pdfCores.marinho,
      backgroundColor: pdfCores.branco,
    },
    cabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: pdfCores.linha,
    },
    logo: {
      width: 128,
      height: 25,
      marginBottom: 6,
    },
    subtituloMarca: {
      fontSize: 8,
      color: pdfCores.marinhoFumo,
      marginTop: 2,
    },
    metaDireita: {
      textAlign: 'right',
      fontSize: 8,
      color: pdfCores.marinhoFumo,
    },
    tituloRelatorio: {
      fontSize: 18,
      marginBottom: 4,
      color: pdfCores.marinho,
      ...bold,
    },
    descricaoRelatorio: {
      fontSize: 9,
      color: pdfCores.marinhoFumo,
      marginBottom: 22,
      lineHeight: 1.4,
    },
    secaoTitulo: {
      fontSize: 11,
      marginBottom: 10,
      marginTop: 6,
      color: pdfCores.marinho,
      ...bold,
    },
    metricasLinha: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 8,
    },
    metricaBloco: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      backgroundColor: pdfCores.papel,
      borderRadius: 4,
    },
    metricaValor: {
      fontSize: 22,
      marginBottom: 4,
      ...bold,
    },
    metricaRotulo: {
      fontSize: 8,
      color: pdfCores.marinhoFumo,
      lineHeight: 1.35,
    },
    duasColunas: {
      flexDirection: 'row',
      gap: 20,
      marginBottom: 18,
    },
    coluna: {
      flex: 1,
    },
    linhaContagem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: pdfCores.linha,
    },
    linhaContagemNome: {
      fontSize: 9,
      flex: 1,
      paddingRight: 8,
    },
    linhaContagemTotal: {
      fontSize: 10,
      width: 28,
      textAlign: 'right',
      ...bold,
    },
    tabelaCabecalho: {
      flexDirection: 'row',
      backgroundColor: pdfCores.marinho,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tabelaCabecalhoTexto: {
      color: pdfCores.branco,
      fontSize: 8,
      ...bold,
    },
    tabelaLinha: {
      flexDirection: 'row',
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: pdfCores.linha,
    },
    tabelaLinhaPar: {
      backgroundColor: pdfCores.papel,
    },
    tabelaCelula: {
      fontSize: 8,
      lineHeight: 1.35,
    },
    nota: {
      fontSize: 7.5,
      color: pdfCores.marinhoFumo,
      marginTop: 8,
      lineHeight: 1.4,
    },
    rodape: {
      position: 'absolute',
      bottom: 24,
      left: 44,
      right: 44,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 7,
      color: pdfCores.marinhoFumo,
      borderTopWidth: 1,
      borderTopColor: pdfCores.linha,
      paddingTop: 8,
    },
    blocoEntradas: {
      padding: 10,
      backgroundColor: pdfCores.papel,
      borderRadius: 4,
      marginBottom: 18,
    },
    entradasLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    entradasSaldoLabel: {
      ...bold,
    },
    entradasSaldoValor: {
      ...bold,
    },
  })
}

export function initEstilosPdf(fontFamily: string): void {
  cache = criarEstilosPdf(fontFamily)
}

export function estilosPdf(): EstilosPdf {
  return cache
}
