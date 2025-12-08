// /app/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Toast } from '@/components/Toast'

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        profession: '',
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
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères')
            setLoading(false)
            return
        }

        try {
            await register(
                formData.email,
                formData.password,
                formData.firstName || undefined,
                formData.lastName || undefined,
                formData.profession || undefined
            )
            router.push('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
            setToast({ message: err instanceof Error ? err.message : 'Erreur lors de l\'inscription', show: true })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-checkered flex items-center justify-center p-4">
            <div className="card-3d max-w-md w-full">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">Inscription</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                Prénom
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-primary mb-1">
                                Nom
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-primary mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="votre@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-primary mb-1">
                            Profession
                        </label>
                        <select
                            value={formData.profession}
                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
                        <label className="block text-sm font-semibold text-primary mb-1">
                            Mot de passe *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="Au moins 8 caractères"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-primary mb-1">
                            Confirmer le mot de passe *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-secondary">
                        Déjà un compte ?{' '}
                        <a href="/login" className="text-[var(--primary)] font-semibold">
                            Se connecter
                        </a>
                    </p>
                </div>
            </div>
            <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
        </div>
    )
}

