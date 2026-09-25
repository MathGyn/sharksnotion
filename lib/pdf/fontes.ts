import { existsSync } from 'fs'
import path from 'path'
import { Font } from '@react-pdf/renderer'

const FAMILY = 'Paralucent'

function diretorioFontes(): string {
  if (process.env.PARALUCENT_FONTS_DIR?.trim()) {
    return process.env.PARALUCENT_FONTS_DIR.trim()
  }
  return path.join(process.cwd(), 'public/fonts/paralucent')
}

function caminhoFonte(dir: string, localName: string, brandingName: string): string | null {
  const localPath = path.join(dir, localName)
  if (existsSync(localPath)) return localPath
  const brandingPath = path.join(dir, brandingName)
  if (existsSync(brandingPath)) return brandingPath
  return null
}

let fontesRegistradas = false
let usaParalucent = false

/** Registra Paralucent para o PDF (Text Book / Medium / Text Bold). */
export function registrarFontesPdf(): { family: string; usaParalucent: boolean } {
  if (fontesRegistradas) {
    return { family: usaParalucent ? FAMILY : 'Helvetica', usaParalucent }
  }
  fontesRegistradas = true

  const dir = diretorioFontes()
  const book = caminhoFonte(
    dir,
    'ParalucentTextBook.otf',
    'fonnts.com-Paralucent_Text_Book.otf'
  )
  const medium = caminhoFonte(
    dir,
    'ParalucentMedium.otf',
    'fonnts.com-Paralucent_Medium.otf'
  )
  const bold = caminhoFonte(
    dir,
    'ParalucentTextBold.otf',
    'fonnts.com-Paralucent_Text_Bold.otf'
  )

  if (!book || !bold) {
    usaParalucent = false
    return { family: 'Helvetica', usaParalucent: false }
  }

  Font.register({
    family: FAMILY,
    fonts: [
      { src: book, fontWeight: 400 },
      ...(medium ? [{ src: medium, fontWeight: 500 }] : []),
      { src: bold, fontWeight: 700 },
    ],
  })

  usaParalucent = true
  return { family: FAMILY, usaParalucent: true }
}

export function familiaPdfRegular(family: string): string {
  return family
}

export function estiloPdfNegrito(family: string): { fontFamily: string; fontWeight?: number } {
  if (family === FAMILY) {
    return { fontFamily: FAMILY, fontWeight: 700 }
  }
  return { fontFamily: 'Helvetica-Bold' }
}
