// /components/dashboard/HomeDashboard.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import type { User, Tour } from '@/lib/db/schema'
import { useLanguage } from '@/contexts/LanguageContext'
import { isCompany } from '@/lib/utils/user-type'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface HomeDashboardProps {
    user: User
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
    onNavigate?: (page: 'tours' | 'clients' | 'calendar') => void
}

interface QuickStats {
    clients: number
    todayAppointments: number
    todayTours: number
    monthlyRevenue: number
}

export function HomeDashboard({ user, onShowAlert, onNavigate }: HomeDashboardProps) {
    const { t } = useLanguage()
    const [stats, setStats] = useState<QuickStats | null>(null)
    const [todayTours, setTodayTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(true)
    const isCompanyUser = isCompany(user)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            
            // Load stats
                const statsResponse = await apiClient.get('/api/stats')
            if (statsResponse.ok) {
                const statsData = await statsResponse.json()
                setStats({
                    clients: statsData.stats?.clients?.total || 0,
                    todayAppointments: statsData.stats?.appointments?.today || 0,
                    todayTours: 0, // Will be calculated from tours
                    monthlyRevenue: statsData.stats?.revenue?.monthly || 0
                })
            }

            // Load today's tours
            const toursResponse = await apiClient.get('/api/tours')
            if (toursResponse.ok) {
                const toursData = await toursResponse.json()
                const tours = toursData.tours || []
                const today = new Date()
                const todayToursList = tours.filter((tour: Tour) => {
                    if (!tour.date) return false
                    const tourDate = new Date(tour.date)
                    return tourDate.toDateString() === today.toDateString()
                })
                setTodayTours(todayToursList)
                if (stats) {
                    setStats({ ...stats, todayTours: todayToursList.length })
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            onShowAlert?.(t('dashboard.errorLoading'), 'error')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="card-3d">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                        <p className="text-secondary">{t('common.loading')}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Welcome Header - Only for workers, not companies */}
            {!isCompanyUser && (
                <div className="card-3d">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {t('dashboard.welcomeUser', { name: user.businessName || t('common.user') })} 👋
                            </h2>
                            <p className="text-secondary text-sm mt-1">
                                {user.profession || t('dashboard.profession')}
                            </p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-2xl font-bold">
                            {(user.businessName || user.email || 'U')[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-[var(--tertiary)]">
                        <p className="text-sm text-secondary italic">
                            "{t('dashboard.tagline')}"
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i className="fas fa-users text-[var(--primary)]"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">
                        {isCompanyUser ? t('dashboard.pool') : t('dashboard.clients')}
                    </p>
                    <p className="text-2xl font-bold text-primary">{stats?.clients || 0}</p>
                </div>

                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <i className="fas fa-calendar-check text-[var(--secondary)]"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">{t('dashboard.today')}</p>
                    <p className="text-2xl font-bold text-primary">{stats?.todayAppointments || 0}</p>
                </div>

                {/* Tours - Only for workers, not companies */}
                {!isCompanyUser && (
                    <div className="card-3d p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i className="fas fa-route text-purple-600"></i>
                            </div>
                        </div>
                        <p className="text-xs text-secondary mb-1">{t('dashboard.todayTours')}</p>
                        <p className="text-2xl font-bold text-primary">{stats?.todayTours || 0}</p>
                    </div>
                )}

                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <i className="fas fa-euro-sign text-green-600"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">{t('dashboard.monthlyRevenue')}</p>
                    <p className="text-2xl font-bold text-primary">
                        {(stats?.monthlyRevenue || 0).toFixed(0)} €
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card-3d">
                <h3 className="text-lg font-bold text-primary mb-3">{t('dashboard.quickActions')}</h3>
                <div className={`grid gap-3 ${isCompanyUser ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    <button
                        onClick={() => onNavigate?.('clients')}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                        aria-label={isCompanyUser ? t('dashboard.newConsultant') : t('dashboard.createNewClient')}
                    >
                        <i className="fas fa-user-plus text-xl" aria-hidden="true"></i>
                        <span className="font-semibold">
                            {isCompanyUser ? t('dashboard.newConsultant') : t('dashboard.newClient')}
                        </span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('calendar')}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--secondary)] hover:bg-[var(--secondary)] hover:text-white transition-all"
                        aria-label={isCompanyUser ? t('dashboard.newMission') : t('dashboard.createNewAppointment')}
                    >
                        <i className="fas fa-calendar-plus text-xl" aria-hidden="true"></i>
                        <span className="font-semibold">
                            {isCompanyUser ? t('dashboard.newMission') : t('dashboard.newAppointment')}
                        </span>
                    </button>
                    {/* Optimize and Planning - Only for workers */}
                    {!isCompanyUser && (
                        <>
                            <button
                                onClick={() => onNavigate?.('tours')}
                                className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-500 hover:bg-purple-500 hover:text-white transition-all"
                                aria-label={t('dashboard.optimizeTour')}
                            >
                                <i className="fas fa-route text-xl" aria-hidden="true"></i>
                                <span className="font-semibold">{t('dashboard.optimize')}</span>
                            </button>
                            <button
                                onClick={() => onNavigate?.('calendar')}
                                className="flex items-center gap-3 p-4 rounded-lg border-2 border-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                                aria-label={t('dashboard.viewPlanning')}
                            >
                                <i className="fas fa-calendar-alt text-xl" aria-hidden="true"></i>
                                <span className="font-semibold">{t('nav.planning')}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Today's Tours - Only for workers */}
            {!isCompanyUser && todayTours.length > 0 && (
                <div className="card-3d">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-primary">{t('dashboard.todayToursTitle')}</h3>
                        <button
                            onClick={() => onNavigate?.('tours')}
                            className="text-sm text-[var(--primary)] font-semibold hover:underline"
                            aria-label={t('dashboard.viewAllTours')}
                        >
                            {t('dashboard.viewAll')}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {todayTours.slice(0, 2).map((tour) => (
                            <button
                                key={tour.id}
                                type="button"
                                className="w-full text-left p-3 rounded-lg border-2 border-[var(--tertiary)] hover:border-[var(--primary)] transition-all cursor-pointer"
                                onClick={() => onNavigate?.('tours')}
                                aria-label={`Tournée ${tour.name || 'sans nom'} - ${tour.optimizedOrder && Array.isArray(tour.optimizedOrder) ? (tour.optimizedOrder as string[]).length : 0} rendez-vous`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center" aria-hidden="true">
                                            <i className="fas fa-route text-purple-600" aria-hidden="true"></i>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-primary">
                                                {tour.name || t('dashboard.tour')}
                                            </p>
                                            <p className="text-xs text-secondary">
                                                {tour.optimizedOrder && Array.isArray(tour.optimizedOrder) 
                                                    ? (tour.optimizedOrder as string[]).length 
                                                    : 0} {t('dashboard.appointmentPlural')}
                                            </p>
                                        </div>
                                    </div>
                                    <i className="fas fa-chevron-right text-[var(--text-light)]" aria-hidden="true"></i>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}

