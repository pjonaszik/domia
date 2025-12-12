// /components/invoices/InvoiceForm.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Invoice, Client, Appointment } from '@/lib/db/schema'

interface InvoiceFormProps {
    invoice?: Invoice
    clientId?: string
    onSave: () => void
    onCancel: () => void
    onShowAlert?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void
}

interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
    appointmentId?: string
}

export function InvoiceForm({ invoice, clientId, onSave, onCancel, onShowAlert }: InvoiceFormProps) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [formData, setFormData] = useState({
        clientId: invoice?.clientId || clientId || '',
        issueDate: invoice?.issueDate
            ? new Date(invoice.issueDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        dueDate: invoice?.dueDate
            ? new Date(invoice.dueDate).toISOString().split('T')[0]
            : '',
        notes: invoice?.notes || '',
    })
    const [items, setItems] = useState<InvoiceItem[]>([])

    useEffect(() => {
        loadClients()
        if (invoice) {
            loadInvoiceItems()
        }
    }, [invoice])

    useEffect(() => {
        if (formData.clientId) {
            loadClientAppointments()
        }
    }, [formData.clientId])

    const loadClients = async () => {
        try {
            const response = await apiClient.get('/api/clients')
            if (response.ok) {
                const data = await response.json()
                setClients(data.clients || [])
            }
        } catch (error) {
            console.error('Error loading clients:', error)
        }
    }

    const loadClientAppointments = async () => {
        try {
            const response = await apiClient.get(`/api/appointments?clientId=${formData.clientId}`)
            if (response.ok) {
                const data = await response.json()
                setAppointments(data.appointments || [])
            }
        } catch (error) {
            console.error('Error loading appointments:', error)
        }
    }

    const loadInvoiceItems = async () => {
        if (!invoice) return
        try {
            const response = await apiClient.get(`/api/invoices/${invoice.id}`)
            if (response.ok) {
                const data = await response.json()
                if (data.items) {
                    setItems(data.items.map((item: any) => ({
                        description: item.description,
                        quantity: parseFloat(item.quantity || '1'),
                        unitPrice: parseFloat(item.unitPrice || '0'),
                        total: parseFloat(item.total || '0'),
                        appointmentId: item.appointmentId || undefined,
                    })))
                }
            }
        } catch (error) {
            console.error('Error loading invoice items:', error)
        }
    }

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
    }

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
        }
        setItems(newItems)
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const addAppointmentAsItem = (appointment: Appointment) => {
        setItems([...items, {
            description: appointment.serviceName || t('appointments.title'),
            quantity: 1,
            unitPrice: appointment.price ? parseFloat(appointment.price) : 0,
            total: appointment.price ? parseFloat(appointment.price) : 0,
            appointmentId: appointment.id,
        }])
    }

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0)
        const tax = 0 // Can be configured per user
        const total = subtotal + tax
        return { subtotal, tax, total }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { subtotal, tax, total } = calculateTotals()

            const payload = {
                clientId: formData.clientId,
                issueDate: formData.issueDate,
                dueDate: formData.dueDate || undefined,
                subtotal,
                tax,
                total,
                notes: formData.notes || undefined,
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total,
                    appointmentId: item.appointmentId || undefined,
                })),
            }

            const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices'

            const response = invoice 
                ? await apiClient.put(url, payload)
                : await apiClient.post(url, payload)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || t('invoices.errorSaving'))
            }

            onShowAlert?.(invoice ? t('invoices.invoiceUpdated') : t('invoices.invoiceCreated'))
            onSave()
        } catch (error) {
            console.error('Error saving invoice:', error)
            onShowAlert?.(error instanceof Error ? error.message : t('invoices.errorSaving'))
        } finally {
            setLoading(false)
        }
    }

    const { subtotal, tax, total } = calculateTotals()

    return (
        <form onSubmit={handleSubmit} className="card-3d space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">
                {invoice ? t('invoices.editInvoice') : t('invoices.newInvoice')}
            </h2>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('invoices.client')} *
                </label>
                <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    disabled={!!clientId}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                    <option value="">{t('invoices.selectClient')}</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        {t('invoices.issueDate')} *
                    </label>
                    <input
                        type="date"
                        required
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        {t('invoices.dueDate')}
                    </label>
                    <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
            </div>

            {formData.clientId && appointments.length > 0 && (
                <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                        {t('invoices.addFromAppointment')}
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {appointments.map((apt) => (
                            <button
                                key={apt.id}
                                type="button"
                                onClick={() => addAppointmentAsItem(apt)}
                                className="w-full text-left px-3 py-2 border border-[var(--primary)] rounded-lg hover:bg-[var(--bg-card)] text-sm"
                            >
                                {new Date(apt.startTime).toLocaleDateString('fr-FR')} - {apt.serviceName || t('appointments.title')} - {apt.price ? `${parseFloat(apt.price).toFixed(2)} €` : ''}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-primary">
                        {t('invoices.invoiceLines')} *
                    </label>
                    <button
                        type="button"
                        onClick={addItem}
                        className="text-sm btn-primary px-3 py-1"
                    >
                        + {t('invoices.addItem')}
                    </button>
                </div>
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index} className="border-2 border-[var(--primary)] rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder={t('invoices.description')}
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    className="col-span-2 px-3 py-2 border border-[var(--text-light)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                                <input
                                    type="number"
                                    placeholder={t('invoices.quantity')}
                                    min="0"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="px-3 py-2 border border-[var(--text-light)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                                <input
                                    type="number"
                                    placeholder={t('invoices.unitPrice')}
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="px-3 py-2 border border-[var(--text-light)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-primary">
                                    {t('invoices.totalValue', { amount: item.total.toFixed(2) })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 text-sm"
                                >
                                    {t('invoices.removeItem')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t-2 border-[var(--primary)] pt-4 space-y-2">
                <div className="flex justify-between">
                    <span className="text-secondary">{t('invoices.subtotal')}:</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-secondary">{t('invoices.tax')}:</span>
                    <span className="font-semibold">{tax.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary">
                    <span>{t('invoices.total')}:</span>
                    <span>{total.toFixed(2)} €</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('invoices.notes')}
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="btn-primary flex-1"
                >
                    {loading ? t('common.loading') : t('common.save')}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border-2 border-[var(--text-light)] rounded-full text-[var(--text-light)] font-semibold"
                >
                    {t('common.cancel')}
                </button>
            </div>
        </form>
    )
}

