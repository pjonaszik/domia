// /components/tours/TourOptimizer.tsx

'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import type { Appointment } from '@/lib/db/schema'

interface TourOptimizerProps {
    appointments: Appointment[]
    onOptimized: (optimizedOrder: string[]) => void
    onShowToast?: (message: string) => void
}

export function TourOptimizer({ appointments, onOptimized, onShowToast }: TourOptimizerProps) {
    const [loading, setLoading] = useState(false)
    const [optimizedRoute, setOptimizedRoute] = useState<{
        optimizedOrder: string[]
        totalDistance: number
        estimatedDuration: number
    } | null>(null)

    const handleOptimize = async () => {
        if (appointments.length < 2) {
            onShowToast?.('Au moins 2 rendez-vous sont nécessaires pour optimiser')
            return
        }

        try {
            setLoading(true)
            const appointmentIds = appointments.map(apt => apt.id)

            const response = await apiClient.post('/api/tours/optimize', {
                appointmentIds,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erreur lors de l\'optimisation')
            }

            const data = await response.json()
            setOptimizedRoute(data.optimizedRoute)
            onOptimized(data.optimizedRoute.optimizedOrder)
            onShowToast?.('Tournée optimisée avec succès')
        } catch (error) {
            console.error('Error optimizing tour:', error)
            onShowToast?.(error instanceof Error ? error.message : 'Erreur lors de l\'optimisation')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="card-3d">
            <h3 className="text-lg font-bold text-primary mb-4">Optimisation de tournée</h3>
            <p className="text-secondary text-sm mb-4">
                {appointments.length} rendez-vous sélectionné{appointments.length > 1 ? 's' : ''}
            </p>
            <button
                onClick={handleOptimize}
                disabled={loading || appointments.length < 2}
                className="btn-primary w-full"
            >
                {loading ? 'Optimisation...' : 'Optimiser la tournée'}
            </button>
            {optimizedRoute && (
                <div className="mt-4 p-4 bg-[var(--bg-card)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-secondary">Distance totale:</span>
                        <span className="font-semibold text-primary">
                            {optimizedRoute.totalDistance.toFixed(1)} km
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary">Durée estimée:</span>
                        <span className="font-semibold text-primary">
                            {optimizedRoute.estimatedDuration} min
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

