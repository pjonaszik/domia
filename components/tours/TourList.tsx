// /components/tours/TourList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { TourCard } from './TourCard'
import type { Tour } from '@/lib/db/schema'

interface TourListProps {
    onSelectTour?: (tour: Tour) => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function TourList({ onSelectTour, onShowAlert }: TourListProps) {
    const { t } = useLanguage()
    const [tours, setTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTours()
    }, [])

    const loadTours = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/tours')
            if (!response.ok) throw new Error('Failed to load tours')
            const data = await response.json()
            setTours(data.tours || [])
        } catch (error) {
            console.error('Error loading tours:', error)
            onShowAlert?.(t('tours.errorLoading'))
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

    return (
        <div className="space-y-4 pb-6">
            {tours.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">{t('tours.noToursYet')}</p>
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

