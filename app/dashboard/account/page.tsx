// /app/dashboard/account/page.tsx - Account management page

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/LanguageSelector'
import { apiClient } from '@/lib/utils/api-client'
import { Alert } from '@/components/Alert'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface Settings {
    id: string
    userId: string
    emailNotifications: boolean
    smsNotifications: boolean
    reminderBeforeAppointment: number | null
    defaultServiceDuration: number | null
    workingHours: any
    currency: string
    taxRate: string
    preferences: {
        sepaPayment?: {
            iban?: string | null
            bic?: string | null
            accountHolder?: string | null
        }
    } | null
    createdAt: string
    updatedAt: string
}

export default function AccountPage() {
    const { user, logout } = useAuth()
    const { t } = useLanguage()
    const router = useRouter()
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ message: string; type: 'error' | 'success' | 'info' | 'warning' } | null>(null)
    const [isEditingSettings, setIsEditingSettings] = useState(false)

    // Form state for settings
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [smsNotifications, setSmsNotifications] = useState(false)
    const [reminderBeforeAppointment, setReminderBeforeAppointment] = useState(30)
    const [defaultServiceDuration, setDefaultServiceDuration] = useState(60)
    const [currency, setCurrency] = useState('EUR')
    const [taxRate, setTaxRate] = useState('0.00')
    const [sepaIban, setSepaIban] = useState('')
    const [sepaBic, setSepaBic] = useState('')
    const [sepaAccountHolder, setSepaAccountHolder] = useState('')

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/dashboard/api/settings')
            if (response.ok) {
                const data = await response.json()
                const userSettings = data.settings
                setSettings(userSettings)
                
                // Populate form fields
                setEmailNotifications(userSettings.emailNotifications ?? true)
                setSmsNotifications(userSettings.smsNotifications ?? false)
                setReminderBeforeAppointment(userSettings.reminderBeforeAppointment ?? 30)
                setDefaultServiceDuration(userSettings.defaultServiceDuration ?? 60)
                setCurrency(userSettings.currency || 'EUR')
                setTaxRate(userSettings.taxRate || '0.00')
                
                // SEPA payment info
                const sepaPayment = userSettings.preferences?.sepaPayment
                setSepaIban(sepaPayment?.iban || '')
                setSepaBic(sepaPayment?.bic || '')
                setSepaAccountHolder(sepaPayment?.accountHolder || '')
            }
        } catch (error) {
            console.error('Error loading settings:', error)
            setAlert({ message: t('account.errorLoadingSettings'), type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        try {
            setSaving(true)
            const response = await apiClient.put('/dashboard/api/settings', {
                emailNotifications,
                smsNotifications,
                reminderBeforeAppointment,
                defaultServiceDuration,
                currency,
                taxRate,
                sepaIban: sepaIban.trim() || null,
                sepaBic: sepaBic.trim() || null,
                sepaAccountHolder: sepaAccountHolder.trim() || null,
            })

            if (response.ok) {
                const data = await response.json()
                setSettings(data.settings)
                setIsEditingSettings(false)
                setAlert({ message: t('account.settingsSaved'), type: 'success' })
            } else {
                const errorData = await response.json()
                setAlert({ message: errorData.error || t('account.errorSavingSettings'), type: 'error' })
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            setAlert({ message: t('account.errorSavingSettings'), type: 'error' })
        } finally {
            setSaving(false)
        }
    }


    const handleLogout = () => {
        logout()
        router.push('/')
    }

    // Format IBAN for display (masked)
    const formatIban = (iban: string) => {
        if (!iban || iban.length < 4) return iban
        return iban.substring(0, 4) + ' **** **** **** ' + iban.substring(iban.length - 4)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[var(--primary)]"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {alert && (
                <Alert 
                    message={alert.message} 
                    type={alert.type} 
                    onClose={() => setAlert(null)} 
                />
            )}

            {/* User Info */}
            <div className="card-3d">
                <h2 className="text-xl font-bold text-primary mb-6">{t('header.account')}</h2>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.firstName')}
                        </label>
                        <p className="text-secondary">{user?.firstName || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.lastName')}
                        </label>
                        <p className="text-secondary">{user?.lastName || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.email')}
                        </label>
                        <p className="text-secondary">{user?.email || '-'}</p>
                    </div>
                    {user?.profession && (
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('auth.profession')}
                            </label>
                            <p className="text-secondary">
                                {user.profession === 'infirmiere' ? t('auth.professionInfirmiere') :
                                 user.profession === 'aide_soignante' ? t('auth.professionAideSoignante') :
                                 user.profession === 'agent_entretien' ? t('auth.professionAgentEntretien') :
                                 user.profession === 'aide_domicile' ? t('auth.professionAideDomicile') :
                                 user.profession === 'garde_enfants' ? t('auth.professionGardeEnfants') :
                                 user.profession}
                            </p>
                        </div>
                    )}
                    {user?.businessId && (
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                {t('auth.businessId')}
                            </label>
                            <p className="text-secondary">{user.businessId}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Language Settings */}
            <div className="card-3d">
                <h3 className="text-lg font-bold text-primary mb-4">{t('header.language')}</h3>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary mb-2">
                        {t('language.change')}
                    </label>
                    <LanguageSelector />
                </div>
            </div>

            {/* Settings */}
            <div className="card-3d">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">{t('header.settings')}</h3>
                    {!isEditingSettings && (
                        <button
                            onClick={() => setIsEditingSettings(true)}
                            className="px-4 py-2 text-sm font-semibold text-[var(--primary)] border-2 border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
                        >
                            {t('common.edit')}
                        </button>
                    )}
                </div>

                {isEditingSettings ? (
                    <div className="space-y-4">
                        {/* Notifications */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-primary">{t('settings.notifications')}</h4>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailNotifications}
                                    onChange={(e) => setEmailNotifications(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-[var(--primary)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                                />
                                <span className="text-sm text-secondary">{t('settings.emailNotifications')}</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={smsNotifications}
                                    onChange={(e) => setSmsNotifications(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-[var(--primary)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                                />
                                <span className="text-sm text-secondary">{t('settings.smsNotifications')}</span>
                            </label>

                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.reminderBeforeAppointment')}
                                </label>
                                <input
                                    type="number"
                                    value={reminderBeforeAppointment}
                                    onChange={(e) => setReminderBeforeAppointment(parseInt(e.target.value) || 30)}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    min="0"
                                    max="1440"
                                />
                                <p className="text-xs text-secondary mt-1">{t('settings.reminderMinutes')}</p>
                            </div>
                        </div>

                        {/* Business Settings */}
                        <div className="space-y-3 pt-4 border-t-2 border-[var(--primary)]">
                            <h4 className="font-semibold text-primary">{t('settings.business')}</h4>
                            
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.defaultServiceDuration')}
                                </label>
                                <input
                                    type="number"
                                    value={defaultServiceDuration}
                                    onChange={(e) => setDefaultServiceDuration(parseInt(e.target.value) || 60)}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    min="1"
                                />
                                <p className="text-xs text-secondary mt-1">{t('settings.durationMinutes')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.currency')}
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                >
                                    <option value="EUR">EUR (€)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.taxRate')}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    min="0"
                                    max="100"
                                />
                                <p className="text-xs text-secondary mt-1">{t('settings.taxRatePercent')}</p>
                            </div>
                        </div>

                        {/* SEPA Payment */}
                        <div className="space-y-3 pt-4 border-t-2 border-[var(--primary)]">
                            <h4 className="font-semibold text-primary">{t('settings.sepaPayment')}</h4>
                            <p className="text-xs text-secondary mb-3">{t('settings.sepaPaymentInfo')}</p>
                            
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.iban')} *
                                </label>
                                <input
                                    type="text"
                                    value={sepaIban}
                                    onChange={(e) => setSepaIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                    placeholder={t('settings.ibanPlaceholder')}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    maxLength={34}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.bic')}
                                </label>
                                <input
                                    type="text"
                                    value={sepaBic}
                                    onChange={(e) => setSepaBic(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                    placeholder={t('settings.bicPlaceholder')}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">
                                    {t('settings.accountHolder')} *
                                </label>
                                <input
                                    type="text"
                                    value={sepaAccountHolder}
                                    onChange={(e) => setSepaAccountHolder(e.target.value)}
                                    placeholder={t('settings.accountHolderPlaceholder')}
                                    className="w-full px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t-2 border-[var(--primary)]">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? t('common.saving') : t('common.save')}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingSettings(false)
                                    loadSettings() // Reset form
                                }}
                                className="px-4 py-2 border-2 border-[var(--primary)] text-[var(--primary)] font-semibold rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Display current settings */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-primary">{t('settings.notifications')}</h4>
                            <p className="text-sm text-secondary">
                                {t('settings.emailNotificationsValue', { value: settings?.emailNotifications ? t('common.yes') : t('common.no') })}
                            </p>
                            <p className="text-sm text-secondary">
                                {t('settings.smsNotificationsValue', { value: settings?.smsNotifications ? t('common.yes') : t('common.no') })}
                            </p>
                            <p className="text-sm text-secondary">
                                {t('settings.reminderBeforeAppointmentValue', { minutes: (settings?.reminderBeforeAppointment || 30).toString() })}
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t-2 border-[var(--primary)]">
                            <h4 className="font-semibold text-primary">{t('settings.business')}</h4>
                            <p className="text-sm text-secondary">
                                {t('settings.defaultServiceDurationValue', { duration: (settings?.defaultServiceDuration || 60).toString() })}
                            </p>
                            <p className="text-sm text-secondary">
                                {t('settings.currencyValue', { currency: settings?.currency || 'EUR' })}
                            </p>
                            <p className="text-sm text-secondary">
                                {t('settings.taxRateValue', { rate: settings?.taxRate || '0.00' })}
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t-2 border-[var(--primary)]">
                            <h4 className="font-semibold text-primary">{t('settings.sepaPayment')}</h4>
                            {settings?.preferences?.sepaPayment?.iban ? (
                                <>
                                    <p className="text-sm text-secondary">
                                        {t('settings.ibanValue', { iban: formatIban(settings.preferences.sepaPayment.iban) })}
                                    </p>
                                    {settings.preferences.sepaPayment.bic && (
                                        <p className="text-sm text-secondary">
                                            {t('settings.bicValue', { bic: settings.preferences.sepaPayment.bic })}
                                        </p>
                                    )}
                                    {settings.preferences.sepaPayment.accountHolder && (
                                        <p className="text-sm text-secondary">
                                            {t('settings.accountHolderValue', { holder: settings.preferences.sepaPayment.accountHolder })}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-secondary">{t('settings.noSepaPayment')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Logout */}
            <div className="card-3d">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-red-600 font-semibold border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                    <span>{t('auth.logout')}</span>
                </button>
            </div>
        </div>
    )
}
