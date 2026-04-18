'use client'
import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

export function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    QRCodeLib.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#1a1d1a', light: '#ffffff' },
    })
  }, [value, size])
  return <canvas ref={ref} />
}
