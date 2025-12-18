// /app/terms/page.tsx

'use client'

import { useRouter } from 'next/navigation'
import '@fortawesome/fontawesome-free/css/all.min.css'

export default function TermsPage() {
    const router = useRouter()
    const lastUpdated = 'Décembre 2024'

    return (
        <div className="min-h-screen bg-checkered w-full max-w-full overflow-x-hidden">
            <div
                className="sticky top-0 z-10 text-center py-4 px-5 border-b-[5px]"
                style={{
                    background: 'var(--primary)',
                    borderBottomColor: 'var(--primary-dark)',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                    paddingTop: 'calc(15px + env(safe-area-inset-top))'
                }}
            >
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl cursor-pointer hover:scale-110 transition-transform"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-white text-xl font-bold">Conditions d'utilisation</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-5 py-8 pb-24">
                <div className="card-3d space-y-6">
                        <section>
                        <p className="text-sm text-secondary mb-4">
                            Dernière mise à jour : {lastUpdated}
                        </p>
                            <p className="mb-3">
                            En utilisant Domia ("l'Application"), vous acceptez d'être lié par ces Conditions d'utilisation.
                            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'Application.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">1. Description du Service</h3>
                            <p className="mb-3">
                            Domia est une application de gestion pour les professionnels du service à la personne qui permet de :
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Gérer vos clients et leurs informations</li>
                            <li>Planifier et optimiser vos tournées</li>
                            <li>Organiser vos rendez-vous et visites</li>
                            <li>Consulter vos statistiques et rapports</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">2. Compte Utilisateur</h3>
                            <p className="mb-3">
                            Vous êtes responsable de :
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Maintenir la confidentialité de vos identifiants de connexion</li>
                            <li>Toutes les activités qui se produisent sous votre compte</li>
                            <li>Fournir des informations exactes et à jour</li>
                            <li>Respecter les lois et réglementations applicables à votre profession</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">3. Données et Confidentialité</h3>
                        <p className="mb-3">
                            Domia stocke vos données de manière sécurisée. Vous êtes responsable de :
                        </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Respecter la confidentialité des données de vos clients</li>
                            <li>Respecter le RGPD et les réglementations sur la protection des données</li>
                            <li>Ne pas partager vos identifiants avec des tiers</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">4. Utilisation Acceptable</h3>
                            <p className="mb-3">
                            Vous vous engagez à ne pas :
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Utiliser l'application à des fins illégales</li>
                            <li>Tenter d'accéder à des comptes d'autres utilisateurs</li>
                            <li>Modifier, copier ou distribuer le code de l'application</li>
                            <li>Utiliser des robots ou scripts automatisés</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">5. Propriété Intellectuelle</h3>
                            <p className="mb-3">
                            Tous les contenus de l'application Domia, incluant le code, les designs, et les fonctionnalités,
                            sont protégés par le droit d'auteur et appartiennent à leurs propriétaires respectifs.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">6. Limitation de Responsabilité</h3>
                            <p className="mb-3">
                            L'application est fournie "en l'état". Nous ne garantissons pas que l'application sera
                            exempte d'erreurs ou disponible en permanence. Nous ne sommes pas responsables des
                            dommages résultant de l'utilisation de l'application.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">7. Modifications</h3>
                            <p className="mb-3">
                            Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
                            seront publiées sur cette page. Votre utilisation continue de l'application après les
                            modifications constitue votre acceptation des nouvelles conditions.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">8. Contact</h3>
                            <p className="mb-3">
                            Pour toute question concernant ces conditions, veuillez nous contacter.
                            </p>
                        </section>

                    <div className="pt-6 border-t-2 border-[var(--primary)]">
                        <button
                            onClick={() => router.back()}
                            className="btn-primary w-full"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
