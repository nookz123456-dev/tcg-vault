'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  marvelCards, marvelSets, RARITY_ORDER, RARITY_META, ATTR_META, ATTRIBUTES,
  cleanMarvelName, formatTHB, type MarvelCard,
} from '@/lib/marvel'

const KEY_LS = 'vaultverse_admin_key'

export default function AdminMarvelPrices() {
  const [cards, setCards] = useState<MarvelCard[]>(marvelCards)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({}) // id -> raw input
  const [adminKey, setAdminKey] = useState('')
  const [q, setQ] = useState('')
  const [series, setSeries] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [cardType, setCardType] = useState('all')
  const [sort, setSort] = useState('default')
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

  // multi-select helper (pick specific cards, price them together)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [multiValue, setMultiValue] = useState('')

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
    // merged card list (base + admin variants) so variants are priceable too
    fetch('/api/marvel/cards')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.cards) && d.cards.length) setCards(d.cards) })
      .catch(() => {})
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
    const list = cards.filter((c) => {
      if (series !== 'all' && c.series !== series) return false
      if (rarity !== 'all' && c.rarity !== rarity) return false
      if (cardType !== 'all' && c.cardType !== cardType) return false
      if (onlyUnpriced && prices[c.id] != null && drafts[c.id] === undefined) return false
      if (ql && !c.name.toLowerCase().includes(ql) && !c.cardNo.toLowerCase().includes(ql)) return false
      return true
    })
    const rIdx = (r: string) => RARITY_ORDER.indexOf(r as typeof RARITY_ORDER[number])
    const priceOf = (id: string) => (prices[id] ?? -1)
    const sorted = [...list]
    if (sort === 'price-desc') sorted.sort((a, b) => priceOf(b.id) - priceOf(a.id))
    else if (sort === 'price-asc') sorted.sort((a, b) => priceOf(a.id) - priceOf(b.id))
    else if (sort === 'rarity-desc') sorted.sort((a, b) => rIdx(b.rarity) - rIdx(a.rarity) || a.cardNo.localeCompare(b.cardNo))
    else if (sort === 'name') sorted.sort((a, b) => cleanMarvelName(a.name).localeCompare(cleanMarvelName(b.name)))
    // default keeps source order (series → cardNo)
    return sorted
  }, [q, series, rarity, cardType, sort, onlyUnpriced, prices, drafts])

  const pricedCount = Object.keys(prices).length

  // per-rarity coverage + value stats (over the whole card set, not the filter)
  const rarityStats = useMemo(() => {
    const m: Record<string, { total: number; priced: number }> = {}
    for (const c of cards) {
      const s = (m[c.rarity] ||= { total: 0, priced: 0 })
      s.total++
      if (prices[c.id] != null) s.priced++
    }
    return m
  }, [cards, prices])

  const valueStats = useMemo(() => {
    const vals = cards.map((c) => prices[c.id]).filter((v): v is number => v != null)
    if (!vals.length) return { avg: 0, max: 0, sum: 0 }
    const sum = vals.reduce((a, b) => a + b, 0)
    return { avg: Math.round(sum / vals.length), max: Math.max(...vals), sum }
  }, [cards, prices])

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

  // ---- multi-select ----
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  function selectAllFiltered() {
    setSelected(new Set(filtered.map((c) => c.id)))
  }
  function clearSelect() {
    setSelected(new Set())
  }
  function applyMulti() {
    if (multiValue === '' || selected.size === 0) return
    const next: Record<string, string> = { ...drafts }
    for (const id of selected) next[id] = multiValue
    setDrafts(next)
  }
  function exitSelectMode() {
    setSelectMode(false)
    clearSelect()
    setMultiValue('')
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
        <div className="flex items-center justify-between mb-2 text-xs">
          <Link href="/admin/marvel-variants" className="text-cosmic hover:text-cosmic-cyan font-semibold">จัดการเรตการ์ด →</Link>
          <button onClick={logout} className="font-semibold text-muted hover:text-marvel-bright transition-colors">
            ออกจากระบบ ✕
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="section-eyebrow mb-2">🛡️ Admin · ราคากลาง</div>
          <h1 className="section-title neon-title text-3xl sm:text-4xl font-extrabold">ตั้งราคากลาง</h1>
          <p className="text-sm text-muted mt-2">Marvel Hero Rush · ราคาหน่วยเป็นบาท</p>

          {/* progress */}
          <div className="max-w-md mx-auto mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted">ตั้งราคาแล้ว</span>
              <span className="text-hero font-bold">
                <span className="text-gold-bright">{pricedCount}</span> / {cards.length} ใบ
                <span className="text-faint font-normal ml-1">({Math.round((pricedCount / cards.length) * 100)}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface border border-line overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(pricedCount / cards.length) * 100}%`, background: 'linear-gradient(90deg, var(--color-marvel), var(--color-gold-bright))' }}
              />
            </div>

            {/* value summary */}
            {pricedCount > 0 && (
              <div className="flex items-center justify-center gap-5 mt-4 text-xs">
                <span className="text-muted">เฉลี่ย <b className="text-gold-bright">{formatTHB(valueStats.avg)}</b></span>
                <span className="w-px h-3 bg-line" />
                <span className="text-muted">สูงสุด <b className="text-gold-bright">{formatTHB(valueStats.max)}</b></span>
                <span className="w-px h-3 bg-line" />
                <span className="text-muted">ยังไม่ตั้ง <b className="text-marvel-bright">{cards.length - pricedCount}</b> ใบ</span>
              </div>
            )}
          </div>

          {/* per-rarity coverage — click to filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {RARITY_ORDER.filter((r) => rarityStats[r]).map((r) => {
              const s = rarityStats[r]
              const done = s.priced === s.total
              const active = rarity === r
              return (
                <button
                  key={r}
                  onClick={() => setRarity(active ? 'all' : r)}
                  className={`rarity-chip text-[11px] px-2.5 py-1 rounded-lg border transition-all ${RARITY_META[r]?.cls || ''} ${active ? 'ring-2 ring-cosmic/60' : 'opacity-90 hover:opacity-100'}`}
                  title={`${RARITY_META[r]?.label} · คลิกเพื่อกรอง`}
                >
                  {r} <span className={done ? 'text-attr-green font-bold' : 'text-faint'}>{s.priced}/{s.total}</span>
                </button>
              )
            })}
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
            <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm text-body">
              <option value="all">ทุกชนิด</option>
              <option value="character">ตัวละคร</option>
              <option value="impact">อิมแพ็ค</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-line text-sm text-body">
              <option value="default">เรียง: ตามเซ็ต</option>
              <option value="price-desc">ราคา: มาก→น้อย</option>
              <option value="price-asc">ราคา: น้อย→มาก</option>
              <option value="rarity-desc">เรต: สูง→ต่ำ</option>
              <option value="name">ชื่อ: A→Z</option>
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
            <button
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold ${selectMode ? 'btn-primary' : 'btn-ghost'}`}
            >
              {selectMode ? 'ปิดโหมดเลือก ✕' : '☑ เลือกทีละใบ'}
            </button>
          </div>

          {/* multi-select action bar */}
          {selectMode && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-cosmic/30">
              <span className="text-xs font-bold text-cosmic">เลือกแล้ว {selected.size} ใบ</span>
              <button onClick={selectAllFiltered} className="px-2.5 py-1.5 rounded-lg btn-ghost text-xs font-semibold">เลือกทั้งหมดที่แสดง ({filtered.length})</button>
              <button onClick={clearSelect} disabled={selected.size === 0} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${selected.size === 0 ? 'btn-ghost opacity-50' : 'btn-ghost'}`}>ล้างที่เลือก</button>
              <span className="w-px h-5 bg-line mx-1" />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-faint">฿</span>
                <input
                  type="number" value={multiValue} onChange={(e) => setMultiValue(e.target.value)} placeholder="ราคา"
                  className="w-28 pl-6 pr-2 py-1.5 rounded-lg bg-surface border border-line text-sm text-hero"
                />
              </div>
              <button
                onClick={applyMulti}
                disabled={multiValue === '' || selected.size === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${multiValue === '' || selected.size === 0 ? 'btn-ghost opacity-50' : 'btn-primary'}`}
              >
                ใส่ราคาให้ {selected.size} ใบที่เลือก
              </button>
            </div>
          )}
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
              const cur = prices[c.id]
              const shownVal = draft !== undefined ? draft : (cur != null ? String(cur) : '')
              const isDirty = dirty[c.id] !== undefined
              const rar = RARITY_META[c.rarity]
              const set = marvelSets.find((s) => s.id === c.series)
              const attr = c.attribute ? ATTR_META[c.attribute] : null
              const features = (c.feature || '').split('/').map((f) => f.trim()).filter(Boolean)
              const isChar = c.cardType === 'character'
              const isSelected = selected.has(c.id)
              return (
                <div
                  key={c.id}
                  onClick={selectMode ? () => toggleSelect(c.id) : undefined}
                  className={`flex items-start gap-4 px-4 py-3.5 ${isSelected ? 'bg-cosmic/15' : isDirty ? 'bg-cosmic/5' : ''} ${selectMode ? 'cursor-pointer hover:bg-white/5' : ''}`}
                >
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 shrink-0 accent-cosmic"
                    />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="w-16 h-[5.7rem] object-cover rounded-lg border border-line shrink-0" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    {/* line 1: name + view */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-hero truncate">{cleanMarvelName(c.name)}</span>
                      <Link href={`/card/marvel/${c.id}`} target="_blank" onClick={(e) => e.stopPropagation()} className="text-[11px] text-cosmic hover:text-cosmic-cyan shrink-0">ดู ↗</Link>
                    </div>
                    {/* line 2: identity chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] mt-1.5">
                      <span className="text-faint font-mono">{c.cardNo}</span>
                      {set && <span className="px-1.5 py-0.5 rounded border border-line text-muted">{set.code}</span>}
                      <span className={`rarity-chip px-1.5 py-0.5 rounded border ${rar?.cls || ''}`}>{c.rarity}</span>
                      <span className="px-1.5 py-0.5 rounded border border-line text-muted">{isChar ? 'ตัวละคร' : 'อิมแพ็ค'}</span>
                      {attr && <span className={`px-1.5 py-0.5 rounded border font-semibold ${attr.cls}`}><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${attr.dot}`} />{attr.label}</span>}
                    </div>
                    {/* line 3: character stats + features */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted mt-1.5">
                      {isChar && (
                        <>
                          {c.level != null && <span>Lv <b className="text-body">{c.level}</b></span>}
                          {c.power != null && <span>พลัง <b className="text-body">{c.power.toLocaleString()}</b></span>}
                          {c.attackRange != null && <span>ระยะ <b className="text-body">{c.attackRange}</b></span>}
                        </>
                      )}
                      {features.slice(0, 3).map((f) => (
                        <span key={f} className="px-1.5 py-0.5 rounded bg-cosmic/10 text-cosmic border border-cosmic/25">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">฿</span>
                      <input
                        type="number" inputMode="numeric" min={0}
                        value={shownVal}
                        onChange={(e) => setDraft(c.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="—"
                        className={`w-36 pl-7 pr-3 py-2.5 rounded-lg bg-surface border text-base text-right text-hero focus:outline-none ${isDirty ? 'border-cosmic/60' : 'border-line'}`}
                      />
                    </div>
                    {isDirty ? (
                      <div className="text-[11px] mt-1.5 text-cosmic-cyan font-semibold">
                        {cur != null ? formatTHB(cur) : '—'} → {dirty[c.id] == null ? <span className="text-marvel-bright">ลบราคา</span> : formatTHB(dirty[c.id] as number)}
                      </div>
                    ) : (
                      <div className="text-[11px] mt-1.5 text-faint">{cur != null ? 'ตั้งราคาแล้ว' : 'ยังไม่ตั้ง'}</div>
                    )}
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
