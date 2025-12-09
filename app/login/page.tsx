// /app/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Toast } from '@/components/Toast'
import { LanguageSelector } from '@/components/LanguageSelector'

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()
    const { t } = useLanguage()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await login(email, password)
            router.push('/dashboard')
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t('auth.loginError')
            setError(errorMsg)
            setToast({ message: errorMsg, show: true })
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
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">{t('auth.login')}</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('auth.login')}>
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.email')}
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('auth.emailPlaceholder')}
                            aria-required="true"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-semibold text-primary mb-1">
                            {t('auth.password')}
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? t('common.loading') : t('auth.loginButton')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-secondary">
                        {t('auth.noAccount')}{' '}
                        <a href="/register" className="text-[var(--primary)] font-semibold">
                            {t('auth.register')}
                        </a>
                    </p>
                </div>
            </div>
            <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
        </div>
    )
}

