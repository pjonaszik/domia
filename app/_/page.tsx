// /app/_/page.tsx - Dashboard main page

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { BottomNav } from '@/components/BottomNav'
import { Toast } from '@/components/Toast'
import { ClientList } from '@/components/clients/ClientList'
import { TourList } from '@/components/tours/TourList'
import { CalendarView } from '@/components/appointments/CalendarView'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { HomeDashboard } from '@/components/dashboard/HomeDashboard'

type Page = 'home' | 'tours' | 'clients' | 'calendar' | 'stats'

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true })
  }, [])

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Show toast for auth errors
  useEffect(() => {
    if (authError) {
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
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-checkered relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="floating-shape rounded-full" style={{ top: '10%', left: '10%', width: '80px', height: '80px', background: 'var(--primary)', animationDelay: '0s', opacity: 0.05 }} aria-hidden="true" />
        <div className="floating-shape" style={{ top: '20%', right: '15%', width: '60px', height: '60px', background: 'var(--secondary)', transform: 'rotate(45deg)', animationDelay: '2s', opacity: 0.05 }} aria-hidden="true" />
        <div className="floating-shape rounded-full" style={{ top: '60%', right: '10%', width: '80px', height: '80px', background: 'var(--primary)', animationDelay: '6s', opacity: 0.05 }} aria-hidden="true" />
      </div>

      <main id="main-content" className="container mx-auto max-w-md pb-20 relative">
        {currentPage === 'home' && (
          <div className="px-5 pt-5" style={{ paddingTop: 'calc(15px + env(safe-area-inset-top))' }}>
            <HomeDashboard 
              user={user} 
              onShowToast={showToast}
              onNavigate={(page) => setCurrentPage(page)}
            />
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
      </main>

      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} userId={user?.id} />
      <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
    </div>
  )
}

