// /components/BottomNav.tsx

'use client'

import { useEffect, useState } from 'react'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { apiClient } from '@/lib/utils/api-client'

type Page = 'home' | 'tours' | 'clients' | 'calendar' | 'stats'

interface BottomNavProps {
    currentPage: Page
    onPageChange: (page: Page) => void
    userId?: string
}

export function BottomNav({ currentPage, onPageChange, userId }: BottomNavProps) {
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAdmin = async () => {
            if (!userId) return
            
            try {
                const response = await apiClient.get('/api/auth/me')
                const data = await response.json()
                setIsAdmin(data.user?.isAdmin || false)
            } catch (error) {
                console.error('Failed to check admin status:', error)
            }
        }

        checkAdmin()
    }, [userId])

    const items: Array<{ id: Page; label: string; icon: string }> = [
        { id: 'home', label: 'ACCUEIL', icon: 'fa-home' },
        { id: 'tours', label: 'TOURNÉES', icon: 'fa-route' },
        { id: 'clients', label: 'CLIENTS', icon: 'fa-users' },
        { id: 'calendar', label: 'PLANNING', icon: 'fa-calendar' },
        { id: 'stats', label: 'STATS', icon: 'fa-chart-bar' },
    ]

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-white flex justify-around z-[100]"
            style={{
                borderTop: '4px solid var(--text-primary)',
                padding: '8px 0',
                paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)'
            }}
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
                        >
                            <i className={`fas ${item.icon}`}></i>
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
        </div>
    )
}
