import { existsSync } from 'fs'
import path from 'path'
import { Font } from '@react-pdf/renderer'

const FAMILY = 'Archivo'

let registrada = false

export function registrarFonteArchivoPdf(): string {
  if (registrada) return FAMILY
  registrada = true

  const dir = path.join(process.cwd(), 'public/fonts/archivo')
  const regular = path.join(dir, 'archivo-latin-400-normal.woff')
  const semibold = path.join(dir, 'archivo-latin-600-normal.woff')
  const bold = path.join(dir, 'archivo-latin-700-normal.woff')

  if (!existsSync(regular) || !existsSync(bold)) {
    return 'Helvetica'
  }

  Font.register({
    family: FAMILY,
    fonts: [
      { src: regular, fontWeight: 400 },
      ...(existsSync(semibold) ? [{ src: semibold, fontWeight: 600 }] : []),
      { src: bold, fontWeight: 700 },
    ],
  })

  return FAMILY
}

export function estiloArchivoNegrito(family: string): { fontFamily: string; fontWeight?: number } {
  if (family === FAMILY) return { fontFamily: FAMILY, fontWeight: 700 }
  return { fontFamily: 'Helvetica-Bold' }
}
