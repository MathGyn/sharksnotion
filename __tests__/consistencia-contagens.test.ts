import { describe, expect, it } from 'vitest'
import type { Demanda, Movimentacao, Solicitacao } from '@/lib/notion/types'
import { idsDemandasRecortePassagemPessoa } from '@/lib/relatorio/recorte-contagens'
import { validarContagensConsistentesComFiltro } from '@/lib/relatorio/consistencia-contagens'
import { contagemPorDepartamento, montarRelatorioVisaoPessoa } from '@/lib/relatorio/agregacoes'
import { listarDemandasFiltradas } from '@/lib/relatorio/filtros-demandas'
import { filtrosBaseVisaoPessoa } from '@/lib/relatorio/drill-down'
import { intervaloFixo } from '@/lib/relatorio/periodo'
import { instanteEmSaoPaulo } from '@/lib/utils/date'

function demanda(partial: Partial<Demanda> & Pick<Demanda, 'id'>): Demanda {
  return {
    solicitacao: partial.solicitacao ?? 'Demanda',
    estaComAtual: 'Matheus',
    status: 'Concluído',
    tipoConteudo: 'Vídeo',
    urgencia: 'Média',
    responsavel: [],
    precisaEntregarAte: '2026-09-30',
    dataDeEntrega: null,
    dataGravacaoEdicao: null,
    solicitacaoDeOrigemId: 's-rh',
    historicoIds: [],
    criadoEm: instanteEmSaoPaulo(2026, 9, 1),
    notionUrl: '',
    ...partial,
  }
}

function mov(partial: Partial<Movimentacao> & Pick<Movimentacao, 'id'>): Movimentacao {
  return {
    registro: 'r',
    demandaId: 'd1',
    para: 'Matheus',
    status: 'Em andamento',
    quando: instanteEmSaoPaulo(2026, 9, 10, 10),
    ...partial,
  }
}

const solicitacaoRh: Solicitacao = {
  id: 's-rh',
  titulo: 'Sol RH',
  departamento: 'RH',
  unidade: 'MARISTA',
  solicitante: [],
  dataDaSolicitacao: '2026-09-01',
  prazoDesejado: null,
  estimativaDeEntrega: null,
  canalDeUso: null,
  objetivoDoMaterial: null,
  demandaNaEsteiraIds: [],
  criadoEm: instanteEmSaoPaulo(2026, 9, 1),
}

describe('consistência contagem × filtro (recorte por passagem)', () => {
  it('visão pessoa: cada categoria bate com listarDemandasFiltradas', () => {
    const periodo = intervaloFixo('2026-09-01', '2026-09-30')
    const demandas = [
      demanda({
        id: 'd1',
        solicitacao: 'Peça RH',
      }),
    ]
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 18, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        demandaId: 'd1',
        quando: instanteEmSaoPaulo(2026, 9, 20, 12),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
    ]

    const relatorio = montarRelatorioVisaoPessoa(
      demandas,
      [solicitacaoRh],
      movs,
      periodo,
      'Matheus'
    )

    const idsContagem = idsDemandasRecortePassagemPessoa(movs, 'Matheus', periodo.intervalo)
    expect(idsContagem).toEqual(['d1'])

    const filtrosBase = filtrosBaseVisaoPessoa(periodo.intervalo, 'Matheus')
    const listaRh = listarDemandasFiltradas(demandas, [solicitacaoRh], movs, {
      ...filtrosBase,
      departamento: 'RH',
    })
    expect(relatorio.paraQuem.find((i) => i.nome === 'RH')?.total).toBe(1)
    expect(listaRh).toHaveLength(1)
    expect(listaRh[0].pessoaEntrega).toBe('Matheus')

    const check = validarContagensConsistentesComFiltro(
      demandas,
      [solicitacaoRh],
      movs,
      idsContagem,
      filtrosBase
    )
    expect(check.ok).toBe(true)
  })

  it('passagem de Matheus entra no recorte mesmo quando Mizael entregou', () => {
    const periodo = intervaloFixo('2026-09-01', '2026-09-30')
    const demandas = [demanda({ id: 'd1' })]
    const movs: Movimentacao[] = [
      mov({
        id: 'm1',
        quando: instanteEmSaoPaulo(2026, 9, 5, 10),
        para: 'Matheus',
      }),
      mov({
        id: 'm2',
        quando: instanteEmSaoPaulo(2026, 9, 19, 11, 50),
        para: 'Mizael',
      }),
      mov({
        id: 'm3',
        quando: instanteEmSaoPaulo(2026, 9, 20, 12),
        status: 'Concluído',
        para: 'Concluído - Setembro',
      }),
    ]

    const ids = idsDemandasRecortePassagemPessoa(movs, 'Matheus', periodo.intervalo)
    expect(ids).toEqual(['d1'])

    const filtrosBase = filtrosBaseVisaoPessoa(periodo.intervalo, 'Matheus')
    expect(
      listarDemandasFiltradas(demandas, [solicitacaoRh], movs, {
        ...filtrosBase,
        departamento: 'RH',
      })
    ).toHaveLength(1)

    expect(
      validarContagensConsistentesComFiltro(
        demandas,
        [solicitacaoRh],
        movs,
        ids,
        filtrosBase
      ).ok
    ).toBe(true)
  })
})
