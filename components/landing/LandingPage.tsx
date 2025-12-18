// /components/landing/LandingPage.tsx

'use client'

import '@fortawesome/fontawesome-free/css/all.min.css'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/LanguageSelector'

export function LandingPage() {
    const { t } = useLanguage()
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--bg-secondary)] to-white w-full max-w-full overflow-x-hidden">
            <div className="absolute top-4 right-4 z-10 max-w-[calc(100vw-2rem)]">
                <LanguageSelector />
            </div>
            <main id="main-content">
            {/* Hero Section */}
            <section aria-labelledby="hero-title" className="container mx-auto px-5 pt-20 pb-12 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <h1 id="hero-title" className="text-5xl md:text-6xl font-bold text-primary mb-4">
                            {t('landing.title')}
                        </h1>
                        <p className="text-2xl md:text-3xl text-secondary font-semibold mb-6">
                            {t('landing.subtitle')}
                        </p>
                        <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                            {t('landing.description')}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <a 
                            href="/register" 
                            className="btn-primary px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            aria-label={t('landing.getStarted')}
                        >
                            <i className="fas fa-rocket mr-2" aria-hidden="true"></i>
                            {t('landing.getStarted')}
                        </a>
                        <a 
                            href="/login" 
                            className="px-8 py-4 text-lg font-semibold rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                            aria-label={t('landing.login')}
                        >
                            {t('landing.login')}
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section aria-labelledby="features-title" className="container mx-auto px-5 py-16">
                <h2 id="features-title" className="text-3xl font-bold text-primary text-center mb-12">
                    {t('landing.featuresTitle')}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Feature 1 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                            <i className="fas fa-users text-3xl text-[var(--primary)]"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">{t('landing.feature1Title')}</h3>
                        <p className="text-text-secondary">
                            {t('landing.feature1Desc')}
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                            <i className="fas fa-calendar-alt text-3xl text-[var(--secondary)]"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">{t('landing.feature2Title')}</h3>
                        <p className="text-text-secondary">
                            {t('landing.feature2Desc')}
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                            <i className="fas fa-route text-3xl text-purple-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">{t('landing.feature3Title')}</h3>
                        <p className="text-text-secondary">
                            {t('landing.feature3Desc')}
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                            <i className="fas fa-chart-line text-3xl text-orange-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">{t('landing.feature4Title')}</h3>
                        <p className="text-text-secondary">
                            {t('landing.feature4Desc')}
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                            <i className="fas fa-mobile-alt text-3xl text-pink-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">{t('landing.feature5Title')}</h3>
                        <p className="text-text-secondary">
                            {t('landing.feature5Desc')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Who is it for Section */}
            <section aria-labelledby="who-title" className="bg-[var(--bg-secondary)] py-16">
                <div className="container mx-auto px-5">
                    <h2 id="who-title" className="text-3xl font-bold text-primary text-center mb-12">
                        {t('landing.whoTitle')}
                    </h2>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
                        {[
                            { icon: 'fa-user-nurse', titleKey: 'profession1', bgClass: 'bg-blue-100', iconClass: 'text-blue-600' },
                            { icon: 'fa-hands-helping', titleKey: 'profession2', bgClass: 'bg-teal-100', iconClass: 'text-teal-600' },
                            { icon: 'fa-broom', titleKey: 'profession3', bgClass: 'bg-green-100', iconClass: 'text-green-600' },
                            { icon: 'fa-home', titleKey: 'profession4', bgClass: 'bg-orange-100', iconClass: 'text-orange-600' },
                            { icon: 'fa-baby', titleKey: 'profession5', bgClass: 'bg-pink-100', iconClass: 'text-pink-600' },
                        ].map((profession, index) => (
                            <div 
                                key={index}
                                className="card-3d p-6 text-center hover:shadow-xl transition-all"
                            >
                                <div className={`w-16 h-16 rounded-full ${profession.bgClass} flex items-center justify-center mx-auto mb-4`}>
                                    <i className={`fas ${profession.icon} text-2xl ${profession.iconClass}`}></i>
                                </div>
                                <h3 className="font-semibold text-primary">{t(`landing.${profession.titleKey}`)}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section aria-labelledby="benefits-title" className="container mx-auto px-5 py-16">
                <h2 id="benefits-title" className="text-3xl font-bold text-primary text-center mb-12">
                    {t('landing.benefitsTitle')}
                </h2>
                
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-clock text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">{t('landing.benefit1Title')}</h3>
                            <p className="text-text-secondary">
                                {t('landing.benefit1Desc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-[var(--secondary)] text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-euro-sign text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">{t('landing.benefit2Title')}</h3>
                            <p className="text-text-secondary">
                                {t('landing.benefit2Desc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-shield-alt text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">{t('landing.benefit3Title')}</h3>
                            <p className="text-text-secondary">
                                {t('landing.benefit3Desc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-heart text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">{t('landing.benefit4Title')}</h3>
                            <p className="text-text-secondary">
                                {t('landing.benefit4Desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section aria-labelledby="cta-title" className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] py-16 text-white">
                <div className="container mx-auto px-5 text-center">
                    <h2 id="cta-title" className="text-3xl md:text-4xl font-bold mb-6">
                        {t('landing.ctaTitle')}
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        {t('landing.ctaDesc')}
                    </p>
                    <a 
                        href="/register" 
                        className="inline-block bg-white text-[var(--primary)] px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        aria-label={t('landing.ctaButtonAria')}
                    >
                        <i className="fas fa-rocket mr-2" aria-hidden="true"></i>
                        {t('landing.ctaButton')}
                    </a>
                </div>
            </section>
            </main>

            {/* Footer */}
            <footer className="bg-[var(--text-primary)] text-white py-8">
                <div className="container mx-auto px-5">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Domia</h3>
                            <p className="text-sm opacity-75">{t('landing.footerTagline')}</p>
                        </div>
                        <div className="flex gap-6">
                            <a href="/terms" className="text-sm hover:underline opacity-75 hover:opacity-100">
                                {t('landing.footerTerms')}
                            </a>
                            <a href="/privacy" className="text-sm hover:underline opacity-75 hover:opacity-100">
                                {t('landing.footerPrivacy')}
                            </a>
                        </div>
                    </div>
                    <div className="border-t border-white/20 mt-6 pt-6 text-center text-sm opacity-75">
                        <p>&copy; {new Date().getFullYear()} Domia. {t('landing.footerRights')}.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

