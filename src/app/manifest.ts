import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Motu Seth Restaurant — Feedback & Reviews',
    short_name: 'Motu Seth',
    description: 'Instant QR customer feedback, smart AI reviews & live dining dashboard for Motu Seth Restaurant, Bailey Road, Patna',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#020617',
    theme_color: '#0f172a',
    categories: ['food', 'business', 'productivity', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Diner Feedback Survey',
        short_name: 'Feedback',
        description: 'Open customer survey experience for Motu Seth Restaurant',
        url: '/r/motu-seth',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Restaurant Dashboard',
        short_name: 'Dashboard',
        description: 'View live restaurant feedback, stats & customer contacts',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Guest Responses',
        short_name: 'Responses',
        description: 'See latest customer ratings and drafts',
        url: '/dashboard?tab=responses',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  }
}
