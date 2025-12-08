// /components/tours/TourCard.tsx

'use client'

import type { Tour } from '@/lib/db/schema'
import { formatDate } from '@/lib/utils/date-helpers'

interface TourCardProps {
    tour: Tour
    onClick?: () => void
}

export function TourCard({ tour, onClick }: TourCardProps) {
    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-800',
        scheduled: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
    }

    const statusLabels: Record<string, string> = {
        draft: 'Brouillon',
        scheduled: 'Planifiée',
        in_progress: 'En cours',
        completed: 'Terminée',
    }

    return (
        <div
            className={`card-3d ${onClick ? 'cursor-pointer transition-all hover:scale-[1.02]' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary mb-2">
                        {tour.name || formatDate(tour.date, 'EEEE d MMMM yyyy', true)}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar text-[var(--primary)]"></i>
                        <p className="text-secondary">{formatDate(tour.date)}</p>
                    </div>
                    {tour.totalDistance && (
                        <p className="text-sm text-secondary mb-1">
                            <i className="fas fa-route mr-2"></i>
                            {parseFloat(tour.totalDistance).toFixed(1)} km
                        </p>
                    )}
                    {tour.estimatedDuration && (
                        <p className="text-sm text-secondary">
                            <i className="fas fa-clock mr-2"></i>
                            {tour.estimatedDuration} min
                        </p>
                    )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[tour.status] || 'bg-gray-100 text-gray-800'
                }`}>
                    {statusLabels[tour.status] || tour.status}
                </div>
            </div>
        </div>
    )
}

