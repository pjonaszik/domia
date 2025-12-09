// /app/privacy/page.tsx

'use client'

import { useRouter } from 'next/navigation'
import '@fortawesome/fontawesome-free/css/all.min.css'

export default function PrivacyPage() {
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
                <h1 className="text-white text-xl font-bold">Politique de Confidentialité</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-5 py-8 pb-24">
                <div className="card-3d space-y-6">
                        <section>
                        <p className="text-sm text-secondary mb-4">
                            Dernière mise à jour : {lastUpdated}
                        </p>
                            <p className="mb-3">
                            Domia ("nous", "notre") respecte votre vie privée et s'engage à protéger vos données personnelles.
                            Cette Politique de Confidentialité explique comment nous collectons, utilisons et protégeons
                            vos informations lorsque vous utilisez notre application.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">1. Données Collectées</h3>
                        <p className="mb-3">Nous collectons les informations suivantes :</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><strong>Informations de compte :</strong> Email, nom, profession</li>
                            <li><strong>Données professionnelles :</strong> Numéro ADELI, SIRET, numéro d'agrément</li>
                            <li><strong>Données clients :</strong> Informations sur vos clients que vous saisissez</li>
                            <li><strong>Données d'utilisation :</strong> Logs d'accès, statistiques d'utilisation</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">2. Utilisation des Données</h3>
                        <p className="mb-3">Nous utilisons vos données pour :</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Fournir et maintenir le service</li>
                            <li>Améliorer l'application et l'expérience utilisateur</li>
                            <li>Vous contacter concernant votre compte</li>
                            <li>Respecter nos obligations légales</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">3. Protection des Données</h3>
                            <p className="mb-3">
                            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Chiffrement des mots de passe</li>
                            <li>Connexions sécurisées (HTTPS)</li>
                            <li>Accès restreint aux données</li>
                            <li>Sauvegardes régulières</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">4. Partage des Données</h3>
                            <p className="mb-3">
                            Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers,
                            sauf dans les cas suivants :
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Avec votre consentement explicite</li>
                            <li>Pour respecter une obligation légale</li>
                            <li>Avec nos prestataires de services (hébergement, etc.) sous contrat de confidentialité</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">5. Vos Droits (RGPD)</h3>
                        <p className="mb-3">Conformément au RGPD, vous avez le droit de :</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Accéder à vos données personnelles</li>
                            <li>Rectifier vos données</li>
                            <li>Supprimer vos données</li>
                            <li>Vous opposer au traitement de vos données</li>
                            <li>Demander la portabilité de vos données</li>
                            </ul>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">6. Conservation des Données</h3>
                            <p className="mb-3">
                            Nous conservons vos données tant que votre compte est actif et selon les durées légales
                            applicables. Vous pouvez demander la suppression de votre compte à tout moment.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">7. Cookies</h3>
                            <p className="mb-3">
                            Nous utilisons des cookies et technologies similaires pour améliorer votre expérience
                            et analyser l'utilisation de l'application.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">8. Modifications</h3>
                            <p className="mb-3">
                            Nous pouvons modifier cette politique de confidentialité. Les modifications seront
                            publiées sur cette page avec une date de mise à jour.
                            </p>
                        </section>

                        <section>
                        <h3 className="text-xl font-bold mb-3 text-primary">9. Contact</h3>
                            <p className="mb-3">
                            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
                            veuillez nous contacter.
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
