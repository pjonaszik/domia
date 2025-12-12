// /components/offers/CreateOfferForm.tsx

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/utils/api-client'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Worker {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    profession: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
}

interface CreateOfferFormProps {
    worker: Worker
    onClose: () => void
}

export function CreateOfferForm({ worker, onClose }: CreateOfferFormProps) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [country, setCountry] = useState('France')
    const [serviceType, setServiceType] = useState('')
    const [compensation, setCompensation] = useState('')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!title || !startDate || !startTime || !endDate || !endTime || !address || !city || !postalCode) {
            setError(t('offers.fillRequiredFields'))
            return
        }

        // Combine date and time
        const startDateTime = new Date(`${startDate}T${startTime}`)
        const endDateTime = new Date(`${endDate}T${endTime}`)

        if (startDateTime >= endDateTime) {
            setError(t('offers.endDateAfterStart'))
            return
        }

        if (startDateTime < new Date()) {
            setError(t('offers.startDateInPast'))
            return
        }

        try {
            setLoading(true)
            const response = await apiClient.post('/api/offers', {
                workerId: worker.id,
                title,
                description: description || null,
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                address,
                city,
                postalCode,
                country,
                serviceType: serviceType || null,
                compensation: compensation ? parseFloat(compensation) : null,
                notes: notes || null,
            })

            if (response.ok) {
                onClose()
                // Show success message (could use a toast here)
                window.location.reload() // Simple reload to refresh the page
            } else {
                const errorData = await response.json()
                setError(errorData.error || t('offers.errorCreating'))
            }
        } catch (error) {
            console.error('Error creating offer:', error)
            setError(t('offers.errorCreating'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto card-3d">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">{t('offers.create')}</h2>
                            <p className="text-sm text-secondary mt-1">
                                {t('offers.toWorker', { name: `${worker.firstName} ${worker.lastName}` })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-secondary hover:text-primary transition-colors"
                            aria-label={t('common.close')}
                        >
                            <i className="fas fa-times text-xl" aria-hidden="true"></i>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.title')} *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.description')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        {/* Dates and Times */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('offers.startDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('offers.startTime')} *
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('offers.endDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('offers.endTime')} *
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.address')} *
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('offers.city')} *
                                </label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('offers.postalCode')} *
                                </label>
                                <input
                                    type="text"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.country')}
                            </label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        {/* Service Type */}
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.serviceType')}
                            </label>
                            <input
                                type="text"
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        {/* Compensation */}
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.compensation')} (€)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={compensation}
                                onChange={(e) => setCompensation(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('offers.notes')}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t-2 border-[var(--primary)]">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>{t('common.saving')}</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane" aria-hidden="true"></i>
                                        <span>{t('offers.send')}</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-3 border-2 border-[var(--primary)] text-[var(--primary)] font-semibold rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

