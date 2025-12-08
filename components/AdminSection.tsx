// /components/AdminSection.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'

interface AdminSectionProps {
    onShowToast: (message: string) => void
}

type MainCategory = 'users' | 'games' | 'revenues'
type UserTab = 'users' | 'admins' | 'redemptions' | 'flagged' | 'bans' | 'logs'
type GameTab = 'sessions' | 'battles'

interface BannedUser {
    id: string
    telegramId: string
    username?: string
    firstName?: string
    isBanned: boolean
    bannedAt: string
    bannedReason: string
    bannedUntil: string | null
    abuseScore: number
    isPermanent: boolean
}

interface FlaggedUser {
    id: string
    telegramId: string
    username?: string
    firstName?: string
    abuseScore: number
    recentLogs: AbuseLog[]
}

interface AbuseLog {
    id: string
    userId: string
    type: string
    severity: string
    description: string
    createdAt: string
    user?: {
        telegramId: string
        username?: string
        firstName?: string
    }
}

interface GameSession {
    id: string
    userId: string
    startedAt: string
    endedAt: string | null
    cooldownHours: number
    nextPlayableAt: string | null
    user?: {
        id: string
        telegramId: string
        username?: string
        firstName?: string
    }
}

interface Battle {
    id: string
    name: string
    team1: string
    team2: string
    team1Logo?: string | null
    team2Logo?: string | null
    leagueLogo?: string | null
    eventDate: string
    sport?: string
    league?: string
    potAmount: number
    status: string
    result?: string
    participantCount?: number
    createdAt: string
}

interface ResolveModalState {
    isOpen: boolean
    battle: Battle | null
    selectedResult: string | null
    showConfirmation: boolean
}

interface CancelModalState {
    isOpen: boolean
    battle: Battle | null
    reason: string
    showConfirmation: boolean
}

interface BattleFormData {
    name: string
    team1: string
    team2: string
    eventDate: string
    sport: string
    league: string
    potAmount: string
}

interface BattleFormModalState {
    isOpen: boolean
    mode: 'create' | 'edit'
    battle: Battle | null
    formData: BattleFormData
}

interface AdminRedemption {
    id: string
    userId: string
    points: number
    stars: number
    conversionRate: number
    status: string
    createdAt: string
    reviewedAt?: string | null
    flaggedReason?: string | null
    notes?: string | null
    evidence?: {
        summary?: {
            totalCredits: number
            totalDebits: number
            sampleSize: number
            totalsByType: Record<string, { total: number; count: number }>
        }
        history?: Array<{
            id: string
            type: string
            amount: number
            description: string
            createdAt: string
        }>
        context?: {
            requestedPoints?: number
            requestedStars?: number
        }
    }
    user?: {
        id: string
        telegramId: string
        username?: string
        firstName?: string
        lastName?: string
        photoUrl?: string
    }
}

export function AdminSection({ onShowToast }: AdminSectionProps) {
    const [mainCategory, setMainCategory] = useState<MainCategory>('users')
    const [userTab, setUserTab] = useState<UserTab>('users')
    const [gameTab, setGameTab] = useState<GameTab>('sessions')
    const [loading, setLoading] = useState(false)

    // User management state
    const [allUsers, setAllUsers] = useState<Array<Record<string, unknown>>>([])
    const [usersPage, setUsersPage] = useState(1)
    const [usersTotalPages, setUsersTotalPages] = useState(1)
    const [usersSearch, setUsersSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null)
    const [admins, setAdmins] = useState<Array<Record<string, unknown>>>([])
    const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
    const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([])
    const [abuseLogs, setAbuseLogs] = useState<AbuseLog[]>([])
    const [banUserId, setBanUserId] = useState('')
    const [banReason, setBanReason] = useState('')
    const [banHours, setBanHours] = useState('')
    const [redemptions, setRedemptions] = useState<AdminRedemption[]>([])
    const [redemptionsPage, setRedemptionsPage] = useState(1)
    const [redemptionsHasMore, setRedemptionsHasMore] = useState(false)
    const [redemptionsSearch, setRedemptionsSearch] = useState('')
    const [redemptionStatus, setRedemptionStatus] = useState<'pending' | 'completed' | 'approved' | 'flagged' | 'all'>('pending')
    const [redemptionReview, setRedemptionReview] = useState<{
        isOpen: boolean
        redemption: AdminRedemption | null
        approvalNote: string
        flagReason: string
        severity: 'high' | 'critical'
    }>({
        isOpen: false,
        redemption: null,
        approvalNote: '',
        flagReason: '',
        severity: 'high'
    })
    const [redemptionActionLoading, setRedemptionActionLoading] = useState(false)

    // Revenue management state
    const [revenueData, setRevenueData] = useState<{
        totalRevenue: number
        availableRevenue: number
        summary: {
            purchase: number
            ton_purchase: number
            redemption_fee: number
            battle_fee: number
            withdrawal: number
        }
        history: Array<Record<string, unknown>>
    } | null>(null)
    const [revenuePage, setRevenuePage] = useState(1)
    const [revenueTypeFilter, setRevenueTypeFilter] = useState<'all' | 'purchase' | 'ton_purchase' | 'redemption_fee' | 'battle_fee' | 'withdrawal'>('all')
    const [withdrawalModal, setWithdrawalModal] = useState<{
        isOpen: boolean
        amount: string
        note: string
    }>({
        isOpen: false,
        amount: '',
        note: ''
    })

    // Game management state
    const [gameSessions, setGameSessions] = useState<GameSession[]>([])
    const [sessionsPage, setSessionsPage] = useState(1)
    const [sessionsTotalPages, setSessionsTotalPages] = useState(1)
    const [sessionsSearch, setSessionsSearch] = useState('')
    const [battlesSearch, setBattlesSearch] = useState('')
    const [battles, setBattles] = useState<Battle[]>([])
    const [generatingBattles, setGeneratingBattles] = useState(false)
    const [resolvingBattles, setResolvingBattles] = useState(false)
    const [deleteSessionModal, setDeleteSessionModal] = useState<{
        isOpen: boolean
        sessionId: string | null
    }>({
        isOpen: false,
        sessionId: null
    })
    const [deleteBattleModal, setDeleteBattleModal] = useState<{
        isOpen: boolean
        battleId: string | null
        battleName: string | null
    }>({
        isOpen: false,
        battleId: null,
        battleName: null
    })
    const [resolveModal, setResolveModal] = useState<ResolveModalState>({
        isOpen: false,
        battle: null,
        selectedResult: null,
        showConfirmation: false
    })
    const [cancelModal, setCancelModal] = useState<CancelModalState>({
        isOpen: false,
        battle: null,
        reason: '',
        showConfirmation: false
    })
    const [battleFormModal, setBattleFormModal] = useState<BattleFormModalState>({
        isOpen: false,
        mode: 'create',
        battle: null,
        formData: {
            name: '',
            team1: '',
            team2: '',
            eventDate: '',
            sport: '',
            league: '',
            potAmount: ''
        }
    })

    useEffect(() => {
        if (mainCategory === 'users') {
            if (userTab === 'users') fetchAllUsers()
            else if (userTab === 'admins') fetchAdmins()
            else if (userTab === 'redemptions') fetchRedemptions()
            else if (userTab === 'bans') fetchBannedUsers()
            else if (userTab === 'flagged') fetchFlaggedUsers()
            else if (userTab === 'logs') fetchAbuseLogs()
        } else if (mainCategory === 'games') {
            if (gameTab === 'sessions') fetchGameSessions()
            else if (gameTab === 'battles') fetchBattles()
        } else if (mainCategory === 'revenues') {
            fetchRevenue()
        }
    }, [
        mainCategory,
        userTab,
        gameTab,
        usersPage,
        usersSearch,
        sessionsPage,
        sessionsSearch,
        redemptionsPage,
        redemptionStatus,
        redemptionsSearch,
        revenuePage,
        revenueTypeFilter
    ])

    // User management functions
    const fetchBannedUsers = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get('/api/admin/bans')
            const data = await response.json()
            setBannedUsers(data.users || [])
        } catch (error) {
            console.error('Failed to fetch banned users:', error)
            onShowToast('Failed to load banned users')
        } finally {
            setLoading(false)
        }
    }

    const fetchAllUsers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: usersPage.toString(),
                limit: '10',
                ...(usersSearch && { search: usersSearch })
            })
            const response = await apiClient.get(`/api/admin/users?${params}`)
            const data = await response.json()
            setAllUsers(data.users || [])
            setUsersTotalPages(data.totalPages || 1)
        } catch (error) {
            console.error('Failed to fetch users:', error)
            onShowToast('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const fetchAdmins = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get('/api/admin/manage-admins')
            const data = await response.json()
            setAdmins(data.admins || [])
        } catch (error) {
            console.error('Failed to fetch admins:', error)
            onShowToast('Failed to load admins')
        } finally {
            setLoading(false)
        }
    }

    const handleGrantAdmin = async (userId: string) => {
        try {
            const response = await apiClient.post('/api/admin/manage-admins', {
                userId,
                action: 'grant'
            })
            if (response.ok) {
                onShowToast('✅ Admin status granted')
                fetchAdmins()
                fetchAllUsers()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to grant admin status')
            }
        } catch (error) {
            console.error('Failed to grant admin:', error)
            onShowToast('Failed to grant admin status')
        }
    }

    const [revokeAdminModal, setRevokeAdminModal] = useState<{
        isOpen: boolean
        userId: string | null
        userName: string | null
    }>({
        isOpen: false,
        userId: null,
        userName: null
    })

    const openRevokeAdminModal = (userId: string, userName: string) => {
        setRevokeAdminModal({
            isOpen: true,
            userId,
            userName
        })
    }

    const closeRevokeAdminModal = () => {
        setRevokeAdminModal({
            isOpen: false,
            userId: null,
            userName: null
        })
    }

    const handleRevokeAdmin = async () => {
        if (!revokeAdminModal.userId) return

        try {
            const response = await apiClient.post('/api/admin/manage-admins', {
                userId: revokeAdminModal.userId,
                action: 'revoke'
            })
            if (response.ok) {
                onShowToast('✅ Admin status revoked')
                closeRevokeAdminModal()
                fetchAdmins()
                fetchAllUsers()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to revoke admin status')
            }
        } catch (error) {
            console.error('Failed to revoke admin:', error)
            onShowToast('Failed to revoke admin status')
        }
    }

    const fetchFlaggedUsers = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get('/api/admin/flagged-users')
            const data = await response.json()
            setFlaggedUsers(data.users || [])
        } catch (error) {
            console.error('Failed to fetch flagged users:', error)
            onShowToast('Failed to load flagged users')
        } finally {
            setLoading(false)
        }
    }

    const fetchAbuseLogs = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get('/api/admin/abuse-logs?hours=48&limit=50')
            const data = await response.json()
            setAbuseLogs(data.logs || [])
        } catch (error) {
            console.error('Failed to fetch abuse logs:', error)
            onShowToast('Failed to load abuse logs')
        } finally {
            setLoading(false)
        }
    }

    const fetchRedemptions = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                limit: '10',
                offset: ((redemptionsPage - 1) * 10).toString(),
                ...(redemptionStatus !== 'all' && { status: redemptionStatus }),
                ...(redemptionsSearch && { search: redemptionsSearch })
            })
            const response = await apiClient.get(`/api/admin/redemptions?${params.toString()}`)
            const data = await response.json()
            setRedemptions(data.results || [])
            setRedemptionsHasMore(Boolean(data.pagination?.hasMore))
        } catch (error) {
            console.error('Failed to fetch redemptions:', error)
            onShowToast('Failed to load redemptions')
        } finally {
            setLoading(false)
        }
    }

    const handleBanUser = async () => {
        if (!banUserId || !banReason) {
            onShowToast('Please provide user ID and reason')
            return
        }

        try {
            const response = await apiClient.post('/api/admin/bans', {
                userId: banUserId,
                reason: banReason,
                hours: banHours ? parseInt(banHours) : undefined
            })

            if (response.ok) {
                onShowToast('User banned successfully')
                setBanUserId('')
                setBanReason('')
                setBanHours('')
                if (userTab === 'bans') fetchBannedUsers()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to ban user')
            }
        } catch (error) {
            console.error('Failed to ban user:', error)
            onShowToast('Failed to ban user')
        }
    }

    const handleUnbanUser = async (userId: string) => {
        try {
            const response = await apiClient.delete('/api/admin/bans', { userId })

            if (response.ok) {
                onShowToast('User unbanned successfully')
                fetchBannedUsers()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to unban user')
            }
        } catch (error) {
            console.error('Failed to unban user:', error)
            onShowToast('Failed to unban user')
        }
    }

    const closeRedemptionReview = () => {
        setRedemptionReview({
            isOpen: false,
            redemption: null,
            approvalNote: '',
            flagReason: '',
            severity: 'high'
        })
    }

    const handleApproveRedemption = async () => {
        if (!redemptionReview.redemption) return
        setRedemptionActionLoading(true)
        try {
            const payload = redemptionReview.approvalNote
                ? { notes: redemptionReview.approvalNote }
                : {}
            const response = await apiClient.post(
                `/api/admin/redemptions/${redemptionReview.redemption.id}/approve`,
                payload
            )
            const data = await response.json()
            if (response.ok) {
                onShowToast('✅ Redemption approved')
                closeRedemptionReview()
                fetchRedemptions()
            } else {
                onShowToast(data.error || 'Failed to approve redemption')
            }
        } catch (error) {
            console.error('Failed to approve redemption:', error)
            onShowToast('Failed to approve redemption')
        } finally {
            setRedemptionActionLoading(false)
        }
    }

    const handleFlagRedemption = async () => {
        if (!redemptionReview.redemption) return
        if (!redemptionReview.flagReason.trim()) {
            onShowToast('Please provide a reason to flag this redemption')
            return
        }
        setRedemptionActionLoading(true)
        try {
            const response = await apiClient.post(
                `/api/admin/redemptions/${redemptionReview.redemption.id}/flag`,
                {
                    reason: redemptionReview.flagReason,
                    severity: redemptionReview.severity,
                }
            )
            const data = await response.json()
            if (response.ok) {
                onShowToast('⚠️ Redemption flagged and user marked suspicious')
                closeRedemptionReview()
                fetchRedemptions()
            } else {
                onShowToast(data.error || 'Failed to flag redemption')
            }
        } catch (error) {
            console.error('Failed to flag redemption:', error)
            onShowToast('Failed to flag redemption')
        } finally {
            setRedemptionActionLoading(false)
        }
    }

    // Game management functions
    const fetchGameSessions = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: sessionsPage.toString(),
                limit: '10',
                ...(sessionsSearch && { search: sessionsSearch })
            })
            const response = await apiClient.get(`/api/admin/game-sessions?${params}`)
            const data = await response.json()
            setGameSessions(data.sessions || [])
            setSessionsTotalPages(data.totalPages || 1)
        } catch (error) {
            console.error('Failed to fetch game sessions:', error)
            onShowToast('Failed to load game sessions')
        } finally {
            setLoading(false)
        }
    }

    const fetchBattles = async () => {
        setLoading(true)
        try {
            // Fetch all battles (no limit or use a high limit)
            const response = await apiClient.get('/api/admin/battles')
            const data = await response.json()
            setBattles(data.battles || [])
        } catch (error) {
            console.error('Failed to fetch battles:', error)
            onShowToast('Failed to load battles')
        } finally {
            setLoading(false)
        }
    }

    const openDeleteSessionModal = (sessionId: string) => {
        setDeleteSessionModal({
            isOpen: true,
            sessionId
        })
    }

    const closeDeleteSessionModal = () => {
        setDeleteSessionModal({
            isOpen: false,
            sessionId: null
        })
    }

    const handleDeleteSession = async () => {
        if (!deleteSessionModal.sessionId) return

        try {
            const response = await apiClient.delete('/api/admin/game-sessions', { sessionId: deleteSessionModal.sessionId })

            if (response.ok) {
                onShowToast('✅ Game session deleted')
                closeDeleteSessionModal()
                fetchGameSessions()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to delete session')
            }
        } catch (error) {
            console.error('Failed to delete session:', error)
            onShowToast('Failed to delete session')
        }
    }

    const openDeleteBattleModal = (battleId: string, battleName: string, participantCount: number) => {
        if (participantCount > 0) {
            onShowToast(`⚠️ Cannot delete! Battle has ${participantCount} participant(s). Use Cancel to refund them first.`)
            return
        }
        setDeleteBattleModal({
            isOpen: true,
            battleId,
            battleName
        })
    }

    const closeDeleteBattleModal = () => {
        setDeleteBattleModal({
            isOpen: false,
            battleId: null,
            battleName: null
        })
    }

    const handleDeleteBattle = async () => {
        if (!deleteBattleModal.battleId) return

        try {
            const response = await apiClient.delete('/api/admin/battles', { battleId: deleteBattleModal.battleId })

            if (response.ok) {
                onShowToast('✅ Battle deleted successfully')
                closeDeleteBattleModal()
                fetchBattles()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to delete battle')
            }
        } catch (error) {
            console.error('Failed to delete battle:', error)
            onShowToast('Failed to delete battle')
        }
    }

    const openResolveModal = (battle: Battle) => {
        setResolveModal({
            isOpen: true,
            battle,
            selectedResult: null,
            showConfirmation: false
        })
    }

    const closeResolveModal = () => {
        setResolveModal({
            isOpen: false,
            battle: null,
            selectedResult: null,
            showConfirmation: false
        })
    }

    const selectResult = (result: string) => {
        setResolveModal(prev => ({
            ...prev,
            selectedResult: result,
            showConfirmation: true
        }))
    }

    const confirmResolve = async () => {
        if (!resolveModal.battle || !resolveModal.selectedResult) return

        try {
            const response = await apiClient.post('/api/battles/resolve', {
                battleId: resolveModal.battle.id,
                result: resolveModal.selectedResult
            })

            if (response.ok) {
                const data = await response.json()
                onShowToast(`✅ Battle resolved! ${data.winnersCount} winner(s) received ${data.pointsPerWinner} pts each`)
                closeResolveModal()
                fetchBattles()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to resolve battle')
            }
        } catch (error) {
            console.error('Failed to resolve battle:', error)
            onShowToast('Failed to resolve battle')
        }
    }

    const getResultLabel = (result: string, battle: Battle) => {
        switch (result) {
            case '1': return battle.team1
            case 'n': return 'Draw'
            case '2': return battle.team2
            default: return result
        }
    }

    const openCancelModal = (battle: Battle) => {
        setCancelModal({
            isOpen: true,
            battle,
            reason: '',
            showConfirmation: false
        })
    }

    const closeCancelModal = () => {
        setCancelModal({
            isOpen: false,
            battle: null,
            reason: '',
            showConfirmation: false
        })
    }

    const selectCancelReason = (reason: string) => {
        setCancelModal(prev => ({
            ...prev,
            reason,
            showConfirmation: true
        }))
    }

    const confirmCancel = async () => {
        if (!cancelModal.battle) return

        try {
            const response = await apiClient.post('/api/battles/cancel', {
                battleId: cancelModal.battle.id,
                reason: cancelModal.reason
            })

            if (response.ok) {
                const data = await response.json()
                onShowToast(`✅ Battle cancelled! ${data.refundedCount} player(s) refunded ${data.totalRefunded} pts total`)
                closeCancelModal()
                fetchBattles()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to cancel battle')
            }
        } catch (error) {
            console.error('Failed to cancel battle:', error)
            onShowToast('Failed to cancel battle')
        }
    }

    const openCreateBattleModal = () => {
        setBattleFormModal({
            isOpen: true,
            mode: 'create',
            battle: null,
            formData: {
                name: '',
                team1: '',
                team2: '',
                eventDate: '',
                sport: '',
                league: '',
                potAmount: ''
            }
        })
    }

    const handleGenerateBattles = async () => {
        setGeneratingBattles(true)
        try {
            const response = await apiClient.post('/api/battles/generate', {})

            if (response.ok) {
                const data = await response.json()
                onShowToast(`✅ Generated ${data.created} battles!`)
                fetchBattles() // Refresh battles list
            } else {
                const errorData = await response.json()
                onShowToast(errorData.error || 'Failed to generate battles')
            }
        } catch (error) {
            console.error('Generate battles error:', error)
            onShowToast('Failed to generate battles')
        } finally {
            setGeneratingBattles(false)
        }
    }

    const handleResolveBattles = async () => {
        setResolvingBattles(true)
        try {
            const response = await apiClient.post('/api/battles/auto-resolve', {})

            if (response.ok) {
                const data = await response.json()
                let message = `✅ Resolved ${data.resolved} battles`
                if (data.skipped && data.skipped > 0) {
                    message += `, ${data.skipped} need manual resolution`
                }
                if (data.resolutionErrors && data.resolutionErrors.length > 0) {
                    message += ` (${data.resolutionErrors.length} errors)`
                }
                onShowToast(message)
                fetchBattles() // Refresh battles list
            } else {
                const errorData = await response.json()
                onShowToast(errorData.error || 'Failed to resolve battles')
            }
        } catch (error) {
            console.error('Resolve battles error:', error)
            onShowToast('Failed to resolve battles')
        } finally {
            setResolvingBattles(false)
        }
    }

    const openEditBattleModal = (battle: Battle) => {
        setBattleFormModal({
            isOpen: true,
            mode: 'edit',
            battle,
            formData: {
                name: battle.name,
                team1: battle.team1,
                team2: battle.team2,
                eventDate: new Date(battle.eventDate).toISOString().slice(0, 16),
                sport: battle.sport || '',
                league: battle.league || '',
                potAmount: battle.potAmount.toString()
            }
        })
    }

    const closeBattleFormModal = () => {
        setBattleFormModal({
            isOpen: false,
            mode: 'create',
            battle: null,
            formData: {
                name: '',
                team1: '',
                team2: '',
                eventDate: '',
                sport: '',
                league: '',
                potAmount: ''
            }
        })
    }

    const updateFormData = (field: keyof BattleFormData, value: string) => {
        setBattleFormModal(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [field]: value
            }
        }))
    }

    const handleSubmitBattle = async () => {
        const { formData, mode, battle } = battleFormModal

        // Validation
        if (!formData.name || !formData.team1 || !formData.team2 || !formData.eventDate || !formData.sport || !formData.league || !formData.potAmount) {
            onShowToast('⚠️ Please fill all required fields')
            return
        }

        const potAmount = parseInt(formData.potAmount)
        if (isNaN(potAmount) || potAmount <= 0) {
            onShowToast('⚠️ Pot amount must be a positive number')
            return
        }

        try {
            const payload = {
                ...(mode === 'edit' && { battleId: battle!.id }),
                name: formData.name,
                team1: formData.team1,
                team2: formData.team2,
                eventDate: formData.eventDate,
                sport: formData.sport || '', // Send empty string instead of null
                league: formData.league || '', // Send empty string instead of null
                potAmount
            }

            const endpoint = mode === 'create' ? '/api/battles/create' : '/api/battles/update'
            const response = await apiClient.post(endpoint, payload)

            if (response.ok) {
                onShowToast(`✅ Battle ${mode === 'create' ? 'created' : 'updated'} successfully!`)
                closeBattleFormModal()
                fetchBattles()
            } else {
                const data = await response.json()
                onShowToast(data.error || `Failed to ${mode} battle`)
            }
        } catch (error) {
            console.error(`Failed to ${mode} battle:`, error)
            onShowToast(`Failed to ${mode} battle`)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'var(--red)'
            case 'high': return 'var(--orange)'
            case 'medium': return 'var(--yellow)'
            case 'low': return 'var(--blue)'
            default: return 'var(--gray)'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'var(--green)'
            case 'closed': return 'var(--orange)'
            case 'completed': return 'var(--primary)'
            default: return 'var(--gray)'
        }
    }

    const getRedemptionStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Completed',
                    background: '#e6fbf2',
                    border: 'var(--green)',
                    shadow: 'rgba(46, 204, 113, 0.8)',
                }
            case 'approved':
                return {
                    label: 'Approved',
                    background: '#e4f0ff',
                    border: 'var(--primary)',
                    shadow: 'var(--primary-dark)',
                }
            case 'flagged':
                return {
                    label: 'Flagged',
                    background: '#ffe6e6',
                    border: 'var(--red)',
                    shadow: 'var(--red-dark)',
                }
            default:
                return {
                    label: 'Pending',
                    background: '#fff8e1',
                    border: 'var(--gold)',
                    shadow: 'var(--gold-stroke)',
                }
        }
    }

    // Revenue management functions
    const fetchRevenue = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                limit: '50',
                offset: ((revenuePage - 1) * 50).toString(),
                ...(revenueTypeFilter !== 'all' && { type: revenueTypeFilter })
            })
            const response = await apiClient.get(`/api/admin/revenue?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch revenue')
            }
            const data = await response.json()
            if (data.success && data.totalRevenue !== undefined) {
                setRevenueData({
                    totalRevenue: data.totalRevenue || 0,
                    availableRevenue: data.availableRevenue || 0,
                    summary: data.summary || {
                        purchase: 0,
                        ton_purchase: 0,
                        redemption_fee: 0,
                        withdrawal: 0,
                        battle_fee: 0,
                    },
                    history: data.history || [],
                })
            } else {
                setRevenueData({
                    totalRevenue: 0,
                    availableRevenue: 0,
                    summary: {
                        purchase: 0,
                        ton_purchase: 0,
                        redemption_fee: 0,
                        withdrawal: 0,
                        battle_fee: 0,
                    },
                    history: [],
                })
            }
            } catch {
                console.error('Failed to fetch revenue')
            onShowToast('Failed to load revenue data')
            setRevenueData({
                totalRevenue: 0,
                availableRevenue: 0,
                    summary: {
                        purchase: 0,
                        ton_purchase: 0,
                        redemption_fee: 0,
                        battle_fee: 0,
                        withdrawal: 0,
                    },
                history: [],
            })
        } finally {
            setLoading(false)
        }
    }

    const handleWithdrawRevenue = async () => {
        if (!withdrawalModal.amount || parseInt(withdrawalModal.amount) <= 0) {
            onShowToast('⚠️ Please enter a valid amount')
            return
        }

        if (!revenueData) {
            onShowToast('⚠️ Revenue data not loaded')
            return
        }

        const amount = parseInt(withdrawalModal.amount)
        if (amount > (revenueData.availableRevenue ?? 0)) {
            onShowToast(`⚠️ Insufficient revenue. Available: ${revenueData.availableRevenue ?? 0} stars`)
            return
        }

        try {
            const response = await apiClient.post('/api/admin/revenue', {
                amount,
                note: withdrawalModal.note || null
            })

            if (response.ok) {
                const data = await response.json()
                onShowToast(`✅ ${data.message}`)
                setWithdrawalModal({ isOpen: false, amount: '', note: '' })
                fetchRevenue()
            } else {
                const data = await response.json()
                onShowToast(data.error || 'Failed to withdraw revenue')
            }
        } catch (error) {
            console.error('Failed to withdraw revenue:', error)
            onShowToast('Failed to withdraw revenue')
        }
    }

    const getRevenueTypeLabel = (type: string) => {
        switch (type) {
            case 'purchase': return 'Stars Purchase'
            case 'ton_purchase': return 'TON Purchase'
            case 'redemption_fee': return 'Redemption Fee'
            case 'withdrawal': return 'Withdrawal'
            case 'battle_fee': return 'Battle Fee'
            default: return type
        }
    }

    const getRevenueTypeColor = (type: string) => {
        switch (type) {
            case 'purchase': return 'var(--green)'
            case 'ton_purchase': return 'var(--orange)'
            case 'redemption_fee': return 'var(--primary)'
            case 'withdrawal': return 'var(--red)'
            case 'battle_fee': return 'var(--purple)'
            default: return 'var(--gray)'
        }
    }

    const formatNumber = (num: number) => {
        return num.toLocaleString()
    }

    const renderTabButton = (onClick: () => void, isActive: boolean, icon: string, label: string, count?: number) => (
        <button
            onClick={onClick}
            className={`flex-1 py-3 px-2 rounded-[15px] font-bold text-xs uppercase transition-all duration-200 border-4 ${
                isActive ? 'border-primary text-white' : 'border-transparent text-secondary'
            }`}
            style={{
                background: isActive ? 'var(--primary)' : 'transparent',
                boxShadow: isActive ? '0 4px 0 var(--primary-dark), 0 8px 15px rgba(52, 152, 219, 0.3)' : 'none',
                textShadow: isActive ? '1px 1px 0 rgba(0,0,0,0.2)' : 'none'
            }}
            onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.9) translateY(2px)'
                e.currentTarget.style.transition = 'transform 0.1s ease'
            }}
            onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                e.currentTarget.style.transition = 'transform 0.2s ease'
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9) translateY(2px)'
                e.currentTarget.style.transition = 'transform 0.1s ease'
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                e.currentTarget.style.transition = 'transform 0.2s ease'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                e.currentTarget.style.transition = 'transform 0.2s ease'
            }}
        >
            <i className={`fas ${icon} mr-1`}></i>
            {label}{count !== undefined && ` (${count})`}
        </button>
    )

    return (
        <>
            {/* Sticky Header */}
            <div
                className="sticky top-0 z-40 text-center py-4 px-5 border-b-[5px]"
                style={{
                    background: 'var(--purple)',
                    borderBottomColor: 'var(--purple-dark)',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                    paddingTop: 'calc(15px + env(safe-area-inset-top))'
                }}
            >
                <h2
                    className="text-2xl font-bold text-white flex items-center justify-center gap-2"
                    style={{
                        textShadow: '2px 2px 0 var(--purple-dark)'
                    }}
                >
                    <i className="fas fa-shield-alt text-3xl"></i>
                    ADMIN PANEL
                </h2>
            </div>

            <div className="p-5 space-y-5">
                {/* Main Category Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setMainCategory('users')}
                        className={`flex-1 py-4 px-4 rounded-[20px] font-bold text-base uppercase transition-all duration-200 border-4 ${
                            mainCategory === 'users' ? 'border-purple text-white' : 'border-gray-300 text-secondary'
                        }`}
                        style={{
                            background: mainCategory === 'users' ? 'var(--purple)' : 'white',
                            boxShadow: mainCategory === 'users' 
                                ? '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)' 
                                : '0 4px 0 rgba(0,0,0,0.1)',
                            textShadow: mainCategory === 'users' ? '2px 2px 0 var(--purple-dark)' : 'none'
                        }}
                    >
                        <i className="fas fa-users mr-2"></i>
                        Users
                    </button>
                    <button
                        onClick={() => setMainCategory('games')}
                        className={`flex-1 py-4 px-4 rounded-[20px] font-bold text-base uppercase transition-all duration-200 border-4 ${
                            mainCategory === 'games' ? 'border-purple text-white' : 'border-gray-300 text-secondary'
                        }`}
                        style={{
                            background: mainCategory === 'games' ? 'var(--purple)' : 'white',
                            boxShadow: mainCategory === 'games' 
                                ? '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)' 
                                : '0 4px 0 rgba(0,0,0,0.1)',
                            textShadow: mainCategory === 'games' ? '2px 2px 0 var(--purple-dark)' : 'none'
                        }}
                    >
                        <i className="fas fa-gamepad mr-2"></i>
                        Games
                    </button>
                    <button
                        onClick={() => setMainCategory('revenues')}
                        className={`flex-1 py-4 px-4 rounded-[20px] font-bold text-base uppercase transition-all duration-200 border-4 ${
                            mainCategory === 'revenues' ? 'border-purple text-white' : 'border-gray-300 text-secondary'
                        }`}
                        style={{
                            background: mainCategory === 'revenues' ? 'var(--purple)' : 'white',
                            boxShadow: mainCategory === 'revenues' 
                                ? '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)' 
                                : '0 4px 0 rgba(0,0,0,0.1)',
                            textShadow: mainCategory === 'revenues' ? '2px 2px 0 var(--purple-dark)' : 'none'
                        }}
                    >
                        <i className="fas fa-dollar-sign mr-2"></i>
                        Revenues
                    </button>
                </div>

                {/* Sub-tabs */}
                {mainCategory === 'users' && (
                    <div className="flex gap-2 bg-white rounded-[20px] p-2 border-4 border-purple overflow-x-auto" style={{
                        boxShadow: '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)'
                    }}>
                        {renderTabButton(() => setUserTab('users'), userTab === 'users', 'fa-users', 'Users', allUsers.length)}
                        {renderTabButton(() => setUserTab('admins'), userTab === 'admins', 'fa-shield-alt', 'Admins', admins.length)}
                        {renderTabButton(() => setUserTab('redemptions'), userTab === 'redemptions', 'fa-star', 'Redemptions', redemptions.length)}
                        {renderTabButton(() => setUserTab('flagged'), userTab === 'flagged', 'fa-flag', 'Flagged', flaggedUsers.length)}
                        {renderTabButton(() => setUserTab('bans'), userTab === 'bans', 'fa-ban', 'Bans', bannedUsers.length)}
                        {renderTabButton(() => setUserTab('logs'), userTab === 'logs', 'fa-list', 'Logs', abuseLogs.length)}
                    </div>
                )}

                {mainCategory === 'games' && (
                    <div className="flex gap-2 bg-white rounded-[20px] p-2 border-4 border-purple" style={{
                        boxShadow: '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)'
                    }}>
                        {renderTabButton(() => setGameTab('sessions'), gameTab === 'sessions', 'fa-play-circle', 'Sessions', gameSessions.length)}
                        {renderTabButton(() => setGameTab('battles'), gameTab === 'battles', 'fa-trophy', 'Battles', battles.length)}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto"
                            style={{ borderColor: 'var(--purple)' }}
                        ></div>
                        <p className="text-purple mt-3 font-bold">Loading...</p>
                    </div>
                )}

                {/* USERS CONTENT */}
                {!loading && mainCategory === 'users' && userTab === 'users' && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white rounded-[25px] p-4 border-4 border-primary"
                            style={{
                                boxShadow: '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)'
                            }}
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by name, username, or Telegram ID..."
                                    value={usersSearch}
                                    onChange={(e) => {
                                        setUsersSearch(e.target.value)
                                        setUsersPage(1)
                                    }}
                                    className="flex-1 px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold"
                                    style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                />
                                <button
                                    onClick={() => {
                                        setUsersSearch('')
                                        setUsersPage(1)
                                    }}
                                    className="px-4 py-3 rounded-[15px] border-4 border-gray-300 font-bold"
                                    style={{
                                        background: 'white',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-xl px-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                                <i className="fas fa-users"></i>
                                All Users ({allUsers.length})
                            </h3>
                            {allUsers.length === 0 ? (
                                <div className="bg-white rounded-[25px] p-8 text-center border-4 border-gray-300"
                                    style={{
                                        boxShadow: '0 6px 0 rgba(0,0,0,0.1), 0 12px 20px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="fas fa-inbox text-6xl mb-3 text-gray-400"></i>
                                    <p className="text-secondary font-bold">No users found</p>
                                </div>
                            ) : (
                                <>
                                    {allUsers.map((user) => (
                                        <div
                                            key={String(user.id)}
                                            onClick={() => setSelectedUser(user)}
                                            className="bg-white rounded-[25px] p-5 border-4 border-primary cursor-pointer transition-all active:scale-95"
                                            style={{
                                                boxShadow: '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)'
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-bold text-lg text-primary">
                                                        {String(user.firstName || 'Unknown')} {user.username ? `(@${String(user.username)})` : null}
                                                    </div>
                                                    <div className="text-xs text-secondary">ID: {String(user.telegramId || '')}</div>
                                                    {Boolean(user.isBanned) && (
                                                        <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold border-3"
                                                            style={{
                                                                background: 'var(--red)',
                                                                borderColor: 'var(--red-dark)',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            🚫 BANNED
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-primary">
                                                        {Number(user.points) || 0} pts
                                                    </div>
                                                    <div className="text-xs text-secondary">
                                                        Games: {Number(user.totalGamesPlayed) || 0}
                                                    </div>
                                                    {(Number(user.abuseScore) || 0) > 0 && (
                                                        <div className="mt-1 text-xs font-bold text-orange">
                                                            ⚠️ Score: {Number(user.abuseScore) || 0}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Pagination */}
                                    {usersTotalPages > 1 && (
                                        <div className="flex justify-center gap-2 mt-4">
                                            <button
                                                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                                disabled={usersPage === 1}
                                                className="px-4 py-2 rounded-full border-4 font-bold disabled:opacity-50"
                                                style={{
                                                    background: usersPage === 1 ? 'var(--gray-disabled)' : 'var(--primary)',
                                                    borderColor: usersPage === 1 ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)',
                                                    color: 'white',
                                                    boxShadow: `0 4px 0 ${usersPage === 1 ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)'}`
                                                }}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                            <div className="px-4 py-2 font-bold" style={{ color: 'var(--primary)' }}>
                                                Page {usersPage} of {usersTotalPages}
                                            </div>
                                            <button
                                                onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                                                disabled={usersPage === usersTotalPages}
                                                className="px-4 py-2 rounded-full border-4 font-bold disabled:opacity-50"
                                                style={{
                                                    background: usersPage === usersTotalPages ? 'var(--gray-disabled)' : 'var(--primary)',
                                                    borderColor: usersPage === usersTotalPages ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)',
                                                    color: 'white',
                                                    boxShadow: `0 4px 0 ${usersPage === usersTotalPages ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)'}`
                                                }}
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {!loading && mainCategory === 'users' && userTab === 'admins' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-bold text-xl flex items-center gap-2" style={{ color: 'var(--purple)' }}>
                                <i className="fas fa-shield-alt"></i>
                                Administrators ({admins.length})
                            </h3>
                            <button
                                onClick={fetchAdmins}
                                className="w-10 h-10 rounded-full border-4 border-purple flex items-center justify-center"
                                style={{
                                    background: 'var(--purple)',
                                    color: 'white',
                                    boxShadow: '0 4px 0 var(--purple-dark), 0 8px 15px rgba(155, 89, 182, 0.3)'
                                }}
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        {admins.length === 0 ? (
                            <div className="bg-white rounded-[25px] p-8 text-center border-4 border-gray-300"
                                style={{
                                    boxShadow: '0 6px 0 rgba(0,0,0,0.1), 0 12px 20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <i className="fas fa-inbox text-6xl mb-3 text-gray-400"></i>
                                <p className="text-secondary font-bold">No admins found</p>
                            </div>
                        ) : (
                            admins.map((admin) => (
                                <div
                                    key={String(admin.id)}
                                    className="bg-white rounded-[25px] p-5 border-4 border-purple"
                                    style={{
                                        boxShadow: '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)'
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-purple flex items-center gap-2">
                                                <i className="fas fa-shield-alt"></i>
                                                {String(admin.firstName || 'Unknown')} {admin.username ? `(@${String(admin.username)})` : null}
                                            </div>
                                            <div className="text-xs text-secondary">ID: {String(admin.telegramId || '')}</div>
                                            {(() => {
                                                const grantedBy = admin.grantedBy
                                                if (!grantedBy || typeof grantedBy !== 'object') return null
                                                const grantedByObj = grantedBy as Record<string, unknown>
                                                return (
                                                <div className="text-xs text-secondary mt-1">
                                                        Granted by: {String(grantedByObj.firstName || grantedByObj.username || 'Unknown')}
                                                </div>
                                                )
                                            })()}
                                            {Boolean(admin.adminGrantedAt) && typeof admin.adminGrantedAt === 'string' && (
                                                <div className="text-xs text-secondary">
                                                    Since: {new Date(admin.adminGrantedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="px-3 py-1 rounded-full text-xs font-bold border-3"
                                                style={{
                                                    background: 'var(--purple)',
                                                    borderColor: 'var(--purple-dark)',
                                                    color: 'white',
                                                    boxShadow: '0 2px 0 var(--purple-dark)'
                                                }}
                                            >
                                                ADMIN
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openRevokeAdminModal(String(admin.id), String(admin.firstName || admin.username || 'Unknown'))}
                                        className="w-full py-3 px-4 rounded-full text-white font-bold text-sm uppercase border-4 border-red"
                                        style={{
                                            background: 'var(--red)',
                                            boxShadow: '0 4px 0 var(--red-dark), 0 8px 15px rgba(231, 76, 60, 0.3)',
                                            textShadow: '1px 1px 0 var(--red-dark)'
                                        }}
                                    >
                                        <i className="fas fa-user-times mr-2"></i>
                                        Revoke Admin
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!loading && mainCategory === 'users' && userTab === 'redemptions' && (
                    <div className="space-y-4">
                        <div
                            className="bg-white rounded-[25px] p-4 border-4 border-[var(--gold)]"
                            style={{
                                boxShadow: '0 6px 0 var(--gold-stroke), 0 12px 20px rgba(254, 184, 0, 0.35)',
                            }}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search by username or Telegram ID..."
                                        value={redemptionsSearch}
                                        onChange={(e) => {
                                            setRedemptionsSearch(e.target.value)
                                            setRedemptionsPage(1)
                                        }}
                                        className="flex-1 px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-[var(--gold)] outline-none font-semibold"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.08)' }}
                                    />
                                    <button
                                        onClick={() => {
                                            setRedemptionsSearch('')
                                            setRedemptionsPage(1)
                                        }}
                                        className="px-4 py-3 rounded-[15px] border-4 border-gray-300 font-bold"
                                        style={{
                                            background: 'white',
                                            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
                                        }}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['pending', 'approved', 'completed', 'flagged', 'all'].map((status) => {
                                        const isActive = redemptionStatus === status
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setRedemptionStatus(status as typeof redemptionStatus)
                                                    setRedemptionsPage(1)
                                                }}
                                                className="flex-1 min-w-[90px] py-2 px-3 rounded-[15px] font-bold text-xs uppercase border-4 transition-all duration-150"
                                                style={{
                                                    background: isActive ? 'var(--gold)' : 'white',
                                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                                    borderColor: isActive ? 'var(--gold-stroke)' : 'var(--gray-border)',
                                                    boxShadow: isActive ? '0 4px 0 var(--gold-stroke)' : '0 4px 0 rgba(0,0,0,0.05)',
                                                }}
                                            >
                                                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {redemptions.length === 0 && (
                                <div
                                    className="text-center py-10 px-4 rounded-[25px] border-4 border-gray-200 bg-white"
                                    style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.05)' }}
                                >
                                    <p className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>
                                        No redemptions found
                                    </p>
                                    <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
                                        Adjust the filters or check again later.
                                    </p>
                                </div>
                            )}

                            {redemptions.map((entry) => {
                                const statusMeta = getRedemptionStatusStyle(entry.status)
                                return (
                                    <div
                                        key={String(entry.id)}
                                        className="bg-white rounded-[25px] p-4 border-4"
                                        style={{
                                            borderColor: statusMeta.border,
                                            boxShadow: `0 8px 0 ${statusMeta.shadow}, 0 16px 24px rgba(0,0,0,0.08)`,
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-2xl font-black" style={{ color: statusMeta.border }}>
                                                    {entry.stars.toLocaleString()} ⭐
                                                </div>
                                                <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                    {new Date(String(entry.createdAt || '')).toLocaleString()}
                                                </div>
                                                <div className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-light)' }}>
                                                    {formatNumber(entry.points)} points deducted • Rate {entry.conversionRate}:1
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2"
                                                    style={{
                                                        background: statusMeta.background,
                                                        borderColor: statusMeta.border,
                                                        color: statusMeta.border,
                                                    }}
                                                >
                                                    {statusMeta.label}
                                                </div>
                                                {entry.flaggedReason && (
                                                    <div className="text-[11px] font-semibold text-red-500 mt-2 max-w-[160px]">
                                                        {entry.flaggedReason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center border-4"
                                                    style={{ borderColor: 'var(--gold)' }}
                                                >
                                                    <i className="fas fa-user text-xl" style={{ color: 'var(--gold-stroke)' }}></i>
                                                </div>
                                                <div>
                                                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                                        {entry.user?.firstName || entry.user?.username || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        @{entry.user?.username || entry.user?.telegramId || 'n/a'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setRedemptionReview({
                                                        isOpen: true,
                                                        redemption: entry,
                                                        approvalNote: '',
                                                        flagReason: '',
                                                        severity: 'high',
                                                    })
                                                }}
                                                className="py-3 px-4 rounded-[15px] font-bold text-sm uppercase border-4 border-[var(--gold-stroke)] text-white"
                                                style={{
                                                    background: 'var(--gold)',
                                                    textShadow: '1px 1px 0 var(--gold-stroke)',
                                                    boxShadow: '0 4px 0 var(--gold-stroke)',
                                                }}
                                            >
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {redemptions.length > 0 && (
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => setRedemptionsPage((prev) => Math.max(1, prev - 1))}
                                    disabled={redemptionsPage === 1}
                                    className="flex-1 py-3 rounded-[15px] font-bold border-4 border-gray-300 disabled:opacity-50"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <i className="fas fa-arrow-left mr-1"></i>
                                    Prev
                                </button>
                                <button
                                    onClick={() => setRedemptionsPage((prev) => prev + 1)}
                                    disabled={!redemptionsHasMore}
                                    className="flex-1 py-3 rounded-[15px] font-bold border-4 border-[var(--gold-stroke)] text-white disabled:opacity-50"
                                    style={{
                                        background: 'var(--gold)',
                                        boxShadow: '0 4px 0 var(--gold-stroke)',
                                    }}
                                >
                                    Next
                                    <i className="fas fa-arrow-right ml-1"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!loading && mainCategory === 'users' && userTab === 'flagged' && (
                    <div className="space-y-4">
                        {flaggedUsers.length === 0 ? (
                            <div className="bg-white rounded-[25px] p-8 text-center border-4 border-green"
                                style={{
                                    boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)'
                                }}
                            >
                                <i className="fas fa-check-circle text-6xl mb-3" style={{ color: 'var(--green)' }}></i>
                                <p className="text-secondary font-bold text-lg">All Clear!</p>
                                <p className="text-secondary text-sm mt-1">No flagged users</p>
                            </div>
                        ) : (
                            flaggedUsers.map((user) => (
                                <div key={String(user.id)} className="bg-white rounded-[25px] p-5 border-4 border-orange"
                                    style={{
                                        boxShadow: '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)'
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-primary">
                                                {user.firstName || 'Unknown'} {user.username ? `(@${user.username})` : ''}
                                            </div>
                                            <div className="text-xs text-secondary">ID: {user.telegramId}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-red">
                                                Score: {user.abuseScore}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {user.recentLogs.length > 0 && (
                                        <div className="mt-3 pt-3 border-t-2 border-gray-100">
                                            <div className="text-xs font-bold text-secondary mb-2">Recent Activity:</div>
                                            {user.recentLogs.slice(0, 3).map((log) => (
                                                <div key={String(log.id)} className="text-xs text-secondary mb-1 flex items-start gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                                                        style={{ backgroundColor: getSeverityColor(log.severity) }}
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-semibold">{log.type}:</span> {log.description}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            setBanUserId(user.id)
                                            setUserTab('bans')
                                        }}
                                        className="mt-3 w-full py-3 px-4 rounded-full text-white font-bold text-sm uppercase border-4 border-red"
                                        style={{
                                            background: 'var(--red)',
                                            boxShadow: '0 4px 0 var(--red-dark), 0 8px 15px rgba(231, 76, 60, 0.3)',
                                            textShadow: '1px 1px 0 var(--red-dark)'
                                        }}
                                    >
                                        <i className="fas fa-ban mr-2"></i>
                                        Ban User
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!loading && mainCategory === 'users' && userTab === 'bans' && (
                    <div className="space-y-4">
                        {/* Ban User Form */}
                        <div className="bg-white rounded-[25px] p-5 border-4 border-red"
                            style={{
                                boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)'
                            }}
                        >
                            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--red)' }}>
                                <i className="fas fa-gavel"></i>
                                Ban User
                            </h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="User ID"
                                    value={banUserId}
                                    onChange={(e) => setBanUserId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-red outline-none font-semibold"
                                    style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Reason"
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-red outline-none font-semibold"
                                    style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Hours (leave empty for permanent)"
                                    value={banHours}
                                    onChange={(e) => setBanHours(e.target.value)}
                                    className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-red outline-none font-semibold"
                                    style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                />
                                <button
                                    onClick={handleBanUser}
                                    className="w-full py-4 px-6 rounded-full text-white font-bold uppercase border-4 border-red"
                                    style={{
                                        background: 'var(--red)',
                                        boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                        textShadow: '2px 2px 0 var(--red-dark)'
                                    }}
                                >
                                    <i className="fas fa-ban mr-2"></i>
                                    Ban User
                                </button>
                            </div>
                        </div>

                        {/* Banned Users List */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-xl px-2 flex items-center gap-2" style={{ color: 'var(--red)' }}>
                                <i className="fas fa-list"></i>
                                Banned Users ({bannedUsers.length})
                            </h3>
                            {bannedUsers.length === 0 ? (
                                <div className="bg-white rounded-[25px] p-8 text-center border-4 border-green"
                                    style={{
                                        boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)'
                                    }}
                                >
                                    <i className="fas fa-check-circle text-6xl mb-3" style={{ color: 'var(--green)' }}></i>
                                    <p className="text-secondary font-bold">No banned users</p>
                                </div>
                            ) : (
                                bannedUsers.map((user) => (
                                    <div key={String(user.id)} className="bg-white rounded-[25px] p-5 border-4 border-red"
                                        style={{
                                            boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)'
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-primary">
                                                    {user.firstName || 'Unknown'} {user.username ? `(@${user.username})` : ''}
                                                </div>
                                                <div className="text-xs text-secondary">ID: {user.telegramId}</div>
                                            </div>
                                            <div className="text-xs text-red font-bold">
                                                {user.isPermanent ? 'PERMANENT' : 'TEMPORARY'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-secondary mb-2">
                                            <strong>Reason:</strong> {user.bannedReason}
                                        </div>
                                        {!user.isPermanent && user.bannedUntil && (
                                            <div className="text-xs text-secondary mb-3">
                                                Until: {new Date(user.bannedUntil).toLocaleString()}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleUnbanUser(user.id)}
                                            className="w-full py-3 px-4 rounded-full text-white font-bold text-sm uppercase border-4 border-green"
                                            style={{
                                                background: 'var(--green)',
                                                boxShadow: '0 4px 0 var(--green-dark), 0 8px 15px rgba(46, 204, 113, 0.3)',
                                                textShadow: '1px 1px 0 var(--green-dark)'
                                            }}
                                        >
                                            <i className="fas fa-check mr-2"></i>
                                            Unban
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {!loading && mainCategory === 'users' && userTab === 'logs' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-bold text-xl flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                                <i className="fas fa-clipboard-list"></i>
                                Recent Logs (48h)
                            </h3>
                            <button
                                onClick={fetchAbuseLogs}
                                className="w-10 h-10 rounded-full border-4 border-primary flex items-center justify-center"
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    boxShadow: '0 4px 0 var(--primary-dark), 0 8px 15px rgba(52, 152, 219, 0.3)'
                                }}
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        {abuseLogs.length === 0 ? (
                            <div className="bg-white rounded-[25px] p-8 text-center border-4 border-green"
                                style={{
                                    boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)'
                                }}
                            >
                                <i className="fas fa-check-circle text-6xl mb-3" style={{ color: 'var(--green)' }}></i>
                                <p className="text-secondary font-bold">All Clear!</p>
                                <p className="text-secondary text-sm mt-1">No abuse logs</p>
                            </div>
                        ) : (
                            abuseLogs.map((log) => (
                                <div key={String(log.id)} className="bg-white rounded-[25px] p-4 border-4"
                                    style={{
                                        borderColor: getSeverityColor(log.severity),
                                        boxShadow: `0 6px 0 ${getSeverityColor(log.severity)}aa, 0 12px 20px ${getSeverityColor(log.severity)}33`
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full mt-1 shrink-0"
                                            style={{ backgroundColor: getSeverityColor(log.severity) }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-sm text-primary">
                                                    {log.type}
                                                </div>
                                                <div className="text-xs text-secondary">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            {log.user && (
                                                <div className="text-xs text-secondary mb-1">
                                                    {log.user.firstName || 'Unknown'} {log.user.username ? `(@${log.user.username})` : ''} - ID: {log.user.telegramId}
                                                </div>
                                            )}
                                            <div className="text-sm text-secondary">
                                                {log.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* GAMES CONTENT */}
                {!loading && mainCategory === 'games' && gameTab === 'sessions' && (
                    <div className="space-y-3">
                        {/* Search Bar */}
                        <div className="bg-white rounded-[25px] p-4 border-4 border-primary"
                            style={{
                                boxShadow: '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)'
                            }}
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by user name, username, or Telegram ID..."
                                    value={sessionsSearch}
                                    onChange={(e) => {
                                        setSessionsSearch(e.target.value)
                                        setSessionsPage(1)
                                    }}
                                    className="flex-1 px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold"
                                    style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                />
                                <button
                                    onClick={() => {
                                        setSessionsSearch('')
                                        setSessionsPage(1)
                                    }}
                                    className="px-4 py-3 rounded-[15px] border-4 border-gray-300 font-bold"
                                    style={{
                                        background: 'white',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-bold text-xl flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                                <i className="fas fa-play-circle"></i>
                                Game Sessions ({gameSessions.length})
                            </h3>
                            <button
                                onClick={fetchGameSessions}
                                className="w-10 h-10 rounded-full border-4 border-primary flex items-center justify-center"
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    boxShadow: '0 4px 0 var(--primary-dark), 0 8px 15px rgba(52, 152, 219, 0.3)'
                                }}
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        {gameSessions.length === 0 ? (
                            <div className="bg-white rounded-[25px] p-8 text-center border-4 border-gray-300"
                                style={{
                                    boxShadow: '0 6px 0 rgba(0,0,0,0.1), 0 12px 20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <i className="fas fa-inbox text-6xl mb-3 text-gray-400"></i>
                                <p className="text-secondary font-bold">No game sessions</p>
                            </div>
                        ) : (
                            gameSessions.map((session) => (
                                <div key={String(session.id)} className="bg-white rounded-[25px] p-5 border-4 border-primary"
                                    style={{
                                        boxShadow: '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)'
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-primary">
                                                {session.user?.firstName || 'Unknown'} {session.user?.username ? `(@${session.user.username})` : ''}
                                            </div>
                                            <div className="text-xs text-secondary">ID: {session.user?.telegramId}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${session.endedAt ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {session.endedAt ? '✓ Completed' : '⏳ Active'}
                                            </div>
                                            <div className="text-xs text-secondary">
                                                Cooldown: {session.cooldownHours}h
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                        <div className="text-secondary">
                                            <strong>Started:</strong> {new Date(session.startedAt).toLocaleString()}
                                        </div>
                                        {session.endedAt && (
                                            <div className="text-secondary">
                                                <strong>Ended:</strong> {new Date(session.endedAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(session.id)
                                                onShowToast('Session ID copied!')
                                            }}
                                            className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-primary"
                                            style={{
                                                background: 'var(--primary)',
                                                boxShadow: '0 3px 0 var(--primary-dark)',
                                                textShadow: '1px 1px 0 var(--primary-dark)'
                                            }}
                                        >
                                            <i className="fas fa-copy mr-1"></i>
                                            Copy ID
                                        </button>
                                        <button
                                            onClick={() => openDeleteSessionModal(session.id)}
                                            className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-red transition-all"
                                            style={{
                                                background: 'var(--red)',
                                                boxShadow: '0 3px 0 var(--red-dark)',
                                                textShadow: '1px 1px 0 var(--red-dark)'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark)'
                                            }}
                                            onMouseDown={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark)'
                                            }}
                                            onMouseUp={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark)'
                                            }}
                                        >
                                            <i className="fas fa-trash mr-1"></i>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {/* Pagination */}
                        {gameSessions.length > 0 && sessionsTotalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button
                                    onClick={() => setSessionsPage(p => Math.max(1, p - 1))}
                                    disabled={sessionsPage === 1}
                                    className="px-4 py-2 rounded-full border-4 font-bold disabled:opacity-50"
                                    style={{
                                        background: sessionsPage === 1 ? 'var(--gray-disabled)' : 'var(--primary)',
                                        borderColor: sessionsPage === 1 ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)',
                                        color: 'white',
                                        boxShadow: `0 4px 0 ${sessionsPage === 1 ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)'}`
                                    }}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="px-4 py-2 font-bold" style={{ color: 'var(--primary)' }}>
                                    Page {sessionsPage} of {sessionsTotalPages}
                                </div>
                                <button
                                    onClick={() => setSessionsPage(p => Math.min(sessionsTotalPages, p + 1))}
                                    disabled={sessionsPage === sessionsTotalPages}
                                    className="px-4 py-2 rounded-full border-4 font-bold disabled:opacity-50"
                                    style={{
                                        background: sessionsPage === sessionsTotalPages ? 'var(--gray-disabled)' : 'var(--primary)',
                                        borderColor: sessionsPage === sessionsTotalPages ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)',
                                        color: 'white',
                                        boxShadow: `0 4px 0 ${sessionsPage === sessionsTotalPages ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)'}`
                                    }}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!loading && mainCategory === 'games' && gameTab === 'battles' && (
                    <div className="space-y-3">
                        <div className="flex justify-end items-center px-2 gap-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={openCreateBattleModal}
                                    className="px-2 py-1 rounded-full border-2 border-green flex items-center gap-1 font-bold text-xs uppercase"
                                    style={{
                                        background: 'var(--green)',
                                        color: 'white',
                                        boxShadow: '0 2px 0 var(--green-dark), 0 4px 8px rgba(46, 204, 113, 0.3)',
                                        textShadow: '1px 1px 0 var(--green-dark)'
                                    }}
                                >
                                    <i className="fas fa-plus text-xs"></i>
                                    New
                                </button>
                                <button
                                    onClick={handleGenerateBattles}
                                    disabled={generatingBattles || resolvingBattles}
                                    className="px-2 py-1 rounded-full border-2 border-purple flex items-center gap-1 font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'var(--purple)',
                                        color: 'white',
                                        boxShadow: generatingBattles 
                                            ? '0 1px 0 var(--purple-dark), 0 2px 4px rgba(155, 89, 182, 0.2)'
                                            : '0 2px 0 var(--purple-dark), 0 4px 8px rgba(155, 89, 182, 0.3)',
                                        textShadow: '1px 1px 0 var(--purple-dark)'
                                    }}
                                >
                                    <i className={`fas ${generatingBattles ? 'fa-spinner fa-spin' : 'fa-magic'} text-xs`}></i>
                                    {generatingBattles ? 'Generating...' : 'Generate'}
                                </button>
                                <button
                                    onClick={handleResolveBattles}
                                    disabled={resolvingBattles || generatingBattles}
                                    className="px-2 py-1 rounded-full border-2 border-green flex items-center gap-1 font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'var(--green)',
                                        color: 'white',
                                        boxShadow: resolvingBattles 
                                            ? '0 1px 0 var(--green-dark), 0 2px 4px rgba(46, 204, 113, 0.2)'
                                            : '0 2px 0 var(--green-dark), 0 4px 8px rgba(46, 204, 113, 0.3)',
                                        textShadow: '1px 1px 0 var(--green-dark)'
                                    }}
                                >
                                    <i className={`fas ${resolvingBattles ? 'fa-spinner fa-spin' : 'fa-check-circle'} text-xs`}></i>
                                    {resolvingBattles ? 'Resolving...' : 'Resolve'}
                                </button>
                                <button
                                    onClick={fetchBattles}
                                    className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center"
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        boxShadow: '0 2px 0 var(--primary-dark), 0 4px 8px rgba(52, 152, 219, 0.3)'
                                    }}
                                >
                                    <i className="fas fa-sync-alt text-xs"></i>
                                </button>
                            </div>
                        </div>
                        
                        {/* Search Bar for Battles */}
                        <div className="px-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search battles by name, team, league, or sport..."
                                    value={battlesSearch}
                                    onChange={(e) => setBattlesSearch(e.target.value)}
                                    className="w-full bg-white rounded-[15px] px-4 py-3 pr-10 text-primary font-semibold border-4 border-primary focus:outline-none"
                                    style={{
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                        caretColor: '#000',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                        
                        {(() => {
                            // Filter battles based on search
                            const filteredBattles = battles.filter(battle => {
                                if (!battlesSearch.trim()) return true
                                const search = battlesSearch.toLowerCase()
                                const name = (battle.name || '').toLowerCase()
                                const team1 = (battle.team1 || '').toLowerCase()
                                const team2 = (battle.team2 || '').toLowerCase()
                                const sport = (battle.sport || '').toLowerCase()
                                const league = (battle.league || '').toLowerCase()
                                return name.includes(search) || 
                                       team1.includes(search) || 
                                       team2.includes(search) || 
                                       sport.includes(search) || 
                                       league.includes(search)
                            })
                            
                            return filteredBattles.length === 0 ? (
                                <div className="bg-white rounded-[25px] p-8 text-center border-4 border-gray-300"
                                    style={{
                                        boxShadow: '0 6px 0 rgba(0,0,0,0.1), 0 12px 20px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="fas fa-inbox text-6xl mb-3 text-gray-400"></i>
                                    <p className="text-secondary font-bold">
                                        {battlesSearch.trim() ? `No battles match "${battlesSearch}"` : 'No battles'}
                                    </p>
                                </div>
                            ) : (
                                filteredBattles.map((battle) => (
                                <div key={String(battle.id)} className="bg-white rounded-[25px] p-5 border-4"
                                    style={{
                                        borderColor: getStatusColor(battle.status),
                                        boxShadow: `0 6px 0 ${getStatusColor(battle.status)}aa, 0 12px 20px ${getStatusColor(battle.status)}33`
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-primary mb-1">
                                                {battle.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-secondary">
                                                {battle.team1Logo && (
                                                    <img 
                                                        src={battle.team1Logo} 
                                                        alt={battle.team1}
                                                        className="w-6 h-6 object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                        }}
                                                    />
                                                )}
                                                <span className={battle.team1.length > 15 ? 'truncate max-w-[100px]' : ''} title={battle.team1}>
                                                    {battle.team1.length > 15 ? `${battle.team1.substring(0, 15)}...` : battle.team1}
                                                </span>
                                                <span>vs</span>
                                                <span className={battle.team2.length > 15 ? 'truncate max-w-[100px]' : ''} title={battle.team2}>
                                                    {battle.team2.length > 15 ? `${battle.team2.substring(0, 15)}...` : battle.team2}
                                                </span>
                                                {battle.team2Logo && (
                                                    <img 
                                                        src={battle.team2Logo} 
                                                        alt={battle.team2}
                                                        className="w-6 h-6 object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            {battle.league && (
                                                <div className="flex items-center gap-1 text-xs text-secondary mt-1">
                                                    {battle.leagueLogo && (
                                                        <img 
                                                            src={battle.leagueLogo} 
                                                            alt={battle.league}
                                                            className="w-4 h-4 object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    )}
                                                    <span>{battle.league} {battle.sport && `• ${battle.sport}`}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold uppercase px-2 py-1 rounded-full"
                                                style={{
                                                    background: getStatusColor(battle.status),
                                                    color: 'white'
                                                }}
                                            >
                                                {battle.status === 'open' ? 'open' : battle.status === 'completed' ? 'closed' : battle.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                        <div className="text-secondary">
                                            <strong>Pot:</strong> {battle.potAmount} pts
                                        </div>
                                        <div className="text-secondary">
                                            <strong>Players:</strong> {battle.participantCount || 0}
                                        </div>
                                        <div className="text-secondary col-span-2">
                                            <strong>Event:</strong> {new Date(battle.eventDate).toLocaleString()}
                                        </div>
                                    </div>
                                    {battle.result && (
                                        <div className="text-sm text-secondary mb-3 p-2 rounded-lg bg-gray-100">
                                            <strong>Result:</strong> {battle.result === '1' ? battle.team1 : battle.result === '2' ? battle.team2 : 'Draw'}
                                        </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    {battle.status === 'open' && (battle.participantCount || 0) > 0 ? (
                                        // Battle with participants: Resolve, Cancel, Edit, Copy, Delete
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => openResolveModal(battle)}
                                                    className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-green"
                                                    style={{
                                                        background: 'var(--green)',
                                                        boxShadow: '0 3px 0 var(--green-dark)',
                                                        textShadow: '1px 1px 0 var(--green-dark)'
                                                    }}
                                                >
                                                    <i className="fas fa-check-circle mr-1"></i>
                                                    Resolve
                                                </button>
                                                <button
                                                    onClick={() => openCancelModal(battle)}
                                                    className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-orange"
                                                    style={{
                                                        background: 'var(--orange)',
                                                        boxShadow: '0 3px 0 var(--orange-dark)',
                                                        textShadow: '1px 1px 0 var(--orange-dark)'
                                                    }}
                                                >
                                                    <i className="fas fa-ban mr-1"></i>
                                                    Cancel
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => openEditBattleModal(battle)}
                                                    className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-purple"
                                                    style={{
                                                        background: 'var(--purple)',
                                                        boxShadow: '0 3px 0 var(--purple-dark)',
                                                        textShadow: '1px 1px 0 var(--purple-dark)'
                                                    }}
                                                >
                                                    <i className="fas fa-edit mr-1"></i>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(battle.id)
                                                        onShowToast('Battle ID copied!')
                                                    }}
                                                    className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-primary"
                                                    style={{
                                                        background: 'var(--primary)',
                                                        boxShadow: '0 3px 0 var(--primary-dark)',
                                                        textShadow: '1px 1px 0 var(--primary-dark)'
                                                    }}
                                                >
                                                    <i className="fas fa-copy mr-1"></i>
                                                    Copy ID
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => openDeleteBattleModal(battle.id, battle.name, battle.participantCount || 0)}
                                                className="w-full py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-red transition-all"
                                                style={{
                                                    background: 'var(--red)',
                                                    boxShadow: '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)',
                                                    textShadow: '1px 1px 0 var(--red-dark)'
                                                }}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                    e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark), 0 3px 5px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseDown={(e) => {
                                                    e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                    e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark), 0 3px 5px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseUp={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                            >
                                                <i className="fas fa-trash mr-1"></i>
                                                Delete
                                            </button>
                                        </div>
                                    ) : battle.status === 'open' ? (
                                        // Open battle without participants: Edit, Copy, Delete
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => openEditBattleModal(battle)}
                                                    className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-purple"
                                                    style={{
                                                        background: 'var(--purple)',
                                                        boxShadow: '0 3px 0 var(--purple-dark)',
                                                        textShadow: '1px 1px 0 var(--purple-dark)'
                                                    }}
                                                >
                                                    <i className="fas fa-edit mr-1"></i>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(battle.id)
                                                        onShowToast('Battle ID copied!')
                                                    }}
                                                    className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-primary"
                                                    style={{
                                                        background: 'var(--primary)',
                                                        boxShadow: '0 3px 0 var(--primary-dark)',
                                                        textShadow: '1px 1px 0 var(--primary-dark)'
                                                    }}
                                                >
                                                    <i className="fas fa-copy mr-1"></i>
                                                    Copy ID
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => openDeleteBattleModal(battle.id, battle.name, battle.participantCount || 0)}
                                                className="w-full py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-red transition-all"
                                                style={{
                                                    background: 'var(--red)',
                                                    boxShadow: '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)',
                                                    textShadow: '1px 1px 0 var(--red-dark)'
                                                }}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                    e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark), 0 3px 5px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseDown={(e) => {
                                                    e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                    e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark), 0 3px 5px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseUp={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                            >
                                                <i className="fas fa-trash mr-1"></i>
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        // Closed/Completed battles: Copy, Delete
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(battle.id)
                                                    onShowToast('Battle ID copied!')
                                                }}
                                                className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-primary"
                                                style={{
                                                    background: 'var(--primary)',
                                                    boxShadow: '0 3px 0 var(--primary-dark)',
                                                    textShadow: '1px 1px 0 var(--primary-dark)'
                                                }}
                                            >
                                                <i className="fas fa-copy mr-1"></i>
                                                Copy ID
                                            </button>
                                            <button
                                                onClick={() => openDeleteBattleModal(battle.id, battle.name, battle.participantCount || 0)}
                                                className="py-2 px-3 rounded-full text-white font-bold text-xs uppercase border-4 border-red transition-all"
                                                style={{
                                                    background: 'var(--red)',
                                                    boxShadow: '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)',
                                                    textShadow: '1px 1px 0 var(--red-dark)'
                                                }}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                    e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark), 0 3px 5px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseDown={(e) => {
                                                    e.currentTarget.style.transform = 'scale(0.95) translateY(2px)'
                                                    e.currentTarget.style.boxShadow = '0 1px 0 var(--red-dark), 0 3px 5px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseUp={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                                }}
                                            >
                                                <i className="fas fa-trash mr-1"></i>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                            )
                        })()}
                    </div>
                )}

                {/* Redemption Review Modal */}
                {redemptionReview.isOpen && redemptionReview.redemption && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)',
                        }}
                        onClick={() => {
                            if (!redemptionActionLoading) {
                                closeRedemptionReview()
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-[30px] p-6 max-w-2xl w-full border-4 overflow-y-auto max-h-[90vh]"
                            style={{
                                borderColor: 'var(--gold)',
                                boxShadow: '0 12px 0 var(--gold-stroke), 0 24px 40px rgba(0,0,0,0.4)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-5">
                                <div className="text-5xl mb-3">🔍</div>
                                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--gold)' }}>
                                    Review Redemption
                                </h2>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    Requested {redemptionReview.redemption?.stars.toLocaleString() || 0} ⭐ ({formatNumber(redemptionReview.redemption?.points || 0)} pts)
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div
                                    className="rounded-[20px] border-4 p-4"
                                    style={{
                                        borderColor: 'var(--gold)',
                                        background: '#fff9e6',
                                        boxShadow: '0 4px 0 var(--gold-stroke)',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center border-4"
                                            style={{ borderColor: 'var(--gold)' }}
                                        >
                                            <i className="fas fa-user text-2xl" style={{ color: 'var(--gold-stroke)' }}></i>
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {redemptionReview.redemption.user?.firstName || redemptionReview.redemption.user?.username || 'Unknown'}
                                            </div>
                                            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                @{redemptionReview.redemption.user?.username || redemptionReview.redemption.user?.telegramId || 'n/a'}
                                            </div>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <div
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2"
                                                style={{
                                                    background: getRedemptionStatusStyle(redemptionReview.redemption.status).background,
                                                    borderColor: getRedemptionStatusStyle(redemptionReview.redemption.status).border,
                                                    color: getRedemptionStatusStyle(redemptionReview.redemption.status).border,
                                                }}
                                            >
                                                {getRedemptionStatusStyle(redemptionReview.redemption.status).label}
                                            </div>
                                            <div className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(redemptionReview.redemption.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence Summary */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="rounded-[20px] border-4 border-gray-200 p-4"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}
                                    >
                                        <h3 className="text-sm font-black mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            <i className="fas fa-balance-scale"></i>
                        Evidence Summary
                                        </h3>
                                        <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                                            {formatNumber(redemptionReview.redemption.evidence?.summary?.totalCredits || 0)} pts
                                        </p>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-light)' }}>
                                            Credits in sample ({redemptionReview.redemption.evidence?.summary?.sampleSize || 0} entries)
                                        </p>
                                        <div className="mt-3 space-y-1 max-h-32 overflow-y-auto pr-1">
                                            {Object.entries(redemptionReview.redemption.evidence?.summary?.totalsByType || {}).map(([type, stats]) => (
                                                <div key={type} className="flex justify-between text-xs font-semibold">
                                                    <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
                                                    <span style={{ color: 'var(--text-primary)' }}>{formatNumber(stats.total)} pts</span>
                                                </div>
                                            ))}
                                            {Object.keys(redemptionReview.redemption.evidence?.summary?.totalsByType || {}).length === 0 && (
                                                <p className="text-xs text-secondary">No history available</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-[20px] border-4 border-gray-200 p-4"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}
                                    >
                                        <h3 className="text-sm font-black mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            <i className="fas fa-history"></i>
                                            Last Movements
                                        </h3>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {(redemptionReview.redemption.evidence?.history || []).slice(0, 5).map((entry) => (
                                                <div key={String(entry.id)} className="border-2 border-gray-100 rounded-[12px] px-3 py-2">
                                                    <div className="flex justify-between text-xs font-black" style={{ color: 'var(--text-secondary)' }}>
                                                        <span>{entry.type}</span>
                                                        <span style={{ color: (Number(entry.amount) || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                                            {(Number(entry.amount) || 0) >= 0 ? '+' : ''}{formatNumber(Number(entry.amount) || 0)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-secondary truncate">{String(entry.description || '')}</p>
                                                    <p className="text-[10px] text-light">{new Date(entry.createdAt).toLocaleString()}</p>
                                                </div>
                                            ))}
                                            {(redemptionReview.redemption.evidence?.history || []).length === 0 && (
                                                <p className="text-xs text-secondary">No transactions logged.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-black mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>
                                            Approval note (optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={redemptionReview.approvalNote}
                                            onChange={(e) => setRedemptionReview((prev) => ({ ...prev, approvalNote: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-[var(--gold)] outline-none text-sm"
                                            style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}
                                            placeholder="Add context for the approval..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>
                                            Flag reason (required to flag)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={redemptionReview.flagReason}
                                            onChange={(e) => setRedemptionReview((prev) => ({ ...prev, flagReason: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-red outline-none text-sm"
                                            style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}
                                            placeholder="Explain why this should be investigated..."
                                        />
                                        <div className="flex gap-2 mt-2">
                                            {['high', 'critical'].map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setRedemptionReview((prev) => ({ ...prev, severity: level as 'high' | 'critical' }))}
                                                    className="flex-1 py-2 rounded-[12px] font-bold text-xs uppercase border-4"
                                                    style={{
                                                        background: redemptionReview.severity === level ? 'var(--red)' : 'white',
                                                        color: redemptionReview.severity === level ? 'white' : 'var(--text-secondary)',
                                                        borderColor: redemptionReview.severity === level ? 'var(--red-dark)' : 'var(--gray-border)',
                                                        boxShadow: redemptionReview.severity === level ? '0 4px 0 var(--red-dark)' : '0 4px 0 rgba(0,0,0,0.05)',
                                                    }}
                                                    disabled={redemptionReview.redemption?.status === 'completed'}
                                                >
                                                    {level} severity
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleApproveRedemption}
                                        disabled={redemptionActionLoading || redemptionReview.redemption.status !== 'pending'}
                                        className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-green text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: 'var(--green)',
                                            boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)',
                                            textShadow: '2px 2px 0 var(--green-dark)',
                                        }}
                                    >
                                        {redemptionActionLoading ? (
                                            <span>
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                                Processing...
                                            </span>
                                        ) : (
                                            <span>
                                                <i className="fas fa-check mr-2"></i>
                                                Approve & Mark Completed
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleFlagRedemption}
                                        disabled={redemptionActionLoading || redemptionReview.redemption.status === 'completed'}
                                        className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-red text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: 'var(--red)',
                                            boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                            textShadow: '2px 2px 0 var(--red-dark)',
                                        }}
                                    >
                                        <i className="fas fa-flag mr-2"></i>
                                        Flag as Suspicious
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!redemptionActionLoading) {
                                                closeRedemptionReview()
                                            }
                                        }}
                                        className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                        style={{
                                            background: 'white',
                                            color: 'var(--text-secondary)',
                                            boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resolve Battle Modal */}
                {resolveModal.isOpen && resolveModal.battle && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={closeResolveModal}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4"
                            style={{
                                borderColor: 'var(--purple)',
                                boxShadow: '0 10px 0 var(--purple-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!resolveModal.showConfirmation ? (
                                <>
                                    {/* Question */}
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--purple)' }}>
                                            <i className="fas fa-trophy mr-2"></i>
                                            Who Won?
                                        </h2>
                                        <p className="text-sm text-secondary font-semibold">
                                            {resolveModal.battle.name}
                                        </p>
                                    </div>

                                    {/* Result Options */}
                                    <div className="space-y-3">
                                        {/* Team 1 */}
                                        <button
                                            onClick={() => selectResult('1')}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg border-4 border-primary transition-all"
                                            style={{
                                                background: 'var(--primary)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)',
                                                textShadow: '2px 2px 0 var(--primary-dark)'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(3px)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--primary-dark), 0 6px 10px rgba(52, 152, 219, 0.3)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-trophy mr-2"></i>
                                            {resolveModal.battle.team1}
                                        </button>

                                        {/* Draw */}
                                        <button
                                            onClick={() => selectResult('n')}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg border-4 border-orange transition-all"
                                            style={{
                                                background: 'var(--orange)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)',
                                                textShadow: '2px 2px 0 var(--orange-dark)'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(3px)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--orange-dark), 0 6px 10px rgba(230, 126, 34, 0.3)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-handshake mr-2"></i>
                                            Draw
                                        </button>

                                        {/* Team 2 */}
                                        <button
                                            onClick={() => selectResult('2')}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg border-4 border-secondary transition-all"
                                            style={{
                                                background: 'var(--secondary)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--secondary-dark), 0 12px 20px rgba(46, 204, 113, 0.3)',
                                                textShadow: '2px 2px 0 var(--secondary-dark)'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(3px)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--secondary-dark), 0 6px 10px rgba(46, 204, 113, 0.3)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 0 var(--secondary-dark), 0 12px 20px rgba(46, 204, 113, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-trophy mr-2"></i>
                                            {resolveModal.battle.team2}
                                        </button>
                                    </div>

                                    {/* Cancel Button */}
                                    <button
                                        onClick={closeResolveModal}
                                        className="w-full mt-4 py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                        style={{
                                            background: 'white',
                                            color: 'var(--text-secondary)',
                                            boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Confirmation Screen */}
                                    <div className="text-center mb-6">
                                        <div className="text-6xl mb-4">🏆</div>
                                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--purple)' }}>
                                            Confirm Result
                                        </h2>
                                        <p className="text-sm text-secondary mb-4">
                                            {resolveModal.battle.name}
                                        </p>
                                        <div className="bg-gray-100 rounded-[20px] p-4 mb-4">
                                            <p className="text-lg font-bold text-primary">
                                                Winner: {getResultLabel(resolveModal.selectedResult!, resolveModal.battle)}
                                            </p>
                                        </div>
                                        <p className="text-sm text-secondary">
                                            This will distribute points to all winners immediately.
                                        </p>
                                    </div>

                                    {/* Confirm Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={confirmResolve}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-green"
                                            style={{
                                                background: 'var(--green)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)',
                                                textShadow: '2px 2px 0 var(--green-dark)'
                                            }}
                                        >
                                            <i className="fas fa-check-circle mr-2"></i>
                                            Confirm & Resolve
                                        </button>
                                        <button
                                            onClick={() => setResolveModal(prev => ({ ...prev, showConfirmation: false, selectedResult: null }))}
                                            className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                            style={{
                                                background: 'white',
                                                color: 'var(--text-secondary)',
                                                boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <i className="fas fa-arrow-left mr-2"></i>
                                            Go Back
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Cancel Battle Modal */}
                {cancelModal.isOpen && cancelModal.battle && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={closeCancelModal}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4"
                            style={{
                                borderColor: 'var(--orange)',
                                boxShadow: '0 10px 0 var(--orange-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!cancelModal.showConfirmation ? (
                                <>
                                    {/* Question */}
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--orange)' }}>
                                            <i className="fas fa-exclamation-triangle mr-2"></i>
                                            Cancel Battle?
                                        </h2>
                                        <p className="text-sm text-secondary font-semibold mb-1">
                                            {cancelModal.battle.name}
                                        </p>
                                        <p className="text-xs text-secondary">
                                            All participants will be refunded
                                        </p>
                                    </div>

                                    {/* Reason Options */}
                                    <div className="space-y-3">
                                        {/* Event Cancelled */}
                                        <button
                                            onClick={() => selectCancelReason('Event cancelled')}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg border-4 border-red transition-all"
                                            style={{
                                                background: 'var(--red)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                                textShadow: '2px 2px 0 var(--red-dark)'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(3px)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--red-dark), 0 6px 10px rgba(231, 76, 60, 0.3)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-times-circle mr-2"></i>
                                            Event Cancelled
                                        </button>

                                        {/* Event Postponed */}
                                        <button
                                            onClick={() => selectCancelReason('Event postponed')}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg border-4 border-orange transition-all"
                                            style={{
                                                background: 'var(--orange)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)',
                                                textShadow: '2px 2px 0 var(--orange-dark)'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(3px)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 var(--orange-dark), 0 6px 10px rgba(230, 126, 34, 0.3)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-clock mr-2"></i>
                                            Event Postponed
                                        </button>

                                        {/* Other Reason */}
                                        <button
                                            onClick={() => selectCancelReason('Administrative decision')}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg border-4 border-gray-400 transition-all"
                                            style={{
                                                background: '#95a5a6',
                                                color: 'white',
                                                boxShadow: '0 6px 0 #7f8c8d, 0 12px 20px rgba(149, 165, 166, 0.3)',
                                                textShadow: '2px 2px 0 #7f8c8d'
                                            }}
                                            onTouchStart={(e) => {
                                                e.currentTarget.style.transform = 'scale(0.95) translateY(3px)'
                                                e.currentTarget.style.boxShadow = '0 3px 0 #7f8c8d, 0 6px 10px rgba(149, 165, 166, 0.3)'
                                            }}
                                            onTouchEnd={(e) => {
                                                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 0 #7f8c8d, 0 12px 20px rgba(149, 165, 166, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-info-circle mr-2"></i>
                                            Other Reason
                                        </button>
                                    </div>

                                    {/* Cancel Button */}
                                    <button
                                        onClick={closeCancelModal}
                                        className="w-full mt-4 py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                        style={{
                                            background: 'white',
                                            color: 'var(--text-secondary)',
                                            boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        Go Back
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Confirmation Screen */}
                                    <div className="text-center mb-6">
                                        <div className="text-6xl mb-4">💸</div>
                                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--orange)' }}>
                                            Confirm Cancellation
                                        </h2>
                                        <p className="text-sm text-secondary mb-4">
                                            {cancelModal.battle.name}
                                        </p>
                                        <div className="bg-gray-100 rounded-[20px] p-4 mb-4">
                                            <p className="text-sm font-bold text-secondary mb-2">
                                                Reason: {cancelModal.reason}
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                                {cancelModal.battle.participantCount || 0} player(s) will be refunded
                                            </p>
                                        </div>
                                        <p className="text-sm text-secondary">
                                            All entry fees will be returned immediately to participants' accounts.
                                        </p>
                                    </div>

                                    {/* Confirm Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={confirmCancel}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-orange"
                                            style={{
                                                background: 'var(--orange)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)',
                                                textShadow: '2px 2px 0 var(--orange-dark)'
                                            }}
                                        >
                                            <i className="fas fa-undo mr-2"></i>
                                            Confirm & Refund All
                                        </button>
                                        <button
                                            onClick={() => setCancelModal(prev => ({ ...prev, showConfirmation: false, reason: '' }))}
                                            className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                            style={{
                                                background: 'white',
                                                color: 'var(--text-secondary)',
                                                boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <i className="fas fa-arrow-left mr-2"></i>
                                            Go Back
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* User Detail Modal */}
                {selectedUser && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setSelectedUser(null)}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4 max-h-[90vh] overflow-y-auto"
                            style={{
                                borderColor: 'var(--primary)',
                                boxShadow: '0 10px 0 var(--primary-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">👤</div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
                                    {String((selectedUser.firstName as string | undefined) ?? 'Unknown')}
                                </h2>
                                {(() => {
                                    const username = selectedUser.username
                                    if (!username || typeof username !== 'string') return null
                                    return (
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                                            @{username}
                                    </p>
                                    )
                                })()}
                                <p className="text-xs" style={{ color: 'var(--text-light)' }}>
                                    ID: {String(selectedUser.telegramId || '')}
                                </p>
                            </div>

                            {/* User Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white rounded-[20px] p-4 border-4 border-primary text-center"
                                    style={{ boxShadow: '0 4px 0 var(--primary-dark)' }}
                                >
                                    <div className="text-2xl font-black" style={{ color: 'var(--primary)' }}>
                                        {Number(selectedUser.points) || 0}
                                    </div>
                                    <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                        Points
                                    </div>
                                </div>
                                <div className="bg-white rounded-[20px] p-4 border-4 border-secondary text-center"
                                    style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                >
                                    <div className="text-2xl font-black" style={{ color: 'var(--secondary)' }}>
                                        {Number(selectedUser.totalGamesPlayed) || 0}
                                    </div>
                                    <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                        Games
                                    </div>
                                </div>
                                <div className="bg-white rounded-[20px] p-4 border-4 border-orange text-center"
                                    style={{ boxShadow: '0 4px 0 var(--orange-dark)' }}
                                >
                                    <div className="text-2xl font-black" style={{ color: 'var(--orange)' }}>
                                        {Number(selectedUser.abuseScore) || 0}
                                    </div>
                                    <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                        Abuse Score
                                    </div>
                                </div>
                                <div className="bg-white rounded-[20px] p-4 border-4 border-purple text-center"
                                    style={{ boxShadow: '0 4px 0 var(--purple-dark)' }}
                                >
                                    <div className="text-2xl font-black" style={{ color: 'var(--purple)' }}>
                                        {Number(selectedUser.referralCount) || 0}
                                    </div>
                                    <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                        Referrals
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            {Boolean(selectedUser.isAdmin) && (
                                <div className="mb-4 p-4 rounded-[20px] border-4"
                                    style={{
                                        background: 'var(--purple)',
                                        borderColor: 'var(--purple-dark)',
                                        boxShadow: '0 4px 0 var(--purple-dark)'
                                    }}
                                >
                                    <div className="text-white font-bold text-center flex items-center justify-center gap-2">
                                        <i className="fas fa-shield-alt"></i>
                                        ADMINISTRATOR
                                    </div>
                                </div>
                            )}
                            {Boolean(selectedUser.isBanned) && (
                                <div className="mb-4 p-4 rounded-[20px] border-4"
                                    style={{
                                        background: 'var(--red)',
                                        borderColor: 'var(--red-dark)',
                                        boxShadow: '0 4px 0 var(--red-dark)'
                                    }}
                                >
                                    <div className="text-white font-bold text-center">
                                        🚫 USER IS BANNED
                                    </div>
                                    {(() => {
                                        const reason = selectedUser.bannedReason
                                        if (!reason || typeof reason !== 'string') return null
                                        return (
                                        <div className="text-white text-xs text-center mt-1">
                                                Reason: {reason}
                                        </div>
                                        )
                                    })()}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {/* Admin Management */}
                                {Boolean(selectedUser.isAdmin) ? (
                                    <button
                                        onClick={() => openRevokeAdminModal(String(selectedUser.id), String(selectedUser.firstName || selectedUser.username || 'Unknown'))}
                                        className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-red"
                                        style={{
                                            background: 'var(--red)',
                                            color: 'white',
                                            boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                            textShadow: '2px 2px 0 var(--red-dark)'
                                        }}
                                    >
                                        <i className="fas fa-user-times mr-2"></i>
                                        Revoke Admin
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await apiClient.post('/api/admin/manage-admins', {
                                                    userId: String(selectedUser.id),
                                                    action: 'grant'
                                                })
                                                if (response.ok) {
                                                    onShowToast('✅ Admin status granted')
                                                    setSelectedUser(null)
                                                    fetchAllUsers()
                                                    fetchAdmins()
                                                } else {
                                                    const data = await response.json()
                                                    onShowToast(data.error || 'Failed to grant admin status')
                                                }
                                            } catch {
                                                onShowToast('Failed to grant admin status')
                                            }
                                        }}
                                        className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-purple"
                                        style={{
                                            background: 'var(--purple)',
                                            color: 'white',
                                            boxShadow: '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)',
                                            textShadow: '2px 2px 0 var(--purple-dark)'
                                        }}
                                    >
                                        <i className="fas fa-shield-alt mr-2"></i>
                                        Grant Admin
                                    </button>
                                )}
                                
                                {!Boolean(selectedUser.isBanned) ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setBanUserId(String(selectedUser.id))
                                                setSelectedUser(null)
                                                setUserTab('bans')
                                            }}
                                            className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-red"
                                            style={{
                                                background: 'var(--red)',
                                                color: 'white',
                                                boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                                textShadow: '2px 2px 0 var(--red-dark)'
                                            }}
                                        >
                                            <i className="fas fa-ban mr-2"></i>
                                            Ban User
                                        </button>
                                        {selectedUser.abuseScore === 0 && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await apiClient.post('/api/admin/flag-user', {
                                                            userId: String(selectedUser.id),
                                                            reason: 'Manually flagged by admin'
                                                        })
                                                        if (response.ok) {
                                                            onShowToast('✅ User flagged')
                                                            setSelectedUser(null)
                                                            fetchAllUsers()
                                                        }
                                                    } catch {
                                                        onShowToast('Failed to flag user')
                                                    }
                                                }}
                                                className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-orange"
                                                style={{
                                                    background: 'var(--orange)',
                                                    color: 'white',
                                                    boxShadow: '0 6px 0 var(--orange-dark), 0 12px 20px rgba(230, 126, 34, 0.3)',
                                                    textShadow: '2px 2px 0 var(--orange-dark)'
                                                }}
                                            >
                                                <i className="fas fa-flag mr-2"></i>
                                                Flag User
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await apiClient.post('/api/admin/unban', {
                                                    userId: selectedUser.id
                                                })
                                                if (response.ok) {
                                                    onShowToast('✅ User unbanned')
                                                    setSelectedUser(null)
                                                    fetchAllUsers()
                                                }
                                            } catch {
                                                onShowToast('Failed to unban user')
                                            }
                                        }}
                                        className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-green"
                                        style={{
                                            background: 'var(--green)',
                                            color: 'white',
                                            boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)',
                                            textShadow: '2px 2px 0 var(--green-dark)'
                                        }}
                                    >
                                        <i className="fas fa-check mr-2"></i>
                                        Unban User
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revoke Admin Confirmation Modal */}
                {revokeAdminModal.isOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={closeRevokeAdminModal}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4"
                            style={{
                                borderColor: 'var(--red)',
                                boxShadow: '0 10px 0 var(--red-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">🛡️</div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--red)' }}>
                                    Revoke Admin Status?
                                </h2>
                                {revokeAdminModal.userName && (
                                    <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                        {revokeAdminModal.userName}
                                    </p>
                                )}
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    This user will lose all admin privileges immediately.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleRevokeAdmin}
                                    className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-red"
                                    style={{
                                        background: 'var(--red)',
                                        color: 'white',
                                        boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                        textShadow: '2px 2px 0 var(--red-dark)'
                                    }}
                                >
                                    <i className="fas fa-user-times mr-2"></i>
                                    Yes, Revoke
                                </button>
                                <button
                                    onClick={closeRevokeAdminModal}
                                    className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Battle Confirmation Modal */}
                {deleteBattleModal.isOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={closeDeleteBattleModal}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4"
                            style={{
                                borderColor: 'var(--red)',
                                boxShadow: '0 10px 0 var(--red-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">🗑️</div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--red)' }}>
                                    Delete Battle?
                                </h2>
                                {deleteBattleModal.battleName && (
                                    <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                        {deleteBattleModal.battleName}
                                    </p>
                                )}
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    This action cannot be undone. The battle will be permanently deleted.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleDeleteBattle}
                                    className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-red"
                                    style={{
                                        background: 'var(--red)',
                                        color: 'white',
                                        boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                        textShadow: '2px 2px 0 var(--red-dark)'
                                    }}
                                >
                                    <i className="fas fa-trash mr-2"></i>
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={closeDeleteBattleModal}
                                    className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Session Confirmation Modal */}
                {deleteSessionModal.isOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={closeDeleteSessionModal}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4"
                            style={{
                                borderColor: 'var(--red)',
                                boxShadow: '0 10px 0 var(--red-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">🗑️</div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--red)' }}>
                                    Delete Game Session?
                                </h2>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    This action cannot be undone. The game session will be permanently deleted.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleDeleteSession}
                                    className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-red"
                                    style={{
                                        background: 'var(--red)',
                                        color: 'white',
                                        boxShadow: '0 6px 0 var(--red-dark), 0 12px 20px rgba(231, 76, 60, 0.3)',
                                        textShadow: '2px 2px 0 var(--red-dark)'
                                    }}
                                >
                                    <i className="fas fa-trash mr-2"></i>
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={closeDeleteSessionModal}
                                    className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Battle Form Modal (Create/Edit) */}
                {battleFormModal.isOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={closeBattleFormModal}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4 max-h-[90vh] overflow-y-auto"
                            style={{
                                borderColor: battleFormModal.mode === 'create' ? 'var(--green)' : 'var(--purple)',
                                boxShadow: battleFormModal.mode === 'create' 
                                    ? '0 10px 0 var(--green-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                                    : '0 10px 0 var(--purple-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold mb-2" style={{ 
                                    color: battleFormModal.mode === 'create' ? 'var(--green)' : 'var(--purple)' 
                                }}>
                                    <i className={`fas ${battleFormModal.mode === 'create' ? 'fa-plus-circle' : 'fa-edit'} mr-2`}></i>
                                    {battleFormModal.mode === 'create' ? 'Create Battle' : 'Edit Battle'}
                                </h2>
                                <p className="text-xs text-secondary">
                                    {battleFormModal.mode === 'create' 
                                        ? 'Fill in the details to create a new battle' 
                                        : 'Update battle details (pot amount locked if participants joined)'}
                                </p>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                {/* Battle Name */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Battle Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Man U vs PSG"
                                        value={battleFormModal.formData.name}
                                        onChange={(e) => updateFormData('name', e.target.value)}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                </div>

                                {/* Team 1 */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Team 1 / Option 1 *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Manchester United"
                                        value={battleFormModal.formData.team1}
                                        onChange={(e) => updateFormData('team1', e.target.value)}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                </div>

                                {/* Team 2 */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Team 2 / Option 2 *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., PSG"
                                        value={battleFormModal.formData.team2}
                                        onChange={(e) => updateFormData('team2', e.target.value)}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                </div>

                                {/* Event Date */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Event Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={battleFormModal.formData.eventDate}
                                        onChange={(e) => updateFormData('eventDate', e.target.value)}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                </div>

                                {/* Sport */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Sport *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Football, Basketball"
                                        value={battleFormModal.formData.sport}
                                        onChange={(e) => updateFormData('sport', e.target.value)}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                </div>

                                {/* League */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        League *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Champions League, NBA"
                                        value={battleFormModal.formData.league}
                                        onChange={(e) => updateFormData('league', e.target.value)}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                </div>

                                {/* Pot Amount */}
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Entry Fee (Points) *
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 100"
                                        value={battleFormModal.formData.potAmount}
                                        onChange={(e) => updateFormData('potAmount', e.target.value)}
                                        disabled={battleFormModal.mode === 'edit' && (battleFormModal.battle?.participantCount || 0) > 0}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-primary outline-none font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-black"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)', caretColor: '#000', fontWeight: 'bold' }}
                                    />
                                    {battleFormModal.mode === 'edit' && (battleFormModal.battle?.participantCount || 0) > 0 && (
                                        <p className="text-xs text-orange mt-1">
                                            ⚠️ Cannot change - participants already joined
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 mt-6">
                                <button
                                    onClick={handleSubmitBattle}
                                    className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4"
                                    style={{
                                        background: battleFormModal.mode === 'create' ? 'var(--green)' : 'var(--purple)',
                                        borderColor: battleFormModal.mode === 'create' ? 'var(--green)' : 'var(--purple)',
                                        color: 'white',
                                        boxShadow: battleFormModal.mode === 'create'
                                            ? '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)'
                                            : '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)',
                                        textShadow: battleFormModal.mode === 'create' 
                                            ? '2px 2px 0 var(--green-dark)' 
                                            : '2px 2px 0 var(--purple-dark)'
                                    }}
                                >
                                    <i className={`fas ${battleFormModal.mode === 'create' ? 'fa-plus-circle' : 'fa-save'} mr-2`}></i>
                                    {battleFormModal.mode === 'create' ? 'Create Battle' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={closeBattleFormModal}
                                    className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* REVENUES CONTENT */}
                {!loading && mainCategory === 'revenues' && revenueData && (
                    <div className="space-y-4">
                        {/* Revenue Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Total Revenue */}
                            <div className="bg-white rounded-[25px] p-4 border-4 border-green"
                                style={{
                                    boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)'
                                }}
                            >
                                <div className="text-xs font-bold text-secondary mb-1 uppercase">Total Revenue</div>
                                <div className="text-2xl font-bold" style={{ color: 'var(--green)' }}>
                                    {(revenueData.totalRevenue ?? 0).toLocaleString()} ⭐
                                </div>
                            </div>

                            {/* Available Revenue */}
                            <div className="bg-white rounded-[25px] p-4 border-4 border-primary"
                                style={{
                                    boxShadow: '0 6px 0 var(--primary-dark), 0 12px 20px rgba(52, 152, 219, 0.3)'
                                }}
                            >
                                <div className="text-xs font-bold text-secondary mb-1 uppercase">Available</div>
                                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                                    {(revenueData.availableRevenue ?? 0).toLocaleString()} ⭐
                                </div>
                            </div>
                        </div>

                        {/* Revenue Breakdown */}
                        <div className="bg-white rounded-[25px] p-4 border-4 border-purple"
                            style={{
                                boxShadow: '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)'
                            }}
                        >
                            <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--purple)' }}>
                                <i className="fas fa-chart-pie mr-2"></i>
                                Revenue Breakdown
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-secondary">From Stars Purchases:</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--green)' }}>
                                        +{(revenueData.summary?.purchase ?? 0).toLocaleString()} ⭐
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-secondary">From TON Purchases:</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--orange)' }}>
                                        +{(revenueData.summary?.ton_purchase ?? 0).toLocaleString()} ⭐
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-secondary">From Redemption Fees:</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                                        +{(revenueData.summary?.redemption_fee ?? 0).toLocaleString()} ⭐
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-secondary">From Battle Fees:</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--purple)' }}>
                                        +{(revenueData.summary?.battle_fee ?? 0).toLocaleString()} ⭐
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-secondary">Withdrawals:</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--red)' }}>
                                        {(revenueData.summary?.withdrawal ?? 0).toLocaleString()} ⭐
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Withdraw Button */}
                        {(revenueData.availableRevenue ?? 0) > 0 && (
                            <button
                                onClick={() => setWithdrawalModal({ isOpen: true, amount: '', note: '' })}
                                className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-green"
                                style={{
                                    background: 'var(--green)',
                                    color: 'white',
                                    boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)',
                                    textShadow: '2px 2px 0 var(--green-dark)'
                                }}
                            >
                                <i className="fas fa-money-bill-wave mr-2"></i>
                                Withdraw Revenue
                            </button>
                        )}

                        {/* Filter */}
                        <div className="flex gap-2 bg-white rounded-[20px] p-2 border-4 border-purple overflow-x-auto" style={{
                            boxShadow: '0 6px 0 var(--purple-dark), 0 12px 20px rgba(155, 89, 182, 0.3)'
                        }}>
                            {(['all', 'purchase', 'ton_purchase', 'redemption_fee', 'battle_fee', 'withdrawal'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setRevenueTypeFilter(type)
                                        setRevenuePage(1)
                                    }}
                                    className={`flex-1 py-2 px-3 rounded-[15px] font-bold text-xs uppercase transition-all duration-200 border-4 ${
                                        revenueTypeFilter === type ? 'border-primary text-white' : 'border-transparent text-secondary'
                                    }`}
                                    style={{
                                        background: revenueTypeFilter === type ? 'var(--primary)' : 'transparent',
                                        boxShadow: revenueTypeFilter === type ? '0 4px 0 var(--primary-dark), 0 8px 15px rgba(52, 152, 219, 0.3)' : 'none',
                                        textShadow: revenueTypeFilter === type ? '1px 1px 0 rgba(0,0,0,0.2)' : 'none'
                                    }}
                                >
                                    {type === 'all' ? 'All' : getRevenueTypeLabel(type)}
                                </button>
                            ))}
                        </div>

                        {/* Revenue History */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-xl px-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                                <i className="fas fa-history"></i>
                                Revenue History ({(revenueData.history ?? []).length})
                            </h3>
                            {(!revenueData.history || revenueData.history.length === 0) ? (
                                <div className="bg-white rounded-[25px] p-8 text-center border-4 border-gray-300"
                                    style={{
                                        boxShadow: '0 6px 0 rgba(0,0,0,0.1), 0 12px 20px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="fas fa-inbox text-6xl mb-3 text-gray-400"></i>
                                    <p className="text-secondary font-bold">No revenue history found</p>
                                </div>
                            ) : (
                                (revenueData.history ?? []).map((entry) => (
                                    <div
                                        key={String(entry.id)}
                                        className="bg-white rounded-[25px] p-4 border-4"
                                        style={{
                                            borderColor: getRevenueTypeColor(String(entry.type || '')),
                                            boxShadow: `0 6px 0 ${getRevenueTypeColor(String(entry.type || ''))}88, 0 12px 20px ${getRevenueTypeColor(String(entry.type || ''))}30`
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="font-bold text-lg mb-1" style={{ color: getRevenueTypeColor(String(entry.type || '')) }}>
                                                    {getRevenueTypeLabel(String(entry.type || ''))}
                                                </div>
                                                <div className="text-xs text-secondary">
                                                    {new Date(String(entry.createdAt || '')).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className={`text-xl font-bold ${(Number(entry.amount) || 0) > 0 ? '' : ''}`}
                                                style={{ color: (Number(entry.amount) || 0) > 0 ? 'var(--green)' : 'var(--red)' }}
                                            >
                                                {(Number(entry.amount) || 0) > 0 ? '+' : ''}{Math.abs(Number(entry.amount) || 0).toLocaleString()} ⭐
                                            </div>
                                        </div>
                                        {(() => {
                                            if (!entry.metadata || typeof entry.metadata !== 'object' || entry.metadata === null) return null
                                            const metadata = entry.metadata as Record<string, unknown>
                                            const entryType = String(entry.type || '')
                                            
                                            const requestedStars = entryType === 'redemption_fee' ? (metadata?.requestedStars as number || 0) : 0
                                            const feeStars = entryType === 'redemption_fee' ? (metadata?.feeStars as number || Math.abs(Number(entry.amount) || 0)) : 0
                                            
                                            return (
                                            <div className="text-xs text-secondary mt-2">
                                                    {entryType === 'purchase' && metadata?.packageIndex !== undefined && (
                                                        <span>Package #{((metadata?.packageIndex as number || 0) + 1)} ({((metadata?.stars as number || 0))} stars, fee: {((metadata?.fee as number || 0))} pts)</span>
                                                )}
                                                    {entryType === 'ton_purchase' && (
                                                        <span>TON Purchase ({((metadata?.tonAmount as number || 0))} TON, fee: {((metadata?.feeTon as number || 0))} TON = {((metadata?.feePoints as number || 0))} pts)</span>
                                                )}
                                                    {entryType === 'redemption_fee' && (
                                                        <span>Fee from {requestedStars} stars redemption ({feeStars} stars fee)</span>
                                                )}
                                                    {entryType === 'withdrawal' && (() => {
                                                        const note = entry.withdrawalNote
                                                        if (!note || typeof note !== 'string') return null
                                                        return <span>Note: {note}</span>
                                                    })()}
                                            </div>
                                            )
                                        })()}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {(revenueData.history ?? []).length === 50 && (
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => setRevenuePage(p => Math.max(1, p - 1))}
                                    disabled={revenuePage === 1}
                                    className="px-4 py-2 rounded-full border-4 font-bold disabled:opacity-50"
                                    style={{
                                        background: revenuePage === 1 ? 'var(--gray-disabled)' : 'var(--primary)',
                                        borderColor: revenuePage === 1 ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)',
                                        color: 'white',
                                        boxShadow: `0 4px 0 ${revenuePage === 1 ? 'var(--gray-disabled-dark)' : 'var(--primary-dark)'}`
                                    }}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <span className="px-4 py-2 font-bold text-secondary">Page {revenuePage}</span>
                                <button
                                    onClick={() => setRevenuePage(p => p + 1)}
                                    className="px-4 py-2 rounded-full border-4 font-bold"
                                    style={{
                                        background: 'var(--primary)',
                                        borderColor: 'var(--primary-dark)',
                                        color: 'white',
                                        boxShadow: '0 4px 0 var(--primary-dark)'
                                    }}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Withdrawal Modal */}
                {withdrawalModal.isOpen && revenueData && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setWithdrawalModal({ isOpen: false, amount: '', note: '' })}
                    >
                        <div 
                            className="bg-white rounded-[30px] p-6 max-w-md w-full border-4"
                            style={{
                                borderColor: 'var(--green)',
                                boxShadow: '0 10px 0 var(--green-dark), 0 20px 40px rgba(0, 0, 0, 0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">💰</div>
                                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--green)' }}>
                                    Withdraw Revenue
                                </h2>
                                <p className="text-sm text-secondary">
                                    Available: <strong>{(revenueData.availableRevenue ?? 0).toLocaleString()} ⭐</strong>
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Amount (Stars) *
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Enter amount to withdraw"
                                        value={withdrawalModal.amount}
                                        onChange={(e) => setWithdrawalModal(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-green outline-none font-semibold"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-secondary mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        placeholder="Add a note for this withdrawal..."
                                        value={withdrawalModal.note}
                                        onChange={(e) => setWithdrawalModal(prev => ({ ...prev, note: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-[15px] border-4 border-gray-200 focus:border-green outline-none font-semibold"
                                        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleWithdrawRevenue}
                                    className="w-full py-4 px-6 rounded-[20px] font-bold text-lg uppercase border-4 border-green"
                                    style={{
                                        background: 'var(--green)',
                                        color: 'white',
                                        boxShadow: '0 6px 0 var(--green-dark), 0 12px 20px rgba(46, 204, 113, 0.3)',
                                        textShadow: '2px 2px 0 var(--green-dark)'
                                    }}
                                >
                                    <i className="fas fa-money-bill-wave mr-2"></i>
                                    Withdraw
                                </button>
                                <button
                                    onClick={() => setWithdrawalModal({ isOpen: false, amount: '', note: '' })}
                                    className="w-full py-3 px-6 rounded-[20px] font-bold text-base border-4 border-gray-300"
                                    style={{
                                        background: 'white',
                                        color: 'var(--text-secondary)',
                                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    )
}
