import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthGate } from '@/components/auth-gate'
import './globals.css'

export const metadata: Metadata = {
  title: 'Drogaria Nordeste Entregas',
  description: 'Gestão de portaria e fluxo de entregadores da Drogaria Nordeste.',
  icons: {
    icon: [
      {
        url: '/drogaria-nordeste-mark.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/drogaria-nordeste-mark.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/drogaria-nordeste-mark.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/drogaria-nordeste-mark.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthGate>{children}</AuthGate>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
