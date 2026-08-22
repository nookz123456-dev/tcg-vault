'use client'

// React locale context + hooks. Split out of i18n.ts so the translation data
// (and t()) stay server-safe. Re-exported from i18n.ts for convenience.
import { createContext, useContext } from 'react'
import { t, type Locale, type TranslationKey } from './i18n'

export const LocaleContext = createContext<Locale>('th')

export function useLocale() {
  const locale = useContext(LocaleContext)
  const setLocale = (newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      // Cookie so Server Components can read the locale too; reload to re-render.
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      localStorage.setItem('tcg-vault-locale', newLocale)
      window.location.reload()
    }
  }
  return { locale, setLocale }
}

export function useT() {
  const locale = useContext(LocaleContext)
  return (key: TranslationKey) => t(key, locale)
}
