// /components/tours/TourOptimizer.tsx

'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Appointment } from '@/lib/db/schema'

interface TourOptimizerProps {
    appointments: Appointment[]
    onOptimized: (optimizedOrder: string[]) => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function TourOptimizer({ appointments, onOptimized, onShowAlert }: TourOptimizerProps) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [optimizedRoute, setOptimizedRoute] = useState<{
        optimizedOrder: string[]
        totalDistance: number
        estimatedDuration: number
    } | null>(null)

    const handleOptimize = async () => {
        if (appointments.length < 2) {
            onShowAlert?.(t('tours.minAppointments'))
            return
        }

        try {
            setLoading(true)
            const appointmentIds = appointments.map(apt => apt.id)

            const response = await apiClient.post('/dashboard/api/tours/optimize', {
                appointmentIds,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || t('tours.errorOptimizing'))
            }

            const data = await response.json()
            setOptimizedRoute(data.optimizedRoute)
            onOptimized(data.optimizedRoute.optimizedOrder)
            onShowAlert?.(t('tours.optimizedSuccess'))
        } catch (error) {
            console.error('Error optimizing tour:', error)
            onShowAlert?.(error instanceof Error ? error.message : t('tours.errorOptimizing'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="card-3d">
            <h3 className="text-lg font-bold text-primary mb-4">{t('tours.optimization')}</h3>
            <p className="text-secondary text-sm mb-4">
                {appointments.length === 1 
                    ? t('tours.selectedAppointments', { count: '1' })
                    : t('tours.selectedAppointmentsPlural', { count: String(appointments.length) })}
            </p>
            <button
                onClick={handleOptimize}
                disabled={loading || appointments.length < 2}
                className="btn-primary w-full"
            >
                {loading ? t('tours.optimizing') : t('tours.optimizeTour')}
            </button>
            {optimizedRoute && (
                <div className="mt-4 p-4 bg-[var(--bg-card)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-secondary">{t('tours.totalDistance')}:</span>
                        <span className="font-semibold text-primary">
                            {optimizedRoute.totalDistance.toFixed(1)} km
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary">{t('tours.estimatedDuration')}:</span>
                        <span className="font-semibold text-primary">
                            {optimizedRoute.estimatedDuration} {t('appointments.minutes')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

