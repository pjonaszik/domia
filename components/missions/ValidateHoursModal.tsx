// /components/missions/ValidateHoursModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface HoursData {
    id: string
    offerId: string
    hoursWorked: string
    status: 'pending_validation' | 'needs_correction' | 'validated'
    rejectionNote: string | null
    validatedAt: string | null
    createdAt: string
    updatedAt: string
    worker: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string | null
    }
    sepaPayment: {
        iban: string | null
        bic: string | null
    } | null
}

interface ValidateHoursModalProps {
    mission: {
        title: string
        startDate: string | Date
        endDate: string | Date
        address: string
    }
    onClose: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function ValidateHoursModal({ mission, onClose, onShowAlert }: ValidateHoursModalProps) {
    const { t } = useLanguage()
    const [hours, setHours] = useState<HoursData[]>([])
    const [loading, setLoading] = useState(true)
    const [validating, setValidating] = useState<string | null>(null)
    const [rejecting, setRejecting] = useState<string | null>(null)
    const [rejectionNote, setRejectionNote] = useState('')
    const [selectedHoursId, setSelectedHoursId] = useState<string | null>(null)

    useEffect(() => {
        loadHours()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadHours = async () => {
        try {
            setLoading(true)
            const startDate = typeof mission.startDate === 'string' ? mission.startDate : mission.startDate.toISOString()
            const endDate = typeof mission.endDate === 'string' ? mission.endDate : mission.endDate.toISOString()
            
            const response = await apiClient.get(
                `/api/missions/hours?title=${encodeURIComponent(mission.title)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&address=${encodeURIComponent(mission.address)}`
            )

            if (response.ok) {
                const data = await response.json()
                setHours(data.hours || [])
            } else {
                onShowAlert?.(t('missions.errorLoading'), 'error')
            }
        } catch (error) {
            console.error('Error loading hours:', error)
            onShowAlert?.(t('missions.errorLoading'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleValidate = async (hoursId: string) => {
        try {
            setValidating(hoursId)
            const hoursData = hours.find(h => h.id === hoursId)
            if (!hoursData) return

            const response = await apiClient.post(`/api/missions/${hoursData.offerId}/validate-hours`, {
                hoursId,
                action: 'validate',
            })

            if (response.ok) {
                onShowAlert?.(t('missions.hoursValidated'), 'success')
                loadHours()
            } else {
                const errorData = await response.json()
                onShowAlert?.(errorData.error || t('missions.errorValidatingHours'), 'error')
            }
        } catch (error) {
            console.error('Error validating hours:', error)
            onShowAlert?.(t('missions.errorValidatingHours'), 'error')
        } finally {
            setValidating(null)
        }
    }

    const handleReject = async () => {
        if (!selectedHoursId || !rejectionNote.trim()) {
            onShowAlert?.(t('missions.rejectionNoteRequired'), 'error')
            return
        }

        try {
            setRejecting(selectedHoursId)
            const hoursData = hours.find(h => h.id === selectedHoursId)
            if (!hoursData) return

            const response = await apiClient.post(`/api/missions/${hoursData.offerId}/validate-hours`, {
                hoursId: selectedHoursId,
                action: 'reject',
                rejectionNote: rejectionNote.trim(),
            })

            if (response.ok) {
                onShowAlert?.(t('missions.hoursRejected'), 'success')
                setRejectionNote('')
                setSelectedHoursId(null)
                loadHours()
            } else {
                const errorData = await response.json()
                onShowAlert?.(errorData.error || t('missions.errorValidatingHours'), 'error')
            }
        } catch (error) {
            console.error('Error rejecting hours:', error)
            onShowAlert?.(t('missions.errorValidatingHours'), 'error')
        } finally {
            setRejecting(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_validation':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {t('missions.pendingValidation')}
                    </span>
                )
            case 'needs_correction':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {t('missions.needsCorrection')}
                    </span>
                )
            case 'validated':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {t('missions.validated')}
                    </span>
                )
            default:
                return null
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full card-3d p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)]"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto card-3d my-2 sm:my-4">
                <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-primary break-words flex-1">{t('missions.validateHours')}</h2>
                        <button
                            onClick={onClose}
                            className="text-secondary hover:text-primary transition-colors"
                            aria-label={t('common.close')}
                        >
                            <i className="fas fa-times text-xl" aria-hidden="true"></i>
                        </button>
                    </div>

                    {hours.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-secondary">{t('missions.noHoursSubmitted')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {hours.map((hour) => (
                                <div key={hour.id} className="border-2 border-[var(--primary)] rounded-lg p-4">
                                    {/* Consultant Info */}
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-primary mb-2">
                                            {t('missions.consultantName')}: {hour.worker.firstName} {hour.worker.lastName}
                                        </h3>
                                        {hour.worker.email && (
                                            <p className="text-sm text-secondary">
                                                <i className="fas fa-envelope mr-2" aria-hidden="true"></i>
                                                {hour.worker.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Hours Worked */}
                                    <div className="mb-4">
                                        <p className="text-sm text-secondary mb-1">{t('missions.hoursWorked')}</p>
                                        <p className="text-lg font-bold text-primary">{hour.hoursWorked} h</p>
                                    </div>

                                    {/* SEPA Info */}
                                    {hour.sepaPayment && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <h4 className="font-semibold text-primary mb-2">{t('missions.consultantSepa')}</h4>
                                            {hour.sepaPayment.iban && (
                                                <p className="text-sm text-secondary">
                                                    <strong>IBAN:</strong> {hour.sepaPayment.iban}
                                                </p>
                                            )}
                                            {hour.sepaPayment.bic && (
                                                <p className="text-sm text-secondary">
                                                    <strong>BIC:</strong> {hour.sepaPayment.bic}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="mb-4">
                                        {getStatusBadge(hour.status)}
                                    </div>

                                    {/* Rejection Note */}
                                    {hour.status === 'needs_correction' && hour.rejectionNote && (
                                        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                                            <p className="text-sm font-semibold text-red-800 mb-1">{t('missions.rejectionNote')}</p>
                                            <p className="text-sm text-red-700">{hour.rejectionNote}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {hour.status === 'pending_validation' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleValidate(hour.id)}
                                                disabled={validating === hour.id}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {validating === hour.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>{t('common.loading')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-check" aria-hidden="true"></i>
                                                        <span>{t('missions.validateHours')}</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setSelectedHoursId(hour.id)}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                            >
                                                <i className="fas fa-times" aria-hidden="true"></i>
                                                <span>{t('missions.rejectHours')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rejection Modal */}
                    {selectedHoursId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-2 sm:p-4">
                            <div className="bg-white rounded-lg max-w-md w-full card-3d p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-bold text-primary mb-4">{t('missions.rejectHours')}</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-primary mb-1">
                                        {t('missions.rejectionNote')} *
                                    </label>
                                    <textarea
                                        value={rejectionNote}
                                        onChange={(e) => setRejectionNote(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm sm:text-base"
                                        rows={4}
                                        placeholder={t('missions.rejectionNotePlaceholder')}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedHoursId(null)
                                            setRejectionNote('')
                                        }}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={rejecting === selectedHoursId || !rejectionNote.trim()}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                    >
                                        {rejecting === selectedHoursId ? t('common.loading') : t('missions.rejectHours')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

