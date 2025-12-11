// /components/dashboard/DashboardHeader.tsx

'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface DashboardHeaderProps {
    onNavigateToAccount?: () => void
    onNavigateToOffers?: () => void
}

export function DashboardHeader({ onNavigateToAccount, onNavigateToOffers }: DashboardHeaderProps) {
    const { t } = useLanguage()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await apiClient.get('/dashboard/api/offers/unread-count')
                if (response.ok) {
                    const data = await response.json()
                    setUnreadCount(data.count || 0)
                }
            } catch (error) {
                console.error('Error fetching unread count:', error)
            }
        }

        fetchUnreadCount()
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(fetchUnreadCount, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <header 
            className="fixed top-0 left-0 right-0 bg-white z-50 border-b-4 border-[var(--primary)]"
            style={{
                paddingTop: 'calc(15px + env(safe-area-inset-top))',
                paddingBottom: '15px',
                paddingLeft: '20px',
                paddingRight: '20px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '100vw'
            }}
            role="banner"
        >
            <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Logo/Title */}
                <h1 className="text-2xl font-bold text-[var(--primary)]">
                    Domia
                </h1>

                <div className="flex items-center gap-3">
                    {/* Messages/Offres Button */}
                    <button
                        onClick={() => onNavigateToOffers?.()}
                        className="relative w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                        aria-label={t('offers.title')}
                    >
                        <i className="fas fa-envelope" aria-hidden="true"></i>
                        {unreadCount > 0 && (
                            <span 
                                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                                aria-label={t('offers.unreadCount', { count: String(unreadCount) })}
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* User Menu Button */}
                    <button
                        onClick={() => onNavigateToAccount?.()}
                        className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                        aria-label={t('header.userMenu')}
                    >
                        <i className="fas fa-user" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </header>
    )
}

