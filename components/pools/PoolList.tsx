// /components/pools/PoolList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { PoolModal } from './PoolModal'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Pool {
    id: string
    name: string
    color: string | null
    description: string | null
    memberCount: number
    createdAt: Date
    updatedAt: Date
}

interface PoolListProps {
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function PoolList({ onShowAlert }: PoolListProps) {
    const { t } = useLanguage()
    const [pools, setPools] = useState<Pool[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newPoolName, setNewPoolName] = useState('')
    const [newPoolColor, setNewPoolColor] = useState('')
    const [newPoolDescription, setNewPoolDescription] = useState('')
    const [creatingPool, setCreatingPool] = useState(false)
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null)

    useEffect(() => {
        loadPools()
    }, [])

    const loadPools = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/pools')
            if (!response.ok) throw new Error('Failed to load pools')
            const data = await response.json()
            setPools(data.pools || [])
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('pools.errorLoading')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePool = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPoolName.trim()) {
            onShowAlert?.(t('pools.nameRequired'), 'error')
            return
        }

        try {
            setCreatingPool(true)
            const response = await apiClient.post('/api/pools', {
                name: newPoolName.trim(),
                color: newPoolColor.trim() || null,
                description: newPoolDescription.trim() || null,
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create pool')
            }
            const data = await response.json()
            setPools([...pools, { ...data.pool, memberCount: 0 }])
            setNewPoolName('')
            setNewPoolColor('')
            setNewPoolDescription('')
            setShowCreateForm(false)
            onShowAlert?.(t('pools.poolCreated'), 'success')
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('pools.errorSaving')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setCreatingPool(false)
        }
    }

    const handleDeletePool = async (poolId: string) => {
        if (!confirm(t('pools.confirmDelete'))) {
            return
        }

        try {
            const response = await apiClient.delete(`/api/pools/${poolId}`)
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete pool')
            }
            setPools(pools.filter(p => p.id !== poolId))
            onShowAlert?.(t('pools.poolDeleted'), 'success')
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('pools.errorDeleting')
            onShowAlert?.(errorMsg, 'error')
        }
    }

    if (loading) {
        return (
            <div className="card-3d text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                <p className="text-secondary">{t('common.loading')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Create Pool Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">{t('pools.title')}</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <i className="fas fa-plus" aria-hidden="true"></i>
                    {t('pools.newPool')}
                </button>
            </div>

            {/* Create Pool Form */}
            {showCreateForm && (
                <div className="card-3d p-4">
                    <h3 className="font-semibold text-primary mb-3">{t('pools.newPool')}</h3>
                    <form onSubmit={handleCreatePool} className="space-y-3">
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('pools.name')} *
                            </label>
                            <input
                                type="text"
                                value={newPoolName}
                                onChange={(e) => setNewPoolName(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder={t('pools.name')}
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('pools.color')}
                            </label>
                            <input
                                type="text"
                                value={newPoolColor}
                                onChange={(e) => setNewPoolColor(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="#FF5733 ou red"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('pools.description')}
                            </label>
                            <textarea
                                value={newPoolDescription}
                                onChange={(e) => setNewPoolDescription(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                rows={3}
                                placeholder={t('pools.description')}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={creatingPool}
                                className="flex-1 btn-primary disabled:opacity-50"
                            >
                                {creatingPool ? t('common.loading') : t('pools.createPool')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false)
                                    setNewPoolName('')
                                    setNewPoolColor('')
                                    setNewPoolDescription('')
                                }}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pools List */}
            {pools.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">{t('pools.noPools')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {pools.map((pool) => (
                        <div
                            key={pool.id}
                            className="card-3d p-4 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedPool(pool)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {pool.color && (
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: pool.color }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span className="font-semibold text-primary">{pool.name}</span>
                                    </div>
                                    {pool.description && (
                                        <p className="text-sm text-secondary mb-1">{pool.description}</p>
                                    )}
                                    <p className="text-xs text-secondary">
                                        {t('pools.memberCount', { count: pool.memberCount.toString() })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePool(pool.id)
                                        }}
                                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                                        aria-label={t('common.delete')}
                                    >
                                        <i className="fas fa-trash" aria-hidden="true"></i>
                                    </button>
                                    <i className="fas fa-chevron-right text-secondary" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pool Modal */}
            {selectedPool && (
                <PoolModal
                    pool={selectedPool}
                    onClose={() => {
                        setSelectedPool(null)
                        loadPools() // Refresh pools to update member counts
                    }}
                    onShowAlert={onShowAlert}
                />
            )}
        </div>
    )
}

