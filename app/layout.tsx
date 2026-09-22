import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthGate } from '@/components/auth-gate'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Drogaria Nordeste Entregas',
  description: 'Gestão de portaria e fluxo de entregadores da Drogaria Nordeste.',
  applicationName: 'Drogaria Nordeste Entregas',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Drogaria Nordeste Entregas',
    title: 'Drogaria Nordeste Entregas',
    description: 'Gestão de portaria e fluxo de entregadores da Drogaria Nordeste.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Drogaria Nordeste Entregas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drogaria Nordeste Entregas',
    description: 'Gestão de portaria e fluxo de entregadores da Drogaria Nordeste.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
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
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#e30613',
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
