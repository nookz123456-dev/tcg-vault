'use client'

import { useState } from 'react'

// Share the current card: uses the native Web Share sheet when available
// (mobile), otherwise copies the link to the clipboard with feedback.
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={onShare}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl btn-ghost text-sm font-semibold"
      title="แชร์การ์ดนี้"
    >
      {copied ? (
        <>✓ คัดลอกลิงก์แล้ว</>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          แชร์
        </>
      )}
    </button>
  )
}
