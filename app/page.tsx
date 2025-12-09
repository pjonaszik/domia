// /app/page.tsx

// /app/page.tsx - Landing page (public)

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LandingPage } from '@/components/landing/LandingPage'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/_')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-checkered flex items-center justify-center">
        <div className="text-center bg-white rounded-[20px] p-8 mx-4 card-3d">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-primary text-lg font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return <LandingPage />
}
