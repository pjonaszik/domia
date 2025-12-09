// /components/clients/ClientList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { ClientCard } from './ClientCard'
import { ClientForm } from './ClientForm'
import type { Client } from '@/lib/db/schema'

interface ClientListProps {
    onSelectClient?: (client: Client) => void
    onShowToast?: (message: string) => void
}

export function ClientList({ onSelectClient, onShowToast }: ClientListProps) {
    const { t } = useLanguage()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/dashboard/api/clients')
            if (!response.ok) throw new Error('Failed to load clients')
            const data = await response.json()
            setClients(data.clients || [])
        } catch (error) {
            console.error('Error loading clients:', error)
            onShowToast?.(t('clients.errorLoading'))
        } finally {
            setLoading(false)
        }
    }

    const handleClientSaved = () => {
        setShowCreateForm(false)
        loadClients()
        onShowToast?.(t('clients.clientCreated'))
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
                    onShowToast={onShowToast}
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
                        placeholder={t('clients.searchPlaceholder')}
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
                    aria-label={t('clients.createClient')}
                >
                    <i className="fas fa-plus" aria-hidden="true"></i>
                    <span>{t('clients.newClient')}</span>
                </button>
                <div className="text-sm text-secondary mb-2">
                    {filteredClients.length === 1 
                        ? t('clients.clientCount', { count: '1' })
                        : t('clients.clientCountPlural', { count: String(filteredClients.length) })}
                </div>
            </div>

            {filteredClients.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">
                        {searchTerm ? t('clients.noClientsFound') : t('clients.noClientsYet')}
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

