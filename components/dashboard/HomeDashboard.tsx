// /components/dashboard/HomeDashboard.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { isToday, isTomorrow } from 'date-fns'
import type { User, Appointment, Tour } from '@/lib/db/schema'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface HomeDashboardProps {
    user: User
    onShowToast?: (message: string) => void
    onNavigate?: (page: 'tours' | 'clients' | 'calendar') => void
}

interface QuickStats {
    clients: number
    todayAppointments: number
    todayTours: number
    monthlyRevenue: number
}

export function HomeDashboard({ user, onShowToast, onNavigate }: HomeDashboardProps) {
    const [stats, setStats] = useState<QuickStats | null>(null)
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
    const [todayTours, setTodayTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            
            // Load stats
            const statsResponse = await apiClient.get('/_/api/stats')
            if (statsResponse.ok) {
                const statsData = await statsResponse.json()
                setStats({
                    clients: statsData.stats?.clients?.total || 0,
                    todayAppointments: statsData.stats?.appointments?.today || 0,
                    todayTours: 0, // Will be calculated from tours
                    monthlyRevenue: statsData.stats?.revenue?.monthly || 0
                })
            }

            // Load today's and tomorrow's appointments
            const today = new Date()
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            const appointmentsResponse = await apiClient.get(
                `/api/appointments?startDate=${today.toISOString().split('T')[0]}&endDate=${tomorrow.toISOString().split('T')[0]}`
            )
            if (appointmentsResponse.ok) {
                const appointmentsData = await appointmentsResponse.json()
                const appointments = appointmentsData.appointments || []
                // Filter and sort upcoming appointments
                const upcoming = appointments
                    .filter((apt: Appointment) => {
                        const aptDate = new Date(apt.startTime)
                        return aptDate >= today
                    })
                    .sort((a: Appointment, b: Appointment) => {
                        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                    })
                    .slice(0, 5) // Show only next 5
                setUpcomingAppointments(upcoming)
            }

            // Load today's tours
            const toursResponse = await apiClient.get('/_/api/tours')
            if (toursResponse.ok) {
                const toursData = await toursResponse.json()
                const tours = toursData.tours || []
                const today = new Date()
                const todayToursList = tours.filter((tour: Tour) => {
                    if (!tour.date) return false
                    const tourDate = new Date(tour.date)
                    return tourDate.toDateString() === today.toDateString()
                })
                setTodayTours(todayToursList)
                if (stats) {
                    setStats({ ...stats, todayTours: todayToursList.length })
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            onShowToast?.('Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="card-3d">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                        <p className="text-secondary">Chargement...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Welcome Header */}
            <div className="card-3d">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">
                            Bonjour, {user.firstName || 'Utilisateur'} 👋
                        </h2>
                        <p className="text-secondary text-sm mt-1">
                            {user.profession || 'Professionnel du service à la personne'}
                        </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-2xl font-bold">
                        {(user.firstName || user.email || 'U')[0].toUpperCase()}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-[var(--tertiary)]">
                    <p className="text-sm text-secondary italic">
                        "Vos tournées optimisées, vos journées simplifiées"
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i className="fas fa-users text-[var(--primary)]"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">Clients</p>
                    <p className="text-2xl font-bold text-primary">{stats?.clients || 0}</p>
                </div>

                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <i className="fas fa-calendar-check text-[var(--secondary)]"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">Aujourd'hui</p>
                    <p className="text-2xl font-bold text-primary">{stats?.todayAppointments || 0}</p>
                </div>

                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <i className="fas fa-route text-purple-600"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">Tournées</p>
                    <p className="text-2xl font-bold text-primary">{stats?.todayTours || 0}</p>
                </div>

                <div className="card-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <i className="fas fa-euro-sign text-green-600"></i>
                        </div>
                    </div>
                    <p className="text-xs text-secondary mb-1">Ce mois</p>
                    <p className="text-2xl font-bold text-primary">
                        {(stats?.monthlyRevenue || 0).toFixed(0)} €
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card-3d">
                <h3 className="text-lg font-bold text-primary mb-3">Actions rapides</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onNavigate?.('clients')}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                        aria-label="Créer un nouveau client"
                    >
                        <i className="fas fa-user-plus text-xl" aria-hidden="true"></i>
                        <span className="font-semibold">Nouveau client</span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('calendar')}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--secondary)] hover:bg-[var(--secondary)] hover:text-white transition-all"
                        aria-label="Créer un nouveau rendez-vous"
                    >
                        <i className="fas fa-calendar-plus text-xl" aria-hidden="true"></i>
                        <span className="font-semibold">Nouveau RDV</span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('tours')}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-500 hover:bg-purple-500 hover:text-white transition-all"
                        aria-label="Optimiser une tournée"
                    >
                        <i className="fas fa-route text-xl" aria-hidden="true"></i>
                        <span className="font-semibold">Optimiser</span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('calendar')}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                        aria-label="Voir le planning"
                    >
                        <i className="fas fa-calendar-alt text-xl" aria-hidden="true"></i>
                        <span className="font-semibold">Planning</span>
                    </button>
                </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
                <div className="card-3d">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-primary">Prochains rendez-vous</h3>
                    <button
                        onClick={() => onNavigate?.('calendar')}
                        className="text-sm text-[var(--primary)] font-semibold hover:underline"
                        aria-label="Voir tous les rendez-vous"
                    >
                        Voir tout
                    </button>
                    </div>
                    <div className="space-y-2">
                        {upcomingAppointments.slice(0, 3).map((appointment) => {
                            const aptDate = new Date(appointment.startTime)
                            const isTodayAppt = isToday(aptDate)
                            const isTomorrowAppt = isTomorrow(aptDate)
                            
                            return (
                                <button
                                    key={appointment.id}
                                    type="button"
                                    className="w-full text-left p-3 rounded-lg border-2 border-[var(--tertiary)] hover:border-[var(--primary)] transition-all cursor-pointer"
                                    onClick={() => onNavigate?.('calendar')}
                                    aria-label={`Rendez-vous à ${aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${appointment.serviceName || appointment.notes || 'Rendez-vous'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <i className="fas fa-clock text-[var(--secondary)]" aria-hidden="true"></i>
                                                <time dateTime={aptDate.toISOString()} className="font-semibold text-primary">
                                                    {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </time>
                                                {(isTodayAppt || isTomorrowAppt) && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)] text-white" aria-label={isTodayAppt ? "Aujourd'hui" : "Demain"}>
                                                        {isTodayAppt ? "Aujourd'hui" : "Demain"}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-secondary">
                                                {appointment.serviceName || appointment.notes || 'Rendez-vous'}
                                            </p>
                                        </div>
                                        <i className="fas fa-chevron-right text-[var(--text-light)]" aria-hidden="true"></i>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Today's Tours */}
            {todayTours.length > 0 && (
                <div className="card-3d">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-primary">Tournées du jour</h3>
                        <button
                            onClick={() => onNavigate?.('tours')}
                            className="text-sm text-[var(--primary)] font-semibold hover:underline"
                            aria-label="Voir toutes les tournées"
                        >
                            Voir tout
                        </button>
                    </div>
                    <div className="space-y-2">
                        {todayTours.slice(0, 2).map((tour) => (
                            <button
                                key={tour.id}
                                type="button"
                                className="w-full text-left p-3 rounded-lg border-2 border-[var(--tertiary)] hover:border-[var(--primary)] transition-all cursor-pointer"
                                onClick={() => onNavigate?.('tours')}
                                aria-label={`Tournée ${tour.name || 'sans nom'} - ${tour.optimizedOrder && Array.isArray(tour.optimizedOrder) ? (tour.optimizedOrder as string[]).length : 0} rendez-vous`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center" aria-hidden="true">
                                            <i className="fas fa-route text-purple-600" aria-hidden="true"></i>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-primary">
                                                {tour.name || 'Tournée'}
                                            </p>
                                            <p className="text-xs text-secondary">
                                                {tour.optimizedOrder && Array.isArray(tour.optimizedOrder) 
                                                    ? (tour.optimizedOrder as string[]).length 
                                                    : 0} rendez-vous
                                            </p>
                                        </div>
                                    </div>
                                    <i className="fas fa-chevron-right text-[var(--text-light)]" aria-hidden="true"></i>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty States */}
            {upcomingAppointments.length === 0 && todayTours.length === 0 && (
                <div className="card-3d text-center py-8">
                    <i className="fas fa-calendar-check text-4xl text-[var(--text-light)] mb-4"></i>
                    <p className="text-secondary mb-2">Aucun rendez-vous prévu aujourd'hui</p>
                    <button
                        onClick={() => onNavigate?.('calendar')}
                        className="text-sm text-[var(--primary)] font-semibold hover:underline"
                        aria-label="Créer un nouveau rendez-vous"
                    >
                        Créer un rendez-vous
                    </button>
                </div>
            )}
        </div>
    )
}

