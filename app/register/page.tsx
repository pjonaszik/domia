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
        firstName: '',
        lastName: '',
        companyName: '',
        personType: 'physical' as 'physical' | 'legal',
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

        // Validate required fields based on person type
        if (formData.personType === 'physical') {
            if (!formData.firstName) {
                setError(t('auth.firstNameRequired'))
                setLoading(false)
                return
            }
            if (!formData.lastName) {
                setError(t('auth.lastNameRequired'))
                setLoading(false)
                return
            }
        } else {
            if (!formData.companyName) {
                setError(t('auth.companyNameRequired'))
                setLoading(false)
                return
            }
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
            // For physical person: use firstName/lastName
            // For legal entity: use companyName as lastName, firstName as null
            const firstName = formData.personType === 'physical' ? formData.firstName : null
            const lastName = formData.personType === 'physical' ? formData.lastName : formData.companyName
            const profession = formData.personType === 'physical' ? formData.profession : null
            
            // Clean phone number (remove spaces)
            const phoneCleaned = formData.phone ? formData.phone.replace(/\s/g, '') : undefined
            
            // Clean business ID (remove spaces, convert to uppercase for VAT)
            const businessIdCleaned = formData.businessId.replace(/\s/g, '').toUpperCase()
            
            await register(
                formData.email,
                formData.password,
                firstName || undefined,
                lastName || undefined,
                profession || undefined,
                businessIdCleaned,
                phoneCleaned,
                formData.country
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
                    {/* Type de personne - EN PREMIER */}
                    <div>
                        <label className="block text-sm font-semibold text-primary mb-2">
                            {t('auth.personType')} *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="personType"
                                    value="physical"
                                    checked={formData.personType === 'physical'}
                                    onChange={(e) => setFormData({ ...formData, personType: e.target.value as 'physical' | 'legal' })}
                                    className="mr-2"
                                />
                                <span>{t('auth.personTypePhysical')}</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="personType"
                                    value="legal"
                                    checked={formData.personType === 'legal'}
                                    onChange={(e) => setFormData({ ...formData, personType: e.target.value as 'physical' | 'legal' })}
                                    className="mr-2"
                                />
                                <span>{t('auth.personTypeLegal')}</span>
                            </label>
                        </div>
                    </div>

                    {/* Champs conditionnels selon le type */}
                    {formData.personType === 'physical' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="register-firstname" className="block text-sm font-semibold text-primary mb-1">
                                        {t('auth.firstName')} *
                                    </label>
                                    <input
                                        id="register-firstname"
                                        type="text"
                                        required
                                        autoComplete="given-name"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="register-lastname" className="block text-sm font-semibold text-primary mb-1">
                                        {t('auth.lastName')} *
                                    </label>
                                    <input
                                        id="register-lastname"
                                        type="text"
                                        required
                                        autoComplete="family-name"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="register-profession" className="block text-sm font-semibold text-primary mb-1">
                                    {t('auth.profession')}
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
                            </div>
                        </>
                    ) : (
                        <div>
                            <label htmlFor="register-company-name" className="block text-sm font-semibold text-primary mb-1">
                                {t('auth.companyName')} *
                            </label>
                            <input
                                id="register-company-name"
                                type="text"
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>
                    )}

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
                                <strong className="text-[var(--primary)]">⚠️ {formData.personType === 'physical' ? businessIdInfo.noticePhysical : businessIdInfo.noticeLegal}</strong>
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

