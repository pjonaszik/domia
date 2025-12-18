// /components/dashboard/DashboardStats.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { isCompany } from '@/lib/utils/user-type'

interface Stats {
    clients: { total: number }
    appointments: { total: number; completed: number; cancelled: number; completionRate: number }
    revenue: { total: number; pending: number }
}

export function DashboardStats() {
    const { t } = useLanguage()
    const { user } = useAuth()
    const isCompanyUser = isCompany(user)
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/stats')
            if (!response.ok) throw new Error('Failed to load stats')
            const data = await response.json()
            setStats(data.stats)
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="card-3d">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                    <p className="text-secondary">{t('common.loading')}</p>
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="card-3d">
                    <p className="text-secondary">{t('dashboard.noStats')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <h2 className="text-xl font-bold text-primary mb-4">{t('dashboard.statistics')}</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="stat-card">
                        <p className="text-sm text-secondary mb-1">
                            {isCompanyUser ? t('dashboard.consultants') : t('dashboard.clients')}
                        </p>
                        <p className="text-2xl font-bold text-primary">{stats.clients.total}</p>
                    </div>
                    <div className="stat-card">
                        <p className="text-sm text-secondary mb-1">{t('dashboard.appointments')}</p>
                        <p className="text-2xl font-bold text-primary">{stats.appointments.total}</p>
                    </div>
                </div>

                <div className="stat-card mb-4">
                    <p className="text-sm text-secondary mb-1">{t('dashboard.completionRate')}</p>
                    <p className="text-2xl font-bold text-primary">
                        {stats.appointments.completionRate.toFixed(1)}%
                    </p>
                </div>

                <div className="border-t-2 border-[var(--primary)] pt-4">
                    <h3 className="font-semibold text-primary mb-3">{t('dashboard.revenue')}</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-secondary">{t('dashboard.totalPaid')}:</span>
                            <span className="font-semibold text-primary">
                                {stats.revenue.total.toFixed(2)} €
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">{t('dashboard.pending')}:</span>
                            <span className="font-semibold text-orange-600">
                                {stats.revenue.pending.toFixed(2)} €
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

