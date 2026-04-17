'use client'

import { useState, useEffect } from 'react'
import { LocaleContext, type Locale } from '@/lib/i18n'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th')

  useEffect(() => {
    const stored = localStorage.getItem('tcg-vault-locale')
    if (stored === 'en' || stored === 'th') {
      setLocaleState(stored)
    }
  }, [])

  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  )
}