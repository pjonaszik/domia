// /app/dashboard/page.tsx - Dashboard main page

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { BottomNav } from '@/components/BottomNav'
import { Alert } from '@/components/Alert'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ClientList } from '@/components/clients/ClientList'
import { TourList } from '@/components/tours/TourList'
import { CalendarView } from '@/components/appointments/CalendarView'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { HomeDashboard } from '@/components/dashboard/HomeDashboard'
import AccountPage from './account/page'
import OffersPage from './offers/page'
import { PoolList } from '@/components/pools/PoolList'

type Page = 'home' | 'tours' | 'clients' | 'calendar' | 'stats' | 'account' | 'offers' | 'pools'

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'success' | 'info' | 'warning' } | null>(null)

  const showAlert = useCallback((message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error') => {
    setAlert({ message, type })
  }, [])

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Show alert for auth errors
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAlert({ message: authError, type: 'error' })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [authError])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-checkered flex items-center justify-center w-full max-w-full overflow-x-hidden">
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
    <div className="min-h-screen bg-checkered relative w-full max-w-full overflow-x-clip" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'clip' }}>
      <DashboardHeader 
        onNavigateToAccount={() => setCurrentPage('account')}
        onNavigateToOffers={() => setCurrentPage('offers')}
      />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none w-full max-w-full" aria-hidden="true" style={{ width: '100vw', maxWidth: '100vw' }}>
        <div className="floating-shape rounded-full" style={{ top: '10%', left: '10%', width: '80px', height: '80px', background: 'var(--primary)', animationDelay: '0s', opacity: 0.05 }} aria-hidden="true" />
        <div className="floating-shape" style={{ top: '20%', right: '15%', width: '60px', height: '60px', background: 'var(--secondary)', transform: 'rotate(45deg)', animationDelay: '2s', opacity: 0.05 }} aria-hidden="true" />
        <div className="floating-shape rounded-full" style={{ top: '60%', right: '10%', width: '80px', height: '80px', background: 'var(--primary)', animationDelay: '6s', opacity: 0.05 }} aria-hidden="true" />
      </div>

      <main id="main-content" className="container mx-auto max-w-md pb-24 sm:pb-28 relative w-full max-w-full overflow-x-clip" style={{ maxWidth: '100vw', width: '100%', overflowX: 'clip', paddingTop: 'calc(70px + env(safe-area-inset-top))', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {currentPage === 'home' && (
          <div className="px-5 pt-5">
            <HomeDashboard 
              user={user} 
              onShowAlert={showAlert}
              onNavigate={(page) => setCurrentPage(page)}
            />
          </div>
        )}
        {currentPage === 'tours' && (
          <div className="px-5 pt-5">
            <TourList onShowAlert={showAlert} />
          </div>
        )}
        {currentPage === 'clients' && (
          <div className="px-5 pt-5">
            <ClientList onShowAlert={showAlert} />
          </div>
        )}
        {currentPage === 'calendar' && (
          <div className="px-5 pt-5">
            <CalendarView user={user} onShowAlert={showAlert} />
          </div>
        )}
        {currentPage === 'stats' && (
          <div className="px-5 pt-5">
            <DashboardStats />
          </div>
        )}
        {currentPage === 'account' && (
          <div className="px-5 pt-5">
            <AccountPage />
          </div>
        )}
        {currentPage === 'offers' && (
          <div className="px-5 pt-5">
            <OffersPage onShowAlert={showAlert} />
          </div>
        )}
        {currentPage === 'pools' && (
          <div className="px-5 pt-5">
            <PoolList onShowAlert={showAlert} />
          </div>
        )}
      </main>

      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} user={user} />
      {alert && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4" style={{ paddingTop: 'calc(90px + env(safe-area-inset-top))' }}>
          <div className="max-w-md mx-auto">
            <Alert 
              message={alert.message} 
              type={alert.type} 
              onClose={() => setAlert(null)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

