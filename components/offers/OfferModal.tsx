// /components/offers/OfferModal.tsx

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import { CompleteMissionModal } from './CompleteMissionModal'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Offer {
    id: string
    clientId: string
    workerId: string
    title: string
    description: string | null
    startDate: string
    endDate: string
    address: string
    city: string
    postalCode: string
    country: string
    serviceType: string | null
    compensation: string | null
    notes: string | null
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'in_progress' | 'completed_pending_validation' | 'needs_correction' | 'completed_validated'
    respondedAt: string | null
    createdAt: string
    updatedAt: string
}

interface OfferWithClient {
    offer: Offer
    client: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string | null
        phone: string | null
    }
}

interface OfferModalProps {
    offer: OfferWithClient
    onClose: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function OfferModal({ offer, onClose, onShowAlert }: OfferModalProps) {
    const { t } = useLanguage()
    const [processing, setProcessing] = useState(false)
    const [showCompleteModal, setShowCompleteModal] = useState(false)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date)
    }

    const handleAccept = async () => {
        try {
            setProcessing(true)
            const response = await apiClient.post(`/api/offers/${offer.offer.id}/accept`)

            if (response.ok) {
                onShowAlert?.(t('offers.acceptedSuccess'), 'success')
                onClose()
            } else {
                const errorData = await response.json()
                onShowAlert?.(errorData.error || t('offers.errorAccepting'), 'error')
            }
        } catch (error) {
            console.error('Error accepting offer:', error)
            onShowAlert?.(t('offers.errorAccepting'), 'error')
        } finally {
            setProcessing(false)
        }
    }

    const handleDecline = async () => {
        try {
            setProcessing(true)
            const response = await apiClient.post(`/api/offers/${offer.offer.id}/decline`)

            if (response.ok) {
                onShowAlert?.(t('offers.declinedSuccess'), 'success')
                onClose()
            } else {
                const errorData = await response.json()
                onShowAlert?.(errorData.error || t('offers.errorDeclining'), 'error')
            }
        } catch (error) {
            console.error('Error declining offer:', error)
            onShowAlert?.(t('offers.errorDeclining'), 'error')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto card-3d">
                <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 gap-2">
                        <h2 className="text-lg sm:text-2xl font-bold text-primary break-words flex-1">{offer.offer.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-secondary hover:text-primary transition-colors"
                            aria-label={t('common.close')}
                        >
                            <i className="fas fa-times text-xl" aria-hidden="true"></i>
                        </button>
                    </div>

                    {/* Client Information */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-primary mb-2">{t('offers.from')}</h3>
                        <p className="text-secondary">
                            {offer.client.firstName} {offer.client.lastName}
                        </p>
                        {offer.client.email && (
                            <p className="text-sm text-secondary">
                                <i className="fas fa-envelope mr-2" aria-hidden="true"></i>
                                {offer.client.email}
                            </p>
                        )}
                        {offer.client.phone && (
                            <p className="text-sm text-secondary">
                                <i className="fas fa-phone mr-2" aria-hidden="true"></i>
                                {offer.client.phone}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    {offer.offer.description && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('offers.description')}</h3>
                            <p className="text-secondary whitespace-pre-wrap">{offer.offer.description}</p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-primary mb-2">{t('offers.dates')}</h3>
                        <div className="space-y-1 text-secondary">
                            <p>
                                <i className="fas fa-calendar-check mr-2" aria-hidden="true"></i>
                                <strong>{t('offers.startDateFormatted', { date: formatDate(offer.offer.startDate) })}</strong>
                            </p>
                            <p>
                                <i className="fas fa-calendar-times mr-2" aria-hidden="true"></i>
                                <strong>{t('offers.endDateFormatted', { date: formatDate(offer.offer.endDate) })}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-primary mb-2">{t('offers.address')}</h3>
                        <p className="text-secondary">
                            <i className="fas fa-map-marker-alt mr-2" aria-hidden="true"></i>
                            {offer.offer.address}, {offer.offer.city} {offer.offer.postalCode}, {offer.offer.country}
                        </p>
                    </div>

                    {/* Service Type */}
                    {offer.offer.serviceType && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('offers.serviceType')}</h3>
                            <p className="text-secondary">{offer.offer.serviceType}</p>
                        </div>
                    )}

                    {/* Compensation */}
                    {offer.offer.compensation && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('offers.compensation')}</h3>
                            <p className="text-secondary text-lg font-semibold">
                                {offer.offer.compensation} €
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    {offer.offer.notes && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-primary mb-2">{t('offers.notes')}</h3>
                            <p className="text-secondary whitespace-pre-wrap">{offer.offer.notes}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {offer.offer.status === 'pending' && (
                        <div className="flex gap-3 mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <button
                                onClick={handleAccept}
                                disabled={processing}
                                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-check" aria-hidden="true"></i>
                                <span>{t('offers.accept')}</span>
                            </button>
                            <button
                                onClick={handleDecline}
                                disabled={processing}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-times" aria-hidden="true"></i>
                                <span>{t('offers.unavailable')}</span>
                            </button>
                        </div>
                    )}

                    {offer.offer.status === 'in_progress' && (
                        <div className="flex gap-3 mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <button
                                onClick={() => setShowCompleteModal(true)}
                                className="flex-1 px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-check-circle" aria-hidden="true"></i>
                                <span>{t('missions.completeMission')}</span>
                            </button>
                        </div>
                    )}

                    {offer.offer.status === 'completed_pending_validation' && (
                        <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                                <p className="text-center text-yellow-800 font-semibold">
                                    <i className="fas fa-clock mr-2" aria-hidden="true"></i>
                                    {t('missions.pendingValidation')}
                                </p>
                            </div>
                        </div>
                    )}

                    {offer.offer.status === 'needs_correction' && (
                        <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-center text-red-800 font-semibold mb-2">
                                    <i className="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i>
                                    {t('missions.needsCorrection')}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCompleteModal(true)}
                                className="w-full px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-edit" aria-hidden="true"></i>
                                <span>{t('missions.completeMission')}</span>
                            </button>
                        </div>
                    )}

                    {offer.offer.status === 'completed_validated' && (
                        <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                <p className="text-center text-green-800 font-semibold">
                                    <i className="fas fa-check-circle mr-2" aria-hidden="true"></i>
                                    {t('missions.validated')}
                                </p>
                            </div>
                        </div>
                    )}

                    {offer.offer.status !== 'pending' && offer.offer.status !== 'in_progress' && 
                     offer.offer.status !== 'completed_pending_validation' && 
                     offer.offer.status !== 'needs_correction' && 
                     offer.offer.status !== 'completed_validated' && (
                        <div className="mt-6 pt-4 border-t-2 border-[var(--primary)]">
                            <p className="text-center text-secondary">
                                {offer.offer.status === 'accepted' && t('offers.alreadyAccepted')}
                                {offer.offer.status === 'declined' && t('offers.alreadyDeclined')}
                                {offer.offer.status === 'expired' && t('offers.expired')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {showCompleteModal && (
                <CompleteMissionModal
                    offerId={offer.offer.id}
                    onClose={() => {
                        setShowCompleteModal(false)
                        onClose()
                    }}
                    onShowAlert={onShowAlert}
                />
            )}
        </div>
    )
}

