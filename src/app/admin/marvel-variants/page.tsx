'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { marvelCards, RARITY_ORDER, RARITY_META, cleanMarvelName, type MarvelCard } from '@/lib/marvel'

const KEY_LS = 'vaultverse_admin_key'

interface Variant { cardNo: string; rarity: string }

export default function AdminVariants() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loginInput, setLoginInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [adminKey, setAdminKey] = useState('')

  const [cards, setCards] = useState<MarvelCard[]>(marvelCards)
  const [variants, setVariants] = useState<Variant[]>([])
  const [q, setQ] = useState('')
  const [rarity, setRarity] = useState('SEC')
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const verify = (key: string) =>
    fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) }).then((r) => r.ok)

  useEffect(() => {
    const stored = localStorage.getItem(KEY_LS) || ''
    setAdminKey(stored)
    verify(stored).then(setAuthed).catch(() => setAuthed(false))
    fetch('/api/marvel/cards').then((r) => r.json()).then((d) => { if (Array.isArray(d.cards) && d.cards.length) setCards(d.cards) }).catch(() => {})
    fetch('/api/admin/marvel-variants').then((r) => r.json()).then((d) => setVariants(d.variants || [])).catch(() => {})
  }, [])

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setLoggingIn(true); setLoginError('')
    try {
      if (await verify(loginInput)) { localStorage.setItem(KEY_LS, loginInput); setAdminKey(loginInput); setAuthed(true) }
      else setLoginError('รหัสผ่านไม่ถูกต้อง')
    } catch { setLoginError('เชื่อมต่อไม่ได้') } finally { setLoggingIn(false) }
  }

  // unique base card numbers (from the API base, not variants)
  const baseCards = useMemo(() => {
    const seen = new Map<string, MarvelCard>()
    for (const c of marvelCards) if (!seen.has(c.cardNo)) seen.set(c.cardNo, c)
    return [...seen.values()]
  }, [])

  const matches = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return []
    return baseCards.filter((c) => c.name.toLowerCase().includes(ql) || c.cardNo.toLowerCase().includes(ql)).slice(0, 8)
  }, [q, baseCards])

  const raritiesOf = (cardNo: string) => cards.filter((c) => c.cardNo === cardNo).map((c) => c.rarity)

  async function mutate(action: 'add' | 'remove', cardNo: string, rar: string) {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/marvel-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || localStorage.getItem(KEY_LS) || '' },
        body: JSON.stringify({ action, cardNo, rarity: rar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ผิดพลาด')
      setVariants(data.variants || [])
      // refresh merged cards so the rarity list updates
      fetch('/api/marvel/cards').then((r) => r.json()).then((d) => { if (Array.isArray(d.cards)) setCards(d.cards) })
      setMsg({ ok: true, text: action === 'add' ? `เพิ่ม ${cardNo} · ${rar} แล้ว` : `ลบ ${cardNo} · ${rar} แล้ว` })
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }) } finally { setBusy(false) }
  }

  const selCard = baseCards.find((c) => c.cardNo === selected)

  if (authed === null) return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 grid place-items-center text-muted">กำลังโหลด…</div></div>
  if (!authed) return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <form onSubmit={doLogin} className="mv-panel rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="font-display text-2xl font-extrabold text-hero mb-1">เข้าสู่ระบบแอดมิน</h1>
          <p className="text-sm text-muted mb-6">จัดการเรตการ์ด</p>
          <input type="password" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="รหัสผ่านแอดมิน" autoFocus
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-line text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60 mb-3" />
          {loginError && <p className="text-sm text-marvel-bright mb-3">{loginError}</p>}
          <button type="submit" disabled={loggingIn || !loginInput} className={`w-full py-2.5 rounded-xl font-bold text-sm ${loggingIn || !loginInput ? 'btn-ghost opacity-50' : 'btn-primary'}`}>{loggingIn ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 text-xs">
          <Link href="/admin/marvel-prices" className="text-cosmic hover:text-cosmic-cyan font-semibold">← ตั้งราคากลาง</Link>
          <button onClick={() => { localStorage.removeItem(KEY_LS); setAuthed(false) }} className="text-muted hover:text-marvel-bright font-semibold">ออกจากระบบ ✕</button>
        </div>
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">🛡️ Admin · Card Rarities</div>
          <h1 className="section-title neon-title text-3xl sm:text-4xl font-extrabold">จัดการเรตการ์ด</h1>
          <p className="text-sm text-muted mt-2">เพิ่ม/ลบเวอร์ชันเรตให้การ์ด (เช่น เพิ่ม SEC ให้ RUSH POINT) — เว็บอัปเดตทันที</p>
        </div>

        {msg && <div className={`text-center text-sm font-semibold mb-4 ${msg.ok ? 'text-attr-green' : 'text-marvel-bright'}`}>{msg.text}</div>}

        {/* add */}
        <div className="mv-panel rounded-2xl p-5 mb-6">
          <div className="text-sm font-bold text-hero mb-3">เพิ่มเรตให้การ์ด</div>
          <input value={q} onChange={(e) => { setQ(e.target.value); setSelected('') }} placeholder="ค้นหาการ์ด (ชื่อ / เลขการ์ด เช่น BP01-121)"
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60" />
          {matches.length > 0 && !selCard && (
            <div className="mt-2 space-y-1">
              {matches.map((c) => (
                <button key={c.cardNo} onClick={() => { setSelected(c.cardNo); setQ(`${c.cardNo} ${cleanMarvelName(c.name)}`) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="w-8 h-11 object-cover rounded border border-line" loading="lazy" />
                  <span className="text-sm text-body flex-1 truncate">{cleanMarvelName(c.name)}</span>
                  <span className="text-xs text-faint">{c.cardNo}</span>
                </button>
              ))}
            </div>
          )}
          {selCard && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selCard.image} alt="" className="w-12 h-16 object-cover rounded-lg border border-line" />
              <div className="text-sm">
                <div className="font-semibold text-hero">{cleanMarvelName(selCard.name)} <span className="text-faint">({selCard.cardNo})</span></div>
                <div className="text-xs text-muted mt-0.5">เรตที่มี: {raritiesOf(selCard.cardNo).join(', ')}</div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm text-body">
                  {RARITY_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  disabled={busy || raritiesOf(selCard.cardNo).includes(rarity)}
                  onClick={() => mutate('add', selCard.cardNo, rarity)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${busy || raritiesOf(selCard.cardNo).includes(rarity) ? 'btn-ghost opacity-50' : 'btn-primary'}`}
                >{raritiesOf(selCard.cardNo).includes(rarity) ? 'มีแล้ว' : 'เพิ่มเรต'}</button>
              </div>
            </div>
          )}
        </div>

        {/* current variants */}
        <div className="mv-panel rounded-2xl p-5">
          <div className="text-sm font-bold text-hero mb-3">เรตที่เพิ่มเอง ({variants.length})</div>
          {variants.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มี — ค้นหาการ์ดด้านบนแล้วกด "เพิ่มเรต"</p>
          ) : (
            <div className="space-y-2">
              {variants.map((v) => {
                const base = baseCards.find((c) => c.cardNo === v.cardNo)
                const rar = RARITY_META[v.rarity]
                return (
                  <div key={v.cardNo + v.rarity} className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-white/5">
                    {base && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={base.image} alt="" className="w-8 h-11 object-cover rounded border border-line" loading="lazy" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-hero truncate">{base ? cleanMarvelName(base.name) : v.cardNo}</div>
                      <div className="text-[11px] text-faint">{v.cardNo}</div>
                    </div>
                    <span className={`rarity-chip text-[11px] px-2 py-0.5 rounded border ${rar?.cls || ''}`}>{v.rarity}</span>
                    <button onClick={() => mutate('remove', v.cardNo, v.rarity)} disabled={busy} className="text-xs font-semibold text-muted hover:text-marvel-bright px-2">ลบ</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
