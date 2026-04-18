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
  const isThai = locale === 'th'
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
    setCaptchaError(isThai ? 'การยืนยันล้มเหลว กรุณาลองใหม่' : 'Captcha verification failed. Please try again.')
    setCaptchaToken('')
  }, [isThai])

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
    if (!username.trim()) return isThai ? 'กรุณากรอกชื่อผู้ใช้' : 'Username is required'
    if (username.trim().length < 3) return isThai ? 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' : 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return isThai ? 'ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _' : 'Username can only contain letters, numbers, and _'
    if (password.length < 8) return isThai ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters'
    if (getPasswordStrength(password).score < 3) return isThai ? 'รหัสผ่านไม่แข็งแกร่งพอ ต้องมีตัวพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์' : 'Password is not strong enough. Add uppercase, numbers, or symbols'
    if (password !== confirmPassword) return isThai ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'
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
        setError(data.msg || data.error_description || data.error || (isThai ? 'ส่งลิงก์ไม่สำเร็จ' : 'Failed to send magic link'))
        return
      }
      setSuccess(isThai ? 'ส่งลิงก์เข้าอีเมลแล้ว! ตรวจสอบกล่องจดหมายของคุณ' : 'Magic link sent! Check your email.')
    } catch {
      setError(isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error')
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
        setError(data.msg || data.error_description || data.error || (isThai ? 'ส่งอีเมลรีเซ็ตไม่สำเร็จ' : 'Failed to send reset email'))
        return
      }
      setSuccess(isThai ? 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว' : 'Password reset link sent to your email.')
    } catch {
      setError(isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error')
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
      setError(isThai ? 'ข้อผิดพลาดการตั้งค่า กรุณาลองใหม่ภายหลัง' : 'Configuration error. Please try again later.')
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
        setError(isThai ? 'กรุณายืนยัน Captcha' : 'Please complete the captcha verification.')
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
            setError(isThai ? 'การยืนยันล้มเหลว กรุณาลองใหม่' : 'Captcha verification failed.')
            setCaptchaToken('')
            setLoading(false)
            return
          }
        } catch {
          setError(isThai ? 'ไม่สามารถยืนยันได้ กรุณาลองใหม่ภายหลัง' : 'Captcha verification unavailable.')
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
          setError(data.error_description || data.msg || data.error || (isThai ? 'เข้าสู่ระบบไม่สำเร็จ' : 'Login failed.'))
          return
        }
        localStorage.setItem('tcg-vault-session', JSON.stringify(data))
        setSuccess(isThai ? 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...' : 'Logged in! Redirecting...')
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
            setError(isThai ? 'อีเมลนี้ถูกใช้งานแล้ว' : 'This email is already registered.')
          } else if (msg.includes('Too many')) {
            setError(isThai ? 'สมัครมากเกินไป กรุณาลองใหม่ภายหลัง' : 'Too many signup attempts. Please try again later.')
          } else {
            setError(msg || (isThai ? 'สมัครไม่สำเร็จ' : 'Signup failed.'))
          }
          return
        }
        if (data.session?.access_token) {
          localStorage.setItem('tcg-vault-session', JSON.stringify(data.session))
          setSuccess(isThai ? 'สร้างบัญชีสำเร็จ! กำลังเปลี่ยนหน้า...' : 'Account created! Redirecting...')
          setTimeout(() => { window.location.href = '/collection' }, 500)
        } else {
          setSuccess(isThai ? 'สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ' : 'Account created! You can now log in.')
          setMode('login')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(isThai ? 'ข้อผิดพลาดเครือข่าย กรุณาลองใหม่' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = mode === 'signup' && password ? getPasswordStrength(password) : null
  const title = mode === 'login' ? (isThai ? 'เข้าสู่ระบบ' : 'Sign In')
    : mode === 'signup' ? (isThai ? 'สร้างบัญชี' : 'Create Account')
    : mode === 'magic' ? (isThai ? 'เข้าสู่ระบบด้วยลิงก์' : 'Sign in with Magic Link')
    : (isThai ? 'รีเซ็ตรหัสผ่าน' : 'Reset Password')

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f6fa]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🃏</div>
          <h1 className="text-3xl font-extrabold text-[#6366f1] tracking-tight">TCG Vault</h1>
          <p className="text-[#5c6078] mt-2">
            {isThai ? 'จัดการคอลเลกชันการ์ดของคุณ' : 'Your card collection, tracked.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1e2235] mb-1">{title}</h2>
          {mode === 'login' && (
            <p className="text-sm text-[#8b8fa6] mb-6">
              {isThai ? 'ยังไม่มีบัญชี? ' : "Don't have an account? "}
              <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }} className="text-[#6366f1] font-semibold hover:underline">
                {isThai ? 'สมัครใหม่' : 'Sign up'}
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p className="text-sm text-[#8b8fa6] mb-6">
              {isThai ? 'มีบัญชีอยู่แล้ว? ' : 'Already have an account? '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-[#6366f1] font-semibold hover:underline">
                {isThai ? 'เข้าสู่ระบบ' : 'Sign in'}
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
                  {isThai ? 'อีเมล' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-xs text-[#8b8fa6]">
                {isThai ? 'เราจะส่งลิงก์เข้าอีเมลของคุณ — คลิกครั้งเดียวเข้าได้เลย ไม่ต้องจำรหัสผ่าน!' : "We'll send a login link to your email — click once and you're in. No password needed!"}
              </p>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6366f1]/25"
              >
                {loading ? (isThai ? 'กำลังส่ง...' : 'Sending...') : (isThai ? 'ส่งลิงก์เข้าระบบ' : 'Send Magic Link')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full py-2 text-[#5c6078] hover:text-[#1e2235] transition-colors text-sm"
              >
                {isThai ? '← กลับไปเข้าสู่ระบบ' : '← Back to sign in'}
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {mode === 'forgot' && (
            <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword() }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#5c6078] mb-1 font-medium">
                  {isThai ? 'อีเมลที่สมัครไว้' : 'Registered email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6366f1]/25"
              >
                {loading ? (isThai ? 'กำลังส่ง...' : 'Sending...') : (isThai ? 'ส่งลิงก์รีเซ็ตรหัสผ่าน' : 'Send Reset Link')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full py-2 text-[#5c6078] hover:text-[#1e2235] transition-colors text-sm"
              >
                {isThai ? '← กลับไปเข้าสู่ระบบ' : '← Back to sign in'}
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
                    {isThai ? 'ชื่อผู้ใช้' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    required
                    minLength={3}
                    maxLength={20}
                    className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    placeholder={isThai ? 'ชื่อที่ต้องการใช้ (ตัวอักษร ตัวเลข _)' : 'Choose a username (letters, numbers, _)'}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm text-[#5c6078] mb-1 font-medium">
                  {isThai ? 'อีเมล' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-[#5c6078] mb-1 font-medium">
                  {isThai ? 'รหัสผ่าน' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={mode === 'signup' ? 8 : 6}
                    className="w-full px-4 py-3 pr-10 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    placeholder={mode === 'signup' ? (isThai ? 'อย่างน้อย 8 ตัวอักษร' : 'Min 8 characters') : '••••••••'}
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
                      {isThai ? (
                        !pwStrength || pwStrength.score <= 1 ? 'อ่อนมาก' :
                        pwStrength.score === 2 ? 'อ่อน' :
                        pwStrength.score === 3 ? 'พอใช้' :
                        pwStrength.score === 4 ? 'แข็งแกร่ง' : 'แข็งแกร่งมาก'
                      ) : (pwStrength?.label || 'Weak')}
                    </p>
                    <ul className="text-[10px] text-[#8b8fa6] mt-1 space-y-0.5">
                      <li className={password.length >= 8 ? 'text-emerald-500' : ''}>
                        {password.length >= 8 ? '✓' : '○'} {isThai ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'}
                      </li>
                      <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-emerald-500' : ''}>
                        {(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? '✓' : '○'} {isThai ? 'ตัวพิมพ์ใหญ่และเล็ก' : 'Uppercase & lowercase'}
                      </li>
                      <li className={/\d/.test(password) ? 'text-emerald-500' : ''}>
                        {/\d/.test(password) ? '✓' : '○'} {isThai ? 'ตัวเลข' : 'Number'}
                      </li>
                      <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-emerald-500' : ''}>
                        {/[^a-zA-Z0-9]/.test(password) ? '✓' : '○'} {isThai ? 'สัญลักษณ์พิเศษ (!@#$...)' : 'Special character (!@#$...)'}
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm text-[#5c6078] mb-1 font-medium">
                    {isThai ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-10 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                      placeholder={isThai ? 'กรอกรหัสผ่านอีกครั้ง' : 'Enter password again'}
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
                      {isThai ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'}
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                    <p className="text-xs text-emerald-500 mt-1">✓ {isThai ? 'รหัสผ่านตรงกัน' : 'Passwords match'}</p>
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
                    {isThai ? 'ลืมรหัสผ่าน?' : 'Forgot password?'}
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
                className="w-full py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6366f1]/25"
              >
                {loading ? (isThai ? 'กรุณารอสักครู่...' : 'Please wait...') :
                  mode === 'login' ? (isThai ? 'เข้าสู่ระบบ' : 'Sign In') :
                  (isThai ? 'สร้างบัญชี' : 'Create Account')}
              </button>
            </form>
          )}

          {/* Google OAuth — disabled until credentials are ready */}
          {/* {(mode === 'login' || mode === 'signup') && (...)} */}

          {/* Divider */}
          {mode !== 'magic' && mode !== 'forgot' && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8eaf0]" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-[#8b8fa6]">{isThai ? 'หรือ' : 'or'}</span></div>
            </div>
          )}

          {/* Magic Link option */}
          {mode === 'login' && (
            <button
              onClick={() => { setMode('magic'); setError(''); setSuccess('') }}
              className="w-full py-2.5 border border-[#e8eaf0] rounded-xl text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>✉️</span> {isThai ? 'เข้าสู่ระบบด้วยลิงก์อีเมล' : 'Sign in with Magic Link'}
            </button>
          )}

          {/* Guest mode */}
          {mode === 'login' && (
            <div className="mt-3">
              <button
                onClick={() => { localStorage.setItem('tcg-vault-guest', 'true'); window.location.href = '/collection' }}
                className="w-full py-2 text-[#8b8fa6] hover:text-[#1e2235] transition-colors text-sm"
              >
                {isThai ? 'เข้าชมแบบไม่ล็อกอิน (เก็บข้อมูลในเครื่อง)' : 'Continue as Guest (saved locally only)'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#8b8fa6] mt-4">
          {isThai ? 'ข้อมูลเก็บอย่างปลอดภัยบน Supabase · โหมดไม่ล็อกอินเก็บในเครื่อง' : 'Data stored securely on Supabase · Guest mode uses local storage'}
        </p>
      </div>
    </div>
  )
}