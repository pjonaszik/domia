// /app/privacy/page.tsx - Privacy Policy Page

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import '@fortawesome/fontawesome-free/css/all.min.css'

export default function PrivacyPage() {
    const { t } = useLanguage()
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec] p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
                        aria-label="Retour"
                    >
                        <i className="fas fa-arrow-left text-[var(--primary)]" aria-hidden="true"></i>
                    </button>
                    <h1 className="text-3xl font-bold text-primary">
                        <i className="fas fa-shield-alt mr-3" aria-hidden="true"></i>
                        {t('account.privacyPolicy')}
                    </h1>
                </div>

                {/* Content */}
                <div className="card-3d space-y-6">
                    <p className="text-sm text-secondary">
                        <strong>Dernière mise à jour :</strong> 10 janvier 2026
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">1. Introduction</h2>
                        <p className="text-secondary">
                            Domia s'engage à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité 
                            explique comment nous collectons, utilisons et protégeons vos informations conformément au Règlement Général 
                            sur la Protection des Données (RGPD).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">2. Données Collectées</h2>
                        <p className="text-secondary mb-2">Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :</p>
                        <ul className="list-disc list-inside space-y-1 text-secondary ml-4">
                            <li><strong>Informations de compte</strong> : nom professionnel/entreprise, email, téléphone, profession</li>
                            <li><strong>Informations de mission</strong> : adresses, horaires, notes professionnelles</li>
                            <li><strong>Données de paiement</strong> : IBAN/BIC (stockés de manière sécurisée)</li>
                            <li><strong>Données de localisation</strong> : coordonnées GPS pour le calcul de distance (optionnel)</li>
                        </ul>
                        <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                            <p className="text-sm text-green-800">
                                <i className="fas fa-check-circle mr-2" aria-hidden="true"></i>
                                <strong>Nous ne collectons AUCUNE donnée médicale ou de santé.</strong> Ces informations doivent être 
                                gérées directement entre le professionnel et le client, hors plateforme.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">3. Utilisation des Données</h2>
                        <p className="text-secondary mb-2">Vos données sont utilisées uniquement pour :</p>
                        <ul className="list-disc list-inside space-y-1 text-secondary ml-4">
                            <li>Gérer votre compte et authentification</li>
                            <li>Faciliter la mise en relation entre professionnels et clients</li>
                            <li>Gérer les missions, plannings et validations d'heures</li>
                            <li>Traiter les paiements</li>
                            <li>Envoyer des notifications relatives au service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">4. Vos Droits (RGPD)</h2>
                        <p className="text-secondary mb-2">Conformément au RGPD, vous disposez des droits suivants :</p>
                        <ul className="list-disc list-inside space-y-1 text-secondary ml-4">
                            <li><strong>Droit d'accès</strong> : Consulter vos données personnelles</li>
                            <li><strong>Droit de rectification</strong> : Modifier vos données inexactes</li>
                            <li><strong>Droit à l'effacement</strong> : Supprimer votre compte et vos données</li>
                            <li><strong>Droit à la portabilité</strong> : Exporter vos données au format JSON</li>
                            <li><strong>Droit d'opposition</strong> : Refuser certains traitements</li>
                        </ul>
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <p className="text-sm text-blue-800">
                                <i className="fas fa-info-circle mr-2" aria-hidden="true"></i>
                                Pour exercer vos droits, rendez-vous dans <strong>Mon Compte → Protection des Données</strong> 
                                ou contactez-nous à <a href="mailto:privacy@domia.fr" className="underline">privacy@domia.fr</a>
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">5. Sécurité</h2>
                        <p className="text-secondary mb-2">Nous mettons en œuvre des mesures de sécurité strictes :</p>
                        <ul className="list-disc list-inside space-y-1 text-secondary ml-4">
                            <li>Chiffrement des mots de passe (bcrypt 12 rounds)</li>
                            <li>Authentification sécurisée par JWT</li>
                            <li>Connexion base de données SSL obligatoire</li>
                            <li>Rate-limiting pour prévenir les abus</li>
                            <li>Logs d'audit pour les actions sensibles</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">6. Conservation des Données</h2>
                        <p className="text-secondary">
                            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, 
                            vos données personnelles sont effacées sous 30 jours (sauf obligations légales de conservation).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">7. Partage des Données</h2>
                        <p className="text-secondary">
                            Nous ne vendons ni ne louons vos données personnelles. Vos informations sont partagées uniquement 
                            avec les professionnels/clients concernés par vos missions, et dans la limite strictement nécessaire 
                            au service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">8. Cookies</h2>
                        <p className="text-secondary">
                            Nous utilisons uniquement des cookies essentiels au fonctionnement de la plateforme (authentification, 
                            préférences linguistiques). Aucun cookie de tracking publicitaire n'est utilisé.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-primary mb-3">9. Contact</h2>
                        <p className="text-secondary">
                            Pour toute question concernant cette politique de confidentialité ou l'exercice de vos droits :
                        </p>
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                            <p className="text-secondary">
                                <strong>Email :</strong> <a href="mailto:privacy@domia.fr" className="text-[var(--primary)] underline">privacy@domia.fr</a><br />
                                <strong>Responsable du traitement :</strong> Domia<br />
                                <strong>Délégué à la Protection des Données (DPO) :</strong> dpo@domia.fr
                            </p>
                        </div>
                    </section>

                    <section className="pt-4 border-t-2 border-gray-200">
                        <p className="text-xs text-secondary italic">
                            Cette politique de confidentialité peut être mise à jour. La date de dernière modification est indiquée en haut de page.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
