import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Islamic Color Palette
        gold: '#d4af37',
        'gold-dark': '#8a6e3a',
        'emerald-green': '#1b5e43',
        'emerald-bright': '#2d7a5b',
        'marble-white': '#f8f6f2',
        'marble-grey': '#d4cfc7',

        // Background Colors
        'islamic-dark': '#0a0a0a',
        'islamic-darker': '#0f0f0f',
        'islamic-bg-secondary': '#151515',

        // Text Colors
        'text-primary': '#f1f1f1',
        'text-secondary': '#a0a0a0',
        'text-muted': '#666666',

        // Border Colors
        'border-dark': '#282828',
        'border-light': '#3a3a3a',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        amiri: ['var(--font-amiri)', 'serif'],
        sans: ['system-ui', 'sans-serif'],
        arabic: ['var(--font-amiri)', 'serif'],
      },
      backgroundColor: {
        islamic: {
          dark: '#0a0a0a',
          darker: '#0f0f0f',
          secondary: '#151515',
        },
      },
      borderColor: {
        islamic: {
          dark: '#282828',
          light: '#3a3a3a',
        },
      },
      textColor: {
        islamic: {
          primary: '#f1f1f1',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
      },
      boxShadow: {
        gold: '0 0 20px rgba(212, 175, 55, 0.3)',
        emerald: '0 0 20px rgba(27, 94, 67, 0.3)',
      },
    },
  },
  plugins: [],
  darkMode: ['class'],
}
export default config
