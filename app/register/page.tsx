// /app/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Toast } from '@/components/Toast'
import { LanguageSelector } from '@/components/LanguageSelector'

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()
    const { t } = useLanguage()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        profession: '',
        siret: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

    const professions = [
        { value: 'infirmiere', label: 'Infirmière libérale' },
        { value: 'aide_soignante', label: 'Aide-soignante indépendante' },
        { value: 'agent_entretien', label: 'Agent d\'entretien' },
        { value: 'aide_domicile', label: 'Aide à domicile' },
        { value: 'garde_enfants', label: 'Garde d\'enfants' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

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

        // Validate SIRET format (14 digits)
        if (!formData.siret) {
            setError(t('auth.siretRequired'))
            setLoading(false)
            return
        }

        const siretRegex = /^\d{14}$/
        const siretCleaned = formData.siret.replace(/\s/g, '')
        if (!siretRegex.test(siretCleaned)) {
            setError(t('auth.siretInvalid'))
            setLoading(false)
            return
        }

        try {
            await register(
                formData.email,
                formData.password,
                formData.firstName || undefined,
                formData.lastName || undefined,
                formData.profession || undefined,
                siretCleaned
            )
            router.push('/')
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t('auth.registerError')
            setError(errorMsg)
            setToast({ message: errorMsg, show: true })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-checkered flex items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <LanguageSelector />
            </div>
            <div className="card-3d max-w-md w-full">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">{t('auth.register')}</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('auth.register')}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="register-firstname" className="block text-sm font-semibold text-primary mb-1">
                                {t('auth.firstName')}
                            </label>
                            <input
                                id="register-firstname"
                                type="text"
                                autoComplete="given-name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div>
                            <label htmlFor="register-lastname" className="block text-sm font-semibold text-primary mb-1">
                                {t('auth.lastName')}
                            </label>
                            <input
                                id="register-lastname"
                                type="text"
                                autoComplete="family-name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>
                    </div>

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
                            placeholder="votre@email.com"
                            aria-required="true"
                        />
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
                            aria-label="Sélectionner votre profession"
                        >
                            <option value="">Sélectionner une profession</option>
                            {professions.map((prof) => (
                                <option key={prof.value} value={prof.value}>
                                    {prof.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="register-siret" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.siret')} *
                        </label>
                        <input
                            id="register-siret"
                            type="text"
                            required
                            value={formData.siret}
                            onChange={(e) => {
                                // Only allow digits, remove all non-digits
                                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 14)
                                // Format with spaces: 123 456 789 01234
                                let formatted = digitsOnly
                                if (digitsOnly.length > 3) {
                                    formatted = digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3)
                                }
                                if (digitsOnly.length > 6) {
                                    formatted = digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3, 6) + ' ' + digitsOnly.slice(6)
                                }
                                if (digitsOnly.length > 9) {
                                    formatted = digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3, 6) + ' ' + digitsOnly.slice(6, 9) + ' ' + digitsOnly.slice(9)
                                }
                                setFormData({ ...formData, siret: formatted })
                            }}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="123 456 789 01234"
                            aria-required="true"
                            aria-describedby="siret-help"
                        />
                        <div id="siret-help" className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-[var(--text-primary)]">
                                <strong className="text-[var(--primary)]">⚠️ Important :</strong> {t('auth.siretNotice')}
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
                            placeholder="Au moins 8 caractères"
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
                            placeholder="••••••••"
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
            <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
        </div>
    )
}

