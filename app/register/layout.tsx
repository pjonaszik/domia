// /app/register/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte Domia',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

