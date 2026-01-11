// /app/register/page.tsx

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Alert } from '@/components/Alert'
import { LanguageSelector } from '@/components/LanguageSelector'
import { getBusinessIdInfo, SUPPORTED_COUNTRIES, type Country } from '@/lib/utils/business-id'

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()
    const { t, language } = useLanguage()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        profession: '',
        phone: '',
        country: 'France' as Country,
        businessId: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    // Get business ID info based on selected country
    const businessIdInfo = useMemo(() => getBusinessIdInfo(formData.country, language), [formData.country, language])

    const professions = [
        { value: 'infirmiere', translationKey: 'professionInfirmiere' },
        { value: 'aide_soignante', translationKey: 'professionAideSoignante' },
        { value: 'agent_entretien', translationKey: 'professionAgentEntretien' },
        { value: 'aide_domicile', translationKey: 'professionAideDomicile' },
        { value: 'garde_enfants', translationKey: 'professionGardeEnfants' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate business name
        if (!formData.businessName || formData.businessName.trim().length < 2) {
            setError(t('auth.businessNameRequired'))
            setLoading(false)
            return
        }

        // Phone is required for both types
        if (!formData.phone) {
            setError(t('auth.phoneRequired'))
            setLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordMismatch'))
            setLoading(false)
            return
        }

        if (formData.password.length < 8) {
            setError(t('auth.passwordMinLength'))
            setLoading(false)
            return
        }

        // Validate business ID based on country
        if (!formData.businessId) {
            setError(t('auth.businessIdRequired'))
            setLoading(false)
            return
        }

        if (!businessIdInfo.validate(formData.businessId)) {
            setError(t('auth.businessIdInvalid'))
            setLoading(false)
            return
        }

        try {
            // Clean phone number (remove spaces)
            const phoneCleaned = formData.phone.replace(/\s/g, '')
            
            // Clean business ID (remove spaces, convert to uppercase for VAT)
            const businessIdCleaned = formData.businessId.replace(/\s/g, '').toUpperCase()
            
            await register(
                formData.email,
                formData.password,
                formData.businessName,
                phoneCleaned,
                formData.profession || undefined,
                formData.country,
                businessIdCleaned
            )
            router.push('/dashboard')
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t('auth.registerError')
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-checkered flex items-center justify-center p-4 w-full max-w-full overflow-x-hidden">
            <div className="absolute top-4 right-4">
                <LanguageSelector />
            </div>
            <div className="card-3d max-w-md w-full">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">{t('auth.register')}</h1>
                
                {error && (
                    <Alert message={error} type="error" onClose={() => setError('')} />
                )}

                <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('auth.register')}>
                    {/* Business Name - Simplifié */}
                    <div>
                        <label htmlFor="register-business-name" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.businessName')} *
                        </label>
                        <input
                            id="register-business-name"
                            type="text"
                            required
                            autoComplete="organization"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="Ex: Macia Interim, Jean Pascal, SARL Mirano..."
                        />
                        <p className="text-xs text-secondary mt-1">
                            Nom de votre entreprise ou votre nom professionnel
                        </p>
                    </div>

                    {/* Profession - Optionnel */}
                    <div>
                        <label htmlFor="register-profession" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.profession')} <span className="text-secondary text-xs">(optionnel)</span>
                        </label>
                        <select
                            id="register-profession"
                            value={formData.profession}
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            aria-label={t('auth.selectProfessionAria')}
                        >
                            <option value="">{t('auth.selectProfession')}</option>
                            {professions.map((prof) => (
                                <option key={prof.value} value={prof.value}>
                                    {t(`auth.${prof.translationKey}`)}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-secondary mt-1">
                            Laissez vide si vous êtes une entreprise envoyant des missions
                        </p>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="register-email" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.email')} *
                        </label>
                        <input
                            id="register-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('auth.emailPlaceholder')}
                            aria-required="true"
                        />
                    </div>

                    {/* Téléphone - dans les deux cas */}
                    <div>
                        <label htmlFor="register-phone" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.phone')} *
                        </label>
                        <input
                            id="register-phone"
                            type="tel"
                            required
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                // Format phone number (remove all non-digits, then format)
                                const digitsOnly = e.target.value.replace(/\D/g, '')
                                let formatted = digitsOnly
                                if (digitsOnly.length > 2) {
                                    formatted = digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2)
                                }
                                if (digitsOnly.length > 4) {
                                    formatted = digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2, 4) + ' ' + digitsOnly.slice(4)
                                }
                                if (digitsOnly.length > 6) {
                                    formatted = digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2, 4) + ' ' + digitsOnly.slice(4, 6) + ' ' + digitsOnly.slice(6)
                                }
                                if (digitsOnly.length > 8) {
                                    formatted = digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2, 4) + ' ' + digitsOnly.slice(4, 6) + ' ' + digitsOnly.slice(6, 8) + ' ' + digitsOnly.slice(8, 10)
                                }
                                setFormData({ ...formData, phone: formatted })
                            }}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('auth.phonePlaceholder')}
                            aria-required="true"
                            maxLength={14}
                        />
                    </div>

                    {/* Pays */}
                    <div>
                        <label htmlFor="register-country" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.country')} *
                        </label>
                        <select
                            id="register-country"
                            required
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value as Country })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            aria-required="true"
                        >
                            {SUPPORTED_COUNTRIES.map((country) => (
                                <option key={country.value} value={country.value}>
                                    {country.label[language]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Identifiant professionnel (SIRET, VAT, etc.) */}
                    <div>
                        <label htmlFor="register-business-id" className="block text-sm font-semibold text-primary mb-1">
                            {businessIdInfo.label} *
                        </label>
                        <input
                            id="register-business-id"
                            type="text"
                            required
                            value={formData.businessId}
                            onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={businessIdInfo.placeholder}
                            aria-required="true"
                            aria-describedby="business-id-help"
                            maxLength={businessIdInfo.maxLength}
                        />
                        <div id="business-id-help" className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-[var(--text-primary)]">
                                <strong className="text-[var(--primary)]">⚠️ {formData.profession ? businessIdInfo.noticePhysical : businessIdInfo.noticeLegal}</strong>
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="register-password" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.password')} *
                        </label>
                        <input
                            id="register-password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('auth.passwordMinPlaceholder')}
                            aria-required="true"
                            aria-describedby="password-help"
                        />
                        <p id="password-help" className="sr-only">Le mot de passe doit contenir au moins 8 caractères</p>
                    </div>

                    <div>
                        <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.confirmPassword')} *
                        </label>
                        <input
                            id="register-confirm-password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('auth.passwordPlaceholder')}
                            aria-required="true"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                        aria-busy={loading}
                    >
                        {loading ? t('common.loading') : t('auth.registerButton')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-secondary">
                        {t('auth.alreadyHaveAccount')}{' '}
                        <a href="/login" className="text-[var(--primary)] font-semibold">
                            {t('auth.login')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

