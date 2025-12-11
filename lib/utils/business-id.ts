// /lib/utils/business-id.ts
// Utility functions for business ID formatting and validation by country

export type Country = string

export interface BusinessIdInfo {
  label: string
  placeholder: string
  validate: (value: string) => boolean
  maxLength: number
  noticePhysical: string
  noticeLegal: string
}

// Simple validation: alphanumeric, uppercase, allowing hyphens
function validateBusinessId(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').toUpperCase()
  if (cleaned.length < 3 || cleaned.length > 50) return false
  // Alphanumeric and hyphens only
  return /^[A-Z0-9-]+$/.test(cleaned)
}

export function getBusinessIdInfo(country: Country, lang: 'fr' | 'en' | 'es' = 'fr'): BusinessIdInfo {
  switch (country) {
    case 'France':
      return {
        label: lang === 'fr' ? 'Numéro SIRET' : lang === 'en' ? 'SIRET number' : 'Número SIRET',
        placeholder: '123 456 789 01234',
        validate: validateBusinessId,
        maxLength: 50,
        noticePhysical: lang === 'fr'
          ? 'Important : Votre numéro SIRET sera vérifié et doit correspondre à vos nom et prénom. En cas de non-conformité, votre compte pourra être suspendu.'
          : lang === 'en'
          ? 'Important: Your SIRET number will be verified and must match your first and last name. In case of non-compliance, your account may be suspended.'
          : 'Importante: Su número SIRET será verificado y debe coincidir con su nombre y apellido. En caso de incumplimiento, su cuenta puede ser suspendida.',
        noticeLegal: lang === 'fr'
          ? 'Important : Votre numéro SIRET sera vérifié et doit correspondre au nom de l\'entreprise. En cas de non-conformité, votre compte pourra être suspendu.'
          : lang === 'en'
          ? 'Important: Your SIRET number will be verified and must match the company name. In case of non-compliance, your account may be suspended.'
          : 'Importante: Su número SIRET será verificado y debe coincidir con el nombre de la empresa. En caso de incumplimiento, su cuenta puede ser suspendida.',
      }
    
    case 'Spain':
      return {
        label: lang === 'fr' ? 'NIF' : lang === 'en' ? 'NIF' : 'NIF',
        placeholder: '12345678A',
        validate: validateBusinessId,
        maxLength: 50,
        noticePhysical: lang === 'fr'
          ? 'Important : Votre NIF sera vérifié et doit correspondre à vos nom et prénom. En cas de non-conformité, votre compte pourra être suspendu.'
          : lang === 'en'
          ? 'Important: Your NIF will be verified and must match your first and last name. In case of non-compliance, your account may be suspended.'
          : 'Importante: Su NIF será verificado y debe coincidir con su nombre y apellido. En caso de incumplimiento, su cuenta puede ser suspendida.',
        noticeLegal: lang === 'fr'
          ? 'Important : Votre NIF sera vérifié et doit correspondre au nom de l\'entreprise. En cas de non-conformité, votre compte pourra être suspendu.'
          : lang === 'en'
          ? 'Important: Your NIF will be verified and must match the company name. In case of non-compliance, your account may be suspended.'
          : 'Importante: Su NIF será verificado y debe coincidir con el nombre de la empresa. En caso de incumplimiento, su cuenta puede ser suspendida.',
      }
    
    default:
      return {
        label: lang === 'fr' ? 'Identifiant professionnel' : lang === 'en' ? 'Business ID' : 'Identificador profesional',
        placeholder: lang === 'fr' ? 'Identifiant' : lang === 'en' ? 'Business ID' : 'Identificador',
        validate: validateBusinessId,
        maxLength: 50,
        noticePhysical: lang === 'fr'
          ? 'Important : Votre identifiant professionnel sera vérifié et doit correspondre à vos nom et prénom. En cas de non-conformité, votre compte pourra être suspendu.'
          : lang === 'en'
          ? 'Important: Your business ID will be verified and must match your first and last name. In case of non-compliance, your account may be suspended.'
          : 'Importante: Su identificador profesional será verificado y debe coincidir con su nombre y apellido. En caso de incumplimiento, su cuenta puede ser suspendida.',
        noticeLegal: lang === 'fr'
          ? 'Important : Votre identifiant professionnel sera vérifié et doit correspondre au nom de l\'entreprise. En cas de non-conformité, votre compte pourra être suspendu.'
          : lang === 'en'
          ? 'Important: Your business ID will be verified and must match the company name. In case of non-compliance, your account may be suspended.'
          : 'Importante: Su identificador profesional será verificado y debe coincidir con el nombre de la empresa. En caso de incumplimiento, su cuenta puede ser suspendida.',
      }
  }
}

export const SUPPORTED_COUNTRIES: { value: Country; label: { fr: string; en: string; es: string } }[] = [
  { value: 'France', label: { fr: 'France', en: 'France', es: 'Francia' } },
  { value: 'Spain', label: { fr: 'Espagne', en: 'Spain', es: 'España' } },
]

