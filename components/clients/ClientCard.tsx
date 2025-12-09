// /components/clients/ClientCard.tsx

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { Client } from '@/lib/db/schema'
import { formatAddress } from '@/lib/utils/address-helpers'

interface ClientCardProps {
    client: Client
    onClick?: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
    const { t } = useLanguage()
    const fullName = `${client.firstName} ${client.lastName}`
    const address = formatAddress(
        client.address || '',
        client.city || '',
        client.postalCode || '',
        client.country || undefined
    )

    return (
        <div
            className="card-3d cursor-pointer transition-all hover:scale-[1.02]"
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary mb-1">{fullName}</h3>
                    {address && (
                        <p className="text-sm text-secondary mb-1">
                            <i className="fas fa-map-marker-alt mr-2"></i>
                            {address}
                        </p>
                    )}
                    {client.phone && (
                        <p className="text-sm text-secondary">
                            <i className="fas fa-phone mr-2"></i>
                            {client.phone}
                        </p>
                    )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    client.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {client.isActive ? t('clients.active') : t('clients.inactive')}
                </div>
            </div>
        </div>
    )
}

