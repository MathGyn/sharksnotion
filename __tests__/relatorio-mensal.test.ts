import { describe, expect, it } from 'vitest'
import { nomeArquivoRelatorioMensal } from '@/lib/pdf/gerar-relatorio-mensal-pdf'
import {
  intervaloMesAnteriorFechado,
  mesAnoDeIntervalo,
  rotuloMesAnoPorExtenso,
} from '@/lib/relatorio/periodo'
import { lerSmtpConfig } from '@/lib/email/smtp-config'
import { mediaTempoPessoaNoIntervaloEmDias } from '@/lib/relatorio/tempo'

describe('relatório mensal automático', () => {
  it('intervaloMesAnteriorFechado retorna mês civil anterior em SP', () => {
    const ref = new Date('2026-03-01T12:00:00-03:00')
    const intervalo = intervaloMesAnteriorFechado(ref)
    expect(intervalo.de).toBe('2026-02-01')
    expect(intervalo.ate).toBe('2026-02-28')
  })

  it('nome do PDF segue relatorio-marketing-YYYY-MM.pdf', () => {
    expect(
      nomeArquivoRelatorioMensal({ de: '2026-09-01', ate: '2026-09-30' })
    ).toBe('relatorio-marketing-2026-09.pdf')
  })

  it('rótulo do mês por extenso', () => {
    expect(rotuloMesAnoPorExtenso('2026-09')).toBe('setembro de 2026')
    expect(mesAnoDeIntervalo({ de: '2026-09-01', ate: '2026-09-30' })).toBe('2026-09')
  })

  it('lerSmtpConfig exige variáveis mínimas', () => {
    const prev = { ...process.env }
    process.env.SMTP_HOST = 'smtp.test'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'u'
    process.env.SMTP_PASS = 'p'
    process.env.EMAIL_REMETENTE = 'from@test'
    process.env.EMAIL_DESTINATARIOS = 'a@test,b@test'
    expect(lerSmtpConfig()?.destinatarios).toEqual(['a@test', 'b@test'])
    delete process.env.SMTP_HOST
    expect(lerSmtpConfig()).toBeNull()
    process.env = prev
  })

  it('tempo médio por pessoa no intervalo', () => {
    const movs = [
      {
        id: '1',
        demandaId: 'd1',
        para: 'Matheus',
        quando: '2026-09-01T10:00:00-03:00',
      },
      {
        id: '2',
        demandaId: 'd1',
        para: 'Outro',
        quando: '2026-09-03T10:00:00-03:00',
      },
    ]
    const intervalo = { de: '2026-09-01', ate: '2026-09-30' }
    const dias = mediaTempoPessoaNoIntervaloEmDias(movs as never, 'Matheus', intervalo)
    expect(dias).toBe(2.0)
  })
})
