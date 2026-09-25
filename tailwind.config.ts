import type { Config } from 'tailwindcss'

/**
 * Paleta, tipografia, espaço e raios só da seção 2 — sem defaults do Tailwind.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      marinho: 'var(--marinho)',
      'marinho-fumo': 'var(--marinho-fumo)',
      areia: 'var(--areia)',
      'areia-clara': 'var(--areia-clara)',
      papel: 'var(--papel)',
      branco: 'var(--branco)',
      nevoa: 'var(--nevoa)',
      linha: 'var(--linha)',
      atraso: 'var(--atraso)',
      'no-prazo': 'var(--no-prazo)',
      pessoa: {
        1: 'var(--pessoa-1)',
        2: 'var(--pessoa-2)',
        3: 'var(--pessoa-3)',
        4: 'var(--pessoa-4)',
        5: 'var(--pessoa-5)',
        6: 'var(--pessoa-6)',
      },
    },
    fontFamily: {
      sans: ['var(--font-archivo)', 'sans-serif'],
    },
    fontSize: {
      12: ['12px', { lineHeight: '1.5' }],
      14: ['14px', { lineHeight: '1.5' }],
      16: ['16px', { lineHeight: '1.5' }],
      20: ['20px', { lineHeight: '1.2' }],
      26: ['26px', { lineHeight: '1.2' }],
      40: ['40px', { lineHeight: '1.2' }],
      48: ['48px', { lineHeight: '1.2' }],
      64: ['64px', { lineHeight: '1.2' }],
      96: ['96px', { lineHeight: '1.2' }],
    },
    lineHeight: {
      titulo: '1.2',
      texto: '1.5',
    },
    letterSpacing: {
      titulo: '-0.02em',
    },
    spacing: {
      0: '0',
      4: '4px',
      8: '8px',
      12: '12px',
      16: '16px',
      24: '24px',
      32: '32px',
      48: '48px',
      64: '64px',
      96: '96px',
    },
    borderRadius: {
      none: '0',
      bloco: '28px',
      interno: '12px',
      pill: '9999px',
    },
    maxWidth: {
      conteudo: '1240px',
    },
    gap: {
      0: '0',
      4: '4px',
      8: '8px',
      12: '12px',
      16: '16px',
      24: '24px',
      32: '32px',
      48: '48px',
      64: '64px',
      96: '96px',
    },
    boxShadow: {
      'seletor-mes': '0 8px 24px rgba(16, 32, 63, 0.08)',
    },
    transitionDuration: {
      120: '120ms',
      500: '500ms',
    },
    borderWidth: {
      DEFAULT: '1px',
      0: '0',
    },
  },
  plugins: [],
}

export default config
