// /components/pools/PoolModal.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Pool {
    id: string
    name: string
    color: string | null
    description: string | null
    memberCount: number
}

interface Consultant {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    phone: string | null
    profession: string | null
    adeliNumber: string | null
    agrementNumber: string | null
    city: string | null
    postalCode: string | null
    hourlyRate: string | null
}

interface PoolModalProps {
    pool: Pool
    onClose: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function PoolModal({ pool, onClose, onShowAlert }: PoolModalProps) {
    const { t } = useLanguage()
    const [poolConsultants, setPoolConsultants] = useState<Consultant[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [removingConsultant, setRemovingConsultant] = useState<string | null>(null)

    useEffect(() => {
        loadPoolConsultants()
    }, [pool.id])

    const loadPoolConsultants = async () => {
        try {
            setLoading(true)
            // Get all consultants in this pool
            const response = await apiClient.get(`/api/pools/${pool.id}/consultants`)
            if (!response.ok) throw new Error('Failed to load pool consultants')
            const data = await response.json()
            setPoolConsultants(data.consultants || [])
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('pools.errorLoading')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setLoading(false)
        }
    }

    // Filter consultants dynamically based on search term
    const filteredConsultants = useMemo(() => {
        if (!searchTerm.trim()) {
            return poolConsultants
        }
        
        const searchLower = searchTerm.toLowerCase().trim()
        return poolConsultants.filter((consultant) => {
            const firstName = consultant.firstName?.toLowerCase() || ''
            const lastName = consultant.lastName?.toLowerCase() || ''
            const email = consultant.email?.toLowerCase() || ''
            const profession = consultant.profession?.toLowerCase() || ''
            const city = consultant.city?.toLowerCase() || ''
            
            return (
                firstName.includes(searchLower) ||
                lastName.includes(searchLower) ||
                email.includes(searchLower) ||
                profession.includes(searchLower) ||
                city.includes(searchLower) ||
                `${firstName} ${lastName}`.includes(searchLower)
            )
        })
    }, [poolConsultants, searchTerm])

    const handleRemoveConsultant = async (consultantId: string) => {
        try {
            setRemovingConsultant(consultantId)
            const response = await apiClient.delete(`/api/pools/${pool.id}/remove-consultant?consultantId=${consultantId}`)
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to remove consultant from pool')
            }
            setPoolConsultants(poolConsultants.filter(c => c.id !== consultantId))
            onShowAlert?.(t('pools.consultantRemoved'), 'success')
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('pools.errorRemoving')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setRemovingConsultant(null)
        }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card-3d max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {pool.color && (
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: pool.color }}
                                aria-hidden="true"
                            />
                        )}
                        <h2 className="text-xl font-bold text-primary">
                            {pool.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        aria-label={t('common.close')}
                    >
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder={t('pools.searchInPool')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>

                {/* Pool Consultants List */}
                <div className="mb-4">
                    <h3 className="font-semibold text-primary mb-2">{t('pools.consultantsInPool')}</h3>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                            <p className="text-secondary">{t('common.loading')}</p>
                        </div>
                    ) : filteredConsultants.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-secondary text-sm">
                                {searchTerm.trim() ? t('pools.noConsultantsFound') : t('pools.noConsultantsInPool')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredConsultants.map((consultant) => (
                                <div
                                    key={consultant.id}
                                    className="p-4 rounded-lg border-2 border-[var(--primary)] flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-primary">
                                                {consultant.firstName} {consultant.lastName?.[0]?.toUpperCase()}.
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
                                    <button
                                        onClick={() => handleRemoveConsultant(consultant.id)}
                                        disabled={removingConsultant === consultant.id}
                                        className="ml-4 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50"
                                        aria-label={t('pools.removeConsultant')}
                                    >
                                        {removingConsultant === consultant.id ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                        ) : (
                                            <i className="fas fa-minus" aria-hidden="true"></i>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

