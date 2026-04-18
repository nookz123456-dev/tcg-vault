'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import { useAuth } from '@/lib/useAuth'
import { useT, useLocale } from '@/lib/i18n'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const THAI_PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น',
  'จันทบุรี', 'ฉะเชิงเทรา', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่',
  'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา',
  'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบฯ',
  'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง',
  'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม',
  'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
  'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'สระแก้ว', 'สระบุรี',
  'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
  'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุทัยธานี', 'อุบลราชธานี',
  'อุตรดิตถ์',
]

export default function SellerApplyPage() {
  const { user } = useAuth()
  const t = useT()
  const { locale } = useLocale()
  const isThai = locale === 'th'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingStatus, setExistingStatus] = useState<string | null>(null)

  const [form, setForm] = useState({
    real_name: '', date_of_birth: '', national_id: '', phone: '',
    address: '', district: '', city: '', province: '', postal_code: '',
    id_card_image_url: '', selfie_with_id_url: '',
    shop_name: '', shop_description: '', line_id: '',
  })

  useState(() => {
    if (!user) return
    fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${user.id}&select=status`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${user.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (data.length > 0) setExistingStatus(data[0].status) })
      .catch(() => {})
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit'); return }
      setSuccess(isThai ? 'ส่งใบสมัครสำเร็จ! เราจะตรวจสอบและแจ้งผลให้คุณทราบ' : 'Application submitted! We will review and notify you.')
      setExistingStatus('pending')
    } catch { setError(isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error') }
    finally { setLoading(false) }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b8fa6]">{isThai ? 'กรุณาเข้าสู่ระบบก่อนสมัครผู้ขาย' : 'Please sign in to apply as a seller'}</p>
          <a href="/login" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-all">
            {isThai ? 'เข้าสู่ระบบ' : 'Sign In'}
          </a>
        </div>
      </div>
    )
  }

  if (existingStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4 opacity-30">⏳</div>
          <h2 className="text-xl font-bold text-[#1e2235] mb-2">{isThai ? 'รอการตรวจสอบ' : 'Pending Verification'}</h2>
          <p className="text-[#8b8fa6]">{isThai ? 'ใบสมัครของคุณอยู่ระหว่างตรวจสอบ' : 'Your application is being reviewed.'}</p>
        </div>
      </div>
    )
  }

  if (existingStatus === 'verified') {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4 opacity-30">✅</div>
          <h2 className="text-xl font-bold text-[#1e2235] mb-2">{isThai ? 'ผู้ขายที่ผ่านการตรวจสอบ' : 'Verified Seller'}</h2>
          <p className="text-[#8b8fa6]">{isThai ? 'คุณเป็นผู้ขายที่ผ่านการตรวจสอบแล้ว' : 'You are a verified seller.'}</p>
        </div>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] text-sm placeholder:text-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 transition-all"

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1e2235]">{isThai ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}</h1>
          <p className="text-sm text-[#8b8fa6] mt-1">
            {isThai ? 'กรอกข้อมูลเพื่อยืนยันตัวตน เราตรวจสอบเพื่อความปลอดภัยของลูกค้า' : 'Verify your identity to start selling. We verify for buyer safety.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#8b8fa6] uppercase tracking-wider mb-4">{isThai ? 'ข้อมูลประจำตัว' : 'Identity'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'ชื่อ-นามสกุลจริง' : 'Full Legal Name'} *</label>
                <input type="text" value={form.real_name} onChange={e => handleChange('real_name', e.target.value)} required className={inputClass} placeholder={isThai ? 'ชื่อ นามสกุล ตามบัตรประชาชน' : 'Name as shown on ID card'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'วันเดือนปีเกิด' : 'Date of Birth'} *</label>
                  <input type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'เลขบัตรประชาชน' : 'National ID'} *</label>
                  <input type="text" value={form.national_id} onChange={e => handleChange('national_id', e.target.value.replace(/\D/g, '').slice(0, 13))} required maxLength={13} className={inputClass} placeholder="X XXXX XXXXX XX X" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#8b8fa6] uppercase tracking-wider mb-4">{isThai ? 'ข้อมูลติดต่อ' : 'Contact'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'เบอร์โทรศัพท์' : 'Phone'} *</label>
                <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} required className={inputClass} placeholder="08X-XXX-XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'ที่อยู่' : 'Address'} *</label>
                <input type="text" value={form.address} onChange={e => handleChange('address', e.target.value)} required className={inputClass} placeholder={isThai ? 'บ้านเลขที่ ซอย ถนน' : 'House number, Soi, Road'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'ตำบล/แขวง' : 'District'} *</label>
                  <input type="text" value={form.district} onChange={e => handleChange('district', e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'อำเภอ/เขต' : 'City'} *</label>
                  <input type="text" value={form.city} onChange={e => handleChange('city', e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'จังหวัด' : 'Province'} *</label>
                  <select value={form.province} onChange={e => handleChange('province', e.target.value)} required className={inputClass}>
                    <option value="">{isThai ? '-- เลือกจังหวัด --' : '-- Select --'}</option>
                    {THAI_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'รหัสไปรษณีย์' : 'Postal Code'} *</label>
                  <input type="text" value={form.postal_code} onChange={e => handleChange('postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))} required maxLength={5} className={inputClass} placeholder="XXXXX" />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Docs */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#8b8fa6] uppercase tracking-wider mb-4">{isThai ? 'เอกสารยืนยันตัวตน' : 'Verification Documents'}</h2>
            <p className="text-xs text-[#8b8fa6] mb-4">
              {isThai ? 'อัปโหลดรูปบัตรประชาชนและรูปถ่ายคู่บัตร' : 'Upload your ID card photo and selfie with ID.'}
            </p>
            <div className="space-y-4">
              <ImageUpload value={form.id_card_image_url} onChange={url => handleChange('id_card_image_url', url)} label={isThai ? 'รูปบัตรประชาชน' : 'ID Card Photo'} placeholder={isThai ? 'อัปโหลดรูปบัตร' : 'Upload ID photo'} folder="seller-docs" required />
              <ImageUpload value={form.selfie_with_id_url} onChange={url => handleChange('selfie_with_id_url', url)} label={isThai ? 'รูปถ่ายคู่บัตร' : 'Selfie with ID'} placeholder={isThai ? 'อัปโหลดรูปถ่ายคู่บัตร' : 'Upload selfie'} folder="seller-docs" required />
            </div>
          </div>

          {/* Shop Info */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#8b8fa6] uppercase tracking-wider mb-1">{isThai ? 'ข้อมูลร้านค้า' : 'Shop Info'} <span className="text-[#b5b8c8] normal-case font-normal">({isThai ? 'ไม่จำเป็น' : 'Optional'})</span></h2>
            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'ชื่อร้าน' : 'Shop Name'}</label>
                <input type="text" value={form.shop_name} onChange={e => handleChange('shop_name', e.target.value)} className={inputClass} placeholder={isThai ? 'ชื่อร้านค้า' : 'Your shop name'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">{isThai ? 'รายละเอียด' : 'Description'}</label>
                <textarea value={form.shop_description} onChange={e => handleChange('shop_description', e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder={isThai ? 'เกี่ยวกับร้านค้าของคุณ...' : 'About your shop...'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">LINE ID</label>
                <input type="text" value={form.line_id} onChange={e => handleChange('line_id', e.target.value)} className={inputClass} placeholder="@line_id" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-40">
            {loading ? (isThai ? 'กำลังส่ง...' : 'Submitting...') : (isThai ? 'ส่งใบสมัคร' : 'Submit Application')}
          </button>
        </form>
      </div>
    </div>
  )
}