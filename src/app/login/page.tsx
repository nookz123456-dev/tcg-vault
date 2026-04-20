'use client'

import { useState, useCallback } from 'react'
import Turnstile from '@/components/Turnstile'
import { useT, useLocale } from '@/lib/i18n'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

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

export default function LoginPage() {
 const t = useT()
 const { locale } = useLocale()
 
 const [mode, setMode] = useState<'login' | 'signup' | 'magic' | 'forgot'>('login')
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [confirmPassword, setConfirmPassword] = useState('')
 const [username, setUsername] = useState('')
 const [loading, setLoading] = useState(false)
 const [oauthLoading, setOauthLoading] = useState(false)
 const [error, setError] = useState('')
 const [success, setSuccess] = useState('')
 const [captchaToken, setCaptchaToken] = useState('')
 const [captchaError, setCaptchaError] = useState('')
 const [showPassword, setShowPassword] = useState(false)
 const [showConfirmPassword, setShowConfirmPassword] = useState(false)

 const handleCaptchaVerify = useCallback((token: string) => {
 setCaptchaToken(token)
 setCaptchaError('')
 }, [])

 const handleCaptchaError = useCallback((err: string) => {
 setCaptchaError(t('login.captchaFailed'))
 setCaptchaToken('')
 }, [])

 const handleCaptchaExpire = useCallback(() => {
 setCaptchaToken('')
 }, [])

 const handleGoogleLogin = () => {
 setOauthLoading(true)
 // Redirect to Supabase Google OAuth
 const redirectUrl = `${window.location.origin}/auth/callback`
 const googleAuthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`
 window.location.href = googleAuthUrl
 }

 async function autoConfirmUser(userId: string) {
 try {
 await fetch('/api/auth/confirm', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId }),
 })
 } catch { /* Silent fail */ }
 }

 const validateSignup = (): string | null => {
 if (!username.trim()) return t('login.usernameRequired')
 if (username.trim().length < 3) return t('login.usernameMin')
 if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return t('login.usernameChars')
 if (password.length < 8) return t('login.passwordMin8')
 if (getPasswordStrength(password).score < 3) return t('login.passwordWeak')
 if (password !== confirmPassword) return t('login.passwordMismatch')
 return null
 }

 const handleMagicLink = async () => {
 setLoading(true)
 setError('')
 setSuccess('')
 try {
 const res = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
 method: 'POST',
 headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email,
 redirect_to: `${window.location.origin}/auth/callback`,
 }),
 })
 const data = await res.json()
 if (!res.ok) {
 setError(data.msg || data.error_description || data.error || (t('login.magicLinkFailed')))
 return
 }
 setSuccess(t('login.magicLinkSent'))
 } catch {
 setError(t('login.networkError'))
 } finally {
 setLoading(false)
 }
 }

 const handleForgotPassword = async () => {
 setLoading(true)
 setError('')
 setSuccess('')
 try {
 const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
 method: 'POST',
 headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email,
 redirect_to: `${window.location.origin}/auth/reset-password`,
 }),
 })
 const data = await res.json()
 if (!res.ok) {
 setError(data.msg || data.error_description || data.error || (t('login.resetEmailFailed')))
 return
 }
 setSuccess(t('login.resetLinkSent'))
 } catch {
 setError(t('login.networkError'))
 } finally {
 setLoading(false)
 }
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError('')
 setSuccess('')

 if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
 setError(t('login.configError'))
 setLoading(false)
 return
 }

 // Signup validation
 if (mode === 'signup') {
 const validationError = validateSignup()
 if (validationError) {
 setError(validationError)
 setLoading(false)
 return
 }
 if (TURNSTILE_SITE_KEY && !captchaToken) {
 setError(t('login.completeCaptcha'))
 setLoading(false)
 return
 }
 if (TURNSTILE_SITE_KEY && captchaToken) {
 try {
 const captchaRes = await fetch('/api/captcha', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ token: captchaToken }),
 })
 const captchaData = await captchaRes.json()
 if (!captchaData.success) {
 setError(t('login.captchaVerificationFailed'))
 setCaptchaToken('')
 setLoading(false)
 return
 }
 } catch {
 setError(t('login.captchaUnavailable'))
 setLoading(false)
 return
 }
 }
 }

 try {
 if (mode === 'login') {
 const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
 method: 'POST',
 headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password }),
 })
 const data = await res.json()
 if (!res.ok || data.error) {
 setError(data.error_description || data.msg || data.error || (t('login.loginFailed')))
 return
 }
 localStorage.setItem('tcg-vault-session', JSON.stringify(data))
 setSuccess(t('login.loggedIn'))
 setTimeout(() => { window.location.href = '/collection' }, 500)

 } else if (mode === 'signup') {
 // Use our signup API with rate limiting
 const res = await fetch('/api/auth/signup', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password, username: username.trim() }),
 })
 const data = await res.json()
 if (!res.ok || data.error) {
 const msg = data.error || ''
 if (msg.includes('already registered')) {
 setError(t('login.alreadyRegistered'))
 } else if (msg.includes('Too many')) {
 setError(t('login.tooManyAttempts'))
 } else {
 setError(msg || (t('login.signupFailed')))
 }
 return
 }
 if (data.session?.access_token) {
 localStorage.setItem('tcg-vault-session', JSON.stringify(data.session))
 setSuccess(t('login.accountCreated'))
 setTimeout(() => { window.location.href = '/collection' }, 500)
 } else {
 setSuccess(t('login.accountCreatedLogin'))
 setMode('login')
 }
 }
 } catch (err) {
 console.error('Auth error:', err)
 setError(t('login.networkError'))
 } finally {
 setLoading(false)
 }
 }

 const pwStrength = mode === 'signup' && password ? getPasswordStrength(password) : null
 const title = mode === 'login' ? (t('login.signIn'))
 : mode === 'signup' ? (t('login.createAccount'))
 : mode === 'magic' ? (t('login.magicLink'))
 : (t('login.resetPassword'))

 return (
 <div className="min-h-screen flex items-center justify-center px-4 bg-[#fafbfc]">
 <div className="w-full max-w-md">
 {/* Logo */}
 <div className="text-center mb-8">
 <div className="text-5xl mb-3">🃏</div>
 <h1 className="text-3xl font-extrabold text-[#6366f1] tracking-tight">HoloCheck</h1>
 <p className="text-[#5c6078] mt-2">
 {t('login.yourCardCollection')}
 </p>
 </div>

 {/* Form Card */}
 <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 shadow-sm">
 <h2 className="text-xl font-bold text-[#1e2235] mb-1">{title}</h2>
 {mode === 'login' && (
 <p className="text-sm text-[#8b8fa6] mb-6">
 {t('login.noAccountPrefix')}
 <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }} className="text-[#6366f1] font-semibold hover:underline">
 {t('login.signUpNew')}
 </button>
 </p>
 )}
 {mode === 'signup' && (
 <p className="text-sm text-[#8b8fa6] mb-6">
 {t('login.hasAccountPrefix')}
 <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-[#6366f1] font-semibold hover:underline">
 {t('login.signIn')}
 </button>
 </p>
 )}

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

 {/* Magic Link */}
 {mode === 'magic' && (
 <form onSubmit={(e) => { e.preventDefault(); handleMagicLink() }} className="space-y-4">
 <div>
 <label className="block text-sm text-[#5c6078] mb-1 font-medium">
 {t('login.email')}
 </label>
 <input
 type="email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 required
 className="w-full px-4 py-3 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
 placeholder="your@email.com"
 />
 </div>
 <p className="text-xs text-[#8b8fa6]">
 {t('login.magicLinkDesc')}
 </p>
 <button
 type="submit"
 disabled={loading || !email}
 className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
 {loading ? t('login.sending') : t('login.sendMagicLink')}
 </button>
 <button
 type="button"
 onClick={() => { setMode('login'); setError(''); setSuccess('') }}
 className="w-full py-2 text-[#5c6078] hover:text-[#1e2235] transition-colors text-sm"
 >
 {t('login.backToSignIn')}
 </button>
 </form>
 )}

 {/* Forgot Password */}
 {mode === 'forgot' && (
 <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword() }} className="space-y-4">
 <div>
 <label className="block text-sm text-[#5c6078] mb-1 font-medium">
 {t('login.registeredEmail')}
 </label>
 <input
 type="email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 required
 className="w-full px-4 py-3 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
 placeholder="your@email.com"
 />
 </div>
 <button
 type="submit"
 disabled={loading || !email}
 className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
 {loading ? t('login.sending') : t('login.sendResetLink')}
 </button>
 <button
 type="button"
 onClick={() => { setMode('login'); setError(''); setSuccess('') }}
 className="w-full py-2 text-[#5c6078] hover:text-[#1e2235] transition-colors text-sm"
 >
 {t('login.backToSignIn')}
 </button>
 </form>
 )}

 {/* Login / Signup */}
 {(mode === 'login' || mode === 'signup') && (
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Username (signup only) */}
 {mode === 'signup' && (
 <div>
 <label className="block text-sm text-[#5c6078] mb-1 font-medium">
 {t('login.username')}
 </label>
 <input
 type="text"
 value={username}
 onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
 required
 minLength={3}
 maxLength={20}
 className="w-full px-4 py-3 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
 placeholder={t('login.usernamePlaceholder')}
 />
 </div>
 )}

 {/* Email */}
 <div>
 <label className="block text-sm text-[#5c6078] mb-1 font-medium">
 {t('login.email')}
 </label>
 <input
 type="email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 required
 className="w-full px-4 py-3 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
 placeholder="your@email.com"
 />
 </div>

 {/* Password */}
 <div>
 <label className="block text-sm text-[#5c6078] mb-1 font-medium">
 {t('login.password')}
 </label>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={e => setPassword(e.target.value)}
 required
 minLength={mode === 'signup' ? 8 : 6}
 className="w-full px-4 py-3 pr-10 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
 placeholder={mode === 'signup' ? t('login.min8Chars') : '••••••••'}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors"
 >
 {showPassword ? '🙈' : '👁️'}
 </button>
 </div>

 {/* Password Strength (signup only) */}
 {mode === 'signup' && password && (
 <div className="mt-2">
 <div className="flex gap-1">
 {[1, 2, 3, 4, 5].map(i => (
 <div
 key={i}
 className="h-1.5 flex-1 rounded-full transition-all"
 style={{ background: pwStrength && i <= pwStrength.score ? pwStrength.color : '#e8eaf0' }}
 />
 ))}
 </div>
 <p className="text-xs mt-1" style={{ color: pwStrength?.color || '#8b8fa6' }}>
 {!pwStrength || pwStrength.score <= 1 ? t('login.veryWeak') :
 pwStrength.score === 2 ? t('login.weak') :
 pwStrength.score === 3 ? t('login.fair') :
 pwStrength.score === 4 ? t('login.strongLabel') : t('login.veryStrong')}
 </p>
 <ul className="text-[10px] text-[#8b8fa6] mt-1 space-y-0.5">
 <li className={password.length >= 8 ? 'text-emerald-500' : ''}>
 {password.length >= 8 ? '✓' : '○'} {t('login.min8Chars')}
 </li>
 <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-emerald-500' : ''}>
 {(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? '✓' : '○'} {t('login.upperLower')}
 </li>
 <li className={/\d/.test(password) ? 'text-emerald-500' : ''}>
 {/\d/.test(password) ? '✓' : '○'} {t('login.number')}
 </li>
 <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-emerald-500' : ''}>
 {/[^a-zA-Z0-9]/.test(password) ? '✓' : '○'} {t('login.specialChar')}
 </li>
 </ul>
 </div>
 )}
 </div>

 {/* Confirm Password (signup only) */}
 {mode === 'signup' && (
 <div>
 <label className="block text-sm text-[#5c6078] mb-1 font-medium">
 {t('login.confirmPassword')}
 </label>
 <div className="relative">
 <input
 type={showConfirmPassword ? 'text' : 'password'}
 value={confirmPassword}
 onChange={e => setConfirmPassword(e.target.value)}
 required
 className="w-full px-4 py-3 pr-10 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
 placeholder={t('login.confirmPasswordPlaceholder')}
 />
 <button
 type="button"
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors"
 >
 {showConfirmPassword ? '🙈' : '👁️'}
 </button>
 </div>
 {confirmPassword && password !== confirmPassword && (
 <p className="text-xs text-red-400 mt-1">
 {t('login.passwordMismatch')}
 </p>
 )}
 {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
 <p className="text-xs text-emerald-500 mt-1">✓ {t('login.passwordsMatch')}</p>
 )}
 </div>
 )}

 {/* Forgot password link (login only) */}
 {mode === 'login' && (
 <div className="text-right">
 <button
 type="button"
 onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
 className="text-xs text-[#6366f1] hover:underline"
 >
 {t('login.forgotPassword')}
 </button>
 </div>
 )}

 {/* Captcha (signup only) */}
 {mode === 'signup' && TURNSTILE_SITE_KEY && (
 <div className="flex justify-center">
 <Turnstile
 siteKey={TURNSTILE_SITE_KEY}
 onVerify={handleCaptchaVerify}
 onError={handleCaptchaError}
 onExpire={handleCaptchaExpire}
 />
 </div>
 )}

 {captchaError && mode === 'signup' && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm text-center">
 {captchaError}
 </div>
 )}

 <button
 type="submit"
 disabled={loading || (mode === 'signup' && !!TURNSTILE_SITE_KEY && !captchaToken)}
 className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
 {loading ? t('login.pleaseWait') :
 mode === 'login' ? t('login.signIn') :
 t('login.createAccount')}
 </button>
 </form>
 )}

 {/* Google OAuth */}
 {(mode === 'login' || mode === 'signup') && (
 <button
 onClick={handleGoogleLogin}
 disabled={oauthLoading}
 className="w-full py-2.5 border border-[#e8eaf0] rounded-xl text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
 >
 <svg className="w-4 h-4" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 {oauthLoading ? '...' : t('login.google')}
 </button>
 )}

 {/* Divider */}
 {mode !== 'magic' && mode !== 'forgot' && (
 <div className="relative my-4">
 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8eaf0]" /></div>
 <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-[#8b8fa6]">{t('login.or')}</span></div>
 </div>
 )}

 {/* Magic Link option */}
 {mode === 'login' && (
 <button
 onClick={() => { setMode('magic'); setError(''); setSuccess('') }}
 className="w-full py-2.5 border border-[#e8eaf0] rounded-xl text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
 >
 <span>✉️</span> {t('login.signInWithMagicLink')}
 </button>
 )}

 {/* Guest mode */}
 {mode === 'login' && (
 <div className="mt-3">
 <button
 onClick={() => { localStorage.setItem('tcg-vault-guest', 'true'); window.location.href = '/collection' }}
 className="w-full py-2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors text-sm"
 >
 {t('login.continueAsGuest')}
 </button>
 </div>
 )}
 </div>

 <p className="text-center text-xs text-[#8b8fa6] mt-4">
 {t('login.dataSecure')}
 </p>
 </div>
 </div>
 )
}