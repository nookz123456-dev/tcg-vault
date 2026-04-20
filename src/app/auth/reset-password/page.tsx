'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useT } from '@/lib/i18n'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Very Weak', color: '#ef4444' }
  if (score === 2) return { score, label: 'Weak', color: '#f97316' }
  if (score === 3) return { score, label: 'Fair', color: '#eab308' }
  if (score === 4) return { score, label: 'Strong', color: '#22c55e' }
  return { score, label: 'Very Strong', color: '#16a34a' }
}

function ResetPasswordContent() {
  const t = useT()
  const searchParams = useSearchParams()

  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)

  useEffect(() => {
    // Supabase sends tokens via URL fragment (#access_token=...&type=recovery)
    // or via query params (?access_token=...&type=recovery)
    const checkTokens = () => {
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const token = params.get('access_token')
        const refresh = params.get('refresh_token')
        const type = params.get('type')
        if (token && (type === 'recovery' || type === 'signup')) {
          setAccessToken(token)
          setRefreshToken(refresh || '')
          setValidToken(true)
          // Clean up the URL hash so it doesn't leak
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      }

      // Also check query params (some Supabase versions)
      const token = searchParams.get('access_token')
      const refresh = searchParams.get('refresh_token')
      const type = searchParams.get('type')
      if (token && (type === 'recovery' || type === 'signup')) {
        setAccessToken(token)
        setRefreshToken(refresh || '')
        setValidToken(true)
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname)
        return
      }

      // No valid token found
      setError(t('reset.invalidLink'))
    }

    checkTokens()
  }, [searchParams])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError(t('reset.passwordMin'))
      return
    }
    if (getPasswordStrength(newPassword).score < 3) {
      setError(t('reset.passwordWeak'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('reset.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.msg || data.error_description || data.error || (t('reset.failed')))
        return
      }

      // Auto-login with new credentials
      if (data.email) {
        // Try to get a fresh session
        const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: newPassword }),
        })
        const loginData = await loginRes.json()
        if (loginRes.ok && loginData.access_token) {
          localStorage.setItem('tcg-vault-session', JSON.stringify(loginData))
        }
      }

      setSuccess(true)
    } catch {
      setError(t('reset.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = newPassword ? getPasswordStrength(newPassword) : null

  // No valid token - show error
  if (!validToken && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f6fa]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-[#5c6078]">{t('reset.verifying')}</p>
        </div>
      </div>
    )
  }

  if (!validToken && error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f6fa]">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-[#1e2235] mb-2">
              {t('reset.invalidLinkTitle')}
            </h2>
            <p className="text-sm text-[#8b8fa6] mb-4">{error}</p>
            <a href="/login" className="inline-block px-6 py-2.5 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all">
              {t('reset.backToSignIn')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Success - redirect
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f6fa]">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-[#1e2235] mb-2">
              {t('reset.successTitle')}
            </h2>
            <p className="text-sm text-[#8b8fa6] mb-4">
              {t('reset.redirecting')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f6fa]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-3xl font-extrabold text-[#6366f1] tracking-tight">HoloCheck</h1>
          <p className="text-[#5c6078] mt-2">
            {t('reset.setNewPassword')}
          </p>
        </div>

        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">
                {t('reset.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-10 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={t('reset.atLeast8')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password Strength */}
              {newPassword && pwStrength && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all"
                        style={{ background: i <= pwStrength.score ? pwStrength.color : '#e8eaf0' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: pwStrength.color }}>
                    {pwStrength.score <= 1 ? t('reset.veryWeak') :
                      pwStrength.score === 2 ? t('reset.weak') :
                      pwStrength.score === 3 ? t('reset.fair') :
                      pwStrength.score === 4 ? t('reset.strong') : t('reset.veryStrong')}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">
                {t('reset.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={t('reset.enterPasswordAgain')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {t('reset.passwordMismatch')}
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                <p className="text-xs text-emerald-500 mt-1">✓ {t('reset.passwordsMatch')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6366f1]/25"
            >
              {loading ? t('reset.pleaseWait') : t('reset.resetPassword')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#8b8fa6] mt-4">
          {t('reset.passwordRequirement')}
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]"><div className="text-4xl animate-pulse">🔐</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}