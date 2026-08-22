// Server-side locale access for Server Components.
// Reads the `locale` cookie set by the client LangToggle; defaults to Thai.
import { cookies } from 'next/headers'
import { t, type Locale, type TranslationKey } from './i18n'

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  const v = store.get('locale')?.value
  return v === 'en' ? 'en' : 'th'
}

// Convenience: returns both the locale and a bound translator for a page.
export async function getServerT(): Promise<{ locale: Locale; t: (key: TranslationKey) => string }> {
  const locale = await getServerLocale()
  return { locale, t: (key: TranslationKey) => t(key, locale) }
}
