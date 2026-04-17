'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: (error: string) => void
  'expired-callback'?: () => void
  theme?: string
  size?: string
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
}

export default function Turnstile({ siteKey, onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const scriptLoadedRef = useRef(false)

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return

    // Clear container first
    containerRef.current.innerHTML = ''

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      'error-callback': onError || (() => {}),
      'expired-callback': onExpire || (() => {}),
      theme: 'dark',
      size: 'normal',
    })
  }, [siteKey, onVerify, onError, onExpire])

  useEffect(() => {
    if (scriptLoadedRef.current) {
      renderWidget()
      return
    }

    // Load Turnstile script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    script.defer = true

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).onTurnstileLoad = () => {
      scriptLoadedRef.current = true
      renderWidget()
    }

    // If script already loaded (fast path)
    if (window.turnstile) {
      scriptLoadedRef.current = true
      renderWidget()
      return
    }

    document.head.appendChild(script)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [renderWidget])

  return <div ref={containerRef} className="flex justify-center" />
}