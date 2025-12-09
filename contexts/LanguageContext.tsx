// /contexts/LanguageContext.tsx

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Language } from '@/lib/i18n/translations'
import { getTranslation } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
  detectBrowserLanguage: () => Language
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const SUPPORTED_LANGUAGES: Language[] = ['fr', 'en', 'es']
const DEFAULT_LANGUAGE: Language = 'fr'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Detect browser language
  const detectBrowserLanguage = useCallback((): Language => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE
    
    // Get browser language
    const browserLang = navigator.language || (navigator as any).userLanguage || ''
    const langCode = browserLang.split('-')[0].toLowerCase()
    
    // Check if supported
    if (SUPPORTED_LANGUAGES.includes(langCode as Language)) {
      return langCode as Language
    }
    
    // Check for similar languages (e.g., en-US, en-GB -> en)
    for (const supportedLang of SUPPORTED_LANGUAGES) {
      if (browserLang.toLowerCase().startsWith(supportedLang)) {
        return supportedLang
      }
    }
    
    return DEFAULT_LANGUAGE
  }, [])

  // Initialize language on mount
  useEffect(() => {
    if (isInitialized) return
    
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      // Try to get saved language from localStorage
      const savedLang = typeof window !== 'undefined' 
        ? localStorage.getItem('domia_language') as Language | null
        : null
      
      if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
        setLanguageState(savedLang)
      } else {
        // Detect from browser
        const detectedLang = detectBrowserLanguage()
        setLanguageState(detectedLang)
        // Save detected language
        if (typeof window !== 'undefined') {
          localStorage.setItem('domia_language', detectedLang)
        }
      }
      
      setIsInitialized(true)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [isInitialized, detectBrowserLanguage])

  // Set language and save to localStorage
  const setLanguage = useCallback((lang: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return
    
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('domia_language', lang)
      // Update HTML lang attribute
      document.documentElement.lang = lang
    }
  }, [])

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string>) => {
    return getTranslation(key, language, params)
  }, [language])

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      document.documentElement.lang = language
    }
  }, [language, isInitialized])

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    detectBrowserLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

