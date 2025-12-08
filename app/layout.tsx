// /app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Fredoka, Jua } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

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
  title: 'Domia - Vos tournées optimisées, vos journées simplifiées',
  description: 'L\'outil tout-en-un qui facilite le travail quotidien des indépendants du service à la personne.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${jua.variable}`}>
      <body className={`${fredoka.className} overflow-x-hidden`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}