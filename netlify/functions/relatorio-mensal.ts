/**
 * Disparo agendado (cron no netlify.toml). Delega ao handler Next em /api/enviar-relatorio
 * para reutilizar o fluxo completo dentro do limite de execução do app (60s).
 */
export default async (): Promise<Response> => {
  const base = process.env.URL?.replace(/\/$/, '')
  const secret = process.env.REVALIDATE_SECRET?.trim()

  if (!base || !secret) {
    console.error('[relatorio-mensal] URL ou REVALIDATE_SECRET ausente — abortando.')
    return new Response(JSON.stringify({ ok: false, motivo: 'config_ausente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const alvo = `${base}/api/enviar-relatorio`
  const res = await fetch(alvo, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
  })

  const corpo = await res.text()
  console.log('[relatorio-mensal]', res.status, corpo.slice(0, 500))

  return new Response(corpo, {
    status: res.ok ? 200 : 502,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  })
}
