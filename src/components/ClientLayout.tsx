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

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // PWA install prompt
    let deferredPrompt: any = null
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      const hint = document.getElementById('pwa-install-hint')
      const btn = document.getElementById('pwa-install-btn')
      if (hint && btn) {
        hint.style.display = 'block'
        btn.addEventListener('click', async () => {
          deferredPrompt.prompt()
          const result = await deferredPrompt.userChoice
          if (result.outcome === 'accepted') {
            hint.style.display = 'none'
          }
          deferredPrompt = null
        })
      }
    })
  }, [])

  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  )
}