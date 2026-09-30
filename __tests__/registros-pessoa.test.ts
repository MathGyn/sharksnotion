import { describe, expect, it } from 'vitest'
import {
  PROP_AUTOR_OBSERVACAO,
  PROP_MES_REFERENCIA,
  PROP_OBSERVACAO,
  PROP_QUANTIDADE_ENTREGAS,
  PROP_RELATORIO_PESSOA,
  PROP_TIPO_REGISTRO,
  TIPO_REGISTRO_CONTAGEM_ENTREGAS,
  TIPO_REGISTRO_OBSERVACAO,
  partitionMovimentacoesPages,
} from '@/lib/notion/movimentacoes-parse'
import type { NotionPage } from '@/lib/notion/types'
import {
  contagemEntregasDoMes,
  mesAnoValido,
  mesReferenciaDoIntervalo,
  mesesDoIntervalo,
  observacoesDaPessoaNoIntervalo,
  pessoasComRegistrosNoIntervalo,
  quantidadeEntregasValida,
  registrosPessoaNoPeriodo,
  totalEntregasManuaisNoIntervalo,
  type ContagemEntregasMensal,
  type ObservacaoPessoaMensal,
} from '@/lib/relatorio/registros-pessoa'

function rich(texto: string) {
  return { type: 'rich_text', rich_text: [{ type: 'text', text: { content: texto }, plain_text: texto }] }
}

function pagina(id: string, props: Record<string, unknown>, editado?: string): NotionPage {
  return {
    object: 'page',
    id,
    created_time: '2026-09-10T12:00:00.000Z',
    last_edited_time: editado,
    url: '',
    properties: {
      Registro: { type: 'title', title: [{ type: 'text', text: { content: 'R' } }] },
      Demanda: { type: 'relation', relation: [] },
      Para: rich('—'),
      Status: rich('—'),
      ...props,
    },
  }
}

function contagem(
  pessoaNome: string,
  mesAno: string,
  quantidade: number,
  atualizadoEm = '2026-09-10T00:00:00.000Z'
): ContagemEntregasMensal {
  return { pessoaNome, mesAno, quantidade, atualizadoEm }
}

function observacao(
  id: string,
  pessoaNome: string,
  mesAno: string,
  criadoEm: string
): ObservacaoPessoaMensal {
  return { id, pessoaNome, mesAno, texto: `obs ${id}`, autor: 'Gestor', criadoEm }
}

describe('partitionMovimentacoesPages — registros da página pessoa', () => {
  it('separa contagem de entregas e observação das movimentações', () => {
    const textoLongo = 'a'.repeat(2000) + 'b'.repeat(10)
    const pages = [
      pagina('mov', { Demanda: { type: 'relation', relation: [{ id: 'd1' }] }, Para: rich('Matheus') }),
      pagina(
        'cont',
        {
          [PROP_TIPO_REGISTRO]: { type: 'select', select: { name: TIPO_REGISTRO_CONTAGEM_ENTREGAS } },
          [PROP_RELATORIO_PESSOA]: rich('Thamara'),
          [PROP_MES_REFERENCIA]: { type: 'date', date: { start: '2026-09-01' } },
          [PROP_QUANTIDADE_ENTREGAS]: { type: 'number', number: 200 },
        },
        '2026-09-20T10:00:00.000Z'
      ),
      pagina('obs', {
        [PROP_TIPO_REGISTRO]: { type: 'select', select: { name: TIPO_REGISTRO_OBSERVACAO } },
        [PROP_RELATORIO_PESSOA]: rich('Thamara'),
        [PROP_MES_REFERENCIA]: { type: 'date', date: { start: '2026-09-01' } },
        [PROP_OBSERVACAO]: {
          type: 'rich_text',
          rich_text: [
            { type: 'text', text: { content: 'a'.repeat(2000) }, plain_text: 'a'.repeat(2000) },
            { type: 'text', text: { content: 'b'.repeat(10) }, plain_text: 'b'.repeat(10) },
          ],
        },
        [PROP_AUTOR_OBSERVACAO]: rich('Matheus'),
      }),
    ]

    const r = partitionMovimentacoesPages(pages)
    expect(r.movimentacoes.map((m) => m.id)).toEqual(['mov'])
    expect(r.contagensEntregas).toEqual([
      {
        pessoaNome: 'Thamara',
        mesAno: '2026-09',
        quantidade: 200,
        registroPageId: 'cont',
        atualizadoEm: '2026-09-20T10:00:00.000Z',
      },
    ])
    expect(r.observacoesPessoa).toHaveLength(1)
    expect(r.observacoesPessoa[0]).toMatchObject({
      pessoaNome: 'Thamara',
      mesAno: '2026-09',
      autor: 'Matheus',
      texto: textoLongo,
    })
  })

  it('ignora registros incompletos sem vazar para movimentações', () => {
    const r = partitionMovimentacoesPages([
      pagina('cont-sem-mes', {
        [PROP_TIPO_REGISTRO]: { type: 'select', select: { name: TIPO_REGISTRO_CONTAGEM_ENTREGAS } },
        [PROP_RELATORIO_PESSOA]: rich('Thamara'),
        [PROP_QUANTIDADE_ENTREGAS]: { type: 'number', number: 3 },
      }),
    ])
    expect(r.contagensEntregas).toHaveLength(0)
    expect(r.movimentacoes).toHaveLength(0)
  })
})

describe('meses do intervalo', () => {
  it('mês de referência só existe quando o período cabe num mês', () => {
    expect(mesReferenciaDoIntervalo({ de: '2026-09-01', ate: '2026-09-30' })).toBe('2026-09')
    expect(mesReferenciaDoIntervalo({ de: '2026-08-01', ate: '2026-09-30' })).toBeNull()
  })

  it('lista meses atravessando a virada do ano', () => {
    expect(mesesDoIntervalo({ de: '2025-11-15', ate: '2026-02-03' })).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
  })
})

describe('contagem manual de entregas', () => {
  const contagens = [
    contagem('Thamara', '2026-08', 150),
    contagem('Thamara', '2026-09', 190, '2026-09-10T00:00:00.000Z'),
    contagem('thamara', '2026-09', 200, '2026-09-12T00:00:00.000Z'),
    contagem('Matheus', '2026-09', 30),
  ]

  it('mês novo começa zerado (sem registro)', () => {
    expect(contagemEntregasDoMes(contagens, 'Thamara', '2026-10')).toBeNull()
    expect(
      totalEntregasManuaisNoIntervalo(contagens, 'Thamara', { de: '2026-10-01', ate: '2026-10-31' })
    ).toBe(0)
  })

  it('em duplicata vale o registro editado por último', () => {
    expect(contagemEntregasDoMes(contagens, 'Thamara', '2026-09')?.quantidade).toBe(200)
  })

  it('soma os meses do período', () => {
    expect(
      totalEntregasManuaisNoIntervalo(contagens, 'Thamara', { de: '2026-08-01', ate: '2026-09-30' })
    ).toBe(350)
  })

  it('valida entrada', () => {
    expect(mesAnoValido('2026-09')).toBe(true)
    expect(mesAnoValido('2026-13')).toBe(false)
    expect(quantidadeEntregasValida(0)).toBe(true)
    expect(quantidadeEntregasValida(-1)).toBe(false)
    expect(quantidadeEntregasValida(1.5)).toBe(false)
    expect(quantidadeEntregasValida('3')).toBe(false)
  })
})

describe('observações', () => {
  const obs = [
    observacao('o1', 'Matheus', '2026-09', '2026-09-02T10:00:00.000Z'),
    observacao('o2', 'Matheus', '2026-09', '2026-09-20T10:00:00.000Z'),
    observacao('o3', 'Matheus', '2026-08', '2026-08-20T10:00:00.000Z'),
    observacao('o4', 'Regiane', '2026-09', '2026-09-05T10:00:00.000Z'),
  ]

  it('filtra por pessoa e mês, mais recentes primeiro', () => {
    const r = observacoesDaPessoaNoIntervalo(obs, 'matheus', { de: '2026-09-01', ate: '2026-09-30' })
    expect(r.map((o) => o.id)).toEqual(['o2', 'o1'])
  })

  it('agrega registros da pessoa no período', () => {
    const r = registrosPessoaNoPeriodo(
      [contagem('Matheus', '2026-09', 30)],
      obs,
      'Matheus',
      { de: '2026-09-01', ate: '2026-09-30' }
    )
    expect(r.mesReferencia).toBe('2026-09')
    expect(r.contagemMes?.quantidade).toBe(30)
    expect(r.totalEntregas).toBe(30)
    expect(r.observacoes).toHaveLength(2)
  })

  it('pessoas com registro entram no relatório mesmo sem passagem', () => {
    expect(
      pessoasComRegistrosNoIntervalo([contagem('Mizael', '2026-09', 5)], obs, {
        de: '2026-09-01',
        ate: '2026-09-30',
      })
    ).toEqual(['Mizael', 'Matheus', 'Regiane'])
  })
})
