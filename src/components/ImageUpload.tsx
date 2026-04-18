'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label: string
  placeholder?: string
  folder: 'seller-docs' | 'discussion-images'
  required?: boolean
}

export default function ImageUpload({ value, onChange, label, placeholder, folder, required }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, GIF, WebP')
      return
    }

    setUploading(true)

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      // Get session token
      const sessionStr = localStorage.getItem('tcg-vault-session')
      if (!sessionStr) {
        alert('Please sign in to upload images')
        setUploading(false)
        return
      }
      const session = JSON.parse(sessionStr)
      const token = session.access_token

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        onChange(data.url)
        setPreview(data.url)
      } else {
        alert(data.error || 'Upload failed')
        setPreview(value)
      }
    } catch {
      alert('Upload failed. Please try again.')
      setPreview(value)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) uploadFile(file)
        break
      }
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#5c6078] mb-1">
        {label} {required && '*'}
      </label>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
          dragOver
            ? 'border-[#6366f1] bg-[#6366f1]/5'
            : preview
              ? 'border-[#6366f1]/30 bg-[#f5f6fa]'
              : 'border-[#e8eaf0] bg-[#f5f6fa] hover:border-[#6366f1]/50'
        }`}
      >
        {preview ? (
          <div className="p-3">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded-lg"
            />
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-emerald-500 font-medium">✓ Uploaded</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                  setPreview('')
                }}
                className="text-xs text-red-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 px-4 text-center">
            <div className="text-3xl mb-2">{uploading ? '⏳' : '📁'}</div>
            <p className="text-sm font-medium text-[#5c6078]">
              {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-[#b5b8c8] mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#5c6078] mt-2">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Alternative: paste URL */}
      <div className="mt-2">
        <details className="text-xs text-[#8b8fa6]">
          <summary className="cursor-pointer hover:text-[#5c6078]">
            {placeholder ? 'Paste image URL instead' : 'Or paste image URL'}
          </summary>
          <input
            type="url"
            value={value && !value.startsWith('data:') ? value : ''}
            onChange={(e) => {
              onChange(e.target.value)
              setPreview(e.target.value)
            }}
            className="w-full mt-1 px-3 py-1.5 bg-white border border-[#e8eaf0] rounded-lg text-[#1e2235] placeholder-[#b5b8c8] text-xs focus:outline-none focus:border-[#6366f1]/50"
            placeholder="https://example.com/image.jpg"
          />
        </details>
      </div>
    </div>
  )
}