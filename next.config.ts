import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3003', 'padelboard.padellabs.tech'] },
  },
}

export default config
