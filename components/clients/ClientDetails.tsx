// /components/clients/ClientDetails.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { formatAddress } from '@/lib/utils/address-helpers'
import type { Client, Appointment, Invoice } from '@/lib/db/schema'
import { formatDate, formatDateTime } from '@/lib/utils/date-helpers'

interface ClientDetailsProps {
    clientId: string
    onEdit?: () => void
    onShowToast?: (message: string) => void
}

export function ClientDetails({ clientId, onEdit, onShowToast }: ClientDetailsProps) {
    const [client, setClient] = useState<Client | null>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadClientData()
    }, [clientId])

    const loadClientData = async () => {
        try {
            setLoading(true)
            const [clientRes, appointmentsRes, invoicesRes] = await Promise.all([
                apiClient.get(`/api/clients/${clientId}`),
                apiClient.get(`/api/appointments?clientId=${clientId}`),
                apiClient.get(`/api/invoices?clientId=${clientId}`),
            ])

            if (clientRes.ok) {
                const data = await clientRes.json()
                setClient(data.client)
            }

            if (appointmentsRes.ok) {
                const data = await appointmentsRes.json()
                setAppointments(data.appointments || [])
            }

            if (invoicesRes.ok) {
                const data = await invoicesRes.json()
                setInvoices(data.invoices || [])
            }
        } catch (error) {
            console.error('Error loading client data:', error)
            onShowToast?.('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="card-3d">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                    <p className="text-secondary">Chargement...</p>
                </div>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="card-3d">
                <p className="text-secondary">Client introuvable</p>
            </div>
        )
    }

    const fullName = `${client.firstName} ${client.lastName}`
    const address = formatAddress(
        client.address || '',
        client.city || '',
        client.postalCode || '',
        client.country || undefined
    )

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-primary mb-2">{fullName}</h2>
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            client.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {client.isActive ? 'Actif' : 'Inactif'}
                        </div>
                    </div>
                    {onEdit && (
                        <button onClick={onEdit} className="btn-primary">
                            Modifier
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {address && (
                        <div>
                            <p className="text-sm text-secondary mb-1">
                                <i className="fas fa-map-marker-alt mr-2"></i>
                                Adresse
                            </p>
                            <p className="text-primary">{address}</p>
                        </div>
                    )}

                    {client.phone && (
                        <div>
                            <p className="text-sm text-secondary mb-1">
                                <i className="fas fa-phone mr-2"></i>
                                Téléphone
                            </p>
                            <p className="text-primary">{client.phone}</p>
                        </div>
                    )}

                    {client.email && (
                        <div>
                            <p className="text-sm text-secondary mb-1">
                                <i className="fas fa-envelope mr-2"></i>
                                Email
                            </p>
                            <p className="text-primary">{client.email}</p>
                        </div>
                    )}

                    {client.notes && (
                        <div>
                            <p className="text-sm text-secondary mb-1">Notes</p>
                            <p className="text-primary">{client.notes}</p>
                        </div>
                    )}

                    {client.medicalNotes && (
                        <div>
                            <p className="text-sm text-secondary mb-1">Notes médicales</p>
                            <p className="text-primary">{client.medicalNotes}</p>
                        </div>
                    )}

                    {client.allergies && (
                        <div>
                            <p className="text-sm text-secondary mb-1">Allergies</p>
                            <p className="text-primary">{client.allergies}</p>
                        </div>
                    )}
                </div>
            </div>

            {appointments.length > 0 && (
                <div className="card-3d">
                    <h3 className="text-lg font-bold text-primary mb-3">Derniers rendez-vous</h3>
                    <div className="space-y-2">
                        {appointments.slice(0, 5).map((apt) => (
                            <div key={apt.id} className="border-l-4 border-[var(--primary)] pl-3 py-2">
                                <p className="font-semibold text-primary">
                                    {formatDateTime(apt.startTime)}
                                </p>
                                <p className="text-sm text-secondary">
                                    {apt.serviceName || 'Rendez-vous'} - {apt.duration} min
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {invoices.length > 0 && (
                <div className="card-3d">
                    <h3 className="text-lg font-bold text-primary mb-3">Factures récentes</h3>
                    <div className="space-y-2">
                        {invoices.slice(0, 5).map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between border-l-4 border-[var(--secondary)] pl-3 py-2">
                                <div>
                                    <p className="font-semibold text-primary">{inv.invoiceNumber}</p>
                                    <p className="text-sm text-secondary">{formatDate(inv.issueDate)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-primary">{parseFloat(inv.total || '0').toFixed(2)} €</p>
                                    <p className={`text-xs ${
                                        inv.status === 'paid' ? 'text-green-600' :
                                        inv.status === 'sent' ? 'text-orange-600' :
                                        'text-gray-600'
                                    }`}>
                                        {inv.status === 'paid' ? 'Payée' :
                                         inv.status === 'sent' ? 'Envoyée' :
                                         inv.status === 'draft' ? 'Brouillon' : inv.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

