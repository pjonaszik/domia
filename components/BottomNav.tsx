// /components/BottomNav.tsx

'use client'

import { useEffect, useState } from 'react'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import type { User } from '@/lib/db/schema'
import { isCompany } from '@/lib/utils/user-type'

type Page = 'home' | 'tours' | 'clients' | 'calendar' | 'stats' | 'account' | 'offers' | 'pools'

interface BottomNavProps {
    currentPage: Page
    onPageChange: (page: Page) => void
    userId?: string
    user?: User | null
}

export function BottomNav({ currentPage, onPageChange, userId, user }: BottomNavProps) {
    const { t } = useLanguage()
    const [isAdmin, setIsAdmin] = useState(false)
    const isCompanyUser = isCompany(user)

    useEffect(() => {
        const checkAdmin = async () => {
            if (!userId) return
            
            try {
                const response = await apiClient.get('/api/admin/check')
                if (response.ok) {
                    const data = await response.json()
                    setIsAdmin(data.isAdmin || false)
                }
            } catch (error) {
                // User is not an admin, which is fine - ignore 401 errors
                setIsAdmin(false)
            }
        }

        checkAdmin()
    }, [userId])

    // Build navigation items based on user type
    const baseItems: Array<{ id: Page; label: string; icon: string }> = [
        { id: 'home', label: t('nav.home').toUpperCase(), icon: 'fa-home' },
        { id: 'clients', label: (isCompanyUser ? t('nav.consultants') : t('nav.clients')).toUpperCase(), icon: 'fa-users' },
        { id: 'stats', label: t('nav.stats').toUpperCase(), icon: 'fa-chart-bar' },
    ]

    // Add pools only for companies
    if (isCompanyUser) {
        baseItems.splice(2, 0, { id: 'pools', label: t('nav.pools').toUpperCase(), icon: 'fa-layer-group' })
    }

    // Add tours only for workers (not companies)
    if (!isCompanyUser) {
        baseItems.splice(1, 0, { id: 'tours', label: t('nav.tours').toUpperCase(), icon: 'fa-route' })
    }

    // Add calendar/planning/missions
    baseItems.splice(isCompanyUser ? 2 : 3, 0, {
        id: 'calendar',
        label: (isCompanyUser ? t('nav.missions') : t('nav.planning')).toUpperCase(),
        icon: 'fa-calendar'
    })

    const items = baseItems

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-white flex justify-around z-[100] w-full max-w-full"
            style={{
                borderTop: '4px solid var(--text-primary)',
                padding: '8px 0',
                paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '100vw',
                left: 0,
                right: 0
            }}
            aria-label={t('nav.mainNav')}
        >
            {items.map((item) => {
                const isActive = currentPage === item.id

                return (
                    <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`flex-1 flex flex-col items-center p-2 cursor-pointer transition-all duration-200 relative ${isActive
                            ? ''
                            : ''
                            }`}
                        style={{
                            transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                            color: isActive ? 'var(--primary)' : 'var(--text-light)'
                        }}
                        aria-label={t('nav.goToPage', { page: item.label })}
                        aria-current={isActive ? 'page' : undefined}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.85) translateY(2px)'
                            e.currentTarget.style.transition = 'transform 0.1s ease'
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = isActive ? 'translateY(-4px)' : 'translateY(0)'
                            e.currentTarget.style.transition = 'transform 0.2s ease'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = isActive ? 'translateY(-4px)' : 'translateY(0)'
                            e.currentTarget.style.transition = 'transform 0.2s ease'
                        }}
                        onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.85) translateY(2px)'
                            e.currentTarget.style.transition = 'transform 0.1s ease'
                        }}
                        onTouchEnd={(e) => {
                            e.currentTarget.style.transform = isActive ? 'translateY(-4px)' : 'translateY(0)'
                            e.currentTarget.style.transition = 'transform 0.2s ease'
                        }}
                    >
                        {/* Top indicator bar for active item */}
                        {isActive && (
                            <div
                                className="absolute"
                                style={{
                                    top: '-8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '40px',
                                    height: '4px',
                                    background: 'var(--primary)',
                                    borderRadius: '2px'
                                }}
                            />
                        )}

                        {/* Icon */}
                        <div
                            className="text-2xl mb-1 transition-all duration-300"
                            style={{
                                animation: isActive ? 'iconBounce 0.5s ease' : 'none'
                            }}
                            aria-hidden="true"
                        >
                            <i className={`fas ${item.icon}`} aria-hidden="true"></i>
                        </div>

                        {/* Label */}
                        <div
                            className="text-[11px] font-semibold uppercase"
                            style={{
                                letterSpacing: '0.3px'
                            }}
                        >
                            {item.label}
                        </div>
                    </button>
                )
            })}
        </nav>
    )
}
