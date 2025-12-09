// /components/dashboard/DashboardHeader.tsx

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import '@fortawesome/fontawesome-free/css/all.min.css'

interface DashboardHeaderProps {
    onNavigateToAccount?: () => void
}

export function DashboardHeader({ onNavigateToAccount }: DashboardHeaderProps) {
    const { t } = useLanguage()

    return (
        <header 
            className="fixed top-0 left-0 right-0 bg-white z-50 border-b-4 border-[var(--primary)]"
            style={{
                paddingTop: 'calc(15px + env(safe-area-inset-top))',
                paddingBottom: '15px',
                paddingLeft: '20px',
                paddingRight: '20px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '100vw'
            }}
            role="banner"
        >
            <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Logo/Title */}
                <h1 className="text-2xl font-bold text-[var(--primary)]">
                    Domia
                </h1>

                {/* User Menu Button */}
                <button
                    onClick={() => onNavigateToAccount?.()}
                    className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                    aria-label={t('header.userMenu')}
                >
                    <i className="fas fa-user" aria-hidden="true"></i>
                </button>
            </div>
        </header>
    )
}

