'use client'

import { useState } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // Login
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (data.error) {
          setError(data.error_description || data.error_description || data.msg || 'Login failed')
        } else {
          // Save session
          localStorage.setItem('tcg-vault-session', JSON.stringify(data))
          setSuccess('Logged in!')
          window.location.href = '/collection'
        }
      } else {
        // Signup
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (data.error) {
          setError(data.msg || data.error_description || 'Signup failed')
        } else {
          // Auto-confirm: try to login immediately
          if (data.id && !data.confirmed_at) {
            setSuccess('Account created! Checking if we can log you in...')
            // Try login right away
            const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            })
            const loginData = await loginRes.json()
            if (loginData.access_token) {
              localStorage.setItem('tcg-vault-session', JSON.stringify(loginData))
              window.location.href = '/collection'
            } else {
              setSuccess('Account created! Please check your email to confirm, then log in.')
            }
          } else {
            // Already confirmed, save and redirect
            localStorage.setItem('tcg-vault-session', JSON.stringify(data))
            window.location.href = '/collection'
          }
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🃏</div>
          <h1 className="text-3xl font-bold text-amber-400">
            TCG Vault
          </h1>
          <p className="text-gray-400 mt-2">Your card collection, tracked.</p>
        </div>

        {/* Form */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-xl text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-xl text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
              className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
            <button
              onClick={() => {
                localStorage.setItem('tcg-vault-guest', 'true')
                window.location.href = '/collection'
              }}
              className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Continue as Guest (saved locally only)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Data stored securely on Supabase • Guest mode uses local storage
        </p>
      </div>
    </div>
  )
}