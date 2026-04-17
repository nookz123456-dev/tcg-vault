'use client'

import { useState, useCallback } from 'react'
import Turnstile from '@/components/Turnstile'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaError, setCaptchaError] = useState('')

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token)
    setCaptchaError('')
  }, [])

  const handleCaptchaError = useCallback((err: string) => {
    setCaptchaError('Captcha verification failed. Please try again.')
    setCaptchaToken('')
  }, [])

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken('')
  }, [])

  async function autoConfirmUser(userId: string) {
    try {
      await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
    } catch { /* Silent fail */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError('Configuration error. Please try again later.')
      setLoading(false)
      return
    }

    if (!isLogin && TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Please complete the captcha verification.')
      setLoading(false)
      return
    }

    if (!isLogin && TURNSTILE_SITE_KEY && captchaToken) {
      try {
        const captchaRes = await fetch('/api/captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: captchaToken }),
        })
        const captchaData = await captchaRes.json()
        if (!captchaData.success) {
          setError('Captcha verification failed. Please try again.')
          setCaptchaToken('')
          setLoading(false)
          return
        }
      } catch {
        setError('Captcha verification unavailable. Please try again later.')
        setLoading(false)
        return
      }
    }

    try {
      if (isLogin) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          setError(data.error_description || data.msg || data.error || 'Login failed.')
          return
        }
        localStorage.setItem('tcg-vault-session', JSON.stringify(data))
        setSuccess('Logged in! Redirecting...')
        setTimeout(() => { window.location.href = '/collection' }, 500)
      } else {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          setError(data.msg || data.error_description || data.error || 'Signup failed.')
          return
        }
        if (data.id) await autoConfirmUser(data.id)
        const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const loginData = await loginRes.json()
        if (loginData.access_token) {
          localStorage.setItem('tcg-vault-session', JSON.stringify(loginData))
          setSuccess('Account created! Redirecting...')
          setTimeout(() => { window.location.href = '/collection' }, 500)
        } else {
          setSuccess('Account created! You can now log in.')
          setIsLogin(true)
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f6fa]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🃏</div>
          <h1 className="text-3xl font-extrabold text-[#6366f1] tracking-tight">
            TCG Vault
          </h1>
          <p className="text-[#5c6078] mt-2">Your card collection, tracked.</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1e2235] mb-6">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                placeholder="Min 6 characters"
              />
            </div>

            {/* Captcha for signup only */}
            {!isLogin && TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                />
              </div>
            )}

            {captchaError && !isLogin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm text-center">
                {captchaError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !!TURNSTILE_SITE_KEY && !captchaToken)}
              className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6366f1]/25"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
              className="text-sm text-[#5c6078] hover:text-[#6366f1] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#e8eaf0]">
            <button
              onClick={() => { localStorage.setItem('tcg-vault-guest', 'true'); window.location.href = '/collection' }}
              className="w-full py-2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors text-sm"
            >
              Continue as Guest (saved locally only)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#8b8fa6] mt-4">
          Data stored securely on Supabase · Guest mode uses local storage
        </p>
      </div>
    </div>
  )
}