// /components/consultants/PoolModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Consultant {
    id: string
    firstName: string | null
    lastName: string | null
}

interface Pool {
    id: string
    name: string
    color: string | null
    description: string | null
    memberCount: number
}

interface PoolModalProps {
    consultant: Consultant
    onClose: () => void
    onConsultantAdded: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function PoolModal({ consultant, onClose, onConsultantAdded, onShowAlert }: PoolModalProps) {
    const { t } = useLanguage()
    const [pools, setPools] = useState<Pool[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [addingToPool, setAddingToPool] = useState<string | null>(null)

    useEffect(() => {
        loadPools()
    }, [])

    const loadPools = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/dashboard/api/pools')
            if (!response.ok) throw new Error('Failed to load pools')
            const data = await response.json()
            setPools(data.pools || [])
        } catch (error) {
            console.error('Error loading pools:', error)
            onShowAlert?.(t('pools.errorLoading'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToPool = async (poolId: string) => {
        try {
            setAddingToPool(poolId)
            const response = await apiClient.post(`/dashboard/api/pools/${poolId}/add-consultant`, {
                consultantId: consultant.id,
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to add consultant to pool')
            }
            onConsultantAdded()
        } catch (error) {
            console.error('Error adding consultant to pool:', error)
            const errorMsg = error instanceof Error ? error.message : t('pools.errorAdding')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setAddingToPool(null)
        }
    }

    const filteredPools = pools.filter(pool =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card-3d max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-primary">
                        {t('pools.addToPool')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        aria-label={t('common.close')}
                    >
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-secondary mb-2">
                        {t('pools.selectPoolFor', { name: consultant.firstName || '' })}
                    </p>
                </div>

                {/* Search */}
                {pools.length > 5 && (
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder={t('pools.searchPools')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                        <p className="text-secondary">{t('common.loading')}</p>
                    </div>
                ) : filteredPools.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-secondary">
                            {searchTerm ? t('pools.noPoolsFound') : t('pools.noPools')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredPools.map((pool) => (
                            <button
                                key={pool.id}
                                onClick={() => handleAddToPool(pool.id)}
                                disabled={addingToPool === pool.id}
                                className="w-full p-4 rounded-lg border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all text-left flex items-center justify-between disabled:opacity-50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {pool.color && (
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: pool.color }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span className="font-semibold">{pool.name}</span>
                                    </div>
                                    {pool.description && (
                                        <p className="text-sm opacity-75">{pool.description}</p>
                                    )}
                                    <p className="text-xs mt-1 opacity-60">
                                        {t('pools.memberCount', { count: pool.memberCount.toString() })}
                                    </p>
                                </div>
                                {addingToPool === pool.id ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current ml-4"></div>
                                ) : (
                                    <i className="fas fa-chevron-right ml-4" aria-hidden="true"></i>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

