// /components/LanguageSelector.tsx

'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { Language } from '@/lib/i18n/translations'

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: t('language.french') },
    { code: 'en', label: t('language.english') },
    { code: 'es', label: t('language.spanish') },
  ]

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="px-3 py-2 border-2 border-[var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white text-[var(--text-primary)] text-sm font-semibold cursor-pointer appearance-none pr-8"
        aria-label={t('language.change')}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <i className="fas fa-chevron-down text-[var(--primary)] text-xs"></i>
      </div>
    </div>
  )
}

