// /components/clients/ClientList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { ClientCard } from './ClientCard'
import { ClientForm } from './ClientForm'
import { ConsultantSearch } from '@/components/consultants/ConsultantSearch'
import type { Client } from '@/lib/db/schema'
import { isCompany } from '@/lib/utils/user-type'
import { useAuth } from '@/contexts/AuthContext'

interface ClientListProps {
    onSelectClient?: (client: Client) => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

export function ClientList({ onSelectClient, onShowAlert }: ClientListProps) {
    const { t } = useLanguage()
    const { user } = useAuth()
    const isCompanyUser = isCompany(user)
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)

    const loadClients = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/clients')
            if (!response.ok) throw new Error('Failed to load clients')
            const data = await response.json()
            setClients(data.clients || [])
        } catch (error) {
            console.error('Error loading clients:', error)
            onShowAlert?.(t('clients.errorLoading'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!isCompanyUser) {
            loadClients()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompanyUser])

    // For companies, show consultant search instead of client list
    if (isCompanyUser) {
        return <ConsultantSearch onShowAlert={onShowAlert} />
    }

    const handleClientSaved = () => {
        setShowCreateForm(false)
        loadClients()
        onShowAlert?.(isCompanyUser ? t('clients.consultantCreated') : t('clients.clientCreated'))
    }

    const filteredClients = clients.filter(client => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            client.firstName?.toLowerCase().includes(search) ||
            client.lastName?.toLowerCase().includes(search) ||
            client.city?.toLowerCase().includes(search) ||
            client.phone?.includes(search)
        )
    })

    if (loading) {
        return (
            <div className="card-3d">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)] mx-auto mb-4"></div>
                    <p className="text-secondary">{t('common.loading')}</p>
                </div>
            </div>
        )
    }

    if (showCreateForm) {
        return (
            <div className="space-y-4">
                <ClientForm
                    onSave={handleClientSaved}
                    onCancel={() => setShowCreateForm(false)}
                    onShowAlert={onShowAlert}
                />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder={isCompanyUser ? t('clients.searchConsultantPlaceholder') : t('clients.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <button
                        type="button"
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center"
                        aria-label={t('common.search')}
                    >
                        <i className="fas fa-search" aria-hidden="true"></i>
                    </button>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4"
                    aria-label={isCompanyUser ? t('clients.createConsultant') : t('clients.createClient')}
                >
                    <i className="fas fa-plus" aria-hidden="true"></i>
                    <span>{isCompanyUser ? t('clients.newConsultant') : t('clients.newClient')}</span>
                </button>
                <div className="text-sm text-secondary mb-2">
                    {isCompanyUser ? (
                        filteredClients.length === 1 
                            ? t('clients.consultantCount', { count: '1' })
                            : t('clients.consultantCountPlural', { count: String(filteredClients.length) })
                    ) : (
                        filteredClients.length === 1 
                            ? t('clients.clientCount', { count: '1' })
                            : t('clients.clientCountPlural', { count: String(filteredClients.length) })
                    )}
                </div>
            </div>

            {filteredClients.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">
                        {isCompanyUser 
                            ? (searchTerm ? t('clients.noConsultantsFound') : t('clients.noConsultantsYet'))
                            : (searchTerm ? t('clients.noClientsFound') : t('clients.noClientsYet'))
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredClients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onClick={() => onSelectClient?.(client)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

