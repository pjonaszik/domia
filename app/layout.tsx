// /app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Fredoka, Jua } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'

// Configure Fredoka font
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

// Configure Jua font
const jua = Jua({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-jua',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Domia - Vos tournées optimisées, vos journées simplifiées',
    template: '%s | Domia'
  },
  description: 'L\'outil tout-en-un qui facilite le travail quotidien des indépendants du service à la personne. Gestion de clients, planning, optimisation de tournées, facturation et statistiques.',
  keywords: [
    'service à la personne',
    'infirmière libérale',
    'aide-soignante',
    'aide à domicile',
    'garde d\'enfants',
    'agent d\'entretien',
    'gestion clients',
    'planning professionnel',
    'optimisation tournées',
    'facturation',
    'logiciel professionnel',
    'application mobile',
    'domia'
  ],
  authors: [{ name: 'Domia' }],
  creator: 'Domia',
  publisher: 'Domia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://domia.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: 'Domia',
    title: 'Domia - Vos tournées optimisées, vos journées simplifiées',
    description: 'L\'outil tout-en-un qui facilite le travail quotidien des indépendants du service à la personne.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Domia - Application de gestion pour professionnels du service à la personne',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Domia - Vos tournées optimisées, vos journées simplifiées',
    description: 'L\'outil tout-en-un qui facilite le travail quotidien des indépendants du service à la personne.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#2563EB' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${fredoka.variable} ${jua.variable}`} style={{ overflowX: 'clip', width: '100vw', maxWidth: '100vw' }}>
      <body className={`${fredoka.className} overflow-x-clip w-full max-w-full`} style={{ overflowX: 'clip', width: '100vw', maxWidth: '100vw' }}>
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-lg focus:font-semibold"
        >
          Aller au contenu principal
        </a>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}