import type { Metadata } from 'next'
import { archivoSans } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [{ url: '/sharks-logo.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={archivoSans.variable}>
      <body>{children}</body>
    </html>
  )
}
