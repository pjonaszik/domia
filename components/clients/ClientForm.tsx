// /components/clients/ClientForm.tsx

'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/utils/api-client'
import type { Client } from '@/lib/db/schema'

interface ClientFormProps {
    client?: Client
    onSave: () => void
    onCancel: () => void
    onShowToast?: (message: string) => void
}

export function ClientForm({ client, onSave, onCancel, onShowToast }: ClientFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: client?.firstName || '',
        lastName: client?.lastName || '',
        phone: client?.phone || '',
        email: client?.email || '',
        address: client?.address || '',
        city: client?.city || '',
        postalCode: client?.postalCode || '',
        country: client?.country || 'France',
        notes: client?.notes || '',
        medicalNotes: client?.medicalNotes || '',
        allergies: client?.allergies || '',
        isActive: client?.isActive ?? true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = client ? `/api/clients/${client.id}` : '/api/clients'

            const response = client 
                ? await apiClient.put(url, formData)
                : await apiClient.post(url, formData)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erreur lors de la sauvegarde')
            }

            onShowToast?.(client ? 'Client mis à jour' : 'Client créé')
            onSave()
        } catch (error) {
            console.error('Error saving client:', error)
            onShowToast?.(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card-3d space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">
                {client ? 'Modifier le client' : 'Nouveau client'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        Prénom *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        Nom *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    Téléphone
                </label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    Email
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    Adresse *
                </label>
                <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        Code postal *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                        Ville *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    Notes
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    Notes médicales
                </label>
                <textarea
                    value={formData.medicalNotes}
                    onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-primary mb-1">
                    Allergies
                </label>
                <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-primary">
                    Client actif
                </label>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border-2 border-[var(--text-light)] rounded-full text-[var(--text-light)] font-semibold"
                >
                    Annuler
                </button>
            </div>
        </form>
    )
}

