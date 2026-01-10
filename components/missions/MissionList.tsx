// /components/missions/MissionList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { MissionModal } from './MissionModal'
import { CreateMissionForm } from './CreateMissionForm'
import { FilterTabs, FilterType } from '@/components/common/FilterTabs'
import type { User } from '@/lib/db/schema'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Mission {
    title: string
    description: string | null
    startDate: string | Date
    endDate: string | Date
    address: string
    city: string
    postalCode: string
    country: string | null
    serviceType: string | null
    compensation: string | null
    notes: string | null
    createdAt: string | Date
    totalOffers: number
    pendingCount: number
    acceptedCount: number
    declinedCount: number
    inProgressCount?: number
    completedPendingValidationCount?: number
    needsCorrectionCount?: number
    completedValidatedCount?: number
    consultantsNotified: number
}

interface MissionListProps {
    refreshKey?: number
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
    user?: User | null
}

export function MissionList({ refreshKey, onShowAlert, user }: MissionListProps) {
    const { t } = useLanguage()
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')
    const [showCreateMission, setShowCreateMission] = useState(false)

    useEffect(() => {
        loadMissions()
    }, [refreshKey])

    const loadMissions = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/missions')
            if (!response.ok) throw new Error('Failed to load missions')
            const data = await response.json()
            // Convert date strings to Date objects
            const missionsWithDates = (data.missions || []).map((mission: any) => ({
                ...mission,
                startDate: mission.startDate ? new Date(mission.startDate) : new Date(),
                endDate: mission.endDate ? new Date(mission.endDate) : new Date(),
                createdAt: mission.createdAt ? new Date(mission.createdAt) : new Date(),
            }))
            setMissions(missionsWithDates)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('missions.errorLoading')
            onShowAlert?.(errorMsg, 'error')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadgeClass = (mission: Mission) => {
        if (mission.completedValidatedCount && mission.completedValidatedCount > 0) {
            return 'bg-green-100 text-green-800 border-green-300'
        }
        if (mission.needsCorrectionCount && mission.needsCorrectionCount > 0) {
            return 'bg-red-100 text-red-800 border-red-300'
        }
        if (mission.completedPendingValidationCount && mission.completedPendingValidationCount > 0) {
            return 'bg-orange-100 text-orange-800 border-orange-300'
        }
        if (mission.inProgressCount && mission.inProgressCount > 0) {
            return 'bg-blue-100 text-blue-800 border-blue-300'
        }
        if (mission.acceptedCount > 0) {
            return 'bg-green-100 text-green-800 border-green-300'
        }
        if (mission.declinedCount === mission.totalOffers) {
            return 'bg-red-100 text-red-800 border-red-300'
        }
        if (mission.pendingCount > 0) {
            return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        }
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }

    const getStatusText = (mission: Mission) => {
        if (mission.completedValidatedCount && mission.completedValidatedCount > 0) {
            return t('missions.validated')
        }
        if (mission.needsCorrectionCount && mission.needsCorrectionCount > 0) {
            return t('missions.needsCorrection')
        }
        if (mission.completedPendingValidationCount && mission.completedPendingValidationCount > 0) {
            return t('missions.pendingValidation')
        }
        if (mission.inProgressCount && mission.inProgressCount > 0) {
            return t('missions.inProgress')
        }
        if (mission.acceptedCount > 0) {
            return t('missions.statusAccepted', { count: mission.acceptedCount.toString() })
        }
        if (mission.declinedCount === mission.totalOffers) {
            return t('missions.statusDeclined')
        }
        if (mission.pendingCount > 0) {
            return t('missions.statusPending', { count: mission.pendingCount.toString() })
        }
        return t('missions.statusNoResponse')
    }

    const getMissionStatus = (mission: Mission): 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed_pending_validation' | 'needs_correction' | 'completed_validated' => {
        if (mission.completedValidatedCount && mission.completedValidatedCount > 0) {
            return 'completed_validated'
        }
        if (mission.needsCorrectionCount && mission.needsCorrectionCount > 0) {
            return 'needs_correction'
        }
        if (mission.completedPendingValidationCount && mission.completedPendingValidationCount > 0) {
            return 'completed_pending_validation'
        }
        if (mission.inProgressCount && mission.inProgressCount > 0) {
            return 'in_progress'
        }
        if (mission.acceptedCount > 0) {
            return 'accepted'
        }
        if (mission.declinedCount === mission.totalOffers) {
            return 'declined'
        }
        return 'pending'
    }

    const formatDateFull = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        if (isNaN(dateObj.getTime())) {
            return 'Date invalide'
        }
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj)
    }

    const filteredMissions = missions.filter(mission => {
        if (filter === 'all') return true
        const status = getMissionStatus(mission)
        return status === filter
    })

    const handleMissionClick = (mission: Mission) => {
        setSelectedMission(mission)
    }

    const handleCloseModal = () => {
        setSelectedMission(null)
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
            {/* Header with Create Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-primary">{t('missions.title')}</h2>
                <button
                    onClick={() => setShowCreateMission(!showCreateMission)}
                    className="w-full sm:w-auto px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    <i className="fas fa-plus" aria-hidden="true"></i>
                    <span className="text-sm sm:text-base">{t('missions.createMission')}</span>
                </button>
            </div>

            {/* Create Mission Form Modal */}
            {showCreateMission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="card-3d max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-primary">{t('missions.createMission')}</h2>
                            <button
                                onClick={() => setShowCreateMission(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                aria-label={t('common.close')}
                            >
                                <i className="fas fa-times" aria-hidden="true"></i>
                            </button>
                        </div>
                        <CreateMissionForm
                            onMissionCreated={() => {
                                setShowCreateMission(false)
                                loadMissions()
                            }}
                            onShowAlert={onShowAlert}
                        />
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="w-full max-w-full overflow-x-hidden overflow-y-visible">
                <FilterTabs
                type="missions"
                filters={[
                    { value: 'all', labelKey: 'all' },
                    { value: 'pending', labelKey: 'pending' },
                    { value: 'accepted', labelKey: 'accepted' },
                    { value: 'declined', labelKey: 'declined' },
                    { value: 'in_progress', labelKey: 'inProgress' },
                    { value: 'completed_pending_validation', labelKey: 'pendingValidation' },
                    { value: 'needs_correction', labelKey: 'needsCorrection' },
                    { value: 'completed_validated', labelKey: 'validated' },
                ]}
                currentFilter={filter}
                onFilterChange={setFilter}
            />
            </div>

            {/* Missions List */}
            {filteredMissions.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <i className="fas fa-inbox text-4xl text-secondary mb-4" aria-hidden="true"></i>
                    <p className="text-secondary">{t('missions.noMissions')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {filteredMissions.map((mission, index) => (
                        <div
                            key={index}
                            onClick={() => handleMissionClick(mission)}
                            className="card-3d cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className="font-bold text-primary text-lg mb-1">
                                        {mission.title}
                                    </h3>
                                    {mission.description && (
                                        <p className="text-sm text-secondary line-clamp-2">
                                            {mission.description}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusBadgeClass(mission)}`}
                                >
                                    {getStatusText(mission)}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm text-secondary">
                                <p>
                                    <i className="fas fa-calendar-alt mr-2" aria-hidden="true"></i>
                                    {formatDateFull(mission.startDate)} - {formatDateFull(mission.endDate)}
                                </p>
                                {(() => {
                                    const start = typeof mission.startDate === 'string' ? new Date(mission.startDate) : mission.startDate
                                    const end = typeof mission.endDate === 'string' ? new Date(mission.endDate) : mission.endDate
                                    // Calculer le nombre de jours calendaires entre les deux dates
                                    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
                                    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
                                    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                                    return (
                                        <p>
                                            <i className="fas fa-calendar-day mr-2" aria-hidden="true"></i>
                                            {daysDiff === 1 ? t('missions.numberOfDays', { count: daysDiff.toString() }) : t('missions.numberOfDaysPlural', { count: daysDiff.toString() })}
                                        </p>
                                    )
                                })()}
                                <p>
                                    <i className="fas fa-map-marker-alt mr-2" aria-hidden="true"></i>
                                    {mission.address}, {mission.city} {mission.postalCode}
                                </p>
                                {mission.compensation && (
                                    <p>
                                        <i className="fas fa-euro-sign mr-2" aria-hidden="true"></i>
                                        {mission.compensation} €
                                    </p>
                                )}
                                <p>
                                    <i className="fas fa-users mr-2" aria-hidden="true"></i>
                                    {mission.consultantsNotified === 1
                                        ? t('missions.consultantsNotified', { count: mission.consultantsNotified.toString() })
                                        : t('missions.consultantsNotifiedPlural', { count: mission.consultantsNotified.toString() })}
                                </p>
                            </div>
                            <p className="text-xs text-secondary mt-2">
                                {t('missions.createdOn', { date: formatDateFull(mission.createdAt) })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Mission Modal */}
            {selectedMission && (
                <MissionModal
                    mission={selectedMission}
                    onClose={handleCloseModal}
                    onShowAlert={onShowAlert}
                    user={user}
                />
            )}
        </div>
    )
}

