// /components/invoices/InvoicePreview.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { formatDate } from '@/lib/utils/date-helpers'
import type { Invoice, InvoiceItem } from '@/lib/db/schema'

interface InvoicePreviewProps {
    invoiceId: string
    onShowToast?: (message: string) => void
}

export function InvoicePreview({ invoiceId, onShowToast }: InvoicePreviewProps) {
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [items, setItems] = useState<InvoiceItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInvoice()
    }, [invoiceId])

    const loadInvoice = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get(`/api/invoices/${invoiceId}`)
            if (!response.ok) throw new Error('Failed to load invoice')
            const data = await response.json()
            setInvoice(data.invoice)
            setItems(data.items || [])
        } catch (error) {
            console.error('Error loading invoice:', error)
            onShowToast?.('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
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

    if (!invoice) {
        return (
            <div className="card-3d">
                <p className="text-secondary">Facture introuvable</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="card-3d">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary">Facture {invoice.invoiceNumber}</h2>
                    <button onClick={handlePrint} className="btn-primary">
                        <i className="fas fa-print mr-2"></i>
                        Imprimer
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-semibold text-primary mb-2">Émise le</h3>
                        <p className="text-secondary">{formatDate(invoice.issueDate)}</p>
                        {invoice.dueDate && (
                            <>
                                <h3 className="font-semibold text-primary mb-2 mt-4">Échéance</h3>
                                <p className="text-secondary">{formatDate(invoice.dueDate)}</p>
                            </>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-primary mb-2">Statut</h3>
                        <p className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'sent' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {invoice.status === 'paid' ? 'Payée' :
                             invoice.status === 'sent' ? 'Envoyée' :
                             invoice.status === 'draft' ? 'Brouillon' : invoice.status}
                        </p>
                    </div>
                </div>

                <div className="border-t-2 border-[var(--primary)] pt-4 mb-4">
                    <h3 className="font-semibold text-primary mb-3">Détails</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-[var(--primary)]">
                                <th className="text-left py-2 text-primary">Description</th>
                                <th className="text-right py-2 text-primary">Qté</th>
                                <th className="text-right py-2 text-primary">Prix unitaire</th>
                                <th className="text-right py-2 text-primary">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-2 text-secondary">{item.description}</td>
                                    <td className="text-right py-2 text-secondary">{parseFloat(item.quantity || '1').toFixed(2)}</td>
                                    <td className="text-right py-2 text-secondary">{parseFloat(item.unitPrice || '0').toFixed(2)} €</td>
                                    <td className="text-right py-2 font-semibold text-primary">{parseFloat(item.total || '0').toFixed(2)} €</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t-2 border-[var(--primary)] pt-4 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-secondary">Sous-total:</span>
                        <span className="font-semibold">{parseFloat(invoice.subtotal || '0').toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">TVA:</span>
                        <span className="font-semibold">{parseFloat(invoice.tax || '0').toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary border-t-2 border-[var(--primary)] pt-2">
                        <span>Total:</span>
                        <span>{parseFloat(invoice.total || '0').toFixed(2)} €</span>
                    </div>
                </div>

                {invoice.notes && (
                    <div className="mt-4 pt-4 border-t-2 border-[var(--primary)]">
                        <h3 className="font-semibold text-primary mb-2">Notes</h3>
                        <p className="text-secondary">{invoice.notes}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

