'use client'

import { useState, useEffect } from 'react'
import { LocaleContext, type Locale } from '@/lib/i18n'

export function ClientLayout({ children, initialLocale = 'th' }: { children: React.ReactNode; initialLocale?: Locale }) {
  // Seed from the server-read cookie so client + server components agree (no flash).
  const [locale] = useState<Locale>(initialLocale)

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
      // When a new SW takes control (updated content), refresh once so the
      // user never gets stuck on a stale cached page.
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
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