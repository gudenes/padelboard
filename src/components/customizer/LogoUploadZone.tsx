// src/components/customizer/LogoUploadZone.tsx — drag-drop logo upload.
'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

export function LogoUploadZone({
  logoUrl, onUpload, uploading,
}: {
  logoUrl?: string
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }
    await onUpload(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
      }}
      className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-white mb-5 transition ${
        dragging ? 'border-[var(--color-lime)] bg-[var(--color-lime-tint)]' : 'border-[var(--color-border-strong)]'
      }`}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-lg bg-[var(--color-bg)]" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#0a3d91] to-[#ffcf2e] flex items-center justify-center text-white text-[20px] font-extrabold">
          ?
        </div>
      )}
      <div className="flex-1">
        <strong className="block text-[13px] font-semibold mb-0.5">
          {logoUrl ? 'Tournament logo' : 'Upload a tournament logo'}
        </strong>
        <small className="block text-[11.5px] text-[var(--color-muted)] leading-snug">
          {uploading
            ? 'Uploading…'
            : 'PNG / JPG / WebP / SVG, max 2MB. Drag a file here or click the button.'}
        </small>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
      />
      <Button
        variant="ghost"
        className="text-[12px] px-3.5 py-2"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {logoUrl ? 'Change' : 'Choose file'}
      </Button>
    </div>
  )
}
