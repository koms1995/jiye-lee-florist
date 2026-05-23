import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Jiye Lee — Florist',
  description: 'Floral design by Jiye Lee. Seasonal arrangements for weddings, events & editorial.',
  openGraph: {
    title: 'Jiye Lee — Florist',
    description: 'Floral design by Jiye Lee.',
    type: 'website',
  },
  // Explicit icon declarations override Next.js' auto-detected favicon.ico
  // so the new rose PNG takes precedence in browsers that prefer the first
  // <link rel="icon"> entry.
  icons: {
    icon:     [{ url: '/icon.png',       type: 'image/png', sizes: '512x512' }],
    apple:    [{ url: '/apple-icon.png', type: 'image/png', sizes: '512x512' }],
    shortcut: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        {/* Pretendard — Korean/Latin font designed to be metrically compatible with Inter */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      {/* suppressHydrationWarning: Grammarly and other browser extensions
          inject `data-gr-*` attributes into the body tag client-side, which
          differ from the server-rendered HTML. The mismatch is harmless but
          fills the console with hydration warnings — this attribute tells
          React to ignore body-level diffs. Doesn't affect children. */}
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
