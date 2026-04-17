'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
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
    real_name: '',
    date_of_birth: '',
    national_id: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    province: '',
    postal_code: '',
    id_card_image_url: '',
    selfie_with_id_url: '',
    shop_name: '',
    shop_description: '',
    line_id: '',
  })

  // Check existing application on mount
  useState(() => {
    if (!user) return
    fetch(`${SUPABASE_URL}/rest/v1/seller_profiles?id=eq.${user.id}&select=status`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${user.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) setExistingStatus(data[0].status)
      })
      .catch(() => {})
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || (isThai ? 'ส่งใบสมัครไม่สำเร็จ' : 'Failed to submit application'))
        return
      }

      setSuccess(isThai ? 'ส่งใบสมัครสำเร็จ! เราจะตรวจสอบและแจ้งผลให้คุณทราบ' : 'Application submitted! We will review and notify you.')
      setExistingStatus('pending')
    } catch {
      setError(isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b8fa6]">{isThai ? 'กรุณาเข้าสู่ระบบก่อนสมัครผู้ขาย' : 'Please sign in to apply as a seller'}</p>
          <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">
            {isThai ? 'เข้าสู่ระบบ' : 'Sign In'}
          </a>
        </div>
      </div>
    )
  }

  if (existingStatus === 'pending') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-[#1e2235] mb-2">
            {isThai ? 'รอการตรวจสอบ' : 'Pending Verification'}
          </h2>
          <p className="text-[#8b8fa6]">
            {isThai ? 'ใบสมัครของคุณอยู่ระหว่างตรวจสอบ เราจะแจ้งผลให้ทราบ' : "Your application is being reviewed. We'll notify you once verified."}
          </p>
          <a href="/community" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">
            {isThai ? 'กลับหน้าชุมชน' : 'Back to Community'}
          </a>
        </div>
      </div>
    )
  }

  if (existingStatus === 'verified') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#1e2235] mb-2">
            {isThai ? 'ผู้ขายที่ผ่านการตรวจสอบแล้ว' : 'Verified Seller'}
          </h2>
          <p className="text-[#8b8fa6]">
            {isThai ? 'คุณเป็นผู้ขายที่ผ่านการตรวจสอบแล้ว สามารถลงขายการ์ดได้เลย' : 'You are a verified seller. You can now list cards for sale.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#1e2235]">
            🏪 {isThai ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}
          </h1>
          <p className="text-sm text-[#8b8fa6] mt-1">
            {isThai
              ? 'กรอกข้อมูลเพื่อยืนยันตัวตน เราตรวจสอบเพื่อความปลอดภัยของลูกค้า'
              : 'Verify your identity to start selling. We verify for buyer safety.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Section */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
            <h2 className="text-lg font-bold text-[#1e2235] mb-4 flex items-center gap-2">
              🪪 {isThai ? 'ข้อมูลประจำตัว' : 'Identity Information'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'ชื่อ-นามสกุลจริง' : 'Full Legal Name'} *
                </label>
                <input
                  type="text"
                  value={form.real_name}
                  onChange={e => handleChange('real_name', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={isThai ? 'ชื่อ นามสกุล ตามบัตรประชาชน' : 'Name as shown on ID card'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">
                    {isThai ? 'วันเดือนปีเกิด' : 'Date of Birth'} *
                  </label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => handleChange('date_of_birth', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">
                    {isThai ? 'เลขบัตรประชาชน' : 'National ID'} *
                  </label>
                  <input
                    type="text"
                    value={form.national_id}
                    onChange={e => handleChange('national_id', e.target.value.replace(/\D/g, '').slice(0, 13))}
                    required
                    maxLength={13}
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    placeholder="X XXXX XXXXX XX X"
                  />
                  <p className="text-[10px] text-[#8b8fa6] mt-1">{isThai ? '13 หลัก ตามบัตรประชาชน' : '13 digits as on ID card'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
            <h2 className="text-lg font-bold text-[#1e2235] mb-4 flex items-center gap-2">
              📞 {isThai ? 'ข้อมูลติดต่อ' : 'Contact Information'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'เบอร์โทรศัพท์' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder="08X-XXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'ที่อยู่' : 'Address'} *
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={isThai ? 'บ้านเลขที่ ซอย ถนน' : 'House number, Soi, Road'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">
                    {isThai ? 'ตำบล/แขวง' : 'District'} *
                  </label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={e => handleChange('district', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">
                    {isThai ? 'อำเภอ/เขต' : 'City'} *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => handleChange('city', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">
                    {isThai ? 'จังหวัด' : 'Province'} *
                  </label>
                  <select
                    value={form.province}
                    onChange={e => handleChange('province', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  >
                    <option value="">{isThai ? '-- เลือกจังหวัด --' : '-- Select Province --'}</option>
                    {THAI_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6078] mb-1">
                    {isThai ? 'รหัสไปรษณีย์' : 'Postal Code'} *
                  </label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={e => handleChange('postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))}
                    required
                    maxLength={5}
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    placeholder="XXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
            <h2 className="text-lg font-bold text-[#1e2235] mb-4 flex items-center gap-2">
              📷 {isThai ? 'เอกสารยืนยันตัวตน' : 'Verification Documents'}
            </h2>
            <p className="text-xs text-[#8b8fa6] mb-3">
              {isThai
                ? 'อัปโหลดรูปบัตรประชาชนและรูปถ่ายคู่บัตร เพื่อยืนยันตัวตน (ข้อมูลจะถูกเก็บอย่างปลอดภัย)'
                : 'Upload your ID card photo and a selfie with your ID. Data is stored securely.'}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'รูปบัตรประชาชน' : 'ID Card Photo'} *
                </label>
                <input
                  type="url"
                  value={form.id_card_image_url}
                  onChange={e => handleChange('id_card_image_url', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={isThai ? 'วางลิงก์รูปบัตรประชาชน' : 'Paste ID card image URL'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'รูปถ่ายคู่บัตรประชาชน' : 'Selfie with ID'} *
                </label>
                <input
                  type="url"
                  value={form.selfie_with_id_url}
                  onChange={e => handleChange('selfie_with_id_url', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={isThai ? 'วางลิงก์รูปถ่ายคู่บัตร' : 'Paste selfie with ID URL'}
                />
              </div>
            </div>
          </div>

          {/* Shop Info (Optional) */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
            <h2 className="text-lg font-bold text-[#1e2235] mb-4 flex items-center gap-2">
              🏪 {isThai ? 'ข้อมูลร้านค้า' : 'Shop Information'} 
              <span className="text-xs font-normal text-[#8b8fa6]">({isThai ? 'ไม่จำเป็น' : 'Optional'})</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'ชื่อร้าน' : 'Shop Name'}
                </label>
                <input
                  type="text"
                  value={form.shop_name}
                  onChange={e => handleChange('shop_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder={isThai ? 'ชื่อร้านค้าของคุณ' : 'Your shop name'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  {isThai ? 'รายละเอียดร้าน' : 'Shop Description'}
                </label>
                <textarea
                  value={form.shop_description}
                  onChange={e => handleChange('shop_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 resize-none"
                  placeholder={isThai ? 'บอกเกี่ยวกับร้านค้าของคุณ...' : 'Tell us about your shop...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5c6078] mb-1">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={form.line_id}
                  onChange={e => handleChange('line_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  placeholder="@line_id"
                />
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
            <p className="font-semibold mb-1">🔒 {isThai ? 'ข้อมูลส่วนบุคคล' : 'Privacy Notice'}</p>
            <p className="text-xs">
              {isThai
                ? 'ข้อมูลส่วนบุคคลของคุณจะถูกเก็บอย่างปลอดภัย ใช้เฉพาะการยืนยันตัวตนผู้ขายเท่านั้น จะไม่เปิดเผยต่อผู้ซื้อ ยกเว้นชื่อร้านและ LINE ID ที่คุณเลือกแสดง'
                : 'Your personal data is stored securely and used only for seller verification. It will not be shared with buyers except your shop name and LINE ID.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6366f1]/25"
          >
            {loading
              ? (isThai ? 'กำลังส่ง...' : 'Submitting...')
              : (isThai ? 'ส่งใบสมัครผู้ขาย' : 'Submit Seller Application')}
          </button>
        </form>
      </div>
    </div>
  )
}