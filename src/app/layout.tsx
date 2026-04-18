import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Padelboard — Free padel scoreboard for streamers',
  description:
    'Free-forever streaming scoreboard for padel matches. OBS browser-source overlay with golden point, super-tiebreak, and phone-based control.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
