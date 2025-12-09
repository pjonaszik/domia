// /components/appointments/AppointmentForm.tsx

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Appointment, Client } from '@/lib/db/schema'

interface AppointmentFormProps {
    appointment?: Appointment
    clientId?: string
    onSave: () => void
    onCancel: () => void
    onShowToast?: (message: string) => void
}

export function AppointmentForm({ appointment, clientId, onSave, onCancel, onShowToast }: AppointmentFormProps) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [formData, setFormData] = useState({
        clientId: appointment?.clientId || clientId || '',
        startTime: appointment?.startTime 
            ? new Date(appointment.startTime).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        duration: appointment?.duration || 60,
        serviceName: appointment?.serviceName || '',
        notes: appointment?.notes || '',
        price: appointment?.price ? parseFloat(appointment.price) : undefined,
    })

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        try {
            const response = await apiClient.get('/_/api/clients')
            if (response.ok) {
                const data = await response.json()
                setClients(data.clients || [])
            }
        } catch (error) {
            console.error('Error loading clients:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const startTime = new Date(formData.startTime)
            const endTime = new Date(startTime.getTime() + formData.duration * 60000)

            const payload = {
                clientId: formData.clientId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: formData.duration,
                serviceName: formData.serviceName || undefined,
                notes: formData.notes || undefined,
                price: formData.price || undefined,
            }

            const url = appointment ? `/api/appointments/${appointment.id}` : '/_/api/appointments'

            const response = appointment 
                ? await apiClient.put(url, payload)
                : await apiClient.post(url, payload)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || t('appointments.errorSaving'))
            }

            onShowToast?.(appointment ? t('appointments.appointmentUpdated') : t('appointments.appointmentCreated'))
            onSave()
        } catch (error) {
            console.error('Error saving appointment:', error)
            onShowToast?.(error instanceof Error ? error.message : t('appointments.errorSaving'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card-3d space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">
                {appointment ? t('appointments.editAppointment') : t('appointments.newAppointment')}
            </h2>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('appointments.client')} *
                </label>
                <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    disabled={!!clientId}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                    <option value="">{t('clients.selectClient')}</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('appointments.startTime')} *
                </label>
                <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('appointments.duration')} *
                </label>
                <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('appointments.service')}
                </label>
                <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    placeholder="Ex: Soins à domicile, Entretien..."
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('appointments.price')} (€)
                </label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    {t('appointments.notes')}
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
                    disabled={loading}
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

