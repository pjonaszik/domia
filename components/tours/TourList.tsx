// /components/tours/TourList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { TourCard } from './TourCard'
import type { Tour } from '@/lib/db/schema'

interface TourListProps {
    onSelectTour?: (tour: Tour) => void
    onShowToast?: (message: string) => void
}

export function TourList({ onSelectTour, onShowToast }: TourListProps) {
    const [tours, setTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTours()
    }, [])

    const loadTours = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/_/api/tours')
            if (!response.ok) throw new Error('Failed to load tours')
            const data = await response.json()
            setTours(data.tours || [])
        } catch (error) {
            console.error('Error loading tours:', error)
            onShowToast?.('Erreur lors du chargement des tournées')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="card-3d">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                    <p className="text-secondary">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {tours.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">Aucune tournée pour le moment</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tours.map((tour) => (
                        <TourCard
                            key={tour.id}
                            tour={tour}
                            onClick={() => onSelectTour?.(tour)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

