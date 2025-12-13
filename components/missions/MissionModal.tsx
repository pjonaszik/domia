// /components/missions/MissionModal.tsx

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ValidateHoursModal } from './ValidateHoursModal'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Mission {
    title: string
    description: string | null
    startDate: string | Date
    endDate: string | Date
    address: string
    city: string
    postalCode: string
    country: string | null
    serviceType: string | null
    compensation: string | null
    notes: string | null
    createdAt: string | Date
    totalOffers: number
    pendingCount: number
    acceptedCount: number
    declinedCount: number
    consultantsNotified: number
}

interface MissionModalProps {
    mission: Mission
    onClose: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function MissionModal({ mission, onClose, onShowAlert }: MissionModalProps) {
    const { t } = useLanguage()
    const [showValidateHours, setShowValidateHours] = useState(false)

    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        if (isNaN(dateObj.getTime())) {
            return 'Date invalide'
        }
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto card-3d">
                <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 gap-2">
                        <h2 className="text-lg sm:text-2xl font-bold text-primary break-words flex-1">{mission.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-secondary hover:text-primary transition-colors"
                            aria-label={t('common.close')}
                        >
                            <i className="fas fa-times text-xl" aria-hidden="true"></i>
                        </button>
                    </div>

                    {/* Statistics */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-primary mb-3">{t('missions.statistics')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm text-secondary">{t('missions.consultantsNotifiedPlural', { count: mission.consultantsNotified.toString() })}</p>
                                <p className="text-lg font-bold text-primary">{mission.consultantsNotified}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">{t('missions.pending')}</p>
                                <p className="text-lg font-bold text-yellow-600">{mission.pendingCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">{t('missions.accepted')}</p>
                                <p className="text-lg font-bold text-green-600">{mission.acceptedCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">{t('missions.declined')}</p>
                                <p className="text-lg font-bold text-red-600">{mission.declinedCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {mission.description && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('missions.description')}</h3>
                            <p className="text-secondary whitespace-pre-wrap">{mission.description}</p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-primary mb-2">{t('missions.dates')}</h3>
                        <div className="space-y-1 text-secondary">
                            <p>
                                <i className="fas fa-calendar-check mr-2" aria-hidden="true"></i>
                                <strong>{t('missions.startDateFormatted', { date: formatDate(mission.startDate) })}</strong>
                            </p>
                            <p>
                                <i className="fas fa-calendar-times mr-2" aria-hidden="true"></i>
                                <strong>{t('missions.endDateFormatted', { date: formatDate(mission.endDate) })}</strong>
                            </p>
                            {(() => {
                                const start = typeof mission.startDate === 'string' ? new Date(mission.startDate) : mission.startDate
                                const end = typeof mission.endDate === 'string' ? new Date(mission.endDate) : mission.endDate
                                const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                                return (
                                    <p>
                                        <i className="fas fa-calendar-alt mr-2" aria-hidden="true"></i>
                                        <strong>{daysDiff === 1 ? t('missions.numberOfDays', { count: daysDiff.toString() }) : t('missions.numberOfDaysPlural', { count: daysDiff.toString() })}</strong>
                                    </p>
                                )
                            })()}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-primary mb-2">{t('missions.address')}</h3>
                        <p className="text-secondary">
                            <i className="fas fa-map-marker-alt mr-2" aria-hidden="true"></i>
                            {mission.address}, {mission.city} {mission.postalCode}{mission.country ? `, ${mission.country}` : ''}
                        </p>
                    </div>

                    {/* Service Type */}
                    {mission.serviceType && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('missions.serviceType')}</h3>
                            <p className="text-secondary">{mission.serviceType}</p>
                        </div>
                    )}

                    {/* Compensation */}
                    {mission.compensation && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('missions.compensation')}</h3>
                            <p className="text-secondary text-lg font-semibold">
                                {mission.compensation} €
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    {mission.notes && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('missions.notes')}</h3>
                            <p className="text-secondary whitespace-pre-wrap">{mission.notes}</p>
                        </div>
                    )}

                    {/* Validate Hours Button */}
                    {(mission.pendingCount > 0 || mission.acceptedCount > 0) && (
                        <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <button
                                onClick={() => setShowValidateHours(true)}
                                className="w-full px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-check-circle" aria-hidden="true"></i>
                                <span>{t('missions.validateHours')}</span>
                            </button>
                        </div>
                    )}

                    {/* Created Date */}
                    <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                        <p className="text-center text-secondary text-sm">
                            {t('missions.createdOn', { date: formatDate(mission.createdAt) })}
                        </p>
                    </div>
                </div>
            </div>
            {showValidateHours && (
                <ValidateHoursModal
                    mission={{
                        title: mission.title,
                        startDate: mission.startDate,
                        endDate: mission.endDate,
                        address: mission.address,
                    }}
                    onClose={() => {
                        setShowValidateHours(false)
                        onClose()
                    }}
                    onShowAlert={onShowAlert}
                />
            )}
        </div>
    )
}

