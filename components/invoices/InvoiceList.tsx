// /components/invoices/InvoiceList.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { InvoiceCard } from './InvoiceCard'
import type { Invoice } from '@/lib/db/schema'

interface InvoiceListProps {
    clientId?: string
    onSelectInvoice?: (invoice: Invoice) => void
    onShowToast?: (message: string) => void
}

export function InvoiceList({ clientId, onSelectInvoice, onShowToast }: InvoiceListProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')

    useEffect(() => {
        loadInvoices()
    }, [clientId, statusFilter])

    const loadInvoices = async () => {
        try {
            setLoading(true)
            let url = '/api/invoices'
            if (clientId) url += `?clientId=${clientId}`
            if (statusFilter !== 'all') url += `${clientId ? '&' : '?'}status=${statusFilter}`

            const response = await apiClient.get(url)
            if (!response.ok) throw new Error('Failed to load invoices')
            const data = await response.json()
            setInvoices(data.invoices || [])
        } catch (error) {
            console.error('Error loading invoices:', error)
            onShowToast?.('Erreur lors du chargement des factures')
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

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <div className="flex items-center gap-2 mb-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="draft">Brouillon</option>
                        <option value="sent">Envoyée</option>
                        <option value="paid">Payée</option>
                        <option value="overdue">En retard</option>
                    </select>
                </div>
                <div className="text-sm text-secondary">
                    {invoices.length} facture{invoices.length > 1 ? 's' : ''}
                </div>
            </div>

            {invoices.length === 0 ? (
                <div className="card-3d text-center py-8">
                    <p className="text-secondary">Aucune facture</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            onClick={() => onSelectInvoice?.(invoice)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

