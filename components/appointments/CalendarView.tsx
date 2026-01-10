// /components/appointments/CalendarView.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppointmentCard } from './AppointmentCard'
import { formatDate, getDayRange, addDaysToDate } from '@/lib/utils/date-helpers'
import { MissionList } from '@/components/missions/MissionList'
import { MissionModal } from '@/components/missions/MissionModal'
import { isCompany } from '@/lib/utils/user-type'
import type { Appointment } from '@/lib/db/schema'
import type { User } from '@/lib/db/schema'
import { distanceKm } from '@/lib/utils/distance'

interface CalendarViewProps {
    user?: User | null
    onSelectAppointment?: (appointment: Appointment) => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function CalendarView({ user, onSelectAppointment, onShowAlert }: CalendarViewProps) {
    const { t } = useLanguage()
    const isCompanyUser = isCompany(user)
    const [currentDate, setCurrentDate] = useState(new Date())
    type AppointmentWithCoords = Appointment & {
        clientLatitude?: string | null
        clientLongitude?: string | null
    }
    const [appointments, setAppointments] = useState<AppointmentWithCoords[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [selectedMission, setSelectedMission] = useState<any>(null)
    const [loadingMission, setLoadingMission] = useState(false)

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

    // Filtrer les appointments qui chevauchent la date sélectionnée
    // Pour les missions multi-jours, on affiche celles qui chevauchent la date
    const dayAppointments = appointments.filter(apt => {
        const aptStart = new Date(apt.startTime)
        const aptEnd = new Date(apt.endTime)
        const targetDate = selectedDate || currentDate
        const targetStart = new Date(targetDate)
        targetStart.setHours(0, 0, 0, 0)
        const targetEnd = new Date(targetDate)
        targetEnd.setHours(23, 59, 59, 999)
        
        // Vérifier si l'appointment chevauche la date cible
        return aptStart <= targetEnd && aptEnd >= targetStart
    })

    const sortedAppointments = [...dayAppointments].sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })

    const handleMissionCreated = () => {
        // Trigger refresh of MissionList
        setRefreshKey(prev => prev + 1)
    }

    const handleAppointmentClick = async (appointment: Appointment) => {
        try {
            setLoadingMission(true)
            // Essayer de récupérer la mission associée à cet appointment
            const response = await apiClient.get(`/api/appointments/${appointment.id}/mission`)
            if (response.ok) {
                const data = await response.json()
                // Adapter les données pour correspondre à l'interface Mission
                const mission = {
                    ...data.mission,
                    startDate: new Date(data.mission.startDate),
                    endDate: new Date(data.mission.endDate),
                    createdAt: new Date(data.mission.createdAt || new Date()),
                    totalOffers: 1,
                    pendingCount: data.mission.status === 'pending' ? 1 : 0,
                    acceptedCount: data.mission.status === 'accepted' || data.mission.status === 'in_progress' ? 1 : 0,
                    declinedCount: data.mission.status === 'declined' ? 1 : 0,
                    consultantsNotified: 1,
                }
                setSelectedMission(mission)
            } else {
                // Si pas de mission trouvée, utiliser le callback par défaut
                onSelectAppointment?.(appointment)
            }
        } catch (error) {
            console.error('Error loading mission:', error)
            // En cas d'erreur, utiliser le callback par défaut
            onSelectAppointment?.(appointment)
        } finally {
            setLoadingMission(false)
        }
    }

    const handleCloseMissionModal = () => {
        setSelectedMission(null)
        loadAppointments() // Rafraîchir les appointments
    }

    // For companies, show mission list instead of calendar
    if (isCompanyUser) {
        return (
            <div className="space-y-4">
                <MissionList key={refreshKey} onShowAlert={onShowAlert} user={user} />
            </div>
        )
    }

    // For workers, show calendar view
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {sortedAppointments.map((appointment) => {
                            const workerLat = parseFloat(String((user as any)?.latitude ?? ''))
                            const workerLon = parseFloat(String((user as any)?.longitude ?? ''))
                            const clientLat = parseFloat(String((appointment as any)?.clientLatitude ?? ''))
                            const clientLon = parseFloat(String((appointment as any)?.clientLongitude ?? ''))

                            const hasCoords =
                                Number.isFinite(workerLat) &&
                                Number.isFinite(workerLon) &&
                                Number.isFinite(clientLat) &&
                                Number.isFinite(clientLon)

                            const km = hasCoords ? distanceKm(workerLat, workerLon, clientLat, clientLon) : null

                            return (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    distanceKm={km}
                                    onClick={() => handleAppointmentClick(appointment)}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Mission Modal */}
            {selectedMission && (
                <MissionModal
                    mission={selectedMission}
                    onClose={handleCloseMissionModal}
                    onShowAlert={onShowAlert}
                    user={user}
                />
            )}
        </div>
    )
}

