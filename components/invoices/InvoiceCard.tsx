// /components/invoices/InvoiceCard.tsx

'use client'

import type { Invoice } from '@/lib/db/schema'
import { formatDate } from '@/lib/utils/date-helpers'

interface InvoiceCardProps {
    invoice: Invoice
    onClick?: () => void
}

export function InvoiceCard({ invoice, onClick }: InvoiceCardProps) {
    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-800',
        sent: 'bg-orange-100 text-orange-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
    }

    const statusLabels: Record<string, string> = {
        draft: 'Brouillon',
        sent: 'Envoyée',
        paid: 'Payée',
        overdue: 'En retard',
        cancelled: 'Annulée',
    }

    return (
        <div
            className={`card-3d ${onClick ? 'cursor-pointer transition-all hover:scale-[1.02]' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary mb-2">
                        {invoice.invoiceNumber}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar text-[var(--primary)]"></i>
                        <p className="text-secondary">{formatDate(invoice.issueDate)}</p>
                    </div>
                    {invoice.dueDate && (
                        <p className="text-sm text-secondary">
                            <i className="fas fa-clock mr-2"></i>
                            Échéance: {formatDate(invoice.dueDate)}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-primary mb-2">
                        {parseFloat(invoice.total || '0').toFixed(2)} €
                    </p>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                        statusColors[invoice.status] || 'bg-gray-100 text-gray-800'
                    }`}>
                        {statusLabels[invoice.status] || invoice.status}
                    </div>
                </div>
            </div>
        </div>
    )
}

