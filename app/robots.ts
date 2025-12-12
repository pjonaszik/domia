// /app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domia.app'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/dashboard/',      // Dashboard privé - accès authentifié requis
          '/api/',  // API - privé
          '/api/',            // Toutes les API - privées
          '/login',           // Page de connexion - ne doit pas être indexée
          '/register',        // Page d'inscription - ne doit pas être indexée
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

