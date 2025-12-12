// /components/appointments/CalendarView.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppointmentCard } from './AppointmentCard'
import { formatDate, getDayRange, addDaysToDate, isSameDate } from '@/lib/utils/date-helpers'
import type { Appointment } from '@/lib/db/schema'

interface CalendarViewProps {
    onSelectAppointment?: (appointment: Appointment) => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function CalendarView({ onSelectAppointment, onShowAlert }: CalendarViewProps) {
    const { t } = useLanguage()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    useEffect(() => {
        loadAppointments()
    }, [currentDate])

    const loadAppointments = async () => {
        try {
            setLoading(true)
            const { start, end } = getDayRange(currentDate)
            const response = await apiClient.get(
                `/api/appointments?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
            )
            if (!response.ok) throw new Error('Failed to load appointments')
            const data = await response.json()
            setAppointments(data.appointments || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
            onShowAlert?.(t('appointments.errorLoading'))
        } finally {
            setLoading(false)
        }
    }

    const goToPreviousDay = () => {
        setCurrentDate(addDaysToDate(currentDate, -1))
    }

    const goToNextDay = () => {
        setCurrentDate(addDaysToDate(currentDate, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDate(null)
    }

    const dayAppointments = selectedDate
        ? appointments.filter(apt => isSameDate(apt.startTime, selectedDate))
        : appointments.filter(apt => isSameDate(apt.startTime, currentDate))

    const sortedAppointments = [...dayAppointments].sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={goToPreviousDay}
                        className="px-4 py-2 border-2 border-[var(--primary)] rounded-lg text-[var(--primary)] font-semibold"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-primary">
                            {formatDate(currentDate, 'EEEE d MMMM yyyy', true)}
                        </h2>
                        <button
                            onClick={goToToday}
                            className="text-sm text-secondary mt-1"
                        >
                            {t('appointments.today')}
                        </button>
                    </div>
                    <button
                        onClick={goToNextDay}
                        className="px-4 py-2 border-2 border-[var(--primary)] rounded-lg text-[var(--primary)] font-semibold"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                        <p className="text-secondary">{t('common.loading')}</p>
                    </div>
                ) : sortedAppointments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-secondary">{t('appointments.noAppointments')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedAppointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                onClick={() => onSelectAppointment?.(appointment)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

