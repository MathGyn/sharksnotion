import { Archivo } from 'next/font/google'

/** Reexport para uso fora do layout raiz, se necessário. */
export const archivoSans = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: 'variable',
  axes: ['wdth'],
  adjustFontFallback: true,
})
