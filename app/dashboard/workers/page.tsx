// /app/dashboard/workers/page.tsx - Workers search page

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import { CreateOfferForm } from '@/components/offers/CreateOfferForm'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Worker {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    profession: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
}

export default function WorkersPage() {
    const { t } = useLanguage()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)

    // Search form state
    const [profession, setProfession] = useState('')
    const [city, setCity] = useState('')
    const [postalCode, setPostalCode] = useState('')

    const handleSearch = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (profession) params.append('profession', profession)
            if (city) params.append('city', city)
            if (postalCode) params.append('postalCode', postalCode)

            const response = await apiClient.get(`/api/workers/search?${params.toString()}`)
            
            if (response.ok) {
                const data = await response.json()
                setWorkers(data.workers || [])
            }
        } catch (error) {
            console.error('Error searching workers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOffer = (worker: Worker) => {
        setSelectedWorker(worker)
        setShowCreateForm(true)
    }

    const handleCloseForm = () => {
        setShowCreateForm(false)
        setSelectedWorker(null)
    }

    const getProfessionLabel = (prof: string | null) => {
        if (!prof) return prof
        return t(`auth.profession${prof.charAt(0).toUpperCase() + prof.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())}`)
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">{t('offers.searchWorkers')}</h2>

            {/* Search Form */}
            <div className="card-3d space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        {t('auth.profession')}
                    </label>
                    <select
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        <option value="">{t('offers.allProfessions')}</option>
                        <option value="infirmiere">{t('auth.professionInfirmiere')}</option>
                        <option value="aide_soignante">{t('auth.professionAideSoignante')}</option>
                        <option value="agent_entretien">{t('auth.professionAgentEntretien')}</option>
                        <option value="aide_domicile">{t('auth.professionAideDomicile')}</option>
                        <option value="garde_enfants">{t('auth.professionGardeEnfants')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        {t('offers.city')}
                    </label>
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('offers.cityPlaceholder')}
                        className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        {t('offers.postalCode')}
                    </label>
                    <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={t('offers.postalCodePlaceholder')}
                        className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>{t('common.loading')}</span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-search" aria-hidden="true"></i>
                            <span>{t('common.search')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {workers.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-semibold text-primary">
                        {t('offers.resultsCount', { count: workers.length.toString() })}
                    </h3>
                    {workers.map((worker) => (
                        <div key={worker.id} className="card-3d">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h4 className="font-bold text-primary text-lg">
                                        {worker.firstName} {worker.lastName}
                                    </h4>
                                    {worker.profession && (
                                        <p className="text-sm text-secondary">
                                            {getProfessionLabel(worker.profession)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-secondary mb-3">
                                {worker.email && (
                                    <p>
                                        <i className="fas fa-envelope mr-2" aria-hidden="true"></i>
                                        {worker.email}
                                    </p>
                                )}
                                {worker.phone && (
                                    <p>
                                        <i className="fas fa-phone mr-2" aria-hidden="true"></i>
                                        {worker.phone}
                                    </p>
                                )}
                                {worker.city && (
                                    <p>
                                        <i className="fas fa-map-marker-alt mr-2" aria-hidden="true"></i>
                                        {worker.city} {worker.postalCode}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleCreateOffer(worker)}
                                className="w-full px-4 py-2 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-paper-plane" aria-hidden="true"></i>
                                <span>{t('offers.sendOffer')}</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!loading && workers.length === 0 && (
                <div className="card-3d text-center py-8">
                    <i className="fas fa-users text-4xl text-secondary mb-4" aria-hidden="true"></i>
                    <p className="text-secondary">{t('offers.noWorkersFound')}</p>
                </div>
            )}

            {/* Create Offer Form Modal */}
            {showCreateForm && selectedWorker && (
                <CreateOfferForm
                    worker={selectedWorker}
                    onClose={handleCloseForm}
                />
            )}
        </div>
    )
}

