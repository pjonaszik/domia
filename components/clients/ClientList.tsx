// /components/clients/ClientList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { ClientCard } from './ClientCard'
import type { Client } from '@/lib/db/schema'

interface ClientListProps {
    onSelectClient?: (client: Client) => void
    onShowToast?: (message: string) => void
}

export function ClientList({ onSelectClient, onShowToast }: ClientListProps) {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/clients')
            if (!response.ok) throw new Error('Failed to load clients')
            const data = await response.json()
            setClients(data.clients || [])
        } catch (error) {
            console.error('Error loading clients:', error)
            onShowToast?.('Erreur lors du chargement des clients')
        } finally {
            setLoading(false)
        }
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
                    <p className="text-secondary">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div className="text-sm text-secondary mb-2">
                    {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                </div>
            </div>

            {filteredClients.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">
                        {searchTerm ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
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

