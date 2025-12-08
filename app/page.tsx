// /app/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { BottomNav } from '@/components/BottomNav'
import { Toast } from '@/components/Toast'
import { ClientList } from '@/components/clients/ClientList'
import { TourList } from '@/components/tours/TourList'
import { CalendarView } from '@/components/appointments/CalendarView'
import { DashboardStats } from '@/components/dashboard/DashboardStats'

type Page = 'home' | 'tours' | 'clients' | 'calendar' | 'stats'

export default function Home() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true })
  }, [])

  // Show toast for auth errors
  useEffect(() => {
    if (authError) {
      // Use setTimeout to avoid calling setState synchronously in effect
      const timer = setTimeout(() => showToast(authError), 0)
      return () => clearTimeout(timer)
    }
  }, [authError, showToast])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-checkered flex items-center justify-center">
        <div className="text-center bg-white rounded-[20px] p-8 mx-4 card-3d">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-primary text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-checkered flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-[20px] p-8 max-w-md card-3d">
          <h2 className="text-2xl font-bold text-primary mb-4">Bienvenue sur Domia</h2>
          <p className="text-secondary mb-6">Vos tournées optimisées, vos journées simplifiées.</p>
          <p className="text-light text-sm mb-4">Veuillez vous connecter pour continuer.</p>
          <a href="/login" className="inline-block btn-primary px-8 py-4 text-lg">
            Se connecter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-checkered relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-shape rounded-full" style={{ top: '10%', left: '10%', width: '80px', height: '80px', background: 'var(--primary)', animationDelay: '0s', opacity: 0.05 }} />
        <div className="floating-shape" style={{ top: '20%', right: '15%', width: '60px', height: '60px', background: 'var(--secondary)', transform: 'rotate(45deg)', animationDelay: '2s', opacity: 0.05 }} />
        <div className="floating-shape rounded-full" style={{ top: '60%', right: '10%', width: '80px', height: '80px', background: 'var(--primary)', animationDelay: '6s', opacity: 0.05 }} />
      </div>

      <div className="container mx-auto max-w-md pb-20 relative">
        {currentPage === 'home' && (
          <div className="px-5 pt-5">
            <div className="text-center py-4 px-5" style={{ paddingTop: 'calc(15px + env(safe-area-inset-top))' }}>
              <h1 className="main-header-title">
                <span
                  className="absolute top-2 left-10 right-10 h-1/5 rounded-[50px] pointer-events-none"
                  style={{ background: 'rgba(255, 255, 255, 0.3)' }}
                />
                <span className="relative z-10">Domia</span>
              </h1>
            </div>
            <div className="card-3d mt-5">
              <h2 className="text-xl font-bold text-primary mb-4">Bienvenue, {user.firstName || user.email}!</h2>
              <p className="text-secondary mb-4">Vos tournées optimisées, vos journées simplifiées.</p>
              <div className="space-y-3">
                <div className="stat-card">
                  <p className="text-sm text-secondary">Profession</p>
                  <p className="font-semibold text-primary">{user.profession || 'Non spécifiée'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {currentPage === 'tours' && (
          <div className="px-5 pt-5">
            <TourList onShowToast={showToast} />
          </div>
        )}
        {currentPage === 'clients' && (
          <div className="px-5 pt-5">
            <ClientList onShowToast={showToast} />
          </div>
        )}
        {currentPage === 'calendar' && (
          <div className="px-5 pt-5">
            <CalendarView onShowToast={showToast} />
          </div>
        )}
        {currentPage === 'stats' && (
          <div className="px-5 pt-5">
            <DashboardStats />
          </div>
        )}
      </div>

      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} userId={user?.id} />
      <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
    </div>
  )
}
