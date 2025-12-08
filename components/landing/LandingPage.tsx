// /components/landing/LandingPage.tsx

'use client'

import '@fortawesome/fontawesome-free/css/all.min.css'

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--bg-secondary)] to-white">
            <main id="main-content">
            {/* Hero Section */}
            <section aria-labelledby="hero-title" className="container mx-auto px-5 pt-20 pb-12 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <h1 id="hero-title" className="text-5xl md:text-6xl font-bold text-primary mb-4">
                            Domia
                        </h1>
                        <p className="text-2xl md:text-3xl text-secondary font-semibold mb-6">
                            Vos tournées optimisées, vos journées simplifiées
                        </p>
                        <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                            L'outil tout-en-un qui facilite le travail quotidien des indépendants du service à la personne.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <a 
                            href="/register" 
                            className="btn-primary px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            aria-label="Créer un compte gratuitement sur Domia"
                        >
                            <i className="fas fa-rocket mr-2" aria-hidden="true"></i>
                            Commencer gratuitement
                        </a>
                        <a 
                            href="/login" 
                            className="px-8 py-4 text-lg font-semibold rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                            aria-label="Se connecter à votre compte Domia"
                        >
                            Se connecter
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section aria-labelledby="features-title" className="container mx-auto px-5 py-16">
                <h2 id="features-title" className="text-3xl font-bold text-primary text-center mb-12">
                    Tout ce dont vous avez besoin en un seul endroit
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Feature 1 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                            <i className="fas fa-users text-3xl text-[var(--primary)]"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Gestion des clients</h3>
                        <p className="text-text-secondary">
                            Gérez facilement vos clients, leurs informations, leurs préférences et leur historique.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                            <i className="fas fa-calendar-alt text-3xl text-[var(--secondary)]"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Planning intelligent</h3>
                        <p className="text-text-secondary">
                            Organisez vos rendez-vous avec un calendrier intuitif et des rappels automatiques.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                            <i className="fas fa-route text-3xl text-purple-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Optimisation des tournées</h3>
                        <p className="text-text-secondary">
                            Optimisez automatiquement vos déplacements pour gagner du temps et réduire les trajets.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                            <i className="fas fa-file-invoice text-3xl text-green-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Facturation simplifiée</h3>
                        <p className="text-text-secondary">
                            Créez et gérez vos factures en quelques clics. Export PDF disponible.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                            <i className="fas fa-chart-line text-3xl text-orange-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Statistiques détaillées</h3>
                        <p className="text-text-secondary">
                            Suivez vos performances, vos revenus et votre activité avec des tableaux de bord clairs.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="card-3d p-6 hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                            <i className="fas fa-mobile-alt text-3xl text-pink-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-3">Accessible partout</h3>
                        <p className="text-text-secondary">
                            Accédez à vos données depuis n'importe quel appareil, à tout moment.
                        </p>
                    </div>
                </div>
            </section>

            {/* Who is it for Section */}
            <section aria-labelledby="who-title" className="bg-[var(--bg-secondary)] py-16">
                <div className="container mx-auto px-5">
                    <h2 id="who-title" className="text-3xl font-bold text-primary text-center mb-12">
                        Pour qui ?
                    </h2>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
                        {[
                            { icon: 'fa-user-nurse', title: 'Infirmières libérales', bgClass: 'bg-blue-100', iconClass: 'text-blue-600' },
                            { icon: 'fa-hands-helping', title: 'Aides-soignantes indépendantes', bgClass: 'bg-teal-100', iconClass: 'text-teal-600' },
                            { icon: 'fa-broom', title: 'Agents d\'entretien', bgClass: 'bg-green-100', iconClass: 'text-green-600' },
                            { icon: 'fa-home', title: 'Aide à domicile', bgClass: 'bg-orange-100', iconClass: 'text-orange-600' },
                            { icon: 'fa-baby', title: 'Garde d\'enfants', bgClass: 'bg-pink-100', iconClass: 'text-pink-600' },
                        ].map((profession, index) => (
                            <div 
                                key={index}
                                className="card-3d p-6 text-center hover:shadow-xl transition-all"
                            >
                                <div className={`w-16 h-16 rounded-full ${profession.bgClass} flex items-center justify-center mx-auto mb-4`}>
                                    <i className={`fas ${profession.icon} text-2xl ${profession.iconClass}`}></i>
                                </div>
                                <h3 className="font-semibold text-primary">{profession.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section aria-labelledby="benefits-title" className="container mx-auto px-5 py-16">
                <h2 id="benefits-title" className="text-3xl font-bold text-primary text-center mb-12">
                    Pourquoi choisir Domia ?
                </h2>
                
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-clock text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">Gagnez du temps</h3>
                            <p className="text-text-secondary">
                                Automatisez vos tâches administratives et concentrez-vous sur l'essentiel : vos clients.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-[var(--secondary)] text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-euro-sign text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">Optimisez vos revenus</h3>
                            <p className="text-text-secondary">
                                Réduisez vos déplacements et maximisez votre productivité grâce à l'optimisation des tournées.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-shield-alt text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">Sécurisé et fiable</h3>
                            <p className="text-text-secondary">
                                Vos données sont protégées et sauvegardées en toute sécurité. Conforme RGPD.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-lg bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-heart text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">Conçu pour vous</h3>
                            <p className="text-text-secondary">
                                Développé spécifiquement pour les professionnels du service à la personne en France.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section aria-labelledby="cta-title" className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] py-16 text-white">
                <div className="container mx-auto px-5 text-center">
                    <h2 id="cta-title" className="text-3xl md:text-4xl font-bold mb-6">
                        Prêt à simplifier votre quotidien ?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Rejoignez les professionnels qui font confiance à Domia
                    </p>
                    <a 
                        href="/register" 
                        className="inline-block bg-white text-[var(--primary)] px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        aria-label="Créer mon compte gratuitement sur Domia"
                    >
                        <i className="fas fa-rocket mr-2" aria-hidden="true"></i>
                        Créer mon compte gratuitement
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
                            <p className="text-sm opacity-75">Vos tournées optimisées, vos journées simplifiées</p>
                        </div>
                        <div className="flex gap-6">
                            <a href="/terms" className="text-sm hover:underline opacity-75 hover:opacity-100">
                                Conditions d'utilisation
                            </a>
                            <a href="/privacy" className="text-sm hover:underline opacity-75 hover:opacity-100">
                                Politique de confidentialité
                            </a>
                        </div>
                    </div>
                    <div className="border-t border-white/20 mt-6 pt-6 text-center text-sm opacity-75">
                        <p>&copy; {new Date().getFullYear()} Domia. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

