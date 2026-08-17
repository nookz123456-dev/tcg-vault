'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import {
  marvelCards, marvelSets, RARITY_ORDER, RARITY_META, ATTR_META, ATTRIBUTES,
  cleanMarvelName, formatTHB,
} from '@/lib/marvel'

const KEY_LS = 'vaultverse_admin_key'

export default function AdminMarvelPrices() {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({}) // id -> raw input
  const [adminKey, setAdminKey] = useState('')
  const [q, setQ] = useState('')
  const [series, setSeries] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [onlyUnpriced, setOnlyUnpriced] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // login gate
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loginInput, setLoginInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // bulk-by-rarity helper
  const [bulkRarity, setBulkRarity] = useState('R')
  const [bulkValue, setBulkValue] = useState('')

  const verify = (key: string) =>
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }).then((r) => r.ok)

  useEffect(() => {
    const stored = localStorage.getItem(KEY_LS) || ''
    setAdminKey(stored)
    // verify the stored key (or empty → server allows localhost in dev)
    verify(stored).then(setAuthed).catch(() => setAuthed(false))
    // prices are public; load regardless
    fetch('/api/admin/marvel-prices')
      .then((r) => r.json())
      .then((d) => setPrices(d.prices || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function doLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    try {
      const ok = await verify(loginInput)
      if (ok) {
        localStorage.setItem(KEY_LS, loginInput)
        setAdminKey(loginInput)
        setAuthed(true)
      } else {
        setLoginError('รหัสผ่านไม่ถูกต้อง')
      }
    } catch {
      setLoginError('เชื่อมต่อไม่ได้ ลองใหม่')
    } finally {
      setLoggingIn(false)
    }
  }

  function logout() {
    localStorage.removeItem(KEY_LS)
    setAdminKey('')
    setLoginInput('')
    setAuthed(false)
  }

  const dirty = useMemo(() => {
    const out: Record<string, number | null> = {}
    for (const [id, raw] of Object.entries(drafts)) {
      const cur = prices[id]
      if (raw === '') {
        if (cur != null) out[id] = null
      } else {
        const n = Number(raw)
        if (Number.isFinite(n) && n !== cur) out[id] = n
      }
    }
    return out
  }, [drafts, prices])
  const dirtyCount = Object.keys(dirty).length

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return marvelCards.filter((c) => {
      if (series !== 'all' && c.series !== series) return false
      if (rarity !== 'all' && c.rarity !== rarity) return false
      if (onlyUnpriced && prices[c.id] != null && drafts[c.id] === undefined) return false
      if (ql && !c.name.toLowerCase().includes(ql) && !c.cardNo.toLowerCase().includes(ql)) return false
      return true
    })
  }, [q, series, rarity, onlyUnpriced, prices, drafts])

  const pricedCount = Object.keys(prices).length

  function setDraft(id: string, val: string) {
    setDrafts((d) => ({ ...d, [id]: val }))
  }

  function applyBulk() {
    if (bulkValue === '') return
    const next: Record<string, string> = { ...drafts }
    for (const c of filtered) {
      if (c.rarity === bulkRarity) next[c.id] = bulkValue
    }
    setDrafts(next)
  }

  async function save() {
    if (dirtyCount === 0) return
    if (!adminKey) {
      const k = prompt('ใส่ Admin Key (จาก MARVEL_ADMIN_KEY ใน .env.local):') || ''
      if (!k) return
      localStorage.setItem(KEY_LS, k)
      setAdminKey(k)
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/marvel-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || localStorage.getItem(KEY_LS) || '' },
        body: JSON.stringify({ updates: dirty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'save failed')
      // merge into prices, clear drafts
      setPrices((p) => {
        const np = { ...p }
        for (const [id, v] of Object.entries(dirty)) {
          if (v == null) delete np[id]
          else np[id] = Math.round(v)
        }
        return np
      })
      setDrafts({})
      setMsg({ ok: true, text: `บันทึกแล้ว ${data.count} รายการ` })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  // ---- login gate ----
  if (authed === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 grid place-items-center text-muted">กำลังโหลด…</div>
      </div>
    )
  }
  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 grid place-items-center px-4 py-16">
          <form onSubmit={doLogin} className="mv-panel rounded-2xl p-8 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h1 className="font-display text-2xl font-extrabold text-hero mb-1">เข้าสู่ระบบแอดมิน</h1>
            <p className="text-sm text-muted mb-6">ใส่รหัสผ่านเพื่อจัดการราคากลาง</p>
            <input
              type="password"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="รหัสผ่านแอดมิน"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-line text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60 mb-3"
            />
            {loginError && <p className="text-sm text-marvel-bright mb-3">{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn || !loginInput}
              className={`w-full py-2.5 rounded-xl font-bold text-sm ${loggingIn || !loginInput ? 'btn-ghost opacity-50 cursor-not-allowed' : 'btn-primary'}`}
            >
              {loggingIn ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-2">
          <button onClick={logout} className="text-xs font-semibold text-muted hover:text-marvel-bright transition-colors">
            ออกจากระบบ ✕
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="section-eyebrow mb-2">🛡️ Admin · Official Pricing</div>
          <h1 className="section-title neon-title text-3xl sm:text-4xl font-extrabold">ตั้งราคากลาง</h1>
          <p className="text-sm text-muted mt-2">Marvel Hero Rush · ราคาหน่วยเป็นบาท</p>

          {/* progress */}
          <div className="max-w-md mx-auto mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted">ตั้งราคาแล้ว</span>
              <span className="text-hero font-bold">
                <span className="text-gold-bright">{pricedCount}</span> / {marvelCards.length} ใบ
                <span className="text-faint font-normal ml-1">({Math.round((pricedCount / marvelCards.length) * 100)}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface border border-line overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pricedCount / marvelCards.length) * 100}%`, background: 'linear-gradient(90deg, var(--color-marvel), var(--color-gold-bright))' }}
              />
            </div>
          </div>
        </div>

        {/* toolbar */}
        <div className="mv-panel rounded-2xl p-4 mb-5 sticky top-[68px] z-30">
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ / เลขการ์ด"
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60"
            />
            <select value={series} onChange={(e) => setSeries(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm text-body">
              <option value="all">ทุกเซ็ต</option>
              {marvelSets.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
            </select>
            <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm text-body">
              <option value="all">ทุกเรต</option>
              {RARITY_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-body px-2 whitespace-nowrap">
              <input type="checkbox" checked={onlyUnpriced} onChange={(e) => setOnlyUnpriced(e.target.checked)} />
              เฉพาะที่ยังไม่ตั้งราคา
            </label>
          </div>

          {/* bulk by rarity */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-line/60">
            <span className="text-xs text-muted">ตั้งราคาทีละเรต (เฉพาะที่กรองอยู่):</span>
            <select value={bulkRarity} onChange={(e) => setBulkRarity(e.target.value)} className="px-2 py-1.5 rounded-lg bg-surface border border-line text-sm text-body">
              {RARITY_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              type="number" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="ราคา"
              className="w-28 px-2 py-1.5 rounded-lg bg-surface border border-line text-sm text-hero"
            />
            <button onClick={applyBulk} className="px-3 py-1.5 rounded-lg btn-ghost text-xs font-semibold">ใส่ให้ทุกใบ</button>
          </div>
        </div>

        {/* save bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted">แสดง {filtered.length} ใบ</p>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-xs font-semibold ${msg.ok ? 'text-attr-green' : 'text-marvel-bright'}`}>{msg.text}</span>}
            <button
              onClick={save}
              disabled={dirtyCount === 0 || saving}
              className={`px-5 py-2 rounded-xl text-sm font-bold ${dirtyCount === 0 || saving ? 'btn-ghost opacity-50 cursor-not-allowed' : 'btn-primary'}`}
            >
              {saving ? 'กำลังบันทึก…' : `บันทึก${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted">กำลังโหลด…</div>
        ) : (
          <div className="mv-panel rounded-2xl overflow-hidden divide-y divide-line/50">
            {filtered.map((c) => {
              const draft = drafts[c.id]
              const shownVal = draft !== undefined ? draft : (prices[c.id] != null ? String(prices[c.id]) : '')
              const isDirty = dirty[c.id] !== undefined
              const rar = RARITY_META[c.rarity]
              return (
                <div key={c.id} className={`flex items-center gap-3 px-3 py-2 ${isDirty ? 'bg-cosmic/5' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="w-9 h-12 object-cover rounded-md border border-line shrink-0" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-hero truncate">{cleanMarvelName(c.name)}</div>
                    <div className="flex items-center gap-2 text-[11px] text-faint">
                      <span>{c.cardNo}</span>
                      <span className={`rarity-chip px-1 rounded border text-[10px] ${rar?.cls || ''}`}>{c.rarity}</span>
                      {c.attribute && <span className={`w-2 h-2 rounded-full ${ATTR_META[c.attribute]?.dot}`} />}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-faint">฿</span>
                      <input
                        type="number" inputMode="numeric" min={0}
                        value={shownVal}
                        onChange={(e) => setDraft(c.id, e.target.value)}
                        placeholder="—"
                        className={`w-28 pl-6 pr-2 py-1.5 rounded-lg bg-surface border text-sm text-right text-hero focus:outline-none ${isDirty ? 'border-cosmic/60' : 'border-line'}`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="text-center py-12 text-muted">ไม่พบการ์ด</div>}
          </div>
        )}
      </div>
    </div>
  )
}
