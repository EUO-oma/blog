import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-music',
  icons: {
    icon: '/page-icons/music.svg',
    apple: '/page-icons/music.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
