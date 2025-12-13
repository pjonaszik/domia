// /components/offers/CompleteMissionModal.tsx

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface CompleteMissionModalProps {
    offerId: string
    onClose: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function CompleteMissionModal({ offerId, onClose, onShowAlert }: CompleteMissionModalProps) {
    const { t } = useLanguage()
    const [hoursWorked, setHoursWorked] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!hoursWorked || isNaN(parseFloat(hoursWorked)) || parseFloat(hoursWorked) <= 0) {
            onShowAlert?.(t('missions.hoursWorkedRequired'), 'error')
            return
        }

        try {
            setSubmitting(true)
            const response = await apiClient.post(`/api/offers/${offerId}/complete`, {
                hoursWorked: parseFloat(hoursWorked),
            })

            if (response.ok) {
                onShowAlert?.(t('missions.hoursSubmitted'), 'success')
                onClose()
            } else {
                const errorData = await response.json()
                onShowAlert?.(errorData.error || t('missions.errorSubmittingHours'), 'error')
            }
        } catch (error) {
            console.error('Error completing mission:', error)
            onShowAlert?.(t('missions.errorSubmittingHours'), 'error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-md w-full card-3d">
                <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-primary break-words flex-1">{t('missions.completeMission')}</h2>
                        <button
                            onClick={onClose}
                            className="text-secondary hover:text-primary transition-colors"
                            aria-label={t('common.close')}
                        >
                            <i className="fas fa-times text-xl" aria-hidden="true"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="hours-worked" className="block text-sm font-semibold text-primary mb-1">
                                {t('missions.hoursWorked')} *
                            </label>
                            <input
                                id="hours-worked"
                                type="number"
                                step="0.5"
                                min="0.5"
                                required
                                value={hoursWorked}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                        setHoursWorked(value)
                                    }
                                }}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder={t('missions.hoursWorkedPlaceholder')}
                            />
                            <p className="text-xs text-secondary mt-1">
                                {t('missions.hoursWorkedHint')}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>{t('common.loading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check" aria-hidden="true"></i>
                                        <span>{t('missions.submitHours')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

