// /components/missions/CreateMissionForm.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Pool {
    id: string
    name: string
    color: string | null
    memberCount: number
}

interface CreateMissionFormProps {
    onMissionCreated: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function CreateMissionForm({ onMissionCreated, onShowAlert }: CreateMissionFormProps) {
    const { t } = useLanguage()
    const [pools, setPools] = useState<Pool[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'France',
        serviceType: '',
        hourlyRate: '',
        numberOfPositions: '1',
        notes: '',
        selectedPoolIds: [] as string[],
    })

    useEffect(() => {
        loadPools()
    }, [])

    const loadPools = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/pools')
            if (!response.ok) throw new Error('Failed to load pools')
            const data = await response.json()
            // Filter pools that have at least one consultant
            const poolsWithConsultants = (data.pools || []).filter((pool: Pool) => pool.memberCount > 0)
            setPools(poolsWithConsultants)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('pools.errorLoading')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (formData.selectedPoolIds.length === 0) {
            onShowAlert?.(t('missions.selectAtLeastOnePool'), 'error')
            return
        }

        if (!formData.title.trim()) {
            onShowAlert?.(t('missions.titleRequired'), 'error')
            return
        }

        if (!formData.startDate || !formData.endDate) {
            onShowAlert?.(t('missions.datesRequired'), 'error')
            return
        }

        if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
            onShowAlert?.(t('missions.addressRequired'), 'error')
            return
        }

        try {
            setCreating(true)
            
            // Combine date and time
            const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`)
            const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`)

            if (startDateTime >= endDateTime) {
                onShowAlert?.(t('missions.endDateAfterStart'), 'error')
                setCreating(false)
                return
            }

            if (!formData.hourlyRate || isNaN(parseFloat(formData.hourlyRate)) || parseFloat(formData.hourlyRate) <= 0) {
                onShowAlert?.(t('missions.hourlyRateRequired'), 'error')
                setCreating(false)
                return
            }

            if (!formData.numberOfPositions || isNaN(parseInt(formData.numberOfPositions)) || parseInt(formData.numberOfPositions) <= 0) {
                onShowAlert?.(t('missions.numberOfPositionsRequired'), 'error')
                setCreating(false)
                return
            }

            const response = await apiClient.post('/api/missions', {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                postalCode: formData.postalCode.trim(),
                country: formData.country,
                serviceType: formData.serviceType.trim() || null,
                hourlyRate: parseFloat(formData.hourlyRate),
                numberOfPositions: parseInt(formData.numberOfPositions),
                notes: formData.notes.trim() || null,
                poolIds: formData.selectedPoolIds,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create mission')
            }

            const data = await response.json()
            onShowAlert?.(t('missions.missionCreated', { count: data.consultantsNotified.toString() }), 'success')
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                startDate: '',
                startTime: '',
                endDate: '',
                endTime: '',
                address: '',
                city: '',
                postalCode: '',
                country: 'France',
                serviceType: '',
                hourlyRate: '',
                numberOfPositions: '1',
                notes: '',
                selectedPoolIds: [],
            })
            
            onMissionCreated()
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('missions.errorCreating')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setCreating(false)
        }
    }

    const togglePoolSelection = (poolId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedPoolIds: prev.selectedPoolIds.includes(poolId)
                ? prev.selectedPoolIds.filter(id => id !== poolId)
                : [...prev.selectedPoolIds, poolId],
        }))
    }

    if (loading) {
        return (
            <div className="card-3d text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                <p className="text-secondary">{t('common.loading')}</p>
            </div>
        )
    }

    if (pools.length === 0) {
        return (
            <div className="card-3d text-center py-8">
                <p className="text-secondary mb-4">{t('missions.noPoolsWithConsultants')}</p>
                <p className="text-sm text-secondary">{t('missions.createPoolAndAddConsultants')}</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title */}
            <div>
                <label htmlFor="mission-title" className="block text-sm font-semibold text-primary mb-1">
                    {t('missions.missionTitle')} *
                </label>
                <input
                    id="mission-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder={t('missions.titlePlaceholder')}
                />
            </div>

            {/* Description */}
            <div>
                <label htmlFor="mission-description" className="block text-sm font-semibold text-primary mb-1">
                    {t('missions.description')}
                </label>
                <textarea
                    id="mission-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    rows={3}
                    placeholder={t('missions.descriptionPlaceholder')}
                />
            </div>

                {/* Dates and Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="mission-start-date" className="block text-sm font-semibold text-primary mb-1">
                        {t('missions.startDate')} *
                    </label>
                    <input
                        id="mission-start-date"
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label htmlFor="mission-start-time" className="block text-sm font-semibold text-primary mb-1">
                        {t('missions.startTime')}
                    </label>
                    <input
                        id="mission-start-time"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label htmlFor="mission-end-date" className="block text-sm font-semibold text-primary mb-1">
                        {t('missions.endDate')} *
                    </label>
                    <input
                        id="mission-end-date"
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label htmlFor="mission-end-time" className="block text-sm font-semibold text-primary mb-1">
                        {t('missions.endTime')}
                    </label>
                    <input
                        id="mission-end-time"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
            </div>

            {/* Address */}
            <div>
                <label htmlFor="mission-address" className="block text-sm font-semibold text-primary mb-1">
                    {t('missions.address')} *
                </label>
                <input
                    id="mission-address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder={t('missions.addressPlaceholder')}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="mission-city" className="block text-sm font-semibold text-primary mb-1">
                        {t('missions.city')} *
                    </label>
                    <input
                        id="mission-city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label htmlFor="mission-postal-code" className="block text-sm font-semibold text-primary mb-1">
                        {t('missions.postalCode')} *
                    </label>
                    <input
                        id="mission-postal-code"
                        type="text"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
            </div>

            {/* Service Type */}
            <div>
                <label htmlFor="mission-service-type" className="block text-sm font-semibold text-primary mb-1">
                    {t('missions.serviceType')}
                </label>
                <input
                    id="mission-service-type"
                    type="text"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder={t('missions.serviceTypePlaceholder')}
                />
            </div>

            {/* Hourly Rate */}
            <div>
                <label htmlFor="mission-hourly-rate" className="block text-sm font-semibold text-primary mb-1">
                    {t('missions.hourlyRate')} *
                </label>
                <input
                    id="mission-hourly-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.hourlyRate}
                    onChange={(e) => {
                        const value = e.target.value
                        // Allow up to 2 decimal places
                        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                            setFormData({ ...formData, hourlyRate: value })
                        }
                    }}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder={t('missions.hourlyRatePlaceholder')}
                />
                <p className="text-xs text-secondary mt-1">
                    {t('missions.hourlyRateHint')}
                </p>
            </div>

            {/* Notes */}
            <div>
                <label htmlFor="mission-notes" className="block text-sm font-semibold text-primary mb-1">
                    {t('missions.notes')}
                </label>
                <textarea
                    id="mission-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    rows={3}
                    placeholder={t('missions.notesPlaceholder')}
                />
            </div>

            {/* Pool Selection */}
            <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                    {t('missions.selectPools')} *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-[var(--primary)] rounded-lg p-3">
                    {pools.map((pool) => (
                        <label
                            key={pool.id}
                            className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded"
                        >
                            <input
                                type="checkbox"
                                checked={formData.selectedPoolIds.includes(pool.id)}
                                onChange={() => togglePoolSelection(pool.id)}
                                className="w-5 h-5 text-[var(--primary)] border-2 border-[var(--primary)] rounded focus:ring-2 focus:ring-[var(--primary)]"
                            />
                            <div className="flex items-center gap-2 flex-1">
                                {pool.color && (
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: pool.color }}
                                        aria-hidden="true"
                                    />
                                )}
                                <span className="font-semibold">{pool.name}</span>
                                <span className="text-sm text-secondary">
                                    ({t('pools.memberCount', { count: pool.memberCount.toString() })})
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 btn-primary disabled:opacity-50 text-sm sm:text-base"
                >
                    {creating ? t('common.loading') : t('missions.createMission')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                    // Reset form
                    setFormData({
                        title: '',
                        description: '',
                        startDate: '',
                        startTime: '',
                        endDate: '',
                        endTime: '',
                        address: '',
                        city: '',
                        postalCode: '',
                        country: 'France',
                        serviceType: '',
                        hourlyRate: '',
                        numberOfPositions: '1',
                        notes: '',
                        selectedPoolIds: [],
                    })
                    onMissionCreated() // This will close the form in MissionList
                    }}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                    disabled={creating}
                >
                    {t('common.cancel')}
                </button>
            </div>
        </form>
    )
}

