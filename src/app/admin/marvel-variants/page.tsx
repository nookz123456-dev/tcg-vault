'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { marvelCards, RARITY_ORDER, RARITY_META, cleanMarvelName, type MarvelCard } from '@/lib/marvel'

const KEY_LS = 'vaultverse_admin_key'

interface Override { id?: string; cardNo: string; rarity: string }

export default function AdminVariants() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loginInput, setLoginInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [adminKey, setAdminKey] = useState('')

  const [cards, setCards] = useState<MarvelCard[]>(marvelCards)
  const [overrides, setOverrides] = useState<Override[]>([])
  const [q, setQ] = useState('')
  const [rarity, setRarity] = useState('SEC')
  const [selectedId, setSelectedId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const verify = (key: string) =>
    fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) }).then((r) => r.ok)

  useEffect(() => {
    const stored = localStorage.getItem(KEY_LS) || ''
    setAdminKey(stored)
    verify(stored).then(setAuthed).catch(() => setAuthed(false))
    fetch('/api/marvel/cards').then((r) => r.json()).then((d) => { if (Array.isArray(d.cards) && d.cards.length) setCards(d.cards) }).catch(() => {})
    fetch('/api/admin/marvel-variants').then((r) => r.json()).then((d) => setOverrides(d.variants || [])).catch(() => {})
  }, [])

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setLoggingIn(true); setLoginError('')
    try {
      if (await verify(loginInput)) { localStorage.setItem(KEY_LS, loginInput); setAdminKey(loginInput); setAuthed(true) }
      else setLoginError('รหัสผ่านไม่ถูกต้อง')
    } catch { setLoginError('เชื่อมต่อไม่ได้') } finally { setLoggingIn(false) }
  }

  // search across every individual print (each card id is its own row)
  const matches = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return []
    return marvelCards.filter((c) => c.name.toLowerCase().includes(ql) || c.cardNo.toLowerCase().includes(ql)).slice(0, 12)
  }, [q])

  const origRarityOfId = (id: string) => marvelCards.find((c) => c.id === id)?.rarity
  const currentRarityOfId = (id: string) => cards.find((c) => c.id === id)?.rarity ?? origRarityOfId(id)

  async function mutate(action: 'add' | 'remove', o: { id?: string; cardNo: string; rarity?: string }) {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/marvel-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || localStorage.getItem(KEY_LS) || '' },
        body: JSON.stringify({ action, id: o.id, cardNo: o.cardNo, rarity: o.rarity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ผิดพลาด')
      setOverrides(data.variants || [])
      fetch('/api/marvel/cards').then((r) => r.json()).then((d) => { if (Array.isArray(d.cards)) setCards(d.cards) })
      setMsg({ ok: true, text: action === 'add' ? `ย้าย ${o.cardNo} ไปเรต ${o.rarity} แล้ว` : `คืน ${o.cardNo} กลับเรตเดิมแล้ว` })
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }) } finally { setBusy(false) }
  }

  const selCard = marvelCards.find((c) => c.id === selectedId)
  const selCurrent = selCard ? currentRarityOfId(selCard.id) : undefined
  const numPrints = selCard ? marvelCards.filter((c) => c.cardNo === selCard.cardNo).length : 0

  if (authed === null) return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 grid place-items-center text-muted">กำลังโหลด…</div></div>
  if (!authed) return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <form onSubmit={doLogin} className="mv-panel rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="font-display text-2xl font-extrabold text-hero mb-1">เข้าสู่ระบบแอดมิน</h1>
          <p className="text-sm text-muted mb-6">ย้ายเรตการ์ด</p>
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
          <div className="section-eyebrow mb-2">🛡️ Admin · Card Rarity</div>
          <h1 className="section-title neon-title text-3xl sm:text-4xl font-extrabold">ย้ายเรตการ์ด</h1>
          <p className="text-sm text-muted mt-2">เปลี่ยนเรตของการ์ดให้ไปอยู่เรตไหนก็ได้ — <b className="text-body">แก้เรตของใบเดิม ไม่สร้างการ์ดซ้ำ</b></p>
        </div>

        {msg && <div className={`text-center text-sm font-semibold mb-4 ${msg.ok ? 'text-attr-green' : 'text-marvel-bright'}`}>{msg.text}</div>}

        {/* move */}
        <div className="mv-panel rounded-2xl p-5 mb-6">
          <div className="text-sm font-bold text-hero mb-3">เลือกการ์ดที่จะย้ายเรต</div>
          <input value={q} onChange={(e) => { setQ(e.target.value); setSelectedId('') }} placeholder="ค้นหาการ์ด (ชื่อ / เลขการ์ด เช่น BP01-121)"
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60" />
          {matches.length > 0 && !selCard && (
            <div className="mt-2 space-y-1">
              {matches.map((c) => {
                const cur = currentRarityOfId(c.id)
                return (
                  <button key={c.id} onClick={() => { setSelectedId(c.id); setQ(`${c.cardNo} ${cleanMarvelName(c.name)}`); setRarity(cur || 'SEC') }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="w-8 h-11 object-cover rounded border border-line" loading="lazy" />
                    <span className="text-sm text-body flex-1 truncate">{cleanMarvelName(c.name)}</span>
                    <span className={`rarity-chip text-[10px] px-1.5 py-0.5 rounded border ${RARITY_META[cur || '']?.cls || ''}`}>{cur}</span>
                    <span className="text-xs text-faint">{c.cardNo}</span>
                  </button>
                )
              })}
            </div>
          )}
          {selCard && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selCard.image} alt="" className="w-12 h-16 object-cover rounded-lg border border-line" />
                <div className="text-sm">
                  <div className="font-semibold text-hero">{cleanMarvelName(selCard.name)} <span className="text-faint">({selCard.cardNo})</span></div>
                  <div className="text-xs text-muted mt-0.5">เรตปัจจุบัน: <span className={`rarity-chip text-[10px] px-1.5 py-0.5 rounded border ${RARITY_META[selCurrent || '']?.cls || ''}`}>{selCurrent}</span></div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-faint">ย้ายไป →</span>
                  <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm text-body">
                    {RARITY_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    disabled={busy || rarity === selCurrent}
                    onClick={() => mutate('add', { id: selCard.id, cardNo: selCard.cardNo, rarity })}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${busy || rarity === selCurrent ? 'btn-ghost opacity-50' : 'btn-primary'}`}
                  >{rarity === selCurrent ? 'เรตนี้อยู่แล้ว' : 'ย้ายเรต'}</button>
                </div>
              </div>
              {numPrints > 1 && (
                <p className="text-[11px] text-faint mt-2">การ์ดเลขนี้มี {numPrints} เวอร์ชัน — ย้ายเฉพาะใบที่เลือก (เรต {origRarityOfId(selCard.id)}) เท่านั้น</p>
              )}
              <button onClick={() => { setSelectedId(''); setQ('') }} className="text-[11px] text-cosmic hover:text-cosmic-cyan mt-2">← เลือกการ์ดอื่น</button>
            </div>
          )}
        </div>

        {/* current overrides */}
        <div className="mv-panel rounded-2xl p-5">
          <div className="text-sm font-bold text-hero mb-3">การ์ดที่ย้ายเรตแล้ว ({overrides.length})</div>
          {overrides.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มี — ค้นหาการ์ดด้านบนแล้วเลือกเรตใหม่</p>
          ) : (
            <div className="space-y-2">
              {overrides.map((v) => {
                const base = (v.id && marvelCards.find((c) => c.id === v.id)) || marvelCards.find((c) => c.cardNo === v.cardNo)
                const orig = base?.rarity
                const rar = RARITY_META[v.rarity]
                const origMeta = RARITY_META[orig || '']
                return (
                  <div key={v.id || v.cardNo} className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-white/5">
                    {base && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={base.image} alt="" className="w-8 h-11 object-cover rounded border border-line" loading="lazy" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-hero truncate">{base ? cleanMarvelName(base.name) : v.cardNo}</div>
                      <div className="text-[11px] text-faint">{v.cardNo}</div>
                    </div>
                    <span className={`rarity-chip text-[11px] px-2 py-0.5 rounded border opacity-70 line-through ${origMeta?.cls || ''}`}>{orig}</span>
                    <span className="text-faint text-xs">→</span>
                    <span className={`rarity-chip text-[11px] px-2 py-0.5 rounded border ${rar?.cls || ''}`}>{v.rarity}</span>
                    <button onClick={() => mutate('remove', { id: v.id, cardNo: v.cardNo })} disabled={busy} className="text-xs font-semibold text-muted hover:text-marvel-bright px-2">คืนค่าเดิม</button>
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
