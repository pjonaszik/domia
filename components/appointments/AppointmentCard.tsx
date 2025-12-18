// /components/appointments/AppointmentCard.tsx

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { Appointment } from '@/lib/db/schema'
import { formatDateTime } from '@/lib/utils/date-helpers'

interface AppointmentCardProps {
    appointment: Appointment
    onClick?: () => void
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
    const { t } = useLanguage()
    const statusColors: Record<string, string> = {
        scheduled: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        no_show: 'bg-gray-100 text-gray-800',
    }

    // Convertir la durée de minutes en heures
    const durationHours = (appointment.duration / 60).toFixed(1)

    return (
        <div
            className={`card-3d ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar-alt text-[var(--primary)]"></i>
                        <p className="font-bold text-primary">
                            {formatDateTime(appointment.startTime)}
                        </p>
                    </div>
                    {appointment.serviceName && (
                        <p className="text-secondary mb-1">
                            <i className="fas fa-briefcase mr-2"></i>
                            {appointment.serviceName}
                        </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-secondary">
                        <span>
                            <i className="fas fa-clock mr-1"></i>
                            {durationHours} {t('appointments.hours')}
                        </span>
                        {appointment.price && (
                            <span>
                                <i className="fas fa-euro-sign mr-1"></i>
                                {parseFloat(appointment.price).toFixed(2)} €
                            </span>
                        )}
                    </div>
                    {appointment.notes && (
                        <p className="text-sm text-secondary mt-2 italic">{appointment.notes}</p>
                    )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[appointment.status] || 'bg-gray-100 text-gray-800'
                }`}>
                    {t(`appointments.statusLabels.${appointment.status}`) || appointment.status}
                </div>
            </div>
        </div>
    )
}

