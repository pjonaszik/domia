// /components/consultants/ConsultantSearch.tsx

'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { PoolModal } from './PoolModal'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Consultant {
    id: string
    businessName: string
    email: string
    phone: string | null
    profession: string | null
    adeliNumber: string | null
    agrementNumber: string | null
    city: string | null
    postalCode: string | null
    hourlyRate: string | null
    isInPool: boolean
}

interface ConsultantSearchProps {
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function ConsultantSearch({ onShowAlert }: ConsultantSearchProps) {
    const { t } = useLanguage()
    const [searchTerm, setSearchTerm] = useState('')
    const [consultants, setConsultants] = useState<Consultant[]>([])
    const [loading, setLoading] = useState(false)
    const [showPoolModal, setShowPoolModal] = useState(false)
    const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
    const [hasSearched, setHasSearched] = useState(false)

    const searchConsultants = async (query: string) => {
        if (query.trim().length < 2) {
            onShowAlert?.(t('consultants.searchHint'), 'info')
            return
        }

        try {
            setLoading(true)
            setHasSearched(true)
            const url = `/api/workers/search?q=${encodeURIComponent(query)}`
            
            const response = await apiClient.get(url)
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to search consultants' }))
                throw new Error(errorData.error || 'Failed to search consultants')
            }
            
            const data = await response.json()
            setConsultants(data.workers || [])
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('consultants.errorSearching')
            onShowAlert?.(errorMsg, 'error')
            setConsultants([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        if (!searchTerm || searchTerm.trim().length < 2) {
            onShowAlert?.(t('consultants.searchHint'), 'info')
            return
        }
        searchConsultants(searchTerm)
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleAddToPool = (consultant: Consultant) => {
        setSelectedConsultant(consultant)
        setShowPoolModal(true)
    }

    const handleConsultantAdded = () => {
        // Refresh search results to update isInPool status
        if (hasSearched && searchTerm.trim().length >= 2) {
            searchConsultants(searchTerm)
        }
        setShowPoolModal(false)
        setSelectedConsultant(null)
        onShowAlert?.(t('consultants.addedToPool'), 'success')
    }

    const getQualificationTags = (consultant: Consultant) => {
        const tags: Array<{ label: string; color: string }> = []
        
        if (consultant.profession) {
            tags.push({ label: consultant.profession, color: 'bg-blue-100 text-blue-800' })
        }
        if (consultant.adeliNumber) {
            tags.push({ label: 'ADELI', color: 'bg-green-100 text-green-800' })
        }
        if (consultant.agrementNumber) {
            tags.push({ label: 'Agrément', color: 'bg-purple-100 text-purple-800' })
        }
        
        return tags
    }


    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="card-3d">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={t('consultants.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                        aria-label={t('common.search')}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <i className="fas fa-search" aria-hidden="true"></i>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Results */}
            {loading && (
                <div className="card-3d text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                    <p className="text-secondary">{t('common.loading')}</p>
                </div>
            )}

            {!loading && hasSearched && consultants.length === 0 && (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">{t('consultants.noResults')}</p>
                </div>
            )}

            {!loading && hasSearched && consultants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {consultants.map((consultant) => (
                        <div
                            key={consultant.id}
                            className="card-3d p-4 flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-primary">
                                        {consultant.businessName}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {getQualificationTags(consultant).map((tag, index) => (
                                        <span
                                            key={index}
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${tag.color}`}
                                        >
                                            {tag.label}
                                        </span>
                                    ))}
                                    {consultant.hourlyRate && (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                            {consultant.hourlyRate} €/h
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!consultant.isInPool && (
                                <button
                                    onClick={() => handleAddToPool(consultant)}
                                    className="ml-4 w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                    aria-label={t('consultants.addToPool')}
                                >
                                    <i className="fas fa-plus" aria-hidden="true"></i>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!loading && !hasSearched && (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">{t('consultants.searchHint')}</p>
                </div>
            )}

            {/* Pool Modal */}
            {showPoolModal && selectedConsultant && (
                <PoolModal
                    consultant={selectedConsultant}
                    onClose={() => {
                        setShowPoolModal(false)
                        setSelectedConsultant(null)
                    }}
                    onConsultantAdded={handleConsultantAdded}
                    onShowAlert={onShowAlert}
                />
            )}
        </div>
    )
}

