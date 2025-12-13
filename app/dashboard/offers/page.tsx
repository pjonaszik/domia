// /app/dashboard/offers/page.tsx - Offers list page

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import { OfferModal } from '@/components/offers/OfferModal'
import { FilterTabs, FilterType } from '@/components/common/FilterTabs'
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
    status: 'pending' | 'accepted' | 'declined' | 'expired'
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

interface OffersPageProps {
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export default function OffersPage({ onShowAlert }: OffersPageProps) {
    const { user } = useAuth()
    const { t } = useLanguage()
    const [offers, setOffers] = useState<OfferWithClient[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOffer, setSelectedOffer] = useState<OfferWithClient | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')

    useEffect(() => {
        loadOffers()
    }, [filter])

    const loadOffers = async () => {
        try {
            setLoading(true)
            const statusParam = filter !== 'all' ? `?status=${filter}` : ''
            const response = await apiClient.get(`/api/offers${statusParam}`)
            
            if (response.ok) {
                const data = await response.json()
                setOffers(data.offers || [])
            } else {
                onShowAlert?.(t('offers.errorLoading'), 'error')
            }
        } catch (error) {
            console.error('Error loading offers:', error)
            onShowAlert?.(t('offers.errorLoading'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleOfferClick = (offer: OfferWithClient) => {
        setSelectedOffer(offer)
    }

    const handleCloseModal = () => {
        setSelectedOffer(null)
        loadOffers() // Rafraîchir la liste après action
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date)
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'declined':
                return 'bg-red-100 text-red-800 border-red-300'
            case 'expired':
                return 'bg-gray-100 text-gray-800 border-gray-300'
            case 'in_progress':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'completed_pending_validation':
                return 'bg-orange-100 text-orange-800 border-orange-300'
            case 'needs_correction':
                return 'bg-red-100 text-red-800 border-red-300'
            case 'completed_validated':
                return 'bg-green-100 text-green-800 border-green-300'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return t('offers.pending')
            case 'accepted':
                return t('offers.accepted')
            case 'declined':
                return t('offers.declined')
            case 'expired':
                return t('offers.expired')
            case 'in_progress':
                return t('missions.inProgress')
            case 'completed_pending_validation':
                return t('missions.pendingValidation')
            case 'needs_correction':
                return t('missions.needsCorrection')
            case 'completed_validated':
                return t('missions.validated')
            default:
                return status
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)]"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">{t('offers.title')}</h2>

            {/* Filters */}
            <div className="w-full max-w-full overflow-x-hidden overflow-y-visible">
                <FilterTabs
                type="offers"
                filters={[
                    { value: 'all', labelKey: 'all', section: 'offers' },
                    { value: 'pending', labelKey: 'pending', section: 'offers' },
                    { value: 'accepted', labelKey: 'accepted', section: 'offers' },
                    { value: 'declined', labelKey: 'declined', section: 'offers' },
                    { value: 'in_progress', labelKey: 'inProgress', section: 'missions' },
                    { value: 'completed_pending_validation', labelKey: 'pendingValidation', section: 'missions' },
                    { value: 'needs_correction', labelKey: 'needsCorrection', section: 'missions' },
                    { value: 'completed_validated', labelKey: 'validated', section: 'missions' },
                ]}
                currentFilter={filter}
                onFilterChange={setFilter}
            />
            </div>

            {/* Offers List */}
            {offers.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <i className="fas fa-inbox text-4xl text-secondary mb-4" aria-hidden="true"></i>
                    <p className="text-secondary">{t('offers.noOffers')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {offers.map((item) => (
                        <div
                            key={item.offer.id}
                            onClick={() => handleOfferClick(item)}
                            className="card-3d cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className="font-bold text-primary text-lg mb-1">
                                        {item.offer.title}
                                    </h3>
                                    <p className="text-sm text-secondary">
                                        {t('offers.fromClient', { name: `${item.client.firstName} ${item.client.lastName}` })}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusBadgeClass(item.offer.status)}`}
                                >
                                    {getStatusText(item.offer.status)}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm text-secondary">
                                <p>
                                    <i className="fas fa-calendar-alt mr-2" aria-hidden="true"></i>
                                    {formatDate(item.offer.startDate)} - {formatDate(item.offer.endDate)}
                                </p>
                                <p>
                                    <i className="fas fa-map-marker-alt mr-2" aria-hidden="true"></i>
                                    {item.offer.address}, {item.offer.city} {item.offer.postalCode}
                                </p>
                                {item.offer.compensation && (
                                    <p>
                                        <i className="fas fa-euro-sign mr-2" aria-hidden="true"></i>
                                        {item.offer.compensation} €
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-secondary mt-2">
                                {t('offers.receivedOn', { date: formatDate(item.offer.createdAt) })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Offer Modal */}
            {selectedOffer && (
                <OfferModal
                    offer={selectedOffer}
                    onClose={handleCloseModal}
                    onShowAlert={onShowAlert}
                />
            )}
        </div>
    )
}

