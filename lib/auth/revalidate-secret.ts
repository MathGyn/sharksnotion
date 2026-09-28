export function revalidateSecretValido(request: Request): boolean {
  const esperado = process.env.REVALIDATE_SECRET?.trim()
  if (!esperado) return false

  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${esperado}`) return true

  const header = request.headers.get('x-revalidate-secret')
  if (header === esperado) return true

  const secretQuery = new URL(request.url).searchParams.get('secret')
  if (secretQuery === esperado) return true

  return false
}
