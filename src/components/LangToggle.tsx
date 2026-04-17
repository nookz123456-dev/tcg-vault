'use client'

import { useLocale } from '@/lib/i18n'

export function LangToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
      className="px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#6366f1]/5 transition-colors border border-[#e8eaf0]"
      title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
    >
      {locale === 'th' ? 'EN' : 'ไทย'}
    </button>
  )
}